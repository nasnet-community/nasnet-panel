package netif

import (
	"context"
	"fmt"
	"net"
	"strings"
	"sync"
	"time"

	"backend/internal/events"
	"backend/internal/router"

	"go.uber.org/zap"
)

// IPAddressService provides IP address management operations for routers.
type IPAddressService struct {
	routerPort     router.RouterPort
	eventBus       events.EventBus
	eventPublisher *events.Publisher
	cache          *ipAddressCache
	logger         *zap.SugaredLogger
}

// IPAddressServiceConfig holds configuration for IPAddressService.
type IPAddressServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
	Logger     *zap.SugaredLogger
}

// ipAddressCache provides simple in-memory caching for IP address data.
type ipAddressCache struct {
	mu      sync.RWMutex
	data    map[string][]*IPAddressData
	expires map[string]time.Time
	ttl     time.Duration
}

func newIPAddressCache(ttl time.Duration) *ipAddressCache {
	return &ipAddressCache{
		data:    make(map[string][]*IPAddressData),
		expires: make(map[string]time.Time),
		ttl:     ttl,
	}
}

func (c *ipAddressCache) Get(routerID string) []*IPAddressData {
	c.mu.RLock()
	defer c.mu.RUnlock()
	if expires, ok := c.expires[routerID]; ok {
		if time.Now().Before(expires) {
			return c.data[routerID]
		}
	}
	return nil
}

func (c *ipAddressCache) Set(routerID string, ipAddresses []*IPAddressData) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data[routerID] = ipAddresses
	c.expires[routerID] = time.Now().Add(c.ttl)
}

func (c *ipAddressCache) Invalidate(routerID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.data, routerID)
	delete(c.expires, routerID)
}

// NewIPAddressService creates a new IPAddressService with the given configuration.
func NewIPAddressService(cfg IPAddressServiceConfig) *IPAddressService {
	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop().Sugar()
	}
	s := &IPAddressService{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		cache:      newIPAddressCache(10 * time.Second),
		logger:     logger,
	}
	if cfg.EventBus != nil {
		s.eventPublisher = events.NewPublisher(cfg.EventBus, "ip-address-service")
	}
	return s
}

// ListIPAddresses fetches all IP addresses for a router.
func (s *IPAddressService) ListIPAddresses(
	ctx context.Context,
	routerID string,
	interfaceID *string,
) ([]*IPAddressData, error) {

	if cached := s.cache.Get(routerID); cached != nil {
		s.logger.Debugw("returning cached IP addresses", "router_id", routerID, "count", len(cached))
		return filterByInterface(cached, interfaceID), nil
	}

	s.logger.Debugw("fetching IP addresses from router", "router_id", routerID)
	ipAddresses, err := s.fetchIPAddresses(ctx, routerID)
	if err != nil {
		s.logger.Errorw("failed to fetch IP addresses", "router_id", routerID, "error", err)
		return nil, fmt.Errorf("failed to fetch IP addresses: %w", err)
	}

	s.calculateNetworkInfo(ipAddresses)
	s.cache.Set(routerID, ipAddresses)

	return filterByInterface(ipAddresses, interfaceID), nil
}

// GetIPAddress fetches a specific IP address by ID.
func (s *IPAddressService) GetIPAddress(ctx context.Context, routerID, ipID string) (*IPAddressData, error) {
	ipAddresses, err := s.ListIPAddresses(ctx, routerID, nil)
	if err != nil {
		return nil, err
	}
	for _, ip := range ipAddresses {
		if ip.ID == ipID {
			return ip, nil
		}
	}
	return nil, fmt.Errorf("IP address not found: %s", ipID)
}

// CreateIPAddress creates a new IP address on an interface.
func (s *IPAddressService) CreateIPAddress(
	ctx context.Context,
	routerID, address, interfaceName, comment string,
	disabled bool,
) (*IPAddressData, error) {

	if !isValidCIDR(address) {
		return nil, fmt.Errorf("invalid CIDR notation: %s", address)
	}

	conflictResult, err := s.CheckConflict(ctx, routerID, address, &interfaceName, nil)
	if err != nil {
		return nil, fmt.Errorf("conflict check failed: %w", err)
	}
	if conflictResult.HasConflict {
		return nil, fmt.Errorf("IP address conflict: %s", conflictResult.Message)
	}

	cmd := router.Command{

		Path:   "/ip/address",
		Action: "add",
		Args: map[string]string{
			"address":   address,
			"interface": interfaceName,
			"comment":   comment,
			"disabled":  boolToYesNo(disabled),
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create IP address: %w", err)
	}

	s.cache.Invalidate(routerID)

	if s.eventBus != nil {
		event := events.NewBaseEvent("ip-address-created", events.PriorityNormal, "ip-address-service")
		if err := s.eventBus.Publish(ctx, &event); err != nil {
			s.logger.Warnw("failed to publish event", "error", err)
		}
	}

	newIPID := result.Data[0][".id"]

	return s.GetIPAddress(ctx, routerID, newIPID)
}

// UpdateIPAddress updates an existing IP address.
func (s *IPAddressService) UpdateIPAddress(
	ctx context.Context,
	routerID, ipID, address, interfaceName, comment string,
	disabled bool,
) (*IPAddressData, error) {

	if !isValidCIDR(address) {
		return nil, fmt.Errorf("invalid CIDR notation: %s", address)
	}

	conflictResult, err := s.CheckConflict(ctx, routerID, address, &interfaceName, &ipID)
	if err != nil {
		return nil, fmt.Errorf("conflict check failed: %w", err)
	}
	if conflictResult.HasConflict {
		return nil, fmt.Errorf("IP address conflict: %s", conflictResult.Message)
	}

	cmd := router.Command{
		Path:   "/ip/address",
		Action: "set",
		Args: map[string]string{
			".id":       ipID,
			"address":   address,
			"interface": interfaceName,
			"comment":   comment,
			"disabled":  boolToYesNo(disabled),
		},
	}

	_, err = s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to update IP address: %w", err)
	}

	s.cache.Invalidate(routerID)

	if s.eventBus != nil {
		event := events.NewBaseEvent("ip-address-updated", events.PriorityNormal, "ip-address-service")
		if err := s.eventBus.Publish(ctx, &event); err != nil {
			s.logger.Warnw("failed to publish event", "error", err)
		}
	}

	return s.GetIPAddress(ctx, routerID, ipID)
}

// DeleteIPAddress deletes an IP address.
func (s *IPAddressService) DeleteIPAddress(ctx context.Context, routerID, ipID string) error {
	deps, err := s.GetDependencies(ctx, routerID, ipID)
	if err != nil {
		return fmt.Errorf("dependency check failed: %w", err)
	}

	if deps.HasDependencies {
		s.logger.Warnw("deleting IP address with dependencies",
			"ip_id", ipID,
			"dhcp_count", len(deps.DHCPServers),
			"route_count", len(deps.Routes),
		)
	}

	cmd := router.Command{
		Path:   "/ip/address",
		Action: "remove",
		Args:   map[string]string{".id": ipID},
	}

	_, err = s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to delete IP address: %w", err)
	}

	s.cache.Invalidate(routerID)

	if s.eventBus != nil {
		event := events.NewBaseEvent("ip-address-deleted", events.PriorityNormal, "ip-address-service")
		if err := s.eventBus.Publish(ctx, &event); err != nil {
			s.logger.Warnw("failed to publish event", "error", err)
		}
	}

	return nil
}

// fetchIPAddresses fetches IP address data from RouterOS.
func (s *IPAddressService) fetchIPAddresses(ctx context.Context, _routerID string) ([]*IPAddressData, error) {
	cmd := router.Command{
		Path:   "/ip/address",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch IP addresses from router: %w", err)
	}

	ipAddresses := make([]*IPAddressData, 0, len(result.Data))
	for _, data := range result.Data {
		ipAddr := &IPAddressData{
			ID:        data[".id"],
			Address:   data["address"],
			Interface: data["interface"],
			Disabled:  data["disabled"] == trueValue,
			Dynamic:   data["dynamic"] == trueValue,
			Invalid:   data["invalid"] == trueValue,
		}
		if comment, ok := data["comment"]; ok {
			ipAddr.Comment = comment
		}
		ipAddresses = append(ipAddresses, ipAddr)
	}

	return ipAddresses, nil
}

func (s *IPAddressService) calculateNetworkInfo(ipAddresses []*IPAddressData) {
	for _, ip := range ipAddresses {
		if network, broadcast, err := calculateNetworkAddresses(ip.Address); err == nil {
			ip.Network = network
			ip.Broadcast = broadcast
		}
	}
}

func filterByInterface(ipAddresses []*IPAddressData, interfaceID *string) []*IPAddressData {
	if interfaceID == nil {
		return ipAddresses
	}
	filtered := make([]*IPAddressData, 0)
	for _, ip := range ipAddresses {
		if ip.Interface == *interfaceID {
			filtered = append(filtered, ip)
		}
	}
	return filtered
}

func isValidCIDR(cidr string) bool {
	_, _, err := net.ParseCIDR(cidr)
	return err == nil
}

func calculateNetworkAddresses(cidr string) (networkAddr, broadcast string, err error) {
	_, network, err := net.ParseCIDR(cidr)
	if err != nil {
		return "", "", fmt.Errorf("failed to parse CIDR: %w", err)
	}
	networkAddr = network.IP.String()
	broadcast = GetBroadcast(network).String()
	return
}

func boolToYesNo(b bool) string {
	if b {
		return "yes"
	}
	return "no"
}

func containsIP(addressStr, ip string) bool {
	if addressStr == "" {
		return false
	}
	return strings.Contains(addressStr, ip)
}
