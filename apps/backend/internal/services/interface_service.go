// Package services contains business logic services for NasNetConnect.
package services

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	"backend/internal/events"
	"backend/internal/router"
)

// InterfaceService provides network interface operations for routers.
// It fetches interface data from MikroTik RouterOS, enriches it with
// IP addresses and traffic statistics, and publishes status change events.
//
// Follows the hexagonal architecture pattern using RouterPort for router communication.
type InterfaceService struct {
	routerPort     router.RouterPort
	eventBus       events.EventBus
	eventPublisher *events.Publisher
	cache          *interfaceCache
}

// InterfaceServiceConfig holds configuration for InterfaceService.
type InterfaceServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
}

// InterfaceData represents enriched interface information.
type InterfaceData struct {
	ID          string
	Name        string
	Type        string
	Enabled     bool
	Running     bool
	MacAddress  string
	MTU         int
	Comment     string
	TxBytes     uint64
	RxBytes     uint64
	IP          string
	Status      string // "UP", "DOWN", "DISABLED", "UNKNOWN"
	TxRate      uint64
	RxRate      uint64
	LinkSpeed   string
	LastSeen    time.Time
	LinkPartner string
	UsedBy      []string
}

// interfaceCache provides simple in-memory caching for interface data.
type interfaceCache struct {
	mu      sync.RWMutex
	data    map[string][]*InterfaceData
	expires map[string]time.Time
	ttl     time.Duration
}

// newInterfaceCache creates a new interface cache with the given TTL.
func newInterfaceCache(ttl time.Duration) *interfaceCache {
	return &interfaceCache{
		data:    make(map[string][]*InterfaceData),
		expires: make(map[string]time.Time),
		ttl:     ttl,
	}
}

// Get retrieves cached interfaces for a router if not expired.
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

// Set stores interfaces in the cache with expiration.
func (c *interfaceCache) Set(routerID string, interfaces []*InterfaceData) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.data[routerID] = interfaces
	c.expires[routerID] = time.Now().Add(c.ttl)
}

// Invalidate removes cached data for a router.
func (c *interfaceCache) Invalidate(routerID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.data, routerID)
	delete(c.expires, routerID)
}

// NewInterfaceService creates a new InterfaceService with the given configuration.
func NewInterfaceService(cfg InterfaceServiceConfig) *InterfaceService {
	s := &InterfaceService{
		routerPort: cfg.RouterPort,
		eventBus:   cfg.EventBus,
		cache:      newInterfaceCache(30 * time.Second), // 30-second cache
	}

	// Create publisher if event bus is provided
	if cfg.EventBus != nil {
		s.eventPublisher = events.NewPublisher(cfg.EventBus, "interface-service")
	}

	return s
}

// ListInterfaces fetches all interfaces for a router, optionally filtered by type.
// Data is cached for 30 seconds to reduce load on the router.
func (s *InterfaceService) ListInterfaces(
	ctx context.Context,
	routerID string,
	interfaceType *string,
) ([]*InterfaceData, error) {
	// Check cache first
	if cached := s.cache.Get(routerID); cached != nil {
		log.Printf("returning cached interfaces for router %s (count: %d)", routerID, len(cached))
		return filterByType(cached, interfaceType), nil
	}

	// Fetch interface data from RouterOS
	log.Printf("fetching interfaces from router: router_id=%s", routerID)
	interfaces, err := s.fetchInterfaces(ctx, routerID)
	if err != nil {
		log.Printf("failed to fetch interfaces: router_id=%s error=%v", routerID, err)
		return nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	// Enrich with additional data
	s.enrichWithIPs(ctx, routerID, interfaces)
	s.enrichWithTraffic(ctx, routerID, interfaces)
	s.enrichWithLinkPartners(ctx, routerID, interfaces)
	s.enrichWithUsage(ctx, routerID, interfaces)
	s.calculateStatus(interfaces)

	// Update last seen timestamp
	now := time.Now()
	for _, iface := range interfaces {
		iface.LastSeen = now
	}

	// Cache the results
	s.cache.Set(routerID, interfaces)

	log.Printf("interfaces fetched successfully: router_id=%s count=%d", routerID, len(interfaces))
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

// InvalidateCache clears the cache for a router, forcing fresh data on next query.
func (s *InterfaceService) InvalidateCache(routerID string) {
	s.cache.Invalidate(routerID)
	log.Printf("interface cache invalidated: router_id=%s", routerID)
}

// -----------------------------------------------------------------------------
// Private helper methods
// -----------------------------------------------------------------------------

// fetchInterfaces retrieves basic interface data from RouterOS.
func (s *InterfaceService) fetchInterfaces(
	ctx context.Context,
	routerID string,
) ([]*InterfaceData, error) {
	// Execute RouterOS command: /interface print detail
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
			Enabled: data["disabled"] != "true",
			Running: data["running"] == "true",
		}

		// Parse optional fields
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

// enrichWithIPs fetches IP addresses and assigns them to interfaces.
func (s *InterfaceService) enrichWithIPs(
	ctx context.Context,
	routerID string,
	interfaces []*InterfaceData,
) {
	// Execute RouterOS command: /ip/address print
	cmd := router.Command{
		Path:   "/ip/address",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		log.Printf("warning: failed to fetch IP addresses: %v", err)
		return
	}

	// Create map of interface name to IP address
	ipMap := make(map[string]string)
	for _, data := range result.Data {
		if ifaceName, ok := data["interface"]; ok {
			if address, ok := data["address"]; ok {
				// Remove subnet mask (e.g., "192.168.1.1/24" -> "192.168.1.1")
				if idx := len(address); idx > 0 {
					for i, c := range address {
						if c == '/' {
							idx = i
							break
						}
					}
					ipMap[ifaceName] = address[:idx]
				}
			}
		}
	}

	// Assign IPs to interfaces
	for _, iface := range interfaces {
		if ip, ok := ipMap[iface.Name]; ok {
			iface.IP = ip
		}
	}
}

// enrichWithTraffic fetches current traffic rates for interfaces.
func (s *InterfaceService) enrichWithTraffic(
	ctx context.Context,
	routerID string,
	interfaces []*InterfaceData,
) {
	// Note: /interface/monitor-traffic requires ongoing monitoring
	// For now, we'll skip real-time rates and rely on tx-byte/rx-byte from the interface print
	// TODO: Implement background monitoring for real-time rates
	log.Printf("debug: traffic rate monitoring not yet implemented, using byte counters")
}

// enrichWithLinkPartners fetches LLDP neighbor information.
func (s *InterfaceService) enrichWithLinkPartners(
	ctx context.Context,
	routerID string,
	interfaces []*InterfaceData,
) {
	// Execute RouterOS command: /ip/neighbor print
	cmd := router.Command{
		Path:   "/ip/neighbor",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		log.Printf("debug: LLDP neighbors not available: %v", err)
		return
	}

	// Create map of interface name to neighbor
	neighborMap := make(map[string]string)
	for _, data := range result.Data {
		if ifaceName, ok := data["interface"]; ok {
			if identity, ok := data["identity"]; ok {
				neighborMap[ifaceName] = identity
			} else if address, ok := data["address"]; ok {
				neighborMap[ifaceName] = address
			}
		}
	}

	// Assign link partners to interfaces
	for _, iface := range interfaces {
		if partner, ok := neighborMap[iface.Name]; ok {
			iface.LinkPartner = partner
		}
	}
}

// enrichWithUsage determines which services are using each interface.
func (s *InterfaceService) enrichWithUsage(
	ctx context.Context,
	routerID string,
	interfaces []*InterfaceData,
) {
	// Check if interface is used in bridges
	cmd := router.Command{
		Path:   "/interface/bridge/port",
		Action: "print",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err == nil {
		usageMap := make(map[string][]string)
		for _, data := range result.Data {
			if ifaceName, ok := data["interface"]; ok {
				if bridge, ok := data["bridge"]; ok {
					usageMap[ifaceName] = append(usageMap[ifaceName], "bridge:"+bridge)
				}
			}
		}

		for _, iface := range interfaces {
			if usage, ok := usageMap[iface.Name]; ok {
				iface.UsedBy = append(iface.UsedBy, usage...)
			}
		}
	}

	// Check if interface is used in VPN/tunnels (can be extended)
	// TODO: Add VPN interface detection
}

// calculateStatus derives the operational status from running and enabled flags.
func (s *InterfaceService) calculateStatus(interfaces []*InterfaceData) {
	for _, iface := range interfaces {
		if !iface.Enabled {
			iface.Status = "DISABLED"
		} else if iface.Running {
			iface.Status = "UP"
		} else {
			iface.Status = "DOWN"
		}
	}
}

// filterByType filters interfaces by type if specified.
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

// StartMonitoring starts background monitoring for interface status changes.
// It polls interfaces every 5 seconds and publishes events when status changes.
func (s *InterfaceService) StartMonitoring(ctx context.Context, routerID string) {
	if s.eventPublisher == nil {
		log.Printf("warning: event publisher not available, skipping monitoring: router_id=%s", routerID)
		return
	}

	log.Printf("starting interface monitoring: router_id=%s", routerID)

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	previousState := make(map[string]string)

	for {
		select {
		case <-ctx.Done():
			log.Printf("stopping interface monitoring: router_id=%s", routerID)
			return
		case <-ticker.C:
			// Invalidate cache to force fresh data
			s.InvalidateCache(routerID)

			interfaces, err := s.ListInterfaces(ctx, routerID, nil)
			if err != nil {
				log.Printf("failed to fetch interfaces during monitoring: router_id=%s error=%v", routerID, err)
				continue
			}

			// Detect status changes
			for _, iface := range interfaces {
				prevStatus, exists := previousState[iface.ID]
				if exists && prevStatus != iface.Status {
					// Status changed - publish event
					if err := s.eventPublisher.PublishInterfaceStatusChanged(
						ctx,
						routerID,
						iface.ID,
						iface.Name,
						iface.Status,
						prevStatus,
					); err != nil {
						log.Printf("failed to publish status change event: router_id=%s interface=%s error=%v", routerID, iface.Name, err)
					} else {
						log.Printf("interface status changed: router_id=%s interface=%s status=%s previous=%s", routerID, iface.Name, iface.Status, prevStatus)
					}
				}
				previousState[iface.ID] = iface.Status
			}
		}
	}
}

// =============================================================================
// Mutation Methods
// =============================================================================

// EnableInterface enables a disabled interface.
func (s *InterfaceService) EnableInterface(ctx context.Context, routerID, interfaceID string) (*InterfaceData, error) {
	// Validate interface exists
	interfaces, err := s.fetchInterfaces(ctx, routerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	var targetInterface *InterfaceData
	for _, iface := range interfaces {
		if iface.ID == interfaceID {
			targetInterface = iface
			break
		}
	}

	if targetInterface == nil {
		return nil, fmt.Errorf("interface not found: %s", interfaceID)
	}

	// Execute RouterOS command: /interface/set .id=<id> disabled=no
	cmd := router.Command{
		Path:   "/interface",
		Action: "set",
		ID:     interfaceID,
		Args:   map[string]string{"disabled": "no"},
	}

	_, err = s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to enable interface: %w", err)
	}

	// Invalidate cache
	s.cache.Invalidate(routerID)

	// Fetch updated interface data
	updatedInterfaces, err := s.ListInterfaces(ctx, routerID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated interfaces: %w", err)
	}

	for _, iface := range updatedInterfaces {
		if iface.ID == interfaceID {
			// Publish status changed event
			if s.eventPublisher != nil {
				if err := s.eventPublisher.PublishInterfaceStatusChanged(
					ctx,
					routerID,
					iface.ID,
					iface.Name,
					iface.Status,
					"DISABLED", // Previous status
				); err != nil {
					log.Printf("failed to publish interface status changed event: %v", err)
				}
			}
			return iface, nil
		}
	}

	return nil, fmt.Errorf("interface not found after enable: %s", interfaceID)
}

// DisableInterface disables an active interface.
func (s *InterfaceService) DisableInterface(ctx context.Context, routerID, interfaceID string) (*InterfaceData, error) {
	// Validate interface exists
	interfaces, err := s.fetchInterfaces(ctx, routerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	var targetInterface *InterfaceData
	for _, iface := range interfaces {
		if iface.ID == interfaceID {
			targetInterface = iface
			break
		}
	}

	if targetInterface == nil {
		return nil, fmt.Errorf("interface not found: %s", interfaceID)
	}

	// Safety check: Detect if this is a gateway interface
	// TODO: Add more sophisticated gateway detection
	if targetInterface.UsedBy != nil {
		for _, usage := range targetInterface.UsedBy {
			if usage == "gateway" {
				log.Printf("warning: disabling interface %s which is used by gateway", targetInterface.Name)
			}
		}
	}

	// Execute RouterOS command: /interface/set .id=<id> disabled=yes
	cmd := router.Command{
		Path:   "/interface",
		Action: "set",
		ID:     interfaceID,
		Args:   map[string]string{"disabled": "yes"},
	}

	_, err = s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to disable interface: %w", err)
	}

	// Invalidate cache
	s.cache.Invalidate(routerID)

	// Fetch updated interface data
	updatedInterfaces, err := s.ListInterfaces(ctx, routerID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated interfaces: %w", err)
	}

	for _, iface := range updatedInterfaces {
		if iface.ID == interfaceID {
			// Publish status changed event
			if s.eventPublisher != nil {
				if err := s.eventPublisher.PublishInterfaceStatusChanged(
					ctx,
					routerID,
					iface.ID,
					iface.Name,
					iface.Status,
					targetInterface.Status, // Previous status
				); err != nil {
					log.Printf("failed to publish interface status changed event: %v", err)
				}
			}
			return iface, nil
		}
	}

	return nil, fmt.Errorf("interface not found after disable: %s", interfaceID)
}

// UpdateInterfaceInput represents the input for updating interface settings.
type UpdateInterfaceInput struct {
	Enabled *bool
	MTU     *int
	Comment *string
}

// UpdateInterface updates interface settings (MTU, comment, enabled).
func (s *InterfaceService) UpdateInterface(ctx context.Context, routerID, interfaceID string, input UpdateInterfaceInput) (*InterfaceData, error) {
	// Validate interface exists
	interfaces, err := s.fetchInterfaces(ctx, routerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	var targetInterface *InterfaceData
	for _, iface := range interfaces {
		if iface.ID == interfaceID {
			targetInterface = iface
			break
		}
	}

	if targetInterface == nil {
		return nil, fmt.Errorf("interface not found: %s", interfaceID)
	}

	// Build RouterOS command with only changed fields
	args := make(map[string]string)

	if input.Enabled != nil {
		if *input.Enabled {
			args["disabled"] = "no"
		} else {
			args["disabled"] = "yes"
		}
	}

	if input.MTU != nil {
		// Validate MTU range (68-9000)
		if *input.MTU < 68 || *input.MTU > 9000 {
			return nil, fmt.Errorf("invalid MTU value: %d (must be between 68 and 9000)", *input.MTU)
		}
		args["mtu"] = fmt.Sprintf("%d", *input.MTU)
	}

	if input.Comment != nil {
		// Validate comment length (max 255)
		if len(*input.Comment) > 255 {
			return nil, fmt.Errorf("comment too long: %d characters (max 255)", len(*input.Comment))
		}
		args["comment"] = *input.Comment
	}

	// Execute RouterOS command: /interface/set
	cmd := router.Command{
		Path:   "/interface",
		Action: "set",
		ID:     interfaceID,
		Args:   args,
	}

	_, err = s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to update interface: %w", err)
	}

	// Invalidate cache
	s.cache.Invalidate(routerID)

	// Fetch updated interface data
	updatedInterfaces, err := s.ListInterfaces(ctx, routerID, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch updated interfaces: %w", err)
	}

	for _, iface := range updatedInterfaces {
		if iface.ID == interfaceID {
			// Publish status changed event if enabled status changed
			if input.Enabled != nil && s.eventPublisher != nil {
				if err := s.eventPublisher.PublishInterfaceStatusChanged(
					ctx,
					routerID,
					iface.ID,
					iface.Name,
					iface.Status,
					targetInterface.Status,
				); err != nil {
					log.Printf("failed to publish interface status changed event: %v", err)
				}
			}
			return iface, nil
		}
	}

	return nil, fmt.Errorf("interface not found after update: %s", interfaceID)
}

// InterfaceOperationError represents an error for a single interface in a batch operation.
type InterfaceOperationError struct {
	InterfaceID   string
	InterfaceName string
	Error         string
}

// BatchAction represents the action to perform in a batch operation.
type BatchAction string

const (
	BatchActionEnable  BatchAction = "ENABLE"
	BatchActionDisable BatchAction = "DISABLE"
	BatchActionUpdate  BatchAction = "UPDATE"
)

// BatchOperation performs operations on multiple interfaces.
// Executes serially (not parallel) to track first failure.
func (s *InterfaceService) BatchOperation(
	ctx context.Context,
	routerID string,
	interfaceIDs []string,
	action BatchAction,
	input *UpdateInterfaceInput,
) (succeeded []*InterfaceData, failed []InterfaceOperationError, err error) {
	succeeded = make([]*InterfaceData, 0, len(interfaceIDs))
	failed = make([]InterfaceOperationError, 0)

	// Fetch all interfaces once for name lookup
	interfaces, err := s.ListInterfaces(ctx, routerID, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch interfaces: %w", err)
	}

	interfaceMap := make(map[string]*InterfaceData)
	for _, iface := range interfaces {
		interfaceMap[iface.ID] = iface
	}

	// Execute operation for each interface (serially)
	for _, interfaceID := range interfaceIDs {
		var result *InterfaceData
		var opErr error

		switch action {
		case BatchActionEnable:
			result, opErr = s.EnableInterface(ctx, routerID, interfaceID)
		case BatchActionDisable:
			result, opErr = s.DisableInterface(ctx, routerID, interfaceID)
		case BatchActionUpdate:
			if input == nil {
				opErr = fmt.Errorf("input required for UPDATE action")
			} else {
				result, opErr = s.UpdateInterface(ctx, routerID, interfaceID, *input)
			}
		default:
			opErr = fmt.Errorf("unsupported batch action: %s", action)
		}

		if opErr != nil {
			// Operation failed - add to failed list
			interfaceName := interfaceID
			if iface, ok := interfaceMap[interfaceID]; ok {
				interfaceName = iface.Name
			}
			failed = append(failed, InterfaceOperationError{
				InterfaceID:   interfaceID,
				InterfaceName: interfaceName,
				Error:         opErr.Error(),
			})
		} else {
			// Operation succeeded
			succeeded = append(succeeded, result)
		}
	}

	return succeeded, failed, nil
}
