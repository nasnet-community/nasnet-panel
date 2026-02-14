package templates

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestTemplateCache tests the caching functionality without database
func TestTemplateCache_Standalone(t *testing.T) {
	cache := NewTemplateCache()

	t.Run("basic operations", func(t *testing.T) {
		// Cache should be empty initially
		assert.Equal(t, 0, cache.Size())

		// Get from empty cache returns nil
		result := cache.Get("email", "test.event", "Subject", "Body")
		assert.Nil(t, result)
	})

	t.Run("cache key generation", func(t *testing.T) {
		// Same content should generate same key
		key1 := cache.cacheKey("email", "router.offline", "Sub", "Body")
		key2 := cache.cacheKey("email", "router.offline", "Sub", "Body")
		assert.Equal(t, key1, key2)

		// Different content should generate different key
		key3 := cache.cacheKey("email", "router.offline", "Sub", "Different Body")
		assert.NotEqual(t, key1, key3)

		// Different channel should generate different key
		key4 := cache.cacheKey("telegram", "router.offline", "Sub", "Body")
		assert.NotEqual(t, key1, key4)
	})

	t.Run("clear operation", func(t *testing.T) {
		cache.Clear()
		assert.Equal(t, 0, cache.Size())
	})
}

// TestBuildSampleTemplateData tests sample data generation
func TestBuildSampleTemplateData_Standalone(t *testing.T) {
	t.Run("router.offline event", func(t *testing.T) {
		data := BuildSampleTemplateData("router.offline")

		assert.Equal(t, "router.offline", data.EventType)
		assert.Equal(t, "CRITICAL", data.Severity)
		assert.Contains(t, data.Title, "Router Offline")
		assert.NotEmpty(t, data.DeviceName)
		assert.NotEmpty(t, data.DeviceIP)
		assert.NotEmpty(t, data.SuggestedActions)
		assert.NotNil(t, data.EventData["last_seen"])
		assert.NotNil(t, data.EventData["checks_failed"])
	})

	t.Run("interface.down event", func(t *testing.T) {
		data := BuildSampleTemplateData("interface.down")

		assert.Equal(t, "interface.down", data.EventType)
		assert.Equal(t, "WARNING", data.Severity)
		assert.NotEmpty(t, data.EventData["interface_name"])
	})

	t.Run("system.cpu_high event", func(t *testing.T) {
		data := BuildSampleTemplateData("system.cpu_high")

		assert.Equal(t, "system.cpu_high", data.EventType)
		assert.NotNil(t, data.EventData["cpu_usage"])
		assert.NotNil(t, data.EventData["threshold"])
	})

	t.Run("vpn.disconnected event", func(t *testing.T) {
		data := BuildSampleTemplateData("vpn.disconnected")

		assert.Equal(t, "vpn.disconnected", data.EventType)
		assert.Equal(t, "CRITICAL", data.Severity)
		assert.NotEmpty(t, data.EventData["vpn_name"])
	})

	t.Run("backup.completed event", func(t *testing.T) {
		data := BuildSampleTemplateData("backup.completed")

		assert.Equal(t, "backup.completed", data.EventType)
		assert.Equal(t, "INFO", data.Severity)
		assert.Empty(t, data.SuggestedActions)
	})

	t.Run("unknown event", func(t *testing.T) {
		data := BuildSampleTemplateData("unknown.custom.event")

		assert.Equal(t, "unknown.custom.event", data.EventType)
		assert.Equal(t, "WARNING", data.Severity)
		assert.NotEmpty(t, data.Title)
		assert.NotNil(t, data.EventData)
	})
}

// TestChannelLimits tests the channel limit configuration
func TestChannelLimits_Standalone(t *testing.T) {
	t.Run("email limits", func(t *testing.T) {
		limits := GetChannelLimits("email")
		assert.Equal(t, 200, limits.SubjectMaxLen)
		assert.Equal(t, 0, limits.BodyMaxLen) // Unlimited
	})

	t.Run("pushover limits", func(t *testing.T) {
		limits := GetChannelLimits("pushover")
		assert.Equal(t, 250, limits.SubjectMaxLen)
		assert.Equal(t, 1024, limits.BodyMaxLen)
	})

	t.Run("telegram limits", func(t *testing.T) {
		limits := GetChannelLimits("telegram")
		assert.Equal(t, 0, limits.SubjectMaxLen) // No subject
		assert.Equal(t, 4096, limits.BodyMaxLen)
	})

	t.Run("webhook limits", func(t *testing.T) {
		limits := GetChannelLimits("webhook")
		assert.Equal(t, 0, limits.SubjectMaxLen)
		assert.Equal(t, 0, limits.BodyMaxLen) // Unlimited
	})

	t.Run("inapp limits", func(t *testing.T) {
		limits := GetChannelLimits("inapp")
		assert.Equal(t, 100, limits.SubjectMaxLen)
		assert.Equal(t, 500, limits.BodyMaxLen)
	})

	t.Run("unknown channel defaults", func(t *testing.T) {
		limits := GetChannelLimits("unknown")
		assert.Equal(t, 100, limits.SubjectMaxLen)
		assert.Equal(t, 1000, limits.BodyMaxLen)
	})
}

// TestValidateSyntax tests template syntax validation
func TestValidateSyntax_Standalone(t *testing.T) {
	funcMap := make(map[string]interface{})

	t.Run("valid template", func(t *testing.T) {
		err := ValidateSyntax("Hello {{.Name}}", funcMap)
		assert.NoError(t, err)
	})

	t.Run("empty template is valid", func(t *testing.T) {
		err := ValidateSyntax("", funcMap)
		assert.NoError(t, err)
	})

	t.Run("invalid syntax", func(t *testing.T) {
		err := ValidateSyntax("{{.Name", funcMap)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "syntax error")
	})

	t.Run("complex valid template", func(t *testing.T) {
		tmpl := "{{if .Show}}Name: {{.Name}}{{else}}Anonymous{{end}}"
		err := ValidateSyntax(tmpl, funcMap)
		assert.NoError(t, err)
	})
}

// TestValidateFunctions tests restricted function detection
func TestValidateFunctions_Standalone(t *testing.T) {
	t.Run("no restricted functions", func(t *testing.T) {
		restricted := ValidateFunctions("{{.Name}} {{.Title}}")
		assert.Empty(t, restricted)
	})

	t.Run("detects call function", func(t *testing.T) {
		restricted := ValidateFunctions("{{call .Func}}")
		assert.Contains(t, restricted, "call")
	})

	t.Run("detects js function", func(t *testing.T) {
		restricted := ValidateFunctions("{{js .Value}}")
		assert.Contains(t, restricted, "js")
	})

	t.Run("detects html function", func(t *testing.T) {
		restricted := ValidateFunctions("{{html .Content}}")
		assert.Contains(t, restricted, "html")
	})

	t.Run("detects piped function", func(t *testing.T) {
		restricted := ValidateFunctions("{{.Value | call .Func}}")
		assert.Contains(t, restricted, "call")
	})

	t.Run("multiple restricted functions", func(t *testing.T) {
		restricted := ValidateFunctions("{{call .F1}} {{js .V1}} {{html .V2}}")
		assert.Len(t, restricted, 3)
	})
}

// TestValidateLength tests length constraint validation
func TestValidateLength_Standalone(t *testing.T) {
	t.Run("email subject within limit", func(t *testing.T) {
		errors := ValidateLength("Short subject", "Body text", "email")
		assert.Empty(t, errors)
	})

	t.Run("email subject exceeds limit", func(t *testing.T) {
		longSubject := string(make([]byte, 250))
		errors := ValidateLength(longSubject, "Body", "email")
		assert.NotEmpty(t, errors)
		assert.Contains(t, errors[0], "Subject exceeds")
	})

	t.Run("telegram body within limit", func(t *testing.T) {
		body := string(make([]byte, 4000))
		errors := ValidateLength("", body, "telegram")
		assert.Empty(t, errors)
	})

	t.Run("telegram body exceeds limit", func(t *testing.T) {
		longBody := string(make([]byte, 5000))
		errors := ValidateLength("", longBody, "telegram")
		assert.NotEmpty(t, errors)
		assert.Contains(t, errors[0], "Body exceeds")
	})

	t.Run("pushover both within limits", func(t *testing.T) {
		errors := ValidateLength("Title", "Message body", "pushover")
		assert.Empty(t, errors)
	})

	t.Run("pushover both exceed limits", func(t *testing.T) {
		longSubject := string(make([]byte, 300))
		longBody := string(make([]byte, 1200))
		errors := ValidateLength(longSubject, longBody, "pushover")
		assert.Len(t, errors, 2)
	})
}

// Benchmark tests for performance validation
func BenchmarkCacheKeyGeneration(b *testing.B) {
	cache := NewTemplateCache()
	for i := 0; i < b.N; i++ {
		cache.cacheKey("email", "router.offline", "Subject", "Body")
	}
}

func BenchmarkBuildSampleTemplateData(b *testing.B) {
	for i := 0; i < b.N; i++ {
		BuildSampleTemplateData("router.offline")
	}
}

func BenchmarkValidateSyntax(b *testing.B) {
	funcMap := make(map[string]interface{})
	tmpl := "{{if .Show}}Name: {{.Name}}{{else}}Anonymous{{end}}"
	for i := 0; i < b.N; i++ {
		ValidateSyntax(tmpl, funcMap)
	}
}
