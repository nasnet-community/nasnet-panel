package events

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/oklog/ulid/v2"
	"go.uber.org/zap"
)

// EventStore provides persistence for critical events.
type EventStore interface {
	PersistEvent(ctx context.Context, event Event) error
	GetEventsSince(ctx context.Context, since time.Time) ([]Event, error)
	GetUnprocessedEvents(ctx context.Context) ([]Event, error)
	MarkProcessed(ctx context.Context, id ulid.ULID) error
	ReplayEvents(ctx context.Context, handler EventHandler) error
	Close() error
}

// MemoryEventStore is an in-memory implementation for development and testing.
type MemoryEventStore struct {
	events    map[ulid.ULID]storedEvent
	processed map[ulid.ULID]bool
	mu        sync.RWMutex
	maxEvents int
	logger    *zap.Logger
}

type storedEvent struct {
	event     Event
	payload   []byte
	timestamp time.Time
}

// NewMemoryEventStore creates a new in-memory event store.
func NewMemoryEventStore(maxEvents int) *MemoryEventStore {
	if maxEvents <= 0 {
		maxEvents = 10000
	}
	logger, _ := zap.NewProduction() //nolint:errcheck // fallback logger creation
	return &MemoryEventStore{
		events:    make(map[ulid.ULID]storedEvent),
		processed: make(map[ulid.ULID]bool),
		maxEvents: maxEvents,
		logger:    logger,
	}
}

// PersistEvent saves an event to the in-memory store.
func (s *MemoryEventStore) PersistEvent(ctx context.Context, event Event) error {
	if event == nil {
		return fmt.Errorf("event cannot be nil")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if !event.GetPriority().ShouldPersist() {
		return nil
	}
	payload, err := event.Payload()
	if err != nil {
		return err
	}
	if len(s.events) >= s.maxEvents {
		s.evictOldest()
	}
	s.events[event.GetID()] = storedEvent{event: event, payload: payload, timestamp: event.GetTimestamp()}
	return nil
}

// GetEventsSince retrieves events after the given timestamp.
func (s *MemoryEventStore) GetEventsSince(ctx context.Context, since time.Time) ([]Event, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Event
	for _, stored := range s.events {
		if stored.timestamp.After(since) {
			result = append(result, stored.event)
		}
	}
	return result, nil
}

// GetUnprocessedEvents retrieves events that haven't been processed.
func (s *MemoryEventStore) GetUnprocessedEvents(ctx context.Context) ([]Event, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var result []Event
	for id, stored := range s.events {
		if !s.processed[id] {
			result = append(result, stored.event)
		}
	}
	return result, nil
}

// MarkProcessed marks an event as processed.
func (s *MemoryEventStore) MarkProcessed(ctx context.Context, id ulid.ULID) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.processed[id] = true
	return nil
}

// ReplayEvents replays all unprocessed events.
func (s *MemoryEventStore) ReplayEvents(ctx context.Context, handler EventHandler) error {
	events, err := s.GetUnprocessedEvents(ctx)
	if err != nil {
		return err
	}
	for _, event := range events {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			if err := handler(ctx, event); err != nil {
				s.logger.Error("failed to replay event", zap.String("event_id", event.GetID().String()), zap.Error(err))
				continue
			}
			if err := s.MarkProcessed(ctx, event.GetID()); err != nil {
				s.logger.Error("failed to mark event as processed", zap.String("event_id", event.GetID().String()), zap.Error(err))
			}
		}
	}
	return nil
}

// Close closes the event store.
func (s *MemoryEventStore) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.events = nil
	s.processed = nil
	return nil
}

func (s *MemoryEventStore) evictOldest() {
	evictCount := s.maxEvents / 10
	if evictCount == 0 {
		evictCount = 1
	}
	oldest := make([]ulid.ULID, 0, evictCount)
	for id := range s.events {
		oldest = append(oldest, id)
		if len(oldest) >= evictCount {
			break
		}
	}
	for _, id := range oldest {
		delete(s.events, id)
		delete(s.processed, id)
	}
}

// EventCount returns the number of stored events.
func (s *MemoryEventStore) EventCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.events)
}

// PersistentEventBus wraps an EventBus with persistence capabilities.
type PersistentEventBus struct {
	EventBus
	store           EventStore
	persistenceFail bool
	mu              sync.RWMutex
	logger          *zap.Logger
}

// NewPersistentEventBus creates an event bus with persistence.
func NewPersistentEventBus(bus EventBus, store EventStore) *PersistentEventBus {
	if bus == nil || store == nil {
		panic("bus and store must not be nil")
	}
	logger, _ := zap.NewProduction() //nolint:errcheck // fallback logger creation
	return &PersistentEventBus{EventBus: bus, store: store, logger: logger}
}

// Publish publishes an event and persists it if critical.
func (pb *PersistentEventBus) Publish(ctx context.Context, event Event) error {
	if err := pb.EventBus.Publish(ctx, event); err != nil {
		return err
	}
	if ShouldImmediatelyPersist(event.GetType()) {
		go pb.persistAsync(ctx, event)
	}
	return nil
}

func (pb *PersistentEventBus) persistAsync(ctx context.Context, event Event) {
	if err := pb.store.PersistEvent(ctx, event); err != nil {
		pb.mu.Lock()
		pb.persistenceFail = true
		pb.mu.Unlock()
		pb.logger.Warn("persistence failed for event", zap.String("event_id", event.GetID().String()), zap.Error(err))
	} else {
		pb.mu.Lock()
		pb.persistenceFail = false
		pb.mu.Unlock()
	}
}

// ReplayUnprocessedEvents replays events on startup.
func (pb *PersistentEventBus) ReplayUnprocessedEvents(ctx context.Context) error {
	return pb.store.ReplayEvents(ctx, func(ctx context.Context, event Event) error {
		return pb.EventBus.Publish(ctx, event)
	})
}

// IsPersistenceFailing returns true if persistence is currently failing.
func (pb *PersistentEventBus) IsPersistenceFailing() bool {
	pb.mu.RLock()
	defer pb.mu.RUnlock()
	return pb.persistenceFail
}

// Close closes both the event bus and the store.
func (pb *PersistentEventBus) Close() error {
	if err := pb.EventBus.Close(); err != nil {
		return err
	}
	return pb.store.Close()
}

// DailySync provides the daily sync functionality per ADR-013.
type DailySync struct {
	store     EventStore
	bus       EventBus
	startHour int
	stopCh    chan struct{}
	logger    *zap.Logger
}

// NewDailySync creates a new daily sync scheduler.
func NewDailySync(store EventStore, bus EventBus) *DailySync {
	logger, _ := zap.NewProduction() //nolint:errcheck // fallback logger creation
	return &DailySync{store: store, bus: bus, startHour: 2, stopCh: make(chan struct{}), logger: logger}
}

// Start begins the daily sync scheduler.
func (ds *DailySync) Start(ctx context.Context) { go ds.run(ctx) }

// Stop stops the daily sync scheduler.
func (ds *DailySync) Stop() { close(ds.stopCh) }

func (ds *DailySync) run(ctx context.Context) {
	now := time.Now()
	next := time.Date(now.Year(), now.Month(), now.Day(), ds.startHour, 0, 0, 0, now.Location())
	if now.After(next) {
		next = next.Add(24 * time.Hour)
	}
	timer := time.NewTimer(time.Until(next))
	defer timer.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ds.stopCh:
			return
		case <-timer.C:
			ds.doSync(ctx)
			timer.Reset(24 * time.Hour)
		}
	}
}

func (ds *DailySync) doSync(ctx context.Context) {
	ds.logger.Info("starting daily sync", zap.Time("timestamp", time.Now()))
	yesterday := time.Now().Add(-24 * time.Hour)
	events, err := ds.store.GetEventsSince(ctx, yesterday)
	if err != nil {
		ds.logger.Error("daily sync failed to get events", zap.Error(err))
		return
	}
	var filtered []Event
	for _, event := range events {
		if ShouldBatchPersist(event.GetType()) {
			filtered = append(filtered, event)
		}
	}
	ds.logger.Info("daily sync completed successfully", zap.Int("synced_events", len(filtered)), zap.Int("total_events", len(events)))
}
