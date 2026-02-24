package netif

import (
	"context"
	"fmt"
	"strconv"
	"sync"
	"time"

	"backend/internal/events"
	"backend/internal/router"

	"go.uber.org/zap"
)

// InterfaceService provides network interface operations for routers.
type InterfaceService struct {
	routerPort     router.RouterPort
	eventBus       events.EventBus
	eventPublisher *events.Publisher
	cache          *interfaceCache
	logger         *zap.SugaredLogger
}

// InterfaceServiceConfig holds configuration for InterfaceService.
type InterfaceServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// interfaceCache provides simple in-memory caching for interface data.
type interfaceCache struct {
	mu      sync.RWMutex
	data    map[string][]*InterfaceData
	expires map[string]time.Time
	ttl     time.Duration
}

func newInterfaceCache(ttl time.Duration) *interfaceCache {
	return &interfaceCache{
		data:    make(map[string][]*InterfaceData),
		expires: make(map[string]time.Time),
		ttl:     ttl,
	}
}

func (c *interfaceCache) Get(routerID string) []*InterfaceData {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if expires, ok := c.expires[routerID]; ok {
		if time.Now().Before(expires) {
			return c.data[routerID]
		}
	}
	return nil
}

func (c *interfaceCache) Set(routerID string, interfaces []*InterfaceData) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data[routerID] = interfaces
	c.expires[routerID] = time.Now().Add(c.ttl)
}

func (c *interfaceCache) Invalidate(routerID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.data, routerID)
	delete(c.expires, routerID)
}

// NewInterfaceService creates a new InterfaceService with the given configuration.
func NewInterfaceService(cfg InterfaceServiceConfig) *InterfaceService {
	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop().Sugar()
	}
	s := &InterfaceService{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		cache:      newInterfaceCache(30 * time.Second),
		logger:     logger,
	}
	if cfg.EventBus != nil {
		s.eventPublisher = events.NewPublisher(cfg.EventBus, "interface-service")
	}
	return s
}

// ListInterfaces fetches all interfaces for a router, optionally filtered by type.
func (s *InterfaceService) ListInterfaces(
	ctx context.Context,
	routerID string,
	interfaceType *string,
) ([]*InterfaceData, error) {

	if cached := s.cache.Get(routerID); cached != nil {
		s.logger.Debugw("returning cached interfaces", "router_id", routerID, "count", len(cached))
		return filterByType(cached, interfaceType), nil
	}

	s.logger.Debugw("fetching interfaces from router", "router_id", routerID)
	interfaces, err := s.fetchInterfaces(ctx, routerID)
	if err != nil {
		s.logger.Errorw("failed to fetch interfaces", "router_id", routerID, "error", err)
		return nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	s.enrichWithIPs(ctx, routerID, interfaces)
	s.enrichWithTraffic(ctx, routerID, interfaces)
	s.enrichWithLinkPartners(ctx, routerID, interfaces)
	s.enrichWithUsage(ctx, routerID, interfaces)
	s.calculateStatus(interfaces)

	now := time.Now()
	for _, iface := range interfaces {
		iface.LastSeen = now
	}

	s.cache.Set(routerID, interfaces)

	s.logger.Debugw("interfaces fetched successfully", "router_id", routerID, "count", len(interfaces))
	return filterByType(interfaces, interfaceType), nil
}

// GetInterface fetches a single interface by ID.
func (s *InterfaceService) GetInterface(
	ctx context.Context,
	routerID string,
	interfaceID string,
) (*InterfaceData, error) {

	interfaces, err := s.ListInterfaces(ctx, routerID, nil)
	if err != nil {
		return nil, err
	}
	for _, iface := range interfaces {
		if iface.ID == interfaceID {
			return iface, nil
		}
	}
	return nil, fmt.Errorf("interface not found: %s", interfaceID)
}

// InvalidateCache clears the cache for a router.
func (s *InterfaceService) InvalidateCache(routerID string) {
	s.cache.Invalidate(routerID)
	s.logger.Debugw("interface cache invalidated", "router_id", routerID)
}

// fetchInterfaces retrieves basic interface data from RouterOS.
func (s *InterfaceService) fetchInterfaces(ctx context.Context, _routerID string) ([]*InterfaceData, error) {
	cmd := router.Command{
		Path:   "/interface",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("RouterOS command failed: %w", err)
	}

	interfaces := make([]*InterfaceData, 0, len(result.Data))
	for _, data := range result.Data {
		iface := &InterfaceData{
			ID:      data[".id"],
			Name:    data["name"],
			Type:    data["type"],
			Enabled: data["disabled"] != trueValue,
			Running: data["running"] == trueValue,
		}

		if mac, ok := data["mac-address"]; ok {
			iface.MacAddress = mac
		}
		if mtu, ok := data["mtu"]; ok {
			if mtuInt, err := strconv.Atoi(mtu); err == nil {
				iface.MTU = mtuInt
			}
		}
		if comment, ok := data["comment"]; ok {
			iface.Comment = comment
		}
		if txBytes, ok := data["tx-byte"]; ok {
			if tx, err := strconv.ParseUint(txBytes, 10, 64); err == nil {
				iface.TxBytes = tx
			}
		}
		if rxBytes, ok := data["rx-byte"]; ok {
			if rx, err := strconv.ParseUint(rxBytes, 10, 64); err == nil {
				iface.RxBytes = rx
			}
		}

		interfaces = append(interfaces, iface)
	}

	return interfaces, nil
}

func filterByType(interfaces []*InterfaceData, interfaceType *string) []*InterfaceData {
	if interfaceType == nil {
		return interfaces
	}
	filtered := make([]*InterfaceData, 0)
	for _, iface := range interfaces {
		if iface.Type == *interfaceType {
			filtered = append(filtered, iface)
		}
	}
	return filtered
}
