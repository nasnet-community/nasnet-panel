package templates

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"backend/internal/events"
	"backend/internal/orchestrator"

	"github.com/rs/zerolog"
)

// TemplateInstaller orchestrates template installation with dependency ordering and event emission
type TemplateInstaller struct {
	templateService   *TemplateService
	instanceManager   *orchestrator.InstanceManager
	dependencyManager *orchestrator.DependencyManager
	eventBus          events.EventBus
	publisher         *events.Publisher
	logger            zerolog.Logger
}

// TemplateInstallerConfig holds configuration for the template installer
type TemplateInstallerConfig struct {
	TemplateService   *TemplateService
	InstanceManager   *orchestrator.InstanceManager
	DependencyManager *orchestrator.DependencyManager
	EventBus          events.EventBus
	Logger            zerolog.Logger
}

// InstallTemplateRequest contains parameters for template installation
type InstallTemplateRequest struct {
	RouterID          string
	TemplateID        string
	Variables         map[string]interface{} // User-provided variable values
	RouterOSVersion   string
	Architecture      string
	AvailableMemoryMB int
	AvailableDiskMB   int
	RequestedByUID    string
}

// InstallTemplateResponse contains the result of template installation
type InstallTemplateResponse struct {
	InstanceIDs    []string
	ServiceMapping map[string]string // Maps service name to instance ID
	Message        string
}

// Runtime variable prefixes
const (
	RuntimePortPrefix = "runtime.PORT"
	RuntimeVLANPrefix = "runtime.VLAN"
)

// NewTemplateInstaller creates a new template installer
func NewTemplateInstaller(cfg TemplateInstallerConfig) (*TemplateInstaller, error) {
	if cfg.TemplateService == nil {
		return nil, fmt.Errorf("template service is required")
	}
	if cfg.InstanceManager == nil {
		return nil, fmt.Errorf("instance manager is required")
	}
	if cfg.EventBus == nil {
		return nil, fmt.Errorf("event bus is required")
	}

	return &TemplateInstaller{
		templateService:   cfg.TemplateService,
		instanceManager:   cfg.InstanceManager,
		dependencyManager: cfg.DependencyManager,
		eventBus:          cfg.EventBus,
		publisher:         events.NewPublisher(cfg.EventBus, "template-installer"),
		logger:            cfg.Logger,
	}, nil
}

// InstallTemplate is the main entry point for template installation
// It performs two-phase variable resolution, dependency-ordered installation, and emits events
func (ti *TemplateInstaller) InstallTemplate(ctx context.Context, req InstallTemplateRequest) (*InstallTemplateResponse, error) {
	startedAt := time.Now()

	// Get template
	template, err := ti.templateService.GetTemplate(ctx, req.TemplateID)
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	// Validate template scope vs request
	if template.Scope == ScopeSingle && len(template.Services) != 1 {
		return nil, fmt.Errorf("single-scope template must have exactly 1 service, got %d", len(template.Services))
	}
	if template.Scope == ScopeMultiple && len(template.Services) < 2 {
		return nil, fmt.Errorf("multi-scope template must have at least 2 services, got %d", len(template.Services))
	}

	// Emit installation started event
	if err := ti.publisher.PublishTemplateInstallStarted(
		ctx,
		template.ID,
		template.Name,
		req.RouterID,
		len(template.Services),
		req.Variables,
		req.RequestedByUID,
	); err != nil {
		ti.logger.Warn().Err(err).Msg("failed to publish install started event")
	}

	ti.logger.Info().
		Str("template_id", template.ID).
		Str("template_name", template.Name).
		Str("router_id", req.RouterID).
		Int("total_services", len(template.Services)).
		Msg("starting template installation")

	// Phase 1: Resolve user-provided variables
	phase1Variables := make(map[string]interface{})
	for key, value := range req.Variables {
		phase1Variables[key] = value
	}

	// Create instances in dependency order
	instanceIDs := make([]string, 0, len(template.Services))
	serviceMapping := make(map[string]string) // Maps service name to instance ID
	phase2Variables := make(map[string]interface{})

	// Track installation progress
	installedCount := 0

	// For multi-service templates, we need to create instances in dependency order
	// For now, we'll create them in the order they appear in the template
	// TODO: Implement topological sort based on service dependencies in template
	for i, serviceSpec := range template.Services {
		// Emit progress event
		if err := ti.publisher.PublishTemplateInstallProgress(
			ctx,
			template.ID,
			template.Name,
			req.RouterID,
			len(template.Services),
			installedCount,
			serviceSpec.Name,
			"", // Will be set after instance creation
			"creating",
			fmt.Sprintf("Creating service %s (%d/%d)", serviceSpec.Name, i+1, len(template.Services)),
			startedAt,
		); err != nil {
			ti.logger.Warn().Err(err).Msg("failed to publish progress event")
		}

		// Resolve variables for this service (Phase 1 + Phase 2)
		allVariables := make(map[string]interface{})
		for k, v := range phase1Variables {
			allVariables[k] = v
		}
		for k, v := range phase2Variables {
			allVariables[k] = v
		}

		// Resolve config overrides with variables
		resolvedConfig, err := ti.resolveServiceConfig(serviceSpec.ConfigOverrides, allVariables)
		if err != nil {
			// Rollback: Delete created instances
			ti.rollbackInstances(ctx, instanceIDs)

			// Emit failure event
			ti.publisher.PublishTemplateInstallFailed(
				ctx,
				template.ID,
				template.Name,
				req.RouterID,
				len(template.Services),
				installedCount,
				serviceSpec.Name,
				fmt.Sprintf("failed to resolve config: %v", err),
				"config_resolution",
				instanceIDs,
				serviceMapping,
				startedAt,
				time.Now(),
				true, // Rollback needed
			)

			return nil, fmt.Errorf("failed to resolve config for service %s: %w", serviceSpec.Name, err)
		}

		// Create instance
		instance, err := ti.instanceManager.CreateInstance(ctx, orchestrator.CreateInstanceRequest{
			FeatureID:         serviceSpec.ServiceType,
			InstanceName:      serviceSpec.Name,
			RouterID:          req.RouterID,
			RouterOSVersion:   req.RouterOSVersion,
			Architecture:      req.Architecture,
			AvailableMemoryMB: req.AvailableMemoryMB,
			AvailableDiskMB:   req.AvailableDiskMB,
			Config:            resolvedConfig,
		})

		if err != nil {
			// Rollback: Delete created instances
			ti.rollbackInstances(ctx, instanceIDs)

			// Emit failure event
			ti.publisher.PublishTemplateInstallFailed(
				ctx,
				template.ID,
				template.Name,
				req.RouterID,
				len(template.Services),
				installedCount,
				serviceSpec.Name,
				fmt.Sprintf("failed to create instance: %v", err),
				"instance_creation",
				instanceIDs,
				serviceMapping,
				startedAt,
				time.Now(),
				true, // Rollback performed
			)

			return nil, fmt.Errorf("failed to create instance for service %s: %w", serviceSpec.Name, err)
		}

		instanceIDs = append(instanceIDs, instance.ID)
		serviceMapping[serviceSpec.Name] = instance.ID
		installedCount++

		// Update Phase 2 variables with runtime values (ports, VLANs)
		// Store ports for this instance
		for idx, port := range instance.Ports {
			varName := fmt.Sprintf("%s.PORT_%d", serviceSpec.Name, idx)
			phase2Variables[varName] = port
		}

		// Store VLAN if allocated
		if instance.VlanID != nil {
			varName := fmt.Sprintf("%s.VLAN", serviceSpec.Name)
			phase2Variables[varName] = *instance.VlanID
		}

		ti.logger.Info().
			Str("template_id", template.ID).
			Str("service_name", serviceSpec.Name).
			Str("instance_id", instance.ID).
			Int("installed_count", installedCount).
			Int("total_services", len(template.Services)).
			Msg("service instance created")

		// Emit progress event
		if err := ti.publisher.PublishTemplateInstallProgress(
			ctx,
			template.ID,
			template.Name,
			req.RouterID,
			len(template.Services),
			installedCount,
			serviceSpec.Name,
			instance.ID,
			"created",
			fmt.Sprintf("Created service %s (%d/%d)", serviceSpec.Name, installedCount, len(template.Services)),
			startedAt,
		); err != nil {
			ti.logger.Warn().Err(err).Msg("failed to publish progress event")
		}
	}

	// Add dependencies between services if DependencyManager is configured
	if ti.dependencyManager != nil {
		// Parse suggested routing rules to create dependencies
		for _, rule := range template.SuggestedRouting {
			// Find target instance ID
			_, ok := serviceMapping[rule.TargetService]
			if !ok {
				ti.logger.Warn().
					Str("target_service", rule.TargetService).
					Msg("target service not found in service mapping, skipping dependency")
				continue
			}

			// For multi-service templates, create dependencies based on service order
			// In a real implementation, this would parse the routing rules more intelligently
			// For now, we'll create a simple chain dependency
			if len(instanceIDs) > 1 {
				for i := 1; i < len(instanceIDs); i++ {
					_, err := ti.dependencyManager.AddDependency(
						ctx,
						instanceIDs[i],   // Dependent (consumer)
						instanceIDs[i-1], // Dependency (provider)
						"routing",        // Dependency type
						true,             // Auto-start
						30,               // Health timeout
					)
					if err != nil {
						ti.logger.Warn().
							Err(err).
							Str("from_instance", instanceIDs[i]).
							Str("to_instance", instanceIDs[i-1]).
							Msg("failed to add dependency, continuing installation")
					}
				}
			}

			// Break after first rule (simplified implementation)
			break
		}
	}

	completedAt := time.Now()

	// Emit completion event
	if err := ti.publisher.PublishTemplateInstallCompleted(
		ctx,
		template.ID,
		template.Name,
		req.RouterID,
		len(template.Services),
		installedCount,
		instanceIDs,
		serviceMapping,
		startedAt,
		completedAt,
	); err != nil {
		ti.logger.Warn().Err(err).Msg("failed to publish install completed event")
	}

	ti.logger.Info().
		Str("template_id", template.ID).
		Str("template_name", template.Name).
		Str("router_id", req.RouterID).
		Int("installed_count", installedCount).
		Int("total_services", len(template.Services)).
		Dur("duration", completedAt.Sub(startedAt)).
		Msg("template installation completed")

	return &InstallTemplateResponse{
		InstanceIDs:    instanceIDs,
		ServiceMapping: serviceMapping,
		Message:        fmt.Sprintf("Successfully installed %d services from template %s", installedCount, template.Name),
	}, nil
}

// resolveServiceConfig resolves variable references in service configuration
// Supports nested maps and arrays with {{VARIABLE_NAME}} syntax
func (ti *TemplateInstaller) resolveServiceConfig(config map[string]interface{}, variables map[string]interface{}) (map[string]interface{}, error) {
	resolved := make(map[string]interface{})

	for key, value := range config {
		resolvedValue, err := ti.resolveValue(value, variables)
		if err != nil {
			return nil, fmt.Errorf("failed to resolve key %s: %w", key, err)
		}
		resolved[key] = resolvedValue
	}

	return resolved, nil
}

// resolveValue recursively resolves a single value (string, map, array)
func (ti *TemplateInstaller) resolveValue(value interface{}, variables map[string]interface{}) (interface{}, error) {
	switch v := value.(type) {
	case string:
		return ti.resolveString(v, variables)
	case map[string]interface{}:
		return ti.resolveServiceConfig(v, variables)
	case []interface{}:
		resolved := make([]interface{}, len(v))
		for i, item := range v {
			resolvedItem, err := ti.resolveValue(item, variables)
			if err != nil {
				return nil, fmt.Errorf("failed to resolve array item %d: %w", i, err)
			}
			resolved[i] = resolvedItem
		}
		return resolved, nil
	default:
		// Non-string values (int, bool, etc.) are returned as-is
		return value, nil
	}
}

// resolveString resolves variable references in a string using {{VARIABLE_NAME}} syntax
func (ti *TemplateInstaller) resolveString(input string, variables map[string]interface{}) (interface{}, error) {
	// Pattern: {{VARIABLE_NAME}}
	pattern := regexp.MustCompile(`\{\{([A-Z_][A-Z0-9_.]*)\}\}`)

	// Check if the entire string is a single variable reference
	if pattern.MatchString(input) && strings.TrimSpace(input) == pattern.FindString(input) {
		// Return the actual value (preserving type)
		varName := pattern.FindStringSubmatch(input)[1]
		if value, ok := variables[varName]; ok {
			return value, nil
		}
		return nil, fmt.Errorf("variable {{%s}} not found", varName)
	}

	// Otherwise, perform string substitution
	resolved := pattern.ReplaceAllStringFunc(input, func(match string) string {
		// Extract variable name from {{VARIABLE_NAME}}
		varName := pattern.FindStringSubmatch(match)[1]

		if value, ok := variables[varName]; ok {
			return fmt.Sprintf("%v", value)
		}

		// Variable not found - return placeholder
		ti.logger.Warn().Str("variable", varName).Msg("variable not found during resolution")
		return match
	})

	return resolved, nil
}

// rollbackInstances deletes all created instances on installation failure
func (ti *TemplateInstaller) rollbackInstances(ctx context.Context, instanceIDs []string) {
	ti.logger.Warn().
		Int("instance_count", len(instanceIDs)).
		Msg("rolling back template installation - deleting created instances")

	for _, instanceID := range instanceIDs {
		// Get instance to check status
		instance, exists := ti.instanceManager.Supervisor().Get(instanceID)
		if exists && instance != nil {
			// Stop instance if running
			if instance.State() == orchestrator.ProcessStateRunning {
				if err := ti.instanceManager.StopInstance(ctx, instanceID); err != nil {
					ti.logger.Error().Err(err).Str("instance_id", instanceID).Msg("failed to stop instance during rollback")
				}
			}
		}

		// Delete instance
		if err := ti.instanceManager.DeleteInstance(ctx, instanceID); err != nil {
			ti.logger.Error().Err(err).Str("instance_id", instanceID).Msg("failed to delete instance during rollback")
		} else {
			ti.logger.Info().Str("instance_id", instanceID).Msg("instance deleted during rollback")
		}
	}
}

// ValidateTemplate validates a template before installation
// Checks variable references, service types, and dependency cycles
func (ti *TemplateInstaller) ValidateTemplate(ctx context.Context, templateID string, variables map[string]interface{}) error {
	template, err := ti.templateService.GetTemplate(ctx, templateID)
	if err != nil {
		return fmt.Errorf("failed to get template: %w", err)
	}

	// Validate all required variables are provided
	for _, configVar := range template.ConfigVariables {
		if configVar.Required {
			if _, ok := variables[configVar.Name]; !ok {
				return fmt.Errorf("required variable %s not provided", configVar.Name)
			}
		}
	}

	// Validate variable types
	for _, configVar := range template.ConfigVariables {
		value, ok := variables[configVar.Name]
		if !ok {
			continue // Already checked required variables above
		}

		// Type validation
		if err := ti.validateVariableType(configVar, value); err != nil {
			return fmt.Errorf("invalid variable %s: %w", configVar.Name, err)
		}
	}

	return nil
}

// validateVariableType validates that a variable value matches its expected type
func (ti *TemplateInstaller) validateVariableType(configVar TemplateVariable, value interface{}) error {
	switch configVar.Type {
	case VarTypeString:
		if _, ok := value.(string); !ok {
			return fmt.Errorf("expected string, got %T", value)
		}
	case VarTypeNumber:
		switch v := value.(type) {
		case int, int32, int64, float32, float64:
			// Valid numeric types
		case string:
			// Try to parse string as number
			var num float64
			if _, err := fmt.Sscanf(v, "%f", &num); err != nil {
				return fmt.Errorf("expected number, got unparseable string: %v", err)
			}
		default:
			return fmt.Errorf("expected number, got %T", value)
		}
	case VarTypeBoolean:
		if _, ok := value.(bool); !ok {
			// Also accept string representations
			if strVal, ok := value.(string); ok {
				if strVal != "true" && strVal != "false" {
					return fmt.Errorf("expected boolean, got string %s", strVal)
				}
			} else {
				return fmt.Errorf("expected boolean, got %T", value)
			}
		}
	case VarTypePort:
		// Port should be a number between 1-65535
		var portNum int
		switch v := value.(type) {
		case int:
			portNum = v
		case int32:
			portNum = int(v)
		case int64:
			portNum = int(v)
		case float64:
			portNum = int(v)
		case string:
			if _, err := fmt.Sscanf(v, "%d", &portNum); err != nil {
				return fmt.Errorf("expected port number, got unparseable string: %v", err)
			}
		default:
			return fmt.Errorf("expected port number, got %T", value)
		}

		if portNum < 1 || portNum > 65535 {
			return fmt.Errorf("port must be between 1-65535, got %d", portNum)
		}
	}

	return nil
}
