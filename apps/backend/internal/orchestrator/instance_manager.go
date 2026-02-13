package orchestrator

import (
	"context"
	"fmt"
	"path/filepath"
	"sync"

	"backend/ent"
	"backend/ent/serviceinstance"
	"backend/internal/events"
	"backend/internal/features"

	"github.com/oklog/ulid/v2"
	"github.com/rs/zerolog"
)

// InstanceStatus represents the lifecycle status of a service instance
type InstanceStatus string

const (
	StatusInstalling InstanceStatus = "installing"
	StatusInstalled  InstanceStatus = "installed"
	StatusStarting   InstanceStatus = "starting"
	StatusRunning    InstanceStatus = "running"
	StatusStopping   InstanceStatus = "stopping"
	StatusStopped    InstanceStatus = "stopped"
	StatusFailed     InstanceStatus = "failed"
	StatusDeleting   InstanceStatus = "deleting"
)

// ValidTransitions defines the allowed state transitions
var ValidTransitions = map[InstanceStatus][]InstanceStatus{
	StatusInstalling: {StatusInstalled, StatusFailed},
	StatusInstalled:  {StatusStarting, StatusDeleting},
	StatusStarting:   {StatusRunning, StatusFailed},
	StatusRunning:    {StatusStopping, StatusFailed},
	StatusStopping:   {StatusStopped, StatusFailed},
	StatusStopped:    {StatusStarting, StatusDeleting, StatusFailed},
	StatusFailed:     {StatusStarting, StatusDeleting},
	StatusDeleting:   {}, // Terminal state
}

// InstanceManagerConfig holds configuration for the instance manager
type InstanceManagerConfig struct {
	Registry    *features.FeatureRegistry
	DownloadMgr *features.DownloadManager
	Supervisor  *ProcessSupervisor
	Store       *ent.Client
	EventBus    events.EventBus
	FeaturesDir string
	Logger      zerolog.Logger
}

// InstanceManager orchestrates service instance lifecycle
type InstanceManager struct {
	mu     sync.RWMutex
	config InstanceManagerConfig
	logger zerolog.Logger
}

// NewInstanceManager creates a new instance manager
func NewInstanceManager(cfg InstanceManagerConfig) (*InstanceManager, error) {
	if cfg.Registry == nil {
		return nil, fmt.Errorf("feature registry is required")
	}
	if cfg.DownloadMgr == nil {
		return nil, fmt.Errorf("download manager is required")
	}
	if cfg.Supervisor == nil {
		return nil, fmt.Errorf("supervisor is required")
	}
	if cfg.Store == nil {
		return nil, fmt.Errorf("ent store is required")
	}
	if cfg.EventBus == nil {
		return nil, fmt.Errorf("event bus is required")
	}
	if cfg.FeaturesDir == "" {
		cfg.FeaturesDir = "/data/features"
	}

	im := &InstanceManager{
		config: cfg,
		logger: cfg.Logger,
	}

	// Perform reconciliation on startup
	if err := im.Reconcile(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to reconcile instances: %w", err)
	}

	return im, nil
}

// CreateInstance creates a new service instance and installs the binary
func (im *InstanceManager) CreateInstance(ctx context.Context, req CreateInstanceRequest) (*ent.ServiceInstance, error) {
	// Validate feature exists
	manifest, err := im.config.Registry.GetManifest(req.FeatureID)
	if err != nil {
		return nil, fmt.Errorf("invalid feature ID: %w", err)
	}

	// Check compatibility
	compatible, issues := manifest.IsCompatibleWith(
		req.RouterOSVersion,
		req.Architecture,
		req.AvailableMemoryMB,
		req.AvailableDiskMB,
	)
	if !compatible {
		return nil, fmt.Errorf("feature not compatible: %v", issues)
	}

	// Allocate resources (ports, VLAN)
	allocatedPorts, err := im.allocatePorts(ctx, req.RouterID, manifest.RequiredPorts)
	if err != nil {
		return nil, fmt.Errorf("failed to allocate ports: %w", err)
	}

	// Create database record
	instance, err := im.config.Store.ServiceInstance.Create().
		SetID(ulid.Make().String()).
		SetFeatureID(req.FeatureID).
		SetInstanceName(req.InstanceName).
		SetRouterID(req.RouterID).
		SetStatus(serviceinstance.StatusInstalling).
		SetPorts(allocatedPorts).
		SetConfig(req.Config).
		Save(ctx)

	if err != nil {
		// Release allocated ports on failure
		im.releasePorts(ctx, req.RouterID, allocatedPorts)
		return nil, fmt.Errorf("failed to create instance record: %w", err)
	}

	// Emit creation event
	im.emitStateChangeEvent(ctx, instance.ID, "", string(StatusInstalling))

	// Start binary download in background
	go func() {
		downloadCtx := context.Background() // Use background context for async operation

		// Determine binary URL and checksum from manifest
		// For now, use placeholder values - this would come from manifest
		binaryURL := fmt.Sprintf("https://github.com/nasnetconnect/%s/releases/latest/download/%s", req.FeatureID, req.FeatureID)
		checksum := manifest.DockerTag // Placeholder - should be actual checksum

		// Download binary
		if err := im.config.DownloadMgr.Download(downloadCtx, req.FeatureID, binaryURL, checksum); err != nil {
			im.logger.Error().Err(err).Str("instance_id", instance.ID).Msg("Binary download failed")

			// Update instance status to failed
			im.updateInstanceStatus(downloadCtx, instance.ID, StatusFailed)
			im.emitStateChangeEvent(downloadCtx, instance.ID, string(StatusInstalling), string(StatusFailed))
			return
		}

		// Update binary info
		binaryPath := filepath.Join(im.config.FeaturesDir, req.FeatureID, "bin", req.FeatureID)
		_, err := im.config.Store.ServiceInstance.UpdateOneID(instance.ID).
			SetBinaryPath(binaryPath).
			SetBinaryVersion(manifest.Version).
			SetBinaryChecksum(checksum).
			SetStatus(serviceinstance.StatusInstalled).
			Save(downloadCtx)

		if err != nil {
			im.logger.Error().Err(err).Str("instance_id", instance.ID).Msg("Failed to update instance after download")
			return
		}

		// Emit installed event
		im.emitStateChangeEvent(downloadCtx, instance.ID, string(StatusInstalling), string(StatusInstalled))
		im.logger.Info().Str("instance_id", instance.ID).Msg("Instance installed successfully")
	}()

	return instance, nil
}

// StartInstance starts a service instance
func (im *InstanceManager) StartInstance(ctx context.Context, instanceID string) error {
	// Get instance from database
	instance, err := im.config.Store.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		return fmt.Errorf("instance not found: %w", err)
	}

	// Validate state transition
	currentStatus := InstanceStatus(instance.Status)
	if !im.canTransition(currentStatus, StatusStarting) {
		return fmt.Errorf("cannot start instance in %s state", currentStatus)
	}

	// Update status to starting
	if err := im.updateInstanceStatus(ctx, instanceID, StatusStarting); err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}
	im.emitStateChangeEvent(ctx, instanceID, string(currentStatus), string(StatusStarting))

	// Get manifest for process configuration
	manifest, err := im.config.Registry.GetManifest(instance.FeatureID)
	if err != nil {
		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		return fmt.Errorf("failed to get manifest: %w", err)
	}

	// Create managed process
	processConfig := ProcessConfig{
		ID:            instanceID,
		Name:          instance.InstanceName,
		Command:       instance.BinaryPath,
		Args:          im.buildProcessArgs(manifest, instance),
		Env:           im.buildProcessEnv(manifest, instance),
		WorkDir:       filepath.Dir(instance.BinaryPath),
		AutoRestart:   true,
		ShutdownGrace: 10 * 1000000000, // 10 seconds in nanoseconds
		Logger:        im.logger.With().Str("instance_id", instanceID).Logger(),
	}

	process := NewManagedProcess(processConfig)

	// Add to supervisor
	if err := im.config.Supervisor.Add(process); err != nil {
		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStarting), string(StatusFailed))
		return fmt.Errorf("failed to add to supervisor: %w", err)
	}

	// Start the process via supervisor
	if err := im.config.Supervisor.Start(ctx, instanceID); err != nil {
		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStarting), string(StatusFailed))

		// Remove from supervisor on failure
		_ = im.config.Supervisor.Remove(instanceID)

		return fmt.Errorf("failed to start process: %w", err)
	}

	// Update status to running
	if err := im.updateInstanceStatus(ctx, instanceID, StatusRunning); err != nil {
		// Try to stop the process if status update fails
		_ = im.config.Supervisor.Stop(ctx, instanceID)
		_ = im.config.Supervisor.Remove(instanceID)
		return fmt.Errorf("failed to update status to running: %w", err)
	}

	im.emitStateChangeEvent(ctx, instanceID, string(StatusStarting), string(StatusRunning))
	im.logger.Info().Str("instance_id", instanceID).Msg("Instance started successfully")

	return nil
}

// StopInstance stops a running service instance
func (im *InstanceManager) StopInstance(ctx context.Context, instanceID string) error {
	// Get instance from database
	instance, err := im.config.Store.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		return fmt.Errorf("instance not found: %w", err)
	}

	// Validate state transition
	currentStatus := InstanceStatus(instance.Status)
	if !im.canTransition(currentStatus, StatusStopping) {
		return fmt.Errorf("cannot stop instance in %s state", currentStatus)
	}

	// Update status to stopping
	if err := im.updateInstanceStatus(ctx, instanceID, StatusStopping); err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}
	im.emitStateChangeEvent(ctx, instanceID, string(currentStatus), string(StatusStopping))

	// Check if process exists in supervisor
	_, exists := im.config.Supervisor.Get(instanceID)

	if !exists {
		// Process not running, just update status
		im.updateInstanceStatus(ctx, instanceID, StatusStopped)
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStopping), string(StatusStopped))
		return nil
	}

	// Stop the process via supervisor
	if err := im.config.Supervisor.Stop(ctx, instanceID); err != nil {
		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStopping), string(StatusFailed))
		return fmt.Errorf("failed to stop process: %w", err)
	}

	// Remove from supervisor
	if err := im.config.Supervisor.Remove(instanceID); err != nil {
		im.logger.Warn().Err(err).Str("instance_id", instanceID).Msg("failed to remove from supervisor")
	}

	// Update status to stopped
	if err := im.updateInstanceStatus(ctx, instanceID, StatusStopped); err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}

	im.emitStateChangeEvent(ctx, instanceID, string(StatusStopping), string(StatusStopped))
	im.logger.Info().Str("instance_id", instanceID).Msg("Instance stopped successfully")

	return nil
}

// RestartInstance restarts a service instance
func (im *InstanceManager) RestartInstance(ctx context.Context, instanceID string) error {
	im.logger.Info().Str("instance_id", instanceID).Msg("Restarting instance")

	// Stop the instance
	if err := im.StopInstance(ctx, instanceID); err != nil {
		return fmt.Errorf("failed to stop instance: %w", err)
	}

	// Start the instance
	if err := im.StartInstance(ctx, instanceID); err != nil {
		return fmt.Errorf("failed to start instance: %w", err)
	}

	return nil
}

// DeleteInstance deletes a service instance and cleans up resources
func (im *InstanceManager) DeleteInstance(ctx context.Context, instanceID string) error {
	// Get instance from database
	instance, err := im.config.Store.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		return fmt.Errorf("instance not found: %w", err)
	}

	// Validate state transition
	currentStatus := InstanceStatus(instance.Status)
	if !im.canTransition(currentStatus, StatusDeleting) {
		return fmt.Errorf("cannot delete instance in %s state (must be stopped or installed first)", currentStatus)
	}

	// Update status to deleting
	if err := im.updateInstanceStatus(ctx, instanceID, StatusDeleting); err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}
	im.emitStateChangeEvent(ctx, instanceID, string(currentStatus), string(StatusDeleting))

	// Stop process if running
	_, exists := im.config.Supervisor.Get(instanceID)
	if exists {
		_ = im.config.Supervisor.Stop(ctx, instanceID)
		_ = im.config.Supervisor.Remove(instanceID)
	}

	// Release allocated resources
	if len(instance.Ports) > 0 {
		im.releasePorts(ctx, instance.RouterID, instance.Ports)
	}

	// Delete database record
	if err := im.config.Store.ServiceInstance.DeleteOneID(instanceID).Exec(ctx); err != nil {
		return fmt.Errorf("failed to delete instance record: %w", err)
	}

	im.logger.Info().Str("instance_id", instanceID).Msg("Instance deleted successfully")

	return nil
}

// Reconcile synchronizes database state with running processes on startup
func (im *InstanceManager) Reconcile(ctx context.Context) error {
	im.logger.Info().Msg("Starting instance reconciliation")

	// Get all instances from database
	instances, err := im.config.Store.ServiceInstance.Query().All(ctx)
	if err != nil {
		return fmt.Errorf("failed to query instances: %w", err)
	}

	for _, instance := range instances {
		status := InstanceStatus(instance.Status)

		// Handle instances that should be running
		if status == StatusRunning {
			// Check if process is actually running in supervisor
			mp, exists := im.config.Supervisor.Get(instance.ID)

			if !exists || mp.State() != ProcessStateRunning {
				// Process not running, update status to stopped
				im.logger.Warn().Str("instance_id", instance.ID).Msg("Instance marked as running but process not found, marking as stopped")
				im.updateInstanceStatus(ctx, instance.ID, StatusStopped)
			}
		}

		// Clean up stuck installing/starting/stopping states
		if status == StatusInstalling || status == StatusStarting || status == StatusStopping {
			im.logger.Warn().Str("instance_id", instance.ID).Str("status", string(status)).Msg("Instance in transient state, marking as failed")
			im.updateInstanceStatus(ctx, instance.ID, StatusFailed)
		}
	}

	im.logger.Info().Int("instances_reconciled", len(instances)).Msg("Reconciliation complete")
	return nil
}

// Helper methods

func (im *InstanceManager) canTransition(from InstanceStatus, to InstanceStatus) bool {
	validTargets, exists := ValidTransitions[from]
	if !exists {
		return false
	}

	for _, valid := range validTargets {
		if valid == to {
			return true
		}
	}
	return false
}

func (im *InstanceManager) updateInstanceStatus(ctx context.Context, instanceID string, status InstanceStatus) error {
	_, err := im.config.Store.ServiceInstance.UpdateOneID(instanceID).
		SetStatus(serviceinstance.Status(status)).
		Save(ctx)
	return err
}

func (im *InstanceManager) emitStateChangeEvent(ctx context.Context, instanceID string, fromStatus string, toStatus string) {
	if im.config.EventBus == nil {
		return
	}

	event := events.NewBaseEvent("service.instance.state_changed", events.PriorityNormal, "instance-manager")
	// TODO: Implement proper event struct with instance details
	_ = im.config.EventBus.Publish(ctx, &event)
}

func (im *InstanceManager) allocatePorts(ctx context.Context, routerID string, requiredPorts []int) ([]int, error) {
	// TODO: Implement actual port allocation logic
	// For now, just return the required ports
	return requiredPorts, nil
}

func (im *InstanceManager) releasePorts(ctx context.Context, routerID string, ports []int) {
	// TODO: Implement actual port release logic
	im.logger.Debug().Interface("ports", ports).Msg("Releasing ports")
}

func (im *InstanceManager) buildProcessArgs(manifest *features.Manifest, instance *ent.ServiceInstance) []string {
	// TODO: Build process arguments from manifest and instance config
	return []string{}
}

func (im *InstanceManager) buildProcessEnv(manifest *features.Manifest, instance *ent.ServiceInstance) []string {
	// TODO: Build environment variables from manifest
	env := []string{}
	for key, value := range manifest.EnvironmentVars {
		env = append(env, fmt.Sprintf("%s=%s", key, value))
	}
	return env
}

// CreateInstanceRequest contains parameters for creating a new instance
type CreateInstanceRequest struct {
	FeatureID         string
	InstanceName      string
	RouterID          string
	RouterOSVersion   string
	Architecture      string
	AvailableMemoryMB int
	AvailableDiskMB   int
	Config            map[string]interface{}
}
