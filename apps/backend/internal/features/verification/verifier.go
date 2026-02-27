package verification

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"time"

	"backend/internal/registry"

	"backend/internal/events"
)

// ErrGPGNotImplemented is returned when GPG verification is requested but not available.
var ErrGPGNotImplemented = errors.New("GPG verification not implemented in this release")

// Verifier provides binary verification services for marketplace features.
type Verifier struct {
	publisher *events.Publisher
}

// NewVerifier creates a new Verifier instance.
func NewVerifier(publisher *events.Publisher) *Verifier {
	return &Verifier{
		publisher: publisher,
	}
}

// ChecksumEntry is an alias for pkg/registry.ChecksumEntry.
type ChecksumEntry = registry.ChecksumEntry

// ParseChecksumsFile parses a checksums.txt file in GNU sha256sum format.
// Delegates to pkg/registry.ParseChecksumsFile.
func (v *Verifier) ParseChecksumsFile(r io.Reader) ([]ChecksumEntry, error) {
	entries, err := registry.ParseChecksumsFile(r)
	if err != nil {
		return nil, fmt.Errorf("parse checksums file: %w", err)
	}
	return entries, nil
}

// VerifyArchive verifies that a downloaded archive matches the expected checksum.
func (v *Verifier) VerifyArchive(ctx context.Context, archivePath, checksumsPath, checksumsURL string, spec *Spec) (*Result, error) {
	checksumsFile, err := os.Open(checksumsPath)
	if err != nil {
		return nil, fmt.Errorf("open checksums file: %w", err)
	}
	defer checksumsFile.Close()

	entries, err := registry.ParseChecksumsFile(checksumsFile)
	if err != nil {
		return nil, fmt.Errorf("parse checksums file: %w", err)
	}

	archiveFilename := registry.GetFilename(archivePath)
	var expectedHash string
	for _, entry := range entries {
		if entry.Filename == archiveFilename {
			expectedHash = entry.Hash
			break
		}
	}

	if expectedHash == "" {
		return nil, fmt.Errorf("archive %s not found in checksums.txt", archiveFilename)
	}

	actualHash, err := registry.CalculateSHA256(archivePath)
	if err != nil {
		return nil, fmt.Errorf("calculate archive hash: %w", err)
	}

	verifiedAt := time.Now().Format(time.RFC3339)
	if !registry.EqualChecksums(expectedHash, actualHash) {
		verifyErr := &VerifyError{
			FilePath:        archivePath,
			Expected:        expectedHash,
			Actual:          actualHash,
			ChecksumsURL:    checksumsURL,
			SuggestedAction: "Re-download the archive from the official source",
		}

		return &Result{
			Success:      false,
			ArchiveHash:  actualHash,
			Error:        verifyErr,
			VerifiedAt:   verifiedAt,
			ChecksumsURL: checksumsURL,
		}, nil
	}

	gpgVerified := false
	gpgKeyID := ""
	if spec != nil && spec.GPG != nil && spec.GPG.KeyID != "" {
		if spec.RequireGPG && !spec.TrustOnFirstUse {
			return nil, ErrGPGNotImplemented
		}
	}

	return &Result{
		Success:      true,
		ArchiveHash:  actualHash,
		GPGVerified:  gpgVerified,
		GPGKeyID:     gpgKeyID,
		VerifiedAt:   verifiedAt,
		ChecksumsURL: checksumsURL,
	}, nil
}

// ComputeBinaryHash calculates the SHA256 hash of an extracted binary.
func (v *Verifier) ComputeBinaryHash(binaryPath string) (string, error) {
	hash, err := registry.CalculateSHA256(binaryPath)
	if err != nil {
		return "", fmt.Errorf("calculate sha256: %w", err)
	}
	return hash, nil
}

// Reverify performs a runtime integrity check on an installed feature binary.
func (v *Verifier) Reverify(ctx context.Context, binaryPath, storedBinaryHash, featureID, instanceID, routerID, version, archiveHash, checksumsURL string) (bool, error) {
	currentHash, err := v.ComputeBinaryHash(binaryPath)
	if err != nil {
		return false, fmt.Errorf("failed to compute current binary hash: %w", err)
	}

	if !registry.EqualChecksums(storedBinaryHash, currentHash) {
		detectedAt := time.Now().Format(time.RFC3339)
		if v.publisher != nil {
			_ = v.publisher.PublishBinaryIntegrityFailed( //nolint:errcheck // best-effort event publish
				ctx,
				featureID,
				instanceID,
				routerID,
				version,
				storedBinaryHash,
				currentHash,
				archiveHash,
				checksumsURL,
				detectedAt,
				true,
				true,
			)
		}
		return false, nil
	}

	return true, nil
}

// StartupIntegrityCheck performs a batch integrity check on all installed features.
func (v *Verifier) StartupIntegrityCheck(ctx context.Context, instances []InstanceVerificationInfo) (verified int, failed int, err error) { //nolint:gocritic // paramTypeCombine produces less readable code
	if len(instances) == 0 {
		return 0, 0, nil
	}

	startedAt := time.Now().Format(time.RFC3339)
	featureIDs := make([]string, 0, len(instances))
	routerID := ""
	for _, inst := range instances {
		featureIDs = append(featureIDs, inst.FeatureID)
		if inst.RouterID != "" {
			routerID = inst.RouterID
		}
	}

	if v.publisher != nil {
		_ = v.publisher.PublishBinaryIntegrityCheckStarted( //nolint:errcheck // best-effort event publish
			ctx,
			routerID,
			len(instances),
			featureIDs,
			startedAt,
			"System startup integrity check",
		)
	}

	for _, inst := range instances {
		ok, checkErr := v.Reverify(
			ctx,
			inst.BinaryPath,
			inst.StoredBinaryHash,
			inst.FeatureID,
			inst.InstanceID,
			inst.RouterID,
			inst.Version,
			inst.ArchiveHash,
			inst.ChecksumsURL,
		)

		if checkErr != nil {
			continue
		}

		if ok {
			verified++
		} else {
			failed++
		}
	}

	return verified, failed, nil
}

// InstanceVerificationInfo contains the information needed to verify a single instance.
type InstanceVerificationInfo struct {
	FeatureID        string
	InstanceID       string
	RouterID         string
	Version          string
	BinaryPath       string
	StoredBinaryHash string
	ArchiveHash      string
	ChecksumsURL     string
}
