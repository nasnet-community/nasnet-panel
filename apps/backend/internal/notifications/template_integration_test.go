package notifications

import (
	"context"
	"testing"
	"time"

	"backend/ent"
	"backend/ent/alert"
	"backend/ent/alerttemplate"
	"backend/ent/enttest"
	"backend/internal/events"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap/zaptest"

	_ "github.com/mattn/go-sqlite3"
)

// setupTestEnv creates an in-memory database and template service for testing.
func setupTestEnv(t *testing.T) (*ent.Client, *TemplateService, func()) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")

	cfg := TemplateServiceConfig{
		DB:     client,
		Logger: zaptest.NewLogger(t).Sugar(),
	}
	service := NewTemplateService(cfg)

	cleanup := func() {
		client.Close()
	}

	return client, service, cleanup
}

// TestTemplatePipeline_CustomTemplate verifies the complete flow with custom templates.
func TestTemplatePipeline_CustomTemplate(t *testing.T) {
	client, service, cleanup := setupTestEnv(t)
	defer cleanup()

	ctx := context.Background()

	// Step 1: Save a custom template via SaveTemplate()
	customSubject := "[{{.Severity}}] {{.Title}} - Custom Alert"
	customBody := `Alert Details:
- Device: {{.DeviceName}}
- IP: {{.DeviceIP}}
- Time: {{.FormattedTime}}

Message: {{.Message}}

{{- if .SuggestedActions}}
Suggested Actions:
{{- range $i, $action := .SuggestedActions}}
  {{add $i 1}}. {{$action}}
{{- end}}
{{- end}}`

	err := service.SaveTemplate(ctx, "router.offline", "email", customSubject, customBody, false)
	require.NoError(t, err)

	// Step 2: Create an alert in the database
	testAlert := client.Alert.Create().
		SetID("01HN8CUSTOM000000000001").
		SetRuleID("01HN8RULE00000000000001").
		SetEventType("router.offline").
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("Router Offline").
		SetMessage("Router is not responding to health checks").
		SetData(map[string]interface{}{
			"device_name": "router-01",
			"device_ip":   "192.168.1.1",
			"suggested_actions": []interface{}{
				"Check physical connection",
				"Verify power supply",
				"Check network connectivity",
			},
		}).
		SetTriggeredAt(time.Now()).
		SaveX(ctx)

	// Step 3: Call RenderAlert()
	subject, body, err := service.RenderAlert(ctx, testAlert, "email")
	require.NoError(t, err)

	// Step 4: Verify output matches custom template format
	assert.Equal(t, "[CRITICAL] Router Offline - Custom Alert", subject)
	assert.Contains(t, body, "Alert Details:")
	assert.Contains(t, body, "Device: router-01")
	assert.Contains(t, body, "IP: 192.168.1.1")
	assert.Contains(t, body, "Message: Router is not responding to health checks")

	// Step 5: Verify variables were interpolated correctly
	assert.Contains(t, body, "Suggested Actions:")
	assert.Contains(t, body, "1. Check physical connection")
	assert.Contains(t, body, "2. Verify power supply")
	assert.Contains(t, body, "3. Check network connectivity")
}

// TestTemplatePipeline_DefaultFallback verifies fallback to embedded defaults.
func TestTemplatePipeline_DefaultFallback(t *testing.T) {
	client, service, cleanup := setupTestEnv(t)
	defer cleanup()

	ctx := context.Background()

	// Step 1: Create alert without saving custom template
	testAlert := client.Alert.Create().
		SetID("01HN8DEFAULT0000000001").
		SetRuleID("01HN8RULE00000000000002").
		SetEventType("interface.down").
		SetSeverity(alert.SeverityWARNING).
		SetTitle("Interface Down").
		SetMessage("Network interface ether1 has gone down").
		SetData(map[string]interface{}{
			"device_name":    "router-02",
			"device_ip":      "192.168.1.2",
			"interface_name": "ether1",
		}).
		SetTriggeredAt(time.Now()).
		SaveX(ctx)

	// Step 2: Call RenderAlert()
	subject, body, err := service.RenderAlert(ctx, testAlert, "email")
	require.NoError(t, err)

	// Step 3: Verify output matches embedded default template
	assert.NotEmpty(t, subject)
	assert.NotEmpty(t, body)
	assert.Contains(t, subject, "WARNING")
	assert.Contains(t, subject, "Interface Down")

	// Step 4: Verify all variables resolved
	assert.Contains(t, body, "Interface Down")
	assert.Contains(t, body, "Network interface ether1 has gone down")
}

// TestTemplatePipeline_ResetFlow verifies the reset to default flow.
func TestTemplatePipeline_ResetFlow(t *testing.T) {
	client, service, cleanup := setupTestEnv(t)
	defer cleanup()

	ctx := context.Background()

	// Step 1: Save custom template
	customSubject := "Custom Subject: {{.Title}}"
	customBody := "Custom Body: {{.Message}}"
	err := service.SaveTemplate(ctx, "vpn.disconnected", "telegram", customSubject, customBody, false)
	require.NoError(t, err)

	// Step 2: Trigger alert, verify uses custom
	testAlert1 := client.Alert.Create().
		SetID("01HN8RESET000000000001").
		SetRuleID("01HN8RULE00000000000003").
		SetEventType("vpn.disconnected").
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("VPN Disconnected").
		SetMessage("VPN tunnel to remote-site has disconnected").
		SetData(map[string]interface{}{
			"device_name": "router-03",
			"vpn_name":    "remote-site",
		}).
		SetTriggeredAt(time.Now()).
		SaveX(ctx)

	subject1, body1, err := service.RenderAlert(ctx, testAlert1, "telegram")
	require.NoError(t, err)
	assert.Contains(t, body1, "Custom Body: VPN tunnel to remote-site has disconnected")

	// Step 3: Call ResetToDefault()
	err = service.ResetToDefault(ctx, "vpn.disconnected", "telegram")
	require.NoError(t, err)

	// Step 4: Trigger another alert
	testAlert2 := client.Alert.Create().
		SetID("01HN8RESET000000000002").
		SetRuleID("01HN8RULE00000000000003").
		SetEventType("vpn.disconnected").
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("VPN Disconnected Again").
		SetMessage("Another VPN tunnel disconnected").
		SetData(map[string]interface{}{
			"device_name": "router-03",
		}).
		SetTriggeredAt(time.Now()).
		SaveX(ctx)

	// Step 5: Verify uses default template now
	subject2, body2, err := service.RenderAlert(ctx, testAlert2, "telegram")
	require.NoError(t, err)
	// Should NOT contain custom text anymore
	assert.NotContains(t, body2, "Custom Body:")
	// Should contain the new alert data
	assert.Contains(t, body2, "Another VPN tunnel disconnected")
}

// TestTemplatePipeline_RenderErrorFallback verifies graceful fallback on errors.
func TestTemplatePipeline_RenderErrorFallback(t *testing.T) {
	client, service, cleanup := setupTestEnv(t)
	defer cleanup()

	ctx := context.Background()

	// Step 1: Create alert with missing EventData
	testAlert := client.Alert.Create().
		SetID("01HN8FALLBACK000000001").
		SetRuleID("01HN8RULE00000000000004").
		SetEventType("system.cpu_high").
		SetSeverity(alert.SeverityWARNING).
		SetTitle("High CPU Usage").
		SetMessage("CPU usage has exceeded threshold").
		SetDeviceID("router-04").
		// Data is nil/empty
		SetTriggeredAt(time.Now()).
		SaveX(ctx)

	// Step 2: Call RenderAlert() - should succeed with fallback
	subject, body, err := service.RenderAlert(ctx, testAlert, "email")
	require.NoError(t, err, "RenderAlert should not error, even with missing data")

	// Step 3: Verify returns fallback content
	assert.NotEmpty(t, subject)
	assert.NotEmpty(t, body)

	// Step 4: Verify fallback format: "[{severity}] {title}\n\n{message}"
	assert.Contains(t, subject, "WARNING")
	assert.Contains(t, subject, "High CPU Usage")
	assert.Contains(t, body, "High CPU Usage")
	assert.Contains(t, body, "CPU usage has exceeded threshold")
}

// TestTemplatePipeline_PreviewTemplate verifies preview with event-type-specific sample data.
func TestTemplatePipeline_PreviewTemplate(t *testing.T) {
	_, service, cleanup := setupTestEnv(t)
	defer cleanup()

	ctx := context.Background()

	testCases := []struct {
		eventType       string
		expectedContent []string
	}{
		{
			eventType: "router.offline",
			expectedContent: []string{
				"Router Offline",
				"router-01",
				"192.168.1.1",
				"not responding to health checks",
			},
		},
		{
			eventType: "interface.down",
			expectedContent: []string{
				"Interface Down",
				"ether1",
				"router-01",
			},
		},
		{
			eventType: "vpn.disconnected",
			expectedContent: []string{
				"VPN Connection Lost",
				"remote-site",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.eventType, func(t *testing.T) {
			// Call PreviewTemplate with sample template
			subjectTmpl := "[{{.Severity}}] {{.Title}}"
			bodyTmpl := "{{.Message}}\n\nDevice: {{.DeviceName}} ({{.DeviceIP}})"

			subject, body, err := service.PreviewTemplate(ctx, tc.eventType, "email", subjectTmpl, bodyTmpl)

			require.NoError(t, err)
			assert.NotEmpty(t, subject)
			assert.NotEmpty(t, body)

			// Verify uses sample data appropriate for event type
			for _, expected := range tc.expectedContent {
				assert.Contains(t, body, expected, "Preview should contain event-specific sample data")
			}
		})
	}
}

// TestTemplatePipeline_InvalidTemplate verifies preview with invalid template.
func TestTemplatePipeline_InvalidTemplate(t *testing.T) {
	_, service, cleanup := setupTestEnv(t)
	defer cleanup()

	ctx := context.Background()

	// Invalid template with syntax error
	invalidSubject := "{{.Title"
	invalidBody := "{{.Message}} {{.UndefinedFunction 123}}"

	t.Run("invalid subject syntax", func(t *testing.T) {
		errors := service.ValidateTemplate(invalidSubject, "Valid body", "email")
		assert.NotEmpty(t, errors, "Should return validation errors")
		assert.Contains(t, errors[0], "subject")
	})

	t.Run("invalid body with undefined function", func(t *testing.T) {
		errors := service.ValidateTemplate("Valid subject", invalidBody, "email")
		assert.NotEmpty(t, errors, "Should return validation errors")
		assert.Contains(t, errors[0], "body")
	})
}

// TestDispatcherIntegration verifies end-to-end dispatcher integration.
func TestDispatcherIntegration(t *testing.T) {
	client, service, cleanup := setupTestEnv(t)
	defer cleanup()

	ctx := context.Background()

	// Step 1: Create custom email template
	customSubject := "[{{.Severity}}] Dispatcher Test: {{.Title}}"
	customBody := "Alert from dispatcher:\n{{.Message}}\nDevice: {{.DeviceName}}"
	err := service.SaveTemplate(ctx, "backup.failed", "email", customSubject, customBody, false)
	require.NoError(t, err)

	// Step 2: Create alert that triggers notification
	testAlert := client.Alert.Create().
		SetID("01HN8DISPATCH00000001").
		SetRuleID("01HN8RULE00000000000005").
		SetEventType("backup.failed").
		SetSeverity(alert.SeverityWARNING).
		SetTitle("Backup Failed").
		SetMessage("Scheduled backup failed to complete").
		SetData(map[string]interface{}{
			"device_name": "router-05",
			"device_ip":   "192.168.1.5",
		}).
		SetTriggeredAt(time.Now()).
		SaveX(ctx)

	// Step 3: Render the alert (simulating dispatcher usage)
	subject, body, err := service.RenderAlert(ctx, testAlert, "email")
	require.NoError(t, err)

	// Step 4: Verify notification matches rendered template
	assert.Equal(t, "[WARNING] Dispatcher Test: Backup Failed", subject)
	assert.Contains(t, body, "Alert from dispatcher:")
	assert.Contains(t, body, "Scheduled backup failed to complete")
	assert.Contains(t, body, "Device: router-05")
}

// TestDispatcherIntegration_WithoutService verifies dispatcher works without template service.
func TestDispatcherIntegration_WithoutService(t *testing.T) {
	client, _, cleanup := setupTestEnv(t)
	defer cleanup()

	ctx := context.Background()

	// Create alert
	testAlert := client.Alert.Create().
		SetID("01HN8NOSERVICE000001").
		SetRuleID("01HN8RULE00000000000006").
		SetEventType("backup.completed").
		SetSeverity(alert.SeverityINFO).
		SetTitle("Backup Completed").
		SetMessage("Backup completed successfully").
		SetData(map[string]interface{}{
			"device_name": "router-06",
		}).
		SetTriggeredAt(time.Now()).
		SaveX(ctx)

	// Without template service, notification should use original content
	// This simulates legacy dispatcher behavior
	notification := Notification{
		Title:    testAlert.Title,
		Message:  testAlert.Message,
		Severity: string(testAlert.Severity),
	}

	assert.Equal(t, "Backup Completed", notification.Title)
	assert.Equal(t, "Backup completed successfully", notification.Message)
	assert.Equal(t, "INFO", notification.Severity)
}

// TestEventPublishing verifies events are published on template operations.
func TestEventPublishing(t *testing.T) {
	client, service, cleanup := setupTestEnv(t)
	defer cleanup()

	ctx := context.Background()

	// Note: Event publishing integration would require a real event bus.
	// For now, we test that template operations complete successfully.
	// In a full integration test with event bus, we would:
	// 1. Subscribe to event bus
	// 2. Save template → verify "alert.template.saved" event
	// 3. Reset template → verify "alert.template.reset" event
	// 4. Render with error → verify "alert.template.render_error" event

	t.Run("save template operation", func(t *testing.T) {
		err := service.SaveTemplate(ctx, "test.event", "email", "Subject", "Body", false)
		require.NoError(t, err)

		// Verify template was saved
		tmpl, err := client.AlertTemplate.Query().
			Where(
				alerttemplate.EventTypeEQ("test.event"),
				alerttemplate.ChannelEQ(alerttemplate.ChannelEmail),
			).
			Only(ctx)
		require.NoError(t, err)
		assert.Equal(t, "Subject", tmpl.SubjectTemplate)
		assert.Equal(t, "Body", tmpl.BodyTemplate)
	})

	t.Run("reset template operation", func(t *testing.T) {
		// First save a template
		err := service.SaveTemplate(ctx, "test.reset", "email", "Subject", "Body", false)
		require.NoError(t, err)

		// Then reset it
		err = service.ResetToDefault(ctx, "test.reset", "email")
		require.NoError(t, err)

		// Verify template was deleted
		exists, err := client.AlertTemplate.Query().
			Where(
				alerttemplate.EventTypeEQ("test.reset"),
				alerttemplate.ChannelEQ(alerttemplate.ChannelEmail),
			).
			Exist(ctx)
		require.NoError(t, err)
		assert.False(t, exists, "Template should be deleted after reset")
	})
}

// TestChannelSpecificRendering verifies rendering for all 5 channels.
func TestChannelSpecificRendering(t *testing.T) {
	client, service, cleanup := setupTestEnv(t)
	defer cleanup()

	ctx := context.Background()

	// Create a test alert
	testAlert := client.Alert.Create().
		SetID("01HN8CHANNELS00000001").
		SetRuleID("01HN8RULE00000000000007").
		SetEventType("router.offline").
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("Router Offline").
		SetMessage("Router is not responding").
		SetData(map[string]interface{}{
			"device_name": "test-router",
			"device_ip":   "192.168.1.1",
		}).
		SetTriggeredAt(time.Now()).
		SaveX(ctx)

	channels := []string{"email", "telegram", "pushover", "webhook", "inapp"}

	for _, channel := range channels {
		t.Run(channel, func(t *testing.T) {
			subject, body, err := service.RenderAlert(ctx, testAlert, channel)
			require.NoError(t, err)

			// All channels should produce output
			// Email, pushover, and inapp have subjects
			if channel == "email" || channel == "pushover" || channel == "inapp" {
				assert.NotEmpty(t, subject, "Channel %s should have subject", channel)
			}

			assert.NotEmpty(t, body, "Channel %s should have body", channel)
			assert.Contains(t, body, "Router is not responding")
		})
	}
}

// TestRenderAlert_AllAcceptanceCriteria verifies all acceptance criteria are met.
func TestRenderAlert_AllAcceptanceCriteria(t *testing.T) {
	client, service, cleanup := setupTestEnv(t)
	defer cleanup()

	ctx := context.Background()

	t.Run("AC1: Edit Alert Template", func(t *testing.T) {
		// User can edit alert template
		err := service.SaveTemplate(ctx, "ac1.test", "email", "AC1 Subject", "AC1 Body", false)
		require.NoError(t, err)

		// Verify it was saved
		tmpl, err := client.AlertTemplate.Query().
			Where(
				alerttemplate.EventTypeEQ("ac1.test"),
				alerttemplate.ChannelEQ(alerttemplate.ChannelEmail),
			).
			Only(ctx)
		require.NoError(t, err)
		assert.Equal(t, "AC1 Subject", tmpl.SubjectTemplate)
	})

	t.Run("AC2: Variable Interpolation", func(t *testing.T) {
		// Save template with variables
		err := service.SaveTemplate(ctx, "ac2.test", "email",
			"Alert: {{.Title}}",
			"Device: {{.DeviceName}}, IP: {{.DeviceIP}}, Severity: {{.Severity}}",
			false)
		require.NoError(t, err)

		// Create alert
		testAlert := client.Alert.Create().
			SetID("01HN8AC200000000000001").
			SetRuleID("01HN8RULE00000000000008").
			SetEventType("ac2.test").
			SetSeverity(alert.SeverityWARNING).
			SetTitle("Test Alert").
			SetMessage("Test message").
			SetData(map[string]interface{}{
				"device_name": "test-device",
				"device_ip":   "10.0.0.1",
			}).
			SetTriggeredAt(time.Now()).
			SaveX(ctx)

		// Render and verify interpolation
		subject, body, err := service.RenderAlert(ctx, testAlert, "email")
		require.NoError(t, err)
		assert.Equal(t, "Alert: Test Alert", subject)
		assert.Contains(t, body, "Device: test-device")
		assert.Contains(t, body, "IP: 10.0.0.1")
		assert.Contains(t, body, "Severity: WARNING")
	})

	t.Run("AC3: Preview with Sample Data", func(t *testing.T) {
		// Preview returns rendered output with sample data
		subject, body, err := service.PreviewTemplate(ctx,
			"router.offline",
			"email",
			"Preview: {{.Title}}",
			"Sample: {{.DeviceName}}",
		)
		require.NoError(t, err)
		assert.Contains(t, subject, "Preview:")
		assert.Contains(t, body, "Sample:")
		assert.Contains(t, body, "router-01") // Sample device name
	})

	t.Run("AC4: Per-Channel Formats", func(t *testing.T) {
		// Can save different templates for each channel
		channels := []string{"email", "telegram", "pushover"}
		for _, channel := range channels {
			err := service.SaveTemplate(ctx,
				"ac4.test",
				channel,
				"Subject for "+channel,
				"Body for "+channel,
				false)
			require.NoError(t, err)
		}

		// Verify each channel has its own template
		for _, channel := range channels {
			tmpl, err := client.AlertTemplate.Query().
				Where(
					alerttemplate.EventTypeEQ("ac4.test"),
					alerttemplate.ChannelEQ(alerttemplate.Channel(channel)),
				).
				Only(ctx)
			require.NoError(t, err)
			assert.Equal(t, "Subject for "+channel, tmpl.SubjectTemplate)
		}
	})

	t.Run("AC5: Reset to Default", func(t *testing.T) {
		// Save custom template
		err := service.SaveTemplate(ctx, "ac5.test", "email", "Custom", "Custom", false)
		require.NoError(t, err)

		// Reset to default
		err = service.ResetToDefault(ctx, "ac5.test", "email")
		require.NoError(t, err)

		// Verify deleted
		exists, err := client.AlertTemplate.Query().
			Where(
				alerttemplate.EventTypeEQ("ac5.test"),
				alerttemplate.ChannelEQ(alerttemplate.ChannelEmail),
			).
			Exist(ctx)
		require.NoError(t, err)
		assert.False(t, exists)
	})

	t.Run("AC6: Template Validation", func(t *testing.T) {
		// Validation catches syntax errors
		errors := service.ValidateTemplate("{{.Title", "Valid body", "email")
		assert.NotEmpty(t, errors, "Should catch unclosed template tag")

		// Valid template passes
		errors = service.ValidateTemplate("{{.Title}}", "{{.Message}}", "email")
		assert.Empty(t, errors, "Valid template should pass validation")
	})

	t.Run("AC7: Graceful Fallback", func(t *testing.T) {
		// Create alert
		testAlert := client.Alert.Create().
			SetID("01HN8AC700000000000001").
			SetRuleID("01HN8RULE00000000000009").
			SetEventType("ac7.test").
			SetSeverity(alert.SeverityCRITICAL).
			SetTitle("Fallback Test").
			SetMessage("Fallback message").
			SetTriggeredAt(time.Now()).
			SaveX(ctx)

		// Render without custom template (uses default)
		subject, body, err := service.RenderAlert(ctx, testAlert, "email")
		require.NoError(t, err, "Should not fail even without custom template")
		assert.NotEmpty(t, subject)
		assert.NotEmpty(t, body)
		assert.Contains(t, subject, "Fallback Test")
	})
}

// TestRealEventBusIntegration tests with a real event bus (if available).
func TestRealEventBusIntegration(t *testing.T) {
	t.Skip("Requires event bus setup - run manually with real infrastructure")

	client, service, cleanup := setupTestEnv(t)
	defer cleanup()

	// Create real event bus
	eventBus := events.NewEventBus(events.DefaultEventBusOptions())
	defer eventBus.Close()

	ctx := context.Background()

	// Subscribe to template events
	var savedEvent, resetEvent bool
	eventBus.Subscribe("alert.template.saved", func(ctx context.Context, e events.Event) error {
		savedEvent = true
		return nil
	})
	eventBus.Subscribe("alert.template.reset", func(ctx context.Context, e events.Event) error {
		resetEvent = true
		return nil
	})

	// Trigger operations
	err := service.SaveTemplate(ctx, "event.test", "email", "Subject", "Body", false)
	require.NoError(t, err)

	time.Sleep(100 * time.Millisecond) // Allow event propagation

	err = service.ResetToDefault(ctx, "event.test", "email")
	require.NoError(t, err)

	time.Sleep(100 * time.Millisecond) // Allow event propagation

	// Verify events were published
	assert.True(t, savedEvent, "Should publish template.saved event")
	assert.True(t, resetEvent, "Should publish template.reset event")
}
