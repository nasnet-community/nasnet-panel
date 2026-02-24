package scheduling

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/routingschedule"
	"backend/internal/orchestrator"

	"backend/internal/events"

	"go.uber.org/zap"
)

const (
	// EvaluationIntervalSeconds is the interval for schedule evaluation (60 seconds)
	EvaluationIntervalSeconds = 60

	// MaxTimeSkewSeconds is the maximum allowed time skew between router and NasNet (300 seconds = 5 minutes)
	MaxTimeSkewSeconds = 300
)

// ScheduleEvaluatorConfig configures the ScheduleEvaluator
type ScheduleEvaluatorConfig struct {
	EntClient           *ent.Client
	EventBus            events.EventBus
	KillSwitchCoord     orchestrator.KillSwitchCoordinator
	Logger              *zap.Logger
	NowFunc             func() time.Time // Injectable for testing
	RouterClockProvider RouterClockProvider
}

// RouterClockProvider provides access to router clock and NTP status
type RouterClockProvider interface {
	// GetRouterTime returns the current time on the router
	GetRouterTime(ctx context.Context, routerID string) (time.Time, error)

	// GetNTPStatus returns NTP synchronization status for the router
	GetNTPStatus(ctx context.Context, routerID string) (*NTPStatus, error)
}

// NTPStatus represents NTP synchronization status from RouterOS
type NTPStatus struct {
	Enabled      bool      `json:"enabled"`
	Synchronized bool      `json:"synchronized"`
	LastSync     time.Time `json:"lastSync,omitempty"`
	ServerIP     string    `json:"serverIp,omitempty"`
}

// ScheduleEvaluator monitors and evaluates routing schedules, activating/deactivating
// device routing rules based on time windows
type ScheduleEvaluator struct {
	mu              sync.RWMutex
	config          ScheduleEvaluatorConfig
	publisher       *events.Publisher
	logger          *zap.Logger
	ctx             context.Context
	cancel          context.CancelFunc
	wg              sync.WaitGroup
	running         bool
	lastEvaluation  time.Time
	evaluationCount int64
}

// NewScheduleEvaluator creates a new ScheduleEvaluator instance
func NewScheduleEvaluator(config ScheduleEvaluatorConfig) (*ScheduleEvaluator, error) {
	if config.EntClient == nil {
		return nil, fmt.Errorf("EntClient is required")
	}

	if config.EventBus == nil {
		return nil, fmt.Errorf("EventBus is required")
	}

	if config.KillSwitchCoord == nil {
		return nil, fmt.Errorf("KillSwitchCoordinator is required")
	}

	// Default NowFunc to time.Now if not provided
	if config.NowFunc == nil {
		config.NowFunc = time.Now
	}

	logger := config.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	se := &ScheduleEvaluator{
		config:    config,
		publisher: events.NewPublisher(config.EventBus, "schedule-evaluator"),
		logger:    logger,
	}

	return se, nil
}

// Start begins the schedule evaluation loop
func (se *ScheduleEvaluator) Start(ctx context.Context) error {
	se.mu.Lock()
	defer se.mu.Unlock()

	if se.running {
		return fmt.Errorf("schedule evaluator already running")
	}

	se.ctx, se.cancel = context.WithCancel(ctx)
	se.running = true

	se.wg.Add(1)
	go se.evaluatorLoop() //nolint:contextcheck // evaluator manages its own context

	se.logger.Info("Schedule evaluator started")
	return nil
}

// Stop stops the schedule evaluation loop and waits for it to finish
func (se *ScheduleEvaluator) Stop() error {
	se.mu.Lock()

	if !se.running {
		se.mu.Unlock()
		return fmt.Errorf("schedule evaluator not running")
	}

	se.cancel()
	se.running = false
	se.mu.Unlock()

	// Wait for evaluator loop to finish
	se.wg.Wait()

	se.logger.Info("Schedule evaluator stopped")
	return nil
}

// Evaluate triggers an immediate schedule evaluation (public method for external calls)
func (se *ScheduleEvaluator) Evaluate(_ context.Context) error {
	se.mu.RLock()
	running := se.running
	se.mu.RUnlock()

	if !running {
		return fmt.Errorf("schedule evaluator not running")
	}

	// Trigger evaluation by calling the private method
	se.evaluate() //nolint:contextcheck // evaluator manages its own context
	return nil
}

// evaluatorLoop is the main evaluation loop that runs every 60 seconds
func (se *ScheduleEvaluator) evaluatorLoop() {
	defer se.wg.Done()

	ticker := time.NewTicker(EvaluationIntervalSeconds * time.Second)
	defer ticker.Stop()

	se.logger.Info("Schedule evaluator loop started", zap.Int("interval_seconds", EvaluationIntervalSeconds))

	// Run initial evaluation immediately
	se.evaluate()

	for {
		select {
		case <-se.ctx.Done():
			se.logger.Info("Schedule evaluator loop stopped")
			return

		case <-ticker.C:
			se.evaluate()
		}
	}
}

// evaluate performs a full schedule evaluation cycle
func (se *ScheduleEvaluator) evaluate() {
	se.mu.Lock()
	se.lastEvaluation = se.config.NowFunc()
	se.evaluationCount++
	evalCount := se.evaluationCount
	se.mu.Unlock()

	se.logger.Debug("Starting schedule evaluation", zap.Int64("evaluation_count", evalCount))

	ctx := context.Background()

	// Load all enabled schedules
	schedules, err := se.config.EntClient.RoutingSchedule.
		Query().
		Where(routingschedule.Enabled(true)).
		WithDeviceRouting().
		All(ctx)

	if err != nil {
		se.logger.Error("Failed to load enabled schedules", zap.Error(err))
		return
	}

	se.logger.Debug("Loaded enabled schedules", zap.Int("schedule_count", len(schedules)))

	// Group schedules by routing_id for batch processing
	schedulesByRouting := make(map[string][]*ent.RoutingSchedule)
	for _, schedule := range schedules {
		schedulesByRouting[schedule.RoutingID] = append(schedulesByRouting[schedule.RoutingID], schedule)
	}

	se.logger.Debug("Grouped schedules by routing ID", zap.Int("routing_count", len(schedulesByRouting)))

	// Evaluate each routing assignment
	for routingID, routingSchedules := range schedulesByRouting {
		se.evaluateRoutingSchedules(ctx, routingID, routingSchedules)
	}

	se.logger.Debug("Completed schedule evaluation", zap.Int64("evaluation_count", evalCount))
}

// evaluateRoutingSchedules evaluates all schedules for a single DeviceRouting assignment
func (se *ScheduleEvaluator) evaluateRoutingSchedules(ctx context.Context, routingID string, schedules []*ent.RoutingSchedule) {
	if len(schedules) == 0 {
		return
	}

	routing, err := se.config.EntClient.DeviceRouting.Get(ctx, routingID)
	if err != nil {
		se.logger.Error("Failed to load DeviceRouting record", zap.Error(err), zap.String("routing_id", routingID))
		return
	}

	routerTime, timeSource := se.resolveEvaluationTime(ctx, routing.RouterID)

	se.logger.Debug("Evaluating schedules for routing", zap.String("routing_id", routingID), zap.String("time_source", timeSource), zap.Time("evaluation_time", routerTime), zap.Int("schedule_count", len(schedules)))

	isActiveNow, activeSchedule := se.findActiveSchedule(routerTime, schedules)

	se.logger.Debug("Schedule evaluation result", zap.String("routing_id", routingID), zap.Bool("is_active_now", isActiveNow), zap.Bool("current_active", routing.Active))

	se.applyRoutingState(ctx, routing, isActiveNow, activeSchedule, schedules)
}

// resolveEvaluationTime gets the router time or falls back to system time.
func (se *ScheduleEvaluator) resolveEvaluationTime(ctx context.Context, routerID string) (evalTime time.Time, timeSource string) {
	if se.config.RouterClockProvider == nil {
		return se.config.NowFunc(), "system"
	}

	routerTime, err := se.config.RouterClockProvider.GetRouterTime(ctx, routerID)
	if err != nil {
		se.logger.Warn("Failed to get router time, falling back to system time", zap.Error(err), zap.String("router_id", routerID))
		return se.config.NowFunc(), "system"
	}

	// Check time skew
	systemTime := se.config.NowFunc()
	skew := routerTime.Sub(systemTime)
	if skew < 0 {
		skew = -skew
	}
	if skew > MaxTimeSkewSeconds*time.Second {
		se.logger.Warn("Router clock has significant time skew", zap.String("router_id", routerID), zap.Duration("skew", skew), zap.Int("max_skew_seconds", MaxTimeSkewSeconds))
	}

	evalTime = routerTime
	timeSource = "router"
	return evalTime, timeSource
}

// findActiveSchedule checks if any schedule window is currently active.
func (se *ScheduleEvaluator) findActiveSchedule(now time.Time, schedules []*ent.RoutingSchedule) (bool, *ent.RoutingSchedule) {
	for _, schedule := range schedules {
		if se.IsWindowActive(now, schedule) {
			return true, schedule
		}
	}
	return false, nil
}

// applyRoutingState idempotently activates or deactivates routing based on schedule state.
func (se *ScheduleEvaluator) applyRoutingState(ctx context.Context, routing *ent.DeviceRouting, isActiveNow bool, activeSchedule *ent.RoutingSchedule, schedules []*ent.RoutingSchedule) {
	if isActiveNow && !routing.Active { //nolint:gocritic // if-else chain is clearer than switch for two boolean conditions with an else clause
		se.activateRouting(ctx, routing, activeSchedule)
	} else if !isActiveNow && routing.Active {
		se.deactivateRouting(ctx, routing, schedules)
	} else {
		se.logger.Debug("Routing state unchanged", zap.String("routing_id", routing.ID), zap.Bool("active", routing.Active))
	}
}

// IsWindowActive checks if a schedule window is currently active
// Handles both same-day windows (start < end) and overnight windows (start > end)
func (se *ScheduleEvaluator) IsWindowActive(now time.Time, schedule *ent.RoutingSchedule) bool {
	loc, err := time.LoadLocation(schedule.Timezone)
	if err != nil {
		se.logger.Error("Failed to load timezone, using UTC", zap.Error(err), zap.String("schedule_id", schedule.ID), zap.String("timezone", schedule.Timezone))
		loc = time.UTC
	}

	nowInTz := now.In(loc)
	currentDay := int(nowInTz.Weekday())
	currentTime := nowInTz.Format("15:04")

	se.logger.Debug("Evaluating schedule window", zap.String("schedule_id", schedule.ID), zap.Int("current_day", currentDay), zap.String("current_time", currentTime), zap.String("timezone", schedule.Timezone))

	if !containsDay(schedule.Days, currentDay) {
		return se.checkOvernightFromPreviousDay(schedule, currentDay, currentTime)
	}

	return se.evaluateTimeWindow(schedule, currentTime)
}

// containsDay checks if a day is in the days slice.
func containsDay(days []int, day int) bool {
	for _, d := range days {
		if d == day {
			return true
		}
	}
	return false
}

// checkOvernightFromPreviousDay checks if we're in the tail end of an overnight window from the previous day.
func (se *ScheduleEvaluator) checkOvernightFromPreviousDay(schedule *ent.RoutingSchedule, currentDay int, currentTime string) bool {
	prevDay := (currentDay + 6) % 7
	if containsDay(schedule.Days, prevDay) && schedule.StartTime > schedule.EndTime {
		if currentTime < schedule.EndTime {
			se.logger.Debug("In overnight window from previous day", zap.String("schedule_id", schedule.ID), zap.Int("prev_day", prevDay), zap.String("current_time", currentTime), zap.String("end_time", schedule.EndTime))
			return true
		}
	}

	se.logger.Debug("Current day not in schedule days", zap.String("schedule_id", schedule.ID), zap.Int("current_day", currentDay))
	return false
}

// evaluateTimeWindow checks if the current time falls within the schedule's time window.
func (se *ScheduleEvaluator) evaluateTimeWindow(schedule *ent.RoutingSchedule, currentTime string) bool {
	var isActive bool
	var windowType string

	if schedule.StartTime < schedule.EndTime {
		isActive = currentTime >= schedule.StartTime && currentTime < schedule.EndTime
		windowType = "Same-day window evaluation"
	} else {
		isActive = currentTime >= schedule.StartTime || currentTime < schedule.EndTime
		windowType = "Overnight window evaluation"
	}

	se.logger.Debug(windowType, zap.String("schedule_id", schedule.ID), zap.String("start_time", schedule.StartTime), zap.String("end_time", schedule.EndTime), zap.String("current_time", currentTime), zap.Bool("is_active", isActive))
	return isActive
}
