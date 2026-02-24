package events

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/ThreeDotsLabs/watermill/message"
	"go.uber.org/zap"
)

// eventFactory is a function that creates a new empty event for unmarshaling.
type eventFactory func() Event

// eventFactories maps event type strings to factory functions that create the appropriate event.
var eventFactories = map[string]eventFactory{
	EventTypeRouterStatusChanged:         func() Event { return &RouterStatusChangedEvent{} },
	EventTypeResourceUpdated:             func() Event { return &ResourceUpdatedEvent{} },
	EventTypeResourceCreated:             func() Event { return &ResourceUpdatedEvent{} },
	EventTypeResourceDeleted:             func() Event { return &ResourceUpdatedEvent{} },
	EventTypeFeatureCrashed:              func() Event { return &FeatureCrashedEvent{} },
	EventTypeConfigApplyProgress:         func() Event { return &ConfigApplyProgressEvent{} },
	EventTypeAuth:                        func() Event { return &AuthEvent{} },
	EventTypeAuthSessionRevoked:          func() Event { return &AuthEvent{} },
	EventTypeAuthPasswordChanged:         func() Event { return &AuthEvent{} },
	EventTypeFeatureInstalled:            func() Event { return &FeatureInstalledEvent{} },
	EventTypeRouterConnected:             func() Event { return &RouterConnectedEvent{} },
	EventTypeRouterDisconnected:          func() Event { return &RouterDisconnectedEvent{} },
	EventTypeMetricUpdated:               func() Event { return &MetricUpdatedEvent{} },
	EventTypeLogAppended:                 func() Event { return &LogAppendedEvent{} },
	EventTypeConfigApplied:               func() Event { return &ConfigAppliedEvent{} },
	EventTypeDeviceScanStarted:           func() Event { return &DeviceScanStartedEvent{} },
	EventTypeDeviceScanProgress:          func() Event { return &DeviceScanProgressEvent{} },
	EventTypeDeviceScanCompleted:         func() Event { return &DeviceScanCompletedEvent{} },
	EventTypeDeviceScanFailed:            func() Event { return &DeviceScanFailedEvent{} },
	EventTypeDeviceScanCancelled:         func() Event { return &DeviceScanCancelledEvent{} },
	EventTypeStorageMounted:              func() Event { return &StorageMountedEvent{} },
	EventTypeStorageUnmounted:            func() Event { return &StorageUnmountedEvent{} },
	EventTypeStorageSpaceThreshold:       func() Event { return &StorageSpaceThresholdEvent{} },
	EventTypeStorageConfigChanged:        func() Event { return &StorageConfigChangedEvent{} },
	EventTypeStorageUnavailable:          func() Event { return &StorageUnavailableEvent{} },
	EventTypeBinaryVerified:              func() Event { return &BinaryVerifiedEvent{} },
	EventTypeBinaryVerificationFailed:    func() Event { return &BinaryVerificationFailedEvent{} },
	EventTypeBinaryIntegrityFailed:       func() Event { return &BinaryIntegrityFailedEvent{} },
	EventTypeBinaryIntegrityCheckStarted: func() Event { return &BinaryIntegrityCheckStartedEvent{} },
	"alert.throttle.summary":             func() Event { return &BaseEvent{} },
	"alert.storm.detected":               func() Event { return &BaseEvent{} },
	"alert.storm.ended":                  func() Event { return &BaseEvent{} },
	EventTypeVLANPoolWarning:             func() Event { return &VLANPoolWarningEvent{} },
	EventTypeIsolationViolation:          func() Event { return &IsolationViolationEvent{} },
	EventTypeResourceWarning:             func() Event { return &ResourceWarningEvent{} },
	EventTypeResourceOOM:                 func() Event { return &ResourceOOMEvent{} },
	EventTypeResourceLimitsChanged:       func() Event { return &ResourceLimitsChangedEvent{} },
}

// ParseEvent parses a message back into a typed event using a map-based dispatch.
func ParseEvent(msg *message.Message) (Event, error) {
	eventType := msg.Metadata.Get("type")
	if eventType == "" {
		return nil, fmt.Errorf("message has no event type in metadata")
	}

	factory, ok := eventFactories[eventType]
	if !ok {
		var e BaseEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal BaseEvent: %w", err)
		}
		return &e, nil
	}

	event := factory()
	if err := json.Unmarshal(msg.Payload, event); err != nil {
		return nil, fmt.Errorf("failed to unmarshal %s: %w", eventType, err)
	}

	return event, nil
}

// priorityQueueManager manages priority-based event queues.
type priorityQueueManager struct {
	queues map[Priority][]Event
	mu     sync.Mutex
	stopCh chan struct{}
}

func newPriorityQueueManager() *priorityQueueManager {
	return &priorityQueueManager{
		queues: map[Priority][]Event{
			PriorityCritical:   make([]Event, 0),
			PriorityNormal:     make([]Event, 0),
			PriorityLow:        make([]Event, 0),
			PriorityBackground: make([]Event, 0),
		},
		stopCh: make(chan struct{}),
	}
}

func (pq *priorityQueueManager) enqueue(event Event) {
	pq.mu.Lock()
	defer pq.mu.Unlock()
	pq.queues[event.GetPriority()] = append(pq.queues[event.GetPriority()], event)
}

func (pq *priorityQueueManager) drain(priority Priority) []Event {
	pq.mu.Lock()
	defer pq.mu.Unlock()
	events := pq.queues[priority]
	pq.queues[priority] = make([]Event, 0)
	return events
}

func (pq *priorityQueueManager) drainAll() []Event {
	pq.mu.Lock()
	defer pq.mu.Unlock()
	var all []Event
	for priority := range pq.queues {
		all = append(all, pq.queues[priority]...)
		pq.queues[priority] = make([]Event, 0)
	}
	return all
}

func (pq *priorityQueueManager) stop() {
	close(pq.stopCh)
}

// processPriorityQueues processes batched events based on priority.
func (eb *eventBus) processPriorityQueues() {
	criticalTicker := time.NewTicker(100 * time.Millisecond)
	normalTicker := time.NewTicker(1 * time.Second)
	lowTicker := time.NewTicker(5 * time.Second)
	backgroundTicker := time.NewTicker(30 * time.Second)

	defer criticalTicker.Stop()
	defer normalTicker.Stop()
	defer lowTicker.Stop()
	defer backgroundTicker.Stop()

	for {
		select {
		case <-criticalTicker.C:
			eb.flushPriorityQueue(PriorityCritical)
		case <-normalTicker.C:
			eb.flushPriorityQueue(PriorityNormal)
		case <-lowTicker.C:
			eb.flushPriorityQueue(PriorityLow)
		case <-backgroundTicker.C:
			eb.flushPriorityQueue(PriorityBackground)
		case <-eb.priorityQueues.stopCh:
			return
		}
	}
}

// flushPriorityQueue publishes all events in a priority queue.
func (eb *eventBus) flushPriorityQueue(priority Priority) {
	defer func() {
		if r := recover(); r != nil {
			eb.zapLogger.Error("panic in flushPriorityQueue",
				zap.String("priority", priority.String()),
				zap.Any("panic", r))
		}
	}()

	eb.closeMu.RLock()
	if eb.closed {
		eb.closeMu.RUnlock()
		return
	}
	eb.closeMu.RUnlock()

	events := eb.priorityQueues.drain(priority)
	ctx := context.Background()

	for _, event := range events {
		if err := eb.publishDirect(ctx, event); err != nil {
			eb.zapLogger.Error("failed to publish batched event",
				zap.String("eventType", event.GetType()),
				zap.Error(err))
		}
	}
}
