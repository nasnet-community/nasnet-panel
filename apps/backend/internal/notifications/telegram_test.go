package notifications

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ========================================
// Configuration Parsing Tests
// ========================================

func TestParseTelegramConfig_MultipleChats(t *testing.T) {
	config := map[string]interface{}{
		"bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
		"chat_ids":  []interface{}{"123456789", "-987654321", "@testchannel"},
	}

	result, err := parseTelegramConfig(config)

	require.NoError(t, err)
	assert.Equal(t, "123456789:ABCdefGHIjklMNOpqrsTUVwxyz", result.BotToken)
	assert.Equal(t, []string{"123456789", "-987654321", "@testchannel"}, result.ChatIDs)
}

func TestParseTelegramConfig_SingleChatBackwardCompat(t *testing.T) {
	// Legacy config with single chat_id
	config := map[string]interface{}{
		"bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
		"chat_id":   "123456789",
	}

	result, err := parseTelegramConfig(config)

	require.NoError(t, err)
	assert.Equal(t, "123456789:ABCdefGHIjklMNOpqrsTUVwxyz", result.BotToken)
	assert.Equal(t, []string{"123456789"}, result.ChatIDs)
}

func TestParseTelegramConfig_MissingBotToken(t *testing.T) {
	config := map[string]interface{}{
		"chat_ids": []interface{}{"123456789"},
	}

	_, err := parseTelegramConfig(config)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "bot_token is required")
}

func TestParseTelegramConfig_EmptyChatIDs(t *testing.T) {
	config := map[string]interface{}{
		"bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
		"chat_ids":  []interface{}{},
	}

	_, err := parseTelegramConfig(config)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "at least one chat ID is required")
}

func TestParseTelegramConfig_MissingChatID(t *testing.T) {
	// Missing both chat_id and chat_ids
	config := map[string]interface{}{
		"bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
	}

	_, err := parseTelegramConfig(config)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "at least one chat ID is required")
}

func TestParseTelegramConfig_FilterEmptyStrings(t *testing.T) {
	// Array with empty strings should be filtered out
	config := map[string]interface{}{
		"bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
		"chat_ids":  []interface{}{"123456789", "", "  ", "-987654321"},
	}

	result, err := parseTelegramConfig(config)

	require.NoError(t, err)
	// Empty strings and whitespace-only should be filtered
	assert.Equal(t, []string{"123456789", "-987654321"}, result.ChatIDs)
}

// ========================================
// MarkdownV2 Escaping Tests
// ========================================

func TestEscapeMarkdownV2_AllSpecialCharacters(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "underscore",
			input:    "text_with_underscores",
			expected: "text\\_with\\_underscores",
		},
		{
			name:     "asterisk",
			input:    "text*with*asterisks",
			expected: "text\\*with\\*asterisks",
		},
		{
			name:     "square brackets",
			input:    "text[with]brackets",
			expected: "text\\[with\\]brackets",
		},
		{
			name:     "parentheses",
			input:    "text(with)parentheses",
			expected: "text\\(with\\)parentheses",
		},
		{
			name:     "tilde",
			input:    "text~with~tildes",
			expected: "text\\~with\\~tildes",
		},
		{
			name:     "backtick",
			input:    "text`with`backticks",
			expected: "text\\`with\\`backticks",
		},
		{
			name:     "greater than",
			input:    "text>with>greater",
			expected: "text\\>with\\>greater",
		},
		{
			name:     "hash",
			input:    "text#with#hash",
			expected: "text\\#with\\#hash",
		},
		{
			name:     "plus",
			input:    "text+with+plus",
			expected: "text\\+with\\+plus",
		},
		{
			name:     "minus",
			input:    "text-with-minus",
			expected: "text\\-with\\-minus",
		},
		{
			name:     "equals",
			input:    "text=with=equals",
			expected: "text\\=with\\=equals",
		},
		{
			name:     "pipe",
			input:    "text|with|pipe",
			expected: "text\\|with\\|pipe",
		},
		{
			name:     "curly braces",
			input:    "text{with}braces",
			expected: "text\\{with\\}braces",
		},
		{
			name:     "dot",
			input:    "text.with.dots",
			expected: "text\\.with\\.dots",
		},
		{
			name:     "exclamation",
			input:    "text!with!exclamation",
			expected: "text\\!with\\!exclamation",
		},
		{
			name:     "backslash",
			input:    "text\\with\\backslash",
			expected: "text\\\\with\\\\backslash",
		},
		{
			name:     "all special chars",
			input:    "_*[]()~`>#+-=|{}.!\\",
			expected: "\\_\\*\\[\\]\\(\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!\\\\",
		},
		{
			name:     "router name with special chars",
			input:    "MikroTik-Office_Router#1",
			expected: "MikroTik\\-Office\\_Router\\#1",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := escapeMarkdownV2(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestEscapeMarkdownV2_EmptyString(t *testing.T) {
	result := escapeMarkdownV2("")
	assert.Equal(t, "", result)
}

func TestEscapeMarkdownV2_NoSpecialChars(t *testing.T) {
	input := "Simple text without special characters"
	result := escapeMarkdownV2(input)
	assert.Equal(t, input, result)
}

// ========================================
// Severity Emoji Tests
// ========================================

func TestGetSeverityEmoji(t *testing.T) {
	channel := &TelegramChannel{}

	testCases := []struct {
		severity string
		expected string
	}{
		{"CRITICAL", "🔴"},
		{"WARNING", "🟠"},
		{"INFO", "🟢"},
		{"UNKNOWN", "🔔"},
		{"", "🔔"},
	}

	for _, tc := range testCases {
		t.Run(tc.severity, func(t *testing.T) {
			result := channel.getSeverityEmoji(tc.severity)
			assert.Equal(t, tc.expected, result)
		})
	}
}

// ========================================
// Message Formatting Tests
// ========================================

func TestFormatMessage_BasicStructure(t *testing.T) {
	channel := &TelegramChannel{}
	deviceID := "router-01"

	notification := Notification{
		Title:    "Router Offline",
		Message:  "Router has gone offline",
		Severity: "CRITICAL",
		DeviceID: &deviceID,
		Data: map[string]interface{}{
			"router_name":  "MikroTik-Office",
			"event_type":   "router_offline",
			"triggered_at": "2026-02-12T10:30:00Z",
		},
	}

	result := channel.formatMessage(notification)

	// Check structure
	assert.Contains(t, result, "🔴")                                  // Emoji
	assert.Contains(t, result, "*Router Offline*")                    // Bold title
	assert.Contains(t, result, "Router has gone offline")             // Message
	assert.Contains(t, result, "*Router:* MikroTik\\-Office")         // Router field (escaped)
	assert.Contains(t, result, "*Event:* router\\_offline")           // Event field (escaped)
	assert.Contains(t, result, "*Time:* 2026\\-02\\-12T10:30:00Z")    // Time field (escaped)
}

func TestFormatMessage_EscapingSpecialChars(t *testing.T) {
	channel := &TelegramChannel{}

	notification := Notification{
		Title:    "Alert_Test#1",
		Message:  "Message with special chars: _*[]()~`>#+-=|{}.!\\",
		Severity: "WARNING",
		Data: map[string]interface{}{
			"router_name": "Router-01_Test#2",
		},
	}

	result := channel.formatMessage(notification)

	// Title should be escaped
	assert.Contains(t, result, "Alert\\_Test\\#1")
	// Message should be escaped
	assert.Contains(t, result, "\\_\\*\\[\\]\\(\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!\\\\")
	// Router name should be escaped
	assert.Contains(t, result, "Router\\-01\\_Test\\#2")
}

func TestFormatMessage_MissingDataFields(t *testing.T) {
	channel := &TelegramChannel{}

	notification := Notification{
		Title:    "Test Alert",
		Message:  "Test message",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	result := channel.formatMessage(notification)

	// Should still format without crashing
	assert.Contains(t, result, "🟢")
	assert.Contains(t, result, "*Test Alert*")
	assert.Contains(t, result, "Test message")
	// Data fields should not cause errors
}

// ========================================
// Inline Keyboard Tests
// ========================================

func TestBuildInlineKeyboard_ValidData(t *testing.T) {
	channel := &TelegramChannel{}

	notification := Notification{
		Title:    "Test Alert",
		Message:  "Test message",
		Severity: "INFO",
		Data: map[string]interface{}{
			"base_url": "https://nasnet.example.com",
			"alert_id": "alert-123",
		},
	}

	keyboard := channel.buildInlineKeyboard(notification)

	require.NotNil(t, keyboard)
	require.Len(t, keyboard.InlineKeyboard, 1)
	require.Len(t, keyboard.InlineKeyboard[0], 1)

	button := keyboard.InlineKeyboard[0][0]
	assert.Equal(t, "🔍 View in NasNet", button.Text)
	assert.Equal(t, "https://nasnet.example.com/alerts/alert-123", button.URL)
}

func TestBuildInlineKeyboard_BaseURLWithTrailingSlash(t *testing.T) {
	channel := &TelegramChannel{}

	notification := Notification{
		Data: map[string]interface{}{
			"base_url": "https://nasnet.example.com/",
			"alert_id": "alert-456",
		},
	}

	keyboard := channel.buildInlineKeyboard(notification)

	require.NotNil(t, keyboard)
	button := keyboard.InlineKeyboard[0][0]
	// Should not have double slash
	assert.Equal(t, "https://nasnet.example.com/alerts/alert-456", button.URL)
}

func TestBuildInlineKeyboard_MissingBaseURL(t *testing.T) {
	channel := &TelegramChannel{}

	notification := Notification{
		Data: map[string]interface{}{
			"alert_id": "alert-123",
		},
	}

	keyboard := channel.buildInlineKeyboard(notification)

	assert.Nil(t, keyboard)
}

func TestBuildInlineKeyboard_MissingAlertID(t *testing.T) {
	channel := &TelegramChannel{}

	notification := Notification{
		Data: map[string]interface{}{
			"base_url": "https://nasnet.example.com",
		},
	}

	keyboard := channel.buildInlineKeyboard(notification)

	assert.Nil(t, keyboard)
}

func TestBuildInlineKeyboard_EmptyData(t *testing.T) {
	channel := &TelegramChannel{}

	notification := Notification{
		Data: map[string]interface{}{},
	}

	keyboard := channel.buildInlineKeyboard(notification)

	assert.Nil(t, keyboard)
}

// ========================================
// HTTP Interaction Tests
// ========================================

func TestSendMessageToChat_Success(t *testing.T) {
	// Mock Telegram API server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request
		assert.Equal(t, "POST", r.Method)
		assert.Contains(t, r.URL.Path, "/sendMessage")
		assert.Equal(t, "application/json", r.Header.Get("Content-Type"))

		// Parse payload
		var payload map[string]interface{}
		err := json.NewDecoder(r.Body).Decode(&payload)
		require.NoError(t, err)

		assert.Equal(t, "123456789", payload["chat_id"])
		assert.Equal(t, "Test message", payload["text"])
		assert.Equal(t, "MarkdownV2", payload["parse_mode"])

		// Return success
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok": true,
			"result": map[string]interface{}{
				"message_id": 12345,
			},
		})
	}))
	defer server.Close()

	channel := &TelegramChannel{
		config: TelegramConfig{
			BotToken: "test-token",
			ChatIDs:  []string{"123456789"},
		},
		client:     server.Client(),
		apiBaseURL: server.URL + "/bot",
	}

	err := channel.sendMessageToChat(context.Background(), "123456789", "Test message", nil)

	assert.NoError(t, err)
}

func TestSendMessageToChat_HTTP429WithRetryAfter(t *testing.T) {
	// Mock Telegram API server returning 429
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":          false,
			"error_code":  429,
			"description": "Too Many Requests: retry after 30",
			"parameters": map[string]interface{}{
				"retry_after": 30,
			},
		})
	}))
	defer server.Close()

	channel := &TelegramChannel{
		config: TelegramConfig{
			BotToken: "test-token",
			ChatIDs:  []string{"123456789"},
		},
		client:     server.Client(),
		apiBaseURL: server.URL + "/bot",
	}

	err := channel.sendMessageToChat(context.Background(), "123456789", "Test message", nil)

	require.Error(t, err)
	// CRITICAL: Must contain "temporary" keyword for dispatcher retry
	assert.Contains(t, err.Error(), "temporary")
	assert.Contains(t, err.Error(), "rate limited")
	assert.Contains(t, err.Error(), "30 seconds")
}

func TestSendMessageToChat_HTTP429NoRetryAfter(t *testing.T) {
	// Mock Telegram API server returning 429 without retry_after
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":          false,
			"error_code":  429,
			"description": "Too Many Requests",
		})
	}))
	defer server.Close()

	channel := &TelegramChannel{
		config: TelegramConfig{
			BotToken: "test-token",
			ChatIDs:  []string{"123456789"},
		},
		client:     server.Client(),
		apiBaseURL: server.URL + "/bot",
	}

	err := channel.sendMessageToChat(context.Background(), "123456789", "Test message", nil)

	require.Error(t, err)
	// Should still be retryable with default retry time
	assert.Contains(t, err.Error(), "temporary")
	assert.Contains(t, err.Error(), "30 seconds") // Default
}

func TestSendMessageToChat_InvalidBotToken(t *testing.T) {
	// Mock Telegram API server returning 401
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":          false,
			"error_code":  401,
			"description": "Unauthorized: invalid bot token",
		})
	}))
	defer server.Close()

	channel := &TelegramChannel{
		config: TelegramConfig{
			BotToken: "invalid-token",
			ChatIDs:  []string{"123456789"},
		},
		client:     server.Client(),
		apiBaseURL: server.URL + "/bot",
	}

	err := channel.sendMessageToChat(context.Background(), "123456789", "Test message", nil)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "Unauthorized")
	assert.Contains(t, err.Error(), "invalid bot token")
}

func TestSendMessageToChat_InvalidChatID(t *testing.T) {
	// Mock Telegram API server returning 400
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":          false,
			"error_code":  400,
			"description": "Bad Request: chat not found",
		})
	}))
	defer server.Close()

	channel := &TelegramChannel{
		config: TelegramConfig{
			BotToken: "test-token",
			ChatIDs:  []string{"invalid-chat"},
		},
		client:     server.Client(),
		apiBaseURL: server.URL + "/bot",
	}

	err := channel.sendMessageToChat(context.Background(), "invalid-chat", "Test message", nil)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "Bad Request")
	assert.Contains(t, err.Error(), "chat not found")
}

func TestSendMessageToChat_WithInlineKeyboard(t *testing.T) {
	// Mock Telegram API server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var payload map[string]interface{}
		err := json.NewDecoder(r.Body).Decode(&payload)
		require.NoError(t, err)

		// Verify inline keyboard is included
		replyMarkup, ok := payload["reply_markup"]
		assert.True(t, ok)
		assert.NotNil(t, replyMarkup)

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{"ok": true})
	}))
	defer server.Close()

	channel := &TelegramChannel{
		config: TelegramConfig{
			BotToken: "test-token",
			ChatIDs:  []string{"123456789"},
		},
		client:     server.Client(),
		apiBaseURL: server.URL + "/bot",
	}

	keyboard := &InlineKeyboardMarkup{
		InlineKeyboard: [][]InlineKeyboardButton{
			{{Text: "View", URL: "https://example.com"}},
		},
	}

	err := channel.sendMessageToChat(context.Background(), "123456789", "Test message", keyboard)

	assert.NoError(t, err)
}

// ========================================
// Parallel Delivery Tests
// ========================================

func TestSend_AllChatsSucceed(t *testing.T) {
	var callCount int32

	// Mock Telegram API server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&callCount, 1)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{"ok": true})
	}))
	defer server.Close()

	channel := &TelegramChannel{
		config: TelegramConfig{
			BotToken: "test-token",
			ChatIDs:  []string{"chat1", "chat2", "chat3"},
		},
		client:     server.Client(),
		apiBaseURL: server.URL + "/bot",
	}

	notification := Notification{
		Title:    "Test",
		Message:  "Test message",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	err := channel.Send(context.Background(), notification)

	assert.NoError(t, err)
	assert.Equal(t, int32(3), atomic.LoadInt32(&callCount))
}

func TestSend_AllChatsFail(t *testing.T) {
	var callCount int32

	// Mock Telegram API server - all fail
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&callCount, 1)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ok":          false,
			"description": "Bad Request: chat not found",
		})
	}))
	defer server.Close()

	channel := &TelegramChannel{
		config: TelegramConfig{
			BotToken: "test-token",
			ChatIDs:  []string{"chat1", "chat2", "chat3"},
		},
		client:     server.Client(),
		apiBaseURL: server.URL + "/bot",
	}

	notification := Notification{
		Title:    "Test",
		Message:  "Test message",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	err := channel.Send(context.Background(), notification)

	require.Error(t, err)
	assert.Equal(t, int32(3), atomic.LoadInt32(&callCount))
}

func TestSend_PartialSuccess(t *testing.T) {
	var callCount int32

	// Mock Telegram API server - chat2 fails, others succeed
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&callCount, 1)

		var payload map[string]interface{}
		json.NewDecoder(r.Body).Decode(&payload)
		chatID := payload["chat_id"].(string)

		if chatID == "chat2" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"ok":          false,
				"description": "Bad Request: chat not found",
			})
		} else {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{"ok": true})
		}
	}))
	defer server.Close()

	channel := &TelegramChannel{
		config: TelegramConfig{
			BotToken: "test-token",
			ChatIDs:  []string{"chat1", "chat2", "chat3"},
		},
		client:     server.Client(),
		apiBaseURL: server.URL + "/bot",
	}

	notification := Notification{
		Title:    "Test",
		Message:  "Test message",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	err := channel.Send(context.Background(), notification)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "partial delivery")
	assert.Contains(t, err.Error(), "2/3 succeeded")
	assert.Contains(t, err.Error(), "chat2")
	assert.Equal(t, int32(3), atomic.LoadInt32(&callCount))
}

func TestSend_SingleChat(t *testing.T) {
	// Test backward compatibility with single chat
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{"ok": true})
	}))
	defer server.Close()

	channel := &TelegramChannel{
		config: TelegramConfig{
			BotToken: "test-token",
			ChatIDs:  []string{"single-chat"},
		},
		client:     server.Client(),
		apiBaseURL: server.URL + "/bot",
	}

	notification := Notification{
		Title:    "Test",
		Message:  "Test message",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	err := channel.Send(context.Background(), notification)

	assert.NoError(t, err)
}

// ========================================
// Test() Method Tests
// ========================================

func TestTest_ValidConfig(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{"ok": true})
	}))
	defer server.Close()

	channel := &TelegramChannel{
		client:     server.Client(),
		apiBaseURL: server.URL + "/bot",
	}

	config := map[string]interface{}{
		"bot_token": "test-token",
		"chat_ids":  []interface{}{"123456789"},
	}

	err := channel.Test(context.Background(), config)

	assert.NoError(t, err)
}

func TestTest_InvalidConfig(t *testing.T) {
	channel := &TelegramChannel{}

	config := map[string]interface{}{
		// Missing bot_token
		"chat_ids": []interface{}{"123456789"},
	}

	err := channel.Test(context.Background(), config)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "invalid Telegram configuration")
}
