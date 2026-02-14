package orchestrator

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/events"

	"github.com/rs/zerolog"
	"golang.org/x/sync/errgroup"
)

// BootSequenceManagerConfig holds configuration for the boot sequence manager
type BootSequenceManagerConfig struct {
	DependencyMgr *DependencyManager
	InstanceMgr   *InstanceManager
	Store         *ent.Client
	EventBus      events.EventBus
	Logger        zerolog.Logger
}

// BootSequenceManager orchestrates service instance startup on system boot
type BootSequenceManager struct {
	depMgr    *DependencyManager
	instMgr   *InstanceManager
	store     *ent.Client
	eventBus  events.EventBus
	publisher *events.Publisher
	logger    zerolog.Logger
}

// NewBootSequenceManager creates a new boot sequence manager
func NewBootSequenceManager(cfg BootSequenceManagerConfig) (*BootSequenceManager, error) {
	if cfg.DependencyMgr == nil {
		return nil, fmt.Errorf("dependency manager is required")
	}
	if cfg.InstanceMgr == nil {
		return nil, fmt.Errorf("instance manager is required")
	}
	if cfg.Store == nil {
		return nil, fmt.Errorf("ent store is required")
	}
	if cfg.EventBus == nil {
		return nil, fmt.Errorf("event bus is required")
	}

	bsm := &BootSequenceManager{
		depMgr:   cfg.DependencyMgr,
		instMgr:  cfg.InstanceMgr,
		store:    cfg.Store,
		eventBus: cfg.EventBus,
		logger:   cfg.Logger,
	}

	// Create event publisher
	if cfg.EventBus != nil {
		bsm.publisher = events.NewPublisher(cfg.EventBus, "boot-sequence-manager")
	}

	return bsm, nil
}

// ExecuteBootSequence executes the boot sequence for all auto-start service instances
// Returns error if the boot sequence fails critically, but partial boot is acceptable
func (bsm *BootSequenceManager) ExecuteBootSequence(ctx context.Context) error {
	startTime := time.Now()

	// Get all service instances with auto_start=true
	instances, err := bsm.store.ServiceInstance.Query().
		Where(serviceinstance.AutoStart(true)).
		All(ctx)
	if err != nil {
		return fmt.Errorf("failed to query auto-start instances: %w", err)
	}

	if len(instances) == 0 {
		bsm.logger.Info().Msg("no auto-start instances found")
		return nil
	}

	// Extract instance IDs
	instanceIDs := make([]string, 0, len(instances))
	for _, inst := range instances {
		instanceIDs = append(instanceIDs, inst.ID)
	}

	bsm.logger.Info().
		Int("instance_count", len(instanceIDs)).
		Strs("instance_ids", instanceIDs).
		Msg("starting boot sequence")

	// Publish boot sequence started event
	if bsm.publisher != nil {
		if err := bsm.publisher.PublishBootSequenceStarted(ctx, len(instanceIDs), instanceIDs); err != nil {
			bsm.logger.Warn().Err(err).Msg("failed to publish boot sequence started event")
		}
	}

	// Compute startup order (topological sort)
	layers, err := bsm.depMgr.ComputeStartupOrder(ctx, instanceIDs)
	if err != nil {
		// Publish failed event
		if bsm.publisher != nil {
			bsm.publisher.PublishBootSequenceFailed(ctx, 0, "", err.Error(), []string{})
		}
		return fmt.Errorf("failed to compute startup order: %w", err)
	}

	bsm.logger.Info().
		Int("layer_count", len(layers)).
		Msg("computed startup order")

	// Start each layer sequentially
	successfulStarts := []string{}
	failedStarts := []string{}

	for layerIdx, layer := range layers {
		bsm.logger.Info().
			Int("layer", layerIdx).
			Int("instance_count", len(layer)).
			Strs("instance_ids", layer).
			Msg("starting layer")

		layerStartTime := time.Now()

		// Start all instances in this layer concurrently
		layerSuccesses, layerFailures, err := bsm.startLayer(ctx, layer)
		successfulStarts = append(successfulStarts, layerSuccesses...)
		failedStarts = append(failedStarts, layerFailures...)

		layerDuration := time.Since(layerStartTime)

		// Publish layer complete event
		if bsm.publisher != nil {
			if err := bsm.publisher.PublishBootSequenceLayerComplete(
				ctx,
				layerIdx,
				layer,
				len(layerSuccesses),
				len(layerFailures),
			); err != nil {
				bsm.logger.Warn().Err(err).Msg("failed to publish layer complete event")
			}
		}

		if err != nil {
			// Critical failure in layer - stop boot sequence
			bsm.logger.Error().
				Err(err).
				Int("layer", layerIdx).
				Dur("duration", layerDuration).
				Int("successes", len(layerSuccesses)).
				Int("failures", len(layerFailures)).
				Msg("layer failed, stopping boot sequence")

			// Publish failed event
			if bsm.publisher != nil {
				// Find the first failed instance
				var failedID string
				if len(layerFailures) > 0 {
					failedID = layerFailures[0]
				}
				bsm.publisher.PublishBootSequenceFailed(ctx, layerIdx, failedID, err.Error(), successfulStarts)
			}

			return fmt.Errorf("boot sequence failed at layer %d: %w", layerIdx, err)
		}

		bsm.logger.Info().
			Int("layer", layerIdx).
			Dur("duration", layerDuration).
			Int("successes", len(layerSuccesses)).
			Int("failures", len(layerFailures)).
			Msg("layer complete")
	}

	totalDuration := time.Since(startTime)

	// Publish boot sequence complete event
	if bsm.publisher != nil {
		if err := bsm.publisher.PublishBootSequenceComplete(
			ctx,
			len(instanceIDs),
			len(successfulStarts),
			len(failedStarts),
			totalDuration.Milliseconds(),
			failedStarts,
		); err != nil {
			bsm.logger.Warn().Err(err).Msg("failed to publish boot sequence complete event")
		}
	}

	bsm.logger.Info().
		Int("total_instances", len(instanceIDs)).
		Int("started", len(successfulStarts)).
		Int("failed", len(failedStarts)).
		Dur("duration", totalDuration).
		Msg("boot sequence complete")

	if len(failedStarts) > 0 {
		return fmt.Errorf("boot sequence completed with %d failures: %v", len(failedStarts), failedStarts)
	}

	return nil
}

// startLayer starts all instances in a layer concurrently
// Returns (successIDs, failedIDs, error) where error is only set for critical failures
func (bsm *BootSequenceManager) startLayer(ctx context.Context, instanceIDs []string) ([]string, []string, error) {
	// Use errgroup for concurrent starts with context cancellation
	g, groupCtx := errgroup.WithContext(ctx)

	// Track results with mutex
	var mu sync.Mutex
	successIDs := []string{}
	failedIDs := []string{}

	// Start each instance concurrently
	for _, instanceID := range instanceIDs {
		instanceID := instanceID // Capture for goroutine

		g.Go(func() error {
			// Create a health check timeout context for this instance
			// Use 60 seconds per instance (conservative for slow services)
			healthCtx, cancel := context.WithTimeout(groupCtx, 60*time.Second)
			defer cancel()

			bsm.logger.Info().
				Str("instance_id", instanceID).
				Msg("starting instance in layer")

			// Start the instance (will auto-start dependencies if needed)
			if err := bsm.instMgr.StartInstance(healthCtx, instanceID); err != nil {
				mu.Lock()
				failedIDs = append(failedIDs, instanceID)
				mu.Unlock()

				bsm.logger.Error().
					Err(err).
					Str("instance_id", instanceID).
					Msg("failed to start instance in layer")

				// Return error to fail the entire layer
				return fmt.Errorf("instance %s failed to start: %w", instanceID, err)
			}

			mu.Lock()
			successIDs = append(successIDs, instanceID)
			mu.Unlock()

			bsm.logger.Info().
				Str("instance_id", instanceID).
				Msg("instance started successfully")

			return nil
		})
	}

	// Wait for all instances to complete
	if err := g.Wait(); err != nil {
		// At least one instance failed - this is a critical layer failure
		return successIDs, failedIDs, err
	}

	return successIDs, failedIDs, nil
}
