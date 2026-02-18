package throttle

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// QuietHoursQueueManager wraps QuietHoursFilter and manages queued notifications during quiet hours.
type QuietHoursQueueManager struct {
	mu               sync.RWMutex
	filter           *QuietHoursFilter
	queues           map[string]*channelQueue
	config           QuietHoursConfig
	clock            Clock
	deliveryCallback DeliveryCallback
	ticker           *time.Ticker
	stopCh           chan struct{}
	wg               sync.WaitGroup
}

// channelQueue manages queued notifications for a single channel with TTL tracking.
type channelQueue struct {
	notifications []QueuedNotification
	maxSize       int
}

// QueuedNotification represents a notification queued during quiet hours.
type QueuedNotification struct {
	ChannelID    string                 `json:"channelId"`
	AlertID      string                 `json:"alertId"`
	Title        string                 `json:"title"`
	Message      string                 `json:"message"`
	Severity     string                 `json:"severity"`
	EventType    string                 `json:"eventType"`
	Data         map[string]interface{} `json:"data,omitempty"`
	QueuedAt     time.Time              `json:"queuedAt"`
	TTLExpiresAt time.Time              `json:"ttlExpiresAt"`
}

// DeliveryCallback is called to deliver queued notifications when quiet hours end.
type DeliveryCallback func(ctx context.Context, notifications []QueuedNotification) error

// QuietHoursQueueOption is a functional option for configuring QuietHoursQueueManager.
type QuietHoursQueueOption func(*QuietHoursQueueManager)

// WithQuietHoursClock sets a custom clock for the queue manager.
func WithQuietHoursClock(clock Clock) QuietHoursQueueOption {
	return func(qm *QuietHoursQueueManager) {
		qm.clock = clock
	}
}

// WithQuietHoursConfig sets the quiet hours configuration.
func WithQuietHoursConfig(config QuietHoursConfig) QuietHoursQueueOption {
	return func(qm *QuietHoursQueueManager) {
		qm.config = config
	}
}

// WithDeliveryCallback sets the callback for delivering queued notifications.
func WithDeliveryCallback(callback DeliveryCallback) QuietHoursQueueOption {
	return func(qm *QuietHoursQueueManager) {
		qm.deliveryCallback = callback
	}
}

// NewQuietHoursQueueManager creates a new quiet hours queue manager.
func NewQuietHoursQueueManager(opts ...QuietHoursQueueOption) *QuietHoursQueueManager {
	qm := &QuietHoursQueueManager{
		filter: NewQuietHoursFilter(),
		queues: make(map[string]*channelQueue),
		clock:  RealClock{},
		stopCh: make(chan struct{}),
	}

	for _, opt := range opts {
		opt(qm)
	}

	qm.ticker = time.NewTicker(1 * time.Minute)
	qm.wg.Add(1)
	go qm.worker()

	return qm
}

// ShouldQueue checks if a notification should be queued due to quiet hours.
func (qm *QuietHoursQueueManager) ShouldQueue(severity string) (shouldQueue bool, reason string) {
	now := qm.clock.Now()
	suppress, reason := qm.filter.ShouldSuppress(qm.config, severity, now)
	return suppress, reason
}

// Enqueue adds a notification to the queue for a specific channel.
func (qm *QuietHoursQueueManager) Enqueue(notification *QueuedNotification) error {
	qm.mu.Lock()
	defer qm.mu.Unlock()

	channelID := notification.ChannelID
	queue, exists := qm.queues[channelID]
	if !exists {
		queue = &channelQueue{
			notifications: make([]QueuedNotification, 0, 10),
			maxSize:       100,
		}
		qm.queues[channelID] = queue
	}

	if len(queue.notifications) >= queue.maxSize {
		return fmt.Errorf("queue full for channel %s (max: %d)", channelID, queue.maxSize)
	}

	now := qm.clock.Now()
	notification.QueuedAt = now
	notification.TTLExpiresAt = now.Add(24 * time.Hour)

	queue.notifications = append(queue.notifications, *notification)
	return nil
}

// GetQueuedCount returns the number of queued notifications for a channel.
func (qm *QuietHoursQueueManager) GetQueuedCount(channelID string) int {
	qm.mu.RLock()
	defer qm.mu.RUnlock()

	queue, exists := qm.queues[channelID]
	if !exists {
		return 0
	}
	return len(queue.notifications)
}

// GetAllQueuedCounts returns the queued notification counts for all channels.
func (qm *QuietHoursQueueManager) GetAllQueuedCounts() map[string]int {
	qm.mu.RLock()
	defer qm.mu.RUnlock()

	counts := make(map[string]int)
	for channelID, queue := range qm.queues {
		counts[channelID] = len(queue.notifications)
	}
	return counts
}

// ClearQueue clears all queued notifications for a specific channel.
func (qm *QuietHoursQueueManager) ClearQueue(channelID string) {
	qm.mu.Lock()
	defer qm.mu.Unlock()
	delete(qm.queues, channelID)
}

// ClearAllQueues clears all queued notifications for all channels.
func (qm *QuietHoursQueueManager) ClearAllQueues() {
	qm.mu.Lock()
	defer qm.mu.Unlock()
	qm.queues = make(map[string]*channelQueue)
}

// worker runs in background checking for quiet hours end and TTL expiration.
func (qm *QuietHoursQueueManager) worker() {
	defer qm.wg.Done()

	for {
		select {
		case <-qm.ticker.C:
			qm.processQueues()
		case <-qm.stopCh:
			return
		}
	}
}

// processQueues checks if quiet hours ended and delivers queued notifications.
func (qm *QuietHoursQueueManager) processQueues() {
	now := qm.clock.Now()
	inQuietHours, _ := qm.filter.ShouldSuppress(qm.config, "INFO", now)

	qm.mu.Lock()
	defer qm.mu.Unlock()

	for _, queue := range qm.queues {
		if len(queue.notifications) == 0 {
			continue
		}

		validNotifications := make([]QueuedNotification, 0, len(queue.notifications))
		for _, notif := range queue.notifications {
			if now.Before(notif.TTLExpiresAt) {
				validNotifications = append(validNotifications, notif)
			}
		}
		queue.notifications = validNotifications

		if !inQuietHours && len(queue.notifications) > 0 {
			toDeliver := make([]QueuedNotification, len(queue.notifications))
			copy(toDeliver, queue.notifications)
			queue.notifications = make([]QueuedNotification, 0, 10)

			if qm.deliveryCallback != nil {
				go func(notifications []QueuedNotification) {
					ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
					defer cancel()
					if err := qm.deliveryCallback(ctx, notifications); err != nil {
						_ = err
					}
				}(toDeliver)
			}
		}
	}

	for channelID, queue := range qm.queues {
		if len(queue.notifications) == 0 {
			delete(qm.queues, channelID)
		}
	}
}

// FlushAll immediately delivers all queued notifications regardless of quiet hours.
func (qm *QuietHoursQueueManager) FlushAll(ctx context.Context) error {
	qm.mu.Lock()
	allNotifications := make([]QueuedNotification, 0)
	for _, queue := range qm.queues {
		allNotifications = append(allNotifications, queue.notifications...)
	}
	qm.queues = make(map[string]*channelQueue)
	qm.mu.Unlock()

	if len(allNotifications) == 0 {
		return nil
	}

	if qm.deliveryCallback == nil {
		return fmt.Errorf("no delivery callback configured")
	}

	return qm.deliveryCallback(ctx, allNotifications)
}

// Close stops the background worker and releases resources.
func (qm *QuietHoursQueueManager) Close() {
	select {
	case <-qm.stopCh:
		return
	default:
		close(qm.stopCh)
	}

	if qm.ticker != nil {
		qm.ticker.Stop()
	}
	qm.wg.Wait()
}

// UpdateConfig updates the quiet hours configuration at runtime.
func (qm *QuietHoursQueueManager) UpdateConfig(config QuietHoursConfig) {
	qm.mu.Lock()
	defer qm.mu.Unlock()
	qm.config = config
}

// GetConfig returns the current quiet hours configuration.
func (qm *QuietHoursQueueManager) GetConfig() QuietHoursConfig {
	qm.mu.RLock()
	defer qm.mu.RUnlock()
	return qm.config
}
