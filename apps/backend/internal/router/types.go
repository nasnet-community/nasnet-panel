package router

import (
	"time"
)

// Protocol represents the communication protocol used to connect to a router.
type Protocol int

const (
	// ProtocolREST is the RouterOS 7.1+ REST API.
	ProtocolREST Protocol = iota
	// ProtocolAPI is the binary API on port 8728.
	ProtocolAPI
	// ProtocolAPISSL is the TLS-encrypted binary API on port 8729.
	ProtocolAPISSL
	// ProtocolSSH is the SSH protocol on port 22.
	ProtocolSSH
	// ProtocolTelnet is the legacy telnet protocol on port 23.
	ProtocolTelnet
)

// String returns the string representation of the protocol.
func (p Protocol) String() string {
	switch p {
	case ProtocolREST:
		return "REST"
	case ProtocolAPI:
		return "API"
	case ProtocolAPISSL:
		return "API-SSL"
	case ProtocolSSH:
		return "SSH"
	case ProtocolTelnet:
		return "Telnet"
	default:
		return "Unknown"
	}
}

// DefaultPort returns the default port for each protocol.
func (p Protocol) DefaultPort() int {
	switch p {
	case ProtocolREST:
		return 80 // or 443 for HTTPS
	case ProtocolAPI:
		return 8728
	case ProtocolAPISSL:
		return 8729
	case ProtocolSSH:
		return 22
	case ProtocolTelnet:
		return 23
	default:
		return 0
	}
}

// ConnectionStatus represents the current connection state.
type ConnectionStatus int

const (
	// StatusDisconnected means not connected.
	StatusDisconnected ConnectionStatus = iota
	// StatusConnecting means connection attempt in progress.
	StatusConnecting
	// StatusConnected means successfully connected.
	StatusConnected
	// StatusReconnecting means attempting to restore a lost connection.
	StatusReconnecting
	// StatusError means connection failed with an error.
	StatusError
)

// String returns the string representation of the connection status.
func (s ConnectionStatus) String() string {
	switch s {
	case StatusDisconnected:
		return "DISCONNECTED"
	case StatusConnecting:
		return "CONNECTING"
	case StatusConnected:
		return "CONNECTED"
	case StatusReconnecting:
		return "RECONNECTING"
	case StatusError:
		return "ERROR"
	default:
		return "UNKNOWN"
	}
}

// HealthStatus contains detailed health information about a connection.
type HealthStatus struct {
	// Status is the current connection status.
	Status ConnectionStatus

	// LastCheck is the timestamp of the last health check.
	LastCheck time.Time

	// LastSuccess is the timestamp of the last successful operation.
	LastSuccess time.Time

	// ConsecutiveFailures is the number of consecutive failed operations.
	ConsecutiveFailures int

	// Latency is the round-trip time of the last successful operation.
	Latency time.Duration

	// ErrorMessage contains the last error message if Status is Error.
	ErrorMessage string

	// CircuitBreakerState is the current state of the circuit breaker.
	CircuitBreakerState string
}

// RouterInfo contains router identity and system information.
type RouterInfo struct {
	// Model is the router hardware model (e.g., "RB4011iGS+5HacQ2HnD-IN").
	Model string

	// Version is the RouterOS version.
	Version RouterOSVersion

	// Identity is the router's configured identity name.
	Identity string

	// Uptime is how long the router has been running.
	Uptime time.Duration

	// BoardName is the board/platform name.
	BoardName string

	// Architecture is the CPU architecture (e.g., "arm64", "x86_64").
	Architecture string

	// SerialNumber is the router's serial number (if available).
	SerialNumber string
}

// RouterOSVersion represents a parsed RouterOS version.
type RouterOSVersion struct {
	// Major version number (e.g., 7).
	Major int

	// Minor version number (e.g., 12).
	Minor int

	// Patch version number (e.g., 1).
	Patch int

	// Channel is the update channel (stable, testing, development).
	Channel string

	// Raw is the original version string.
	Raw string
}

// String returns the version as a string.
func (v RouterOSVersion) String() string {
	if v.Raw != "" {
		return v.Raw
	}
	if v.Patch > 0 {
		return formatVersion(v.Major, v.Minor, v.Patch)
	}
	return formatVersionNoPatch(v.Major, v.Minor)
}

func formatVersion(major, minor, patch int) string {
	return formatInt(major) + "." + formatInt(minor) + "." + formatInt(patch)
}

func formatVersionNoPatch(major, minor int) string {
	return formatInt(major) + "." + formatInt(minor)
}

func formatInt(i int) string {
	if i == 0 {
		return "0"
	}
	if i < 0 {
		return "-" + formatPositiveInt(-i)
	}
	return formatPositiveInt(i)
}

func formatPositiveInt(i int) string {
	if i == 0 {
		return ""
	}
	digits := ""
	for i > 0 {
		digit := byte('0' + i%10)
		digits = string(digit) + digits
		i /= 10
	}
	return digits
}

// SupportsREST returns true if this version supports the REST API (7.1+).
func (v RouterOSVersion) SupportsREST() bool {
	return v.Major > 7 || (v.Major == 7 && v.Minor >= 1)
}

// IsVersion6 returns true if this is a RouterOS 6.x version.
func (v RouterOSVersion) IsVersion6() bool {
	return v.Major == 6
}

// PlatformCapabilities describes what features a router supports.
type PlatformCapabilities struct {
	// SupportsREST indicates REST API availability (RouterOS 7.1+).
	SupportsREST bool

	// SupportsBinaryAPI indicates binary API availability.
	SupportsBinaryAPI bool

	// SupportsAPISSL indicates TLS API availability.
	SupportsAPISSL bool

	// SupportsSSH indicates SSH availability.
	SupportsSSH bool

	// SupportsContainers indicates container/docker support.
	SupportsContainers bool

	// SupportsWireGuard indicates WireGuard VPN support.
	SupportsWireGuard bool

	// SupportsZeroTier indicates ZeroTier support.
	SupportsZeroTier bool

	// SupportsIPv6 indicates IPv6 support.
	SupportsIPv6 bool

	// MaxBridgePorts is the maximum number of bridge ports.
	MaxBridgePorts int

	// MaxVLANs is the maximum number of VLANs supported.
	MaxVLANs int

	// HasWireless indicates wireless interface availability.
	HasWireless bool

	// HasLTE indicates LTE/cellular interface availability.
	HasLTE bool
}

// Command represents a command to be executed on the router.
type Command struct {
	// Path is the resource path (e.g., "/interface/bridge").
	Path string

	// Action is the action to perform (e.g., "add", "set", "remove", "print").
	Action string

	// Args are the command arguments as key-value pairs.
	Args map[string]string

	// ID is an optional resource ID for targeted operations.
	ID string

	// Query is an optional query filter for print operations (string format).
	Query string

	// QueryFilter is an optional key-value filter for print operations.
	QueryFilter map[string]string

	// Props specifies which properties to return for print operations.
	Props []string
}

// CommandResult contains the result of a command execution.
type CommandResult struct {
	// Success indicates whether the command succeeded.
	Success bool

	// Data contains the response data (for print commands).
	Data []map[string]string

	// ID is the ID of the created/modified resource (for add/set).
	ID string

	// Error contains error details if the command failed.
	Error error

	// Duration is how long the command took to execute.
	Duration time.Duration

	// RawOutput contains the raw output (for debugging).
	RawOutput string
}

// StateQuery represents a query for resource state.
type StateQuery struct {
	// Path is the resource path to query (e.g., "/interface").
	Path string

	// Fields are the specific fields to retrieve (empty = all).
	Fields []string

	// Filter is an optional filter expression.
	Filter map[string]string

	// Limit is the maximum number of results (0 = no limit).
	Limit int
}

// StateResult contains the result of a state query.
type StateResult struct {
	// Resources is the list of matching resources.
	Resources []map[string]string

	// Count is the number of resources returned.
	Count int

	// Duration is how long the query took.
	Duration time.Duration

	// Error contains error details if the query failed.
	Error error
}

// AdapterError represents an error from a protocol adapter.
type AdapterError struct {
	// Protocol is the protocol that generated the error.
	Protocol Protocol

	// Operation is the operation that failed.
	Operation string

	// Message is the error message.
	Message string

	// Cause is the underlying error.
	Cause error

	// Retryable indicates if the operation can be retried.
	Retryable bool

	// RouterOSError is the RouterOS error code if applicable.
	RouterOSError string
}

// Error implements the error interface.
func (e *AdapterError) Error() string {
	if e.Cause != nil {
		return e.Protocol.String() + " " + e.Operation + ": " + e.Message + ": " + e.Cause.Error()
	}
	return e.Protocol.String() + " " + e.Operation + ": " + e.Message
}

// Unwrap returns the underlying error.
func (e *AdapterError) Unwrap() error {
	return e.Cause
}
