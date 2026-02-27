//go:build linux

package isolation

import (
	"context"
	"fmt"
	"os/exec"
	"strconv"
	"syscall"

	"go.uber.org/zap"
)

// NamespaceStrategy uses Linux network namespaces for process isolation.
// This provides strong isolation: each service gets its own network stack.
type NamespaceStrategy struct {
	logger *zap.Logger
}

// Name returns the strategy name.
func (s *NamespaceStrategy) Name() string {
	return "network-namespace"
}

// PrepareProcess configures the process to use network namespace isolation.
// It sets up cloneflags, chroot, and UID separation before the process starts.
func (s *NamespaceStrategy) PrepareProcess(ctx context.Context, cmd *exec.Cmd, config *ProcessIsolationConfig) error {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}

	// Enable network namespace cloning
	cmd.SysProcAttr.Cloneflags |= syscall.CLONE_NEWNET

	// Set up chroot if enabled
	if config.EnableChroot && config.ChrootDir != "" {
		cmd.SysProcAttr.Chroot = config.ChrootDir
	}

	// Set up UID separation if enabled
	if config.EnableUIDSep && config.UID > 0 {
		cmd.SysProcAttr.Credential = &syscall.Credential{
			Uid: config.UID,
			Gid: config.GID,
		}
	}

	return nil
}

// PostStart creates the virtual network interface pair and configures networking.
// It runs after the process starts to set up the veth pair and assign IPs.
func (s *NamespaceStrategy) PostStart(ctx context.Context, pid int, config *ProcessIsolationConfig) error {
	// Create veth pair: host-side and namespace-side
	createCmd := exec.CommandContext(ctx, "ip", "link", "add", config.VethHost,
		"type", "veth", "peer", "name", config.VethNS)
	if err := createCmd.Run(); err != nil {
		s.logger.Error("failed to create veth pair", zap.Error(err), zap.String("veth_host", config.VethHost))
		return fmt.Errorf("create veth pair: %w", err)
	}

	// Move namespace-side interface into the process namespace
	moveCmd := exec.CommandContext(ctx, "ip", "link", "set", config.VethNS,
		"netns", strconv.Itoa(pid))
	if err := moveCmd.Run(); err != nil {
		s.logger.Error("failed to move veth to namespace", zap.Error(err), zap.Int("pid", pid))
		return fmt.Errorf("move veth to namespace: %w", err)
	}

	// Bring up the host-side interface
	upCmd := exec.CommandContext(ctx, "ip", "link", "set", config.VethHost, "up")
	if err := upCmd.Run(); err != nil {
		s.logger.Error("failed to bring up host veth", zap.Error(err), zap.String("veth_host", config.VethHost))
		return fmt.Errorf("bring up host veth: %w", err)
	}

	// Configure IP address inside the namespace using nsenter
	nsenterCmd := exec.CommandContext(ctx, "nsenter", "-t", strconv.Itoa(pid), "-n",
		"ip", "addr", "add", config.BindIP, "dev", config.VethNS)
	if err := nsenterCmd.Run(); err != nil {
		s.logger.Error("failed to assign IP in namespace", zap.Error(err), zap.String("bind_ip", config.BindIP))
		return fmt.Errorf("assign IP in namespace: %w", err)
	}

	// Bring up the namespace-side interface using nsenter
	nsenterUpCmd := exec.CommandContext(ctx, "nsenter", "-t", strconv.Itoa(pid), "-n",
		"ip", "link", "set", config.VethNS, "up")
	if err := nsenterUpCmd.Run(); err != nil {
		s.logger.Error("failed to bring up namespace veth", zap.Error(err), zap.String("veth_ns", config.VethNS))
		return fmt.Errorf("bring up namespace veth: %w", err)
	}

	s.logger.Info("namespace setup complete", zap.String("instance_id", config.InstanceID),
		zap.String("veth_pair", config.VethHost+"-"+config.VethNS), zap.String("bind_ip", config.BindIP))
	return nil
}

// Cleanup removes the virtual network interface pair when the process terminates.
// Deleting the host-side interface automatically removes its peer in the namespace.
func (s *NamespaceStrategy) Cleanup(ctx context.Context, config *ProcessIsolationConfig) error {
	// Delete the host-side veth; the peer in the namespace is auto-removed
	delCmd := exec.CommandContext(ctx, "ip", "link", "delete", config.VethHost)
	if err := delCmd.Run(); err != nil {
		// Log but don't fail; the interface may already be gone if the namespace was cleaned up
		s.logger.Warn("failed to delete veth pair", zap.Error(err), zap.String("veth_host", config.VethHost))
	}

	s.logger.Info("isolation cleanup complete", zap.String("instance_id", config.InstanceID))
	return nil
}
