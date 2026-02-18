package repository

import (
	"context"
	"log"
	"sync"
	"time"

	"backend/internal/database"
)

// CleanupType identifies the type of cleanup operation.
type CleanupType string

const (
	// CleanupRouterDB indicates cleanup of a router-{id}.db file.
	CleanupRouterDB CleanupType = "router_db"
)

// CleanupTask represents a pending cleanup operation.
type CleanupTask struct {
	// Type identifies the cleanup operation type.
	Type CleanupType

	// RouterID is the router ID for router DB cleanup.
	RouterID string

	// EnqueuedAt is when the task was added to the queue.
	EnqueuedAt time.Time

	// RetryCount tracks how many times this task has been retried.
	RetryCount int

	// LastError is the error from the last failed attempt.
	LastError error
}

// CleanupQueueConfig holds configuration for the cleanup queue.
type CleanupQueueConfig struct {
	// DBManager provides access to router database files.
	DBManager *database.Manager

	// MaxRetries is the maximum number of retry attempts.
	MaxRetries int

	// RetryInterval is the time between retry attempts.
	RetryInterval time.Duration

	// ProcessInterval is how often the queue is processed.
	ProcessInterval time.Duration
}

// CleanupQueue manages eventual consistency cleanup operations.
// It provides reliable cleanup of cross-database resources (e.g., router-{id}.db files)
// with retry logic and failure handling.
//
// Architecture Note:
// This queue implements eventual consistency for cross-database operations.
// SQLite does not support distributed transactions, so we use this pattern:
// 1. Primary operation on system.db succeeds (authoritative)
// 2. Cleanup tasks are queued and processed asynchronously
// 3. Failed cleanups are retried with exponential backoff
type CleanupQueue struct {
	mu            sync.Mutex
	tasks         []CleanupTask
	dbManager     *database.Manager
	maxRetries    int
	retryInterval time.Duration
	ticker        *time.Ticker
	done          chan struct{}
	wg            sync.WaitGroup
}

// DefaultCleanupQueueConfig returns default configuration for the cleanup queue.
func DefaultCleanupQueueConfig(dbManager *database.Manager) CleanupQueueConfig {
	return CleanupQueueConfig{
		DBManager:       dbManager,
		MaxRetries:      5,
		RetryInterval:   30 * time.Second,
		ProcessInterval: 10 * time.Second,
	}
}

// NewCleanupQueue creates a new cleanup queue.
func NewCleanupQueue(cfg CleanupQueueConfig) *CleanupQueue {
	return &CleanupQueue{
		tasks:         make([]CleanupTask, 0),
		dbManager:     cfg.DBManager,
		maxRetries:    cfg.MaxRetries,
		retryInterval: cfg.RetryInterval,
		ticker:        time.NewTicker(cfg.ProcessInterval),
		done:          make(chan struct{}),
	}
}

// Start begins background processing of cleanup tasks.
func (q *CleanupQueue) Start(ctx context.Context) {
	q.wg.Add(1)
	go func() {
		defer q.wg.Done()
		for {
			select {
			case <-ctx.Done():
				return
			case <-q.done:
				return
			case <-q.ticker.C:
				q.processTasks(ctx)
			}
		}
	}()
	log.Printf("[cleanup-queue] Started background processor")
}

// Stop stops background processing and waits for completion.
func (q *CleanupQueue) Stop() {
	close(q.done)
	q.ticker.Stop()
	q.wg.Wait()
	log.Printf("[cleanup-queue] Stopped")
}

// Enqueue adds a cleanup task to the queue.
func (q *CleanupQueue) Enqueue(task CleanupTask) {
	q.mu.Lock()
	defer q.mu.Unlock()

	q.tasks = append(q.tasks, task)
	log.Printf("[cleanup-queue] Enqueued %s cleanup for router %s", task.Type, task.RouterID)
}

// PendingCount returns the number of pending cleanup tasks.
func (q *CleanupQueue) PendingCount() int {
	q.mu.Lock()
	defer q.mu.Unlock()
	return len(q.tasks)
}

// processTasks processes all pending cleanup tasks.
func (q *CleanupQueue) processTasks(ctx context.Context) {
	q.mu.Lock()
	tasks := make([]CleanupTask, len(q.tasks))
	copy(tasks, q.tasks)
	q.tasks = q.tasks[:0] // Clear the slice but keep capacity
	q.mu.Unlock()

	if len(tasks) == 0 {
		return
	}

	log.Printf("[cleanup-queue] Processing %d cleanup tasks", len(tasks))

	var retryTasks []CleanupTask

	for _, task := range tasks {
		err := q.executeTask(ctx, task)
		if err != nil {
			task.LastError = err
			task.RetryCount++

			if task.RetryCount < q.maxRetries {
				// Schedule for retry
				retryTasks = append(retryTasks, task)
				log.Printf("[cleanup-queue] Task %s for router %s failed (attempt %d/%d): %v",
					task.Type, task.RouterID, task.RetryCount, q.maxRetries, err)
			} else {
				// Max retries exceeded, log and discard
				log.Printf("[cleanup-queue] FAILED: Task %s for router %s exceeded max retries (%d): %v",
					task.Type, task.RouterID, q.maxRetries, err)
			}
		} else {
			log.Printf("[cleanup-queue] Completed %s cleanup for router %s", task.Type, task.RouterID)
		}
	}

	// Re-queue failed tasks for retry
	if len(retryTasks) > 0 {
		q.mu.Lock()
		q.tasks = append(q.tasks, retryTasks...)
		q.mu.Unlock()
	}
}

// executeTask executes a single cleanup task.
func (q *CleanupQueue) executeTask(_ctx context.Context, task CleanupTask) error {
	switch task.Type {
	case CleanupRouterDB:
		return q.cleanupRouterDB(task.RouterID)
	default:
		log.Printf("[cleanup-queue] Unknown cleanup type: %s", task.Type)
		return nil // Don't retry unknown types
	}
}

// cleanupRouterDB deletes a router-{id}.db file.
func (q *CleanupQueue) cleanupRouterDB(routerID string) error {
	if q.dbManager == nil {
		log.Printf("[cleanup-queue] No database manager, skipping router DB cleanup for %s", routerID)
		return nil
	}

	return q.dbManager.DeleteRouterDB(routerID)
}

// ProcessNow immediately processes all pending tasks.
// This is useful for testing and graceful shutdown.
func (q *CleanupQueue) ProcessNow(ctx context.Context) {
	q.processTasks(ctx)
}

// GetPendingTasks returns a copy of all pending tasks.
// This is useful for debugging and monitoring.
func (q *CleanupQueue) GetPendingTasks() []CleanupTask {
	q.mu.Lock()
	defer q.mu.Unlock()

	tasks := make([]CleanupTask, len(q.tasks))
	copy(tasks, q.tasks)
	return tasks
}
