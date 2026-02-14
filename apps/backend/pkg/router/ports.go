package router

import "context"

// RouterPort defines the interface for communicating with a RouterOS device.
// Adapters for different protocols (REST, API, SSH, Telnet) implement this interface.
type RouterPort interface {
	// Execute runs a command on the router and returns the result.
	Execute(ctx context.Context, cmd Command) (*Result, error)

	// Connect establishes a connection to the router.
	Connect(ctx context.Context, config ConnectionConfig) error

	// Disconnect closes the connection.
	Disconnect(ctx context.Context) error

	// IsConnected reports whether the connection is alive.
	IsConnected() bool

	// Ping tests connectivity with a lightweight command.
	Ping(ctx context.Context) error
}

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
