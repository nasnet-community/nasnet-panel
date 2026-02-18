// Package services contains business logic services for NasNetConnect.
// This file provides backward-compatible type aliases for sub-packages
// (bridge, wan, netif, svcalert) so that existing importers continue to work.
// It also contains shared helper functions used across service files.
package services

import (
	"backend/internal/services/bridge"
	"backend/internal/services/integration"
	"backend/internal/services/monitoring"
	"backend/internal/services/netif"
	"backend/internal/services/networking/vlan"
	"backend/internal/services/pollers"
	"backend/internal/services/routing"
	"backend/internal/services/svcalert"
	"backend/internal/services/wan"
)

// ---------------------------------------------------------------------------
// Bridge sub-package aliases
// ---------------------------------------------------------------------------

type BridgeService = bridge.Service
type BridgeData = bridge.Data
type BridgePortData = bridge.PortData
type BridgeVlanData = bridge.VlanData
type BridgeStpStatusData = bridge.StpStatusData
type BridgeImpact = bridge.Impact
type UndoStore = bridge.UndoStore
type UndoOperation = bridge.UndoOperation
type CreateBridgeInput = bridge.CreateBridgeInput
type UpdateBridgeInput = bridge.UpdateBridgeInput
type AddBridgePortInput = bridge.AddBridgePortInput
type UpdateBridgePortInput = bridge.UpdateBridgePortInput
type CreateBridgeVlanInput = bridge.CreateBridgeVlanInput

var NewBridgeService = bridge.NewService
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
// Routing sub-package aliases
// ---------------------------------------------------------------------------

type RouteService = routing.RouteService

var NewRouteService = routing.NewRouteService

// ---------------------------------------------------------------------------
// VLAN sub-package aliases (under networking)
// ---------------------------------------------------------------------------

type VlanService = vlan.VlanService

var NewVlanService = vlan.NewVlanService

// ---------------------------------------------------------------------------
// Monitoring sub-package aliases
// ---------------------------------------------------------------------------

// Pollers
type StatsPoller = pollers.StatsPoller
type ServiceTrafficPoller = pollers.ServiceTrafficPoller

var NewStatsPoller = pollers.NewStatsPoller
var NewServiceTrafficPoller = pollers.NewServiceTrafficPoller

// Polling interval constants
const (
	MinPollingInterval        = pollers.MinPollingInterval
	DefaultPollingInterval    = pollers.DefaultPollingInterval
	MaxPollingInterval        = pollers.MaxPollingInterval
	TrafficPollingInterval    = pollers.TrafficPollingInterval
	MinTrafficPollingInterval = pollers.MinTrafficPollingInterval
	MaxTrafficPollingInterval = pollers.MaxTrafficPollingInterval
)

// Telemetry
type TelemetryService = monitoring.TelemetryService

var NewTelemetryService = monitoring.NewTelemetryService

// Port Mirror
type PortMirrorService = monitoring.PortMirrorService

var NewPortMirrorService = monitoring.NewPortMirrorService

// ---------------------------------------------------------------------------
// Integration sub-package aliases
// ---------------------------------------------------------------------------

type WebhookService = integration.WebhookService

var NewWebhookService = integration.NewWebhookService
