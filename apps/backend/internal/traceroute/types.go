package traceroute

import (
	"time"
)

// Protocol represents the traceroute protocol type.
type Protocol string

const (
	ProtocolICMP Protocol = "ICMP"
	ProtocolUDP  Protocol = "UDP"
	ProtocolTCP  Protocol = "TCP"
)

// HopStatus represents the status of a hop.
type HopStatus string

const (
	HopStatusSuccess     HopStatus = "SUCCESS"
	HopStatusTimeout     HopStatus = "TIMEOUT"
	HopStatusUnreachable HopStatus = "UNREACHABLE"
	HopStatusProhibited  HopStatus = "PROHIBITED"
)

// JobStatus represents the status of a traceroute job.
type JobStatus string

const (
	JobStatusRunning   JobStatus = "RUNNING"
	JobStatusCompleted JobStatus = "COMPLETED"
	JobStatusCanceled  JobStatus = "CANCELED"
	JobStatusError     JobStatus = "ERROR"
)

// EventType represents the type of progress event.
type EventType string

const (
	EventTypeHopDiscovered EventType = "HOP_DISCOVERED"
	EventTypeComplete      EventType = "COMPLETE"
	EventTypeError         EventType = "ERROR"
	EventTypeCanceled      EventType = "CANCELED"
)

// Input contains the traceroute parameters.
type Input struct {
	Target     string
	MaxHops    int
	Timeout    int // milliseconds
	ProbeCount int
	Protocol   Protocol
}

// HopProbe represents a single probe result for a hop.
type HopProbe struct {
	ProbeNumber int
	LatencyMs   *float64 // nil if timeout
	Success     bool
	ICMPCode    *string
}

// Hop represents a single hop in the traceroute path.
type Hop struct {
	HopNumber    int
	Address      *string // nil for timeout
	Hostname     *string
	Status       HopStatus
	AvgLatencyMs *float64
	PacketLoss   float64
	Probes       []HopProbe
}

// Result represents the complete traceroute result.
type Result struct {
	Target             string
	TargetIP           string
	Protocol           Protocol
	MaxHops            int
	Hops               []Hop
	Completed          bool
	ReachedDestination bool
	TotalTimeMs        float64
	StartedAt          time.Time
	CompletedAt        *time.Time
}

// Job represents a running traceroute job.
type Job struct {
	JobID    string
	DeviceID string
	Input    Input
	Status   JobStatus
	Result   *Result
	Error    *string
}

// ProgressEvent represents a progress update event.
type ProgressEvent struct {
	JobID     string
	EventType EventType
	Hop       *Hop
	Result    *Result
	Error     *string
}

// RouterPort interface defines the contract for router communication.
// This follows the hexagonal architecture pattern used in the codebase.
type RouterPort interface {
	// ExecuteCommand executes a MikroTik command and returns the output.
	ExecuteCommand(deviceID string, command string) (string, error)
}
