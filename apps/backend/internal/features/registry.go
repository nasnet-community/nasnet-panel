package features

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"path"
	"sort"
	"strings"
	"sync"
)

//go:embed manifests/*.json
var manifestFiles embed.FS

// FeatureRegistry manages the collection of available features
type FeatureRegistry struct {
	mu        sync.RWMutex
	manifests map[string]*Manifest // keyed by manifest ID
}

// NewFeatureRegistry creates a new feature registry and loads all manifests
func NewFeatureRegistry() (*FeatureRegistry, error) {
	registry := &FeatureRegistry{
		manifests: make(map[string]*Manifest),
	}

	if err := registry.loadManifests(); err != nil {
		return nil, fmt.Errorf("failed to load manifests: %w", err)
	}

	return registry, nil
}

// loadManifests loads all manifest files from the embedded filesystem
func (r *FeatureRegistry) loadManifests() error {
	entries, err := fs.ReadDir(manifestFiles, "manifests")
	if err != nil {
		return fmt.Errorf("failed to read manifests directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		// Only process .json files
		if !strings.HasSuffix(entry.Name(), ".json") {
			continue
		}

		// Use path.Join (not filepath.Join) for embed.FS - always uses forward slashes
		filePath := path.Join("manifests", entry.Name())
		data, err := manifestFiles.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read manifest file %s: %w", entry.Name(), err)
		}

		var manifest Manifest
		if err := json.Unmarshal(data, &manifest); err != nil {
			return fmt.Errorf("failed to parse manifest file %s: %w", entry.Name(), err)
		}

		if err := manifest.Validate(); err != nil {
			return fmt.Errorf("invalid manifest in file %s: %w", entry.Name(), err)
		}

		r.manifests[manifest.ID] = &manifest
	}

	return nil
}

// GetManifest retrieves a manifest by ID
func (r *FeatureRegistry) GetManifest(id string) (*Manifest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	manifest, exists := r.manifests[id]
	if !exists {
		return nil, fmt.Errorf("manifest not found: %s", id)
	}

	return manifest, nil
}

// ListManifests returns all manifests, optionally filtered by category and/or architecture
func (r *FeatureRegistry) ListManifests(category, architecture string) []*Manifest {
	r.mu.RLock()
	defer r.mu.RUnlock()

	results := make([]*Manifest, 0, len(r.manifests))

	for _, manifest := range r.manifests {
		// Filter by category if specified
		if category != "" && manifest.Category != category {
			continue
		}

		// Filter by architecture if specified
		if architecture != "" && !manifest.SupportsArchitecture(architecture) {
			continue
		}

		results = append(results, manifest)
	}

	// Sort by name for consistent ordering
	sort.Slice(results, func(i, j int) bool {
		return results[i].Name < results[j].Name
	})

	return results
}

// GetManifestsByCategory returns all manifests grouped by category
func (r *FeatureRegistry) GetManifestsByCategory() map[string][]*Manifest {
	r.mu.RLock()
	defer r.mu.RUnlock()

	byCategory := make(map[string][]*Manifest)

	for _, manifest := range r.manifests {
		category := manifest.Category
		if category == "" {
			category = "Other"
		}
		byCategory[category] = append(byCategory[category], manifest)
	}

	// Sort manifests within each category
	for category := range byCategory {
		manifests := byCategory[category]
		sort.Slice(manifests, func(i, j int) bool {
			return manifests[i].Name < manifests[j].Name
		})
	}

	return byCategory
}

// GetCategories returns all unique categories
func (r *FeatureRegistry) GetCategories() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	categorySet := make(map[string]bool)
	for _, manifest := range r.manifests {
		category := manifest.Category
		if category == "" {
			category = "Other"
		}
		categorySet[category] = true
	}

	categories := make([]string, 0, len(categorySet))
	for category := range categorySet {
		categories = append(categories, category)
	}

	sort.Strings(categories)
	return categories
}

// SearchManifests searches manifests by name, description, or tags
func (r *FeatureRegistry) SearchManifests(query string) []*Manifest {
	r.mu.RLock()
	defer r.mu.RUnlock()

	query = strings.ToLower(query)
	results := make([]*Manifest, 0, len(r.manifests))

	for _, manifest := range r.manifests {
		// Search in name
		if strings.Contains(strings.ToLower(manifest.Name), query) {
			results = append(results, manifest)
			continue
		}

		// Search in description
		if strings.Contains(strings.ToLower(manifest.Description), query) {
			results = append(results, manifest)
			continue
		}

		// Search in tags
		for _, tag := range manifest.Tags {
			if strings.Contains(strings.ToLower(tag), query) {
				results = append(results, manifest)
				break
			}
		}
	}

	// Sort by name for consistent ordering
	sort.Slice(results, func(i, j int) bool {
		return results[i].Name < results[j].Name
	})

	return results
}

// Count returns the total number of manifests
func (r *FeatureRegistry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return len(r.manifests)
}

// GetAllIDs returns all manifest IDs
func (r *FeatureRegistry) GetAllIDs() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	ids := make([]string, 0, len(r.manifests))
	for id := range r.manifests {
		ids = append(ids, id)
	}

	sort.Strings(ids)
	return ids
}
