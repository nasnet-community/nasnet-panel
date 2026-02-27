package isolation

import (
	"context"
	"os/exec"
)

// Strategy defines the interface for isolating service processes.
// Implementations can use kernel namespaces (Linux) or fallback to process groups (cross-platform).
type Strategy interface {
	// Name returns the strategy name (e.g., "network-namespace", "ip-binding").
	Name() string

	// PrepareProcess is called before executing the process to set up isolation.
	// It configures cmd.SysProcAttr with the necessary flags and settings.
	PrepareProcess(ctx context.Context, cmd *exec.Cmd, config *ProcessIsolationConfig) error

	// PostStart is called after the process starts (with the PID).
	// It performs runtime setup like creating virtual network interfaces.
	PostStart(ctx context.Context, pid int, config *ProcessIsolationConfig) error

	// Cleanup is called when tearing down the process.
	// It removes any runtime resources created in PostStart.
	Cleanup(ctx context.Context, config *ProcessIsolationConfig) error
}

// ProcessIsolationConfig holds the isolation configuration for a single service instance.
type ProcessIsolationConfig struct {
	// InstanceID is the unique identifier for the service instance.
	InstanceID string

	// BindIP is the isolated IP address to bind the service to.
	BindIP string

	// Ports is the list of port numbers the service will listen on.
	Ports []int

	// EnableNetNS indicates whether to use network namespace isolation.
	EnableNetNS bool

	// VethHost is the name of the host-side virtual Ethernet interface.
	// Example: "veth-1a2b3c4d"
	VethHost string

	// VethNS is the name of the namespace-side virtual Ethernet interface.
	// Example: "eth0"
	VethNS string

	// EnableChroot indicates whether to use chroot isolation.
	EnableChroot bool

	// ChrootDir is the path to the chroot directory.
	ChrootDir string

	// EnableUIDSep indicates whether to use UID isolation (run as non-root user).
	EnableUIDSep bool

	// UID is the user ID to run the process as (Linux only, when EnableUIDSep is true).
	UID uint32

	// GID is the group ID to run the process as (Linux only, when EnableUIDSep is true).
	GID uint32
}
