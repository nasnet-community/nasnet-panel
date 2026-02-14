package router

import "time"

// Protocol represents the communication protocol to use with a RouterOS device.
type Protocol string

const (
	ProtocolREST   Protocol = "rest"
	ProtocolAPI    Protocol = "api"
	ProtocolSSH    Protocol = "ssh"
	ProtocolTelnet Protocol = "telnet"
)

// ConnectionConfig holds parameters for connecting to a RouterOS device.
type ConnectionConfig struct {
	Address    string
	Username   string
	Password   string
	UseTLS     bool
	PrivateKey string        // PEM-encoded private key (SSH only)
	Timeout    time.Duration
	Protocol   Protocol
}

// Command represents a single command to execute on a RouterOS device.
type Command struct {
	Path       string            // API path, e.g., "/interface/bridge"
	Action     string            // Action: add, set, remove, print, etc.
	Args       []string          // Arguments in API format
	Properties map[string]string // Key-value properties
	RawCLI     string            // Raw CLI command text (for SSH/Telnet)
}

// Result holds the outcome of executing a command.
type Result struct {
	Data    []map[string]string // Returned records
	RetID   string              // ID returned from add operations
	Output  string              // Raw text output (SSH/Telnet)
	Success bool
	Error   string
}

// CommandResult holds the result of a single command in a batch.
type CommandResult struct {
	LineNumber int    `json:"line_number"`
	Command    string `json:"command"`
	Output     string `json:"output,omitempty"`
	Error      string `json:"error,omitempty"`
	Success    bool   `json:"success"`
}
