package notifications

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestPushoverChannel_Send_Success verifies notifications are sent with correct format and priority mapping.
func TestPushoverChannel_Send_Success(t *testing.T) {
	tests := []struct {
		name         string
		severity     string
		wantPriority int
		wantSound    string
	}{
		{"critical", "CRITICAL", 2, "siren"},
		{"warning", "WARNING", 1, "spacealarm"},
		{"info", "INFO", 0, "pushover"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Mock server
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// CRITICAL TEST: Verify Content-Type is form-urlencoded, not JSON
				assert.Equal(t, "application/x-www-form-urlencoded", r.Header.Get("Content-Type"),
					"Pushover API requires application/x-www-form-urlencoded")

				// Parse form data
				err := r.ParseForm()
				require.NoError(t, err, "Request body should be valid form data")

				// Verify required fields
				assert.Equal(t, "test-token", r.FormValue("token"))
				assert.Equal(t, "test-user", r.FormValue("user"))
				assert.Equal(t, "Test Alert", r.FormValue("title"))
				assert.Equal(t, "Test message body", r.FormValue("message"))
				assert.Equal(t, fmt.Sprintf("%d", tt.wantPriority), r.FormValue("priority"))

				// Set usage headers
				w.Header().Set("X-Limit-App-Remaining", "9500")
				w.Header().Set("X-Limit-App-Reset", "1738454400")

				// Success response
				json.NewEncoder(w).Encode(map[string]interface{}{
					"status":  1,
					"request": "test-request-id",
				})
			}))
			defer server.Close()

			// Override URL for test
			pushoverMessagesURL = server.URL

			// Create channel and send
			channel := NewPushoverChannel(PushoverConfig{
				UserKey:  "test-user",
				AppToken: "test-token",
			})

			err := channel.Send(context.Background(), Notification{
				Title:    "Test Alert",
				Message:  "Test message body",
				Severity: tt.severity,
			})

			require.NoError(t, err)
		})
	}
}

// TestPushoverChannel_Send_ErrorClassification verifies error messages contain keywords for Dispatcher retry logic.
func TestPushoverChannel_Send_ErrorClassification(t *testing.T) {
	tests := []struct {
		name          string
		statusCode    int
		wantRetryable bool
		errContains   string
	}{
		{"invalid_credentials", 401, false, "unauthorized"},
		{"quota_exceeded", 429, false, "quota_exceeded"},
		{"server_error", 500, true, "temporary"},
		{"bad_request", 400, false, "invalid"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.statusCode)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"status": 0,
					"errors": []string{"test error"},
				})
			}))
			defer server.Close()

			pushoverMessagesURL = server.URL

			channel := NewPushoverChannel(PushoverConfig{
				UserKey:  "test-user",
				AppToken: "test-token",
			})

			err := channel.Send(context.Background(), Notification{
				Title:    "Test",
				Message:  "Test",
				Severity: "INFO",
			})

			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.errContains,
				"Error message should contain '%s' for Dispatcher to classify correctly", tt.errContains)
		})
	}
}

// TestPushoverChannel_UsageTracking verifies usage headers are parsed correctly.
func TestPushoverChannel_UsageTracking(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Limit-App-Remaining", "2000")
		w.Header().Set("X-Limit-App-Reset", "1738454400")
		json.NewEncoder(w).Encode(map[string]interface{}{"status": 1})
	}))
	defer server.Close()

	pushoverMessagesURL = server.URL

	channel := NewPushoverChannel(PushoverConfig{
		UserKey:  "test-user",
		AppToken: "test-token",
	})

	// Send notification
	err := channel.Send(context.Background(), Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
	})
	require.NoError(t, err)

	// Get usage (will be implemented later)
	usage, err := channel.GetUsage(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 2000, usage.Remaining)
	assert.Equal(t, 10000, usage.Limit)
}

// TestPushoverChannel_ValidateCredentials verifies credential validation with specific error messages.
func TestPushoverChannel_ValidateCredentials(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
		response   map[string]interface{}
		wantErr    string
	}{
		{
			"valid",
			200,
			map[string]interface{}{"status": 1, "devices": []string{"iphone"}},
			"",
		},
		{
			"invalid_user",
			200,
			map[string]interface{}{"status": 0, "errors": []string{"user key is invalid"}},
			"invalid_user_key",
		},
		{
			"invalid_token",
			200,
			map[string]interface{}{"status": 0, "errors": []string{"application token is invalid"}},
			"invalid_api_token",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.statusCode)
				json.NewEncoder(w).Encode(tt.response)
			}))
			defer server.Close()

			pushoverValidateURL = server.URL

			channel := NewPushoverChannel(PushoverConfig{})
			err := channel.ValidateCredentials(context.Background(), "test-user", "test-token")

			if tt.wantErr == "" {
				assert.NoError(t, err)
			} else {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErr)
			}
		})
	}
}

// TestPushoverChannel_CancelReceipt verifies emergency receipt cancellation.
func TestPushoverChannel_CancelReceipt(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "POST", r.Method)
		assert.Contains(t, r.URL.Path, "cancel.json")

		// Verify form data
		err := r.ParseForm()
		require.NoError(t, err)
		assert.Equal(t, "test-token", r.FormValue("token"))

		w.WriteHeader(200)
		json.NewEncoder(w).Encode(map[string]interface{}{"status": 1})
	}))
	defer server.Close()

	pushoverReceiptURL = server.URL

	channel := NewPushoverChannel(PushoverConfig{AppToken: "test-token"})
	err := channel.CancelReceipt(context.Background(), "test-receipt-123")
	require.NoError(t, err)
}

// TestPushoverChannel_DeepLinks verifies URL and timestamp are included in notifications.
func TestPushoverChannel_DeepLinks(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		err := r.ParseForm()
		require.NoError(t, err)

		// Verify deep link fields
		url := r.FormValue("url")
		assert.NotEmpty(t, url, "URL should be included for deep linking")
		assert.Contains(t, url, "/alerts/", "URL should contain alert path")

		urlTitle := r.FormValue("url_title")
		assert.Equal(t, "View in NasNet", urlTitle)

		timestamp := r.FormValue("timestamp")
		assert.NotEmpty(t, timestamp, "Timestamp should be included")
		_, err = strconv.ParseInt(timestamp, 10, 64)
		assert.NoError(t, err, "Timestamp should be valid Unix timestamp")

		json.NewEncoder(w).Encode(map[string]interface{}{"status": 1})
	}))
	defer server.Close()

	pushoverMessagesURL = server.URL

	channel := NewPushoverChannel(PushoverConfig{
		UserKey:  "test-user",
		AppToken: "test-token",
		BaseURL:  "http://localhost:5173",
	})

	err := channel.Send(context.Background(), Notification{
		Title:    "Test Alert",
		Message:  "Test",
		Severity: "CRITICAL",
		Data: map[string]interface{}{
			"alert_id":     "alert-123",
			"triggered_at": time.Now(),
		},
	})

	require.NoError(t, err)
}

// TestPushoverChannel_EmergencySoundAndRetry verifies emergency priority includes retry/expire params.
func TestPushoverChannel_EmergencySoundAndRetry(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		err := r.ParseForm()
		require.NoError(t, err)

		// Verify emergency-specific fields
		assert.Equal(t, "2", r.FormValue("priority"), "Emergency priority should be 2")
		assert.Equal(t, "siren", r.FormValue("sound"))
		assert.Equal(t, "300", r.FormValue("retry"), "Emergency should retry every 5 minutes")
		assert.Equal(t, "3600", r.FormValue("expire"), "Emergency should expire after 1 hour")

		// Return receipt for emergency
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  1,
			"receipt": "test-receipt-abc123",
		})
	}))
	defer server.Close()

	pushoverMessagesURL = server.URL

	channel := NewPushoverChannel(PushoverConfig{
		UserKey:  "test-user",
		AppToken: "test-token",
	})

	notification := Notification{
		Title:    "Critical Alert",
		Message:  "System is down!",
		Severity: "CRITICAL",
		Data:     make(map[string]interface{}),
	}

	err := channel.Send(context.Background(), notification)
	require.NoError(t, err)

	// Verify receipt was stored
	receipt, ok := notification.Data["pushover_receipt"].(string)
	assert.True(t, ok, "Receipt should be stored in notification.Data")
	assert.Equal(t, "test-receipt-abc123", receipt)
}

// TestPushoverChannel_DeviceFilter verifies device field is sent when provided.
func TestPushoverChannel_DeviceFilter(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		err := r.ParseForm()
		require.NoError(t, err)

		device := r.FormValue("device")
		assert.Equal(t, "iphone", device)

		json.NewEncoder(w).Encode(map[string]interface{}{"status": 1})
	}))
	defer server.Close()

	pushoverMessagesURL = server.URL

	channel := NewPushoverChannel(PushoverConfig{
		UserKey:  "test-user",
		AppToken: "test-token",
	})

	deviceID := "iphone"
	err := channel.Send(context.Background(), Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
		DeviceID: &deviceID,
	})

	require.NoError(t, err)
}
