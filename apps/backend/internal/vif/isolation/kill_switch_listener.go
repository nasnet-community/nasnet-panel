// Package isolation implements Kill Switch health event listener.
// The listener subscribes to service health state changes and automatically
// activates/deactivates kill switches for affected device routings.
package isolation

import (
	"context"
	"fmt"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/devicerouting"

	"backend/internal/events"
)

// Health state constants for kill switch transitions.
const (
	healthStateUnhealthy = "UNHEALTHY"
	healthStateHealthy   = "HEALTHY"
)

// KillSwitchListener listens to health events and manages kill switch state.
// It subscribes to EventTypeHealthChanged and triggers kill switch activation
// when services become unhealthy, and deactivation when they recover.
type KillSwitchListener struct {
	client        *ent.Client
	eventBus      events.EventBus
	publisher     *events.Publisher
	killSwitchMgr *KillSwitchManager
	logger        *zap.Logger
}

// NewKillSwitchListener creates a new kill switch listener instance.
func NewKillSwitchListener(
	client *ent.Client,
	eventBus events.EventBus,
	publisher *events.Publisher,
	killSwitchMgr *KillSwitchManager,
	logger *zap.Logger,
) *KillSwitchListener {

	return &KillSwitchListener{
		client:        client,
		eventBus:      eventBus,
		publisher:     publisher,
		killSwitchMgr: killSwitchMgr,
		logger:        logger,
	}
}

// Start begins listening to health events.
func (l *KillSwitchListener) Start() error {
	// Subscribe to health changed events using EventHandler pattern
	if err := l.eventBus.Subscribe(events.EventTypeHealthChanged, l.handleHealthEvent); err != nil {
		return fmt.Errorf("kill switch listener: %w", err)
	}
	return nil
}

// handleHealthEvent processes a single health event and triggers kill switch actions.
func (l *KillSwitchListener) handleHealthEvent(ctx context.Context, event events.Event) error {
	// Type assert to FeatureHealthChangedEvent
	healthEvent, ok := event.(*events.FeatureHealthChangedEvent)
	if !ok {
		// Skip events that aren't health events
		return nil
	}

	// Step 1: Check if this is a state transition we care about
	isTransitionToUnhealthy := healthEvent.CurrentState == healthStateUnhealthy && healthEvent.PreviousState != healthStateUnhealthy
	isTransitionToHealthy := healthEvent.CurrentState == healthStateHealthy && healthEvent.PreviousState == healthStateUnhealthy

	if !isTransitionToUnhealthy && !isTransitionToHealthy {
		// Not a relevant transition, skip
		return nil
	}

	// Step 2: Find all device routings using this service instance with kill switch enabled
	routings, err := l.client.DeviceRouting.
		Query().
		Where(
			devicerouting.InstanceIDEQ(healthEvent.InstanceID),
			devicerouting.KillSwitchEnabledEQ(true),
		).
		All(ctx)
	if err != nil {
		return fmt.Errorf("failed to query device routings: %w", err)
	}

	// No routings with kill switch enabled for this instance
	if len(routings) == 0 {
		return nil
	}

	// Step 3: Process each routing based on transition type
	if isTransitionToUnhealthy {
		return l.handleUnhealthyTransition(ctx, routings, healthEvent)
	}
	return l.handleHealthyTransition(ctx, routings, healthEvent)
}

// handleUnhealthyTransition activates kill switches for all affected routings.
func (l *KillSwitchListener) handleUnhealthyTransition(
	ctx context.Context,
	routings []*ent.DeviceRouting,
	event *events.FeatureHealthChangedEvent,
) error {

	for _, routing := range routings {
		// Activate kill switch
		if err := l.killSwitchMgr.Activate(ctx, routing.ID); err != nil {
			l.logger.Error("failed to activate kill switch",
				zap.Error(err),
				zap.String("routing_id", routing.ID),
				zap.String("device_id", routing.DeviceID))
			continue
		}

		// Publish kill switch activated event
		if l.publisher != nil {
			activatedEvent := NewKillSwitchActivatedEvent(
				routing.ID,
				routing.DeviceID,
				routing.MACAddress,
				routing.InstanceID,
				string(routing.KillSwitchMode),
				"service_unhealthy",
				event.CurrentState,
				time.Now(),
			)
			if err := l.publisher.Publish(ctx, activatedEvent); err != nil { //nolint:revive,staticcheck // intentional no-op
			}
		}
	}

	return nil
}

// handleHealthyTransition deactivates kill switches for all affected routings.
func (l *KillSwitchListener) handleHealthyTransition(
	ctx context.Context,
	routings []*ent.DeviceRouting,
	_ *events.FeatureHealthChangedEvent,
) error {

	for _, routing := range routings {
		// Calculate how long kill switch was active
		var activeFor string
		if routing.KillSwitchActivatedAt != nil {
			duration := time.Since(*routing.KillSwitchActivatedAt)
			activeFor = duration.Round(time.Second).String()
		} else {
			activeFor = "unknown"
		}

		// Deactivate kill switch
		if err := l.killSwitchMgr.Deactivate(ctx, routing.ID); err != nil {
			l.logger.Error("failed to deactivate kill switch",
				zap.Error(err),
				zap.String("routing_id", routing.ID),
				zap.String("device_id", routing.DeviceID))
			continue
		}

		// Publish kill switch deactivated event
		if l.publisher != nil {
			deactivatedEvent := NewKillSwitchDeactivatedEvent(
				routing.ID,
				routing.DeviceID,
				routing.MACAddress,
				routing.InstanceID,
				string(routing.KillSwitchMode),
				activeFor,
				"service_recovered",
				time.Now(),
			)
			if err := l.publisher.Publish(ctx, deactivatedEvent); err != nil { //nolint:revive,staticcheck // intentional no-op
			}
		}
	}

	return nil
}
