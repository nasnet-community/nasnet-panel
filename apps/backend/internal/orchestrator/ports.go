package orchestrator

import (
	"context"
	"time"

	"backend/generated/ent"
	"backend/internal/features"
)

// GatewayPort interface allows InstanceManager to use GatewayManager
// without importing vif package (breaks circular dependency).
// This port defines the contract for managing SOCKS-to-TUN gateways.
type GatewayPort interface {
	// StartGateway creates a TUN interface for a SOCKS5 proxy service
	StartGateway(ctx context.Context, instance *ent.ServiceInstance, manifest *features.Manifest) error

	// StopGateway gracefully stops a gateway and removes its TUN interface
	StopGateway(ctx context.Context, instanceID string) error

	// GetStatus returns the current status of a gateway
	GetStatus(instanceID string) (*GatewayStatus, error)

	// NeedsGateway checks if a service requires a gateway
	NeedsGateway(manifest *features.Manifest, mode string) bool
}

// GatewayStatus represents the current state of a gateway
type GatewayStatus struct {
	State           GatewayState
	TunName         string
	PID             int
	Uptime          time.Duration
	LastHealthCheck time.Time
	ErrorMessage    string
}

// GatewayState represents the possible states of a gateway
type GatewayState string

const (
	GatewayRunning   GatewayState = "RUNNING"
	GatewayStopped   GatewayState = "STOPPED"
	GatewayError     GatewayState = "ERROR"
	GatewayNotNeeded GatewayState = "NOT_NEEDED"
)
