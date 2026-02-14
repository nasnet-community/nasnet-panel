// Package escalation implements progressive escalation for unacknowledged alerts.
package escalation

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"
)

// EventBus defines the interface for publishing events.
type EventBus interface {
	Publish(ctx context.Context, event interface{}) error
}

// DispatchResult represents the result of a notification delivery attempt.
type DispatchResult struct {
	Channel string
	Success bool
	Error   string
}

// DispatchFunc is a function that dispatches a notification to the given channels.
// It decouples the escalation engine from the concrete notifications.Dispatcher.
type DispatchFunc func(ctx context.Context, title, message, severity string, data map[string]interface{}, deviceID *string, channels []string) []DispatchResult

// Config defines escalation behavior parsed from AlertRule.Escalation JSON.
type Config struct {
	Enabled                bool     `json:"enabled"`
	RequireAck             bool     `json:"requireAck"`
	EscalationDelaySeconds int      `json:"escalationDelaySeconds"`
	MaxEscalations         int      `json:"maxEscalations"`
	AdditionalChannels     []string `json:"additionalChannels"`
	RepeatIntervalSeconds  []int    `json:"repeatIntervalSeconds"`
}

// EngineConfig holds initialization parameters.
type EngineConfig struct {
	DB       *ent.Client
	Dispatch DispatchFunc
	EventBus EventBus
	Logger   *zap.SugaredLogger
}

// escalationState tracks in-memory timer and config for a single alert.
type escalationState struct {
	mu           sync.Mutex
	escalationID string
	alertID      string
	ruleID       string
	config       Config
	currentLevel int
	timer        *time.Timer
	cancelled    bool
}

// ParseConfig parses escalation JSON from AlertRule.
func ParseConfig(escalationJSON interface{}) (Config, error) {
	if escalationJSON == nil {
		return Config{}, fmt.Errorf("escalation config is nil")
	}

	jsonBytes, err := json.Marshal(escalationJSON)
	if err != nil {
		return Config{}, fmt.Errorf("failed to marshal escalation config: %w", err)
	}

	var config Config
	if err := json.Unmarshal(jsonBytes, &config); err != nil {
		return Config{}, fmt.Errorf("failed to unmarshal escalation config: %w", err)
	}

	return config, nil
}

// ValidateConfig validates escalation configuration.
func ValidateConfig(config Config) error {
	if config.EscalationDelaySeconds <= 0 {
		return fmt.Errorf("escalationDelaySeconds must be positive")
	}

	if config.MaxEscalations <= 0 {
		return fmt.Errorf("maxEscalations must be positive")
	}

	if config.MaxEscalations > 10 {
		return fmt.Errorf("maxEscalations must not exceed 10")
	}

	if len(config.RepeatIntervalSeconds) == 0 {
		return fmt.Errorf("repeatIntervalSeconds must have at least one interval")
	}

	for i, interval := range config.RepeatIntervalSeconds {
		if interval <= 0 {
			return fmt.Errorf("repeatIntervalSeconds[%d] must be positive", i)
		}
	}

	return nil
}
