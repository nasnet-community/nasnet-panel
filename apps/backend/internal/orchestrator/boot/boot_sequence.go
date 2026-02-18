package boot

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/orchestrator/dependencies"

	"backend/internal/events"

	"github.com/rs/zerolog"
	"golang.org/x/sync/errgroup"
)

// InstanceStarter defines the interface for starting service instances.
// This interface allows testing with mock implementations.
type InstanceStarter interface {
	StartInstance(ctx context.Context, instanceID string) error
}

// SequenceManagerConfig holds configuration for the boot sequence manager
//
//nolint:revive // stuttering name kept for clarity as the primary config type in the boot package
type BootSequenceManagerConfig struct {
	DependencyMgr *dependencies.DependencyManager
	InstanceMgr   InstanceStarter
	Store         *ent.Client
	EventBus      events.EventBus
	Logger        zerolog.Logger
}

// SequenceManager orchestrates service instance startup on system boot
//
//nolint:revive // stuttering name kept for clarity as the primary exported type in the boot package
type BootSequenceManager struct {
	depMgr    *dependencies.DependencyManager
	instMgr   InstanceStarter
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

	instanceIDs, err := bsm.collectAutoStartInstances(ctx)
	if err != nil {
		return err
	}
	if len(instanceIDs) == 0 {
		bsm.logger.Info().Msg("no auto-start instances found")
		return nil
	}

	bsm.logger.Info().
		Int("instance_count", len(instanceIDs)).
		Strs("instance_ids", instanceIDs).
		Msg("starting boot sequence")

	bsm.publishStartedEvent(ctx, instanceIDs)

	layers, err := bsm.computeStartupLayers(ctx, instanceIDs)
	if err != nil {
		return err
	}

	successfulStarts, failedStarts, err := bsm.executeLayers(ctx, layers)
	if err != nil {
		return err
	}

	totalDuration := time.Since(startTime)
	bsm.publishCompletedEvent(ctx, instanceIDs, successfulStarts, failedStarts, totalDuration)

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

// collectAutoStartInstances queries all service instances with auto_start=true.
func (bsm *BootSequenceManager) collectAutoStartInstances(ctx context.Context) ([]string, error) {
	instances, err := bsm.store.ServiceInstance.Query().
		Where(serviceinstance.AutoStart(true)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query auto-start instances: %w", err)
	}

	instanceIDs := make([]string, 0, len(instances))
	for _, inst := range instances {
		instanceIDs = append(instanceIDs, inst.ID)
	}
	return instanceIDs, nil
}

// publishStartedEvent publishes the boot sequence started event.
func (bsm *BootSequenceManager) publishStartedEvent(ctx context.Context, instanceIDs []string) {
	if bsm.publisher != nil {
		if pubErr := bsm.publisher.PublishBootSequenceStarted(ctx, len(instanceIDs), instanceIDs); pubErr != nil {
			bsm.logger.Warn().Err(pubErr).Msg("failed to publish boot sequence started event")
		}
	}
}

// computeStartupLayers computes the topological startup order.
func (bsm *BootSequenceManager) computeStartupLayers(ctx context.Context, instanceIDs []string) ([][]string, error) {
	layers, err := bsm.depMgr.ComputeStartupOrder(ctx, instanceIDs)
	if err != nil {
		if bsm.publisher != nil {
			_ = bsm.publisher.PublishBootSequenceFailed(ctx, 0, "", err.Error(), []string{}) //nolint:errcheck // event publication is best-effort, boot failure is already being returned
		}
		return nil, fmt.Errorf("failed to compute startup order: %w", err)
	}

	bsm.logger.Info().
		Int("layer_count", len(layers)).
		Msg("computed startup order")
	return layers, nil
}

// executeLayers starts each layer sequentially, returning accumulated successes and failures.
func (bsm *BootSequenceManager) executeLayers(ctx context.Context, layers [][]string) (successfulStarts, failedStarts []string, retErr error) {
	for layerIdx, layer := range layers {
		bsm.logger.Info().
			Int("layer", layerIdx).
			Int("instance_count", len(layer)).
			Strs("instance_ids", layer).
			Msg("starting layer")

		layerStartTime := time.Now()
		layerSuccesses, layerFailures, err := bsm.startLayer(ctx, layer)
		successfulStarts = append(successfulStarts, layerSuccesses...)
		failedStarts = append(failedStarts, layerFailures...)
		layerDuration := time.Since(layerStartTime)

		if bsm.publisher != nil {
			if pubErr := bsm.publisher.PublishBootSequenceLayerComplete(ctx, layerIdx, layer, len(layerSuccesses), len(layerFailures)); pubErr != nil {
				bsm.logger.Warn().Err(pubErr).Msg("failed to publish layer complete event")
			}
		}

		if err != nil {
			bsm.logger.Error().
				Err(err).
				Int("layer", layerIdx).
				Dur("duration", layerDuration).
				Int("successes", len(layerSuccesses)).
				Int("failures", len(layerFailures)).
				Msg("layer failed, stopping boot sequence")

			if bsm.publisher != nil {
				var failedID string
				if len(layerFailures) > 0 {
					failedID = layerFailures[0]
				}
				_ = bsm.publisher.PublishBootSequenceFailed(ctx, layerIdx, failedID, err.Error(), successfulStarts) //nolint:errcheck // event publication is best-effort, boot failure is already being returned
			}

			return successfulStarts, failedStarts, fmt.Errorf("boot sequence failed at layer %d: %w", layerIdx, err)
		}

		bsm.logger.Info().
			Int("layer", layerIdx).
			Dur("duration", layerDuration).
			Int("successes", len(layerSuccesses)).
			Int("failures", len(layerFailures)).
			Msg("layer complete")
	}

	return successfulStarts, failedStarts, nil
}

// publishCompletedEvent publishes the boot sequence completion event.
func (bsm *BootSequenceManager) publishCompletedEvent(ctx context.Context, instanceIDs, successfulStarts, failedStarts []string, totalDuration time.Duration) {
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
}

// startLayer starts all instances in a layer concurrently
// Returns (successIDs, failedIDs, error) where error is only set for critical failures
func (bsm *BootSequenceManager) startLayer(ctx context.Context, instanceIDs []string) (successIDs, failedIDs []string, err error) {
	// Use errgroup for concurrent starts with context cancellation
	g, groupCtx := errgroup.WithContext(ctx)

	// Track results with mutex
	var mu sync.Mutex
	successIDs = []string{}
	failedIDs = []string{}

	// Start each instance concurrently
	for _, instanceID := range instanceIDs {
		g.Go(func(id string) func() error {
			return func() error {
				// Create a health check timeout context for this instance
				// Use 60 seconds per instance (conservative for slow services)
				healthCtx, cancel := context.WithTimeout(groupCtx, 60*time.Second)
				defer cancel()

				bsm.logger.Info().
					Str("instance_id", id).
					Msg("starting instance in layer")

				// Start the instance (will auto-start dependencies if needed)
				if err := bsm.instMgr.StartInstance(healthCtx, id); err != nil {
					mu.Lock()
					failedIDs = append(failedIDs, id)
					mu.Unlock()

					bsm.logger.Error().
						Err(err).
						Str("instance_id", id).
						Msg("failed to start instance in layer")

					// Return error to fail the entire layer
					return fmt.Errorf("instance %s failed to start: %w", id, err)
				}

				mu.Lock()
				successIDs = append(successIDs, id)
				mu.Unlock()

				bsm.logger.Info().
					Str("instance_id", id).
					Msg("instance started successfully")

				return nil
			}
		}(instanceID))
	}

	// Wait for all instances to complete
	if err := g.Wait(); err != nil {
		// At least one instance failed - this is a critical layer failure
		return successIDs, failedIDs, err
	}

	return successIDs, failedIDs, nil
}
