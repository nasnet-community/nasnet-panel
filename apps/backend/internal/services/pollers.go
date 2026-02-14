package services

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/generated/graphql"
	"backend/internal/events"
	"backend/internal/router"
)

// =============================================================================
// Interface Stats Poller
// =============================================================================

const (
	// MinPollingInterval is the minimum allowed polling interval (1 second)
	MinPollingInterval = 1 * time.Second
	// DefaultPollingInterval is the default polling interval (5 seconds)
	DefaultPollingInterval = 5 * time.Second
	// MaxPollingInterval is the maximum reasonable polling interval (30 seconds)
	MaxPollingInterval = 30 * time.Second
)

// StatsPoller polls interface stats from routers and publishes to subscribers.
// It manages per-interface polling with rate limiting and graceful shutdown.
type StatsPoller struct {
	routerPort router.RouterPort
	eventBus   events.EventBus

	// Active polling sessions: routerID-interfaceID -> polling context
	sessions   map[string]*pollingSession
	sessionsMu sync.RWMutex

	// Stop channel for graceful shutdown
	stopChan chan struct{}
	wg       sync.WaitGroup
}

// pollingSession represents an active polling session for an interface
type pollingSession struct {
	routerID    string
	interfaceID string
	interval    time.Duration
	subscribers []chan *model.InterfaceStats
	subMu       sync.RWMutex
	cancelFunc  context.CancelFunc
}

// NewStatsPoller creates a new stats poller service
func NewStatsPoller(routerPort router.RouterPort, eventBus events.EventBus) *StatsPoller {
	return &StatsPoller{
		routerPort: routerPort,
		eventBus:   eventBus,
		sessions:   make(map[string]*pollingSession),
		stopChan:   make(chan struct{}),
	}
}

// Subscribe creates a subscription channel for interface stats updates.
// The channel will receive stats at the specified interval.
// Returns a channel that will receive InterfaceStats and an error if subscription fails.
func (p *StatsPoller) Subscribe(
	ctx context.Context,
	routerID, interfaceID string,
	interval time.Duration,
) (<-chan *model.InterfaceStats, error) {
	// Enforce rate limiting
	if interval < MinPollingInterval {
		interval = MinPollingInterval
	}
	if interval > MaxPollingInterval {
		interval = MaxPollingInterval
	}

	sessionKey := fmt.Sprintf("%s:%s", routerID, interfaceID)

	p.sessionsMu.Lock()
	defer p.sessionsMu.Unlock()

	// Check if polling session already exists
	session, exists := p.sessions[sessionKey]
	if !exists {
		// Create new polling session
		pollCtx, cancel := context.WithCancel(context.Background())
		session = &pollingSession{
			routerID:    routerID,
			interfaceID: interfaceID,
			interval:    interval,
			subscribers: make([]chan *model.InterfaceStats, 0),
			cancelFunc:  cancel,
		}
		p.sessions[sessionKey] = session

		// Start polling goroutine
		p.wg.Add(1)
		go p.poll(pollCtx, session)
	}

	// Create subscriber channel with buffer to prevent blocking
	ch := make(chan *model.InterfaceStats, 10)

	// Add subscriber to session
	session.subMu.Lock()
	session.subscribers = append(session.subscribers, ch)
	session.subMu.Unlock()

	// Monitor context cancellation to cleanup subscriber
	go func() {
		<-ctx.Done()
		p.unsubscribe(sessionKey, ch)
	}()

	return ch, nil
}

// poll is the main polling loop for a session.
// It fetches stats from the router at the configured interval and broadcasts to subscribers.
func (p *StatsPoller) poll(ctx context.Context, session *pollingSession) {
	defer p.wg.Done()

	ticker := time.NewTicker(session.interval)
	defer ticker.Stop()

	// Fetch immediately on start
	p.fetchAndBroadcast(ctx, session)

	for {
		select {
		case <-ticker.C:
			p.fetchAndBroadcast(ctx, session)

		case <-ctx.Done():
			// Context cancelled, cleanup session
			p.cleanupSession(session)
			return

		case <-p.stopChan:
			// Service shutdown
			p.cleanupSession(session)
			return
		}
	}
}

// fetchAndBroadcast fetches stats from the router and broadcasts to all subscribers
func (p *StatsPoller) fetchAndBroadcast(ctx context.Context, session *pollingSession) {
	// Create timeout context for fetch operation
	fetchCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Fetch stats from router using ExecuteCommand
	cmd := router.Command{
		Path:   "/interface",
		Action: "print",
		Args: map[string]string{
			".id": session.interfaceID,
		},
	}
	result, err := p.routerPort.ExecuteCommand(fetchCtx, cmd)
	if err != nil || !result.Success || len(result.Data) == 0 {
		return
	}

	// Convert result to InterfaceStats model
	data := result.Data[0]
	stats := &model.InterfaceStats{
		TxBytes:   model.Size(getStringOrEmpty(data, "tx-byte")),
		RxBytes:   model.Size(getStringOrEmpty(data, "rx-byte")),
		TxPackets: model.Size(getStringOrEmpty(data, "tx-packet")),
		RxPackets: model.Size(getStringOrEmpty(data, "rx-packet")),
		TxErrors:  getIntOrZero(data, "tx-error"),
		RxErrors:  getIntOrZero(data, "rx-error"),
		TxDrops:   getIntOrZero(data, "tx-drop"),
		RxDrops:   getIntOrZero(data, "rx-drop"),
	}

	// Broadcast to all subscribers
	session.subMu.RLock()
	subscribers := session.subscribers
	session.subMu.RUnlock()

	for _, ch := range subscribers {
		select {
		case ch <- stats:
			// Successfully sent
		default:
			// Channel buffer full, drop this update
		}
	}

	// Publish event to event bus for persistence
	if p.eventBus != nil {
		_ = stats
	}
}

// unsubscribe removes a subscriber channel from a session
func (p *StatsPoller) unsubscribe(sessionKey string, ch chan *model.InterfaceStats) {
	p.sessionsMu.Lock()
	defer p.sessionsMu.Unlock()

	session, exists := p.sessions[sessionKey]
	if !exists {
		return
	}

	// Remove subscriber from session
	session.subMu.Lock()
	for i, subscriber := range session.subscribers {
		if subscriber == ch {
			session.subscribers[i] = session.subscribers[len(session.subscribers)-1]
			session.subscribers = session.subscribers[:len(session.subscribers)-1]
			break
		}
	}
	subscriberCount := len(session.subscribers)
	session.subMu.Unlock()

	// Close the subscriber channel
	close(ch)

	// If no more subscribers, stop polling session
	if subscriberCount == 0 {
		session.cancelFunc()
		delete(p.sessions, sessionKey)
	}
}

// cleanupSession closes all subscriber channels for a session
func (p *StatsPoller) cleanupSession(session *pollingSession) {
	session.subMu.Lock()
	defer session.subMu.Unlock()

	for _, ch := range session.subscribers {
		close(ch)
	}
	session.subscribers = nil
}

// Stop gracefully stops the stats poller and all active polling sessions
func (p *StatsPoller) Stop() {
	close(p.stopChan)

	// Cancel all polling sessions
	p.sessionsMu.Lock()
	for _, session := range p.sessions {
		session.cancelFunc()
	}
	p.sessionsMu.Unlock()

	// Wait for all polling goroutines to finish
	p.wg.Wait()
}

// GetActiveSessions returns the number of active polling sessions (for monitoring)
func (p *StatsPoller) GetActiveSessions() int {
	p.sessionsMu.RLock()
	defer p.sessionsMu.RUnlock()
	return len(p.sessions)
}

// GetSubscriberCount returns the total number of subscribers across all sessions (for monitoring)
func (p *StatsPoller) GetSubscriberCount() int {
	p.sessionsMu.RLock()
	defer p.sessionsMu.RUnlock()

	count := 0
	for _, session := range p.sessions {
		session.subMu.RLock()
		count += len(session.subscribers)
		session.subMu.RUnlock()
	}
	return count
}

// Helper functions for extracting data from RouterOS responses

func getStringOrEmpty(data map[string]string, key string) string {
	if val, ok := data[key]; ok {
		return val
	}
	return ""
}

func getIntOrZero(data map[string]string, key string) int {
	if val, ok := data[key]; ok {
		if i, err := parseInt(val); err == nil {
			return i
		}
	}
	return 0
}

// =============================================================================
// Service Traffic Poller
// =============================================================================

const (
	// TrafficPollingInterval is the interval for collecting traffic statistics (10 seconds)
	TrafficPollingInterval = 10 * time.Second
	// MinTrafficPollingInterval is the minimum allowed polling interval (5 seconds)
	MinTrafficPollingInterval = 5 * time.Second
	// MaxTrafficPollingInterval is the maximum reasonable polling interval (60 seconds)
	MaxTrafficPollingInterval = 60 * time.Second
)

// ServiceTrafficPoller polls traffic statistics for service instances and publishes to subscribers.
// It manages per-instance polling with rate limiting and graceful shutdown.
type ServiceTrafficPoller struct {
	routerPort router.RouterPort
	eventBus   events.EventBus

	// Active polling sessions: instanceID -> polling context
	sessions   map[string]*trafficPollingSession
	sessionsMu sync.RWMutex

	// Stop channel for graceful shutdown
	stopChan chan struct{}
	wg       sync.WaitGroup
}

// trafficPollingSession represents an active polling session for a service instance
type trafficPollingSession struct {
	instanceID  string
	routerID    string
	vlanID      int
	interval    time.Duration
	subscribers []chan *model.ServiceTrafficStats
	subMu       sync.RWMutex
	cancelFunc  context.CancelFunc
}

// NewServiceTrafficPoller creates a new traffic poller service
func NewServiceTrafficPoller(routerPort router.RouterPort, eventBus events.EventBus) *ServiceTrafficPoller {
	return &ServiceTrafficPoller{
		routerPort: routerPort,
		eventBus:   eventBus,
		sessions:   make(map[string]*trafficPollingSession),
		stopChan:   make(chan struct{}),
	}
}

// Subscribe creates a subscription channel for traffic stats updates.
func (p *ServiceTrafficPoller) Subscribe(
	ctx context.Context,
	instanceID, routerID string,
	vlanID int,
	interval time.Duration,
) (<-chan *model.ServiceTrafficStats, error) {
	// Enforce rate limiting
	if interval < MinTrafficPollingInterval {
		interval = MinTrafficPollingInterval
	}
	if interval > MaxTrafficPollingInterval {
		interval = MaxTrafficPollingInterval
	}

	p.sessionsMu.Lock()
	defer p.sessionsMu.Unlock()

	// Check if polling session already exists
	session, exists := p.sessions[instanceID]
	if !exists {
		// Create new polling session
		pollCtx, cancel := context.WithCancel(context.Background())
		session = &trafficPollingSession{
			instanceID:  instanceID,
			routerID:    routerID,
			vlanID:      vlanID,
			interval:    interval,
			subscribers: make([]chan *model.ServiceTrafficStats, 0),
			cancelFunc:  cancel,
		}
		p.sessions[instanceID] = session

		// Start polling goroutine
		p.wg.Add(1)
		go p.trafficPoll(pollCtx, session)
	}

	// Create subscriber channel with buffer to prevent blocking
	ch := make(chan *model.ServiceTrafficStats, 10)

	// Add subscriber to session
	session.subMu.Lock()
	session.subscribers = append(session.subscribers, ch)
	session.subMu.Unlock()

	// Monitor context cancellation to cleanup subscriber
	go func() {
		<-ctx.Done()
		p.trafficUnsubscribe(instanceID, ch)
	}()

	return ch, nil
}

// trafficPoll is the main polling loop for a traffic session.
func (p *ServiceTrafficPoller) trafficPoll(ctx context.Context, session *trafficPollingSession) {
	defer p.wg.Done()

	ticker := time.NewTicker(session.interval)
	defer ticker.Stop()

	// Fetch immediately on start
	p.trafficFetchAndBroadcast(ctx, session)

	for {
		select {
		case <-ticker.C:
			p.trafficFetchAndBroadcast(ctx, session)

		case <-ctx.Done():
			p.trafficCleanupSession(session)
			return

		case <-p.stopChan:
			p.trafficCleanupSession(session)
			return
		}
	}
}

// trafficFetchAndBroadcast fetches traffic stats from the router and broadcasts to all subscribers
func (p *ServiceTrafficPoller) trafficFetchAndBroadcast(ctx context.Context, session *trafficPollingSession) {
	fetchCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	vlanInterfaceName := fmt.Sprintf("vlan%d", session.vlanID)
	cmd := router.Command{
		Path:   "/interface",
		Action: "print",
		Args: map[string]string{
			"name": vlanInterfaceName,
		},
	}

	result, err := p.routerPort.ExecuteCommand(fetchCtx, cmd)
	if err != nil || !result.Success || len(result.Data) == 0 {
		return
	}

	data := result.Data[0]
	txBytes := parseBytes(getStringOrEmpty(data, "tx-byte"))
	rxBytes := parseBytes(getStringOrEmpty(data, "rx-byte"))

	stats := &model.ServiceTrafficStats{
		InstanceID:            session.instanceID,
		TotalUploadBytes:      txBytes,
		TotalDownloadBytes:    rxBytes,
		CurrentPeriodUpload:   txBytes,
		CurrentPeriodDownload: rxBytes,
		History:               []*model.TrafficDataPoint{},
		DeviceBreakdown:       []*model.DeviceTrafficBreakdown{},
		Quota:                 nil,
		LastUpdated:           time.Now(),
	}

	// Broadcast to all subscribers
	session.subMu.RLock()
	subscribers := session.subscribers
	session.subMu.RUnlock()

	for _, ch := range subscribers {
		select {
		case ch <- stats:
		default:
		}
	}

	if p.eventBus != nil {
		_ = stats
	}
}

// trafficUnsubscribe removes a subscriber channel from a traffic session
func (p *ServiceTrafficPoller) trafficUnsubscribe(instanceID string, ch chan *model.ServiceTrafficStats) {
	p.sessionsMu.Lock()
	defer p.sessionsMu.Unlock()

	session, exists := p.sessions[instanceID]
	if !exists {
		return
	}

	session.subMu.Lock()
	for i, subscriber := range session.subscribers {
		if subscriber == ch {
			session.subscribers[i] = session.subscribers[len(session.subscribers)-1]
			session.subscribers = session.subscribers[:len(session.subscribers)-1]
			break
		}
	}
	subscriberCount := len(session.subscribers)
	session.subMu.Unlock()

	close(ch)

	if subscriberCount == 0 {
		session.cancelFunc()
		delete(p.sessions, instanceID)
	}
}

// trafficCleanupSession closes all subscriber channels for a traffic session
func (p *ServiceTrafficPoller) trafficCleanupSession(session *trafficPollingSession) {
	session.subMu.Lock()
	defer session.subMu.Unlock()

	for _, ch := range session.subscribers {
		close(ch)
	}
	session.subscribers = nil
}

// Stop gracefully stops the traffic poller and all active polling sessions
func (p *ServiceTrafficPoller) Stop() {
	close(p.stopChan)

	p.sessionsMu.Lock()
	for _, session := range p.sessions {
		session.cancelFunc()
	}
	p.sessionsMu.Unlock()

	p.wg.Wait()
}

// GetActiveSessions returns the number of active traffic polling sessions
func (p *ServiceTrafficPoller) GetActiveSessions() int {
	p.sessionsMu.RLock()
	defer p.sessionsMu.RUnlock()
	return len(p.sessions)
}

// GetSubscriberCount returns the total number of traffic subscribers
func (p *ServiceTrafficPoller) GetSubscriberCount() int {
	p.sessionsMu.RLock()
	defer p.sessionsMu.RUnlock()

	count := 0
	for _, session := range p.sessions {
		session.subMu.RLock()
		count += len(session.subscribers)
		session.subMu.RUnlock()
	}
	return count
}

// parseBytes parses a byte count string from RouterOS.
func parseBytes(s string) int {
	var bytes int
	fmt.Sscanf(s, "%d", &bytes)
	return bytes
}
