package svcalert

import (
	"context"
	"fmt"
	"time"
)

// GetThrottleStatus returns the throttle status for alert rules.
func (s *AlertService) GetThrottleStatus(ctx context.Context, ruleID *string) ([]ThrottleStatus, error) {
	if s.engine == nil {
		return nil, fmt.Errorf("engine not configured")
	}

	throttleManager := s.engine.GetThrottleManager()
	if throttleManager == nil {
		return nil, fmt.Errorf("throttle manager not available")
	}

	statusData := throttleManager.GetStatus(ruleID)
	results := make([]ThrottleStatus, len(statusData))
	for i, data := range statusData {
		groups := make([]ThrottleGroupStatus, len(data.Groups))
		for j, g := range data.Groups {
			groups[j] = ThrottleGroupStatus(g)
		}
		results[i] = ThrottleStatus{
			RuleID:          data.RuleID,
			IsThrottled:     data.IsThrottled,
			SuppressedCount: data.SuppressedCount,
			WindowStart:     data.WindowStart,
			WindowEnd:       data.WindowEnd,
			Groups:          groups,
		}
	}
	return results, nil
}

// GetStormStatus returns the current storm detection status.
func (s *AlertService) GetStormStatus(ctx context.Context) (*StormStatus, error) {
	if s.engine == nil {
		return nil, fmt.Errorf("engine not configured")
	}

	stormDetector := s.engine.GetStormDetector()
	if stormDetector == nil {
		return nil, fmt.Errorf("storm detector not available")
	}

	statusData := stormDetector.GetStatus()
	now := time.Now()
	windowSeconds := 60

	result := &StormStatus{
		IsStormDetected: statusData.InStorm,
		AlertCount:      statusData.SuppressedCount,
		Threshold:       100,
		WindowSeconds:   windowSeconds,
		WindowStart:     now.Add(-time.Duration(windowSeconds) * time.Second),
		WindowEnd:       now,
		TopRules:        []StormRuleContribution{},
	}

	if statusData.StormStartTime != (time.Time{}) {
		result.StormStartedAt = &statusData.StormStartTime
	}

	return result, nil
}
