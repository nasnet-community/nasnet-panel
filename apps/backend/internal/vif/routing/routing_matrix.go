// Package vif implements the Routing Matrix Service for device-to-service routing.
// The service discovers network devices via DHCP and ARP, merges them by MAC address,
// and provides a unified view of available routing targets.
package routing

import (
	"context"
	"fmt"
	"strings"

	"backend/generated/ent"
	"backend/generated/ent/virtualinterface"

	"backend/internal/router"
)

// RoutingMatrixService provides device discovery and routing matrix queries.
type RoutingMatrixService struct { //nolint:revive // stuttering name kept for clarity as the primary exported type in the routing package
	routerPort router.RouterPort
	client     *ent.Client
}

// NewRoutingMatrixService creates a new routing matrix service.
func NewRoutingMatrixService(routerPort router.RouterPort, client *ent.Client) *RoutingMatrixService {
	return &RoutingMatrixService{
		routerPort: routerPort,
		client:     client,
	}
}

// NetworkDevice represents a discovered network device.
type NetworkDevice struct {
	MacAddress  string `json:"macAddress"`
	IPAddress   string `json:"ipAddress"`
	Hostname    string `json:"hostname"`
	Source      string `json:"source"` // "dhcp", "arp", or "both"
	Active      bool   `json:"active"`
	DHCPLease   bool   `json:"dhcpLease"`
	ARPEntry    bool   `json:"arpEntry"`
	DeviceID    string `json:"deviceId"`    // Generated from MAC
	IsRouted    bool   `json:"isRouted"`    // Has routing assignment
	RoutingMark string `json:"routingMark"` // Current routing mark (if assigned)
}

// VirtualInterfaceInfo represents a virtual interface available for routing.
type VirtualInterfaceInfo struct {
	ID            string `json:"id"`
	InstanceID    string `json:"instanceId"`
	InstanceName  string `json:"instanceName"`
	InterfaceName string `json:"interfaceName"`
	VlanID        int    `json:"vlanId"`
	IPAddress     string `json:"ipAddress"`
	RoutingMark   string `json:"routingMark"`
	Status        string `json:"status"`
	GatewayType   string `json:"gatewayType"`
	GatewayStatus string `json:"gatewayStatus"`
}

// DeviceRoutingInfo represents an active routing assignment.
type DeviceRoutingInfo struct {
	ID          string `json:"id"`
	DeviceID    string `json:"deviceId"`
	MacAddress  string `json:"macAddress"`
	RoutingMark string `json:"routingMark"`
	InstanceID  string `json:"instanceId"`
}

// DeviceRoutingMatrix contains the full routing matrix data.
type DeviceRoutingMatrix struct {
	Devices    []*NetworkDevice          `json:"devices"`
	Interfaces []*VirtualInterfaceInfo   `json:"interfaces"`
	Routings   []*DeviceRoutingInfo      `json:"routings"`
	Summary    *DeviceRoutingMatrixStats `json:"summary"`
}

// DeviceRoutingMatrixStats contains summary statistics.
type DeviceRoutingMatrixStats struct {
	TotalDevices     int `json:"totalDevices"`
	RoutedDevices    int `json:"routedDevices"`
	UnroutedDevices  int `json:"unroutedDevices"`
	ActiveInterfaces int `json:"activeInterfaces"`
	DHCPDevices      int `json:"dhcpDevices"`
	ARPOnlyDevices   int `json:"arpOnlyDevices"`
	ActiveRoutings   int `json:"activeRoutings"`
}

// GetDeviceRoutingMatrix queries and assembles the complete routing matrix.
// This includes:
// 1. Network device discovery (DHCP + ARP)
// 2. Active virtual interfaces
// 3. Current routing assignments
func (s *RoutingMatrixService) GetDeviceRoutingMatrix(ctx context.Context) (*DeviceRoutingMatrix, error) {
	matrix := &DeviceRoutingMatrix{
		Summary: &DeviceRoutingMatrixStats{},
	}

	// Step 1: Discover network devices (DHCP + ARP)
	devices, err := s.discoverNetworkDevices(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to discover network devices: %w", err)
	}
	matrix.Devices = devices

	// Step 2: Query active virtual interfaces
	interfaces, err := s.queryActiveInterfaces(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query virtual interfaces: %w", err)
	}
	matrix.Interfaces = interfaces

	// Step 3: Query current routing assignments
	routings, err := s.queryRoutingAssignments(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query routing assignments: %w", err)
	}
	matrix.Routings = routings

	// Step 4: Cross-reference devices with routings
	s.enrichDevicesWithRoutings(matrix.Devices, matrix.Routings)

	// Step 5: Calculate summary statistics
	s.calculateSummary(matrix)

	return matrix, nil
}

// discoverNetworkDevices queries DHCP leases and ARP table, then merges by MAC address.
func (s *RoutingMatrixService) discoverNetworkDevices(ctx context.Context) ([]*NetworkDevice, error) {
	// Step 1: Query DHCP leases
	dhcpDevices, err := s.queryDHCPLeases(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query DHCP leases: %w", err)
	}

	// Step 2: Query ARP table
	arpDevices, err := s.queryARPTable(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query ARP table: %w", err)
	}

	// Step 3: Merge by MAC address
	devices := s.mergeDevicesByMAC(dhcpDevices, arpDevices)

	return devices, nil
}

// queryDHCPLeases queries the DHCP server lease table.
func (s *RoutingMatrixService) queryDHCPLeases(ctx context.Context) (map[string]*NetworkDevice, error) {
	query := router.StateQuery{
		Path:   "/ip/dhcp-server/lease",
		Fields: []string{"mac-address", "address", "host-name", "status", "active"},
	}

	result, err := s.routerPort.QueryState(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query DHCP leases: %w", err)
	}

	devices := make(map[string]*NetworkDevice)
	for _, lease := range result.Resources {
		macAddr := strings.ToLower(lease["mac-address"])
		if macAddr == "" {
			continue
		}

		device := &NetworkDevice{
			MacAddress: macAddr,
			IPAddress:  lease["address"],
			Hostname:   lease["host-name"],
			Source:     "dhcp",
			Active:     lease["active"] == "true" || lease["status"] == "bound",
			DHCPLease:  true,
			ARPEntry:   false,
			DeviceID:   s.macToDeviceID(macAddr),
		}

		devices[macAddr] = device
	}

	return devices, nil
}

// queryARPTable queries the ARP table.
func (s *RoutingMatrixService) queryARPTable(ctx context.Context) (map[string]*NetworkDevice, error) {
	query := router.StateQuery{
		Path:   "/ip/arp",
		Fields: []string{"mac-address", "address", "interface", "complete"},
	}

	result, err := s.routerPort.QueryState(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query ARP table: %w", err)
	}

	devices := make(map[string]*NetworkDevice)
	for _, arpEntry := range result.Resources {
		macAddr := strings.ToLower(arpEntry["mac-address"])
		if macAddr == "" {
			continue
		}

		device := &NetworkDevice{
			MacAddress: macAddr,
			IPAddress:  arpEntry["address"],
			Hostname:   "", // ARP doesn't have hostnames
			Source:     "arp",
			Active:     arpEntry["complete"] == "true",
			DHCPLease:  false,
			ARPEntry:   true,
			DeviceID:   s.macToDeviceID(macAddr),
		}

		devices[macAddr] = device
	}

	return devices, nil
}

// mergeDevicesByMAC merges DHCP and ARP device lists by MAC address.
// DHCP data is authoritative for hostnames.
func (s *RoutingMatrixService) mergeDevicesByMAC(
	dhcpDevices map[string]*NetworkDevice,
	arpDevices map[string]*NetworkDevice,
) []*NetworkDevice {
	// Start with DHCP devices (authoritative for hostnames)
	deviceMap := make(map[string]*NetworkDevice)
	for mac, device := range dhcpDevices {
		deviceMap[mac] = device
	}

	// Merge ARP entries
	for mac, arpDevice := range arpDevices {
		if existing, found := deviceMap[mac]; found {
			// Device exists in both - merge data
			existing.ARPEntry = true
			existing.Source = "both"
			// Prefer DHCP active status, but consider ARP as fallback
			if !existing.Active {
				existing.Active = arpDevice.Active
			}
			// Use ARP IP if DHCP IP is empty
			if existing.IPAddress == "" {
				existing.IPAddress = arpDevice.IPAddress
			}
		} else {
			// Device only in ARP
			deviceMap[mac] = arpDevice
		}
	}

	// Convert map to slice
	devices := make([]*NetworkDevice, 0, len(deviceMap))
	for _, device := range deviceMap {
		devices = append(devices, device)
	}

	return devices
}

// queryActiveInterfaces queries active virtual interfaces from the database.
func (s *RoutingMatrixService) queryActiveInterfaces(ctx context.Context) ([]*VirtualInterfaceInfo, error) {
	// Query VirtualInterface entities with status="active"
	vifs, err := s.client.VirtualInterface.
		Query().
		Where(virtualinterface.StatusEQ(virtualinterface.StatusActive)).
		WithInstance(). // Load related ServiceInstance
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query virtual interfaces: %w", err)
	}

	interfaces := make([]*VirtualInterfaceInfo, 0, len(vifs))
	for _, vif := range vifs {
		info := &VirtualInterfaceInfo{
			ID:            vif.ID,
			InstanceID:    vif.InstanceID,
			InterfaceName: vif.InterfaceName,
			VlanID:        vif.VlanID,
			IPAddress:     vif.IPAddress,
			RoutingMark:   vif.RoutingMark,
			Status:        string(vif.Status),
			GatewayType:   string(vif.GatewayType),
			GatewayStatus: string(vif.GatewayStatus),
		}

		// Get instance name from edge if available
		if edges := vif.Edges.Instance; edges != nil {
			info.InstanceName = edges.InstanceName
		}

		interfaces = append(interfaces, info)
	}

	return interfaces, nil
}

// queryRoutingAssignments queries current device routing assignments.
func (s *RoutingMatrixService) queryRoutingAssignments(ctx context.Context) ([]*DeviceRoutingInfo, error) {
	// Query DeviceRouting entities
	routings, err := s.client.DeviceRouting.
		Query().
		All(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return []*DeviceRoutingInfo{}, nil
		}
		return nil, fmt.Errorf("failed to query device routings: %w", err)
	}

	routingInfos := make([]*DeviceRoutingInfo, 0, len(routings))
	for _, routing := range routings {
		info := &DeviceRoutingInfo{
			ID:          routing.ID,
			DeviceID:    routing.DeviceID,
			MacAddress:  routing.MACAddress,
			RoutingMark: routing.RoutingMark,
			InstanceID:  routing.InstanceID,
		}
		routingInfos = append(routingInfos, info)
	}

	return routingInfos, nil
}

// enrichDevicesWithRoutings cross-references devices with routing assignments.
func (s *RoutingMatrixService) enrichDevicesWithRoutings(
	devices []*NetworkDevice,
	routings []*DeviceRoutingInfo,
) {
	// Create routing lookup map by device ID
	routingByDeviceID := make(map[string]*DeviceRoutingInfo)
	for _, routing := range routings {
		routingByDeviceID[routing.DeviceID] = routing
	}

	// Enrich devices with routing info
	for _, device := range devices {
		if routing, found := routingByDeviceID[device.DeviceID]; found {
			device.IsRouted = true
			device.RoutingMark = routing.RoutingMark
		}
	}
}

// calculateSummary computes summary statistics for the matrix.
func (s *RoutingMatrixService) calculateSummary(matrix *DeviceRoutingMatrix) {
	stats := matrix.Summary

	stats.TotalDevices = len(matrix.Devices)
	stats.ActiveInterfaces = len(matrix.Interfaces)
	stats.ActiveRoutings = len(matrix.Routings)

	for _, device := range matrix.Devices {
		if device.IsRouted {
			stats.RoutedDevices++
		} else {
			stats.UnroutedDevices++
		}

		if device.DHCPLease {
			stats.DHCPDevices++
		}
		if device.ARPEntry && !device.DHCPLease {
			stats.ARPOnlyDevices++
		}
	}
}

// macToDeviceID converts a MAC address to a device ID.
// Simple implementation: remove colons and prefix with "dev-"
func (s *RoutingMatrixService) macToDeviceID(macAddr string) string {
	// Remove colons and use as device ID
	normalized := strings.ReplaceAll(macAddr, ":", "")
	normalized = strings.ReplaceAll(normalized, "-", "")
	return "dev-" + normalized
}
