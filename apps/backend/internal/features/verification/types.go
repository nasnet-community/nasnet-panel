package verification

import (
	"backend/internal/common/manifest"
	"backend/internal/registry"
)

// VerifyError is an alias for pkg/registry.VerifyError.
type VerifyError = registry.VerifyError

// Result is an alias for pkg/registry.VerificationResult.
type Result = registry.VerificationResult

// Spec is an alias for pkg/manifest.VerificationSpec.
type Spec = manifest.VerificationSpec

// GPGSpec is an alias for pkg/manifest.GPGSpec.
type GPGSpec = manifest.GPGSpec

// CalculateSHA256 calculates the SHA256 checksum of a file.
// Delegates to pkg/registry.CalculateSHA256.
var CalculateSHA256 = registry.CalculateSHA256
