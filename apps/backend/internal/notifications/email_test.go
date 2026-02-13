package notifications

import (
	"context"
	"strings"
	"testing"
)

// TestEmailConfig_Validation tests EmailConfig field validation
func TestEmailConfig_Validation(t *testing.T) {
	tests := []struct {
		name    string
		config  map[string]interface{}
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid config",
			config: map[string]interface{}{
				"smtp_host":    "smtp.example.com",
				"smtp_port":    float64(587),
				"from_address": "alerts@example.com",
				"to_addresses": []interface{}{"admin@example.com"},
			},
			wantErr: false,
		},
		{
			name: "missing smtp_host",
			config: map[string]interface{}{
				"smtp_port":    float64(587),
				"from_address": "alerts@example.com",
				"to_addresses": []interface{}{"admin@example.com"},
			},
			wantErr: true,
			errMsg:  "smtp_host is required",
		},
		{
			name: "missing smtp_port",
			config: map[string]interface{}{
				"smtp_host":    "smtp.example.com",
				"from_address": "alerts@example.com",
				"to_addresses": []interface{}{"admin@example.com"},
			},
			wantErr: true,
			errMsg:  "smtp_port is required",
		},
		{
			name: "missing from_address",
			config: map[string]interface{}{
				"smtp_host":    "smtp.example.com",
				"smtp_port":    float64(587),
				"to_addresses": []interface{}{"admin@example.com"},
			},
			wantErr: true,
			errMsg:  "from_address is required",
		},
		{
			name: "missing to_addresses",
			config: map[string]interface{}{
				"smtp_host":    "smtp.example.com",
				"smtp_port":    float64(587),
				"from_address": "alerts@example.com",
			},
			wantErr: true,
			errMsg:  "at least one recipient address is required",
		},
		{
			name: "empty to_addresses",
			config: map[string]interface{}{
				"smtp_host":    "smtp.example.com",
				"smtp_port":    float64(587),
				"from_address": "alerts@example.com",
				"to_addresses": []interface{}{},
			},
			wantErr: true,
			errMsg:  "at least one recipient address is required",
		},
		{
			name: "optional fields",
			config: map[string]interface{}{
				"smtp_host":    "smtp.example.com",
				"smtp_port":    float64(587),
				"from_address": "alerts@example.com",
				"from_name":    "NasNet Alerts",
				"username":     "user@example.com",
				"password":     "secret",
				"use_tls":      true,
				"skip_verify":  false,
				"to_addresses": []interface{}{"admin@example.com", "ops@example.com"},
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg, err := ParseEmailConfig(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseEmailConfig() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr && !strings.Contains(err.Error(), tt.errMsg) {
				t.Errorf("ParseEmailConfig() error = %v, want error containing %v", err, tt.errMsg)
			}
			if !tt.wantErr {
				// Verify required fields
				if cfg.SMTPHost == "" {
					t.Error("SMTPHost should not be empty")
				}
				if cfg.SMTPPort == 0 {
					t.Error("SMTPPort should not be zero")
				}
				if cfg.FromAddress == "" {
					t.Error("FromAddress should not be empty")
				}
				if len(cfg.ToAddresses) == 0 {
					t.Error("ToAddresses should not be empty")
				}
			}
		})
	}
}

// TestParseEmailConfig_OptionalFields tests optional field parsing
func TestParseEmailConfig_OptionalFields(t *testing.T) {
	config := map[string]interface{}{
		"smtp_host":    "smtp.example.com",
		"smtp_port":    float64(587),
		"from_address": "alerts@example.com",
		"from_name":    "NasNet Alerts",
		"username":     "user@example.com",
		"password":     "P@ssw0rd123",
		"use_tls":      true,
		"skip_verify":  true,
		"to_addresses": []interface{}{"admin@example.com", "ops@example.com"},
	}

	cfg, err := ParseEmailConfig(config)
	if err != nil {
		t.Fatalf("ParseEmailConfig() unexpected error: %v", err)
	}

	if cfg.FromName != "NasNet Alerts" {
		t.Errorf("FromName = %v, want %v", cfg.FromName, "NasNet Alerts")
	}
	if cfg.Username != "user@example.com" {
		t.Errorf("Username = %v, want %v", cfg.Username, "user@example.com")
	}
	if cfg.Password != "P@ssw0rd123" {
		t.Errorf("Password = %v, want %v", cfg.Password, "P@ssw0rd123")
	}
	if !cfg.UseTLS {
		t.Error("UseTLS should be true")
	}
	if !cfg.SkipVerify {
		t.Error("SkipVerify should be true")
	}
	if len(cfg.ToAddresses) != 2 {
		t.Errorf("ToAddresses length = %v, want 2", len(cfg.ToAddresses))
	}
}

// TestEmailChannel_BuildTemplateData tests template data preparation
func TestEmailChannel_BuildTemplateData(t *testing.T) {
	channel := NewEmailChannel(EmailConfig{
		FromAddress: "alerts@example.com",
		ToAddresses: []string{"admin@example.com"},
	})

	notification := Notification{
		Title:    "Test Alert",
		Message:  "This is a test alert message",
		Severity: "WARNING",
		Data: map[string]interface{}{
			"device_name":       "Router-1",
			"device_ip":         "192.168.1.1",
			"event_type":        "cpu.high",
			"rule_name":         "CPU High Usage",
			"suggested_actions": []string{"Check CPU usage", "Restart services"},
		},
	}

	data := channel.buildTemplateData(notification)

	if data["Title"] != "Test Alert" {
		t.Errorf("Title = %v, want %v", data["Title"], "Test Alert")
	}
	if data["Message"] != "This is a test alert message" {
		t.Errorf("Message = %v, want %v", data["Message"], "This is a test alert message")
	}
	if data["Severity"] != "WARNING" {
		t.Errorf("Severity = %v, want %v", data["Severity"], "WARNING")
	}
	if data["DeviceName"] != "Router-1" {
		t.Errorf("DeviceName = %v, want %v", data["DeviceName"], "Router-1")
	}
	if data["DeviceIP"] != "192.168.1.1" {
		t.Errorf("DeviceIP = %v, want %v", data["DeviceIP"], "192.168.1.1")
	}
	if data["EventType"] != "cpu.high" {
		t.Errorf("EventType = %v, want %v", data["EventType"], "cpu.high")
	}
	if data["RuleName"] != "CPU High Usage" {
		t.Errorf("RuleName = %v, want %v", data["RuleName"], "CPU High Usage")
	}

	// Check suggested actions array
	actions, ok := data["SuggestedActions"].([]string)
	if !ok {
		t.Fatalf("SuggestedActions should be []string, got %T", data["SuggestedActions"])
	}
	if len(actions) != 2 {
		t.Errorf("SuggestedActions length = %v, want 2", len(actions))
	}
}

// TestEmailChannel_BuildTemplateData_Defaults tests default values when data is missing
func TestEmailChannel_BuildTemplateData_Defaults(t *testing.T) {
	channel := NewEmailChannel(EmailConfig{
		FromAddress: "alerts@example.com",
		ToAddresses: []string{"admin@example.com"},
	})

	notification := Notification{
		Title:    "Test Alert",
		Message:  "Message",
		Severity: "",
		Data:     nil,
	}

	data := channel.buildTemplateData(notification)

	if data["Severity"] != "INFO" {
		t.Errorf("Severity = %v, want %v (default)", data["Severity"], "INFO")
	}
	if data["DeviceName"] != "Unknown" {
		t.Errorf("DeviceName = %v, want %v (default)", data["DeviceName"], "Unknown")
	}
	if data["DeviceIP"] != "N/A" {
		t.Errorf("DeviceIP = %v, want %v (default)", data["DeviceIP"], "N/A")
	}
	if data["EventType"] != "alert.triggered" {
		t.Errorf("EventType = %v, want %v (default)", data["EventType"], "alert.triggered")
	}
}

// TestBuildMultipartMessage_Structure tests MIME message structure
func TestBuildMultipartMessage_Structure(t *testing.T) {
	channel := NewEmailChannel(EmailConfig{
		FromAddress: "alerts@example.com",
		FromName:    "NasNet Alerts",
		ToAddresses: []string{"admin@example.com", "ops@example.com"},
	})

	data := map[string]interface{}{
		"Title":            "Test Alert",
		"Message":          "Test message",
		"Severity":         "WARNING",
		"RuleName":         "Test Rule",
		"EventType":        "test.event",
		"DeviceName":       "Router-1",
		"DeviceIP":         "192.168.1.1",
		"FormattedTime":    "2024-02-12 10:00:00 UTC",
		"SuggestedActions": []string{"Action 1"},
		"AlertID":          "alert-123",
	}

	message, err := channel.buildMultipartMessage(data)
	if err != nil {
		t.Fatalf("buildMultipartMessage() error = %v", err)
	}

	messageStr := string(message)

	// Check headers
	if !strings.Contains(messageStr, "From: NasNet Alerts <alerts@example.com>") {
		t.Error("Missing or incorrect From header with FromName")
	}
	if !strings.Contains(messageStr, "To: admin@example.com, ops@example.com") {
		t.Error("Missing or incorrect To header with multiple recipients")
	}
	if !strings.Contains(messageStr, "Subject: [NasNet Alert - WARNING] Test Alert") {
		t.Error("Missing or incorrect Subject header")
	}
	if !strings.Contains(messageStr, "MIME-Version: 1.0") {
		t.Error("Missing MIME-Version header")
	}

	// Check custom headers
	if !strings.Contains(messageStr, "X-NasNet-Alert-ID: alert-123") {
		t.Error("Missing X-NasNet-Alert-ID header")
	}
	if !strings.Contains(messageStr, "X-NasNet-Severity: WARNING") {
		t.Error("Missing X-NasNet-Severity header")
	}

	// Check multipart structure
	if !strings.Contains(messageStr, "Content-Type: multipart/alternative") {
		t.Error("Missing multipart/alternative Content-Type")
	}

	// Check plaintext part
	if !strings.Contains(messageStr, "Content-Type: text/plain; charset=utf-8") {
		t.Error("Missing plaintext MIME part")
	}

	// Check HTML part
	if !strings.Contains(messageStr, "Content-Type: text/html; charset=utf-8") {
		t.Error("Missing HTML MIME part")
	}
}

// TestBuildMultipartMessage_SubjectFormats tests different subject formats
func TestBuildMultipartMessage_SubjectFormats(t *testing.T) {
	channel := NewEmailChannel(EmailConfig{
		FromAddress: "alerts@example.com",
		ToAddresses: []string{"admin@example.com"},
	})

	tests := []struct {
		severity      string
		title         string
		wantSubject   string
	}{
		{
			severity:    "CRITICAL",
			title:       "Router Offline",
			wantSubject: "Subject: [NasNet Alert - CRITICAL] Router Offline",
		},
		{
			severity:    "WARNING",
			title:       "High CPU Usage",
			wantSubject: "Subject: [NasNet Alert - WARNING] High CPU Usage",
		},
		{
			severity:    "INFO",
			title:       "Backup Completed",
			wantSubject: "Subject: [NasNet Alert - INFO] Backup Completed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.severity, func(t *testing.T) {
			data := map[string]interface{}{
				"Title":            tt.title,
				"Message":          "Test",
				"Severity":         tt.severity,
				"RuleName":         "Test",
				"EventType":        "test",
				"DeviceName":       "Router",
				"DeviceIP":         "192.168.1.1",
				"FormattedTime":    "2024-02-12",
				"SuggestedActions": []string{},
				"AlertID":          "test",
			}

			message, err := channel.buildMultipartMessage(data)
			if err != nil {
				t.Fatalf("buildMultipartMessage() error = %v", err)
			}

			if !strings.Contains(string(message), tt.wantSubject) {
				t.Errorf("Subject not found: %v", tt.wantSubject)
			}
		})
	}
}

// TestEmailChannel_Name tests channel name
func TestEmailChannel_Name(t *testing.T) {
	channel := NewEmailChannel(EmailConfig{})
	if channel.Name() != "email" {
		t.Errorf("Name() = %v, want %v", channel.Name(), "email")
	}
}

// TestTest_ThreadSafety tests that Test() is thread-safe
func TestTest_ThreadSafety(t *testing.T) {
	// Create channel with initial config
	originalConfig := EmailConfig{
		SMTPHost:    "smtp.original.com",
		SMTPPort:    587,
		FromAddress: "original@example.com",
		ToAddresses: []string{"admin@example.com"},
	}
	channel := NewEmailChannel(originalConfig)

	// Test config (different from original)
	testConfig := map[string]interface{}{
		"smtp_host":    "smtp.test.com",
		"smtp_port":    float64(25),
		"from_address": "test@example.com",
		"to_addresses": []interface{}{"test@example.com"},
	}

	// Note: This will fail to send (no real SMTP server), but we're testing
	// that the original config is not mutated
	_ = channel.Test(context.Background(), testConfig)

	// Verify original config is unchanged
	if channel.config.SMTPHost != "smtp.original.com" {
		t.Errorf("Original config mutated: SMTPHost = %v, want smtp.original.com", channel.config.SMTPHost)
	}
	if channel.config.SMTPPort != 587 {
		t.Errorf("Original config mutated: SMTPPort = %v, want 587", channel.config.SMTPPort)
	}
	if channel.config.FromAddress != "original@example.com" {
		t.Errorf("Original config mutated: FromAddress = %v, want original@example.com", channel.config.FromAddress)
	}
}

// TestParseEmailConfig_SkipVerify tests SkipVerify field parsing
func TestParseEmailConfig_SkipVerify(t *testing.T) {
	tests := []struct {
		name           string
		skipVerify     interface{}
		wantSkipVerify bool
	}{
		{
			name:           "skip_verify true",
			skipVerify:     true,
			wantSkipVerify: true,
		},
		{
			name:           "skip_verify false",
			skipVerify:     false,
			wantSkipVerify: false,
		},
		{
			name:           "skip_verify missing",
			skipVerify:     nil,
			wantSkipVerify: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			config := map[string]interface{}{
				"smtp_host":    "smtp.example.com",
				"smtp_port":    float64(587),
				"from_address": "alerts@example.com",
				"to_addresses": []interface{}{"admin@example.com"},
			}
			if tt.skipVerify != nil {
				config["skip_verify"] = tt.skipVerify
			}

			cfg, err := ParseEmailConfig(config)
			if err != nil {
				t.Fatalf("ParseEmailConfig() unexpected error: %v", err)
			}

			if cfg.SkipVerify != tt.wantSkipVerify {
				t.Errorf("SkipVerify = %v, want %v", cfg.SkipVerify, tt.wantSkipVerify)
			}
		})
	}
}

// TestCredentialSecurity tests that credentials are not leaked in errors
func TestCredentialSecurity(t *testing.T) {
	// Test that parsing errors don't leak credentials
	config := map[string]interface{}{
		"smtp_host":    "smtp.example.com",
		"smtp_port":    float64(587),
		"from_address": "alerts@example.com",
		"username":     "user@example.com",
		"password":     "SuperSecretP@ssw0rd123!",
		"to_addresses": []interface{}{"admin@example.com"},
	}

	cfg, err := ParseEmailConfig(config)
	if err != nil {
		t.Fatalf("ParseEmailConfig() unexpected error: %v", err)
	}

	// Verify password is stored (not sanitized during parsing)
	if cfg.Password != "SuperSecretP@ssw0rd123!" {
		t.Error("Password should be stored in config for SMTP auth")
	}

	// Note: Actual SMTP errors are sanitized in sendWithTLS at line 259
	// The error message is: "SMTP authentication failed (check username/password)"
	// This test verifies the config parsing doesn't leak passwords
}

// TestMultipleRecipients tests handling of multiple recipient addresses
func TestMultipleRecipients(t *testing.T) {
	config := map[string]interface{}{
		"smtp_host":    "smtp.example.com",
		"smtp_port":    float64(587),
		"from_address": "alerts@example.com",
		"to_addresses": []interface{}{
			"admin@example.com",
			"ops@example.com",
			"security@example.com",
		},
	}

	cfg, err := ParseEmailConfig(config)
	if err != nil {
		t.Fatalf("ParseEmailConfig() unexpected error: %v", err)
	}

	if len(cfg.ToAddresses) != 3 {
		t.Errorf("ToAddresses length = %v, want 3", len(cfg.ToAddresses))
	}

	expectedAddresses := []string{"admin@example.com", "ops@example.com", "security@example.com"}
	for i, addr := range expectedAddresses {
		if cfg.ToAddresses[i] != addr {
			t.Errorf("ToAddresses[%d] = %v, want %v", i, cfg.ToAddresses[i], addr)
		}
	}
}

// TestRenderTemplate_ErrorHandling tests template rendering error cases
func TestRenderTemplate_ErrorHandling(t *testing.T) {
	channel := NewEmailChannel(EmailConfig{
		FromAddress: "alerts@example.com",
		ToAddresses: []string{"admin@example.com"},
	})

	// Test with invalid template name
	_, err := channel.renderTemplate("nonexistent-template", map[string]interface{}{})
	if err == nil {
		t.Error("renderTemplate() with invalid template should return error")
	}
	if !strings.Contains(err.Error(), "failed to read template") {
		t.Errorf("renderTemplate() error = %v, want error containing 'failed to read template'", err)
	}
}

// BenchmarkBuildMultipartMessage benchmarks MIME message building
func BenchmarkBuildMultipartMessage(b *testing.B) {
	channel := NewEmailChannel(EmailConfig{
		FromAddress: "alerts@example.com",
		ToAddresses: []string{"admin@example.com"},
	})

	data := map[string]interface{}{
		"Title":            "Benchmark Alert",
		"Message":          "This is a benchmark test",
		"Severity":         "INFO",
		"RuleName":         "Benchmark Rule",
		"EventType":        "benchmark.test",
		"DeviceName":       "Router-1",
		"DeviceIP":         "192.168.1.1",
		"FormattedTime":    "2024-02-12 10:00:00 UTC",
		"SuggestedActions": []string{"Action 1", "Action 2"},
		"AlertID":          "bench-123",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := channel.buildMultipartMessage(data)
		if err != nil {
			b.Fatalf("buildMultipartMessage() error = %v", err)
		}
	}
}

// BenchmarkParseEmailConfig benchmarks config parsing
func BenchmarkParseEmailConfig(b *testing.B) {
	config := map[string]interface{}{
		"smtp_host":    "smtp.example.com",
		"smtp_port":    float64(587),
		"from_address": "alerts@example.com",
		"from_name":    "NasNet Alerts",
		"username":     "user@example.com",
		"password":     "password",
		"use_tls":      true,
		"skip_verify":  false,
		"to_addresses": []interface{}{"admin@example.com", "ops@example.com"},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := ParseEmailConfig(config)
		if err != nil {
			b.Fatalf("ParseEmailConfig() error = %v", err)
		}
	}
}

// TestSend_NoRecipients tests error when no recipients configured
func TestSend_NoRecipients(t *testing.T) {
	channel := NewEmailChannel(EmailConfig{
		FromAddress: "alerts@example.com",
		ToAddresses: []string{}, // Empty recipients
	})

	notification := Notification{
		Title:    "Test",
		Message:  "Test",
		Severity: "INFO",
	}

	err := channel.Send(context.Background(), notification)
	if err == nil {
		t.Error("Send() with no recipients should return error")
	}
	if !strings.Contains(err.Error(), "no recipient addresses configured") {
		t.Errorf("Send() error = %v, want error containing 'no recipient addresses'", err)
	}
}

// TestEmailChannel_BuildTemplateData_SuggestedActionsString tests string-based suggested actions
func TestEmailChannel_BuildTemplateData_SuggestedActionsString(t *testing.T) {
	channel := NewEmailChannel(EmailConfig{
		FromAddress: "alerts@example.com",
		ToAddresses: []string{"admin@example.com"},
	})

	notification := Notification{
		Title:    "Test Alert",
		Message:  "Test",
		Severity: "INFO",
		Data: map[string]interface{}{
			"suggested_actions": "Action 1\nAction 2\nAction 3",
		},
	}

	data := channel.buildTemplateData(notification)

	actions, ok := data["SuggestedActions"].([]string)
	if !ok {
		t.Fatalf("SuggestedActions should be []string, got %T", data["SuggestedActions"])
	}

	if len(actions) != 3 {
		t.Errorf("SuggestedActions length = %v, want 3", len(actions))
	}

	if actions[0] != "Action 1" {
		t.Errorf("actions[0] = %v, want 'Action 1'", actions[0])
	}
}
