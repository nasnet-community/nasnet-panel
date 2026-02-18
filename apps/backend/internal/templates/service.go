package templates

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"sync"

	"backend/internal/orchestrator/dependencies"
	"backend/internal/orchestrator/lifecycle"

	"backend/internal/events"

	"github.com/rs/zerolog"
)

//go:embed built_in/privacy-bundle.json
//go:embed built_in/anti-censorship-kit.json
//go:embed built_in/telegram-proxy.json
//go:embed built_in/gaming-optimized.json
//go:embed built_in/family-protection.json
var builtInTemplatesFS embed.FS

// TemplateService handles service template operations
type TemplateService struct {
	mu                sync.RWMutex
	builtInTemplates  map[string]*ServiceTemplate
	instanceManager   *lifecycle.InstanceManager
	dependencyManager *dependencies.DependencyManager
	eventBus          events.EventBus
	publisher         *events.Publisher
	logger            zerolog.Logger
}

// TemplateServiceConfig holds configuration for the template service
type TemplateServiceConfig struct {
	InstanceManager   *lifecycle.InstanceManager
	DependencyManager *dependencies.DependencyManager
	EventBus          events.EventBus
	Logger            zerolog.Logger
}

// NewTemplateService creates a new template service
func NewTemplateService(cfg TemplateServiceConfig) (*TemplateService, error) {
	if cfg.InstanceManager == nil {
		return nil, fmt.Errorf("instance manager is required")
	}
	if cfg.DependencyManager == nil {
		return nil, fmt.Errorf("dependency manager is required")
	}
	if cfg.EventBus == nil {
		return nil, fmt.Errorf("event bus is required")
	}

	service := &TemplateService{
		builtInTemplates:  make(map[string]*ServiceTemplate),
		instanceManager:   cfg.InstanceManager,
		dependencyManager: cfg.DependencyManager,
		eventBus:          cfg.EventBus,
		publisher:         events.NewPublisher(cfg.EventBus, "template-service"),
		logger:            cfg.Logger.With().Str("component", "template-service").Logger(),
	}

	// Load built-in templates
	if err := service.LoadBuiltInTemplates(); err != nil {
		return nil, fmt.Errorf("failed to load built-in templates: %w", err)
	}

	service.logger.Info().Int("count", len(service.builtInTemplates)).Msg("template service initialized")

	return service, nil
}

// LoadBuiltInTemplates loads all built-in templates from embedded JSON files
func (s *TemplateService) LoadBuiltInTemplates() error {
	templateFiles := []string{
		"built_in/privacy-bundle.json",
		"built_in/anti-censorship-kit.json",
		"built_in/telegram-proxy.json",
		"built_in/gaming-optimized.json",
		"built_in/family-protection.json",
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	loadedCount := 0
	for _, file := range templateFiles {
		data, err := builtInTemplatesFS.ReadFile(file)
		if err != nil {
			s.logger.Warn().Err(err).Str("file", file).Msg("failed to read template file")
			continue
		}

		var template ServiceTemplate
		if err := json.Unmarshal(data, &template); err != nil {
			s.logger.Error().Err(err).Str("file", file).Msg("failed to parse template JSON")
			continue
		}

		// Validate template
		if err := s.validateTemplate(&template); err != nil {
			s.logger.Error().Err(err).Str("file", file).Str("template_id", template.ID).Msg("template validation failed")
			continue
		}

		s.builtInTemplates[template.ID] = &template
		loadedCount++
		s.logger.Debug().Str("template_id", template.ID).Str("name", template.Name).Msg("loaded template")
	}

	if loadedCount == 0 {
		return fmt.Errorf("no templates were successfully loaded")
	}

	s.logger.Info().Int("loaded", loadedCount).Int("total", len(templateFiles)).Msg("built-in templates loaded")
	return nil
}

// validateTemplate validates a template structure
func (s *TemplateService) validateTemplate(template *ServiceTemplate) error {
	if template.ID == "" {
		return fmt.Errorf("template ID is required")
	}
	if template.Name == "" {
		return fmt.Errorf("template name is required")
	}
	if template.Version == "" {
		return fmt.Errorf("template version is required")
	}
	if len(template.Services) == 0 {
		return fmt.Errorf("template must contain at least one service")
	}

	// Validate service specs
	serviceNames := make(map[string]bool)
	for i, svc := range template.Services {
		if svc.ServiceType == "" {
			return fmt.Errorf("service[%d]: serviceType is required", i)
		}
		if svc.Name == "" {
			return fmt.Errorf("service[%d]: name is required", i)
		}

		// Check for duplicate service names
		if serviceNames[svc.Name] {
			return fmt.Errorf("service[%d]: duplicate service name '%s'", i, svc.Name)
		}
		serviceNames[svc.Name] = true

		// Validate dependencies reference existing services
		for _, dep := range svc.DependsOn {
			if !serviceNames[dep] && !s.hasServiceBefore(template.Services[:i], dep) {
				return fmt.Errorf("service[%d]: dependency '%s' not found in template", i, dep)
			}
		}
	}

	return nil
}

// hasServiceBefore checks if a service name exists in the given slice
func (s *TemplateService) hasServiceBefore(services []ServiceSpec, name string) bool {
	for _, svc := range services {
		if svc.Name == name {
			return true
		}
	}
	return false
}

// GetTemplate retrieves a template by ID (O(1) lookup)
func (s *TemplateService) GetTemplate(ctx context.Context, id string) (*ServiceTemplate, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	template, exists := s.builtInTemplates[id]
	if !exists {
		return nil, fmt.Errorf("template not found: %s", id)
	}

	// Return a copy to prevent external modification
	templateCopy := *template
	return &templateCopy, nil
}

// ListTemplates returns all templates, optionally filtered by category and/or scope
func (s *TemplateService) ListTemplates(ctx context.Context, category *TemplateCategory, scope *TemplateScope) ([]*ServiceTemplate, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	templates := make([]*ServiceTemplate, 0, len(s.builtInTemplates))

	for _, template := range s.builtInTemplates {
		// Filter by category if specified
		if category != nil && template.Category != *category {
			continue
		}

		// Filter by scope if specified
		if scope != nil && template.Scope != *scope {
			continue
		}

		// Return a copy to prevent external modification
		templateCopy := *template
		templates = append(templates, &templateCopy)
	}

	s.logger.Debug().
		Int("total", len(s.builtInTemplates)).
		Int("filtered", len(templates)).
		Msg("listed templates")

	return templates, nil
}

// ResolveVariables substitutes user variables in template strings (Phase 1)
// Pattern: {{VARIABLE_NAME}} -> variable value
func (s *TemplateService) ResolveVariables(template *ServiceTemplate, variables map[string]interface{}) (*ServiceTemplate, error) {
	// Validate all required variables are provided
	if err := s.validateVariables(template, variables); err != nil {
		return nil, err
	}

	// Create a copy of the template for resolution
	resolvedTemplate := *template
	resolvedTemplate.Services = make([]ServiceSpec, len(template.Services))

	// Variable pattern: {{VARIABLE_NAME}}
	varPattern := regexp.MustCompile(`\{\{([A-Z_][A-Z0-9_]*)\}\}`)

	// Resolve variables in each service
	for i, svc := range template.Services {
		resolvedSvc := svc

		// Resolve service name
		resolvedSvc.Name = s.substituteVariables(svc.Name, variables, varPattern)

		// Resolve config overrides
		if svc.ConfigOverrides != nil {
			resolvedSvc.ConfigOverrides = s.resolveConfigMap(svc.ConfigOverrides, variables, varPattern)
		}

		resolvedTemplate.Services[i] = resolvedSvc
	}

	return &resolvedTemplate, nil
}

// validateVariables checks that all required variables are provided and have valid values
func (s *TemplateService) validateVariables(template *ServiceTemplate, variables map[string]interface{}) error {
	for _, varDef := range template.ConfigVariables {
		value, exists := variables[varDef.Name]

		// Check if required variable is missing
		if varDef.Required && (!exists || value == nil || value == "") {
			return fmt.Errorf("required variable '%s' is missing", varDef.Name)
		}

		// Skip validation if variable is not provided (and not required)
		if !exists {
			continue
		}

		// Type validation
		if err := s.validateVariableType(varDef, value); err != nil {
			return fmt.Errorf("variable '%s': %w", varDef.Name, err)
		}

		// Pattern validation (for strings)
		if varDef.ValidationPattern != "" && varDef.Type == VarTypeString { //nolint:nestif // variable validation logic
			strValue, ok := value.(string)
			if ok {
				matched, err := regexp.MatchString(varDef.ValidationPattern, strValue)
				if err != nil {
					return fmt.Errorf("variable '%s': invalid validation pattern: %w", varDef.Name, err)
				}
				if !matched {
					return fmt.Errorf("variable '%s': value does not match pattern '%s'", varDef.Name, varDef.ValidationPattern)
				}
			}
		}
	}

	return nil
}

// validateVariableType validates that a variable value matches its declared type
func (s *TemplateService) validateVariableType(varDef TemplateVariable, value interface{}) error {
	switch varDef.Type {
	case VarTypeString, VarTypePort, VarTypeIP:
		if _, ok := value.(string); !ok {
			return fmt.Errorf("expected string, got %T", value)
		}
	case VarTypeNumber:
		switch v := value.(type) {
		case float64, int, int64, int32:
			// Valid number types
		default:
			return fmt.Errorf("expected number, got %T", v)
		}
	case VarTypeBoolean:
		if _, ok := value.(bool); !ok {
			return fmt.Errorf("expected boolean, got %T", value)
		}
	case VarTypeEnum:
		// Check if value is in enum values
		found := false
		for _, enumVal := range varDef.EnumValues {
			if value == enumVal {
				found = true
				break
			}
		}
		if !found {
			return fmt.Errorf("value not in allowed enum values")
		}
	}

	return nil
}

// substituteVariables replaces {{VAR}} patterns with actual values
func (s *TemplateService) substituteVariables(text string, variables map[string]interface{}, pattern *regexp.Regexp) string {
	return pattern.ReplaceAllStringFunc(text, func(match string) string {
		// Extract variable name (strip {{ and }})
		varName := match[2 : len(match)-2]

		// Look up variable value
		if varValue, exists := variables[varName]; exists {
			// Convert to string
			return fmt.Sprintf("%v", varValue)
		}

		// If variable not found, return original
		return match
	})
}

// resolveConfigMap resolves variables in a configuration map recursively
func (s *TemplateService) resolveConfigMap(config, variables map[string]interface{}, pattern *regexp.Regexp) map[string]interface{} {
	resolved := make(map[string]interface{})

	for key, value := range config {
		switch v := value.(type) {
		case string:
			// Substitute variables in strings
			resolved[key] = s.substituteVariables(v, variables, pattern)
		case map[string]interface{}:
			// Recursively resolve nested maps
			resolved[key] = s.resolveConfigMap(v, variables, pattern)
		case []interface{}:
			// Resolve arrays
			resolved[key] = s.resolveConfigArray(v, variables, pattern)
		default:
			// Pass through other types unchanged
			resolved[key] = value
		}
	}

	return resolved
}

// resolveConfigArray resolves variables in an array recursively
func (s *TemplateService) resolveConfigArray(arr []interface{}, variables map[string]interface{}, pattern *regexp.Regexp) []interface{} {
	resolved := make([]interface{}, len(arr))

	for i, value := range arr {
		switch v := value.(type) {
		case string:
			resolved[i] = s.substituteVariables(v, variables, pattern)
		case map[string]interface{}:
			resolved[i] = s.resolveConfigMap(v, variables, pattern)
		case []interface{}:
			resolved[i] = s.resolveConfigArray(v, variables, pattern)
		default:
			resolved[i] = value
		}
	}

	return resolved
}

// GetTemplatesByCategory returns all templates in a specific category
func (s *TemplateService) GetTemplatesByCategory(ctx context.Context, category TemplateCategory) ([]*ServiceTemplate, error) {
	return s.ListTemplates(ctx, &category, nil)
}

// GetTemplatesByScope returns all templates with a specific scope
func (s *TemplateService) GetTemplatesByScope(ctx context.Context, scope TemplateScope) ([]*ServiceTemplate, error) {
	return s.ListTemplates(ctx, nil, &scope)
}

// SearchTemplates searches templates by name or description (case-insensitive)
func (s *TemplateService) SearchTemplates(ctx context.Context, query string) ([]*ServiceTemplate, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	query = strings.ToLower(query)
	templates := make([]*ServiceTemplate, 0)

	for _, template := range s.builtInTemplates {
		// Search in name, description, and tags
		if strings.Contains(strings.ToLower(template.Name), query) ||
			strings.Contains(strings.ToLower(template.Description), query) ||
			s.containsTag(template.Tags, query) {

			templateCopy := *template
			templates = append(templates, &templateCopy)
		}
	}

	return templates, nil
}

// containsTag checks if any tag contains the query string
func (s *TemplateService) containsTag(tags []string, query string) bool {
	for _, tag := range tags {
		if strings.Contains(strings.ToLower(tag), query) {
			return true
		}
	}
	return false
}
