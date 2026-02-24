package templates

import (
	"context"
	"fmt"
	"time"

	"backend/internal/orchestrator/dependencies"
	"backend/internal/orchestrator/lifecycle"

	"backend/internal/events"

	"go.uber.org/zap"
)

// TemplateInstaller orchestrates template installation with dependency ordering and event emission
type TemplateInstaller struct {
	templateService   *TemplateService
	instanceManager   *lifecycle.InstanceManager
	dependencyManager *dependencies.DependencyManager
	eventBus          events.EventBus
	publisher         *events.Publisher
	logger            *zap.Logger
}

// TemplateInstallerConfig holds configuration for the template installer
type TemplateInstallerConfig struct {
	TemplateService   *TemplateService
	InstanceManager   *lifecycle.InstanceManager
	DependencyManager *dependencies.DependencyManager
	EventBus          events.EventBus
	Logger            *zap.Logger
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

	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	return &TemplateInstaller{
		templateService:   cfg.TemplateService,
		instanceManager:   cfg.InstanceManager,
		dependencyManager: cfg.DependencyManager,
		eventBus:          cfg.EventBus,
		publisher:         events.NewPublisher(cfg.EventBus, "template-installer"),
		logger:            logger,
	}, nil
}

// InstallTemplate is the main entry point for template installation
// It performs two-phase variable resolution, dependency-ordered installation, and emits events
func (ti *TemplateInstaller) InstallTemplate(ctx context.Context, req InstallTemplateRequest) (*InstallTemplateResponse, error) { //nolint:gocyclo,maintidx // installation orchestration is inherently complex
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
		ti.logger.Warn("failed to publish install started event", zap.Error(err))
	}

	ti.logger.Info("starting template installation",
		zap.String("template_id", template.ID),
		zap.String("template_name", template.Name),
		zap.String("router_id", req.RouterID),
		zap.Int("total_services", len(template.Services)),
	)

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

	// For multi-service templates, resolve dependency order using DependencyManager
	// TODO: Implement topological sort based on service dependencies in template
	// Build pointer slice from template.Services (preserving order; enhance with topological sort in future)
	serviceOrder := make([]*ServiceSpec, len(template.Services))
	for i := range template.Services {
		serviceOrder[i] = &template.Services[i]
	}

	for i, serviceSpec := range serviceOrder {
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
			ti.logger.Warn("failed to publish progress event", zap.Error(err))
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
			// Rollback: Delete created instances with error handling
			rollbackErr := ti.rollbackInstances(ctx, instanceIDs)
			if rollbackErr != nil {
				ti.logger.Error("rollback failed after config resolution error", zap.Error(rollbackErr))
			}

			// Emit failure event
			_ = ti.publisher.PublishTemplateInstallFailed( //nolint:errcheck // best-effort event publish
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
				true, // Rollback performed
			)

			return nil, fmt.Errorf("failed to resolve config for service %s: %w", serviceSpec.Name, err)
		}

		// Create instance
		instance, err := ti.instanceManager.CreateInstance(ctx, lifecycle.CreateInstanceRequest{
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
			// Rollback: Delete created instances with error handling
			rollbackErr := ti.rollbackInstances(ctx, instanceIDs)
			if rollbackErr != nil {
				ti.logger.Error("rollback failed after instance creation error", zap.Error(rollbackErr))
			}

			// Emit failure event
			_ = ti.publisher.PublishTemplateInstallFailed( //nolint:errcheck // best-effort event publish
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

		ti.logger.Info("service instance created",
			zap.String("template_id", template.ID),
			zap.String("service_name", serviceSpec.Name),
			zap.String("instance_id", instance.ID),
			zap.Int("installed_count", installedCount),
			zap.Int("total_services", len(template.Services)),
		)

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
			ti.logger.Warn("failed to publish progress event", zap.Error(err))
		}
	}

	// Add dependencies between services if DependencyManager is configured
	if ti.dependencyManager != nil { //nolint:nestif // dependency resolution
		// Parse suggested routing rules to create dependencies
		for _, rule := range template.SuggestedRouting {
			// Find target instance ID
			_, ok := serviceMapping[rule.TargetService]
			if !ok {
				ti.logger.Warn("target service not found in service mapping, skipping dependency",
					zap.String("target_service", rule.TargetService),
				)
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
						ti.logger.Warn("failed to add dependency, continuing installation",
							zap.Error(err),
							zap.String("from_instance", instanceIDs[i]),
							zap.String("to_instance", instanceIDs[i-1]),
						)
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
		ti.logger.Warn("failed to publish install completed event", zap.Error(err))
	}

	ti.logger.Info("template installation completed",
		zap.String("template_id", template.ID),
		zap.String("template_name", template.Name),
		zap.String("router_id", req.RouterID),
		zap.Int("installed_count", installedCount),
		zap.Int("total_services", len(template.Services)),
		zap.Duration("duration", completedAt.Sub(startedAt)),
	)

	return &InstallTemplateResponse{
		InstanceIDs:    instanceIDs,
		ServiceMapping: serviceMapping,
		Message:        fmt.Sprintf("Successfully installed %d services from template %s", installedCount, template.Name),
	}, nil
}
