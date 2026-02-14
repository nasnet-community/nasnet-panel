// Package digest implements digest mode for alert notifications.
package digest

import (
	"context"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
)

// DigestConfig defines digest delivery configuration.
type DigestConfig struct {
	Mode           string   `json:"mode"`
	Schedule       string   `json:"schedule"`
	Timezone       string   `json:"timezone"`
	BypassCritical bool     `json:"bypassCritical"`
	SendEmpty      bool     `json:"sendEmpty"`
	QuietHours     *string  `json:"quietHours"`
	Severities     []string `json:"severities"`
}

// DigestPayload represents a compiled digest ready for delivery.
type DigestPayload struct {
	DigestID       string
	ChannelID      string
	ChannelType    string
	Entries        []*ent.AlertDigestEntry
	SeverityCounts map[string]int
	OldestAlert    time.Time
	NewestAlert    time.Time
	TotalCount     int
}

// Alert represents a normalized alert structure for queuing.
type Alert struct {
	ID        string
	RuleID    string
	Severity  string
	EventType string
	Title     string
	Message   string
	Data      map[string]interface{}
}

// DispatchResult represents the result of a notification delivery attempt.
type DispatchResult struct {
	Channel string
	Success bool
	Error   string
}

// DispatchFunc dispatches a notification and returns delivery results.
type DispatchFunc func(ctx context.Context, title, message, severity string, data map[string]interface{}, deviceID *string, channels []string) []DispatchResult

// ServiceConfig holds configuration for Service.
type ServiceConfig struct {
	DB       *ent.Client
	EventBus events.EventBus
	Dispatch DispatchFunc
	Logger   *zap.SugaredLogger
}

// SchedulerConfig holds configuration for Scheduler.
type SchedulerConfig struct {
	DigestService *Service
	Logger        *zap.SugaredLogger
}
