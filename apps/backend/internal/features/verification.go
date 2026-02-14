package features

import (
	"backend/internal/features/verification"
)

// Verifier is an alias for verification.Verifier.
type Verifier = verification.Verifier

// NewVerifier creates a new Verifier instance.
// Delegates to verification.NewVerifier.
var NewVerifier = verification.NewVerifier
