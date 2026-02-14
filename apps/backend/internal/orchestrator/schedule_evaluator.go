package orchestrator

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/routingschedule"
	"backend/internal/events"

	"github.com/rs/zerolog"
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
	KillSwitchCoord     KillSwitchCoordinator
	Logger              zerolog.Logger
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
	logger          zerolog.Logger
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

	se := &ScheduleEvaluator{
		config:    config,
		publisher: events.NewPublisher(config.EventBus, "schedule-evaluator"),
		logger:    config.Logger,
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
	go se.evaluatorLoop()

	se.logger.Info().Msg("Schedule evaluator started")
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

	se.logger.Info().Msg("Schedule evaluator stopped")
	return nil
}

// Evaluate triggers an immediate schedule evaluation (public method for external calls)
func (se *ScheduleEvaluator) Evaluate(ctx context.Context) error {
	se.mu.RLock()
	running := se.running
	se.mu.RUnlock()

	if !running {
		return fmt.Errorf("schedule evaluator not running")
	}

	// Trigger evaluation by calling the private method
	se.evaluate()
	return nil
}

// evaluatorLoop is the main evaluation loop that runs every 60 seconds
func (se *ScheduleEvaluator) evaluatorLoop() {
	defer se.wg.Done()

	ticker := time.NewTicker(EvaluationIntervalSeconds * time.Second)
	defer ticker.Stop()

	se.logger.Info().
		Int("interval_seconds", EvaluationIntervalSeconds).
		Msg("Schedule evaluator loop started")

	// Run initial evaluation immediately
	se.evaluate()

	for {
		select {
		case <-se.ctx.Done():
			se.logger.Info().Msg("Schedule evaluator loop stopped")
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

	se.logger.Debug().
		Int64("evaluation_count", evalCount).
		Msg("Starting schedule evaluation")

	ctx := context.Background()

	// Load all enabled schedules
	schedules, err := se.config.EntClient.RoutingSchedule.
		Query().
		Where(routingschedule.Enabled(true)).
		WithDeviceRouting().
		All(ctx)

	if err != nil {
		se.logger.Error().
			Err(err).
			Msg("Failed to load enabled schedules")
		return
	}

	se.logger.Debug().
		Int("schedule_count", len(schedules)).
		Msg("Loaded enabled schedules")

	// Group schedules by routing_id for batch processing
	schedulesByRouting := make(map[string][]*ent.RoutingSchedule)
	for _, schedule := range schedules {
		schedulesByRouting[schedule.RoutingID] = append(schedulesByRouting[schedule.RoutingID], schedule)
	}

	se.logger.Debug().
		Int("routing_count", len(schedulesByRouting)).
		Msg("Grouped schedules by routing ID")

	// Evaluate each routing assignment
	for routingID, routingSchedules := range schedulesByRouting {
		se.evaluateRoutingSchedules(ctx, routingID, routingSchedules)
	}

	se.logger.Debug().
		Int64("evaluation_count", evalCount).
		Msg("Completed schedule evaluation")
}

// evaluateRoutingSchedules evaluates all schedules for a single DeviceRouting assignment
func (se *ScheduleEvaluator) evaluateRoutingSchedules(ctx context.Context, routingID string, schedules []*ent.RoutingSchedule) {
	if len(schedules) == 0 {
		return
	}

	// Load the DeviceRouting record
	routing, err := se.config.EntClient.DeviceRouting.Get(ctx, routingID)
	if err != nil {
		se.logger.Error().
			Err(err).
			Str("routing_id", routingID).
			Msg("Failed to load DeviceRouting record")
		return
	}

	// Get router clock status
	var routerTime time.Time
	var timeSource string
	if se.config.RouterClockProvider != nil {
		var err error
		routerTime, err = se.config.RouterClockProvider.GetRouterTime(ctx, routing.RouterID)
		if err != nil {
			se.logger.Warn().
				Err(err).
				Str("router_id", routing.RouterID).
				Msg("Failed to get router time, falling back to system time")
			routerTime = se.config.NowFunc()
			timeSource = "system"
		} else {
			timeSource = "router"
		}

		// Check time skew
		systemTime := se.config.NowFunc()
		skew := routerTime.Sub(systemTime)
		if skew < 0 {
			skew = -skew
		}
		if skew > MaxTimeSkewSeconds*time.Second {
			se.logger.Warn().
				Str("router_id", routing.RouterID).
				Dur("skew", skew).
				Int("max_skew_seconds", MaxTimeSkewSeconds).
				Msg("Router clock has significant time skew")
		}
	} else {
		// No router clock provider, use system time
		routerTime = se.config.NowFunc()
		timeSource = "system"
	}

	se.logger.Debug().
		Str("routing_id", routingID).
		Str("time_source", timeSource).
		Time("evaluation_time", routerTime).
		Int("schedule_count", len(schedules)).
		Msg("Evaluating schedules for routing")

	// Determine if ANY schedule window is currently active
	isActiveNow := false
	var activeSchedule *ent.RoutingSchedule

	for _, schedule := range schedules {
		if se.IsWindowActive(routerTime, schedule) {
			isActiveNow = true
			activeSchedule = schedule
			break
		}
	}

	se.logger.Debug().
		Str("routing_id", routingID).
		Bool("is_active_now", isActiveNow).
		Bool("current_active", routing.Active).
		Msg("Schedule evaluation result")

	// Idempotently set mangle rule disabled state
	if isActiveNow && !routing.Active {
		// Activate routing
		se.activateRouting(ctx, routing, activeSchedule)
	} else if !isActiveNow && routing.Active {
		// Deactivate routing
		se.deactivateRouting(ctx, routing, schedules)
	} else {
		// No state change needed
		se.logger.Debug().
			Str("routing_id", routingID).
			Bool("active", routing.Active).
			Msg("Routing state unchanged")
	}
}

// IsWindowActive checks if a schedule window is currently active
// Handles both same-day windows (start < end) and overnight windows (start > end)
func (se *ScheduleEvaluator) IsWindowActive(now time.Time, schedule *ent.RoutingSchedule) bool {
	// Parse timezone
	loc, err := time.LoadLocation(schedule.Timezone)
	if err != nil {
		se.logger.Error().
			Err(err).
			Str("schedule_id", schedule.ID).
			Str("timezone", schedule.Timezone).
			Msg("Failed to load timezone, using UTC")
		loc = time.UTC
	}

	// Convert now to schedule timezone
	nowInTz := now.In(loc)
	currentDay := int(nowInTz.Weekday())
	currentTime := nowInTz.Format("15:04")

	se.logger.Debug().
		Str("schedule_id", schedule.ID).
		Int("current_day", currentDay).
		Str("current_time", currentTime).
		Str("timezone", schedule.Timezone).
		Msg("Evaluating schedule window")

	// Check if current day is in the schedule's days array
	isDayActive := false
	for _, day := range schedule.Days {
		if day == currentDay {
			isDayActive = true
			break
		}
	}

	if !isDayActive {
		// Check if this is an overnight window from previous day
		prevDay := (currentDay + 6) % 7 // Go back one day
		isPrevDayActive := false
		for _, day := range schedule.Days {
			if day == prevDay {
				isPrevDayActive = true
				break
			}
		}

		// If previous day is active and it's an overnight window, check if we're in the tail end
		if isPrevDayActive && schedule.StartTime > schedule.EndTime {
			// Overnight window from previous day
			if currentTime < schedule.EndTime {
				se.logger.Debug().
					Str("schedule_id", schedule.ID).
					Int("prev_day", prevDay).
					Str("current_time", currentTime).
					Str("end_time", schedule.EndTime).
					Msg("In overnight window from previous day")
				return true
			}
		}

		se.logger.Debug().
			Str("schedule_id", schedule.ID).
			Int("current_day", currentDay).
			Msg("Current day not in schedule days")
		return false
	}

	// Day is active, check time window
	if schedule.StartTime < schedule.EndTime {
		// Same-day window (e.g., 09:00 - 17:00)
		isActive := currentTime >= schedule.StartTime && currentTime < schedule.EndTime
		se.logger.Debug().
			Str("schedule_id", schedule.ID).
			Str("start_time", schedule.StartTime).
			Str("end_time", schedule.EndTime).
			Str("current_time", currentTime).
			Bool("is_active", isActive).
			Msg("Same-day window evaluation")
		return isActive
	} else {
		// Overnight window (e.g., 22:00 - 06:00)
		isActive := currentTime >= schedule.StartTime || currentTime < schedule.EndTime
		se.logger.Debug().
			Str("schedule_id", schedule.ID).
			Str("start_time", schedule.StartTime).
			Str("end_time", schedule.EndTime).
			Str("current_time", currentTime).
			Bool("is_active", isActive).
			Msg("Overnight window evaluation")
		return isActive
	}
}
