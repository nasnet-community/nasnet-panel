//go:build windows

package orchestrator

import (
	"context"

	"backend/internal/events"

	"github.com/rs/zerolog"
)

// ResourcePollerConfig configures the ResourcePoller
type ResourcePollerConfig struct {
	EventBus events.EventBus
	Logger   zerolog.Logger
}

// ResourcePoller monitors resource usage and emits warnings (stub for Windows)
type ResourcePoller struct {
	logger zerolog.Logger
}

// NewResourcePoller creates a new ResourcePoller instance (stub for Windows)
func NewResourcePoller(config ResourcePollerConfig) (*ResourcePoller, error) {
	return &ResourcePoller{
		logger: config.Logger,
	}, nil
}

// Start begins resource monitoring (stub for Windows)
func (rp *ResourcePoller) Start(ctx context.Context) error {
	rp.logger.Warn().Msg("Resource polling is not supported on Windows")
	return nil
}

// Stop halts resource monitoring (stub for Windows)
func (rp *ResourcePoller) Stop() error {
	return nil
}

// AddInstance adds an instance to the monitoring list (stub for Windows)
func (rp *ResourcePoller) AddInstance(instanceID, featureID, instanceName string, pid, memoryLimitMB int) error {
	rp.logger.Warn().
		Str("instance_id", instanceID).
		Int("pid", pid).
		Msg("AddInstance called but resource polling is not supported on Windows")
	return nil
}

// RemoveInstance removes an instance from the monitoring list (stub for Windows)
func (rp *ResourcePoller) RemoveInstance(instanceID string) {
	rp.logger.Warn().
		Str("instance_id", instanceID).
		Msg("RemoveInstance called but resource polling is not supported on Windows")
}
