package scanner

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"go.uber.org/zap"

	"backend/internal/events"
)

// Service defines the interface for scanner operations.
type Service interface {
	// StartScan initiates a network scan for the given subnet.
	StartScan(ctx context.Context, subnet string) (*ScanTask, error)
	// StartAutoScan initiates an automatic gateway scan.
	StartAutoScan(ctx context.Context) (*ScanTask, error)
	// GetStatus returns the current status of a scan task.
	GetStatus(taskID string) (*ScanTask, error)
	// CancelScan cancels a running scan.
	CancelScan(taskID string) (*ScanTask, error)
	// GetHistory returns recent scan tasks.
	GetHistory(limit int) []*ScanTask
}

// ScannerService implements the Service interface.
//
//nolint:revive // used across packages
type ScannerService struct {
	config     ScannerConfig
	tasks      sync.Map // map[string]*ScanTask
	eventBus   events.EventBus
	logger     *zap.Logger
	runningCnt int32 // atomic counter for running scans
}

// NewService creates a new scanner service with the given configuration.
// Note: Configuration is validated at service creation time.
func NewService(config ScannerConfig, eventBus events.EventBus, logger *zap.Logger) *ScannerService {
	// Validate configuration
	if err := config.Validate(); err != nil {
		// Log validation error but continue with defaults as fallback
		// This prevents service creation failures due to config issues
		logger.Warn("scanner config validation failed, using defaults", zap.Error(err))
		config = DefaultConfig()
	}
	return &ScannerService{
		config:   config,
		eventBus: eventBus,
		logger:   logger,
	}
}

// NewServiceWithDefaults creates a new scanner service with default configuration.
func NewServiceWithDefaults(eventBus events.EventBus, logger *zap.Logger) *ScannerService {
	return NewService(DefaultConfig(), eventBus, logger)
}

// StartScan initiates a network scan for the given subnet.
func (s *ScannerService) StartScan(ctx context.Context, subnet string) (*ScanTask, error) {
	// Validate subnet
	if err := ValidateSubnet(subnet); err != nil {
		return nil, fmt.Errorf("invalid subnet: %w", err)
	}

	// Check concurrent scan limit
	if atomic.LoadInt32(&s.runningCnt) >= int32(s.config.MaxConcurrentScans) { //nolint:gosec // value range validated
		return nil, fmt.Errorf("maximum concurrent scans reached (%d)", s.config.MaxConcurrentScans)
	}

	// Parse IPs
	ips, err := ParseIPRange(subnet)
	if err != nil {
		return nil, fmt.Errorf("failed to parse subnet: %w", err)
	}

	// Apply smart ordering
	ips = OrderIPsForScan(ips)

	// Create task
	taskID := fmt.Sprintf("scan_%d", time.Now().UnixNano())
	taskCtx, cancel := context.WithCancel(ctx)

	task := &ScanTask{
		ID:        taskID,
		Subnet:    subnet,
		Status:    ScanStatusPending,
		Progress:  0,
		Results:   make([]DiscoveredDevice, 0),
		StartTime: time.Now(),
		TotalIPs:  len(ips),
		cancel:    cancel,
	}

	// Store task
	s.tasks.Store(taskID, task)

	// Start scan in background
	atomic.AddInt32(&s.runningCnt, 1)
	go s.executeScan(taskCtx, task, ips)

	// Publish scan started event
	s.publishScanStarted(task, s.logger)

	return task, nil
}

// StartAutoScan initiates an automatic gateway scan. //nolint:revive // return value is handled by caller
func (s *ScannerService) StartAutoScan(ctx context.Context) (*ScanTask, error) {
	// Check concurrent scan limit
	if atomic.LoadInt32(&s.runningCnt) >= int32(s.config.MaxConcurrentScans) { //nolint:gosec // value range validated
		return nil, fmt.Errorf("maximum concurrent scans reached (%d)", s.config.MaxConcurrentScans)
	}

	// Generate gateway IPs
	ips := GenerateGatewayIPs()

	// Create task
	taskID := fmt.Sprintf("auto_scan_%d", time.Now().UnixNano())
	taskCtx, cancel := context.WithCancel(ctx)

	task := &ScanTask{
		ID:        taskID,
		Subnet:    "192.168.0-255.1",
		Status:    ScanStatusPending,
		Progress:  0,
		Results:   make([]DiscoveredDevice, 0),
		StartTime: time.Now(),
		TotalIPs:  len(ips),
		cancel:    cancel,
	}

	// Store task
	s.tasks.Store(taskID, task)

	// Start scan in background
	atomic.AddInt32(&s.runningCnt, 1)
	go s.executeGatewayScan(taskCtx, task, ips)

	// Publish scan started event
	s.publishScanStarted(task, s.logger)

	return task, nil
}

// GetStatus returns the current status of a scan task.
func (s *ScannerService) GetStatus(taskID string) (*ScanTask, error) {
	if val, ok := s.tasks.Load(taskID); ok {
		if task, ok := val.(*ScanTask); ok {
			return task, nil
		}
	}
	return nil, fmt.Errorf("task not found: %s", taskID)
}

// CancelScan cancels a running scan.
func (s *ScannerService) CancelScan(taskID string) (*ScanTask, error) {
	val, ok := s.tasks.Load(taskID)
	if !ok {
		return nil, fmt.Errorf("task not found: %s", taskID)
	}

	task, ok := val.(*ScanTask)
	if !ok {
		return nil, fmt.Errorf("invalid task type: %s", taskID)
	}
	if task.GetStatus() != ScanStatusRunning && task.GetStatus() != ScanStatusPending {
		return task, nil // Already finished, nothing to cancel
	}

	task.Cancel()
	return task, nil
}

// GetHistory returns recent scan tasks.
func (s *ScannerService) GetHistory(limit int) []*ScanTask {
	if limit <= 0 {
		limit = 100 // Default limit
	}
	var tasks []*ScanTask
	s.tasks.Range(func(key, value interface{}) bool {
		if value == nil {
			return len(tasks) < limit // Skip nil values
		}
		if task, ok := value.(*ScanTask); ok {
			tasks = append(tasks, task)
		}
		return len(tasks) < limit
	})
	return tasks
}

// scheduleCleanup schedules task removal after retention period with cancellation support.
func (s *ScannerService) scheduleCleanup(task *ScanTask) {
	go func() {
		ticker := time.NewTimer(s.config.TaskRetentionDuration)
		defer ticker.Stop()
		<-ticker.C
		s.tasks.Delete(task.ID)
	}()
}
