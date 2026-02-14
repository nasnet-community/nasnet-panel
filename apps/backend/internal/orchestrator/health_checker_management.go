package orchestrator

import (
	"fmt"
	"time"

	"backend/internal/events"
	"backend/internal/features"
)

// publishHealthEvent publishes a health state change event
func (hc *HealthChecker) publishHealthEvent(state *InstanceHealthState, previousState HealthState) {
	event := events.NewFeatureHealthChangedEvent(
		state.FeatureID,
		state.InstanceID,
		state.RouterID,
		string(previousState),
		string(state.CurrentState),
		state.ConsecutiveFails,
		state.LastLatency.Milliseconds(),
		state.LastHealthyAt,
	)

	if err := hc.eventPublisher.PublishFeatureHealthChanged(hc.ctx, event); err != nil {
		hc.logger.Error().
			Err(err).
			Str("instance_id", state.InstanceID).
			Msg("Failed to publish health event")
	}
}

// requestRestart sends a restart request to the supervisor
func (hc *HealthChecker) requestRestart(state *InstanceHealthState) {
	reason := fmt.Sprintf("health check failed %d times (threshold: %d)",
		state.ConsecutiveFails, state.FailureThreshold)

	select {
	case hc.restartChan <- RestartRequest{
		InstanceID: state.InstanceID,
		Reason:     reason,
	}:
		hc.logger.Info().
			Str("instance_id", state.InstanceID).
			Str("reason", reason).
			Msg("Requested instance restart due to health check failure")
	default:
		hc.logger.Warn().
			Str("instance_id", state.InstanceID).
			Msg("Failed to send restart request - channel full")
	}
}

// AddInstance adds a service instance to health monitoring
func (hc *HealthChecker) AddInstance(
	instanceID, featureID, routerID string,
	probe HealthProbe,
	healthSpec *features.HealthSpec,
) {
	// Apply defaults if health spec not provided
	checkInterval := defaultCheckInterval
	failureThreshold := defaultFailureThreshold
	autoRestart := defaultAutoRestart

	if healthSpec != nil {
		if healthSpec.IntervalSeconds > 0 {
			interval := time.Duration(healthSpec.IntervalSeconds) * time.Second
			if interval >= minCheckInterval && interval <= maxCheckInterval {
				checkInterval = interval
			}
		}
		if healthSpec.FailureThreshold > 0 {
			if healthSpec.FailureThreshold >= minFailureThreshold && healthSpec.FailureThreshold <= maxFailureThreshold {
				failureThreshold = healthSpec.FailureThreshold
			}
		}
		autoRestart = healthSpec.AutoRestart
	}

	state := &InstanceHealthState{
		InstanceID:       instanceID,
		FeatureID:        featureID,
		RouterID:         routerID,
		Probe:            probe,
		CheckInterval:    checkInterval,
		FailureThreshold: failureThreshold,
		AutoRestart:      autoRestart,
		NextCheckAt:      time.Now().Add(checkInterval), // First check after interval
		CurrentState:     HealthStateUnknown,
		ConnectionStatus: ConnectionStateFailed,
	}

	hc.mu.Lock()
	hc.instances[instanceID] = state
	hc.mu.Unlock()

	hc.logger.Info().
		Str("instance_id", instanceID).
		Str("feature_id", featureID).
		Dur("check_interval", checkInterval).
		Int("failure_threshold", failureThreshold).
		Bool("auto_restart", autoRestart).
		Msg("Added instance to health monitoring")
}

// RemoveInstance removes a service instance from health monitoring
func (hc *HealthChecker) RemoveInstance(instanceID string) {
	hc.mu.Lock()
	delete(hc.instances, instanceID)
	hc.mu.Unlock()

	hc.logger.Info().
		Str("instance_id", instanceID).
		Msg("Removed instance from health monitoring")
}

// GetInstanceHealth returns the current health state of an instance
func (hc *HealthChecker) GetInstanceHealth(instanceID string) (*InstanceHealthState, error) {
	hc.mu.RLock()
	state, exists := hc.instances[instanceID]
	hc.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("instance %s not found in health checker", instanceID)
	}

	state.mu.RLock()
	defer state.mu.RUnlock()

	// Return a copy to avoid race conditions
	return &InstanceHealthState{
		InstanceID:       state.InstanceID,
		FeatureID:        state.FeatureID,
		RouterID:         state.RouterID,
		CheckInterval:    state.CheckInterval,
		FailureThreshold: state.FailureThreshold,
		AutoRestart:      state.AutoRestart,
		NextCheckAt:      state.NextCheckAt,
		LastCheckedAt:    state.LastCheckedAt,
		LastHealthyAt:    state.LastHealthyAt,
		CurrentState:     state.CurrentState,
		ConsecutiveFails: state.ConsecutiveFails,
		LastLatency:      state.LastLatency,
		LastError:        state.LastError,
		ProcessAlive:     state.ProcessAlive,
		ConnectionStatus: state.ConnectionStatus,
	}, nil
}

// UpdateConfig updates the health check configuration for an instance
func (hc *HealthChecker) UpdateConfig(instanceID string, checkInterval time.Duration, failureThreshold int) error {
	hc.mu.RLock()
	state, exists := hc.instances[instanceID]
	hc.mu.RUnlock()

	if !exists {
		return fmt.Errorf("instance %s not found", instanceID)
	}

	// Validate bounds
	if checkInterval < minCheckInterval || checkInterval > maxCheckInterval {
		return fmt.Errorf("check interval must be between %v and %v", minCheckInterval, maxCheckInterval)
	}
	if failureThreshold < minFailureThreshold || failureThreshold > maxFailureThreshold {
		return fmt.Errorf("failure threshold must be between %d and %d", minFailureThreshold, maxFailureThreshold)
	}

	state.mu.Lock()
	state.CheckInterval = checkInterval
	state.FailureThreshold = failureThreshold
	state.mu.Unlock()

	hc.logger.Info().
		Str("instance_id", instanceID).
		Dur("check_interval", checkInterval).
		Int("failure_threshold", failureThreshold).
		Msg("Updated health check configuration")

	return nil
}
