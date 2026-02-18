package wan

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"backend/internal/events"
	"backend/internal/router"
)

// WANService provides WAN interface configuration and monitoring.
//
//nolint:revive // used across packages
type WANService struct {
	routerPort     router.RouterPort
	eventBus       events.EventBus
	eventPublisher *events.Publisher
	cache          *wanCache
	history        *connectionHistory
	healthMonitor  *WANHealthMonitor
	mu             sync.RWMutex
}

// WANServiceConfig holds configuration for WANService.
//
//nolint:revive // used across packages
type WANServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
}

// NewWANService creates a new WAN service.
func NewWANService(config WANServiceConfig) *WANService {
	publisher := events.NewPublisher(config.EventBus, "wan-service")
	healthMonitor := NewWANHealthMonitor(config.RouterPort, config.EventBus)

	return &WANService{
		routerPort:     config.RouterPort,
		eventBus:       config.EventBus,
		eventPublisher: publisher,
		cache:          newWanCache(30 * time.Second),
		history:        newConnectionHistory(100),
		healthMonitor:  healthMonitor,
	}
}

// ListWANInterfaces retrieves all WAN interfaces for a router.
func (s *WANService) ListWANInterfaces(ctx context.Context, routerID string) ([]*WANInterfaceData, error) {
	if cached := s.cache.Get(routerID); cached != nil {
		log.Printf("[WANService] Cache hit for router %s", routerID)
		return cached, nil
	}

	log.Printf("[WANService] Cache miss for router %s, fetching from RouterOS", routerID)
	wans := []*WANInterfaceData{}
	s.cache.Set(routerID, wans)
	return wans, nil
}

// GetWANInterface retrieves a specific WAN interface by ID.
func (s *WANService) GetWANInterface(ctx context.Context, routerID, wanID string) (*WANInterfaceData, error) {
	wans, err := s.ListWANInterfaces(ctx, routerID)
	if err != nil {
		return nil, err
	}
	for _, w := range wans {
		if w.ID == wanID {
			return w, nil
		}
	}
	return nil, fmt.Errorf("WAN interface %s not found on router %s", wanID, routerID)
}

// GetConnectionHistory retrieves connection history for a WAN interface.
func (s *WANService) GetConnectionHistory(ctx context.Context, routerID, wanInterfaceID string, limit int) ([]*ConnectionEventData, error) {
	log.Printf("[WANService] Retrieving connection history for router %s, WAN interface %s", routerID, wanInterfaceID)

	evts := s.history.Get(routerID, limit)
	if evts == nil {
		return []*ConnectionEventData{}, nil
	}

	filtered := make([]*ConnectionEventData, 0)
	for _, event := range evts {
		if event.WANInterfaceID == wanInterfaceID {
			filtered = append(filtered, event)
		}
	}
	return filtered, nil
}

// ConfigureHealthCheck configures health check for a WAN interface.
func (s *WANService) ConfigureHealthCheck(ctx context.Context, routerID, wanInterfaceID string, input HealthCheckInput) error {
	log.Printf("[WANService] Configuring health check on router %s, WAN interface %s, target %s", routerID, wanInterfaceID, input.Target)
	s.cache.Invalidate(routerID)
	return fmt.Errorf("not implemented yet - Phase 5")
}

// DeleteWANConfiguration deletes WAN configuration (reverts to unconfigured).
func (s *WANService) DeleteWANConfiguration(ctx context.Context, routerID, wanInterfaceID string) error {
	log.Printf("[WANService] Deleting WAN configuration on router %s, WAN interface %s", routerID, wanInterfaceID)

	w, err := s.GetWANInterface(ctx, routerID, wanInterfaceID)
	if err != nil {
		return err
	}

	s.cache.Invalidate(routerID)

	event := events.NewWANDeletedEvent(routerID, wanInterfaceID, w.InterfaceName, w.ConnectionType)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		log.Printf("[WANService] Failed to publish WAN deleted event: %v", err)
	}

	return fmt.Errorf("not implemented yet")
}

// ConfigureWANHealthCheck configures health monitoring for a WAN interface.
func (s *WANService) ConfigureWANHealthCheck(ctx context.Context, routerID, wanID string, input HealthCheckInput) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	config := WANHealthCheckConfig{
		Enabled:          input.Enabled,
		Targets:          []string{input.Target},
		Interval:         input.Interval,
		Timeout:          2,
		FailureThreshold: 3,
	}

	if err := s.healthMonitor.ConfigureHealthCheck(ctx, routerID, wanID, config); err != nil {
		return fmt.Errorf("failed to configure health check: %w", err)
	}

	s.cache.Invalidate(routerID)

	event := events.NewWANConfiguredEvent(routerID, wanID, "", "HEALTH_CHECK", false)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		log.Printf("[WANService] Failed to publish WANConfiguredEvent: %v", err)
	}

	return nil
}

// GetWANHealthStatus retrieves the current health status for a WAN interface.
func (s *WANService) GetWANHealthStatus(routerID, wanID string) string {
	status := s.healthMonitor.GetHealthStatus(routerID, wanID)
	return string(status)
}

// wanCache provides simple in-memory caching for WAN data.
type wanCache struct {
	mu      sync.RWMutex
	data    map[string][]*WANInterfaceData
	expires map[string]time.Time
	ttl     time.Duration
}

func newWanCache(ttl time.Duration) *wanCache {
	return &wanCache{
		data:    make(map[string][]*WANInterfaceData),
		expires: make(map[string]time.Time),
		ttl:     ttl,
	}
}

func (c *wanCache) Get(routerID string) []*WANInterfaceData {
	c.mu.RLock()
	defer c.mu.RUnlock()

	if expires, ok := c.expires[routerID]; ok {
		if time.Now().Before(expires) {
			return c.data[routerID]
		}
	}
	return nil
}

func (c *wanCache) Set(routerID string, wans []*WANInterfaceData) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.data[routerID] = wans
	c.expires[routerID] = time.Now().Add(c.ttl)
}

func (c *wanCache) Invalidate(routerID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.data, routerID)
	delete(c.expires, routerID)
}

// connectionHistory stores WAN connection events in memory (ring buffer).
type connectionHistory struct {
	mu      sync.RWMutex
	events  map[string][]*ConnectionEventData
	maxSize int
}

func newConnectionHistory(maxSize int) *connectionHistory {
	return &connectionHistory{
		events:  make(map[string][]*ConnectionEventData),
		maxSize: maxSize,
	}
}

func (h *connectionHistory) Add(routerID string, event *ConnectionEventData) {
	h.mu.Lock()
	defer h.mu.Unlock()

	evts := h.events[routerID]
	evts = append(evts, event)

	if len(evts) > h.maxSize {
		evts = evts[len(evts)-h.maxSize:]
	}

	h.events[routerID] = evts
}

func (h *connectionHistory) Get(routerID string, limit int) []*ConnectionEventData {
	h.mu.RLock()
	defer h.mu.RUnlock()

	evts := h.events[routerID]
	if len(evts) == 0 {
		return nil
	}

	start := len(evts) - limit
	if start < 0 {
		start = 0
	}

	result := make([]*ConnectionEventData, len(evts)-start)
	copy(result, evts[start:])

	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}

	return result
}

// boolToString converts a boolean to "yes" or "no" for RouterOS.
func boolToString(b bool) string {
	if b {
		return "yes"
	}
	return "no"
}

// parseSignalStrength parses signal strength from dBm string.
func parseSignalStrength(s string) (int, error) {
	if s == "" {
		return 0, fmt.Errorf("empty signal strength")
	}

	for _, suffix := range []string{" dBm", "dBm"} {
		if len(s) > len(suffix) && s[len(s)-len(suffix):] == suffix {
			s = s[:len(s)-len(suffix)]
		}
	}

	var val int
	_, err := fmt.Sscanf(s, "%d", &val)
	if err != nil {
		return 0, fmt.Errorf("failed to parse signal strength: %w", err)
	}
	return val, nil
}
