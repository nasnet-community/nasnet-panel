// Package router provides the hexagonal architecture port for router communication.
// All protocol adapters (REST, API, SSH) implement the RouterPort interface.
package router

import (
	"context"
)

// RouterPort defines the interface for router communication.
// All protocol adapters must implement this interface.
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
