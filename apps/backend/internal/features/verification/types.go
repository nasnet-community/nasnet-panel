package verification

import (
	"backend/pkg/manifest"
	"backend/pkg/registry"
)

// VerifyError is an alias for pkg/registry.VerifyError.
type VerifyError = registry.VerifyError

// VerificationResult is an alias for pkg/registry.VerificationResult.
type VerificationResult = registry.VerificationResult

// VerificationSpec is an alias for pkg/manifest.VerificationSpec.
type VerificationSpec = manifest.VerificationSpec

// GPGSpec is an alias for pkg/manifest.GPGSpec.
type GPGSpec = manifest.GPGSpec

// CalculateSHA256 calculates the SHA256 checksum of a file.
// Delegates to pkg/registry.CalculateSHA256.
var CalculateSHA256 = registry.CalculateSHA256
