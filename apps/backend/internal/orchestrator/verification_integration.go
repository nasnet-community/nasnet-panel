package orchestrator

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/events"
	"backend/internal/features/verification"

	"go.uber.org/zap"
)

// VerificationIntegration provides methods to integrate binary verification
// into the InstanceManager and Supervisor.
type VerificationIntegration struct {
	verifier  *verification.Verifier
	store     *ent.Client
	publisher *events.Publisher
	logger    *zap.Logger
}

// NewVerificationIntegration creates a new verification integration helper.
func NewVerificationIntegration(verifier *verification.Verifier, store *ent.Client, publisher *events.Publisher, logger *zap.Logger) *VerificationIntegration {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &VerificationIntegration{
		verifier:  verifier,
		store:     store,
		publisher: publisher,
		logger:    logger,
	}
}

// VerifyAndInstall performs verification during installation.
// This should be called in InstanceManager.CreateInstance() after binary download.
//
// Integration point: InstanceManager.CreateInstance() download callback (line ~168)
// Replace the download section with this workflow:
//
//  1. Download checksums.txt from checksumsURL
//  2. Download archive from binaryURL
//  3. Call VerifyAndInstall() to verify archive
//  4. Extract archive on success
//  5. Call ComputeBinaryHash() on extracted binary
//  6. Update database with verification fields
func (vi *VerificationIntegration) VerifyAndInstall(
	ctx context.Context,
	instanceID string,
	featureID string,
	archivePath string,
	checksumsPath string,
	checksumsURL string,
	spec *verification.Spec,
) error {
	// Verify archive
	result, err := vi.verifier.VerifyArchive(ctx, archivePath, checksumsPath, checksumsURL, spec)
	if err != nil {
		vi.logger.Error("Archive verification failed", zap.Error(err), zap.String("instance_id", instanceID), zap.String("feature_id", featureID))

		// Emit verification failed event
		verifiedAt := time.Now().Format(time.RFC3339)
		if vi.publisher != nil {
			_ = vi.publisher.PublishBinaryVerificationFailed( //nolint:errcheck // event publication is best-effort, verification failure is already being returned
				ctx,
				featureID,
				instanceID,
				"", // routerID (fetch from instance if needed)
				"", // version (fetch from manifest)
				"", // expectedHash (from result if available)
				"", // actualHash (from result if available)
				checksumsURL,
				err.Error(),
				"Re-download the feature from official source",
				verifiedAt,
			)
		}

		return fmt.Errorf("archive verification failed: %w", err)
	}

	if !result.Success {
		vi.logger.Error("Archive hash mismatch", zap.String("instance_id", instanceID), zap.String("feature_id", featureID), zap.String("expected", result.Error.Expected), zap.String("actual", result.Error.Actual))

		// Emit verification failed event
		if vi.publisher != nil {
			_ = vi.publisher.PublishBinaryVerificationFailed( //nolint:errcheck // event publication is best-effort, hash mismatch is already being returned
				ctx,
				featureID,
				instanceID,
				"", // routerID
				"", // version
				result.Error.Expected,
				result.Error.Actual,
				checksumsURL,
				"Archive hash mismatch",
				result.Error.SuggestedAction,
				result.VerifiedAt,
			)
		}

		return fmt.Errorf("archive verification failed: hash mismatch")
	}

	vi.logger.Info("Archive verified successfully", zap.String("instance_id", instanceID), zap.String("feature_id", featureID), zap.String("archive_hash", result.ArchiveHash), zap.Bool("gpg_verified", result.GPGVerified))

	return nil
}

// UpdateInstanceVerification updates the instance database record with verification results.
// This should be called after binary extraction.
func (vi *VerificationIntegration) UpdateInstanceVerification(
	ctx context.Context,
	instanceID string,
	featureID string,
	routerID string,
	version string,
	binaryPath string,
	archiveHash string,
	checksumsURL string,
	gpgVerified bool,
	gpgKeyID string,
) error {
	// Compute binary hash
	binaryHash, err := vi.verifier.ComputeBinaryHash(binaryPath)
	if err != nil {
		return fmt.Errorf("failed to compute binary hash: %w", err)
	}

	// Update database
	verifiedAt := time.Now()
	_, err = vi.store.ServiceInstance.UpdateOneID(instanceID).
		SetVerificationEnabled(true).
		SetArchiveHash(archiveHash).
		SetBinaryHash(binaryHash).
		SetGpgVerified(gpgVerified).
		SetNillableGpgKeyID(&gpgKeyID).
		SetChecksumsURL(checksumsURL).
		SetVerifiedAt(verifiedAt).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to update instance verification: %w", err)
	}

	// Emit binary verified event
	if vi.publisher != nil {
		_ = vi.publisher.PublishBinaryVerified( //nolint:errcheck // event publication is best-effort, verification data was already persisted
			ctx,
			featureID,
			instanceID,
			routerID,
			version,
			archiveHash,
			binaryHash,
			gpgKeyID,
			checksumsURL,
			verifiedAt.Format(time.RFC3339),
			gpgVerified,
		)
	}

	vi.logger.Info("Binary verification complete", zap.String("instance_id", instanceID), zap.String("binary_hash", binaryHash))

	return nil
}

// StartupIntegrityCheck performs batch integrity verification on all instances.
// This should be called from NewInstanceManager() after Reconcile().
//
// Integration point: NewInstanceManager() constructor (line ~95, after Reconcile)
func (vi *VerificationIntegration) StartupIntegrityCheck(ctx context.Context) error {
	vi.logger.Info("Starting binary integrity check")

	// Query all instances with verification enabled
	instances, err := vi.store.ServiceInstance.Query().
		Where(
			serviceinstance.VerificationEnabledEQ(true),
			serviceinstance.StatusIn(
				serviceinstance.StatusInstalled,
				serviceinstance.StatusStopped,
				serviceinstance.StatusRunning,
			),
		).
		All(ctx)

	if err != nil {
		return fmt.Errorf("failed to query instances: %w", err)
	}

	if len(instances) == 0 {
		vi.logger.Info("No instances to verify")
		return nil
	}

	// Build verification info list
	verificationInfos := make([]verification.InstanceVerificationInfo, 0, len(instances))
	for _, inst := range instances {
		// Skip instances without binary hash
		if inst.BinaryHash == "" || inst.BinaryPath == "" {
			continue
		}

		verificationInfos = append(verificationInfos, verification.InstanceVerificationInfo{
			FeatureID:        inst.FeatureID,
			InstanceID:       inst.ID,
			RouterID:         inst.RouterID,
			Version:          inst.BinaryVersion,
			BinaryPath:       inst.BinaryPath,
			StoredBinaryHash: inst.BinaryHash,
			ArchiveHash:      inst.ArchiveHash,
			ChecksumsURL:     inst.ChecksumsURL,
		})
	}

	if len(verificationInfos) == 0 {
		vi.logger.Info("No instances with verification data")
		return nil
	}

	// Perform batch verification
	verified, failed, err := vi.verifier.StartupIntegrityCheck(ctx, verificationInfos)
	if err != nil {
		return fmt.Errorf("integrity check failed: %w", err)
	}

	vi.logger.Info("Integrity check complete", zap.Int("verified", verified), zap.Int("failed", failed), zap.Int("total", len(verificationInfos)))

	// If any failed, update their status
	if failed > 0 {
		vi.logger.Warn("Binary integrity failures detected - instances will not start", zap.Int("failed_count", failed))
	}

	return nil
}

// PreStartIntegrityCheck performs integrity check before starting a process.
// This should be called from ManagedProcess.Start() before state transition.
//
// Integration point: supervisor.go ManagedProcess.Start() (line ~141)
// Add this check after acquiring the lock and before setting state to ProcessStateStarting:
//
//	mp.mu.Lock()
//	if mp.state == ProcessStateRunning || mp.state == ProcessStateStarting {
//		mp.mu.Unlock()
//		return fmt.Errorf("process already running")
//	}
//
//	// ADD PRE-START INTEGRITY CHECK HERE
//	if err := mp.PreStartIntegrityCheck(ctx); err != nil {
//		mp.mu.Unlock()
//		return fmt.Errorf("integrity check failed: %w", err)
//	}
//
//	mp.state = ProcessStateStarting
//	mp.mu.Unlock()
func (vi *VerificationIntegration) PreStartIntegrityCheck(
	ctx context.Context,
	instanceID string,
) error {
	// Query instance
	instance, err := vi.store.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		return fmt.Errorf("failed to query instance: %w", err)
	}

	// Skip if verification not enabled
	if !instance.VerificationEnabled {
		return nil
	}

	// Skip if no verification data
	if instance.BinaryHash == "" || instance.BinaryPath == "" {
		vi.logger.Warn("Verification enabled but no verification data - skipping check", zap.String("instance_id", instanceID))
		return nil
	}

	// Perform reverification
	ok, err := vi.verifier.Reverify(
		ctx,
		instance.BinaryPath,
		instance.BinaryHash,
		instance.FeatureID,
		instance.ID,
		instance.RouterID,
		instance.BinaryVersion,
		instance.ArchiveHash,
		instance.ChecksumsURL,
	)

	if err != nil {
		return fmt.Errorf("reverification failed: %w", err)
	}

	if !ok {
		return fmt.Errorf("binary integrity check failed: binary has been modified")
	}

	vi.logger.Info("Binary integrity check passed", zap.String("instance_id", instanceID))

	return nil
}
