package events

import (
	"time"

	"github.com/oklog/ulid/v2"
)

// =============================================================================
// WAN Event Types
// =============================================================================
// Events for WAN interface configuration, status changes, and health monitoring
// All events embed BaseEvent for consistency
// =============================================================================

const (
	// EventTypeWANStatusChanged - WAN connection status changed (connected/disconnected/error)
	EventTypeWANStatusChanged = "wan.status.changed"

	// EventTypeWANHealthChanged - WAN health check status changed (healthy/unhealthy)
	EventTypeWANHealthChanged = "wan.health.changed"

	// EventTypeWANIPChanged - WAN public IP address changed (DHCP lease renewal)
	EventTypeWANIPChanged = "wan.ip.changed"

	// EventTypeWANConfigured - WAN interface configured (DHCP/PPPoE/Static/LTE)
	EventTypeWANConfigured = "wan.configured"

	// EventTypeWANDeleted - WAN configuration deleted (reverted to unconfigured)
	EventTypeWANDeleted = "wan.deleted"

	// EventTypeWANConnectionFailed - WAN connection attempt failed
	EventTypeWANConnectionFailed = "wan.connection.failed"

	// EventTypeWANAuthFailed - WAN authentication failed (PPPoE)
	EventTypeWANAuthFailed = "wan.auth.failed"
)

// WANStatusChangedEvent is emitted when a WAN interface status changes.
// Triggers subscription: wanStatusChanged
type WANStatusChangedEvent struct {
	BaseEvent

	// RouterID is the ID of the router
	RouterID string `json:"router_id"`

	// WANInterfaceID is the ID of the WAN interface
	WANInterfaceID string `json:"wan_interface_id"`

	// InterfaceName is the underlying interface name (e.g., "ether1", "pppoe-wan")
	InterfaceName string `json:"interface_name"`

	// Status is the new connection status (CONNECTED, DISCONNECTED, CONNECTING, ERROR, DISABLED)
	Status string `json:"status"`

	// PreviousStatus is the previous connection status
	PreviousStatus string `json:"previous_status"`

	// ConnectionType is the WAN type (DHCP, PPPOE, STATIC, LTE)
	ConnectionType string `json:"connection_type"`

	// PublicIP is the current public IP address (if connected)
	PublicIP string `json:"public_ip,omitempty"`

	// Gateway is the gateway IP address
	Gateway string `json:"gateway,omitempty"`

	// Reason is the reason for status change (if applicable)
	Reason string `json:"reason,omitempty"`

	// Timestamp when the status changed
	ChangedAt time.Time `json:"changed_at"`
}

// NewWANStatusChangedEvent creates a new WAN status changed event.
func NewWANStatusChangedEvent(routerID, wanInterfaceID, interfaceName, status, previousStatus, connectionType string) *WANStatusChangedEvent {
	return &WANStatusChangedEvent{
		BaseEvent: BaseEvent{
			ID:        ulid.Make(),
			Type:      EventTypeWANStatusChanged,
			Priority:  PriorityNormal,
			Timestamp: time.Now(),
			Source:    "wan-service",
			Metadata: EventMetadata{
				CorrelationID: ulid.Make().String(),
			},
		},
		RouterID:       routerID,
		WANInterfaceID: wanInterfaceID,
		InterfaceName:  interfaceName,
		Status:         status,
		PreviousStatus: previousStatus,
		ConnectionType: connectionType,
		ChangedAt:      time.Now(),
	}
}

// GetType returns the event type.
func (e *WANStatusChangedEvent) GetType() string {
	return EventTypeWANStatusChanged
}

// WANHealthChangedEvent is emitted when a WAN health check status changes.
// Triggers subscription: wanHealthChanged
type WANHealthChangedEvent struct {
	BaseEvent

	// RouterID is the ID of the router
	RouterID string `json:"router_id"`

	// WANInterfaceID is the ID of the WAN interface
	WANInterfaceID string `json:"wan_interface_id"`

	// InterfaceName is the underlying interface name
	InterfaceName string `json:"interface_name"`

	// HealthStatus is the new health status (HEALTHY, UNHEALTHY, DEGRADED, DISABLED, UNKNOWN)
	HealthStatus string `json:"health_status"`

	// PreviousHealthStatus is the previous health status
	PreviousHealthStatus string `json:"previous_health_status"`

	// Target is the ping target host (e.g., "8.8.8.8")
	Target string `json:"target"`

	// Latency is the current latency in milliseconds (if reachable)
	Latency int `json:"latency,omitempty"`

	// PacketLoss is the packet loss percentage (0-100)
	PacketLoss int `json:"packet_loss"`

	// ConsecutiveFailures is the number of consecutive failed checks
	ConsecutiveFailures int `json:"consecutive_failures"`

	// ConsecutiveSuccesses is the number of consecutive successful checks
	ConsecutiveSuccesses int `json:"consecutive_successes"`

	// LastCheckTime is when the health check last ran
	LastCheckTime time.Time `json:"last_check_time"`
}

// NewWANHealthChangedEvent creates a new WAN health changed event.
func NewWANHealthChangedEvent(routerID, wanInterfaceID, interfaceName, healthStatus, previousHealthStatus, target string) *WANHealthChangedEvent {
	return &WANHealthChangedEvent{
		BaseEvent: BaseEvent{
			ID:        ulid.Make(),
			Type:      EventTypeWANHealthChanged,
			Priority:  PriorityNormal,
			Timestamp: time.Now(),
			Source:    "wan-health-monitor",
			Metadata: EventMetadata{
				CorrelationID: ulid.Make().String(),
			},
		},
		RouterID:             routerID,
		WANInterfaceID:       wanInterfaceID,
		InterfaceName:        interfaceName,
		HealthStatus:         healthStatus,
		PreviousHealthStatus: previousHealthStatus,
		Target:               target,
		LastCheckTime:        time.Now(),
	}
}

// GetType returns the event type.
func (e *WANHealthChangedEvent) GetType() string {
	return EventTypeWANHealthChanged
}

// WANIPChangedEvent is emitted when a WAN public IP address changes.
// Common for DHCP lease renewals.
type WANIPChangedEvent struct {
	BaseEvent

	// RouterID is the ID of the router
	RouterID string `json:"router_id"`

	// WANInterfaceID is the ID of the WAN interface
	WANInterfaceID string `json:"wan_interface_id"`

	// InterfaceName is the underlying interface name
	InterfaceName string `json:"interface_name"`

	// ConnectionType is the WAN type (typically DHCP)
	ConnectionType string `json:"connection_type"`

	// OldIP is the previous public IP address
	OldIP string `json:"old_ip"`

	// NewIP is the new public IP address
	NewIP string `json:"new_ip"`

	// Gateway is the gateway IP address (may also change)
	Gateway string `json:"gateway,omitempty"`

	// Reason is the reason for IP change (e.g., "dhcp-lease-renewal", "reconnect")
	Reason string `json:"reason,omitempty"`

	// ChangedAt is when the IP changed
	ChangedAt time.Time `json:"changed_at"`
}

// NewWANIPChangedEvent creates a new WAN IP changed event.
func NewWANIPChangedEvent(routerID, wanInterfaceID, interfaceName, connectionType, oldIP, newIP string) *WANIPChangedEvent {
	return &WANIPChangedEvent{
		BaseEvent: BaseEvent{
			ID:        ulid.Make(),
			Type:      EventTypeWANIPChanged,
			Priority:  PriorityNormal,
			Timestamp: time.Now(),
			Source:    "wan-service",
			Metadata: EventMetadata{
				CorrelationID: ulid.Make().String(),
			},
		},
		RouterID:       routerID,
		WANInterfaceID: wanInterfaceID,
		InterfaceName:  interfaceName,
		ConnectionType: connectionType,
		OldIP:          oldIP,
		NewIP:          newIP,
		ChangedAt:      time.Now(),
	}
}

// GetType returns the event type.
func (e *WANIPChangedEvent) GetType() string {
	return EventTypeWANIPChanged
}

// WANConfiguredEvent is emitted when a WAN interface is configured.
type WANConfiguredEvent struct {
	BaseEvent

	// RouterID is the ID of the router
	RouterID string `json:"router_id"`

	// WANInterfaceID is the ID of the WAN interface
	WANInterfaceID string `json:"wan_interface_id"`

	// InterfaceName is the underlying interface name
	InterfaceName string `json:"interface_name"`

	// ConnectionType is the WAN type (DHCP, PPPOE, STATIC, LTE)
	ConnectionType string `json:"connection_type"`

	// IsDefaultRoute indicates if this WAN is the default route
	IsDefaultRoute bool `json:"is_default_route"`

	// ConfiguredBy is the user who configured the WAN (if applicable)
	ConfiguredBy string `json:"configured_by,omitempty"`

	// ConfiguredAt is when the WAN was configured
	ConfiguredAt time.Time `json:"configured_at"`
}

// NewWANConfiguredEvent creates a new WAN configured event.
func NewWANConfiguredEvent(routerID, wanInterfaceID, interfaceName, connectionType string, isDefaultRoute bool) *WANConfiguredEvent {
	return &WANConfiguredEvent{
		BaseEvent: BaseEvent{
			ID:        ulid.Make(),
			Type:      EventTypeWANConfigured,
			Priority:  PriorityNormal,
			Timestamp: time.Now(),
			Source:    "wan-service",
			Metadata: EventMetadata{
				CorrelationID: ulid.Make().String(),
			},
		},
		RouterID:       routerID,
		WANInterfaceID: wanInterfaceID,
		InterfaceName:  interfaceName,
		ConnectionType: connectionType,
		IsDefaultRoute: isDefaultRoute,
		ConfiguredAt:   time.Now(),
	}
}

// GetType returns the event type.
func (e *WANConfiguredEvent) GetType() string {
	return EventTypeWANConfigured
}

// WANDeletedEvent is emitted when a WAN configuration is deleted.
type WANDeletedEvent struct {
	BaseEvent

	// RouterID is the ID of the router
	RouterID string `json:"router_id"`

	// WANInterfaceID is the ID of the WAN interface
	WANInterfaceID string `json:"wan_interface_id"`

	// InterfaceName is the underlying interface name
	InterfaceName string `json:"interface_name"`

	// ConnectionType is the WAN type that was deleted
	ConnectionType string `json:"connection_type"`

	// DeletedBy is the user who deleted the WAN (if applicable)
	DeletedBy string `json:"deleted_by,omitempty"`

	// DeletedAt is when the WAN was deleted
	DeletedAt time.Time `json:"deleted_at"`
}

// NewWANDeletedEvent creates a new WAN deleted event.
func NewWANDeletedEvent(routerID, wanInterfaceID, interfaceName, connectionType string) *WANDeletedEvent {
	return &WANDeletedEvent{
		BaseEvent: BaseEvent{
			ID:        ulid.Make(),
			Type:      EventTypeWANDeleted,
			Priority:  PriorityNormal,
			Timestamp: time.Now(),
			Source:    "wan-service",
			Metadata: EventMetadata{
				CorrelationID: ulid.Make().String(),
			},
		},
		RouterID:       routerID,
		WANInterfaceID: wanInterfaceID,
		InterfaceName:  interfaceName,
		ConnectionType: connectionType,
		DeletedAt:      time.Now(),
	}
}

// GetType returns the event type.
func (e *WANDeletedEvent) GetType() string {
	return EventTypeWANDeleted
}

// WANConnectionFailedEvent is emitted when a WAN connection attempt fails.
type WANConnectionFailedEvent struct {
	BaseEvent

	// RouterID is the ID of the router
	RouterID string `json:"router_id"`

	// WANInterfaceID is the ID of the WAN interface
	WANInterfaceID string `json:"wan_interface_id"`

	// InterfaceName is the underlying interface name
	InterfaceName string `json:"interface_name"`

	// ConnectionType is the WAN type
	ConnectionType string `json:"connection_type"`

	// FailureReason is the reason for connection failure
	FailureReason string `json:"failure_reason"`

	// ErrorDetails provides additional error information
	ErrorDetails string `json:"error_details,omitempty"`

	// AttemptNumber is the number of connection attempts
	AttemptNumber int `json:"attempt_number"`

	// FailedAt is when the connection failed
	FailedAt time.Time `json:"failed_at"`
}

// NewWANConnectionFailedEvent creates a new WAN connection failed event.
func NewWANConnectionFailedEvent(routerID, wanInterfaceID, interfaceName, connectionType, failureReason string) *WANConnectionFailedEvent {
	return &WANConnectionFailedEvent{
		BaseEvent: BaseEvent{
			ID:        ulid.Make(),
			Type:      EventTypeWANConnectionFailed,
			Priority:  PriorityCritical, // Connection failures are high priority
			Timestamp: time.Now(),
			Source:    "wan-service",
			Metadata: EventMetadata{
				CorrelationID: ulid.Make().String(),
			},
		},
		RouterID:       routerID,
		WANInterfaceID: wanInterfaceID,
		InterfaceName:  interfaceName,
		ConnectionType: connectionType,
		FailureReason:  failureReason,
		FailedAt:       time.Now(),
	}
}

// GetType returns the event type.
func (e *WANConnectionFailedEvent) GetType() string {
	return EventTypeWANConnectionFailed
}

// WANAuthFailedEvent is emitted when WAN authentication fails (PPPoE).
type WANAuthFailedEvent struct {
	BaseEvent

	// RouterID is the ID of the router
	RouterID string `json:"router_id"`

	// WANInterfaceID is the ID of the WAN interface
	WANInterfaceID string `json:"wan_interface_id"`

	// InterfaceName is the underlying interface name
	InterfaceName string `json:"interface_name"`

	// ConnectionType is the WAN type (typically PPPOE)
	ConnectionType string `json:"connection_type"`

	// Username is the authentication username (for troubleshooting)
	Username string `json:"username"`

	// FailureReason is the reason for auth failure (e.g., "invalid-credentials", "timeout")
	FailureReason string `json:"failure_reason"`

	// AttemptNumber is the number of authentication attempts
	AttemptNumber int `json:"attempt_number"`

	// FailedAt is when authentication failed
	FailedAt time.Time `json:"failed_at"`
}

// NewWANAuthFailedEvent creates a new WAN auth failed event.
func NewWANAuthFailedEvent(routerID, wanInterfaceID, interfaceName, connectionType, username, failureReason string) *WANAuthFailedEvent {
	return &WANAuthFailedEvent{
		BaseEvent: BaseEvent{
			ID:        ulid.Make(),
			Type:      EventTypeWANAuthFailed,
			Priority:  PriorityCritical, // Auth failures are high priority
			Timestamp: time.Now(),
			Source:    "wan-service",
			Metadata: EventMetadata{
				CorrelationID: ulid.Make().String(),
			},
		},
		RouterID:       routerID,
		WANInterfaceID: wanInterfaceID,
		InterfaceName:  interfaceName,
		ConnectionType: connectionType,
		Username:       username,
		FailureReason:  failureReason,
		FailedAt:       time.Now(),
	}
}

// GetType returns the event type.
func (e *WANAuthFailedEvent) GetType() string {
	return EventTypeWANAuthFailed
}
