package sharing

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
)

// ApplyImport applies a validated import package.
func (s *Service) ApplyImport(ctx context.Context, pkg *ServiceExportPackage, options ImportOptions) (*ent.ServiceInstance, error) { //nolint:gocyclo // import operation flow
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
			_ = tx.Rollback() //nolint:errcheck // best-effort rollback
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
	if len(validationResult.ConflictingInstances) > 0 { //nolint:nestif // conflict resolution logic
		conflictInstance := validationResult.ConflictingInstances[0]

		switch options.ConflictResolution {
		case ConflictSkip:
			// Skip import, return existing instance
			_ = tx.Rollback() //nolint:errcheck // best-effort rollback
			return conflictInstance, nil

		case ConflictOverwrite:
			// Update existing instance
			instance, err = tx.ServiceInstance.UpdateOneID(conflictInstance.ID).
				SetConfig(config).
				SetBinaryVersion(pkg.BinaryVersion).
				SetUpdatedAt(time.Now()).
				Save(ctx)
			if err != nil {
				_ = tx.Rollback() //nolint:errcheck // best-effort rollback
				return nil, fmt.Errorf("failed to overwrite instance: %w", err)
			}

		case ConflictRename:
			// Create new instance with renamed name
			newName := fmt.Sprintf("%s (imported)", pkg.ServiceName)
			instance, err = s.createNewInstance(ctx, tx, pkg, config, newName)
			if err != nil {
				_ = tx.Rollback() //nolint:errcheck // best-effort rollback
				return nil, err
			}
		}
	} else {
		// No conflict, create new instance
		instance, err = s.createNewInstance(ctx, tx, pkg, config, pkg.ServiceName)
		if err != nil {
			_ = tx.Rollback() //nolint:errcheck // best-effort rollback
			return nil, err
		}
	}

	// Apply routing rules if included
	if len(pkg.RoutingRules) > 0 {
		if err := s.applyRoutingRules(ctx, instance.ID, pkg.RoutingRules, options.DeviceFilter); err != nil {
			_ = tx.Rollback() //nolint:errcheck // best-effort rollback
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
