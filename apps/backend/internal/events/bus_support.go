package events

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/ThreeDotsLabs/watermill/message"
)

// ParseEvent parses a message back into a typed event.
func ParseEvent(msg *message.Message) (Event, error) {
	eventType := msg.Metadata.Get("type")
	if eventType == "" {
		return nil, fmt.Errorf("message has no event type in metadata")
	}

	var event Event
	switch eventType {
	case EventTypeRouterStatusChanged:
		var e RouterStatusChangedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal RouterStatusChangedEvent: %w", err)
		}
		event = &e

	case EventTypeResourceUpdated, EventTypeResourceCreated, EventTypeResourceDeleted:
		var e ResourceUpdatedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal ResourceUpdatedEvent: %w", err)
		}
		event = &e

	case EventTypeFeatureCrashed:
		var e FeatureCrashedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal FeatureCrashedEvent: %w", err)
		}
		event = &e

	case EventTypeConfigApplyProgress:
		var e ConfigApplyProgressEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal ConfigApplyProgressEvent: %w", err)
		}
		event = &e

	case EventTypeAuth, EventTypeAuthSessionRevoked, EventTypeAuthPasswordChanged:
		var e AuthEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal AuthEvent: %w", err)
		}
		event = &e

	case EventTypeFeatureInstalled:
		var e FeatureInstalledEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal FeatureInstalledEvent: %w", err)
		}
		event = &e

	case EventTypeRouterConnected:
		var e RouterConnectedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal RouterConnectedEvent: %w", err)
		}
		event = &e

	case EventTypeRouterDisconnected:
		var e RouterDisconnectedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal RouterDisconnectedEvent: %w", err)
		}
		event = &e

	case EventTypeMetricUpdated:
		var e MetricUpdatedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal MetricUpdatedEvent: %w", err)
		}
		event = &e

	case EventTypeLogAppended:
		var e LogAppendedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal LogAppendedEvent: %w", err)
		}
		event = &e

	case EventTypeConfigApplied:
		var e ConfigAppliedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal ConfigAppliedEvent: %w", err)
		}
		event = &e

	case EventTypeDeviceScanStarted:
		var e DeviceScanStartedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal DeviceScanStartedEvent: %w", err)
		}
		event = &e

	case EventTypeDeviceScanProgress:
		var e DeviceScanProgressEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal DeviceScanProgressEvent: %w", err)
		}
		event = &e

	case EventTypeDeviceScanCompleted:
		var e DeviceScanCompletedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal DeviceScanCompletedEvent: %w", err)
		}
		event = &e

	case EventTypeDeviceScanFailed:
		var e DeviceScanFailedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal DeviceScanFailedEvent: %w", err)
		}
		event = &e

	case EventTypeDeviceScanCancelled:
		var e DeviceScanCancelledEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal DeviceScanCancelledEvent: %w", err)
		}
		event = &e

	case EventTypeStorageMounted:
		var e StorageMountedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal StorageMountedEvent: %w", err)
		}
		event = &e

	case EventTypeStorageUnmounted:
		var e StorageUnmountedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal StorageUnmountedEvent: %w", err)
		}
		event = &e

	case EventTypeStorageSpaceThreshold:
		var e StorageSpaceThresholdEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal StorageSpaceThresholdEvent: %w", err)
		}
		event = &e

	case EventTypeStorageConfigChanged:
		var e StorageConfigChangedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal StorageConfigChangedEvent: %w", err)
		}
		event = &e

	case EventTypeStorageUnavailable:
		var e StorageUnavailableEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal StorageUnavailableEvent: %w", err)
		}
		event = &e

	case EventTypeBinaryVerified:
		var e BinaryVerifiedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal BinaryVerifiedEvent: %w", err)
		}
		event = &e

	case EventTypeBinaryVerificationFailed:
		var e BinaryVerificationFailedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal BinaryVerificationFailedEvent: %w", err)
		}
		event = &e

	case EventTypeBinaryIntegrityFailed:
		var e BinaryIntegrityFailedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal BinaryIntegrityFailedEvent: %w", err)
		}
		event = &e

	case EventTypeBinaryIntegrityCheckStarted:
		var e BinaryIntegrityCheckStartedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal BinaryIntegrityCheckStartedEvent: %w", err)
		}
		event = &e

	case "alert.throttle.summary", "alert.storm.detected", "alert.storm.ended":
		var e BaseEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal alert event: %w", err)
		}
		event = &e

	case EventTypeVLANPoolWarning:
		var e VLANPoolWarningEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal VLANPoolWarningEvent: %w", err)
		}
		event = &e

	case EventTypeIsolationViolation:
		var e IsolationViolationEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal IsolationViolationEvent: %w", err)
		}
		event = &e

	case EventTypeResourceWarning:
		var e ResourceWarningEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal ResourceWarningEvent: %w", err)
		}
		event = &e

	case EventTypeResourceOOM:
		var e ResourceOOMEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal ResourceOOMEvent: %w", err)
		}
		event = &e

	case EventTypeResourceLimitsChanged:
		var e ResourceLimitsChangedEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal ResourceLimitsChangedEvent: %w", err)
		}
		event = &e

	default:
		log.Printf("[EVENTS] Unknown event type: %s", eventType)
		var e BaseEvent
		if err := json.Unmarshal(msg.Payload, &e); err != nil {
			return nil, fmt.Errorf("failed to unmarshal BaseEvent: %w", err)
		}
		return &e, nil
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
			eb.logger.Error("failed to publish batched event", err, nil)
		}
	}
}
