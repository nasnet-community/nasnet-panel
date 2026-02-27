//go:build windows

package isolation

import (
	"context"
	"errors"
	"os/exec"

	"go.uber.org/zap"
)

// NamespaceStrategy is a stub on Windows.
// Network namespaces are a Linux kernel feature and not available on Windows.
type NamespaceStrategy struct {
	logger *zap.Logger
}

// Name returns the strategy name.
func (s *NamespaceStrategy) Name() string {
	return "network-namespace"
}

// PrepareProcess returns an error on Windows.
func (s *NamespaceStrategy) PrepareProcess(ctx context.Context, cmd *exec.Cmd, config *ProcessIsolationConfig) error {
	return errors.New("network namespaces not supported on Windows")
}

// PostStart returns an error on Windows.
func (s *NamespaceStrategy) PostStart(ctx context.Context, pid int, config *ProcessIsolationConfig) error {
	return errors.New("network namespaces not supported on Windows")
}

// Cleanup returns an error on Windows.
func (s *NamespaceStrategy) Cleanup(ctx context.Context, config *ProcessIsolationConfig) error {
	return errors.New("network namespaces not supported on Windows")
}
