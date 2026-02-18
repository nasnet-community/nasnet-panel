// Package events provides a typed event bus using Watermill for decoupled component communication.
// Events are categorized by priority levels with specific delivery latency guarantees.
package events

import (
	"encoding/json"
	"time"

	"github.com/oklog/ulid/v2"
)

// =============================================================================
// Priority System
// =============================================================================

// Priority defines the priority level for event delivery.
type Priority int

const (
	PriorityImmediate  Priority = 0 // <100ms delivery: Router offline, VPN crashed, security breach
	PriorityCritical   Priority = 1 // <1s delivery: Status changes, user action feedback
	PriorityNormal     Priority = 2 // <5s delivery: Config applied, routine updates
	PriorityLow        Priority = 3 // <30s delivery: Non-critical status updates
	PriorityBackground Priority = 4 // <60s delivery: Metrics, logs, historical data
)

func (p Priority) String() string {
	switch p {
	case PriorityImmediate:
		return "immediate"
	case PriorityCritical:
		return "critical"
	case PriorityNormal:
		return "normal"
	case PriorityLow:
		return "low"
	case PriorityBackground:
		return "background"
	default:
		return "unknown"
	}
}

func (p Priority) TargetLatency() time.Duration {
	switch p {
	case PriorityImmediate:
		return 100 * time.Millisecond
	case PriorityCritical:
		return 1 * time.Second
	case PriorityNormal:
		return 5 * time.Second
	case PriorityLow:
		return 30 * time.Second
	case PriorityBackground:
		return 60 * time.Second
	default:
		return 5 * time.Second
	}
}

func (p Priority) BatchWindow() time.Duration {
	switch p {
	case PriorityImmediate:
		return 0
	case PriorityCritical:
		return 100 * time.Millisecond
	case PriorityNormal:
		return 1 * time.Second
	case PriorityLow:
		return 5 * time.Second
	case PriorityBackground:
		return 30 * time.Second
	default:
		return 1 * time.Second
	}
}

// ShouldPersist returns true if events of this priority should be persisted.
func (p Priority) ShouldPersist() bool {
	switch p {
	case PriorityImmediate, PriorityCritical:
		return true
	case PriorityNormal:
		return true
	case PriorityLow, PriorityBackground:
		return false
	default:
		return false
	}
}

func ParsePriority(s string) Priority {
	switch s {
	case "immediate":
		return PriorityImmediate
	case "critical":
		return PriorityCritical
	case "normal":
		return PriorityNormal
	case "low":
		return PriorityLow
	case "background":
		return PriorityBackground
	default:
		return PriorityNormal
	}
}

func (p Priority) IsValid() bool {
	return p >= PriorityImmediate && p <= PriorityBackground
}

// =============================================================================
// Event Interface and Base Types
// =============================================================================

// Event is the interface that all typed events must implement.
type Event interface {
	GetID() ulid.ULID
	GetType() string
	GetPriority() Priority
	GetTimestamp() time.Time
	GetSource() string
	Payload() ([]byte, error)
}

// EventMetadata contains optional metadata for events.
type EventMetadata struct {
	CorrelationID string            `json:"correlationId,omitempty"`
	CausationID   string            `json:"causationId,omitempty"`
	UserID        string            `json:"userId,omitempty"`
	RequestID     string            `json:"requestId,omitempty"`
	RouterID      string            `json:"routerId,omitempty"`
	Extra         map[string]string `json:"extra,omitempty"`
}

// BaseEvent is the base struct for all typed events.
type BaseEvent struct {
	ID        ulid.ULID     `json:"id"`
	Type      string        `json:"type"`
	Priority  Priority      `json:"priority"`
	Timestamp time.Time     `json:"timestamp"`
	Source    string        `json:"source"`
	Metadata  EventMetadata `json:"metadata,omitempty"`
}

func (e *BaseEvent) GetID() ulid.ULID         { return e.ID }
func (e *BaseEvent) GetType() string          { return e.Type }
func (e *BaseEvent) GetPriority() Priority    { return e.Priority }
func (e *BaseEvent) GetTimestamp() time.Time  { return e.Timestamp }
func (e *BaseEvent) GetSource() string        { return e.Source }
func (e *BaseEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewBaseEvent(eventType string, priority Priority, source string) BaseEvent {
	return BaseEvent{
		ID:        ulid.Make(),
		Type:      eventType,
		Priority:  priority,
		Timestamp: time.Now(),
		Source:    source,
		Metadata:  EventMetadata{},
	}
}

func NewBaseEventWithMetadata(eventType string, priority Priority, source string, metadata EventMetadata) BaseEvent {
	return BaseEvent{
		ID: ulid.Make(), Type: eventType, Priority: priority,
		Timestamp: time.Now(), Source: source, Metadata: metadata,
	}
}

// =============================================================================
// Common Types
// =============================================================================

// RouterStatus represents the connection status of a router.
type RouterStatus string

const (
	RouterStatusConnected    RouterStatus = "connected"
	RouterStatusDisconnected RouterStatus = "disconnected"
	RouterStatusReconnecting RouterStatus = "reconnecting"
	RouterStatusError        RouterStatus = "error"
	RouterStatusUnknown      RouterStatus = "unknown"
)

// ChangeType represents the type of change made to a resource.
type ChangeType string

const (
	ChangeTypeCreate ChangeType = "create"
	ChangeTypeUpdate ChangeType = "update"
	ChangeTypeDelete ChangeType = "delete"
)

// GenericEvent is a simple event for cases where a specific event type doesn't exist yet.
type GenericEvent struct {
	BaseEvent
	Data map[string]interface{} `json:"data"`
}

func (e *GenericEvent) Payload() ([]byte, error) { return json.Marshal(e) }

func NewGenericEvent(eventType string, priority Priority, source string, data map[string]interface{}) *GenericEvent {
	return &GenericEvent{BaseEvent: NewBaseEvent(eventType, priority, source), Data: data}
}
