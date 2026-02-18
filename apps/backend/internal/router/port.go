// Package router provides the hexagonal architecture port for router communication.
// All protocol adapters (REST, API, SSH) implement the RouterPort interface.
package router

import (
	"context"
)

// RouterPort defines the interface for router communication.
// All protocol adapters must implement this interface.
//
//nolint:revive // type name is appropriate despite stutter
type RouterPort interface {
	// Connect establishes a connection to the router.
	// Returns an error if connection fails.
	Connect(ctx context.Context) error

	// Disconnect closes the connection gracefully.
	Disconnect() error

	// IsConnected returns true if the adapter has an active connection.
	IsConnected() bool

	// Health returns detailed health status of the connection.
	Health(ctx context.Context) HealthStatus

	// Capabilities returns the platform capabilities detected for this router.
	Capabilities() PlatformCapabilities

	// Info returns router identity, version, and system information.
	Info() (*RouterInfo, error)

	// ExecuteCommand executes a command on the router.
	ExecuteCommand(ctx context.Context, cmd Command) (*CommandResult, error)

	// QueryState queries the current state of a resource.
	QueryState(ctx context.Context, query StateQuery) (*StateResult, error)

	// Protocol returns the protocol used by this adapter.
	Protocol() Protocol
}

// AdapterConfig holds common configuration for all adapters.
type AdapterConfig struct {
	// Host is the router IP address or hostname.
	Host string

	// Port is the port number (protocol-specific default if 0).
	Port int

	// Username for authentication.
	Username string

	// Password for authentication (not logged).
	Password string

	// Timeout for connection and command execution.
	Timeout int // seconds, default 10

	// UseTLS enables TLS for protocols that support it.
	UseTLS bool

	// RouterID is the unique identifier for this router (for event publishing).
	RouterID string
}

// DefaultTimeout is the default connection timeout in seconds.
const DefaultTimeout = 10

// Scanner defines the interface for discovering RouterOS devices on a network.
type Scanner interface {
	// ScanSubnet scans a subnet for RouterOS devices.
	ScanSubnet(ctx context.Context, subnet string) ([]DiscoveredDevice, error)

	// ScanGateways scans common gateway addresses for RouterOS devices.
	ScanGateways(ctx context.Context) ([]DiscoveredDevice, error)
}

// DiscoveredDevice represents a device found during a network scan.
type DiscoveredDevice struct {
	IP       string   `json:"ip"`
	Hostname string   `json:"hostname,omitempty"`
	Ports    []int    `json:"ports"`
	Type     string   `json:"type"`
	Vendor   string   `json:"vendor"`
	Services []string `json:"services"`
}

// BatchExecutor defines the interface for running batches of commands.
type BatchExecutor interface {
	// Submit creates and starts a new batch job, returning the job ID.
	Submit(ctx context.Context, req BatchRequest) (string, error)

	// Status returns the current status of a batch job.
	Status(ctx context.Context, jobID string) (*BatchStatus, error)

	// Cancel cancels a running batch job.
	Cancel(ctx context.Context, jobID string) error
}

// BatchRequest holds parameters for creating a batch job.
type BatchRequest struct {
	RouterIP        string   `json:"router_ip"`
	Username        string   `json:"username"`
	Password        string   `json:"password"`
	UseTLS          bool     `json:"use_tls"`
	Protocol        string   `json:"protocol"`
	SSHPrivateKey   string   `json:"ssh_private_key"`
	Commands        []string `json:"commands"`
	Script          string   `json:"script"`
	DryRun          bool     `json:"dry_run"`
	RollbackEnabled bool     `json:"rollback_enabled"`
}

// BatchStatus represents the current state of a batch job.
type BatchStatus struct {
	ID             string  `json:"id"`
	Status         string  `json:"status"`
	Total          int     `json:"total"`
	Current        int     `json:"current"`
	Percent        float64 `json:"percent"`
	Succeeded      int     `json:"succeeded"`
	Failed         int     `json:"failed"`
	CurrentCommand string  `json:"current_command,omitempty"`
}
