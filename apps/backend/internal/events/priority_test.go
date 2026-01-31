package events

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestPriority_String(t *testing.T) {
	tests := []struct {
		priority Priority
		expected string
	}{
		{PriorityImmediate, "immediate"},
		{PriorityCritical, "critical"},
		{PriorityNormal, "normal"},
		{PriorityLow, "low"},
		{PriorityBackground, "background"},
		{Priority(100), "unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.priority.String())
		})
	}
}

func TestPriority_TargetLatency(t *testing.T) {
	tests := []struct {
		priority Priority
		expected time.Duration
	}{
		{PriorityImmediate, 100 * time.Millisecond},
		{PriorityCritical, 1 * time.Second},
		{PriorityNormal, 5 * time.Second},
		{PriorityLow, 30 * time.Second},
		{PriorityBackground, 60 * time.Second},
	}

	for _, tt := range tests {
		t.Run(tt.priority.String(), func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.priority.TargetLatency())
		})
	}
}

func TestPriority_BatchWindow(t *testing.T) {
	tests := []struct {
		priority Priority
		expected time.Duration
	}{
		{PriorityImmediate, 0}, // No batching
		{PriorityCritical, 100 * time.Millisecond},
		{PriorityNormal, 1 * time.Second},
		{PriorityLow, 5 * time.Second},
		{PriorityBackground, 30 * time.Second},
	}

	for _, tt := range tests {
		t.Run(tt.priority.String(), func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.priority.BatchWindow())
		})
	}
}

func TestPriority_ShouldPersist(t *testing.T) {
	tests := []struct {
		priority Priority
		expected bool
	}{
		{PriorityImmediate, true},
		{PriorityCritical, true},
		{PriorityNormal, true},
		{PriorityLow, false},
		{PriorityBackground, false},
	}

	for _, tt := range tests {
		t.Run(tt.priority.String(), func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.priority.ShouldPersist())
		})
	}
}

func TestParsePriority(t *testing.T) {
	tests := []struct {
		input    string
		expected Priority
	}{
		{"immediate", PriorityImmediate},
		{"critical", PriorityCritical},
		{"normal", PriorityNormal},
		{"low", PriorityLow},
		{"background", PriorityBackground},
		{"unknown", PriorityNormal}, // Default to normal
		{"", PriorityNormal},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			assert.Equal(t, tt.expected, ParsePriority(tt.input))
		})
	}
}

func TestPriority_IsValid(t *testing.T) {
	tests := []struct {
		priority Priority
		expected bool
	}{
		{PriorityImmediate, true},
		{PriorityCritical, true},
		{PriorityNormal, true},
		{PriorityLow, true},
		{PriorityBackground, true},
		{Priority(-1), false},
		{Priority(5), false},
		{Priority(100), false},
	}

	for _, tt := range tests {
		t.Run(tt.priority.String(), func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.priority.IsValid())
		})
	}
}

func TestPriority_Ordering(t *testing.T) {
	// Verify that priority levels are ordered correctly (lower value = higher priority)
	assert.Less(t, int(PriorityImmediate), int(PriorityCritical))
	assert.Less(t, int(PriorityCritical), int(PriorityNormal))
	assert.Less(t, int(PriorityNormal), int(PriorityLow))
	assert.Less(t, int(PriorityLow), int(PriorityBackground))
}
