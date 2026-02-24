// Package pollers provides real-time polling services for router data.
package pollers

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/graph/model"

	"backend/internal/events"
	"backend/internal/router"
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
		// Create new polling session from provided context for proper cancellation
		pollCtx, cancel := context.WithCancel(ctx)
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
		go p.poll(pollCtx, session)
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
		p.unsubscribe(instanceID, ch)
	}()

	return ch, nil
}

// poll is the main polling loop for a traffic session.
func (p *ServiceTrafficPoller) poll(ctx context.Context, session *trafficPollingSession) {
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
			p.cleanupSession(session)
			return

		case <-p.stopChan:
			p.cleanupSession(session)
			return
		}
	}
}

// fetchAndBroadcast fetches traffic stats from the router and broadcasts to all subscribers
func (p *ServiceTrafficPoller) fetchAndBroadcast(ctx context.Context, session *trafficPollingSession) {
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

	// TODO: Publish event to event bus for persistence
	// if p.eventBus != nil {
	//	eventBus.Publish(ctx, event)
	// }
}

// unsubscribe removes a subscriber channel from a traffic session
func (p *ServiceTrafficPoller) unsubscribe(instanceID string, ch chan *model.ServiceTrafficStats) {
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

// cleanupSession closes all subscriber channels for a traffic session
func (p *ServiceTrafficPoller) cleanupSession(session *trafficPollingSession) {
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
