package resolver

// This file contains subscription resolvers for service CRUD operations.

import (
	"backend/generated/ent/serviceinstance"
	graphql1 "backend/graph/model"
	"backend/internal/errors"
	"backend/internal/events"
	"backend/internal/orchestrator/lifecycle"
	"context"
)

// InstallProgress is the resolver for the installProgress subscription field.
func (r *subscriptionResolver) InstallProgress(ctx context.Context, routerID string) (<-chan *graphql1.InstallProgress, error) {
	if r.EventBus == nil {
		return nil, errors.NewProtocolError("EVENT_BUS_NOT_INIT", "event bus not initialized", "graphql")
	}

	ch := make(chan *graphql1.InstallProgress, 16)

	handler := func(_ context.Context, event events.Event) error {
		select {
		case <-ctx.Done():
			return nil
		default:
		}

		switch e := event.(type) {
		case *events.ServiceInstalledEvent:
			status := "completed"
			select {
			case ch <- &graphql1.InstallProgress{
				InstanceID: e.InstanceID,
				FeatureID:  e.ServiceType,
				Status:     status,
				Percent:    100.0,
			}:
			default:
			}
		case *events.ServiceStateChangedEvent:
			if e.ToStatus != string(lifecycle.StatusInstalling) &&
				e.ToStatus != string(lifecycle.StatusInstalled) &&
				e.ToStatus != string(lifecycle.StatusFailed) {

				return nil
			}

			percent := 0.0
			if e.ToStatus == string(lifecycle.StatusInstalled) {
				percent = 100.0
			}
			progress := &graphql1.InstallProgress{
				InstanceID: e.InstanceID,
				FeatureID:  e.ServiceType,
				Status:     e.ToStatus,
				Percent:    percent,
			}
			if e.ErrorMessage != "" {
				progress.ErrorMessage = &e.ErrorMessage
			}
			select {
			case ch <- progress:
			default:
			}
		}
		return nil
	}

	if err := r.EventBus.Subscribe(events.EventTypeServiceInstalled, handler); err != nil {
		close(ch)
		return nil, errors.Wrap(err, "SUBSCRIBE_FAILED", errors.CategoryInternal, "failed to subscribe to install events")
	}
	if err := r.EventBus.Subscribe(events.EventTypeServiceStateChanged, handler); err != nil {
		close(ch)
		return nil, errors.Wrap(err, "SUBSCRIBE_FAILED", errors.CategoryInternal, "failed to subscribe to state change events")
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				// Log panic but don't crash service
				_ = r
			}
			close(ch)
		}()
		<-ctx.Done()
	}()

	return ch, nil
}

// InstanceStatusChanged is the resolver for the instanceStatusChanged subscription field.
func (r *subscriptionResolver) InstanceStatusChanged(ctx context.Context, routerID string) (<-chan *graphql1.InstanceStatusChanged, error) {
	if r.EventBus == nil {
		return nil, errors.NewProtocolError("EVENT_BUS_NOT_INIT", "event bus not initialized", "graphql")
	}

	ch := make(chan *graphql1.InstanceStatusChanged, 16)

	handler := func(_ context.Context, event events.Event) error {
		select {
		case <-ctx.Done():
			return nil
		default:
		}

		e, ok := event.(*events.ServiceStateChangedEvent)
		if !ok {
			return nil
		}

		select {
		case ch <- &graphql1.InstanceStatusChanged{
			InstanceID:     e.InstanceID,
			PreviousStatus: convertEntStatusToGraphQL(serviceinstance.Status(e.FromStatus)),
			NewStatus:      convertEntStatusToGraphQL(serviceinstance.Status(e.ToStatus)),
			Timestamp:      e.GetTimestamp(),
		}:
		default:
		}
		return nil
	}

	if err := r.EventBus.Subscribe(events.EventTypeServiceStateChanged, handler); err != nil {
		close(ch)
		return nil, errors.Wrap(err, "SUBSCRIBE_FAILED", errors.CategoryInternal, "failed to subscribe to status change events")
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				// Log panic but don't crash service
				_ = r
			}
			close(ch)
		}()
		<-ctx.Done()
	}()

	return ch, nil
}

// VerificationEvents is the resolver for the verificationEvents subscription field.
func (r *subscriptionResolver) VerificationEvents(ctx context.Context, routerID string) (<-chan *graphql1.VerificationEvent, error) {
	if r.EventBus == nil {
		return nil, errors.NewProtocolError("EVENT_BUS_NOT_INIT", "event bus not initialized", "graphql")
	}

	ch := make(chan *graphql1.VerificationEvent, 16)

	handler := func(_ context.Context, event events.Event) error {
		select {
		case <-ctx.Done():
			return nil
		default:
		}

		var gqlEvent *graphql1.VerificationEvent
		ts := event.GetTimestamp()

		switch e := event.(type) {
		case *events.BinaryVerifiedEvent:
			archiveHash := e.ArchiveHash
			binaryHash := e.BinaryHash
			gpgKeyID := e.GPGKeyID
			gqlEvent = &graphql1.VerificationEvent{
				InstanceID:  e.InstanceID,
				FeatureID:   e.FeatureID,
				RouterID:    e.RouterID,
				EventType:   "verified",
				ArchiveHash: &archiveHash,
				BinaryHash:  &binaryHash,
				GpgVerified: e.GPGVerified,
				GpgKeyID:    &gpgKeyID,
				Timestamp:   ts,
			}
		case *events.BinaryVerificationFailedEvent:
			expectedHash := e.ExpectedHash
			actualHash := e.ActualHash
			failureReason := e.FailureReason
			suggestedAction := e.SuggestedAction
			gqlEvent = &graphql1.VerificationEvent{
				InstanceID:      e.InstanceID,
				FeatureID:       e.FeatureID,
				RouterID:        e.RouterID,
				EventType:       "verification_failed",
				ExpectedHash:    &expectedHash,
				ActualHash:      &actualHash,
				GpgVerified:     false,
				FailureReason:   &failureReason,
				SuggestedAction: &suggestedAction,
				Timestamp:       ts,
			}
		case *events.BinaryIntegrityFailedEvent:
			expectedHash := e.ExpectedHash
			actualHash := e.ActualHash
			gqlEvent = &graphql1.VerificationEvent{
				InstanceID:   e.InstanceID,
				FeatureID:    e.FeatureID,
				RouterID:     e.RouterID,
				EventType:    "integrity_failed",
				ExpectedHash: &expectedHash,
				ActualHash:   &actualHash,
				GpgVerified:  false,
				Timestamp:    ts,
			}
		}

		if gqlEvent != nil {
			select {
			case ch <- gqlEvent:
			default:
			}
		}
		return nil
	}

	topics := []string{
		events.EventTypeBinaryVerified,
		events.EventTypeBinaryVerificationFailed,
		events.EventTypeBinaryIntegrityFailed,
	}

	for _, topic := range topics {
		if err := r.EventBus.Subscribe(topic, handler); err != nil {
			close(ch)
			return nil, errors.Wrap(err, "SUBSCRIBE_FAILED", errors.CategoryInternal, "failed to subscribe to "+topic)
		}
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				// Log panic but don't crash service
				_ = r
			}
			close(ch)
		}()
		<-ctx.Done()
	}()

	return ch, nil
}

// BootSequenceEvents is the resolver for the bootSequenceEvents subscription field.
func (r *subscriptionResolver) BootSequenceEvents(ctx context.Context) (<-chan *graphql1.BootSequenceEvent, error) {
	if r.EventBus == nil {
		return nil, errors.NewProtocolError("EVENT_BUS_NOT_INIT", "event bus not initialized", "graphql")
	}

	ch := make(chan *graphql1.BootSequenceEvent, 16)

	handler := func(_ context.Context, event events.Event) error {
		select {
		case <-ctx.Done():
			return nil
		default:
		}

		ts := event.GetTimestamp()
		var gqlEvent *graphql1.BootSequenceEvent

		switch e := event.(type) {
		case *events.BootSequenceStartedEvent:
			gqlEvent = &graphql1.BootSequenceEvent{
				ID:          event.GetID().String(),
				Type:        "started",
				Timestamp:   ts,
				InstanceIds: e.InstanceIDs,
			}
		case *events.BootSequenceLayerCompleteEvent:
			success := e.SuccessCount
			failure := e.FailureCount
			gqlEvent = &graphql1.BootSequenceEvent{
				ID:           event.GetID().String(),
				Type:         "layer_complete",
				Timestamp:    ts,
				Layer:        &e.Layer,
				InstanceIds:  e.InstanceIDs,
				SuccessCount: &success,
				FailureCount: &failure,
			}
		case *events.BootSequenceCompleteEvent:
			success := e.StartedInstances
			failure := e.FailedInstances
			ids := e.FailedIDs
			if ids == nil {
				ids = []string{}
			}
			gqlEvent = &graphql1.BootSequenceEvent{
				ID:           event.GetID().String(),
				Type:         "complete",
				Timestamp:    ts,
				InstanceIds:  ids,
				SuccessCount: &success,
				FailureCount: &failure,
			}
		case *events.BootSequenceFailedEvent:
			errMsg := e.ErrorMessage
			ids := e.StartedIDs
			if ids == nil {
				ids = []string{}
			}
			gqlEvent = &graphql1.BootSequenceEvent{
				ID:           event.GetID().String(),
				Type:         "failed",
				Timestamp:    ts,
				Layer:        &e.Layer,
				InstanceIds:  ids,
				ErrorMessage: &errMsg,
			}
		}

		if gqlEvent != nil {
			select {
			case ch <- gqlEvent:
			default:
			}
		}
		return nil
	}

	bootTopics := []string{
		events.EventTypeBootSequenceStarted,
		events.EventTypeBootSequenceLayerComplete,
		events.EventTypeBootSequenceComplete,
		events.EventTypeBootSequenceFailed,
	}

	for _, topic := range bootTopics {
		if err := r.EventBus.Subscribe(topic, handler); err != nil {
			close(ch)
			return nil, errors.Wrap(err, "SUBSCRIBE_FAILED", errors.CategoryInternal, "failed to subscribe to "+topic)
		}
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				// Log panic but don't crash service
				_ = r
			}
			close(ch)
		}()
		<-ctx.Done()
	}()

	return ch, nil
}
