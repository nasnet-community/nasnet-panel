// Package services contains business logic services for NasNetConnect.
package services

import (
	"context"
	"fmt"
	"log"
	"net"
	"strings"
	"sync"
	"time"

	"backend/internal/events"
	"backend/internal/router"
)

// IPAddressService provides IP address management operations for routers.
// It handles IP address CRUD operations, conflict detection, and dependency checking.
//
// Follows the hexagonal architecture pattern using RouterPort for router communication.
type IPAddressService struct {
	routerPort     router.RouterPort
	eventBus       events.EventBus
	eventPublisher *events.Publisher
	cache          *ipAddressCache
}

// IPAddressServiceConfig holds configuration for IPAddressService.
type IPAddressServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
}

// IPAddressData represents enriched IP address information.
type IPAddressData struct {
	ID         string
	Address    string // Full CIDR (e.g., "192.168.1.1/24")
	Network    string // Calculated network address
	Broadcast  string // Calculated broadcast address
	Interface  string // Interface name
	Disabled   bool
	Dynamic    bool // Assigned by DHCP client
	Invalid    bool // Invalid flag
	Comment    string
}

// ConflictResult represents the result of conflict detection.
type ConflictResult struct {
	HasConflict bool
	Conflicts   []IPConflict
	Message     string
}

// IPConflict represents a detected IP address conflict.
type IPConflict struct {
	ID           string
	Address      string
	Interface    string
	ConflictType string // "EXACT", "SUBNET_OVERLAP", "BROADCAST", "NETWORK"
	Explanation  string
}

// DependencyResult represents dependencies for an IP address.
type DependencyResult struct {
	IPAddressID      string
	DHCPServers      []DHCPServerInfo
	Routes           []RouteInfo
	NATRules         []NATRuleInfo
	FirewallRules    []FirewallRuleInfo
	HasDependencies  bool
}

// DHCPServerInfo holds minimal DHCP server information.
type DHCPServerInfo struct {
	ID        string
	Name      string
	Interface string
	Gateway   string
	Disabled  bool
}

// RouteInfo holds minimal route information.
type RouteInfo struct {
	ID          string
	Destination string
	Gateway     string
	Interface   string
	Active      bool
}

// NATRuleInfo holds minimal NAT rule information.
type NATRuleInfo struct {
	ID         string
	Chain      string
	Action     string
	SrcAddress string
	DstAddress string
	ToAddress  string
	Disabled   bool
}

// FirewallRuleInfo holds minimal firewall rule information.
type FirewallRuleInfo struct {
	ID           string
	Chain        string
	Action       string
	SrcAddress   string
	DstAddress   string
	InInterface  string
	OutInterface string
	Disabled     bool
}

// ipAddressCache provides simple in-memory caching for IP address data.
type ipAddressCache struct {
	mu      sync.RWMutex
	data    map[string][]*IPAddressData
	expires map[string]time.Time
	ttl     time.Duration
}

// newIPAddressCache creates a new IP address cache with the given TTL.
func newIPAddressCache(ttl time.Duration) *ipAddressCache {
	return &ipAddressCache{
		data:    make(map[string][]*IPAddressData),
		expires: make(map[string]time.Time),
		ttl:     ttl,
	}
}

// Get retrieves cached IP addresses for a router if not expired.
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

// Set stores IP addresses in the cache with expiration.
func (c *ipAddressCache) Set(routerID string, ipAddresses []*IPAddressData) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.data[routerID] = ipAddresses
	c.expires[routerID] = time.Now().Add(c.ttl)
}

// Invalidate removes cached data for a router.
func (c *ipAddressCache) Invalidate(routerID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.data, routerID)
	delete(c.expires, routerID)
}

// NewIPAddressService creates a new IPAddressService with the given configuration.
func NewIPAddressService(cfg IPAddressServiceConfig) *IPAddressService {
	s := &IPAddressService{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		cache:      newIPAddressCache(10 * time.Second), // 10-second cache
	}

	// Create publisher if event bus is provided
	if cfg.EventBus != nil {
		s.eventPublisher = events.NewPublisher(cfg.EventBus, "ip-address-service")
	}

	return s
}

// ListIPAddresses fetches all IP addresses for a router, optionally filtered by interface.
func (s *IPAddressService) ListIPAddresses(
	ctx context.Context,
	routerID string,
	interfaceID *string,
) ([]*IPAddressData, error) {
	// Check cache first
	if cached := s.cache.Get(routerID); cached != nil {
		log.Printf("returning cached IP addresses for router %s (count: %d)", routerID, len(cached))
		return filterByInterface(cached, interfaceID), nil
	}

	// Fetch IP address data from RouterOS
	log.Printf("fetching IP addresses from router: router_id=%s", routerID)
	ipAddresses, err := s.fetchIPAddresses(ctx, routerID)
	if err != nil {
		log.Printf("failed to fetch IP addresses: router_id=%s error=%v", routerID, err)
		return nil, fmt.Errorf("failed to fetch IP addresses: %w", err)
	}

	// Calculate network and broadcast addresses
	s.calculateNetworkInfo(ipAddresses)

	// Cache the results
	s.cache.Set(routerID, ipAddresses)

	return filterByInterface(ipAddresses, interfaceID), nil
}

// GetIPAddress fetches a specific IP address by ID.
func (s *IPAddressService) GetIPAddress(
	ctx context.Context,
	routerID string,
	ipID string,
) (*IPAddressData, error) {
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
	routerID string,
	address string,
	interfaceName string,
	comment string,
	disabled bool,
) (*IPAddressData, error) {
	// Validate CIDR format
	if !isValidCIDR(address) {
		return nil, fmt.Errorf("invalid CIDR notation: %s", address)
	}

	// Check for conflicts
	conflictResult, err := s.CheckConflict(ctx, routerID, address, &interfaceName, nil)
	if err != nil {
		return nil, fmt.Errorf("conflict check failed: %w", err)
	}
	if conflictResult.HasConflict {
		return nil, fmt.Errorf("IP address conflict: %s", conflictResult.Message)
	}

	// Create IP address via RouterPort
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

	// Invalidate cache
	s.cache.Invalidate(routerID)

	// Publish event
	if s.eventBus != nil {
		event := events.NewBaseEvent("ip-address-created", events.PriorityNormal, "ip-address-service")
		_ = s.eventBus.Publish(ctx, &event)
	}

	// Fetch and return the created IP address
	newIPID := result.Data[0][".id"]
	return s.GetIPAddress(ctx, routerID, newIPID)
}

// UpdateIPAddress updates an existing IP address.
func (s *IPAddressService) UpdateIPAddress(
	ctx context.Context,
	routerID string,
	ipID string,
	address string,
	interfaceName string,
	comment string,
	disabled bool,
) (*IPAddressData, error) {
	// Validate CIDR format
	if !isValidCIDR(address) {
		return nil, fmt.Errorf("invalid CIDR notation: %s", address)
	}

	// Check for conflicts (excluding current IP)
	conflictResult, err := s.CheckConflict(ctx, routerID, address, &interfaceName, &ipID)
	if err != nil {
		return nil, fmt.Errorf("conflict check failed: %w", err)
	}
	if conflictResult.HasConflict {
		return nil, fmt.Errorf("IP address conflict: %s", conflictResult.Message)
	}

	// Update IP address via RouterPort
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

	// Invalidate cache
	s.cache.Invalidate(routerID)

	// Publish event
	if s.eventBus != nil {
		event := events.NewBaseEvent("ip-address-updated", events.PriorityNormal, "ip-address-service")
		_ = s.eventBus.Publish(ctx, &event)
	}

	// Fetch and return the updated IP address
	return s.GetIPAddress(ctx, routerID, ipID)
}

// DeleteIPAddress deletes an IP address.
func (s *IPAddressService) DeleteIPAddress(
	ctx context.Context,
	routerID string,
	ipID string,
) error {
	// Check dependencies before deleting
	deps, err := s.GetDependencies(ctx, routerID, ipID)
	if err != nil {
		return fmt.Errorf("dependency check failed: %w", err)
	}

	if deps.HasDependencies {
		// Still allow deletion but warn user (handled by frontend)
		log.Printf("deleting IP address with dependencies: ip_id=%s dhcp=%d routes=%d",
			ipID, len(deps.DHCPServers), len(deps.Routes))
	}

	// Delete IP address via RouterPort
	cmd := router.Command{
		Path:   "/ip/address",
		Action: "remove",
		Args: map[string]string{
			".id": ipID,
		},
	}

	_, err = s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to delete IP address: %w", err)
	}

	// Invalidate cache
	s.cache.Invalidate(routerID)

	// Publish event
	if s.eventBus != nil {
		event := events.NewBaseEvent("ip-address-deleted", events.PriorityNormal, "ip-address-service")
		_ = s.eventBus.Publish(ctx, &event)
	}

	return nil
}

// CheckConflict checks for IP address conflicts.
func (s *IPAddressService) CheckConflict(
	ctx context.Context,
	routerID string,
	address string,
	interfaceName *string,
	excludeID *string,
) (*ConflictResult, error) {
	// Parse the input address
	ip, network, err := parseCIDR(address)
	if err != nil {
		return nil, fmt.Errorf("invalid CIDR: %w", err)
	}

	// Fetch all existing IP addresses
	existingIPs, err := s.ListIPAddresses(ctx, routerID, nil)
	if err != nil {
		return nil, err
	}

	conflicts := []IPConflict{}

	for _, existing := range existingIPs {
		// Skip if this is the same IP (for updates)
		if excludeID != nil && existing.ID == *excludeID {
			continue
		}

		// Skip if dynamic (DHCP-assigned)
		if existing.Dynamic {
			continue
		}

		existingIP, existingNet, err := parseCIDR(existing.Address)
		if err != nil {
			continue // Skip invalid addresses
		}

		// Check exact match on different interface
		if ip.Equal(existingIP) && (interfaceName == nil || existing.Interface != *interfaceName) {
			conflicts = append(conflicts, IPConflict{
				ID:           existing.ID,
				Address:      existing.Address,
				Interface:    existing.Interface,
				ConflictType: "EXACT",
				Explanation:  fmt.Sprintf("IP %s already assigned to interface %s", ip.String(), existing.Interface),
			})
			continue
		}

		// Check subnet overlap
		if network.Contains(existingIP) || existingNet.Contains(ip) {
			if interfaceName == nil || existing.Interface != *interfaceName {
				conflicts = append(conflicts, IPConflict{
					ID:           existing.ID,
					Address:      existing.Address,
					Interface:    existing.Interface,
					ConflictType: "SUBNET_OVERLAP",
					Explanation:  fmt.Sprintf("Subnet overlaps with %s on interface %s", existing.Address, existing.Interface),
				})
			}
		}

		// Check if trying to use broadcast address
		broadcast := getBroadcast(network)
		if ip.Equal(broadcast) {
			conflicts = append(conflicts, IPConflict{
				ID:           existing.ID,
				Address:      existing.Address,
				Interface:    existing.Interface,
				ConflictType: "BROADCAST",
				Explanation:  "IP is the broadcast address of the subnet",
			})
		}

		// Check if trying to use network address
		if ip.Equal(network.IP) {
			conflicts = append(conflicts, IPConflict{
				ID:           existing.ID,
				Address:      existing.Address,
				Interface:    existing.Interface,
				ConflictType: "NETWORK",
				Explanation:  "IP is the network address (not usable for hosts)",
			})
		}
	}

	message := "No conflicts detected"
	if len(conflicts) > 0 {
		message = fmt.Sprintf("Found %d conflict(s)", len(conflicts))
	}

	return &ConflictResult{
		HasConflict: len(conflicts) > 0,
		Conflicts:   conflicts,
		Message:     message,
	}, nil
}

// GetDependencies checks what depends on an IP address.
func (s *IPAddressService) GetDependencies(
	ctx context.Context,
	routerID string,
	ipID string,
) (*DependencyResult, error) {
	// Get the IP address
	ipAddr, err := s.GetIPAddress(ctx, routerID, ipID)
	if err != nil {
		return nil, err
	}

	// Extract just the IP without CIDR
	ip := strings.Split(ipAddr.Address, "/")[0]

	result := &DependencyResult{
		IPAddressID:   ipID,
		DHCPServers:   []DHCPServerInfo{},
		Routes:        []RouteInfo{},
		NATRules:      []NATRuleInfo{},
		FirewallRules: []FirewallRuleInfo{},
	}

	// Check DHCP servers
	dhcpServers, err := s.fetchDHCPServers(ctx, routerID)
	if err == nil {
		for _, dhcp := range dhcpServers {
			if dhcp.Gateway == ip {
				result.DHCPServers = append(result.DHCPServers, dhcp)
			}
		}
	}

	// Check routes
	routes, err := s.fetchRoutes(ctx, routerID)
	if err == nil {
		for _, route := range routes {
			if route.Gateway == ip {
				result.Routes = append(result.Routes, route)
			}
		}
	}

	// Check NAT rules
	natRules, err := s.fetchNATRules(ctx, routerID)
	if err == nil {
		for _, nat := range natRules {
			if containsIP(nat.SrcAddress, ip) || containsIP(nat.DstAddress, ip) || containsIP(nat.ToAddress, ip) {
				result.NATRules = append(result.NATRules, nat)
			}
		}
	}

	// Check firewall rules
	firewallRules, err := s.fetchFirewallRules(ctx, routerID)
	if err == nil {
		for _, fw := range firewallRules {
			if containsIP(fw.SrcAddress, ip) || containsIP(fw.DstAddress, ip) {
				result.FirewallRules = append(result.FirewallRules, fw)
			}
		}
	}

	result.HasDependencies = len(result.DHCPServers) > 0 ||
		len(result.Routes) > 0 ||
		len(result.NATRules) > 0 ||
		len(result.FirewallRules) > 0

	return result, nil
}

// fetchIPAddresses fetches IP address data from RouterOS.
func (s *IPAddressService) fetchIPAddresses(ctx context.Context, routerID string) ([]*IPAddressData, error) {
	cmd := router.Command{
		Path:   "/ip/address",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	ipAddresses := make([]*IPAddressData, 0, len(result.Data))
	for _, data := range result.Data {
		ipAddr := &IPAddressData{
			ID:        data[".id"],
			Address:   data["address"],
			Interface: data["interface"],
			Disabled:  data["disabled"] == "true",
			Dynamic:   data["dynamic"] == "true",
			Invalid:   data["invalid"] == "true",
		}

		if comment, ok := data["comment"]; ok {
			ipAddr.Comment = comment
		}

		ipAddresses = append(ipAddresses, ipAddr)
	}

	return ipAddresses, nil
}

// calculateNetworkInfo calculates network and broadcast addresses for IP addresses.
func (s *IPAddressService) calculateNetworkInfo(ipAddresses []*IPAddressData) {
	for _, ip := range ipAddresses {
		if network, broadcast, err := calculateNetworkAddresses(ip.Address); err == nil {
			ip.Network = network
			ip.Broadcast = broadcast
		}
	}
}

// fetchDHCPServers fetches DHCP server information.
func (s *IPAddressService) fetchDHCPServers(ctx context.Context, routerID string) ([]DHCPServerInfo, error) {
	cmd := router.Command{
		Path:   "/ip/dhcp-server/network",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	servers := make([]DHCPServerInfo, 0)
	for _, data := range result.Data {
		server := DHCPServerInfo{
			ID:        data[".id"],
			Name:      data["name"],
			Interface: data["interface"],
			Gateway:   data["gateway"],
			Disabled:  data["disabled"] == "true",
		}
		servers = append(servers, server)
	}

	return servers, nil
}

// fetchRoutes fetches route information.
func (s *IPAddressService) fetchRoutes(ctx context.Context, routerID string) ([]RouteInfo, error) {
	cmd := router.Command{
		Path:   "/ip/route",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	routes := make([]RouteInfo, 0)
	for _, data := range result.Data {
		route := RouteInfo{
			ID:          data[".id"],
			Destination: data["dst-address"],
			Gateway:     data["gateway"],
			Interface:   data["interface"],
			Active:      data["active"] == "true",
		}
		routes = append(routes, route)
	}

	return routes, nil
}

// fetchNATRules fetches NAT rule information.
func (s *IPAddressService) fetchNATRules(ctx context.Context, routerID string) ([]NATRuleInfo, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	rules := make([]NATRuleInfo, 0)
	for _, data := range result.Data {
		rule := NATRuleInfo{
			ID:         data[".id"],
			Chain:      data["chain"],
			Action:     data["action"],
			SrcAddress: data["src-address"],
			DstAddress: data["dst-address"],
			ToAddress:  data["to-address"],
			Disabled:   data["disabled"] == "true",
		}
		rules = append(rules, rule)
	}

	return rules, nil
}

// fetchFirewallRules fetches firewall rule information.
func (s *IPAddressService) fetchFirewallRules(ctx context.Context, routerID string) ([]FirewallRuleInfo, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	rules := make([]FirewallRuleInfo, 0)
	for _, data := range result.Data {
		rule := FirewallRuleInfo{
			ID:           data[".id"],
			Chain:        data["chain"],
			Action:       data["action"],
			SrcAddress:   data["src-address"],
			DstAddress:   data["dst-address"],
			InInterface:  data["in-interface"],
			OutInterface: data["out-interface"],
			Disabled:     data["disabled"] == "true",
		}
		rules = append(rules, rule)
	}

	return rules, nil
}

// Helper functions

// filterByInterface filters IP addresses by interface.
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

// isValidCIDR validates CIDR notation.
func isValidCIDR(cidr string) bool {
	_, _, err := net.ParseCIDR(cidr)
	return err == nil
}

// parseCIDR parses CIDR notation and returns IP and network.
func parseCIDR(cidr string) (net.IP, *net.IPNet, error) {
	ip, network, err := net.ParseCIDR(cidr)
	if err != nil {
		return nil, nil, err
	}
	return ip, network, nil
}

// calculateNetworkAddresses calculates network and broadcast from CIDR.
func calculateNetworkAddresses(cidr string) (string, string, error) {
	_, network, err := net.ParseCIDR(cidr)
	if err != nil {
		return "", "", err
	}

	networkAddr := network.IP.String()
	broadcast := getBroadcast(network)
	broadcastAddr := broadcast.String()

	return networkAddr, broadcastAddr, nil
}

// getBroadcast calculates the broadcast address for a network.
func getBroadcast(network *net.IPNet) net.IP {
	broadcast := make(net.IP, len(network.IP))
	copy(broadcast, network.IP)

	for i := range broadcast {
		broadcast[i] |= ^network.Mask[i]
	}

	return broadcast
}

// containsIP checks if an address string contains an IP.
func containsIP(addressStr, ip string) bool {
	if addressStr == "" {
		return false
	}
	return strings.Contains(addressStr, ip)
}

// boolToYesNo converts a boolean to RouterOS yes/no string.
func boolToYesNo(b bool) string {
	if b {
		return "yes"
	}
	return "no"
}
