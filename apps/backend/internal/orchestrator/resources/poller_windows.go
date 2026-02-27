//go:build windows

package resources

import (
	"context"

	"backend/internal/events"

	"go.uber.org/zap"
)

// ResourcePollerConfig configures the ResourcePoller
type ResourcePollerConfig struct {
	ResourceLimiter *ResourceLimiter
	EventBus        events.EventBus
	Logger          *zap.Logger
}

// ResourcePoller monitors resource usage and emits warnings (stub for Windows)
type ResourcePoller struct {
	logger *zap.Logger
}

// NewResourcePoller creates a new ResourcePoller instance (stub for Windows)
func NewResourcePoller(config ResourcePollerConfig) (*ResourcePoller, error) {
	return &ResourcePoller{
		logger: config.Logger,
	}, nil
}

// Start begins resource monitoring (stub for Windows)
func (rp *ResourcePoller) Start(ctx context.Context) error {
	if rp.logger != nil {
		rp.logger.Warn("Resource polling is not supported on Windows")
	}
	return nil
}

// Stop halts resource monitoring (stub for Windows)
func (rp *ResourcePoller) Stop() error {
	return nil
}

// AddInstance adds an instance to the monitoring list (stub for Windows)
func (rp *ResourcePoller) AddInstance(instanceID, featureID, instanceName string, pid, memoryLimitMB int) error {
	if rp.logger != nil {
		rp.logger.Warn("AddInstance called but resource polling is not supported on Windows",
			zap.String("instance_id", instanceID),
			zap.Int("pid", pid))
	}
	return nil
}

// RemoveInstance removes an instance from the monitoring list (stub for Windows)
func (rp *ResourcePoller) RemoveInstance(instanceID string) {
	if rp.logger != nil {
		rp.logger.Warn("RemoveInstance called but resource polling is not supported on Windows",
			zap.String("instance_id", instanceID))
	}
}
