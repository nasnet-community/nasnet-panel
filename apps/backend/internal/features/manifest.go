package features

import (
	"backend/pkg/manifest"
)

// Manifest is an alias for pkg/manifest.Manifest.
type Manifest = manifest.Manifest

// VolumeMount is an alias for pkg/manifest.VolumeMount.
type VolumeMount = manifest.VolumeMount

// PortMapping is an alias for pkg/manifest.PortMapping.
type PortMapping = manifest.PortMapping

// HealthSpec is an alias for pkg/manifest.HealthSpec.
type HealthSpec = manifest.HealthSpec

// VerificationSpec is an alias for pkg/manifest.VerificationSpec.
type VerificationSpec = manifest.VerificationSpec

// GPGSpec is an alias for pkg/manifest.GPGSpec.
type GPGSpec = manifest.GPGSpec

// ParseManifestJSON parses a manifest from JSON bytes.
// Delegates to pkg/manifest.ParseJSONBytes.
var ParseManifestJSON = manifest.ParseJSONBytes

// NormalizeArchitecture normalizes architecture names.
// Delegates to pkg/manifest.NormalizeArchitecture.
var NormalizeArchitecture = manifest.NormalizeArchitecture
