// Package services contains business logic services for NasNetConnect.
// This file provides backward-compatible type aliases for sub-packages
// (bridge, wan, netif, svcalert) so that existing importers continue to work.
// It also contains shared helper functions used across service files.
package services

import (
	"fmt"
	"time"

	"backend/internal/services/bridge"
	"backend/internal/services/netif"
	"backend/internal/services/svcalert"
	"backend/internal/services/wan"
)

// ---------------------------------------------------------------------------
// Bridge sub-package aliases
// ---------------------------------------------------------------------------

type BridgeService = bridge.BridgeService
type BridgeServiceConfig = bridge.BridgeServiceConfig
type BridgeData = bridge.BridgeData
type BridgePortData = bridge.BridgePortData
type BridgeVlanData = bridge.BridgeVlanData
type BridgeStpStatusData = bridge.BridgeStpStatusData
type BridgeImpact = bridge.BridgeImpact
type UndoStore = bridge.UndoStore
type UndoOperation = bridge.UndoOperation
type CreateBridgeInput = bridge.CreateBridgeInput
type UpdateBridgeInput = bridge.UpdateBridgeInput
type AddBridgePortInput = bridge.AddBridgePortInput
type UpdateBridgePortInput = bridge.UpdateBridgePortInput
type CreateBridgeVlanInput = bridge.CreateBridgeVlanInput

var NewBridgeService = bridge.NewBridgeService
var NewUndoStore = bridge.NewUndoStore

// ---------------------------------------------------------------------------
// WAN sub-package aliases
// ---------------------------------------------------------------------------

type WANService = wan.WANService
type WANServiceConfig = wan.WANServiceConfig
type WANInterfaceData = wan.WANInterfaceData
type DhcpClientData = wan.DhcpClientData
type PppoeClientData = wan.PppoeClientData
type StaticIPConfigData = wan.StaticIPConfigData
type LteModemData = wan.LteModemData
type ConnectionEventData = wan.ConnectionEventData
type DhcpClientInput = wan.DhcpClientInput
type PppoeClientInput = wan.PppoeClientInput
type StaticIPInput = wan.StaticIPInput
type LteModemInput = wan.LteModemInput
type HealthCheckInput = wan.HealthCheckInput
type WANHealthStatus = wan.WANHealthStatus
type HealthCheckTarget = wan.HealthCheckTarget
type WANHealthCheckConfig = wan.WANHealthCheckConfig
type WANHealthMonitor = wan.WANHealthMonitor

var NewWANService = wan.NewWANService
var NewWANHealthMonitor = wan.NewWANHealthMonitor

// WANHealthStatus constants.
const (
	WANHealthStatusHealthy  = wan.WANHealthStatusHealthy
	WANHealthStatusDegraded = wan.WANHealthStatusDegraded
	WANHealthStatusDown     = wan.WANHealthStatusDown
	WANHealthStatusUnknown  = wan.WANHealthStatusUnknown
)

// ---------------------------------------------------------------------------
// Netif (interface + IP address) sub-package aliases
// ---------------------------------------------------------------------------

type InterfaceService = netif.InterfaceService
type InterfaceServiceConfig = netif.InterfaceServiceConfig
type InterfaceData = netif.InterfaceData
type UpdateInterfaceInput = netif.UpdateInterfaceInput
type InterfaceOperationError = netif.InterfaceOperationError
type BatchAction = netif.BatchAction

const (
	BatchActionEnable  = netif.BatchActionEnable
	BatchActionDisable = netif.BatchActionDisable
	BatchActionUpdate  = netif.BatchActionUpdate
)

var NewInterfaceService = netif.NewInterfaceService

type IPAddressService = netif.IPAddressService
type IPAddressServiceConfig = netif.IPAddressServiceConfig
type IPAddressData = netif.IPAddressData
type ConflictResult = netif.ConflictResult
type IPConflict = netif.IPConflict
type DependencyResult = netif.DependencyResult
type DHCPServerInfo = netif.DHCPServerInfo
type RouteInfo = netif.RouteInfo
type NATRuleInfo = netif.NATRuleInfo
type FirewallRuleInfo = netif.FirewallRuleInfo

var NewIPAddressService = netif.NewIPAddressService

// ---------------------------------------------------------------------------
// Alert sub-package aliases (svcalert)
// ---------------------------------------------------------------------------

type AlertService = svcalert.AlertService
type AlertServiceConfig = svcalert.AlertServiceConfig
type EscalationCanceller = svcalert.EscalationCanceller
type DigestService = svcalert.DigestService
type DigestPayload = svcalert.DigestPayload
type DigestSummary = svcalert.DigestSummary
type EngineInterface = svcalert.EngineInterface
type ThrottleManagerInterface = svcalert.ThrottleManagerInterface
type StormDetectorInterface = svcalert.StormDetectorInterface
type ThrottleStatusData = svcalert.ThrottleStatusData
type ThrottleGroupStatusData = svcalert.ThrottleGroupStatusData
type StormStatusData = svcalert.StormStatusData
type CreateAlertRuleInput = svcalert.CreateAlertRuleInput
type UpdateAlertRuleInput = svcalert.UpdateAlertRuleInput
type AcknowledgeAlertInput = svcalert.AcknowledgeAlertInput
type ThrottleStatus = svcalert.ThrottleStatus
type ThrottleGroupStatus = svcalert.ThrottleGroupStatus
type StormStatus = svcalert.StormStatus
type StormRuleContribution = svcalert.StormRuleContribution
type AlertTemplate = svcalert.AlertTemplate
type TemplateVariable = svcalert.TemplateVariable
type ChannelType = svcalert.ChannelType
type PreviewResult = svcalert.PreviewResult
type ValidationInfo = svcalert.ValidationInfo
type AlertTemplateService = svcalert.AlertTemplateService
type AlertTemplateServiceConfig = svcalert.AlertTemplateServiceConfig

var NewAlertService = svcalert.NewAlertService
var NewAlertTemplateService = svcalert.NewAlertTemplateService

// ChannelType constants.
const (
	ChannelEmail    = svcalert.ChannelEmail
	ChannelTelegram = svcalert.ChannelTelegram
	ChannelPushover = svcalert.ChannelPushover
	ChannelWebhook  = svcalert.ChannelWebhook
	ChannelInApp    = svcalert.ChannelInApp
)

// Common event type constants.
const (
	EventRouterOffline         = svcalert.EventRouterOffline
	EventRouterOnline          = svcalert.EventRouterOnline
	EventRouterReboot          = svcalert.EventRouterReboot
	EventRouterConfigError     = svcalert.EventRouterConfigError
	EventInterfaceDown         = svcalert.EventInterfaceDown
	EventInterfaceUp           = svcalert.EventInterfaceUp
	EventInterfaceHighTraffic  = svcalert.EventInterfaceHighTraffic
	EventInterfaceErrors       = svcalert.EventInterfaceErrors
	EventCPUHigh               = svcalert.EventCPUHigh
	EventMemoryHigh            = svcalert.EventMemoryHigh
	EventDiskFull              = svcalert.EventDiskFull
	EventTemperatureHigh       = svcalert.EventTemperatureHigh
	EventVPNDisconnected       = svcalert.EventVPNDisconnected
	EventVPNConnected          = svcalert.EventVPNConnected
	EventVPNAuthFailed         = svcalert.EventVPNAuthFailed
	EventWANDown               = svcalert.EventWANDown
	EventWANUp                 = svcalert.EventWANUp
	EventDHCPLeaseExpired      = svcalert.EventDHCPLeaseExpired
	EventFirewallBlockedIP     = svcalert.EventFirewallBlockedIP
	EventFirewallRuleTriggered = svcalert.EventFirewallRuleTriggered
	EventSSHFailedLogin        = svcalert.EventSSHFailedLogin
	EventPortScanDetected      = svcalert.EventPortScanDetected
	EventServiceDown           = svcalert.EventServiceDown
	EventServiceUp             = svcalert.EventServiceUp
	EventServiceRestarted      = svcalert.EventServiceRestarted
	EventBackupFailed          = svcalert.EventBackupFailed
	EventBackupCompleted       = svcalert.EventBackupCompleted
)

// CommonEventTypes returns all supported event types.
var CommonEventTypes = svcalert.CommonEventTypes

// ---------------------------------------------------------------------------
// Shared helper functions
// ---------------------------------------------------------------------------

// parseInt parses a string to int. Shared helper for service implementations.
func parseInt(s string) (int, error) {
	if s == "" {
		return 0, nil
	}
	var val int
	_, err := fmt.Sscanf(s, "%d", &val)
	return val, err
}

// parseIntList parses a comma-separated string of ints.
func parseIntList(s string) []int {
	if s == "" {
		return make([]int, 0)
	}
	parts := splitComma(s)
	result := make([]int, 0, len(parts))
	for _, part := range parts {
		if val, err := parseInt(part); err == nil {
			result = append(result, val)
		}
	}
	return result
}

// parseStringList parses a comma-separated string.
func parseStringList(s string) []string {
	if s == "" {
		return make([]string, 0)
	}
	parts := splitComma(s)
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}

// splitComma splits a string by commas and trims spaces.
func splitComma(s string) []string {
	parts := make([]string, 0)
	current := ""
	for _, ch := range s {
		if ch == ',' {
			if current != "" {
				parts = append(parts, trimSpace(current))
				current = ""
			}
		} else {
			current += string(ch)
		}
	}
	if current != "" {
		parts = append(parts, trimSpace(current))
	}
	return parts
}

// trimSpace trims leading and trailing whitespace.
func trimSpace(s string) string {
	start := 0
	end := len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t') {
		end--
	}
	return s[start:end]
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

	s = trimSpace(s)

	var val int
	_, err := fmt.Sscanf(s, "%d", &val)
	if err != nil {
		return 0, fmt.Errorf("failed to parse signal strength: %w", err)
	}

	return val, nil
}

// parseRouterOSTime parses RouterOS time/duration values.
func parseRouterOSTime(s string) (time.Time, error) {
	if s == "" || s == "never" {
		return time.Time{}, nil
	}

	formats := []string{
		"jan/02/2006 15:04:05",
		"Jan/02/2006 15:04:05",
		time.RFC3339,
	}

	for _, format := range formats {
		if t, err := time.Parse(format, s); err == nil {
			return t, nil
		}
	}

	if dur, err := parseRouterOSDuration(s); err == nil {
		return time.Now().Add(-dur), nil
	}

	return time.Time{}, fmt.Errorf("unable to parse time: %s", s)
}

// parseRouterOSDuration parses RouterOS duration format (e.g., "1w2d3h4m5s").
func parseRouterOSDuration(s string) (time.Duration, error) {
	if s == "" {
		return 0, nil
	}

	var weeks, days, hours, minutes, seconds int
	hasUnit := false

	current := ""
	for i := 0; i < len(s); i++ {
		ch := s[i]
		if ch >= '0' && ch <= '9' {
			current += string(ch)
		} else {
			val := 0
			if current != "" {
				fmt.Sscanf(current, "%d", &val)
				current = ""
			}
			switch ch {
			case 'w':
				weeks = val
				hasUnit = true
			case 'd':
				days = val
				hasUnit = true
			case 'h':
				hours = val
				hasUnit = true
			case 'm':
				if i+1 < len(s) && s[i+1] == 's' {
					// milliseconds
					i++ // skip 's'
					return time.Duration(val) * time.Millisecond, nil
				}
				minutes = val
				hasUnit = true
			case 's':
				seconds = val
				hasUnit = true
			}
		}
	}

	if !hasUnit {
		// Try parsing as unix timestamp
		var ts int64
		if _, err := fmt.Sscanf(s, "%d", &ts); err == nil {
			return time.Duration(ts) * time.Second, nil
		}
		return 0, fmt.Errorf("invalid duration: %s", s)
	}

	totalHours := weeks*24*7 + days*24 + hours
	totalMinutes := totalHours*60 + minutes
	totalSeconds := totalMinutes*60 + seconds

	return time.Duration(totalSeconds) * time.Second, nil
}
