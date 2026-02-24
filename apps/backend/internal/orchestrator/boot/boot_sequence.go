package boot

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/events"
	"backend/internal/orchestrator/dependencies"
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
	Logger        *zap.Logger
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
	logger    *zap.Logger
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
		bsm.logger.Info("no auto-start instances found")
		return nil
	}

	bsm.logger.Info("starting boot sequence",
		zap.Int("instance_count", len(instanceIDs)),
		zap.Strings("instance_ids", instanceIDs))

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

	bsm.logger.Info("boot sequence complete",
		zap.Int("total_instances", len(instanceIDs)),
		zap.Int("started", len(successfulStarts)),
		zap.Int("failed", len(failedStarts)),
		zap.Duration("duration", totalDuration))

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
			bsm.logger.Warn("failed to publish boot sequence started event", zap.Error(pubErr))
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

	bsm.logger.Info("computed startup order", zap.Int("layer_count", len(layers)))
	return layers, nil
}

// executeLayers starts each layer sequentially, returning accumulated successes and failures.
func (bsm *BootSequenceManager) executeLayers(ctx context.Context, layers [][]string) (successfulStarts, failedStarts []string, retErr error) {
	for layerIdx, layer := range layers {
		bsm.logger.Info("starting layer",
			zap.Int("layer", layerIdx),
			zap.Int("instance_count", len(layer)),
			zap.Strings("instance_ids", layer))

		layerStartTime := time.Now()
		layerSuccesses, layerFailures, err := bsm.startLayer(ctx, layer)
		successfulStarts = append(successfulStarts, layerSuccesses...)
		failedStarts = append(failedStarts, layerFailures...)
		layerDuration := time.Since(layerStartTime)

		if bsm.publisher != nil {
			if pubErr := bsm.publisher.PublishBootSequenceLayerComplete(ctx, layerIdx, layer, len(layerSuccesses), len(layerFailures)); pubErr != nil {
				bsm.logger.Warn("failed to publish layer complete event", zap.Error(pubErr))
			}
		}

		if err != nil {
			bsm.logger.Error("layer failed, stopping boot sequence",
				zap.Error(err),
				zap.Int("layer", layerIdx),
				zap.Duration("duration", layerDuration),
				zap.Int("successes", len(layerSuccesses)),
				zap.Int("failures", len(layerFailures)))

			if bsm.publisher != nil {
				var failedID string
				if len(layerFailures) > 0 {
					failedID = layerFailures[0]
				}
				_ = bsm.publisher.PublishBootSequenceFailed(ctx, layerIdx, failedID, err.Error(), successfulStarts) //nolint:errcheck // event publication is best-effort, boot failure is already being returned
			}

			return successfulStarts, failedStarts, fmt.Errorf("boot sequence failed at layer %d: %w", layerIdx, err)
		}

		bsm.logger.Info("layer complete",
			zap.Int("layer", layerIdx),
			zap.Duration("duration", layerDuration),
			zap.Int("successes", len(layerSuccesses)),
			zap.Int("failures", len(layerFailures)))
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
			bsm.logger.Warn("failed to publish boot sequence complete event", zap.Error(err))
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

				bsm.logger.Info("starting instance in layer", zap.String("instance_id", id))

				// Start the instance (will auto-start dependencies if needed)
				if err := bsm.instMgr.StartInstance(healthCtx, id); err != nil {
					mu.Lock()
					failedIDs = append(failedIDs, id)
					mu.Unlock()

					bsm.logger.Error("failed to start instance in layer",
						zap.Error(err),
						zap.String("instance_id", id))

					// Return error to fail the entire layer
					return fmt.Errorf("instance %s failed to start: %w", id, err)
				}

				mu.Lock()
				successIDs = append(successIDs, id)
				mu.Unlock()

				bsm.logger.Info("instance started successfully", zap.String("instance_id", id))

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
