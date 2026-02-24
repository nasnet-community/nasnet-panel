package boot

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"strings"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/events"
	"backend/internal/storage"
)

// ValidationSummary contains the results of boot-time validation.
type ValidationSummary struct {
	TotalChecked   int      // Total instances checked
	FailedCount    int      // Number of instances that failed validation
	FailedServices []string // Feature IDs of failed instances
}

// Validator validates instance binaries on container startup.
// It runs BEFORE the Supervisor starts to ensure all instances have valid binaries.
//
//nolint:revive // stuttering name kept for clarity as the primary exported type in the boot package
type BootValidator struct {
	db           *ent.Client
	pathResolver storage.PathResolverPort
	publisher    *events.Publisher
	logger       *zap.Logger
}

// ValidatorConfig holds configuration for the BootValidator.
//
//nolint:revive // stuttering name kept for clarity as the config type paired with BootValidator
type BootValidatorConfig struct {
	DB           *ent.Client
	PathResolver storage.PathResolverPort
	EventBus     events.EventBus
	Logger       *zap.Logger
}

// NewBootValidator creates a new BootValidator.
func NewBootValidator(cfg BootValidatorConfig) (*BootValidator, error) {
	if cfg.DB == nil {
		return nil, fmt.Errorf("database client is required")
	}
	if cfg.PathResolver == nil {
		return nil, fmt.Errorf("path resolver is required")
	}
	if cfg.EventBus == nil {
		return nil, fmt.Errorf("event bus is required")
	}

	publisher := events.NewPublisher(cfg.EventBus, "boot-validator")

	return &BootValidator{
		db:           cfg.DB,
		pathResolver: cfg.PathResolver,
		publisher:    publisher,
		logger:       cfg.Logger.With(zap.String("component", "boot-validator")),
	}, nil
}

// ValidateAllInstances validates all INSTALLED and RUNNING instances on boot.
// This runs before the Supervisor starts to ensure binary integrity.
func (v *BootValidator) ValidateAllInstances(ctx context.Context) (*ValidationSummary, error) {
	v.logger.Info("starting boot-time instance validation")

	// Query all instances that should have binaries available
	instances, err := v.db.ServiceInstance.Query().
		Where(serviceinstance.StatusIn(
			serviceinstance.StatusInstalled,
			serviceinstance.StatusRunning,
		)).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to query instances: %w", err)
	}

	v.logger.Info("found instances to validate", zap.Int("total_instances", len(instances)))

	summary := &ValidationSummary{
		TotalChecked:   len(instances),
		FailedCount:    0,
		FailedServices: []string{},
	}

	for _, instance := range instances {
		if err := v.validateInstance(ctx, instance); err != nil {
			v.logger.Error("instance validation failed",
				zap.Error(err),
				zap.String("instance_id", instance.ID),
				zap.String("feature_id", instance.FeatureID))

			summary.FailedCount++
			summary.FailedServices = append(summary.FailedServices, instance.FeatureID)
		}
	}

	v.logger.Info("boot-time validation complete",
		zap.Int("total_checked", summary.TotalChecked),
		zap.Int("failed_count", summary.FailedCount),
		zap.Strings("failed_services", summary.FailedServices))

	return summary, nil
}

// validateInstance validates a single instance's binary integrity.
func (v *BootValidator) validateInstance(ctx context.Context, instance *ent.ServiceInstance) error {
	v.logger.Debug("validating instance",
		zap.String("instance_id", instance.ID),
		zap.String("feature_id", instance.FeatureID),
		zap.String("binary_path", instance.BinaryPath))

	// Check if binary path is set
	if instance.BinaryPath == "" {
		return v.markInstanceUnavailable(
			ctx,
			instance,
			"Binary path not configured",
			"configuration_error",
		)
	}

	// Check if binary file exists
	if _, err := os.Stat(instance.BinaryPath); os.IsNotExist(err) {
		// Binary file is missing - likely external storage disconnected
		reason := fmt.Sprintf("Binary file not found: %s (storage may be disconnected)", instance.BinaryPath)
		return v.markInstanceUnavailable(ctx, instance, reason, "file_not_found")
	} else if err != nil {
		// Other filesystem error
		return v.markInstanceUnavailable(
			ctx,
			instance,
			fmt.Sprintf("Failed to access binary file: %v", err),
			"file_access_error",
		)
	}

	// Verify SHA256 checksum if available
	if instance.BinaryChecksum != "" {
		valid, err := v.verifyChecksum(instance.BinaryPath, instance.BinaryChecksum)
		if err != nil {
			return v.markInstanceUnavailable(
				ctx,
				instance,
				fmt.Sprintf("Failed to verify binary checksum: %v", err),
				"checksum_verification_error",
			)
		}

		if !valid {
			// Checksum mismatch - binary has been corrupted or modified
			reason := fmt.Sprintf("Binary integrity check failed: checksum mismatch (expected: %s)", instance.BinaryChecksum)
			return v.markInstanceUnavailable(ctx, instance, reason, "checksum_mismatch")
		}
	} else {
		v.logger.Warn("no checksum stored - skipping integrity verification",
			zap.String("instance_id", instance.ID),
			zap.String("feature_id", instance.FeatureID))
	}

	// Binary is valid - clear any previous unavailable_reason
	if instance.UnavailableReason != "" {
		v.logger.Info("clearing previous unavailable_reason after successful validation",
			zap.String("instance_id", instance.ID),
			zap.String("previous_reason", instance.UnavailableReason))

		_, err := v.db.ServiceInstance.UpdateOneID(instance.ID).
			ClearUnavailableReason().
			Save(ctx)

		if err != nil {
			v.logger.Error("failed to clear unavailable_reason", zap.Error(err), zap.String("instance_id", instance.ID))
			// Non-fatal - continue
		}
	}

	v.logger.Debug("instance validation passed",
		zap.String("instance_id", instance.ID),
		zap.String("feature_id", instance.FeatureID))

	return nil
}

// markInstanceUnavailable marks an instance as FAILED with an unavailable_reason.
func (v *BootValidator) markInstanceUnavailable(
	ctx context.Context,
	instance *ent.ServiceInstance,
	reason string,
	eventReason string,
) error {

	v.logger.Warn("marking instance as unavailable",
		zap.String("instance_id", instance.ID),
		zap.String("feature_id", instance.FeatureID),
		zap.String("reason", reason))

	// Update instance status to FAILED with unavailable_reason
	_, err := v.db.ServiceInstance.UpdateOneID(instance.ID).
		SetStatus(serviceinstance.StatusFailed).
		SetUnavailableReason(reason).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to update instance status: %w", err)
	}

	// Emit storage unavailable event
	if err := v.publisher.PublishStorageUnavailable(
		ctx,
		instance.FeatureID,
		instance.ID,
		instance.BinaryPath,
		eventReason,
	); err != nil {
		v.logger.Error("failed to publish storage unavailable event", zap.Error(err))
		// Non-fatal - continue
	}

	return fmt.Errorf("instance validation failed: %s", reason)
}

// verifyChecksum calculates the SHA256 checksum of a file and compares it to the expected value.
func (v *BootValidator) verifyChecksum(filePath, expectedChecksum string) (bool, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return false, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return false, fmt.Errorf("failed to calculate checksum: %w", err)
	}

	actualChecksum := hex.EncodeToString(hash.Sum(nil))

	// Compare checksums (case-insensitive)
	expected := strings.ToLower(expectedChecksum)
	actual := strings.ToLower(actualChecksum)

	if actual != expected {
		v.logger.Warn("checksum mismatch",
			zap.String("file_path", filePath),
			zap.String("expected", expected),
			zap.String("actual", actual))
		return false, nil
	}

	return true, nil
}
