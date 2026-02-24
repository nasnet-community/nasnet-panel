package templates

import (
	"fmt"
	"regexp"
	"strings"

	"go.uber.org/zap"
)

// TemplateValidator validates template structure, dependencies, and variable references
type TemplateValidator struct {
	logger *zap.Logger
}

// TemplateValidatorConfig holds configuration for the template validator
type TemplateValidatorConfig struct {
	Logger *zap.Logger
}

// ValidationError represents a template validation error
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// NewTemplateValidator creates a new template validator
func NewTemplateValidator(cfg TemplateValidatorConfig) *TemplateValidator {
	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	return &TemplateValidator{
		logger: logger,
	}
}

// ValidateTemplate validates the basic structure of a template
func (tv *TemplateValidator) ValidateTemplate(template *ServiceTemplate) error { //nolint:gocyclo // template validation inherently complex
	if tv == nil {
		return &ValidationError{Field: "validator", Message: "template validator is nil"}
	}
	if template == nil {
		return &ValidationError{Field: "template", Message: "template is nil"}
	}

	// Validate required fields
	if template.ID == "" {
		return &ValidationError{Field: "id", Message: "template ID is required"}
	}

	if template.Name == "" {
		return &ValidationError{Field: "name", Message: "template name is required"}
	}

	if template.Description == "" {
		return &ValidationError{Field: "description", Message: "template description is required"}
	}

	if template.Version == "" {
		return &ValidationError{Field: "version", Message: "template version is required"}
	}

	if template.Author == "" {
		return &ValidationError{Field: "author", Message: "template author is required"}
	}

	// Validate category
	if !tv.isValidCategory(template.Category) {
		return &ValidationError{
			Field:   "category",
			Message: fmt.Sprintf("invalid category: %s", template.Category),
		}
	}

	// Validate scope
	if template.Scope != ScopeSingle && template.Scope != ScopeMultiple {
		return &ValidationError{
			Field:   "scope",
			Message: fmt.Sprintf("invalid scope: %s (must be 'single' or 'multi')", template.Scope),
		}
	}

	// Validate services
	if len(template.Services) == 0 {
		return &ValidationError{Field: "services", Message: "at least one service is required"}
	}

	// Validate scope matches service count
	if template.Scope == ScopeSingle && len(template.Services) != 1 {
		return &ValidationError{
			Field:   "scope",
			Message: fmt.Sprintf("single-scope template must have exactly 1 service, got %d", len(template.Services)),
		}
	}

	if template.Scope == ScopeMultiple && len(template.Services) < 2 {
		return &ValidationError{
			Field:   "scope",
			Message: fmt.Sprintf("multi-scope template must have at least 2 services, got %d", len(template.Services)),
		}
	}

	// Validate each service
	for i, service := range template.Services {
		if err := tv.validateServiceSpec(&service, i); err != nil {
			return fmt.Errorf("service[%d]: %w", i, err)
		}
	}

	// Validate config variables
	for i, configVar := range template.ConfigVariables {
		if err := tv.validateConfigVariable(&configVar, i); err != nil {
			return fmt.Errorf("configVariable[%d]: %w", i, err)
		}
	}

	// Validate estimated resources
	if err := tv.validateResourceEstimate(&template.EstimatedResources); err != nil {
		return fmt.Errorf("estimatedResources: %w", err)
	}

	return nil
}

// ValidateDependencies validates that there are no circular dependencies
func (tv *TemplateValidator) ValidateDependencies(template *ServiceTemplate) error {
	if tv == nil {
		return fmt.Errorf("template validator is nil")
	}
	if template == nil {
		return fmt.Errorf("template is nil")
	}

	// Build dependency graph from suggested routing rules
	graph := make(map[string][]string) // service name -> dependencies

	for _, service := range template.Services {
		graph[service.Name] = []string{}
	}

	// Parse suggested routing to extract dependencies
	for _, rule := range template.SuggestedRouting {
		targetService := rule.TargetService

		// Find services that depend on this target
		// In a real implementation, this would be more sophisticated
		// For now, we'll assume the rule describes a dependency
		if _, exists := graph[targetService]; !exists {
			return fmt.Errorf("suggested routing references unknown service: %s", targetService)
		}
	}

	// Detect cycles using DFS
	visited := make(map[string]bool)
	recStack := make(map[string]bool)

	for serviceName := range graph {
		if !visited[serviceName] {
			if tv.hasCycleDFS(serviceName, graph, visited, recStack) {
				return fmt.Errorf("circular dependency detected involving service: %s", serviceName)
			}
		}
	}

	return nil
}

// hasCycleDFS detects cycles using depth-first search
func (tv *TemplateValidator) hasCycleDFS(node string, graph map[string][]string, visited, recStack map[string]bool) bool {
	visited[node] = true
	recStack[node] = true

	for _, neighbor := range graph[node] {
		if !visited[neighbor] {
			if tv.hasCycleDFS(neighbor, graph, visited, recStack) {
				return true
			}
		} else if recStack[neighbor] {
			// Cycle detected
			return true
		}
	}

	recStack[node] = false
	return false
}

// ValidateVariableReferences validates that all variable references in config are defined
func (tv *TemplateValidator) ValidateVariableReferences(template *ServiceTemplate) error {
	if tv == nil {
		return fmt.Errorf("template validator is nil")
	}
	if template == nil {
		return fmt.Errorf("template is nil")
	}

	// Build set of defined variables
	definedVars := make(map[string]bool)
	for _, configVar := range template.ConfigVariables {
		definedVars[configVar.Name] = true
	}

	// Check each service's config overrides
	for i, service := range template.Services {
		if err := tv.validateConfigReferences(service.ConfigOverrides, definedVars, fmt.Sprintf("services[%d]", i)); err != nil {
			return err
		}

		// Note: MemoryLimitMB and port mappings are int values, not variable references.
		// Variable substitution for ports happens at runtime via the runtime variable resolution phase.
	}

	return nil
}

// validateConfigReferences recursively validates variable references in config maps
func (tv *TemplateValidator) validateConfigReferences(config map[string]interface{}, definedVars map[string]bool, path string) error {
	for key, value := range config {
		currentPath := fmt.Sprintf("%s.%s", path, key)

		switch v := value.(type) {
		case string:
			if err := tv.validateStringReference(v, definedVars, currentPath); err != nil {
				return err
			}
		case map[string]interface{}:
			if err := tv.validateConfigReferences(v, definedVars, currentPath); err != nil {
				return err
			}
		case []interface{}:
			for i, item := range v {
				itemPath := fmt.Sprintf("%s[%d]", currentPath, i)
				switch typedItem := item.(type) {
				case string:
					if err := tv.validateStringReference(typedItem, definedVars, itemPath); err != nil {
						return err
					}
				case map[string]interface{}:
					if err := tv.validateConfigReferences(typedItem, definedVars, itemPath); err != nil {
						return err
					}
				}
			}
		}
	}

	return nil
}

// validateStringReference validates variable references in a string
func (tv *TemplateValidator) validateStringReference(input string, definedVars map[string]bool, path string) error {
	// Template variable pattern uses double-brace syntax
	pattern := regexp.MustCompile(`\{\{([A-Z_][A-Z0-9_.]*)\}\}`)

	matches := pattern.FindAllStringSubmatch(input, -1)
	for _, match := range matches {
		if len(match) < 2 {
			continue
		}
		varName := match[1]

		// Check if variable is defined
		if !definedVars[varName] {
			// Allow runtime variables (runtime.PORT, runtime.VLAN)
			if strings.HasPrefix(varName, "runtime.") {
				continue
			}

			// Allow service-scoped runtime variables (ServiceName.PORT_0)
			if strings.Contains(varName, ".PORT_") || strings.Contains(varName, ".VLAN") {
				continue
			}

			return &ValidationError{
				Field:   path,
				Message: fmt.Sprintf("undefined variable reference: {{%s}}", varName),
			}
		}
	}

	return nil
}

// Helper validation methods

func (tv *TemplateValidator) isValidCategory(category TemplateCategory) bool {
	validCategories := []TemplateCategory{
		CategoryPrivacy,
		CategoryAntiCensorship,
		CategoryMessaging,
		CategoryGaming,
		CategorySecurity,
		CategoryNetworking,
	}

	for _, valid := range validCategories {
		if category == valid {
			return true
		}
	}

	return false
}

func (tv *TemplateValidator) validateServiceSpec(service *ServiceSpec, _ int) error {
	if service == nil {
		return &ValidationError{Field: "service", Message: "service spec is nil"}
	}
	if service.ServiceType == "" {
		return &ValidationError{Field: "serviceType", Message: "service type is required"}
	}

	if service.Name == "" {
		return &ValidationError{Field: "name", Message: "service name is required"}
	}

	// Validate port mappings
	for i, portMapping := range service.PortMappings {
		if portMapping.Internal <= 0 || portMapping.Internal > 65535 {
			return &ValidationError{
				Field:   fmt.Sprintf("portMappings[%d].internal", i),
				Message: "internal port must be between 1 and 65535",
			}
		}
		// External port of 0 means auto-allocate, which is valid
		if portMapping.External < 0 || portMapping.External > 65535 {
			return &ValidationError{
				Field:   fmt.Sprintf("portMappings[%d].external", i),
				Message: "external port must be between 0 and 65535 (0 = auto-allocate)",
			}
		}
		if portMapping.Protocol == "" {
			return &ValidationError{
				Field:   fmt.Sprintf("portMappings[%d].protocol", i),
				Message: "protocol is required",
			}
		}
	}

	return nil
}

func (tv *TemplateValidator) validateConfigVariable(configVar *TemplateVariable, _ int) error {
	if configVar == nil {
		return &ValidationError{Field: "configVariable", Message: "config variable is nil"}
	}
	if configVar.Name == "" {
		return &ValidationError{Field: "name", Message: "variable name is required"}
	}

	// Validate variable name format (uppercase, alphanumeric + underscore)
	if !regexp.MustCompile(`^[A-Z_][A-Z0-9_]*$`).MatchString(configVar.Name) {
		return &ValidationError{
			Field:   "name",
			Message: fmt.Sprintf("invalid variable name format: %s (must be uppercase alphanumeric + underscore)", configVar.Name),
		}
	}

	if configVar.Type == "" {
		return &ValidationError{Field: "type", Message: "variable type is required"}
	}

	// Validate type is one of the allowed types
	validTypes := []VariableType{VarTypeString, VarTypeNumber, VarTypeBoolean, VarTypePort}
	isValidType := false
	for _, validType := range validTypes {
		if configVar.Type == validType {
			isValidType = true
			break
		}
	}
	if !isValidType {
		return &ValidationError{
			Field:   "type",
			Message: fmt.Sprintf("invalid variable type: %s", configVar.Type),
		}
	}

	// Validate pattern if provided
	if configVar.ValidationPattern != "" {
		if _, err := regexp.Compile(configVar.ValidationPattern); err != nil {
			return &ValidationError{
				Field:   "validationPattern",
				Message: fmt.Sprintf("invalid regex pattern: %v", err),
			}
		}
	}

	return nil
}

func (tv *TemplateValidator) validateResourceEstimate(resources *ResourceEstimate) error {
	if resources == nil {
		return &ValidationError{Field: "estimatedResources", Message: "resource estimate is nil"}
	}
	if resources.TotalMemoryMB < 0 {
		return &ValidationError{Field: "totalMemoryMB", Message: "memory cannot be negative"}
	}

	if resources.TotalCPUShares < 0 {
		return &ValidationError{Field: "totalCPUShares", Message: "CPU shares cannot be negative"}
	}

	if resources.DiskSpaceMB < 0 {
		return &ValidationError{Field: "diskSpaceMB", Message: "disk space cannot be negative"}
	}

	if resources.NetworkPorts < 0 {
		return &ValidationError{Field: "networkPorts", Message: "network ports cannot be negative"}
	}

	if resources.VLANsRequired < 0 {
		return &ValidationError{Field: "vlansRequired", Message: "VLANs required cannot be negative"}
	}

	return nil
}
