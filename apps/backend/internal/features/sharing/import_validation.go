package sharing

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"backend/generated/ent/serviceinstance"
)

// validateSchemaVersion checks schema version compatibility.
func (s *Service) validateSchemaVersion(version string, result *ImportValidationResult) error {
	parts := strings.Split(version, ".")
	if len(parts) < 2 {
		result.Errors = append(result.Errors, ValidationError{
			Stage:   "schema",
			Code:    "S602",
			Message: fmt.Sprintf("invalid schema version format: %s", version),
		})
		return &ImportError{Code: "S602", Message: "invalid schema version"}
	}

	major := parts[0]
	if major != "1" {
		result.Errors = append(result.Errors, ValidationError{
			Stage:   "schema",
			Code:    "S602",
			Message: fmt.Sprintf("incompatible schema major version: %s (expected 1.x)", version),
		})
		return &ImportError{Code: "S602", Message: "incompatible schema version"}
	}

	return nil
}

// validateSyntax validates JSON structure and required fields.
func (s *Service) validateSyntax(pkg *ServiceExportPackage, result *ImportValidationResult) {
	if pkg.ServiceType == "" {
		result.Errors = append(result.Errors, ValidationError{
			Stage:   "syntax",
			Field:   "service_type",
			Code:    "V400",
			Message: "service_type is required",
		})
	}

	if pkg.ServiceName == "" {
		result.Errors = append(result.Errors, ValidationError{
			Stage:   "syntax",
			Field:   "service_name",
			Code:    "V400",
			Message: "service_name is required",
		})
	}

	if pkg.Config == nil {
		result.Errors = append(result.Errors, ValidationError{
			Stage:   "syntax",
			Field:   "config",
			Code:    "V400",
			Message: "config is required",
		})
	}
}

// validateCrossResource validates config against feature manifest.
func (s *Service) validateCrossResource(_ context.Context, pkg *ServiceExportPackage, result *ImportValidationResult) {
	manifest, err := s.featureRegistry.GetManifest(pkg.ServiceType)
	if err != nil {
		result.Errors = append(result.Errors, ValidationError{
			Stage:   "cross-resource",
			Code:    "S600",
			Message: fmt.Sprintf("unknown service type: %s", pkg.ServiceType),
		})
		return
	}

	// Validate config against schema if present
	if len(manifest.ConfigSchema) > 0 {
		// In a real implementation, use a JSON schema validator here
		result.Warnings = append(result.Warnings, ValidationWarning{
			Stage:   "cross-resource",
			Message: "Config schema validation not yet implemented",
		})
	}
}

// validateDependencies checks if required services are installed.
func (s *Service) validateDependencies(_ context.Context, pkg *ServiceExportPackage, result *ImportValidationResult) error { //nolint:unparam // error return kept for interface compatibility
	// Check if the service binary exists
	manifest, err := s.featureRegistry.GetManifest(pkg.ServiceType)
	if err != nil {
		return nil //nolint:nilerr // Already handled in cross-resource validation, safe to ignore here
	}

	// Check required packages (in real implementation, query system packages)
	if len(manifest.RequiredPackages) > 0 {
		result.Warnings = append(result.Warnings, ValidationWarning{
			Stage:   "dependency",
			Message: fmt.Sprintf("Service requires packages: %s", strings.Join(manifest.RequiredPackages, ", ")),
		})
	}

	return nil
}

// detectConflicts checks for conflicting service instances.
func (s *Service) detectConflicts(ctx context.Context, pkg *ServiceExportPackage, options ImportOptions, result *ImportValidationResult) error {
	// Query for existing instances with the same name
	instances, err := s.entClient.ServiceInstance.Query().
		Where(
			serviceinstance.InstanceNameEQ(pkg.ServiceName),
			serviceinstance.FeatureIDEQ(pkg.ServiceType),
		).
		All(ctx)

	if err != nil {
		return fmt.Errorf("failed to query for conflicts: %w", err)
	}

	if len(instances) > 0 {
		result.ConflictingInstances = instances
		result.Warnings = append(result.Warnings, ValidationWarning{
			Stage:   "conflict",
			Message: fmt.Sprintf("Found %d conflicting instance(s) with name '%s'", len(instances), pkg.ServiceName),
		})

		// Require conflict resolution if not specified
		if options.ConflictResolution == "" {
			result.RequiresUserInput = true
			result.Errors = append(result.Errors, ValidationError{
				Stage:   "conflict",
				Code:    "V400",
				Message: "Conflict resolution strategy required (SKIP/OVERWRITE/RENAME)",
			})
		}
	}

	return nil
}

// validateCapabilities checks if router supports required features.
func (s *Service) validateCapabilities(pkg *ServiceExportPackage, result *ImportValidationResult) {
	if s.routerPort != nil && s.routerPort.IsConnected() {
		// Get router capabilities
		_ = s.routerPort.Capabilities()

		// Check if routing rules require capabilities not available
		// In a real implementation, check specific capabilities
		if len(pkg.RoutingRules) > 0 {
			// For now, assume mangle support is available
			// Future: Add capabilities.SupportsFirewallMangle check
			result.Warnings = append(result.Warnings, ValidationWarning{
				Stage:   "capability",
				Message: "Routing rules will be applied if router supports firewall mangle",
			})
		}
	}
}

// performDryRun simulates the import without making changes.
func (s *Service) performDryRun(_ context.Context, pkg *ServiceExportPackage, _ ImportOptions, result *ImportValidationResult) error { //nolint:unparam // error return kept for interface compatibility
	result.Warnings = append(result.Warnings, ValidationWarning{
		Stage:   "dry-run",
		Message: "Dry-run mode: no changes will be made",
	})

	// Validate config can be serialized
	if _, err := json.Marshal(pkg.Config); err != nil {
		result.Errors = append(result.Errors, ValidationError{
			Stage:   "dry-run",
			Code:    "V400",
			Message: fmt.Sprintf("config contains invalid JSON: %v", err),
		})
	}

	return nil
}
