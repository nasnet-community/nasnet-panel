package orchestrator

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/events"
	"backend/internal/features/verification"

	"github.com/rs/zerolog"
)

// VerificationIntegration provides methods to integrate binary verification
// into the InstanceManager and Supervisor.
type VerificationIntegration struct {
	verifier  *verification.Verifier
	store     *ent.Client
	publisher *events.Publisher
	logger    zerolog.Logger
}

// NewVerificationIntegration creates a new verification integration helper.
func NewVerificationIntegration(verifier *verification.Verifier, store *ent.Client, publisher *events.Publisher, logger zerolog.Logger) *VerificationIntegration {
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
//	1. Download checksums.txt from checksumsURL
//	2. Download archive from binaryURL
//	3. Call VerifyAndInstall() to verify archive
//	4. Extract archive on success
//	5. Call ComputeBinaryHash() on extracted binary
//	6. Update database with verification fields
func (vi *VerificationIntegration) VerifyAndInstall(
	ctx context.Context,
	instanceID string,
	featureID string,
	archivePath string,
	checksumsPath string,
	checksumsURL string,
	spec *verification.VerificationSpec,
) error {
	// Verify archive
	result, err := vi.verifier.VerifyArchive(ctx, archivePath, checksumsPath, checksumsURL, spec)
	if err != nil {
		vi.logger.Error().
			Err(err).
			Str("instance_id", instanceID).
			Str("feature_id", featureID).
			Msg("Archive verification failed")

		// Emit verification failed event
		verifiedAt := time.Now().Format(time.RFC3339)
		if vi.publisher != nil {
			_ = vi.publisher.PublishBinaryVerificationFailed(
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
		vi.logger.Error().
			Str("instance_id", instanceID).
			Str("feature_id", featureID).
			Str("expected", result.Error.Expected).
			Str("actual", result.Error.Actual).
			Msg("Archive hash mismatch")

		// Emit verification failed event
		if vi.publisher != nil {
			_ = vi.publisher.PublishBinaryVerificationFailed(
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

	vi.logger.Info().
		Str("instance_id", instanceID).
		Str("feature_id", featureID).
		Str("archive_hash", result.ArchiveHash).
		Bool("gpg_verified", result.GPGVerified).
		Msg("Archive verified successfully")

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
		_ = vi.publisher.PublishBinaryVerified(
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

	vi.logger.Info().
		Str("instance_id", instanceID).
		Str("binary_hash", binaryHash).
		Msg("Binary verification complete")

	return nil
}

// StartupIntegrityCheck performs batch integrity verification on all instances.
// This should be called from NewInstanceManager() after Reconcile().
//
// Integration point: NewInstanceManager() constructor (line ~95, after Reconcile)
func (vi *VerificationIntegration) StartupIntegrityCheck(ctx context.Context) error {
	vi.logger.Info().Msg("Starting binary integrity check")

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
		vi.logger.Info().Msg("No instances to verify")
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
		vi.logger.Info().Msg("No instances with verification data")
		return nil
	}

	// Perform batch verification
	verified, failed, err := vi.verifier.StartupIntegrityCheck(ctx, verificationInfos)
	if err != nil {
		return fmt.Errorf("integrity check failed: %w", err)
	}

	vi.logger.Info().
		Int("verified", verified).
		Int("failed", failed).
		Int("total", len(verificationInfos)).
		Msg("Integrity check complete")

	// If any failed, update their status
	if failed > 0 {
		vi.logger.Warn().
			Int("failed_count", failed).
			Msg("Binary integrity failures detected - instances will not start")
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
		vi.logger.Warn().
			Str("instance_id", instanceID).
			Msg("Verification enabled but no verification data - skipping check")
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

	vi.logger.Info().
		Str("instance_id", instanceID).
		Msg("Binary integrity check passed")

	return nil
}
