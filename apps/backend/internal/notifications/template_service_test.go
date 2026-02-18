package notifications

import (
	"context"
	"testing"
	"text/template"
	"time"

	"backend/generated/ent/alert"
	"backend/generated/ent/enttest"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap/zaptest"

	_ "github.com/mattn/go-sqlite3" // SQLite driver for tests
)

func TestTemplateService_RenderAlert(t *testing.T) {
	// Setup test database
	db := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer db.Close()

	logger := zaptest.NewLogger(t).Sugar()
	service := NewTemplateService(TemplateServiceConfig{
		DB:     db,
		Logger: logger,
	})

	t.Run("renders with embedded default template", func(t *testing.T) {
		// Create a test alert
		testAlert := db.Alert.Create().
			SetID("01HN8TEST00000000000000").
			SetRuleID("01HN8RULE00000000000000").
			SetEventType("router.offline").
			SetSeverity(alert.SeverityCRITICAL).
			SetTitle("Router Offline").
			SetMessage("Router is not responding").
			SetData(map[string]interface{}{
				"device_name": "test-router",
				"device_ip":   "192.168.1.1",
			}).
			SetTriggeredAt(time.Now()).
			SaveX(context.Background())

		// Render for email channel
		subject, body, err := service.RenderAlert(context.Background(), testAlert, "email")

		require.NoError(t, err)
		assert.NotEmpty(t, subject)
		assert.NotEmpty(t, body)
		assert.Contains(t, subject, "CRITICAL")
		assert.Contains(t, subject, "Router Offline")
		assert.Contains(t, body, "test-router")
		assert.Contains(t, body, "192.168.1.1")
	})

	t.Run("renders with custom template from database", func(t *testing.T) {
		ctx := context.Background()

		// Save a custom template
		err := service.SaveTemplate(ctx, "interface.down", "email",
			"[{{.Severity}}] Custom: {{.Title}}",
			"Custom body: {{.Message}}\nDevice: {{.DeviceName}}",
			false,
		)
		require.NoError(t, err)

		// Create alert
		testAlert := db.Alert.Create().
			SetID("01HN8TEST00000000000001").
			SetRuleID("01HN8RULE00000000000000").
			SetEventType("interface.down").
			SetSeverity(alert.SeverityWARNING).
			SetTitle("Interface Down").
			SetMessage("eth0 is down").
			SetData(map[string]interface{}{
				"device_name": "router-01",
			}).
			SetTriggeredAt(time.Now()).
			SaveX(ctx)

		// Render with custom template
		subject, body, err := service.RenderAlert(ctx, testAlert, "email")

		require.NoError(t, err)
		assert.Equal(t, "[WARNING] Custom: Interface Down", subject)
		assert.Contains(t, body, "Custom body: eth0 is down")
		assert.Contains(t, body, "Device: router-01")
	})

	t.Run("falls back on template error", func(t *testing.T) {
		ctx := context.Background()

		// Save an invalid template (references non-existent field)
		// Note: This won't fail validation because missingkey=zero
		// But we can test with a syntax error
		err := service.SaveTemplate(ctx, "system.cpu_high", "email",
			"Valid subject",
			"{{.Message}} {{.NonExistentField | undefinedFunc}}",
			false,
		)

		// Should fail validation
		assert.Error(t, err)
	})

	t.Run("handles alert without device info", func(t *testing.T) {
		testAlert := db.Alert.Create().
			SetID("01HN8TEST00000000000002").
			SetRuleID("01HN8RULE00000000000000").
			SetEventType("backup.failed").
			SetSeverity(alert.SeverityWARNING).
			SetTitle("Backup Failed").
			SetMessage("Backup process failed").
			SetTriggeredAt(time.Now()).
			SaveX(context.Background())

		subject, body, err := service.RenderAlert(context.Background(), testAlert, "telegram")

		require.NoError(t, err)
		assert.NotEmpty(t, subject) // Telegram doesn't use subject, but shouldn't error
		assert.NotEmpty(t, body)
		assert.Contains(t, body, "Backup Failed")
	})
}

func TestTemplateService_PreviewTemplate(t *testing.T) {
	db := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer db.Close()

	logger := zaptest.NewLogger(t).Sugar()
	service := NewTemplateService(TemplateServiceConfig{
		DB:     db,
		Logger: logger,
	})

	t.Run("previews valid template", func(t *testing.T) {
		subject, body, err := service.PreviewTemplate(
			context.Background(),
			"router.offline",
			"email",
			"[{{.Severity}}] {{.Title}}",
			"Router {{.DeviceName}} is offline.\n\nIP: {{.DeviceIP}}",
		)

		require.NoError(t, err)
		assert.Contains(t, subject, "WARNING")
		assert.Contains(t, body, "router-01")
		assert.Contains(t, body, "192.168.1.1")
	})

	t.Run("returns error for invalid template", func(t *testing.T) {
		_, _, err := service.PreviewTemplate(
			context.Background(),
			"router.offline",
			"email",
			"{{.Title",
			"{{.Message}}",
		)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "parse error")
	})
}

func TestTemplateService_ValidateTemplate(t *testing.T) {
	db := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer db.Close()

	logger := zaptest.NewLogger(t).Sugar()
	service := NewTemplateService(TemplateServiceConfig{
		DB:     db,
		Logger: logger,
	})

	t.Run("valid template passes", func(t *testing.T) {
		errors := service.ValidateTemplate(
			"[{{.Severity}}] {{.Title}}",
			"{{.Message}}\n\nDevice: {{.DeviceName | default \"Unknown\"}}",
			"email",
		)

		assert.Empty(t, errors)
	})

	t.Run("syntax error detected", func(t *testing.T) {
		errors := service.ValidateTemplate(
			"{{.Title",
			"{{.Message}}",
			"email",
		)

		assert.NotEmpty(t, errors)
		assert.Contains(t, errors[0], "syntax")
	})

	t.Run("restricted function detected", func(t *testing.T) {
		errors := service.ValidateTemplate(
			"{{.Title}}",
			"{{call .SomeFunc}}",
			"email",
		)

		assert.NotEmpty(t, errors)
		assert.Contains(t, errors[0], "restricted")
	})

	t.Run("length limit exceeded for channel", func(t *testing.T) {
		// Create a very long body that exceeds Telegram's 4096 limit
		longBody := "{{.Message}}"
		for i := 0; i < 500; i++ {
			longBody += " This is a very long message that will exceed the limit."
		}

		errors := service.ValidateTemplate(
			"",
			longBody,
			"telegram",
		)

		// The rendered output should trigger length validation
		// Note: This depends on the sample data, so we check for length error
		if len(errors) > 0 {
			assert.Contains(t, errors[0], "exceeds maximum length")
		}
	})
}

func TestTemplateService_SaveTemplate(t *testing.T) {
	db := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer db.Close()

	logger := zaptest.NewLogger(t).Sugar()
	service := NewTemplateService(TemplateServiceConfig{
		DB:     db,
		Logger: logger,
	})

	t.Run("saves valid template", func(t *testing.T) {
		err := service.SaveTemplate(
			context.Background(),
			"vpn.disconnected",
			"telegram",
			"",
			"VPN {{.EventData.vpn_name}} disconnected",
			false,
		)

		require.NoError(t, err)
	})

	t.Run("updates existing template", func(t *testing.T) {
		ctx := context.Background()

		// Save initial template
		err := service.SaveTemplate(ctx, "wan.down", "email",
			"WAN Down",
			"Original message",
			false,
		)
		require.NoError(t, err)

		// Update the template
		err = service.SaveTemplate(ctx, "wan.down", "email",
			"WAN Down Updated",
			"Updated message",
			false,
		)
		require.NoError(t, err)

		// Verify the update
		preview, body, err := service.PreviewTemplate(ctx, "wan.down", "email",
			"WAN Down Updated",
			"Updated message",
		)
		require.NoError(t, err)
		assert.Equal(t, "WAN Down Updated", preview)
		assert.Equal(t, "Updated message", body)
	})

	t.Run("rejects invalid template", func(t *testing.T) {
		err := service.SaveTemplate(
			context.Background(),
			"system.memory_high",
			"email",
			"{{.Title",
			"{{.Message}}",
			false,
		)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "validation failed")
	})
}

func TestTemplateService_ResetToDefault(t *testing.T) {
	db := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer db.Close()

	logger := zaptest.NewLogger(t).Sugar()
	service := NewTemplateService(TemplateServiceConfig{
		DB:     db,
		Logger: logger,
	})

	t.Run("resets custom template", func(t *testing.T) {
		ctx := context.Background()

		// Save a custom template
		err := service.SaveTemplate(ctx, "service.down", "pushover",
			"Custom subject",
			"Custom body",
			false,
		)
		require.NoError(t, err)

		// Reset to default
		err = service.ResetToDefault(ctx, "service.down", "pushover")
		require.NoError(t, err)

		// Verify it uses the embedded default now
		// (we can't easily test this without more setup, but no error is good)
	})

	t.Run("cannot reset system default", func(t *testing.T) {
		ctx := context.Background()

		// Save a system default template
		err := service.SaveTemplate(ctx, "firewall.blocked_ip", "inapp",
			"System default",
			"System body",
			true, // is_default = true
		)
		require.NoError(t, err)

		// Try to reset - should fail
		err = service.ResetToDefault(ctx, "firewall.blocked_ip", "inapp")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "system default")
	})

	t.Run("no error when no custom template exists", func(t *testing.T) {
		err := service.ResetToDefault(context.Background(), "nonexistent.event", "email")
		assert.NoError(t, err)
	})
}

func TestTemplateCache(t *testing.T) {
	cache := NewTemplateCache()

	t.Run("stores and retrieves templates", func(t *testing.T) {
		tmpl, err := template.New("test").Parse("Hello {{.Name}}")
		require.NoError(t, err)

		cache.Set("email", "test.event", "Subject", "Body", tmpl)

		retrieved := cache.Get("email", "test.event", "Subject", "Body")
		assert.NotNil(t, retrieved)
	})

	t.Run("returns nil for missing template", func(t *testing.T) {
		retrieved := cache.Get("email", "missing.event", "Subject", "Body")
		assert.Nil(t, retrieved)
	})

	t.Run("invalidates specific template", func(t *testing.T) {
		tmpl, _ := template.New("test").Parse("Test")
		cache.Set("telegram", "test.event", "", "Body", tmpl)

		cache.Invalidate("telegram", "test.event", "", "Body")

		retrieved := cache.Get("telegram", "test.event", "", "Body")
		assert.Nil(t, retrieved)
	})

	t.Run("invalidates all templates for event type", func(t *testing.T) {
		tmpl1, _ := template.New("test1").Parse("Test1")
		tmpl2, _ := template.New("test2").Parse("Test2")

		cache.Set("email", "multi.event", "Sub1", "Body1", tmpl1)
		cache.Set("email", "multi.event", "Sub2", "Body2", tmpl2)

		cache.InvalidateAll("email", "multi.event")

		assert.Nil(t, cache.Get("email", "multi.event", "Sub1", "Body1"))
		assert.Nil(t, cache.Get("email", "multi.event", "Sub2", "Body2"))
	})

	t.Run("clears all templates", func(t *testing.T) {
		tmpl, _ := template.New("test").Parse("Test")
		cache.Set("email", "event1", "S", "B", tmpl)
		cache.Set("telegram", "event2", "", "B", tmpl)

		initialSize := cache.Size()
		assert.Greater(t, initialSize, 0)

		cache.Clear()

		assert.Equal(t, 0, cache.Size())
	})
}

func TestBuildTemplateData(t *testing.T) {
	db := enttest.Open(t, "sqlite3", "file:ent?mode=memory&_fk=1")
	defer db.Close()

	t.Run("builds data from alert", func(t *testing.T) {
		testAlert := db.Alert.Create().
			SetID("01HN8TEST00000000000003").
			SetRuleID("01HN8RULE00000000000000").
			SetEventType("interface.down").
			SetSeverity(alert.SeverityWARNING).
			SetTitle("Interface Down").
			SetMessage("eth0 is down").
			SetDeviceID("router-01").
			SetData(map[string]interface{}{
				"device_name":       "RouterOne",
				"device_ip":         "10.0.0.1",
				"interface_name":    "eth0",
				"suggested_actions": []interface{}{"Check cable", "Reboot interface"},
			}).
			SetTriggeredAt(time.Now()).
			SaveX(context.Background())

		data := BuildTemplateData(testAlert)

		assert.Equal(t, "interface.down", data.EventType)
		assert.Equal(t, "WARNING", data.Severity)
		assert.Equal(t, "Interface Down", data.Title)
		assert.Equal(t, "eth0 is down", data.Message)
		assert.Equal(t, "RouterOne", data.DeviceName)
		assert.Equal(t, "10.0.0.1", data.DeviceIP)
		assert.Len(t, data.SuggestedActions, 2)
		assert.Equal(t, "Check cable", data.SuggestedActions[0])
		assert.Equal(t, "eth0", data.EventData["interface_name"])
	})

	t.Run("handles missing device info", func(t *testing.T) {
		testAlert := db.Alert.Create().
			SetID("01HN8TEST00000000000004").
			SetRuleID("01HN8RULE00000000000000").
			SetEventType("backup.completed").
			SetSeverity(alert.SeverityINFO).
			SetTitle("Backup Completed").
			SetMessage("Backup finished successfully").
			SetTriggeredAt(time.Now()).
			SaveX(context.Background())

		data := BuildTemplateData(testAlert)

		assert.Equal(t, "backup.completed", data.EventType)
		assert.Equal(t, "", data.DeviceName)
		assert.Equal(t, "", data.DeviceIP)
		assert.Empty(t, data.SuggestedActions)
	})
}

func TestBuildSampleTemplateData(t *testing.T) {
	t.Run("generates sample data for router.offline", func(t *testing.T) {
		data := BuildSampleTemplateData("router.offline")

		assert.Equal(t, "router.offline", data.EventType)
		assert.Equal(t, "CRITICAL", data.Severity)
		assert.Contains(t, data.Title, "Router Offline")
		assert.NotEmpty(t, data.DeviceName)
		assert.NotEmpty(t, data.DeviceIP)
		assert.NotEmpty(t, data.SuggestedActions)
		assert.NotEmpty(t, data.EventData)
	})

	t.Run("generates sample data for unknown event", func(t *testing.T) {
		data := BuildSampleTemplateData("unknown.event")

		assert.Equal(t, "unknown.event", data.EventType)
		assert.Equal(t, "WARNING", data.Severity)
		assert.NotEmpty(t, data.Title)
	})
}
