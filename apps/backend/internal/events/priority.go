// Package events provides a typed event bus using Watermill for decoupled component communication.
// Events are categorized by priority levels with specific delivery latency guarantees.
package events

import (
	"time"
)

// Priority defines the priority level for event delivery.
// Lower values indicate higher priority and faster delivery guarantees.
type Priority int

const (
	// PriorityImmediate is for critical events requiring <100ms delivery.
	// Use cases: Router offline, VPN crashed, security breach
	PriorityImmediate Priority = 0

	// PriorityCritical is for important events requiring <1s delivery.
	// Use cases: Status changes, user action feedback
	PriorityCritical Priority = 1

	// PriorityNormal is for standard events requiring <5s delivery.
	// Use cases: Config applied, routine updates
	PriorityNormal Priority = 2

	// PriorityLow is for non-urgent events requiring <30s delivery.
	// Use cases: Non-critical status updates
	PriorityLow Priority = 3

	// PriorityBackground is for background events requiring <60s delivery.
	// Use cases: Metrics, logs, historical data
	PriorityBackground Priority = 4
)

// String returns the string representation of the priority level.
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

// TargetLatency returns the target delivery latency for the priority level.
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
		return 5 * time.Second // Default to normal
	}
}

// BatchWindow returns the batching window duration for the priority level.
// Events within this window may be batched together for efficiency.
func (p Priority) BatchWindow() time.Duration {
	switch p {
	case PriorityImmediate:
		return 0 // No batching - process immediately
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

// ShouldPersist returns true if events of this priority should be persisted to the database.
// Per ADR-013: Critical and Normal events go to warm tier for durability.
func (p Priority) ShouldPersist() bool {
	switch p {
	case PriorityImmediate, PriorityCritical:
		return true // Immediate sync to database
	case PriorityNormal:
		return true // Batched to database during daily sync
	case PriorityLow, PriorityBackground:
		return false // Hot tier only (tmpfs/memory)
	default:
		return false
	}
}

// ParsePriority parses a string into a Priority value.
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

// IsValid returns true if the priority is a valid level.
func (p Priority) IsValid() bool {
	return p >= PriorityImmediate && p <= PriorityBackground
}
