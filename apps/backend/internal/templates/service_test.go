package templates

import (
	"context"
	"testing"

	"backend/internal/events"

	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// createTestService creates a TemplateService for testing with minimal dependencies
func createTestService(t *testing.T) *TemplateService {
	logger := zerolog.Nop()
	eventBus := events.NewInMemoryEventBus()

	// Create service without validation (for unit tests)
	// In real usage, InstanceManager and DependencyManager are required
	service := &TemplateService{
		builtInTemplates: make(map[string]*ServiceTemplate),
		eventBus:         eventBus,
		publisher:        events.NewPublisher(eventBus, "template-service"),
		logger:           logger,
	}

	// Load templates manually
	err := service.LoadBuiltInTemplates()
	require.NoError(t, err, "Failed to load built-in templates")

	return service
}

func TestLoadBuiltInTemplates(t *testing.T) {
	service := createTestService(t)

	// Should load exactly 5 templates
	assert.Equal(t, 5, len(service.builtInTemplates), "Should load 5 built-in templates")

	// Verify each template exists
	expectedTemplates := []string{
		"privacy-bundle",
		"anti-censorship-kit",
		"telegram-proxy",
		"gaming-optimized",
		"family-protection",
	}

	for _, id := range expectedTemplates {
		template, exists := service.builtInTemplates[id]
		assert.True(t, exists, "Template %s should exist", id)
		assert.NotNil(t, template, "Template %s should not be nil", id)
		assert.Equal(t, id, template.ID, "Template ID should match")
	}
}

func TestGetTemplate(t *testing.T) {
	service := createTestService(t)
	ctx := context.Background()

	t.Run("existing template", func(t *testing.T) {
		template, err := service.GetTemplate(ctx, "privacy-bundle")
		require.NoError(t, err)
		assert.NotNil(t, template)
		assert.Equal(t, "privacy-bundle", template.ID)
		assert.Equal(t, "Privacy Bundle", template.Name)
		assert.Equal(t, CategoryPrivacy, template.Category)
		assert.Equal(t, ScopeChain, template.Scope)
	})

	t.Run("non-existent template", func(t *testing.T) {
		template, err := service.GetTemplate(ctx, "non-existent")
		assert.Error(t, err)
		assert.Nil(t, template)
		assert.Contains(t, err.Error(), "template not found")
	})

	t.Run("returns copy not reference", func(t *testing.T) {
		template1, err := service.GetTemplate(ctx, "telegram-proxy")
		require.NoError(t, err)

		template2, err := service.GetTemplate(ctx, "telegram-proxy")
		require.NoError(t, err)

		// Modify template1
		template1.Name = "Modified"

		// template2 should be unchanged
		assert.NotEqual(t, template1.Name, template2.Name)
		assert.Equal(t, "Telegram Proxy (Standalone)", template2.Name)
	})
}

func TestListTemplates(t *testing.T) {
	service := createTestService(t)
	ctx := context.Background()

	t.Run("list all templates", func(t *testing.T) {
		templates, err := service.ListTemplates(ctx, nil, nil)
		require.NoError(t, err)
		assert.Equal(t, 5, len(templates))
	})

	t.Run("filter by category", func(t *testing.T) {
		category := CategoryPrivacy
		templates, err := service.ListTemplates(ctx, &category, nil)
		require.NoError(t, err)
		assert.Equal(t, 1, len(templates))
		assert.Equal(t, "privacy-bundle", templates[0].ID)

		category = CategoryMessaging
		templates, err = service.ListTemplates(ctx, &category, nil)
		require.NoError(t, err)
		assert.Equal(t, 1, len(templates))
		assert.Equal(t, "telegram-proxy", templates[0].ID)
	})

	t.Run("filter by scope", func(t *testing.T) {
		scope := ScopeSingle
		templates, err := service.ListTemplates(ctx, nil, &scope)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(templates), 3) // telegram-proxy, gaming-optimized, family-protection

		scope = ScopeChain
		templates, err = service.ListTemplates(ctx, nil, &scope)
		require.NoError(t, err)
		assert.Equal(t, 1, len(templates))
		assert.Equal(t, "privacy-bundle", templates[0].ID)
	})

	t.Run("filter by category and scope", func(t *testing.T) {
		category := CategoryGaming
		scope := ScopeSingle
		templates, err := service.ListTemplates(ctx, &category, &scope)
		require.NoError(t, err)
		assert.Equal(t, 1, len(templates))
		assert.Equal(t, "gaming-optimized", templates[0].ID)
	})
}

func TestResolveVariables(t *testing.T) {
	service := createTestService(t)
	ctx := context.Background()

	t.Run("resolve simple variables", func(t *testing.T) {
		template, err := service.GetTemplate(ctx, "telegram-proxy")
		require.NoError(t, err)

		variables := map[string]interface{}{
			"PROXY_NAME":   "my-telegram",
			"PROXY_PORT":   "8443",
			"PROXY_SECRET": "0123456789abcdef0123456789abcdef",
			"WORKER_COUNT": 4,
			"MEMORY_LIMIT": 128,
		}

		resolved, err := service.ResolveVariables(template, variables)
		require.NoError(t, err)
		assert.NotNil(t, resolved)

		// Check that service name was resolved
		assert.Equal(t, "my-telegram", resolved.Services[0].Name)
	})

	t.Run("resolve chained template variables", func(t *testing.T) {
		template, err := service.GetTemplate(ctx, "privacy-bundle")
		require.NoError(t, err)

		variables := map[string]interface{}{
			"TOR_NAME":           "my-tor",
			"XRAY_NAME":          "my-xray",
			"XRAY_EXTERNAL_PORT": "10808",
		}

		resolved, err := service.ResolveVariables(template, variables)
		require.NoError(t, err)

		// Check service names
		assert.Equal(t, "my-tor", resolved.Services[0].Name)
		assert.Equal(t, "my-xray", resolved.Services[1].Name)

		// Check dependency resolution
		assert.Contains(t, resolved.Services[1].DependsOn, "my-tor")
	})

	t.Run("missing required variable", func(t *testing.T) {
		template, err := service.GetTemplate(ctx, "telegram-proxy")
		require.NoError(t, err)

		variables := map[string]interface{}{
			"PROXY_NAME": "my-telegram",
			// Missing PROXY_SECRET (required)
		}

		resolved, err := service.ResolveVariables(template, variables)
		assert.Error(t, err)
		assert.Nil(t, resolved)
		assert.Contains(t, err.Error(), "PROXY_SECRET")
	})

	t.Run("use default values", func(t *testing.T) {
		template, err := service.GetTemplate(ctx, "telegram-proxy")
		require.NoError(t, err)

		// Provide only required variables, let others use defaults
		variables := map[string]interface{}{
			"PROXY_NAME":   "my-telegram",
			"PROXY_PORT":   "8443",
			"PROXY_SECRET": "0123456789abcdef0123456789abcdef",
		}

		resolved, err := service.ResolveVariables(template, variables)
		require.NoError(t, err)
		assert.NotNil(t, resolved)
	})

	t.Run("variable validation - pattern mismatch", func(t *testing.T) {
		template, err := service.GetTemplate(ctx, "telegram-proxy")
		require.NoError(t, err)

		variables := map[string]interface{}{
			"PROXY_NAME":   "Invalid Name!", // Contains invalid characters
			"PROXY_PORT":   "8443",
			"PROXY_SECRET": "0123456789abcdef0123456789abcdef",
		}

		resolved, err := service.ResolveVariables(template, variables)
		assert.Error(t, err)
		assert.Nil(t, resolved)
		assert.Contains(t, err.Error(), "does not match pattern")
	})

	t.Run("variable validation - wrong secret format", func(t *testing.T) {
		template, err := service.GetTemplate(ctx, "telegram-proxy")
		require.NoError(t, err)

		variables := map[string]interface{}{
			"PROXY_NAME":   "my-telegram",
			"PROXY_PORT":   "8443",
			"PROXY_SECRET": "invalid", // Not 32 hex characters
		}

		resolved, err := service.ResolveVariables(template, variables)
		assert.Error(t, err)
		assert.Nil(t, resolved)
	})
}

func TestSearchTemplates(t *testing.T) {
	service := createTestService(t)
	ctx := context.Background()

	t.Run("search by name", func(t *testing.T) {
		templates, err := service.SearchTemplates(ctx, "telegram")
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(templates), 1)

		found := false
		for _, tmpl := range templates {
			if tmpl.ID == "telegram-proxy" {
				found = true
				break
			}
		}
		assert.True(t, found, "Should find telegram-proxy")
	})

	t.Run("search by description", func(t *testing.T) {
		templates, err := service.SearchTemplates(ctx, "privacy")
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(templates), 1)
	})

	t.Run("search by tag", func(t *testing.T) {
		templates, err := service.SearchTemplates(ctx, "gaming")
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(templates), 1)
	})

	t.Run("case insensitive search", func(t *testing.T) {
		templates1, err := service.SearchTemplates(ctx, "TELEGRAM")
		require.NoError(t, err)

		templates2, err := service.SearchTemplates(ctx, "telegram")
		require.NoError(t, err)

		assert.Equal(t, len(templates1), len(templates2))
	})

	t.Run("no results", func(t *testing.T) {
		templates, err := service.SearchTemplates(ctx, "nonexistent")
		require.NoError(t, err)
		assert.Equal(t, 0, len(templates))
	})
}

func TestValidateTemplate(t *testing.T) {
	service := createTestService(t)

	t.Run("valid template", func(t *testing.T) {
		template := &ServiceTemplate{
			ID:      "test-template",
			Name:    "Test Template",
			Version: "1.0.0",
			Services: []ServiceSpec{
				{
					ServiceType: "tor",
					Name:        "test-tor",
				},
			},
		}

		err := service.validateTemplate(template)
		assert.NoError(t, err)
	})

	t.Run("missing ID", func(t *testing.T) {
		template := &ServiceTemplate{
			Name:    "Test Template",
			Version: "1.0.0",
			Services: []ServiceSpec{
				{ServiceType: "tor", Name: "test-tor"},
			},
		}

		err := service.validateTemplate(template)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "ID is required")
	})

	t.Run("missing services", func(t *testing.T) {
		template := &ServiceTemplate{
			ID:       "test-template",
			Name:     "Test Template",
			Version:  "1.0.0",
			Services: []ServiceSpec{},
		}

		err := service.validateTemplate(template)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "at least one service")
	})

	t.Run("duplicate service names", func(t *testing.T) {
		template := &ServiceTemplate{
			ID:      "test-template",
			Name:    "Test Template",
			Version: "1.0.0",
			Services: []ServiceSpec{
				{ServiceType: "tor", Name: "duplicate"},
				{ServiceType: "xray-core", Name: "duplicate"},
			},
		}

		err := service.validateTemplate(template)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "duplicate service name")
	})

	t.Run("invalid dependency reference", func(t *testing.T) {
		template := &ServiceTemplate{
			ID:      "test-template",
			Name:    "Test Template",
			Version: "1.0.0",
			Services: []ServiceSpec{
				{
					ServiceType: "xray-core",
					Name:        "xray",
					DependsOn:   []string{"non-existent-service"},
				},
			},
		}

		err := service.validateTemplate(template)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "dependency")
		assert.Contains(t, err.Error(), "not found")
	})

	t.Run("valid dependency reference", func(t *testing.T) {
		template := &ServiceTemplate{
			ID:      "test-template",
			Name:    "Test Template",
			Version: "1.0.0",
			Services: []ServiceSpec{
				{ServiceType: "tor", Name: "tor-service"},
				{
					ServiceType: "xray-core",
					Name:        "xray-service",
					DependsOn:   []string{"tor-service"},
				},
			},
		}

		err := service.validateTemplate(template)
		assert.NoError(t, err)
	})
}

func TestGetTemplatesByCategory(t *testing.T) {
	service := createTestService(t)
	ctx := context.Background()

	templates, err := service.GetTemplatesByCategory(ctx, CategoryPrivacy)
	require.NoError(t, err)
	assert.Equal(t, 1, len(templates))
	assert.Equal(t, "privacy-bundle", templates[0].ID)
}

func TestGetTemplatesByScope(t *testing.T) {
	service := createTestService(t)
	ctx := context.Background()

	templates, err := service.GetTemplatesByScope(ctx, ScopeChain)
	require.NoError(t, err)
	assert.GreaterOrEqual(t, len(templates), 1)

	for _, tmpl := range templates {
		assert.Equal(t, ScopeChain, tmpl.Scope)
	}
}
