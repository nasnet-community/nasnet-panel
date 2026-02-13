// +build dev

package notifications

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestPushoverFormUrlEncoded verifies the critical bug fix - Content-Type must be form-urlencoded
func TestPushoverFormUrlEncoded(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// CRITICAL: Verify Content-Type is NOT application/json
		contentType := r.Header.Get("Content-Type")
		assert.Equal(t, "application/x-www-form-urlencoded", contentType,
			"Pushover API requires application/x-www-form-urlencoded, got %s", contentType)

		// Parse form data (should succeed if properly encoded)
		err := r.ParseForm()
		require.NoError(t, err, "Request body should be valid form data, not JSON")

		// Verify fields are present
		assert.NotEmpty(t, r.FormValue("token"))
		assert.NotEmpty(t, r.FormValue("user"))
		assert.NotEmpty(t, r.FormValue("title"))
		assert.NotEmpty(t, r.FormValue("message"))
		assert.NotEmpty(t, r.FormValue("priority"))

		// Success response
		w.WriteHeader(200)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  1,
			"request": "test-id",
		})
	}))
	defer server.Close()

	// Override URL for test
	pushoverMessagesURL = server.URL

	// Create channel
	channel := NewPushoverChannel(PushoverConfig{
		UserKey:  "test-user-key-12345678901234",
		AppToken: "test-app-token-12345678901234",
	})

	// Send notification
	err := channel.Send(context.Background(), Notification{
		Title:    "Test Alert",
		Message:  "This is a test message",
		Severity: "INFO",
	})

	require.NoError(t, err, "Send should succeed with form-urlencoded format")
}

// TestPushoverPriorityMapping verifies severity to priority mapping
func TestPushoverPriorityMapping(t *testing.T) {
	tests := []struct {
		severity     string
		wantPriority string
		wantSound    string
	}{
		{"CRITICAL", "2", "siren"},
		{"WARNING", "1", "spacealarm"},
		{"INFO", "0", "pushover"},
	}

	for _, tt := range tests {
		t.Run(tt.severity, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				r.ParseForm()
				assert.Equal(t, tt.wantPriority, r.FormValue("priority"))
				assert.Equal(t, tt.wantSound, r.FormValue("sound"))

				w.WriteHeader(200)
				json.NewEncoder(w).Encode(map[string]interface{}{"status": 1})
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
				Severity: tt.severity,
			})

			require.NoError(t, err)
		})
	}
}

// TestPushoverErrorClassification verifies error messages contain keywords for retry logic
func TestPushoverErrorClassification(t *testing.T) {
	tests := []struct {
		name        string
		statusCode  int
		errContains string
	}{
		{"unauthorized", 401, "unauthorized"},
		{"quota_exceeded", 429, "quota_exceeded"},
		{"server_error", 500, "temporary"},
		{"bad_request", 400, "invalid"},
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
				"Error should contain '%s' for Dispatcher to classify correctly", tt.errContains)
		})
	}
}

// TestPushoverValidateCredentials verifies credential validation
func TestPushoverValidateCredentials(t *testing.T) {
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
				assert.Equal(t, "application/x-www-form-urlencoded", r.Header.Get("Content-Type"))
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

// TestPushoverUsageTracking verifies usage header parsing
func TestPushoverUsageTracking(t *testing.T) {
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

	// Get usage
	usage, err := channel.GetUsage(context.Background())
	require.NoError(t, err)
	assert.Equal(t, 2000, usage.Remaining)
	assert.Equal(t, 10000, usage.Limit)
}

// TestPushoverCancelReceipt verifies receipt cancellation
func TestPushoverCancelReceipt(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "POST", r.Method)
		assert.Contains(t, r.URL.Path, "cancel.json")

		r.ParseForm()
		assert.NotEmpty(t, r.FormValue("token"))

		w.WriteHeader(200)
		json.NewEncoder(w).Encode(map[string]interface{}{"status": 1})
	}))
	defer server.Close()

	pushoverReceiptURL = fmt.Sprintf("%s/receipts", server.URL)

	channel := NewPushoverChannel(PushoverConfig{AppToken: "test-token"})
	err := channel.CancelReceipt(context.Background(), "test-receipt-123")
	require.NoError(t, err)
}
