package verification

import (
	"context"
	"fmt"
)

// GPGVerificationResult contains the outcome of GPG signature verification.
type GPGVerificationResult struct {
	Valid       bool
	KeyID       string
	Fingerprint string
	SignedBy    string
	SignedAt    string
	Error       error
}

// VerifyGPGSignature verifies a GPG signature for a file.
// This is a stub implementation for future GPG support.
func VerifyGPGSignature(_ context.Context, _, signaturePath string, spec *GPGSpec) (*GPGVerificationResult, error) {
	return &GPGVerificationResult{
		Valid: false,
		Error: fmt.Errorf("%w: GPG signature verification will be available in a future release", ErrGPGNotImplemented),
	}, ErrGPGNotImplemented
}

// FetchGPGKey fetches a public key from a key server.
// This is a stub implementation for future GPG support.
func FetchGPGKey(_ context.Context, keyID, keyServerURL string) error {
	return ErrGPGNotImplemented
}

// ValidateGPGFingerprint validates that a key's fingerprint matches the expected value.
// This is a stub implementation for future GPG support.
func ValidateGPGFingerprint(keyID, expectedFingerprint string) error {
	return ErrGPGNotImplemented
}
