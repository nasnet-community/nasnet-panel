// Package services contains business logic services for NasNetConnect.
package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"backend/internal/events"
	"backend/internal/router"
)

// WANService provides WAN interface configuration and monitoring.
// It handles DHCP, PPPoE, Static IP, and LTE WAN configurations,
// health monitoring, and connection history tracking.
//
// Follows the hexagonal architecture pattern using RouterPort for router communication.
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
type WANServiceConfig struct {
	RouterPort router.RouterPort
	EventBus   events.EventBus
}

// WANInterfaceData represents enriched WAN interface information.
type WANInterfaceData struct {
	ID              string
	InterfaceName   string
	ConnectionType  string // "DHCP", "PPPOE", "STATIC", "LTE", "NONE"
	Status          string // "CONNECTED", "CONNECTING", "DISCONNECTED", "ERROR", "DISABLED"
	PublicIP        string
	Gateway         string
	PrimaryDNS      string
	SecondaryDNS    string
	Uptime          time.Duration
	LastConnected   time.Time
	IsDefaultRoute  bool
	HealthStatus    string // "HEALTHY", "DEGRADED", "DOWN", "UNKNOWN"
	HealthTarget    string
	HealthLatency   int
	HealthEnabled   bool
	DhcpClient      *DhcpClientData
	PppoeClient     *PppoeClientData
	StaticConfig    *StaticIPConfigData
	LteModem        *LteModemData
}

// DhcpClientData represents DHCP client configuration.
type DhcpClientData struct {
	ID              string
	Interface       string
	Disabled        bool
	AddDefaultRoute bool
	UsePeerDNS      bool
	UsePeerNTP      bool
	Status          string
	Address         string
	DhcpServer      string
	Gateway         string
	ExpiresAfter    time.Duration
	Comment         string
}

// PppoeClientData represents PPPoE client configuration.
type PppoeClientData struct {
	ID              string
	Name            string
	Interface       string
	Disabled        bool
	Username        string
	ServiceName     string
	AddDefaultRoute bool
	UsePeerDNS      bool
	Running         bool
	MTU             int
	MRU             int
	Comment         string
}

// StaticIPConfigData represents static IP WAN configuration.
type StaticIPConfigData struct {
	ID           string
	Interface    string
	Address      string // CIDR notation
	Gateway      string
	PrimaryDNS   string
	SecondaryDNS string
	Comment      string
}

// LteModemData represents LTE modem configuration.
type LteModemData struct {
	ID             string
	Name           string
	APN            string
	SignalStrength int
	Running        bool
	Operator       string
	NetworkType    string
	PinConfigured  bool
	Comment        string
}

// ConnectionEventData represents a WAN connection history event.
type ConnectionEventData struct {
	ID             string
	WANInterfaceID string
	EventType      string // "CONNECTED", "DISCONNECTED", "AUTH_FAILED", "IP_CHANGED", etc.
	Timestamp      time.Time
	PublicIP       string
	Gateway        string
	Reason         string
	Duration       time.Duration
}

// wanCache provides simple in-memory caching for WAN data.
type wanCache struct {
	mu      sync.RWMutex
	data    map[string][]*WANInterfaceData
	expires map[string]time.Time
	ttl     time.Duration
}

// newWanCache creates a new WAN cache with the given TTL.
func newWanCache(ttl time.Duration) *wanCache {
	return &wanCache{
		data:    make(map[string][]*WANInterfaceData),
		expires: make(map[string]time.Time),
		ttl:     ttl,
	}
}

// Get retrieves cached WAN interfaces for a router if not expired.
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

// Set stores WAN interfaces in the cache with expiration.
func (c *wanCache) Set(routerID string, wans []*WANInterfaceData) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.data[routerID] = wans
	c.expires[routerID] = time.Now().Add(c.ttl)
}

// Invalidate removes cached data for a router.
func (c *wanCache) Invalidate(routerID string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.data, routerID)
	delete(c.expires, routerID)
}

// connectionHistory stores WAN connection events in memory (ring buffer).
type connectionHistory struct {
	mu      sync.RWMutex
	events  map[string][]*ConnectionEventData // routerID -> events
	maxSize int
}

// newConnectionHistory creates a new connection history tracker.
func newConnectionHistory(maxSize int) *connectionHistory {
	return &connectionHistory{
		events:  make(map[string][]*ConnectionEventData),
		maxSize: maxSize,
	}
}

// Add adds a connection event to the history.
func (h *connectionHistory) Add(routerID string, event *ConnectionEventData) {
	h.mu.Lock()
	defer h.mu.Unlock()

	events := h.events[routerID]
	events = append(events, event)

	// Maintain ring buffer (keep last maxSize events)
	if len(events) > h.maxSize {
		events = events[len(events)-h.maxSize:]
	}

	h.events[routerID] = events
}

// Get retrieves connection history for a router.
func (h *connectionHistory) Get(routerID string, limit int) []*ConnectionEventData {
	h.mu.RLock()
	defer h.mu.RUnlock()

	events := h.events[routerID]
	if len(events) == 0 {
		return nil
	}

	// Return most recent events first
	start := len(events) - limit
	if start < 0 {
		start = 0
	}

	result := make([]*ConnectionEventData, len(events)-start)
	copy(result, events[start:])

	// Reverse to get most recent first
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}

	return result
}

// NewWANService creates a new WAN service.
func NewWANService(config WANServiceConfig) *WANService {
	publisher := events.NewPublisher(config.EventBus, "wan-service")
	healthMonitor := NewWANHealthMonitor(config.RouterPort, config.EventBus)

	return &WANService{
		routerPort:     config.RouterPort,
		eventBus:       config.EventBus,
		eventPublisher: publisher,
		cache:          newWanCache(30 * time.Second), // 30-second TTL
		history:        newConnectionHistory(100),      // Keep last 100 events
		healthMonitor:  healthMonitor,
	}
}

// ListWANInterfaces retrieves all WAN interfaces for a router.
func (s *WANService) ListWANInterfaces(ctx context.Context, routerID string) ([]*WANInterfaceData, error) {
	// Check cache first
	if cached := s.cache.Get(routerID); cached != nil {
		log.Printf("[WANService] Cache hit for router %s", routerID)
		return cached, nil
	}

	log.Printf("[WANService] Cache miss for router %s, fetching from RouterOS", routerID)

	// TODO: Fetch from router via RouterPort
	// This is a stub implementation that will be filled in during Phase 2-4
	wans := []*WANInterfaceData{}

	// Cache the results
	s.cache.Set(routerID, wans)

	return wans, nil
}

// GetWANInterface retrieves a specific WAN interface by ID.
func (s *WANService) GetWANInterface(ctx context.Context, routerID, wanID string) (*WANInterfaceData, error) {
	wans, err := s.ListWANInterfaces(ctx, routerID)
	if err != nil {
		return nil, err
	}

	for _, wan := range wans {
		if wan.ID == wanID {
			return wan, nil
		}
	}

	return nil, fmt.Errorf("WAN interface %s not found on router %s", wanID, routerID)
}

// ConfigureDHCPClient configures DHCP client on a WAN interface.
func (s *WANService) ConfigureDHCPClient(ctx context.Context, routerID string, input DhcpClientInput) (*WANInterfaceData, error) {
	log.Printf("[WANService] Configuring DHCP client on router %s, interface %s", routerID, input.Interface)

	// Step 1: Check if DHCP client already exists on this interface
	checkCmd := router.Command{
		Path:   "/ip/dhcp-client/print",
		Action: "print",
		Args: map[string]string{
			"interface": input.Interface,
		},
	}

	checkResult, err := s.routerPort.ExecuteCommand(ctx, checkCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing DHCP client: %w", err)
	}

	// If DHCP client exists, remove it first
	if checkResult.Success && len(checkResult.Data) > 0 {
		log.Printf("[WANService] Removing existing DHCP client on interface %s", input.Interface)
		for _, item := range checkResult.Data {
			if id, ok := item[".id"]; ok {
				removeCmd := router.Command{
					Path:   "/ip/dhcp-client/remove",
					Action: "remove",
					Args: map[string]string{
						".id": id,
					},
				}
				if _, err := s.routerPort.ExecuteCommand(ctx, removeCmd); err != nil {
					return nil, fmt.Errorf("failed to remove existing DHCP client: %w", err)
				}
			}
		}
	}

	// Step 2: Add DHCP client configuration
	addArgs := map[string]string{
		"interface":         input.Interface,
		"add-default-route": boolToString(input.AddDefaultRoute),
		"use-peer-dns":      boolToString(input.UsePeerDNS),
		"use-peer-ntp":      boolToString(input.UsePeerNTP),
		"disabled":          "no",
	}

	if input.Comment != "" {
		addArgs["comment"] = input.Comment
	}

	addCmd := router.Command{
		Path:   "/ip/dhcp-client/add",
		Action: "add",
		Args: addArgs,
	}

	addResult, err := s.routerPort.ExecuteCommand(ctx, addCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add DHCP client: %w", err)
	}

	if !addResult.Success {
		return nil, fmt.Errorf("DHCP client configuration failed: %s", addResult.Error)
	}

	log.Printf("[WANService] DHCP client configured successfully on interface %s", input.Interface)

	// Step 3: Wait briefly for DHCP to acquire lease
	time.Sleep(2 * time.Second)

	// Step 4: Fetch DHCP client status
	statusCmd := router.Command{
		Path:   "/ip/dhcp-client/print",
		Action: "print",
		Args: map[string]string{
			"interface": input.Interface,
		},
	}

	statusResult, err := s.routerPort.ExecuteCommand(ctx, statusCmd)
	if err != nil {
		log.Printf("[WANService] Warning: Failed to fetch DHCP status: %v", err)
	}

	// Build WAN interface data
	wanData := &WANInterfaceData{
		ID:              fmt.Sprintf("wan-dhcp-%s", input.Interface),
		InterfaceName:   input.Interface,
		ConnectionType:  "DHCP",
		Status:          "CONNECTING",
		IsDefaultRoute:  input.AddDefaultRoute,
		HealthStatus:    "UNKNOWN",
		HealthEnabled:   false,
	}

	// Parse DHCP client data from status result
	if statusResult != nil && statusResult.Success && len(statusResult.Data) > 0 {
		dhcpData := statusResult.Data[0]
		wanData.DhcpClient = &DhcpClientData{
			ID:              dhcpData[".id"],
			Interface:       input.Interface,
			Disabled:        dhcpData["disabled"] == "true",
			AddDefaultRoute: input.AddDefaultRoute,
			UsePeerDNS:      input.UsePeerDNS,
			UsePeerNTP:      input.UsePeerNTP,
			Status:          dhcpData["status"],
			Address:         dhcpData["address"],
			DhcpServer:      dhcpData["dhcp-server"],
			Gateway:         dhcpData["gateway"],
			Comment:         input.Comment,
		}

		// Update WAN data from DHCP status
		if dhcpData["status"] == "bound" {
			wanData.Status = "CONNECTED"
			wanData.PublicIP = dhcpData["address"]
			wanData.Gateway = dhcpData["gateway"]
			wanData.LastConnected = time.Now()
		} else if dhcpData["status"] == "searching" || dhcpData["status"] == "requesting" {
			wanData.Status = "CONNECTING"
		} else {
			wanData.Status = "DISCONNECTED"
		}

		// Parse expires-after duration if present
		if expiresStr, ok := dhcpData["expires-after"]; ok {
			if duration, err := parseDuration(expiresStr); err == nil {
				wanData.DhcpClient.ExpiresAfter = duration
			}
		}
	}

	// Invalidate cache
	s.cache.Invalidate(routerID)

	// Add to connection history
	historyEvent := &ConnectionEventData{
		ID:             fmt.Sprintf("event-%d", time.Now().UnixNano()),
		WANInterfaceID: wanData.ID,
		EventType:      "CONNECTED",
		Timestamp:      time.Now(),
		PublicIP:       wanData.PublicIP,
		Gateway:        wanData.Gateway,
		Reason:         "DHCP client configured",
	}
	s.history.Add(routerID, historyEvent)

	// Publish event
	event := events.NewWANConfiguredEvent(routerID, wanData.ID, input.Interface, "DHCP", input.AddDefaultRoute)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		log.Printf("[WANService] Failed to publish WAN configured event: %v", err)
	}

	// Publish status changed event
	statusEvent := events.NewWANStatusChangedEvent(routerID, wanData.ID, input.Interface, wanData.Status, "NONE", "DHCP")
	statusEvent.PublicIP = wanData.PublicIP
	statusEvent.Gateway = wanData.Gateway
	if err := s.eventBus.Publish(ctx, statusEvent); err != nil {
		log.Printf("[WANService] Failed to publish WAN status changed event: %v", err)
	}

	return wanData, nil
}

// ConfigurePPPoEClient configures PPPoE client on a WAN interface.
func (s *WANService) ConfigurePPPoEClient(ctx context.Context, routerID string, input PppoeClientInput) (*WANInterfaceData, error) {
	log.Printf("[WANService] Configuring PPPoE client on router %s, name=%s, interface %s", routerID, input.Name, input.Interface)
	// IMPORTANT: NEVER LOG PASSWORD

	// Step 1: Check if PPPoE client with this name already exists
	checkCmd := router.Command{
		Path:   "/interface/pppoe-client/print",
		Action: "print",
		Args: map[string]string{
			"name": input.Name,
		},
	}

	checkResult, err := s.routerPort.ExecuteCommand(ctx, checkCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing PPPoE client: %w", err)
	}

	// If PPPoE client exists, remove it first
	if checkResult.Success && len(checkResult.Data) > 0 {
		log.Printf("[WANService] Removing existing PPPoE client with name %s", input.Name)
		for _, item := range checkResult.Data {
			if id, ok := item[".id"]; ok {
				removeCmd := router.Command{
					Path:   "/interface/pppoe-client/remove",
					Action: "remove",
					Args: map[string]string{
						".id": id,
					},
				}
				if _, err := s.routerPort.ExecuteCommand(ctx, removeCmd); err != nil {
					return nil, fmt.Errorf("failed to remove existing PPPoE client: %w", err)
				}
			}
		}
	}

	// Step 2: Add PPPoE client configuration
	addArgs := map[string]string{
		"name":              input.Name,
		"interface":         input.Interface,
		"user":              input.Username,
		"password":          input.Password, // NEVER LOG THIS
		"add-default-route": boolToString(input.AddDefaultRoute),
		"use-peer-dns":      boolToString(input.UsePeerDNS),
		"disabled":          "no",
	}

	// Optional parameters
	if input.ServiceName != "" {
		addArgs["service-name"] = input.ServiceName
	}
	if input.MTU > 0 {
		addArgs["mtu"] = fmt.Sprintf("%d", input.MTU)
	}
	if input.MRU > 0 {
		addArgs["mru"] = fmt.Sprintf("%d", input.MRU)
	}
	if input.Comment != "" {
		addArgs["comment"] = input.Comment
	}

	addCmd := router.Command{
		Path:   "/interface/pppoe-client/add",
		Action: "add",
		Args: addArgs,
	}

	addResult, err := s.routerPort.ExecuteCommand(ctx, addCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add PPPoE client: %w", err)
	}

	if !addResult.Success {
		return nil, fmt.Errorf("PPPoE client configuration failed: %s", addResult.Error)
	}

	log.Printf("[WANService] PPPoE client configured successfully: %s", input.Name)

	// Step 3: Wait briefly for PPPoE to attempt connection
	time.Sleep(2 * time.Second)

	// Step 4: Fetch PPPoE client status
	statusCmd := router.Command{
		Path:   "/interface/pppoe-client/print",
		Action: "print",
		Args: map[string]string{
			"name": input.Name,
		},
	}

	statusResult, err := s.routerPort.ExecuteCommand(ctx, statusCmd)
	if err != nil {
		log.Printf("[WANService] Warning: Failed to fetch PPPoE status: %v", err)
	}

	// Build WAN interface data
	wanData := &WANInterfaceData{
		ID:              fmt.Sprintf("wan-pppoe-%s", input.Name),
		InterfaceName:   input.Name, // PPPoE creates a virtual interface
		ConnectionType:  "PPPOE",
		Status:          "CONNECTING",
		IsDefaultRoute:  input.AddDefaultRoute,
		HealthStatus:    "UNKNOWN",
		HealthEnabled:   false,
	}

	// Parse PPPoE client data from status result
	if statusResult != nil && statusResult.Success && len(statusResult.Data) > 0 {
		pppoeData := statusResult.Data[0]
		wanData.PppoeClient = &PppoeClientData{
			ID:              pppoeData[".id"],
			Name:            input.Name,
			Interface:       input.Interface,
			Disabled:        pppoeData["disabled"] == "true",
			Username:        input.Username,
			ServiceName:     input.ServiceName,
			AddDefaultRoute: input.AddDefaultRoute,
			UsePeerDNS:      input.UsePeerDNS,
			Running:         pppoeData["running"] == "true",
			MTU:             input.MTU,
			MRU:             input.MRU,
			Comment:         input.Comment,
		}

		// Update WAN data from PPPoE status
		if pppoeData["running"] == "true" {
			wanData.Status = "CONNECTED"
			// Get IP from the PPPoE interface (virtual interface created by PPPoE)
			// RouterOS creates an interface with the name specified
			wanData.LastConnected = time.Now()
		} else if pppoeData["disabled"] == "false" {
			wanData.Status = "CONNECTING"
		} else {
			wanData.Status = "DISABLED"
		}
	}

	// Invalidate cache
	s.cache.Invalidate(routerID)

	// Add to connection history
	historyEvent := &ConnectionEventData{
		ID:             fmt.Sprintf("event-%d", time.Now().UnixNano()),
		WANInterfaceID: wanData.ID,
		EventType:      "CONNECTED",
		Timestamp:      time.Now(),
		Reason:         "PPPoE client configured",
	}
	s.history.Add(routerID, historyEvent)

	// Publish configured event
	event := events.NewWANConfiguredEvent(routerID, wanData.ID, input.Name, "PPPOE", input.AddDefaultRoute)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		log.Printf("[WANService] Failed to publish WAN configured event: %v", err)
	}

	// Publish status changed event
	statusEvent := events.NewWANStatusChangedEvent(routerID, wanData.ID, input.Name, wanData.Status, "NONE", "PPPOE")
	if err := s.eventBus.Publish(ctx, statusEvent); err != nil {
		log.Printf("[WANService] Failed to publish WAN status changed event: %v", err)
	}

	return wanData, nil
}

// ConfigureStaticIP configures static IP on a WAN interface.
func (s *WANService) ConfigureStaticIP(ctx context.Context, routerID string, input StaticIPInput) (*WANInterfaceData, error) {
	log.Printf("[WANService] Configuring static IP on router %s, interface %s, address %s", routerID, input.Interface, input.Address)

	// Step 1: Check for existing IP addresses on this interface
	checkIPCmd := router.Command{
		Path:   "/ip/address/print",
		Action: "print",
		Args: map[string]string{
			"interface": input.Interface,
		},
	}

	checkIPResult, err := s.routerPort.ExecuteCommand(ctx, checkIPCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing IP addresses: %w", err)
	}

	// Remove existing IP addresses on this interface (WAN should have single IP)
	if checkIPResult.Success && len(checkIPResult.Data) > 0 {
		log.Printf("[WANService] Removing %d existing IP address(es) from interface %s", len(checkIPResult.Data), input.Interface)
		for _, item := range checkIPResult.Data {
			if id, ok := item[".id"]; ok {
				removeIPCmd := router.Command{
					Path:   "/ip/address/remove",
					Action: "remove",
					Args: map[string]string{
						".id": id,
					},
				}
				if _, err := s.routerPort.ExecuteCommand(ctx, removeIPCmd); err != nil {
					return nil, fmt.Errorf("failed to remove existing IP address: %w", err)
				}
			}
		}
	}

	// Step 2: Add new IP address
	addIPParams := map[string]string{
		"address":   input.Address, // CIDR notation (e.g., "203.0.113.10/30")
		"interface": input.Interface,
	}
	if input.Comment != "" {
		addIPParams["comment"] = input.Comment
	}

	addIPCmd := router.Command{
		Path:   "/ip/address/add",
		Action: "add",
		Args:   addIPParams,
	}

	addIPResult, err := s.routerPort.ExecuteCommand(ctx, addIPCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add IP address: %w", err)
	}

	if !addIPResult.Success {
		return nil, fmt.Errorf("IP address configuration failed: %s", addIPResult.Error)
	}

	log.Printf("[WANService] IP address %s added to interface %s", input.Address, input.Interface)

	// Step 3: Check for existing default routes
	checkRouteCmd := router.Command{
		Path:   "/ip/route/print",
		Action: "print",
		Args: map[string]string{
			"dst-address": "0.0.0.0/0",
		},
	}

	checkRouteResult, err := s.routerPort.ExecuteCommand(ctx, checkRouteCmd)
	if err != nil {
		log.Printf("[WANService] Warning: Failed to check existing routes: %v", err)
	}

	// Remove existing default routes (only one default route allowed)
	if checkRouteResult != nil && checkRouteResult.Success && len(checkRouteResult.Data) > 0 {
		log.Printf("[WANService] Removing %d existing default route(s)", len(checkRouteResult.Data))
		for _, item := range checkRouteResult.Data {
			if id, ok := item[".id"]; ok {
				removeRouteCmd := router.Command{
					Path:   "/ip/route/remove",
					Action: "remove",
					Args: map[string]string{
						".id": id,
					},
				}
				if _, err := s.routerPort.ExecuteCommand(ctx, removeRouteCmd); err != nil {
					log.Printf("[WANService] Warning: Failed to remove existing route: %v", err)
				}
			}
		}
	}

	// Step 4: Add default route
	addRouteCmd := router.Command{
		Path:   "/ip/route/add",
		Action: "add",
		Args: map[string]string{
			"gateway":     input.Gateway,
			"dst-address": "0.0.0.0/0",
		},
	}

	addRouteResult, err := s.routerPort.ExecuteCommand(ctx, addRouteCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to add default route: %w", err)
	}

	if !addRouteResult.Success {
		return nil, fmt.Errorf("default route configuration failed: %s", addRouteResult.Error)
	}

	log.Printf("[WANService] Default route added via gateway %s", input.Gateway)

	// Step 5: Configure DNS servers (if provided)
	if input.PrimaryDNS != "" {
		dnsServers := input.PrimaryDNS
		if input.SecondaryDNS != "" {
			dnsServers += "," + input.SecondaryDNS
		}

		setDNSCmd := router.Command{
			Path:   "/ip/dns/set",
			Action: "set",
			Args: map[string]string{
				"servers": dnsServers,
			},
		}

		dnsResult, err := s.routerPort.ExecuteCommand(ctx, setDNSCmd)
		if err != nil {
			log.Printf("[WANService] Warning: Failed to set DNS servers: %v", err)
		} else if !dnsResult.Success {
			log.Printf("[WANService] Warning: DNS configuration failed: %s", dnsResult.Error)
		} else {
			log.Printf("[WANService] DNS servers configured: %s", dnsServers)
		}
	}

	// Build WAN interface data
	wanData := &WANInterfaceData{
		ID:              fmt.Sprintf("wan-static-%s", input.Interface),
		InterfaceName:   input.Interface,
		ConnectionType:  "STATIC",
		Status:          "CONNECTED", // Static IP is always connected if configured
		PublicIP:        input.Address,
		Gateway:         input.Gateway,
		PrimaryDNS:      input.PrimaryDNS,
		SecondaryDNS:    input.SecondaryDNS,
		IsDefaultRoute:  true, // Static IP always adds default route
		HealthStatus:    "UNKNOWN",
		HealthEnabled:   false,
		LastConnected:   time.Now(),
	}

	// Static IP configuration data
	wanData.StaticConfig = &StaticIPConfigData{
		ID:           fmt.Sprintf("static-%s", input.Interface),
		Interface:    input.Interface,
		Address:      input.Address,
		Gateway:      input.Gateway,
		PrimaryDNS:   input.PrimaryDNS,
		SecondaryDNS: input.SecondaryDNS,
		Comment:      input.Comment,
	}

	// Invalidate cache
	s.cache.Invalidate(routerID)

	// Add to connection history
	historyEvent := &ConnectionEventData{
		ID:             fmt.Sprintf("event-%d", time.Now().UnixNano()),
		WANInterfaceID: wanData.ID,
		EventType:      "CONNECTED",
		Timestamp:      time.Now(),
		PublicIP:       input.Address,
		Gateway:        input.Gateway,
		Reason:         "Static IP configured",
	}
	s.history.Add(routerID, historyEvent)

	// Publish configured event
	event := events.NewWANConfiguredEvent(routerID, wanData.ID, input.Interface, "STATIC", true)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		log.Printf("[WANService] Failed to publish WAN configured event: %v", err)
	}

	// Publish status changed event
	statusEvent := events.NewWANStatusChangedEvent(routerID, wanData.ID, input.Interface, wanData.Status, "NONE", "STATIC")
	statusEvent.PublicIP = wanData.PublicIP
	statusEvent.Gateway = wanData.Gateway
	if err := s.eventBus.Publish(ctx, statusEvent); err != nil {
		log.Printf("[WANService] Failed to publish WAN status changed event: %v", err)
	}

	return wanData, nil
}

// ConfigureLTE configures LTE modem on a WAN interface.
func (s *WANService) ConfigureLTE(ctx context.Context, routerID string, input LteModemInput) (*WANInterfaceData, error) {
	log.Printf("[WANService] Configuring LTE modem on router %s, interface %s", routerID, input.Interface)
	// IMPORTANT: NEVER LOG PIN OR PASSWORD

	// Step 1: Configure LTE interface settings
	// RouterOS command: /interface/lte/set <interface> apn=<apn>
	setArgs := map[string]string{
		"apn": input.APN,
	}

	// Add PIN if provided (NEVER LOG THIS)
	if input.Pin != "" {
		setArgs["pin"] = input.Pin
	}

	// Add authentication if provided
	if input.AuthProtocol != "" && input.AuthProtocol != "none" {
		setArgs["auth-protocol"] = input.AuthProtocol
		if input.Username != "" {
			setArgs["user"] = input.Username
		}
		if input.Password != "" {
			setArgs["password"] = input.Password // NEVER LOG THIS
		}
	}

	// Add profile number
	if input.ProfileNumber > 0 {
		setArgs["profile"] = fmt.Sprintf("%d", input.ProfileNumber)
	}

	// Add MTU
	if input.MTU > 0 {
		setArgs["mtu"] = fmt.Sprintf("%d", input.MTU)
	}

	// Add comment
	if input.Comment != "" {
		setArgs["comment"] = input.Comment
	}

	setCmd := router.Command{
		Path:   "/interface/lte/set",
		Action: "set",
		Args:   setArgs,
	}

	// Find the LTE interface ID first
	findCmd := router.Command{
		Path:   "/interface/lte/print",
		Action: "print",
		Args: map[string]string{
			"name": input.Interface,
		},
	}

	findResult, err := s.routerPort.ExecuteCommand(ctx, findCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to find LTE interface: %w", err)
	}

	if !findResult.Success || len(findResult.Data) == 0 {
		return nil, fmt.Errorf("LTE interface %s not found", input.Interface)
	}

	// Get the .id for the set command
	lteID := findResult.Data[0][".id"]
	setArgs[".id"] = lteID

	// Execute configuration
	setResult, err := s.routerPort.ExecuteCommand(ctx, setCmd)
	if err != nil {
		return nil, fmt.Errorf("failed to configure LTE modem: %w", err)
	}

	if !setResult.Success {
		return nil, fmt.Errorf("LTE modem configuration failed: %s", setResult.Error)
	}

	log.Printf("[WANService] LTE modem configured successfully: %s", input.Interface)

	// Step 2: Enable/disable interface
	enableCmd := router.Command{
		Path:   "/interface/lte/set",
		Action: "set",
		Args: map[string]string{
			".id":      lteID,
			"disabled": boolToString(!input.Enabled),
		},
	}

	if _, err := s.routerPort.ExecuteCommand(ctx, enableCmd); err != nil {
		log.Printf("[WANService] Warning: Failed to enable/disable LTE interface: %v", err)
	}

	// Step 3: Configure default route if requested
	if input.IsDefaultRoute && input.Enabled {
		// Check for existing default routes
		checkRouteCmd := router.Command{
			Path:   "/ip/route/print",
			Action: "print",
			Args: map[string]string{
				"dst-address": "0.0.0.0/0",
			},
		}

		checkRouteResult, err := s.routerPort.ExecuteCommand(ctx, checkRouteCmd)
		if err != nil {
			log.Printf("[WANService] Warning: Failed to check existing routes: %v", err)
		}

		// Remove existing default routes
		if checkRouteResult != nil && checkRouteResult.Success && len(checkRouteResult.Data) > 0 {
			log.Printf("[WANService] Removing %d existing default route(s)", len(checkRouteResult.Data))
			for _, item := range checkRouteResult.Data {
				if id, ok := item[".id"]; ok {
					removeRouteCmd := router.Command{
						Path:   "/ip/route/remove",
						Action: "remove",
						Args: map[string]string{
							".id": id,
						},
					}
					if _, err := s.routerPort.ExecuteCommand(ctx, removeRouteCmd); err != nil {
						log.Printf("[WANService] Warning: Failed to remove existing route: %v", err)
					}
				}
			}
		}

		// Add default route via LTE interface
		addRouteCmd := router.Command{
			Path:   "/ip/route/add",
			Action: "add",
			Args: map[string]string{
				"gateway":     input.Interface, // LTE uses interface as gateway
				"dst-address": "0.0.0.0/0",
			},
		}

		if _, err := s.routerPort.ExecuteCommand(ctx, addRouteCmd); err != nil {
			log.Printf("[WANService] Warning: Failed to add default route: %v", err)
		}
	}

	// Step 4: Wait briefly for LTE to connect
	time.Sleep(2 * time.Second)

	// Step 5: Fetch LTE status
	statusCmd := router.Command{
		Path:   "/interface/lte/monitor",
		Action: "print",
		Args: map[string]string{
			"interface": input.Interface,
			"once":      "yes",
		},
	}

	statusResult, err := s.routerPort.ExecuteCommand(ctx, statusCmd)
	if err != nil {
		log.Printf("[WANService] Warning: Failed to fetch LTE status: %v", err)
	}

	// Build WAN interface data
	wanData := &WANInterfaceData{
		ID:             fmt.Sprintf("wan-lte-%s", input.Interface),
		InterfaceName:  input.Interface,
		ConnectionType: "LTE",
		Status:         "CONNECTING",
		IsDefaultRoute: input.IsDefaultRoute,
		HealthStatus:   "UNKNOWN",
		HealthEnabled:  false,
		LastConnected:  time.Now(),
	}

	// LTE modem data
	lteData := &LteModemData{
		ID:            lteID,
		Name:          input.Interface,
		APN:           input.APN,
		Running:       input.Enabled,
		PinConfigured: input.Pin != "",
		Comment:       input.Comment,
	}

	// Parse LTE status if available
	if statusResult != nil && statusResult.Success && len(statusResult.Data) > 0 {
		lteStatus := statusResult.Data[0]

		// Parse signal strength (RSSI in dBm)
		if rssiStr, ok := lteStatus["rssi"]; ok {
			if rssi, err := parseSignalStrength(rssiStr); err == nil {
				lteData.SignalStrength = rssi
			}
		}

		// Parse operator name
		if operator, ok := lteStatus["current-operator"]; ok {
			lteData.Operator = operator
		}

		// Parse network type (LTE, 3G, 2G)
		if netType, ok := lteStatus["access-technology"]; ok {
			lteData.NetworkType = netType
		}

		// Determine connection status
		if sessionStatus, ok := lteStatus["session-status"]; ok {
			if sessionStatus == "established" {
				wanData.Status = "CONNECTED"
			} else if sessionStatus == "connecting" {
				wanData.Status = "CONNECTING"
			} else {
				wanData.Status = "DISCONNECTED"
			}
		}

		// Get IP address if connected
		if ipStr, ok := lteStatus["ip-address"]; ok {
			wanData.PublicIP = ipStr
		}
	}

	wanData.LteModem = lteData

	// Invalidate cache
	s.cache.Invalidate(routerID)

	// Add to connection history
	historyEvent := &ConnectionEventData{
		ID:             fmt.Sprintf("event-%d", time.Now().UnixNano()),
		WANInterfaceID: wanData.ID,
		EventType:      "CONNECTED",
		Timestamp:      time.Now(),
		PublicIP:       wanData.PublicIP,
		Reason:         "LTE modem configured",
	}
	s.history.Add(routerID, historyEvent)

	// Publish configured event
	event := events.NewWANConfiguredEvent(routerID, wanData.ID, input.Interface, "LTE", input.IsDefaultRoute)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		log.Printf("[WANService] Failed to publish WAN configured event: %v", err)
	}

	// Publish status changed event
	statusEvent := events.NewWANStatusChangedEvent(routerID, wanData.ID, input.Interface, wanData.Status, "NONE", "LTE")
	statusEvent.PublicIP = wanData.PublicIP
	if err := s.eventBus.Publish(ctx, statusEvent); err != nil {
		log.Printf("[WANService] Failed to publish WAN status changed event: %v", err)
	}

	return wanData, nil
}

// ConfigureHealthCheck configures health check for a WAN interface.
func (s *WANService) ConfigureHealthCheck(ctx context.Context, routerID, wanInterfaceID string, input HealthCheckInput) error {
	log.Printf("[WANService] Configuring health check on router %s, WAN interface %s, target %s", routerID, wanInterfaceID, input.Target)

	// TODO: Implement health check configuration via RouterPort
	// RouterOS command: /tool/netwatch/add host=<target> interval=<interval>s timeout=3s

	// Invalidate cache
	s.cache.Invalidate(routerID)

	return fmt.Errorf("not implemented yet - Phase 5")
}

// DeleteWANConfiguration deletes WAN configuration (reverts to unconfigured).
func (s *WANService) DeleteWANConfiguration(ctx context.Context, routerID, wanInterfaceID string) error {
	log.Printf("[WANService] Deleting WAN configuration on router %s, WAN interface %s", routerID, wanInterfaceID)

	// Get WAN interface first to determine type
	wan, err := s.GetWANInterface(ctx, routerID, wanInterfaceID)
	if err != nil {
		return err
	}

	// TODO: Implement deletion based on connection type
	// DHCP: /ip/dhcp-client/remove [find interface=<interface>]
	// PPPoE: /interface/pppoe-client/remove [find name=<name>]
	// Static: /ip/address/remove [find interface=<interface>] + /ip/route/remove [find gateway=<gateway>]
	// LTE: /interface/lte/set <name> disabled=yes

	// Invalidate cache
	s.cache.Invalidate(routerID)

	// Publish event
	event := events.NewWANDeletedEvent(routerID, wanInterfaceID, wan.InterfaceName, wan.ConnectionType)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		log.Printf("[WANService] Failed to publish WAN deleted event: %v", err)
	}

	return fmt.Errorf("not implemented yet")
}

// GetConnectionHistory retrieves connection history for a WAN interface.
func (s *WANService) GetConnectionHistory(ctx context.Context, routerID, wanInterfaceID string, limit int) ([]*ConnectionEventData, error) {
	log.Printf("[WANService] Retrieving connection history for router %s, WAN interface %s", routerID, wanInterfaceID)

	events := s.history.Get(routerID, limit)
	if events == nil {
		return []*ConnectionEventData{}, nil
	}

	// Filter by WAN interface ID
	filtered := make([]*ConnectionEventData, 0)
	for _, event := range events {
		if event.WANInterfaceID == wanInterfaceID {
			filtered = append(filtered, event)
		}
	}

	return filtered, nil
}

// Input types for service methods
type DhcpClientInput struct {
	Interface       string
	AddDefaultRoute bool
	UsePeerDNS      bool
	UsePeerNTP      bool
	Comment         string
}

type PppoeClientInput struct {
	Name            string
	Interface       string
	Username        string
	Password        string // NEVER LOG THIS
	ServiceName     string
	AddDefaultRoute bool
	UsePeerDNS      bool
	MTU             int
	MRU             int
	Comment         string
}

type StaticIPInput struct {
	Interface    string
	Address      string // CIDR notation
	Gateway      string
	PrimaryDNS   string
	SecondaryDNS string
	Comment      string
}

type LteModemInput struct {
	Interface       string
	APN             string
	Pin             string // NEVER LOG THIS
	Username        string
	Password        string // NEVER LOG THIS
	AuthProtocol    string // "none", "pap", "chap"
	IsDefaultRoute  bool
	Enabled         bool
	MTU             int
	ProfileNumber   int
	Comment         string
}

type HealthCheckInput struct {
	Target   string
	Interval int  // seconds
	Enabled  bool
}

// =============================================================================
// Helper Functions
// =============================================================================

// boolToString converts a boolean to "yes" or "no" for RouterOS.
func boolToString(b bool) string {
	if b {
		return "yes"
	}
	return "no"
}

// parseDuration parses RouterOS duration strings (e.g., "1d2h3m4s", "5w6d").
func parseDuration(s string) (time.Duration, error) {
	if s == "" || s == "never" {
		return 0, nil
	}

	// RouterOS uses format like "23h59m59s" or "6d23h"
	// Parse weeks (w), days (d), hours (h), minutes (m), seconds (s)
	var duration time.Duration
	var num int
	var unit rune

	for i, char := range s {
		if char >= '0' && char <= '9' {
			num = num*10 + int(char-'0')
		} else {
			unit = char
			switch unit {
			case 'w':
				duration += time.Duration(num) * 7 * 24 * time.Hour
			case 'd':
				duration += time.Duration(num) * 24 * time.Hour
			case 'h':
				duration += time.Duration(num) * time.Hour
			case 'm':
				duration += time.Duration(num) * time.Minute
			case 's':
				duration += time.Duration(num) * time.Second
			default:
				return 0, fmt.Errorf("unknown duration unit: %c in position %d", unit, i)
			}
			num = 0
		}
	}

	return duration, nil
}

// parseSignalStrength parses signal strength from dBm string (e.g., "-75dBm" -> -75).
func parseSignalStrength(s string) (int, error) {
	if s == "" {
		return 0, fmt.Errorf("empty signal strength")
	}

	// Remove "dBm" suffix if present
	s = strings.TrimSpace(s)
	s = strings.TrimSuffix(s, "dBm")
	s = strings.TrimSuffix(s, " dBm")
	s = strings.TrimSpace(s)

	// Parse as integer
	val, err := fmt.Sscanf(s, "%d")
	if err != nil {
		return 0, fmt.Errorf("failed to parse signal strength: %w", err)
	}

	return val, nil
}

// ConfigureWANHealthCheck configures health monitoring for a WAN interface.
func (s *WANService) ConfigureWANHealthCheck(ctx context.Context, routerID, wanID string, input HealthCheckInput) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Build health check configuration
	config := WANHealthCheckConfig{
		Enabled:          input.Enabled,
		Targets:          []string{input.Target},
		Interval:         input.Interval,
		Timeout:          2, // Default 2 second timeout
		FailureThreshold: 3, // Default 3 consecutive failures
	}

	// Configure health monitoring via health monitor
	if err := s.healthMonitor.ConfigureHealthCheck(ctx, routerID, wanID, config); err != nil {
		return fmt.Errorf("failed to configure health check: %w", err)
	}

	// Invalidate cache to force refresh on next query
	s.cache.Invalidate(routerID)

	// Publish WANConfiguredEvent (health check is a form of configuration)
	event := events.NewWANConfiguredEvent(
		routerID,
		wanID,
		"", // Interface name
		"HEALTH_CHECK",
		false,
	)

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
