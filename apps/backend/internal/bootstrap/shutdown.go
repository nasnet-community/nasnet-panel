package bootstrap

import (
	"context"
	"time"

	"go.uber.org/zap"

	"backend/internal/alerts"
	"backend/internal/database"
	"backend/internal/events"
	"backend/internal/features/updates"
	"backend/internal/storage"
	"backend/internal/vif/traffic"
)

// ShutdownCoordinator coordinates graceful shutdown of all components.
// Shutdown order is critical: event sources stop first, then event processors,
// then persistent storage, and finally the database connection.
type ShutdownCoordinator struct {
	dbManager         *database.Manager
	eventBus          events.EventBus
	alertEngine       *alerts.Engine
	digestScheduler   *alerts.DigestScheduler
	updateScheduler   *updates.UpdateScheduler
	storageDetector   *storage.StorageDetector
	trafficAggregator *traffic.TrafficAggregator
	logger            *zap.SugaredLogger
}

// NewShutdownCoordinator creates a new shutdown coordinator.
func NewShutdownCoordinator(
	dbManager *database.Manager,
	eventBus events.EventBus,
	alertEngine *alerts.Engine,
	digestScheduler *alerts.DigestScheduler,
	updateScheduler *updates.UpdateScheduler,
	storageDetector *storage.StorageDetector,
	logger *zap.SugaredLogger,
) *ShutdownCoordinator {

	return &ShutdownCoordinator{
		dbManager:       dbManager,
		eventBus:        eventBus,
		alertEngine:     alertEngine,
		digestScheduler: digestScheduler,
		updateScheduler: updateScheduler,
		storageDetector: storageDetector,
		logger:          logger,
	}
}

// WithTrafficAggregator adds a traffic aggregator to the shutdown coordinator.
// This must be called if traffic components are initialized.
func (s *ShutdownCoordinator) WithTrafficAggregator(agg *traffic.TrafficAggregator) *ShutdownCoordinator {
	s.trafficAggregator = agg
	return s
}

// Shutdown performs graceful shutdown in the correct order.
// Shutdown order is critical to ensure clean teardown and data consistency:
//
// Phase 1: Stop event sources (prevent new event generation)
//  1. Alert engine (prevents new alert evaluation and processing)
//  2. Update scheduler (cancels pending version checks)
//  3. Storage detector (stops mount point monitoring)
//  4. Digest scheduler (cancels notification timers)
//  5. Traffic aggregator (flushes buffered traffic data to database)
//
// Phase 2: Drain event bus and close connections
//  6. Event bus (flush all pending events)
//  7. Database (close all connections)
func (s *ShutdownCoordinator) Shutdown(ctx context.Context) error {
	s.logger.Infow("Server is shutting down gracefully")

	// Create timeout context for shutdown operations
	shutdownCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	// Phase 1: Stop event sources
	// 1. Alert engine first to prevent processing new events
	if s.alertEngine != nil {
		if err := s.alertEngine.Stop(shutdownCtx); err != nil {
			s.logger.Warnw("Error stopping alert engine", zap.Error(err))
		} else {
			s.logger.Infow("Alert engine stopped")
		}
	}

	// 2. Update scheduler to cancel pending version checks
	if s.updateScheduler != nil {
		if err := s.updateScheduler.Stop(); err != nil {
			s.logger.Warnw("Error stopping update scheduler", zap.Error(err))
		} else {
			s.logger.Infow("Update scheduler stopped")
		}
	}

	// 3. Storage detector to stop mount point monitoring
	if s.storageDetector != nil {
		s.storageDetector.Stop()
		s.logger.Infow("Storage detector stopped")
	}

	// 4. Digest scheduler to cancel notification timers
	if s.digestScheduler != nil {
		s.digestScheduler.Stop()
		s.logger.Infow("Digest scheduler stopped")
	}

	// 5. Traffic aggregator to flush buffered traffic data
	if s.trafficAggregator != nil {
		if err := s.trafficAggregator.Stop(shutdownCtx); err != nil {
			s.logger.Warnw("Error stopping traffic aggregator", zap.Error(err))
		}
		s.logger.Infow("Traffic aggregator stopped (data flushed)")
	}

	// Phase 2: Drain event bus and close connections
	// 6. Event bus to flush all pending events
	if s.eventBus != nil {
		if err := s.eventBus.Close(); err != nil {
			s.logger.Warnw("Error closing event bus", zap.Error(err))
		} else {
			s.logger.Infow("Event bus closed")
		}
	}

	// 7. Database manager to close all connections
	if s.dbManager != nil {
		if err := s.dbManager.Close(); err != nil {
			s.logger.Warnw("Error closing database", zap.Error(err))
		} else {
			s.logger.Infow("Database closed")
		}
	}

	s.logger.Infow("Graceful shutdown complete")
	return nil
}
