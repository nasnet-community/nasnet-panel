package sharing

import (
	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/events"
	"backend/internal/router"
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// ImportValidationResult contains the validation results for an import
type ImportValidationResult struct {
	Valid              bool                 `json:"valid"`
	Errors             []ValidationError    `json:"errors"`
	Warnings           []ValidationWarning  `json:"warnings"`
	RedactedFields     []string             `json:"redactedFields,omitempty"`
	ConflictingInstances []*ent.ServiceInstance `json:"conflictingInstances,omitempty"`
	RequiresUserInput  bool                 `json:"requiresUserInput"`
}

// ValidationError represents a blocking validation error
type ValidationError struct {
	Stage   string `json:"stage"`   // schema, syntax, cross-resource, dependency, conflict, capability, dry-run
	Field   string `json:"field,omitempty"`
	Code    string `json:"code"`    // V400, V403, S602, etc.
	Message string `json:"message"`
}

// ValidationWarning represents a non-blocking warning
type ValidationWarning struct {
	Stage   string `json:"stage"`
	Message string `json:"message"`
}

// ConflictResolutionStrategy defines how to handle conflicts
type ConflictResolutionStrategy string

const (
	ConflictSkip      ConflictResolutionStrategy = "SKIP"
	ConflictOverwrite ConflictResolutionStrategy = "OVERWRITE"
	ConflictRename    ConflictResolutionStrategy = "RENAME"
)

// ImportOptions configures import behavior
type ImportOptions struct {
	UserID               string
	ConflictResolution   ConflictResolutionStrategy
	RedactedFieldValues  map[string]interface{} // User-provided values for redacted fields
	DeviceFilter         []string               // MAC addresses to filter routing rules
	DryRun               bool
}

// Import validates an import package without applying it
func (s *SharingService) Import(ctx context.Context, pkg *ServiceExportPackage, options ImportOptions) (*ImportValidationResult, error) {
	result := &ImportValidationResult{
		Valid:    true,
		Errors:   []ValidationError{},
		Warnings: []ValidationWarning{},
	}

	// Stage 1: Schema version validation
	if err := s.validateSchemaVersion(pkg.SchemaVersion, result); err != nil {
		return result, err
	}

	// Stage 2: Syntax validation
	s.validateSyntax(pkg, result)

	// Stage 3: Cross-resource validation
	s.validateCrossResource(ctx, pkg, result)

	// Stage 4: Dependency validation
	if err := s.validateDependencies(ctx, pkg, result); err != nil {
		return result, err
	}

	// Stage 5: Conflict detection
	if err := s.detectConflicts(ctx, pkg, options, result); err != nil {
		return result, err
	}

	// Stage 6: Capability validation
	if err := s.validateCapabilities(pkg, result); err != nil {
		return result, err
	}

	// Stage 7: Dry-run validation
	if options.DryRun {
		if err := s.performDryRun(ctx, pkg, options, result); err != nil {
			return result, err
		}
	}

	// Check for redacted fields
	if pkg.IncludesSecrets {
		result.RedactedFields = s.findRedactedFields(pkg.Config)
		if len(result.RedactedFields) > 0 {
			result.RequiresUserInput = true
			result.Valid = false
			result.Errors = append(result.Errors, ValidationError{
				Stage:   "syntax",
				Code:    "V400",
				Message: fmt.Sprintf("Redacted fields require user input: %s", strings.Join(result.RedactedFields, ", ")),
			})
		}
	}

	// Mark as invalid if errors exist
	if len(result.Errors) > 0 {
		result.Valid = false
	}

	return result, nil
}

// ApplyImport applies a validated import package
func (s *SharingService) ApplyImport(ctx context.Context, pkg *ServiceExportPackage, options ImportOptions) (*ent.ServiceInstance, error) {
	// Re-validate before applying
	validationResult, err := s.Import(ctx, pkg, options)
	if err != nil {
		return nil, err
	}

	if !validationResult.Valid {
		return nil, &ImportError{
			Code:    "V400",
			Message: fmt.Sprintf("validation failed with %d errors", len(validationResult.Errors)),
			Details: validationResult.Errors,
		}
	}

	// Start transaction for rollback support
	tx, err := s.entClient.Tx(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", err)
	}

	// Rollback on panic or error
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// Merge redacted field values
	config := pkg.Config
	for field, value := range options.RedactedFieldValues {
		config[field] = value
	}

	// Handle conflict resolution
	var instance *ent.ServiceInstance
	if len(validationResult.ConflictingInstances) > 0 {
		conflictInstance := validationResult.ConflictingInstances[0]

		switch options.ConflictResolution {
		case ConflictSkip:
			// Skip import, return existing instance
			tx.Rollback()
			return conflictInstance, nil

		case ConflictOverwrite:
			// Update existing instance
			instance, err = tx.ServiceInstance.UpdateOneID(conflictInstance.ID).
				SetConfig(config).
				SetBinaryVersion(pkg.BinaryVersion).
				SetUpdatedAt(time.Now()).
				Save(ctx)
			if err != nil {
				tx.Rollback()
				return nil, fmt.Errorf("failed to overwrite instance: %w", err)
			}

		case ConflictRename:
			// Create new instance with renamed name
			newName := fmt.Sprintf("%s (imported)", pkg.ServiceName)
			instance, err = s.createNewInstance(ctx, tx, pkg, config, newName)
			if err != nil {
				tx.Rollback()
				return nil, err
			}
		}
	} else {
		// No conflict, create new instance
		instance, err = s.createNewInstance(ctx, tx, pkg, config, pkg.ServiceName)
		if err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	// Apply routing rules if included
	if pkg.RoutingRules != nil && len(pkg.RoutingRules) > 0 {
		if err := s.applyRoutingRules(ctx, instance.ID, pkg.RoutingRules, options.DeviceFilter); err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to apply routing rules: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Publish ServiceConfigImportedEvent
	event := NewServiceConfigImportedEvent(
		instance.ID,
		pkg.ServiceType,
		pkg.ServiceName,
		string(options.ConflictResolution),
		len(pkg.RoutingRules),
		options.UserID,
		"sharing-service",
	)
	if err := s.eventBus.Publish(ctx, event); err != nil {
		// Log but don't fail - event publishing is non-critical
		fmt.Printf("Warning: failed to publish ServiceConfigImportedEvent: %v\n", err)
	}

	// Audit log the import
	if s.auditService != nil && options.UserID != "" {
		if err := s.auditService.LogImport(ctx, instance.ID, options.UserID); err != nil {
			// Log but don't fail - audit logging is non-critical
			fmt.Printf("Warning: failed to log import audit: %v\n", err)
		}
	}

	return instance, nil
}

// validateSchemaVersion checks schema version compatibility
func (s *SharingService) validateSchemaVersion(version string, result *ImportValidationResult) error {
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

// validateSyntax validates JSON structure and required fields
func (s *SharingService) validateSyntax(pkg *ServiceExportPackage, result *ImportValidationResult) {
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

// validateCrossResource validates config against feature manifest
func (s *SharingService) validateCrossResource(ctx context.Context, pkg *ServiceExportPackage, result *ImportValidationResult) {
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

// validateDependencies checks if required services are installed
func (s *SharingService) validateDependencies(ctx context.Context, pkg *ServiceExportPackage, result *ImportValidationResult) error {
	// Check if the service binary exists
	manifest, err := s.featureRegistry.GetManifest(pkg.ServiceType)
	if err != nil {
		return nil // Already handled in cross-resource validation
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

// detectConflicts checks for conflicting service instances
func (s *SharingService) detectConflicts(ctx context.Context, pkg *ServiceExportPackage, options ImportOptions, result *ImportValidationResult) error {
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

// validateCapabilities checks if router supports required features
func (s *SharingService) validateCapabilities(pkg *ServiceExportPackage, result *ImportValidationResult) error {
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

	return nil
}

// performDryRun simulates the import without making changes
func (s *SharingService) performDryRun(ctx context.Context, pkg *ServiceExportPackage, options ImportOptions, result *ImportValidationResult) error {
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

// findRedactedFields returns list of fields that have redacted values
func (s *SharingService) findRedactedFields(config map[string]interface{}) []string {
	var redacted []string
	for key, value := range config {
		if strVal, ok := value.(string); ok {
			if strVal == "***REDACTED***" {
				redacted = append(redacted, key)
			}
		}
	}
	return redacted
}

// createNewInstance creates a new service instance in a transaction
func (s *SharingService) createNewInstance(ctx context.Context, tx *ent.Tx, pkg *ServiceExportPackage, config map[string]interface{}, name string) (*ent.ServiceInstance, error) {
	instance, err := tx.ServiceInstance.Create().
		SetFeatureID(pkg.ServiceType).
		SetInstanceName(name).
		SetRouterID("default-router"). // TODO: Get from context
		SetConfig(config).
		SetBinaryVersion(pkg.BinaryVersion).
		SetStatus(serviceinstance.StatusInstalled).
		Save(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to create instance: %w", err)
	}

	return instance, nil
}

// applyRoutingRules applies routing rules to the router, filtering by device MAC addresses
func (s *SharingService) applyRoutingRules(ctx context.Context, instanceID string, rules []RoutingRule, deviceFilter []string) error {
	// Build MAC address filter set
	filterSet := make(map[string]bool)
	for _, mac := range deviceFilter {
		filterSet[strings.ToLower(mac)] = true
	}

	for _, rule := range rules {
		// Filter by source MAC if filter is specified
		if len(filterSet) > 0 {
			// Extract MAC from src-address comment or other field
			// In real implementation, parse rule for MAC matching
			// For now, skip if device filter is specified but no MAC match
			if rule.SrcAddress != "" {
				macLower := strings.ToLower(rule.SrcAddress)
				if !filterSet[macLower] {
					continue // Skip this rule
				}
			}
		}

		// Apply rule via RouterPort
		cmd := router.Command{
			Path:   "/ip/firewall/mangle",
			Action: "add",
			Args: map[string]string{
				"chain":            rule.Chain,
				"action":           rule.Action,
				"src-address":      rule.SrcAddress,
				"dst-address":      rule.DstAddress,
				"protocol":         rule.Protocol,
				"comment":          fmt.Sprintf("nasnet-service-%s", instanceID),
				"routing-mark":     rule.RoutingMark,
				"new-routing-mark": rule.NewRoutingMark,
			},
		}

		if _, err := s.routerPort.ExecuteCommand(ctx, cmd); err != nil {
			return fmt.Errorf("failed to apply routing rule: %w", err)
		}
	}

	return nil
}

// ImportError represents an error during import operation
type ImportError struct {
	Code    string
	Message string
	Details []ValidationError
}

func (e *ImportError) Error() string {
	if len(e.Details) > 0 {
		return fmt.Sprintf("[%s] %s (details: %d errors)", e.Code, e.Message, len(e.Details))
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// ServiceConfigImportedEvent is emitted when a service config is imported
type ServiceConfigImportedEvent struct {
	events.BaseEvent
	InstanceID           string `json:"instanceId"`
	ServiceType          string `json:"serviceType"`
	ServiceName          string `json:"serviceName"`
	ConflictResolution   string `json:"conflictResolution,omitempty"`
	RoutingRulesApplied  int    `json:"routingRulesApplied"`
	ImportedByUserID     string `json:"importedByUserId,omitempty"`
}

// Payload returns the JSON-serialized event payload
func (e *ServiceConfigImportedEvent) Payload() ([]byte, error) {
	return json.Marshal(e)
}

// NewServiceConfigImportedEvent creates a new ServiceConfigImportedEvent
func NewServiceConfigImportedEvent(
	instanceID, serviceType, serviceName, conflictResolution string,
	routingRulesApplied int,
	importedByUserID, source string,
) *ServiceConfigImportedEvent {
	return &ServiceConfigImportedEvent{
		BaseEvent:           events.NewBaseEvent("service.config.imported", events.PriorityCritical, source),
		InstanceID:          instanceID,
		ServiceType:         serviceType,
		ServiceName:         serviceName,
		ConflictResolution:  conflictResolution,
		RoutingRulesApplied: routingRulesApplied,
		ImportedByUserID:    importedByUserID,
	}
}
