package features

import "backend/internal/registry"

// VerifyError is an alias for pkg/registry.VerifyError.
type VerifyError = registry.VerifyError

// VerificationResult is an alias for pkg/registry.VerificationResult.
type VerificationResult = registry.VerificationResult

// VerifySHA256 verifies that a file matches the expected SHA256 checksum.
// Delegates to pkg/registry.VerifySHA256.
var VerifySHA256 = registry.VerifySHA256

// CalculateSHA256 calculates the SHA256 checksum of a file.
// Delegates to pkg/registry.CalculateSHA256.
var CalculateSHA256 = registry.CalculateSHA256
