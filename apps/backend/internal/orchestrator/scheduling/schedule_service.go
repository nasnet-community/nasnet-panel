package scheduling

import (
	"context"
	"fmt"
	"regexp"
	"sync"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/devicerouting"
	"backend/generated/ent/routingschedule"

	"backend/internal/events"

	"github.com/oklog/ulid/v2"
	"go.uber.org/zap"
)

// ScheduleServiceConfig holds configuration for the schedule service
type ScheduleServiceConfig struct {
	Store     *ent.Client
	Scheduler *ScheduleEvaluator
	EventBus  events.EventBus
	Logger    *zap.Logger
}

// ScheduleService manages CRUD operations for routing schedules
type ScheduleService struct {
	mu        sync.RWMutex
	store     *ent.Client
	scheduler *ScheduleEvaluator
	eventBus  events.EventBus
	publisher *events.Publisher
	logger    *zap.Logger
}

// ScheduleInput represents validated input for creating/updating schedules
type ScheduleInput struct {
	RoutingID string
	Days      []int
	StartTime string
	EndTime   string
	Timezone  string
	Enabled   bool
}

// timeRegex validates HH:MM format (24-hour)
var timeRegex = regexp.MustCompile(`^(?:[0-1][0-9]|2[0-3]):[0-5][0-9]$`) //nolint:gocritic // compiled regex is intentionally package-level for reuse across validations

// NewScheduleService creates a new schedule service
func NewScheduleService(cfg ScheduleServiceConfig) (*ScheduleService, error) {
	if cfg.Store == nil {
		return nil, fmt.Errorf("ent store is required")
	}
	if cfg.Scheduler == nil {
		return nil, fmt.Errorf("schedule evaluator is required")
	}
	if cfg.EventBus == nil {
		return nil, fmt.Errorf("event bus is required")
	}

	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	svc := &ScheduleService{
		store:     cfg.Store,
		scheduler: cfg.Scheduler,
		eventBus:  cfg.EventBus,
		logger:    logger,
	}

	// Create event publisher
	svc.publisher = events.NewPublisher(cfg.EventBus, "schedule-service")

	return svc, nil
}

// CreateSchedule creates a new routing schedule with validation
func (s *ScheduleService) CreateSchedule(ctx context.Context, input ScheduleInput) (*ent.RoutingSchedule, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Validate input
	if err := s.validateScheduleInput(input); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Verify routing exists
	routingExists, err := s.store.DeviceRouting.Query().
		Where(devicerouting.ID(input.RoutingID)).
		Exist(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to verify routing existence: %w", err)
	}
	if !routingExists {
		return nil, fmt.Errorf("device routing %s does not exist", input.RoutingID)
	}

	// Create schedule
	id := ulid.Make().String()
	schedule, err := s.store.RoutingSchedule.Create().
		SetID(id).
		SetRoutingID(input.RoutingID).
		SetDays(input.Days).
		SetStartTime(input.StartTime).
		SetEndTime(input.EndTime).
		SetTimezone(input.Timezone).
		SetEnabled(input.Enabled).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create schedule: %w", err)
	}

	s.logger.Info("Created routing schedule", zap.String("schedule_id", schedule.ID), zap.String("routing_id", input.RoutingID), zap.String("start_time", input.StartTime), zap.String("end_time", input.EndTime), zap.String("timezone", input.Timezone))

	// Publish event
	if s.publisher != nil {
		scheduleEvent := events.NewScheduleCreatedEvent(
			schedule.ID,
			input.RoutingID,
			input.StartTime,
			input.EndTime,
			input.Timezone,
			input.Days,
			input.Enabled,
			"schedule-service",
		)
		if err := s.publisher.Publish(ctx, scheduleEvent); err != nil {
			s.logger.Error("Failed to publish schedule created event", zap.Error(err), zap.String("schedule_id", schedule.ID))
		}
	}

	// Trigger immediate evaluation if enabled
	if input.Enabled {
		if err := s.scheduler.Evaluate(ctx); err != nil {
			s.logger.Error("Failed to trigger schedule evaluation after create", zap.Error(err))
		}
	}

	return schedule, nil
}

// UpdateSchedule updates an existing routing schedule
func (s *ScheduleService) UpdateSchedule(ctx context.Context, scheduleID string, input ScheduleInput) (*ent.RoutingSchedule, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Validate input
	if err := s.validateScheduleInput(input); err != nil {
		return nil, fmt.Errorf("validation failed: %w", err)
	}

	// Verify schedule exists
	existing, err := s.store.RoutingSchedule.Get(ctx, scheduleID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("schedule %s not found", scheduleID)
		}
		return nil, fmt.Errorf("failed to get schedule: %w", err)
	}

	// Verify routing exists if changed
	if input.RoutingID != existing.RoutingID {
		routingExists, errCheck := s.store.DeviceRouting.Query().
			Where(devicerouting.ID(input.RoutingID)).
			Exist(ctx)
		if errCheck != nil {
			return nil, fmt.Errorf("failed to verify routing existence: %w", errCheck)
		}
		if !routingExists {
			return nil, fmt.Errorf("device routing %s does not exist", input.RoutingID)
		}
	}

	// Update schedule
	schedule, err := s.store.RoutingSchedule.UpdateOneID(scheduleID).
		SetRoutingID(input.RoutingID).
		SetDays(input.Days).
		SetStartTime(input.StartTime).
		SetEndTime(input.EndTime).
		SetTimezone(input.Timezone).
		SetEnabled(input.Enabled).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to update schedule: %w", err)
	}

	s.logger.Info("Updated routing schedule", zap.String("schedule_id", scheduleID), zap.String("routing_id", input.RoutingID), zap.String("start_time", input.StartTime), zap.String("end_time", input.EndTime), zap.String("timezone", input.Timezone), zap.Bool("enabled", input.Enabled))

	// Publish event
	if s.publisher != nil {
		scheduleEvent := events.NewScheduleUpdatedEvent(
			schedule.ID,
			input.RoutingID,
			input.StartTime,
			input.EndTime,
			input.Timezone,
			input.Days,
			input.Enabled,
			"schedule-service",
		)
		if err := s.publisher.Publish(ctx, scheduleEvent); err != nil {
			s.logger.Error("Failed to publish schedule updated event", zap.Error(err), zap.String("schedule_id", schedule.ID))
		}
	}

	// Trigger immediate evaluation
	if err := s.scheduler.Evaluate(ctx); err != nil {
		s.logger.Error("Failed to trigger schedule evaluation after update", zap.Error(err))
	}

	return schedule, nil
}

// DeleteSchedule removes a routing schedule
func (s *ScheduleService) DeleteSchedule(ctx context.Context, scheduleID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Verify schedule exists and get details for event
	schedule, err := s.store.RoutingSchedule.Get(ctx, scheduleID)
	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("schedule %s not found", scheduleID)
		}
		return fmt.Errorf("failed to get schedule: %w", err)
	}

	// Delete schedule
	if err := s.store.RoutingSchedule.DeleteOneID(scheduleID).Exec(ctx); err != nil {
		return fmt.Errorf("failed to delete schedule: %w", err)
	}

	s.logger.Info("Deleted routing schedule", zap.String("schedule_id", scheduleID), zap.String("routing_id", schedule.RoutingID))

	// Publish event
	if s.publisher != nil {
		scheduleEvent := events.NewScheduleDeletedEvent(
			scheduleID,
			schedule.RoutingID,
			"schedule-service",
		)
		if err := s.publisher.Publish(ctx, scheduleEvent); err != nil {
			s.logger.Error("Failed to publish schedule deleted event", zap.Error(err), zap.String("schedule_id", scheduleID))
		}
	}

	// Trigger immediate evaluation to ensure routing state is correct
	if err := s.scheduler.Evaluate(ctx); err != nil {
		s.logger.Error("Failed to trigger schedule evaluation after delete", zap.Error(err))
	}

	return nil
}

// GetSchedule retrieves a schedule by ID
func (s *ScheduleService) GetSchedule(ctx context.Context, scheduleID string) (*ent.RoutingSchedule, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	schedule, err := s.store.RoutingSchedule.Get(ctx, scheduleID)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, fmt.Errorf("schedule %s not found", scheduleID)
		}
		return nil, fmt.Errorf("failed to get schedule: %w", err)
	}

	return schedule, nil
}

// GetSchedulesByRouting retrieves all schedules for a device routing
func (s *ScheduleService) GetSchedulesByRouting(ctx context.Context, routingID string) ([]*ent.RoutingSchedule, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	schedules, err := s.store.RoutingSchedule.Query().
		Where(routingschedule.RoutingID(routingID)).
		Order(ent.Asc(routingschedule.FieldStartTime)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query schedules: %w", err)
	}

	return schedules, nil
}

// GetEnabledSchedules retrieves all enabled schedules
func (s *ScheduleService) GetEnabledSchedules(ctx context.Context) ([]*ent.RoutingSchedule, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	schedules, err := s.store.RoutingSchedule.Query().
		Where(routingschedule.Enabled(true)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query enabled schedules: %w", err)
	}

	return schedules, nil
}

// validateScheduleInput validates schedule input parameters
func (s *ScheduleService) validateScheduleInput(input ScheduleInput) error {
	// Validate routing ID
	if input.RoutingID == "" {
		return fmt.Errorf("routing_id is required")
	}

	// Validate days (0-6 where 0=Sunday, 6=Saturday)
	if len(input.Days) == 0 {
		return fmt.Errorf("at least one day must be specified")
	}
	for _, day := range input.Days {
		if day < 0 || day > 6 {
			return fmt.Errorf("invalid day value %d: must be 0-6 (0=Sunday, 6=Saturday)", day)
		}
	}

	// Check for duplicate days
	daySet := make(map[int]bool)
	for _, day := range input.Days {
		if daySet[day] {
			return fmt.Errorf("duplicate day value %d", day)
		}
		daySet[day] = true
	}

	// Validate start time format (HH:MM)
	if !timeRegex.MatchString(input.StartTime) {
		return fmt.Errorf("invalid start_time format: must be HH:MM (24-hour)")
	}

	// Validate end time format (HH:MM)
	if !timeRegex.MatchString(input.EndTime) {
		return fmt.Errorf("invalid end_time format: must be HH:MM (24-hour)")
	}

	// Validate timezone
	if input.Timezone == "" {
		return fmt.Errorf("timezone is required")
	}
	if _, err := time.LoadLocation(input.Timezone); err != nil {
		return fmt.Errorf("invalid timezone %q: %w", input.Timezone, err)
	}

	return nil
}
