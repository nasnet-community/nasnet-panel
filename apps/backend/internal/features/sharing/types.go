package sharing

import (
	"sync"

	"backend/internal/common/manifest"
)

// FeatureRegistry provides access to feature manifests.
// This is a local type definition to break the circular dependency
// between the sharing subpackage and the parent features package.
// The features.FeatureRegistry provides these methods; callers should
// construct a sharing.FeatureRegistry adapter when wiring dependencies.
type FeatureRegistry struct {
	mu              sync.RWMutex
	getManifestFunc func(id string) (*manifest.Manifest, error)
}

// NewFeatureRegistry creates a FeatureRegistry for testing purposes.
// In production, use NewFeatureRegistryFromFunc to wrap the parent features.FeatureRegistry.
func NewFeatureRegistry() (*FeatureRegistry, error) {
	return &FeatureRegistry{
		getManifestFunc: func(id string) (*manifest.Manifest, error) {
			// Return a minimal manifest for testing
			return &manifest.Manifest{
				ID: id,
			}, nil
		},
	}, nil
}

// NewFeatureRegistryFromFunc creates a FeatureRegistry that delegates to the provided function.
func NewFeatureRegistryFromFunc(fn func(id string) (*manifest.Manifest, error)) *FeatureRegistry {
	return &FeatureRegistry{
		getManifestFunc: fn,
	}
}

// GetManifest retrieves a manifest by ID.
func (r *FeatureRegistry) GetManifest(id string) (*manifest.Manifest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.getManifestFunc(id)
}
