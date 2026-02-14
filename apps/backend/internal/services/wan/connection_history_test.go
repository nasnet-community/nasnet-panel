package wan

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestConnectionHistoryOperations tests connection history add/get operations.
func TestConnectionHistoryOperations(t *testing.T) {
	history := newConnectionHistory(100)

	routerID := "test-router-123"
	wanInterfaceID := "wan1"

	// Test empty history
	events := history.Get(routerID, 10)
	assert.Nil(t, events)

	// Add events
	for i := 0; i < 5; i++ {
		event := &ConnectionEventData{
			ID:             string(rune('a' + i)),
			WANInterfaceID: wanInterfaceID,
			EventType:      "CONNECTED",
			Timestamp:      time.Now().Add(time.Duration(i) * time.Second),
		}
		history.Add(routerID, event)
	}

	// Get history (should be most recent first)
	events = history.Get(routerID, 10)
	require.NotNil(t, events)
	assert.Len(t, events, 5)
	// Verify order (most recent first)
	assert.Equal(t, "e", events[0].ID)
	assert.Equal(t, "a", events[4].ID)
}

// TestConnectionHistoryRingBuffer tests ring buffer behavior (max size).
func TestConnectionHistoryRingBuffer(t *testing.T) {
	// Use small max size for testing
	history := newConnectionHistory(3)

	routerID := "test-router-123"

	// Add more events than max size
	for i := 0; i < 5; i++ {
		event := &ConnectionEventData{
			ID:        string(rune('a' + i)),
			EventType: "CONNECTED",
			Timestamp: time.Now(),
		}
		history.Add(routerID, event)
	}

	// Should only keep last 3 events
	events := history.Get(routerID, 10)
	require.NotNil(t, events)
	assert.Len(t, events, 3)
	// Should have most recent 3 events (c, d, e)
	assert.Equal(t, "e", events[0].ID)
	assert.Equal(t, "d", events[1].ID)
	assert.Equal(t, "c", events[2].ID)
}
