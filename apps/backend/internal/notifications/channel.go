// Package notifications implements notification delivery channels.
package notifications

import (
	"context"
)

// Channel represents a notification delivery channel.
// Per Task 3.1: Create NotificationChannel interface.
type Channel interface {
	// Name returns the channel identifier (email, telegram, pushover, webhook, inapp).
	Name() string

	// Send delivers a notification using this channel.
	// Returns error if delivery fails.
	Send(ctx context.Context, notification Notification) error

	// Test verifies the channel configuration by sending a test notification.
	// Returns nil if test succeeds, error with details if it fails.
	Test(ctx context.Context, config map[string]interface{}) error
}

// Notification represents a notification to be delivered.
type Notification struct {
	// Title is the notification title/subject.
	Title string `json:"title"`

	// Message is the notification body/content.
	Message string `json:"message"`

	// Severity indicates the alert severity (CRITICAL, WARNING, INFO).
	Severity string `json:"severity"`

	// Data contains additional context data.
	Data map[string]interface{} `json:"data"`

	// DeviceID is the optional device that triggered the alert.
	DeviceID *string `json:"deviceId,omitempty"`
}

// DeliveryResult represents the result of a notification delivery attempt.
type DeliveryResult struct {
	// Channel is the channel name.
	Channel string `json:"channel"`

	// Success indicates if delivery succeeded.
	Success bool `json:"success"`

	// Error contains the error message if delivery failed.
	Error string `json:"error"`

	// Retryable indicates if the failure is transient and can be retried.
	Retryable bool `json:"retryable"`
}
