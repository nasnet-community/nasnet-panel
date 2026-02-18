package bootstrap

import (
	"context"
	"log"
	"time"

	"backend/internal/alerts"
	"backend/internal/database"
	"backend/internal/features/updates"

	"backend/internal/events"
	"backend/internal/storage"
)

// ShutdownCoordinator coordinates graceful shutdown of all components.
type ShutdownCoordinator struct {
	dbManager       *database.Manager
	eventBus        events.EventBus
	alertEngine     *alerts.Engine
	digestScheduler *alerts.DigestScheduler
	updateScheduler *updates.UpdateScheduler
	storageDetector *storage.StorageDetector
}

// NewShutdownCoordinator creates a new shutdown coordinator.
func NewShutdownCoordinator(
	dbManager *database.Manager,
	eventBus events.EventBus,
	alertEngine *alerts.Engine,
	digestScheduler *alerts.DigestScheduler,
	updateScheduler *updates.UpdateScheduler,
	storageDetector *storage.StorageDetector,
) *ShutdownCoordinator {

	return &ShutdownCoordinator{
		dbManager:       dbManager,
		eventBus:        eventBus,
		alertEngine:     alertEngine,
		digestScheduler: digestScheduler,
		updateScheduler: updateScheduler,
		storageDetector: storageDetector,
	}
}

// Shutdown performs graceful shutdown in the correct order.
// Order is critical to ensure clean teardown:
// 1. Stop alert engine (prevent new event processing)
// 2. Stop digest scheduler (cancel timers, wait for in-flight deliveries)
// 3. Stop update scheduler (cancel pending update checks)
// 4. Stop storage detector (stop mount point monitoring)
// 5. Close event bus (flush pending events)
// 6. Close database manager (close all connections)
func (s *ShutdownCoordinator) Shutdown(ctx context.Context) error {
	log.Println("Server is shutting down gracefully...")

	// Create timeout context for shutdown operations
	shutdownCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	// 1. Stop alert engine first to prevent processing new events
	if s.alertEngine != nil {
		if err := s.alertEngine.Stop(shutdownCtx); err != nil {
			log.Printf("Warning: error stopping alert engine: %v", err)
		} else {
			log.Println("Alert engine stopped")
		}
	}

	// 2. Stop digest scheduler to cancel all timers and wait for in-flight deliveries
	if s.digestScheduler != nil {
		s.digestScheduler.Stop()
		log.Println("Digest scheduler stopped")
	}

	// 3. Stop update scheduler to cancel all timers and pending update checks
	if s.updateScheduler != nil {
		if err := s.updateScheduler.Stop(); err != nil {
			log.Printf("Warning: error stopping update scheduler: %v", err)
		} else {
			log.Println("Update scheduler stopped")
		}
	}

	// 4. Stop storage detector to stop mount point monitoring
	if s.storageDetector != nil {
		s.storageDetector.Stop()
		log.Println("Storage detector stopped")
	}

	// 5. Close event bus second to flush pending events
	if s.eventBus != nil {
		if err := s.eventBus.Close(); err != nil {
			log.Printf("Warning: error closing event bus: %v", err)
		} else {
			log.Println("Event bus closed")
		}
	}

	// 6. Close database manager
	if s.dbManager != nil {
		if err := s.dbManager.Close(); err != nil {
			log.Printf("Warning: error closing database: %v", err)
		} else {
			log.Println("Database closed")
		}
	}

	log.Println("Graceful shutdown complete")
	return nil
}
