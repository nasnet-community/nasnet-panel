package resolver

// This file contains device routing helper/conversion functions.
// Query, mutation, and subscription resolvers are in device_routing.resolvers.go.

import (
	"backend/graph/model"

	"backend/generated/ent"
	"backend/internal/vif/routing"
)

// convertDeviceRoutingMatrix converts internal matrix to GraphQL model.
func convertDeviceRoutingMatrix(matrix *routing.DeviceRoutingMatrix) *model.DeviceRoutingMatrix {
	result := &model.DeviceRoutingMatrix{
		Devices:    make([]*model.NetworkDevice, len(matrix.Devices)),
		Interfaces: make([]*model.VirtualInterfaceInfo, len(matrix.Interfaces)),
		Routings:   make([]*model.DeviceRouting, len(matrix.Routings)),
		Summary:    convertMatrixStats(matrix.Summary),
	}

	for i, d := range matrix.Devices {
		result.Devices[i] = convertNetworkDevice(d)
	}

	for i, iface := range matrix.Interfaces {
		result.Interfaces[i] = convertVirtualInterfaceInfo(iface)
	}

	for i, r := range matrix.Routings {
		result.Routings[i] = convertDeviceRoutingInfo(r)
	}

	return result
}

// convertNetworkDevice converts internal device to GraphQL model.
func convertNetworkDevice(device *routing.NetworkDevice) *model.NetworkDevice {
	ipAddr := ""
	if device.IPAddress != "" {
		ipAddr = device.IPAddress
	}

	hostname := ""
	if device.Hostname != "" {
		hostname = device.Hostname
	}

	routingMark := ""
	if device.RoutingMark != "" {
		routingMark = device.RoutingMark
	}

	return &model.NetworkDevice{
		DeviceID:    device.DeviceID,
		MacAddress:  device.MacAddress,
		IPAddress:   &ipAddr,
		Hostname:    &hostname,
		Source:      device.Source,
		Active:      device.Active,
		DhcpLease:   device.DHCPLease,
		ArpEntry:    device.ARPEntry,
		IsRouted:    device.IsRouted,
		RoutingMark: &routingMark,
	}
}

// convertVirtualInterfaceInfo converts internal interface info to GraphQL model.
func convertVirtualInterfaceInfo(iface *routing.VirtualInterfaceInfo) *model.VirtualInterfaceInfo {
	return &model.VirtualInterfaceInfo{
		ID:            iface.ID,
		InstanceID:    iface.InstanceID,
		InstanceName:  iface.InstanceName,
		InterfaceName: iface.InterfaceName,
		VlanID:        iface.VlanID,
		IPAddress:     iface.IPAddress,
		RoutingMark:   iface.RoutingMark,
		Status:        iface.Status,
		GatewayType:   iface.GatewayType,
		GatewayStatus: iface.GatewayStatus,
	}
}

// convertDeviceRoutingInfo converts internal routing info to GraphQL model.
func convertDeviceRoutingInfo(info *routing.DeviceRoutingInfo) *model.DeviceRouting {
	return &model.DeviceRouting{
		ID:          info.ID,
		DeviceID:    info.DeviceID,
		MacAddress:  info.MacAddress,
		RoutingMark: info.RoutingMark,
		InstanceID:  info.InstanceID,
		// Note: Other fields would be populated from full ent query
	}
}

// convertDeviceRouting converts ent DeviceRouting to GraphQL model.
func convertDeviceRouting(r *ent.DeviceRouting) *model.DeviceRouting {
	deviceIP := ""
	if r.DeviceIP != "" {
		deviceIP = r.DeviceIP
	}

	deviceName := ""
	if r.DeviceName != "" {
		deviceName = r.DeviceName
	}

	routingMode := model.RoutingModeMac
	if r.RoutingMode == "ip" {
		routingMode = model.RoutingModeIP
	}

	// Map kill switch mode from DB to GraphQL enum
	var killSwitchMode model.KillSwitchMode
	//nolint:exhaustive // string value switch, default handles all cases
	switch r.KillSwitchMode {
	case "block_all":
		killSwitchMode = model.KillSwitchModeBlockAll
	case "fallback_service":
		killSwitchMode = model.KillSwitchModeFallbackService
	case "allow_direct":
		killSwitchMode = model.KillSwitchModeAllowDirect
	default:
		killSwitchMode = model.KillSwitchModeBlockAll // default to BlockAll
	}

	return &model.DeviceRouting{
		ID:                            r.ID,
		DeviceID:                      r.DeviceID,
		MacAddress:                    r.MACAddress,
		DeviceIP:                      &deviceIP,
		DeviceName:                    &deviceName,
		InstanceID:                    r.InstanceID,
		InterfaceID:                   r.InterfaceID,
		RoutingMark:                   r.RoutingMark,
		RoutingMode:                   routingMode,
		Active:                        r.Active,
		MangleRuleID:                  r.MangleRuleID,
		KillSwitchEnabled:             r.KillSwitchEnabled,
		KillSwitchMode:                killSwitchMode,
		KillSwitchActive:              r.KillSwitchActive,
		KillSwitchActivatedAt:         r.KillSwitchActivatedAt,
		KillSwitchFallbackInterfaceID: &r.KillSwitchFallbackInterfaceID,
		KillSwitchRuleID:              &r.KillSwitchRuleID,
		CreatedAt:                     r.CreatedAt,
		UpdatedAt:                     r.UpdatedAt,
	}
}

// convertMatrixStats converts internal stats to GraphQL model.
func convertMatrixStats(stats *routing.DeviceRoutingMatrixStats) *model.DeviceRoutingMatrixStats {
	return &model.DeviceRoutingMatrixStats{
		TotalDevices:     stats.TotalDevices,
		RoutedDevices:    stats.RoutedDevices,
		UnroutedDevices:  stats.UnroutedDevices,
		ActiveInterfaces: stats.ActiveInterfaces,
		DhcpDevices:      stats.DHCPDevices,
		ArpOnlyDevices:   stats.ARPOnlyDevices,
		ActiveRoutings:   stats.ActiveRoutings,
	}
}

// convertBulkRoutingResult converts engine results to GraphQL model.
func convertBulkRoutingResult(results []*routing.DeviceRoutingAssignment) *model.BulkRoutingResult {
	successes := make([]*model.DeviceRouting, 0)
	failures := make([]*model.BulkRoutingFailure, 0)
	successCount := 0
	failureCount := 0

	for _, result := range results {
		if result.Success {
			successCount++
			// Would need to query DB to get full DeviceRouting record
		} else {
			failureCount++
			failures = append(failures, &model.BulkRoutingFailure{
				DeviceID:     result.DeviceID,
				MacAddress:   result.MacAddress,
				ErrorMessage: result.Error.Error(),
			})
		}
	}

	return &model.BulkRoutingResult{
		SuccessCount: successCount,
		FailureCount: failureCount,
		Successes:    successes,
		Failures:     failures,
	}
}
