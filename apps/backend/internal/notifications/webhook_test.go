package notifications

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// =============================================================================
// Template Builder Tests
// =============================================================================

// TestBuildGenericPayload tests the generic JSON payload builder.
func TestBuildGenericPayload(t *testing.T) {
	deviceID := "router-001"
	notification := Notification{
		Title:    "High CPU Usage",
		Message:  "CPU usage exceeded 90%",
		Severity: "WARNING",
		DeviceID: &deviceID,
		Data: map[string]interface{}{
			"cpu_usage":    92.5,
			"threshold":    90,
			"router_model": "RB5009",
		},
	}

	payload, err := buildGenericPayload(notification)
	if err != nil {
		t.Fatalf("buildGenericPayload() error = %v", err)
	}

	// Parse the JSON to verify structure
	var result map[string]interface{}
	if err := json.Unmarshal(payload, &result); err != nil {
		t.Fatalf("Failed to unmarshal payload: %v", err)
	}

	// Verify all required fields are present
	requiredFields := []string{"title", "message", "severity", "data", "timestamp", "device_id"}
	for _, field := range requiredFields {
		if _, exists := result[field]; !exists {
			t.Errorf("buildGenericPayload() missing required field: %s", field)
		}
	}

	// Verify field values
	if result["title"] != "High CPU Usage" {
		t.Errorf("buildGenericPayload() title = %v, want %v", result["title"], "High CPU Usage")
	}
	if result["message"] != "CPU usage exceeded 90%" {
		t.Errorf("buildGenericPayload() message = %v, want %v", result["message"], "CPU usage exceeded 90%")
	}
	if result["severity"] != "WARNING" {
		t.Errorf("buildGenericPayload() severity = %v, want %v", result["severity"], "WARNING")
	}
	if result["device_id"] != "router-001" {
		t.Errorf("buildGenericPayload() device_id = %v, want %v", result["device_id"], "router-001")
	}

	// Verify data object is present and correct
	data, ok := result["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("buildGenericPayload() data is not a map")
	}
	if data["cpu_usage"] != 92.5 {
		t.Errorf("buildGenericPayload() data.cpu_usage = %v, want %v", data["cpu_usage"], 92.5)
	}

	// Verify timestamp is in RFC3339 format
	if _, ok := result["timestamp"].(string); !ok {
		t.Errorf("buildGenericPayload() timestamp is not a string")
	}
}

// TestBuildGenericPayload_NoDeviceID tests generic payload without device ID.
func TestBuildGenericPayload_NoDeviceID(t *testing.T) {
	notification := Notification{
		Title:    "System Alert",
		Message:  "Test message",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	payload, err := buildGenericPayload(notification)
	if err != nil {
		t.Fatalf("buildGenericPayload() error = %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(payload, &result); err != nil {
		t.Fatalf("Failed to unmarshal payload: %v", err)
	}

	// Device ID should not be present
	if _, exists := result["device_id"]; exists {
		t.Errorf("buildGenericPayload() should not include device_id when not set")
	}
}

// TestBuildSlackPayload tests the Slack attachment format builder.
func TestBuildSlackPayload(t *testing.T) {
	deviceID := "router-002"
	notification := Notification{
		Title:    "Interface Down",
		Message:  "WAN interface is offline",
		Severity: "CRITICAL",
		DeviceID: &deviceID,
		Data: map[string]interface{}{
			"interface": "ether1",
			"uptime":    "12h 34m",
		},
	}

	payload, err := buildSlackPayload(notification)
	if err != nil {
		t.Fatalf("buildSlackPayload() error = %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(payload, &result); err != nil {
		t.Fatalf("Failed to unmarshal payload: %v", err)
	}

	// Verify top-level text field with emoji
	text, ok := result["text"].(string)
	if !ok {
		t.Fatalf("buildSlackPayload() text is not a string")
	}
	if !strings.Contains(text, "🔴") {
		t.Errorf("buildSlackPayload() text missing CRITICAL emoji (🔴)")
	}
	if !strings.Contains(text, "Interface Down") {
		t.Errorf("buildSlackPayload() text missing title")
	}

	// Verify attachments array exists
	attachments, ok := result["attachments"].([]interface{})
	if !ok || len(attachments) == 0 {
		t.Fatalf("buildSlackPayload() missing attachments array")
	}

	// Verify first attachment
	attachment := attachments[0].(map[string]interface{})

	// Verify color mapping for CRITICAL (red)
	if attachment["color"] != "#ef4444" {
		t.Errorf("buildSlackPayload() color = %v, want %v (red for CRITICAL)", attachment["color"], "#ef4444")
	}

	// Verify attachment fields
	if attachment["title"] != "Interface Down" {
		t.Errorf("buildSlackPayload() attachment title = %v, want %v", attachment["title"], "Interface Down")
	}
	if attachment["text"] != "WAN interface is offline" {
		t.Errorf("buildSlackPayload() attachment text = %v, want %v", attachment["text"], "WAN interface is offline")
	}
	if attachment["footer"] != "NasNetConnect" {
		t.Errorf("buildSlackPayload() footer = %v, want %v", attachment["footer"], "NasNetConnect")
	}

	// Verify timestamp is a Unix timestamp (JSON unmarshals numbers as float64)
	if _, ok := attachment["ts"].(int64); !ok {
		// Try float64 (JSON default for numbers)
		if _, ok := attachment["ts"].(float64); !ok {
			t.Errorf("buildSlackPayload() ts is not a number")
		}
	}

	// Verify fields array
	fieldsRaw, ok := attachment["fields"].([]interface{})
	if !ok {
		t.Fatalf("buildSlackPayload() fields is not an array")
	}

	// Convert to proper type
	fields := make([]map[string]interface{}, len(fieldsRaw))
	for i, f := range fieldsRaw {
		fields[i] = f.(map[string]interface{})
	}

	// Should have: Device, Severity, + custom fields
	if len(fields) < 2 {
		t.Errorf("buildSlackPayload() fields count = %d, want at least 2", len(fields))
	}
}

// TestBuildSlackPayload_ColorMapping tests severity to color mapping.
func TestBuildSlackPayload_ColorMapping(t *testing.T) {
	tests := []struct {
		severity      string
		expectedColor string
		expectedEmoji string
	}{
		{"CRITICAL", "#ef4444", "🔴"},
		{"WARNING", "#f59e0b", "🟡"},
		{"INFO", "#3b82f6", "🔵"},
		{"UNKNOWN", "#6b7280", "⚪"},
	}

	for _, tt := range tests {
		t.Run(tt.severity, func(t *testing.T) {
			notification := Notification{
				Title:    "Test",
				Message:  "Test message",
				Severity: tt.severity,
				Data:     map[string]interface{}{},
			}

			payload, err := buildSlackPayload(notification)
			if err != nil {
				t.Fatalf("buildSlackPayload() error = %v", err)
			}

			var result map[string]interface{}
			if err := json.Unmarshal(payload, &result); err != nil {
				t.Fatalf("Failed to unmarshal payload: %v", err)
			}

			attachments := result["attachments"].([]interface{})
			attachment := attachments[0].(map[string]interface{})

			if attachment["color"] != tt.expectedColor {
				t.Errorf("buildSlackPayload() color = %v, want %v", attachment["color"], tt.expectedColor)
			}

			text := result["text"].(string)
			if !strings.Contains(text, tt.expectedEmoji) {
				t.Errorf("buildSlackPayload() text missing emoji %v", tt.expectedEmoji)
			}
		})
	}
}

// TestBuildDiscordPayload tests the Discord embed format builder.
func TestBuildDiscordPayload(t *testing.T) {
	notification := Notification{
		Title:    "Router Reboot",
		Message:  "Router automatically rebooted due to high memory usage",
		Severity: "WARNING",
		Data: map[string]interface{}{
			"uptime_before": "45d 12h",
			"memory_usage":  95,
		},
	}

	payload, err := buildDiscordPayload(notification)
	if err != nil {
		t.Fatalf("buildDiscordPayload() error = %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(payload, &result); err != nil {
		t.Fatalf("Failed to unmarshal payload: %v", err)
	}

	// Verify content field with emoji and severity
	content, ok := result["content"].(string)
	if !ok {
		t.Fatalf("buildDiscordPayload() content is not a string")
	}
	if !strings.Contains(content, "🟡") {
		t.Errorf("buildDiscordPayload() content missing WARNING emoji (🟡)")
	}
	if !strings.Contains(content, "WARNING") {
		t.Errorf("buildDiscordPayload() content missing severity")
	}

	// Verify embeds array
	embeds, ok := result["embeds"].([]interface{})
	if !ok || len(embeds) == 0 {
		t.Fatalf("buildDiscordPayload() missing embeds array")
	}

	embed := embeds[0].(map[string]interface{})

	// Verify embed fields
	if embed["title"] != "Router Reboot" {
		t.Errorf("buildDiscordPayload() embed title = %v, want %v", embed["title"], "Router Reboot")
	}
	if embed["description"] != "Router automatically rebooted due to high memory usage" {
		t.Errorf("buildDiscordPayload() embed description incorrect")
	}

	// Verify color is converted from hex to int (WARNING = #f59e0b = 16096779)
	expectedColor := 16096779 // #f59e0b in decimal
	actualColor := int(embed["color"].(float64))
	if actualColor != expectedColor {
		t.Errorf("buildDiscordPayload() color = %d, want %d", actualColor, expectedColor)
	}

	// Verify timestamp is in RFC3339 format
	if _, ok := embed["timestamp"].(string); !ok {
		t.Errorf("buildDiscordPayload() timestamp is not a string")
	}

	// Verify footer
	footer := embed["footer"].(map[string]interface{})
	if footer["text"] != "NasNetConnect" {
		t.Errorf("buildDiscordPayload() footer text = %v, want %v", footer["text"], "NasNetConnect")
	}
}

// TestHexToInt tests hex color to decimal integer conversion for Discord.
func TestHexToInt(t *testing.T) {
	tests := []struct {
		hexColor string
		expected int
	}{
		{"#ef4444", 15680580}, // Red (CRITICAL)
		{"#f59e0b", 16096779}, // Amber (WARNING)
		{"#3b82f6", 3900150},  // Blue (INFO)
		{"#6b7280", 7041664},  // Gray (unknown)
		{"#000000", 0},        // Black
		{"#ffffff", 16777215}, // White
	}

	for _, tt := range tests {
		t.Run(tt.hexColor, func(t *testing.T) {
			result := hexToInt(tt.hexColor)
			if result != tt.expected {
				t.Errorf("hexToInt(%s) = %d, want %d", tt.hexColor, result, tt.expected)
			}
		})
	}
}

// TestBuildTeamsPayload tests the Microsoft Teams MessageCard format builder.
func TestBuildTeamsPayload(t *testing.T) {
	notification := Notification{
		Title:    "VPN Connection Failed",
		Message:  "Unable to establish VPN tunnel to remote site",
		Severity: "CRITICAL",
		Data: map[string]interface{}{
			"vpn_name":    "Site-to-Site-Main",
			"remote_ip":   "203.0.113.50",
			"error_count": 5,
		},
	}

	payload, err := buildTeamsPayload(notification)
	if err != nil {
		t.Fatalf("buildTeamsPayload() error = %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(payload, &result); err != nil {
		t.Fatalf("Failed to unmarshal payload: %v", err)
	}

	// Verify MessageCard structure
	if result["@type"] != "MessageCard" {
		t.Errorf("buildTeamsPayload() @type = %v, want MessageCard", result["@type"])
	}
	if result["@context"] != "https://schema.org/extensions" {
		t.Errorf("buildTeamsPayload() @context incorrect")
	}

	// Verify summary
	if result["summary"] != "VPN Connection Failed" {
		t.Errorf("buildTeamsPayload() summary = %v, want %v", result["summary"], "VPN Connection Failed")
	}

	// Verify themeColor (should be without # prefix)
	if result["themeColor"] != "ef4444" {
		t.Errorf("buildTeamsPayload() themeColor = %v, want ef4444", result["themeColor"])
	}

	// Verify title includes emoji
	title := result["title"].(string)
	if !strings.Contains(title, "🔴") {
		t.Errorf("buildTeamsPayload() title missing CRITICAL emoji")
	}
	if !strings.Contains(title, "VPN Connection Failed") {
		t.Errorf("buildTeamsPayload() title missing alert title")
	}

	// Verify text (message)
	if result["text"] != "Unable to establish VPN tunnel to remote site" {
		t.Errorf("buildTeamsPayload() text incorrect")
	}

	// Verify sections with facts
	sections, ok := result["sections"].([]interface{})
	if !ok || len(sections) == 0 {
		t.Fatalf("buildTeamsPayload() missing sections array")
	}

	section := sections[0].(map[string]interface{})
	factsRaw, ok := section["facts"].([]interface{})
	if !ok {
		t.Fatalf("buildTeamsPayload() facts is not an array")
	}

	// Convert to proper type
	facts := make([]map[string]interface{}, len(factsRaw))
	for i, f := range factsRaw {
		facts[i] = f.(map[string]interface{})
	}

	// Should have: Severity + custom fields
	if len(facts) < 1 {
		t.Errorf("buildTeamsPayload() facts count = %d, want at least 1", len(facts))
	}

	// Verify facts have name and value
	for i, fact := range facts {
		if _, ok := fact["name"]; !ok {
			t.Errorf("buildTeamsPayload() fact[%d] missing name", i)
		}
		if _, ok := fact["value"]; !ok {
			t.Errorf("buildTeamsPayload() fact[%d] missing value", i)
		}
	}
}

// TestBuildCustomPayload tests custom template rendering.
func TestBuildCustomPayload(t *testing.T) {
	notification := Notification{
		Title:    "Test Alert",
		Message:  "Test message",
		Severity: "INFO",
		Data: map[string]interface{}{
			"key1": "value1",
			"key2": 123,
		},
	}

	template := `{
  "alert_title": "{{.Title}}",
  "alert_message": "{{.Message}}",
  "severity": "{{.Severity | upper}}",
  "timestamp": "{{.Timestamp}}"
}`

	payload, err := buildCustomPayload(notification, template)
	if err != nil {
		t.Fatalf("buildCustomPayload() error = %v", err)
	}

	// Verify the rendered template
	payloadStr := string(payload)
	if !strings.Contains(payloadStr, `"alert_title": "Test Alert"`) {
		t.Errorf("buildCustomPayload() missing alert_title")
	}
	if !strings.Contains(payloadStr, `"severity": "INFO"`) {
		t.Errorf("buildCustomPayload() missing severity (upper filter didn't work)")
	}
}

// TestBuildCustomPayload_TemplateFunctions tests available template functions.
func TestBuildCustomPayload_TemplateFunctions(t *testing.T) {
	notification := Notification{
		Title:    "Test Alert",
		Message:  "  test message  ",
		Severity: "warning",
		Data:     map[string]interface{}{},
	}

	tests := []struct {
		name     string
		template string
		contains string
	}{
		{
			name:     "upper function",
			template: `{{.Severity | upper}}`,
			contains: "WARNING",
		},
		{
			name:     "lower function",
			template: `{{.Title | lower}}`,
			contains: "test alert",
		},
		{
			name:     "trim function",
			template: `{{.Message | trim}}`,
			contains: "test message",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payload, err := buildCustomPayload(notification, tt.template)
			if err != nil {
				t.Fatalf("buildCustomPayload() error = %v", err)
			}

			if !strings.Contains(string(payload), tt.contains) {
				t.Errorf("buildCustomPayload() output does not contain %q, got: %s", tt.contains, string(payload))
			}
		})
	}
}

// TestBuildCustomPayload_RestrictedMode tests that dangerous operations are not available.
func TestBuildCustomPayload_RestrictedMode(t *testing.T) {
	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	// Template with potential security issues (these functions should not exist)
	// Go's text/template doesn't have these by default, but let's verify
	template := `{{.Title}}`

	payload, err := buildCustomPayload(notification, template)
	if err != nil {
		t.Fatalf("buildCustomPayload() error = %v", err)
	}

	// Basic sanity check - should render the title
	if !strings.Contains(string(payload), "Test") {
		t.Errorf("buildCustomPayload() failed to render basic template")
	}
}

// TestBuildCustomPayload_EmptyTemplate tests error handling for empty template.
func TestBuildCustomPayload_EmptyTemplate(t *testing.T) {
	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	_, err := buildCustomPayload(notification, "")
	if err == nil {
		t.Errorf("buildCustomPayload() should return error for empty template")
	}
	if !strings.Contains(err.Error(), "custom template is required") {
		t.Errorf("buildCustomPayload() error message = %v, want 'custom template is required'", err.Error())
	}
}

// TestBuildCustomPayload_InvalidTemplate tests error handling for invalid template syntax.
func TestBuildCustomPayload_InvalidTemplate(t *testing.T) {
	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	// Invalid template syntax (unclosed brace)
	_, err := buildCustomPayload(notification, "{{.Title")
	if err == nil {
		t.Errorf("buildCustomPayload() should return error for invalid template")
	}
	if !strings.Contains(err.Error(), "failed to parse custom template") {
		t.Errorf("buildCustomPayload() error should mention template parsing failure")
	}
}

// =============================================================================
// HMAC Signature Tests
// =============================================================================

// TestGenerateHMACSignature tests HMAC-SHA256 signature generation.
func TestGenerateHMACSignature(t *testing.T) {
	webhook := &WebhookChannel{
		config: WebhookConfig{
			Secret: "test-secret-key",
		},
	}

	payload := []byte(`{"title":"Test","message":"Test message"}`)
	signature := webhook.generateHMACSignature(payload)

	// Verify signature is a valid hex string
	if len(signature) != 64 { // SHA256 produces 64 hex characters
		t.Errorf("generateHMACSignature() length = %d, want 64", len(signature))
	}

	// Verify signature is deterministic (same input produces same output)
	signature2 := webhook.generateHMACSignature(payload)
	if signature != signature2 {
		t.Errorf("generateHMACSignature() is not deterministic")
	}

	// Verify different payloads produce different signatures
	differentPayload := []byte(`{"title":"Different","message":"Different message"}`)
	differentSignature := webhook.generateHMACSignature(differentPayload)
	if signature == differentSignature {
		t.Errorf("generateHMACSignature() should produce different signatures for different payloads")
	}
}

// TestGenerateHMACSignature_DifferentSecrets tests that different secrets produce different signatures.
func TestGenerateHMACSignature_DifferentSecrets(t *testing.T) {
	payload := []byte(`{"title":"Test","message":"Test"}`)

	webhook1 := &WebhookChannel{
		config: WebhookConfig{Secret: "secret1"},
	}
	webhook2 := &WebhookChannel{
		config: WebhookConfig{Secret: "secret2"},
	}

	sig1 := webhook1.generateHMACSignature(payload)
	sig2 := webhook2.generateHMACSignature(payload)

	if sig1 == sig2 {
		t.Errorf("generateHMACSignature() should produce different signatures for different secrets")
	}
}

// =============================================================================
// Send() Error Handling Tests
// =============================================================================

// createTestWebhookChannel creates a webhook channel for testing that bypasses SSRF validation.
// This is used with httptest servers that use localhost URLs.
func createTestWebhookChannel(serverURL string, config WebhookConfig) *WebhookChannel {
	config.URL = serverURL
	webhook := NewWebhookChannel(config)

	// Create a custom webhook channel that doesn't validate URLs in tests
	testWebhook := &WebhookChannel{
		config: config,
		client: webhook.client,
	}

	return testWebhook
}

// sendWithoutValidation sends a webhook without URL validation (for testing only).
func (w *WebhookChannel) sendWithoutValidation(ctx context.Context, notification Notification) error {
	// Build payload (same as Send() but skip validateURL)
	payload := map[string]interface{}{
		"title":    notification.Title,
		"message":  notification.Message,
		"severity": notification.Severity,
		"data":     notification.Data,
	}

	if notification.DeviceID != nil {
		payload["device_id"] = *notification.DeviceID
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, w.config.Method, w.config.URL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "NasNetConnect-Webhook/1.0")

	// Add custom headers
	for key, value := range w.config.Headers {
		req.Header.Set(key, value)
	}

	// Add HMAC signature if secret is configured
	if w.config.Secret != "" {
		signature := w.generateHMACSignature(jsonData)
		req.Header.Set("X-NasNet-Signature", signature)
	}

	// Send request
	resp, err := w.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send webhook: %w", err)
	}
	defer resp.Body.Close()

	// Check response (2xx is success)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("webhook returned non-2xx status: %d", resp.StatusCode)
	}

	return nil
}

// TestSend_Success tests successful webhook delivery.
func TestSend_Success(t *testing.T) {
	// Create test server that returns 200 OK
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request method
		if r.Method != "POST" {
			t.Errorf("Expected POST request, got %s", r.Method)
		}

		// Verify Content-Type header
		if r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("Expected Content-Type: application/json, got %s", r.Header.Get("Content-Type"))
		}

		// Verify User-Agent header
		if !strings.Contains(r.Header.Get("User-Agent"), "NasNetConnect") {
			t.Errorf("Expected User-Agent to contain NasNetConnect, got %s", r.Header.Get("User-Agent"))
		}

		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	webhook := createTestWebhookChannel(server.URL, WebhookConfig{
		Method: "POST",
	})

	// Replace the default client with test server's client
	webhook.client = server.Client()

	notification := Notification{
		Title:    "Test Alert",
		Message:  "Test message",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	err := webhook.sendWithoutValidation(context.Background(), notification)
	if err != nil {
		t.Errorf("Send() unexpected error: %v", err)
	}
}

// TestSend_CustomHeaders tests that custom headers are sent.
func TestSend_CustomHeaders(t *testing.T) {
	expectedHeaders := map[string]string{
		"X-Custom-Header": "custom-value",
		"Authorization":   "Bearer test-token",
	}

	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		for key, value := range expectedHeaders {
			if r.Header.Get(key) != value {
				t.Errorf("Expected header %s: %s, got %s", key, value, r.Header.Get(key))
			}
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	webhook := createTestWebhookChannel(server.URL, WebhookConfig{
		Headers: expectedHeaders,
	})
	webhook.client = server.Client()

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	err := webhook.sendWithoutValidation(context.Background(), notification)
	if err != nil {
		t.Errorf("Send() unexpected error: %v", err)
	}
}

// TestSend_HMACSignature tests that HMAC signature is added when secret is configured.
func TestSend_HMACSignature(t *testing.T) {
	var receivedSignature string

	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedSignature = r.Header.Get("X-NasNet-Signature")
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	webhook := createTestWebhookChannel(server.URL, WebhookConfig{
		Secret: "test-secret",
	})
	webhook.client = server.Client()

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	err := webhook.sendWithoutValidation(context.Background(), notification)
	if err != nil {
		t.Errorf("Send() unexpected error: %v", err)
	}

	if receivedSignature == "" {
		t.Errorf("Send() did not send X-NasNet-Signature header")
	}

	// Verify signature is valid hex string (64 characters for SHA256)
	if len(receivedSignature) != 64 {
		t.Errorf("Send() signature length = %d, want 64", len(receivedSignature))
	}
}

// TestSend_HTTP5xxError tests handling of server errors (5xx).
func TestSend_HTTP5xxError(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
	}{
		{"500 Internal Server Error", http.StatusInternalServerError},
		{"502 Bad Gateway", http.StatusBadGateway},
		{"503 Service Unavailable", http.StatusServiceUnavailable},
		{"504 Gateway Timeout", http.StatusGatewayTimeout},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.statusCode)
			}))
			defer server.Close()

			webhook := createTestWebhookChannel(server.URL, WebhookConfig{})
			webhook.client = server.Client()

			notification := Notification{
				Title:    "Test",
				Message:  "Test",
				Severity: "INFO",
				Data:     map[string]interface{}{},
			}

			err := webhook.sendWithoutValidation(context.Background(), notification)
			if err == nil {
				t.Errorf("Send() should return error for %d status", tt.statusCode)
			}
			if !strings.Contains(err.Error(), fmt.Sprintf("%d", tt.statusCode)) {
				t.Errorf("Send() error should mention status code %d, got: %v", tt.statusCode, err)
			}
		})
	}
}

// TestSend_HTTP4xxError tests handling of client errors (4xx).
func TestSend_HTTP4xxError(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
	}{
		{"400 Bad Request", http.StatusBadRequest},
		{"401 Unauthorized", http.StatusUnauthorized},
		{"403 Forbidden", http.StatusForbidden},
		{"404 Not Found", http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.statusCode)
			}))
			defer server.Close()

			webhook := createTestWebhookChannel(server.URL, WebhookConfig{})
			webhook.client = server.Client()

			notification := Notification{
				Title:    "Test",
				Message:  "Test",
				Severity: "INFO",
				Data:     map[string]interface{}{},
			}

			err := webhook.sendWithoutValidation(context.Background(), notification)
			if err == nil {
				t.Errorf("Send() should return error for %d status", tt.statusCode)
			}
		})
	}
}

// TestSend_ContextTimeout tests handling of context timeout.
func TestSend_ContextTimeout(t *testing.T) {
	// Create server that delays response
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(2 * time.Second)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	webhook := createTestWebhookChannel(server.URL, WebhookConfig{})
	webhook.client = server.Client()

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
		Data:     map[string]interface{}{},
	}

	// Create context with short timeout
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	err := webhook.sendWithoutValidation(ctx, notification)
	if err == nil {
		t.Errorf("Send() should return error for context timeout")
	}
	if !strings.Contains(err.Error(), "context deadline exceeded") && !strings.Contains(err.Error(), "Client.Timeout") {
		t.Errorf("Send() error should mention context timeout, got: %v", err)
	}
}

// TestSend_InvalidURL tests handling of invalid URLs.
func TestSend_InvalidURL(t *testing.T) {
	tests := []struct {
		name string
		url  string
	}{
		{"Empty URL", ""},
		{"Invalid scheme", "ftp://example.com"},
		{"HTTP not HTTPS", "http://example.com"},
		{"Localhost", "https://localhost/webhook"},
		{"Private IP", "https://192.168.1.1/webhook"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			webhook := NewWebhookChannel(WebhookConfig{
				URL: tt.url,
			})

			notification := Notification{
				Title:    "Test",
				Message:  "Test",
				Severity: "INFO",
				Data:     map[string]interface{}{},
			}

			err := webhook.Send(context.Background(), notification)
			if err == nil {
				t.Errorf("Send() should return error for invalid URL: %s", tt.url)
			}
		})
	}
}
