package compatibility

import (
	"embed"
	"fmt"
	"sync"

	"gopkg.in/yaml.v3"
)

//go:embed matrix.yaml
var matrixFS embed.FS

// Service provides access to the RouterOS version compatibility matrix.
// It supports lazy loading, caching, and hot-reload.
//
//nolint:interfacebloat // interface defines router compatibility contract
type Service interface {
	// LoadMatrix loads or reloads the compatibility matrix from the embedded YAML file.
	LoadMatrix() error
	// GetMatrix returns the full compatibility matrix.
	GetMatrix() *CompatibilityMatrix
	// GetFeatureCompatibility returns compatibility info for a specific feature.
	GetFeatureCompatibility(featureID string) *FeatureCompatibility
	// IsFeatureSupported checks if a feature is supported for a given version.
	IsFeatureSupported(featureID string, version Version, isCHR bool) bool
	// GetSupportedFeatures returns all features supported by a version.
	GetSupportedFeatures(version Version, isCHR bool) []FeatureCompatibility
	// GetUnsupportedFeatures returns all features not supported by a version.
	GetUnsupportedFeatures(version Version, isCHR bool) []FeatureCompatibility
	// GetVersionRequirement returns a user-friendly requirement string for a feature.
	GetVersionRequirement(featureID string, isCHR bool) string
	// GetFieldMapping returns the field name for a resource/field pair based on version.
	GetFieldMapping(resource, field string, version Version) string
	// GetPathMapping returns the API path for a resource based on version.
	GetPathMapping(resource string, version Version) string
	// GetFeatureSupport returns FeatureSupport details for a feature/version combination.
	GetFeatureSupport(featureID string, version Version, isCHR bool) FeatureSupport
	// GetUpgradeRecommendation returns upgrade guidance for enabling a specific feature.
	GetUpgradeRecommendation(featureID string, currentVersion Version, isCHR bool) *UpgradeRecommendation
	// GetAllUpgradeRecommendations returns upgrade recommendations for all unsupported features.
	GetAllUpgradeRecommendations(currentVersion Version, isCHR bool) []UpgradeRecommendation
}

// service implements the Service interface.
type service struct {
	mu     sync.RWMutex
	matrix *CompatibilityMatrix
}

// NewService creates a new compatibility service instance.
// The matrix is lazy-loaded on first access.
func NewService() Service {
	return &service{}
}

// LoadMatrix loads or reloads the compatibility matrix from the embedded YAML file.
func (s *service) LoadMatrix() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := matrixFS.ReadFile("matrix.yaml")
	if err != nil {
		return fmt.Errorf("failed to read embedded matrix.yaml: %w", err)
	}

	var matrix CompatibilityMatrix
	if err := yaml.Unmarshal(data, &matrix); err != nil {
		return fmt.Errorf("failed to parse matrix.yaml: %w", err)
	}

	// Post-process: ensure feature IDs are set from map keys
	for id, feature := range matrix.Features {
		if feature.ID == "" {
			feature.ID = id
			matrix.Features[id] = feature
		}
	}

	s.matrix = &matrix
	return nil
}

// ensureLoaded lazily loads the matrix if not already loaded.
func (s *service) ensureLoaded() error {
	s.mu.RLock()
	if s.matrix != nil {
		s.mu.RUnlock()
		return nil
	}
	s.mu.RUnlock()

	return s.LoadMatrix()
}

// GetMatrix returns the full compatibility matrix.
func (s *service) GetMatrix() *CompatibilityMatrix {
	if err := s.ensureLoaded(); err != nil {
		return nil
	}

	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.matrix
}

// GetFeatureCompatibility returns compatibility info for a specific feature.
func (s *service) GetFeatureCompatibility(featureID string) *FeatureCompatibility {
	if err := s.ensureLoaded(); err != nil {
		return nil
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.matrix == nil {
		return nil
	}

	if feature, ok := s.matrix.Features[featureID]; ok {
		return &feature
	}
	return nil
}

// IsFeatureSupported checks if a feature is supported for a given version.
func (s *service) IsFeatureSupported(featureID string, version Version, isCHR bool) bool {
	feature := s.GetFeatureCompatibility(featureID)
	if feature == nil {
		return false // Unknown feature is not supported
	}

	// Use CHR-specific range if available and this is a CHR
	vr := feature.VersionRange
	if isCHR && feature.VersionRangeCHR != nil {
		vr = *feature.VersionRangeCHR
	}

	return vr.Contains(version)
}

// GetSupportedFeatures returns all features supported by a version.
func (s *service) GetSupportedFeatures(version Version, isCHR bool) []FeatureCompatibility {
	if err := s.ensureLoaded(); err != nil {
		return nil
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.matrix == nil {
		return nil
	}

	var supported []FeatureCompatibility
	for _, feature := range s.matrix.Features {
		vr := feature.VersionRange
		if isCHR && feature.VersionRangeCHR != nil {
			vr = *feature.VersionRangeCHR
		}

		if vr.Contains(version) {
			supported = append(supported, feature)
		}
	}

	return supported
}

// GetUnsupportedFeatures returns all features not supported by a version.
func (s *service) GetUnsupportedFeatures(version Version, isCHR bool) []FeatureCompatibility {
	if err := s.ensureLoaded(); err != nil {
		return nil
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.matrix == nil {
		return nil
	}

	var unsupported []FeatureCompatibility
	for _, feature := range s.matrix.Features {
		vr := feature.VersionRange
		if isCHR && feature.VersionRangeCHR != nil {
			vr = *feature.VersionRangeCHR
		}

		if !vr.Contains(version) {
			unsupported = append(unsupported, feature)
		}
	}

	return unsupported
}

// GetVersionRequirement returns a user-friendly requirement string for a feature.
func (s *service) GetVersionRequirement(featureID string, isCHR bool) string {
	feature := s.GetFeatureCompatibility(featureID)
	if feature == nil {
		return ""
	}

	vr := feature.VersionRange
	if isCHR && feature.VersionRangeCHR != nil {
		vr = *feature.VersionRangeCHR
	}

	return vr.Requirement()
}

// GetFieldMapping returns the field name for a resource/field pair based on version.
func (s *service) GetFieldMapping(resource, field string, version Version) string {
	if err := s.ensureLoaded(); err != nil {
		return field // Fallback to input field name
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.matrix == nil || s.matrix.FieldMappings == nil {
		return field
	}

	resourceMappings, ok := s.matrix.FieldMappings[resource]
	if !ok {
		return field
	}

	fieldMapping, ok := resourceMappings.Fields[field]
	if !ok {
		return field
	}

	return resolveFieldMapping(fieldMapping, version)
}

// resolveFieldMapping selects the appropriate field name based on version.
func resolveFieldMapping(mapping FieldMapping, version Version) string {
	// Try exact version match first (v6 for 6.x, v7 for 7.x)
	if version.Major == 7 && mapping.V7 != "" {
		return mapping.V7
	}
	if version.Major == 6 && mapping.V6 != "" {
		return mapping.V6
	}

	// Fall back to default
	if mapping.Default != "" {
		return mapping.Default
	}

	// Last resort: return v7 if available (most modern), then v6
	if mapping.V7 != "" {
		return mapping.V7
	}
	if mapping.V6 != "" {
		return mapping.V6
	}

	return ""
}

// GetPathMapping returns the API path for a resource based on version.
func (s *service) GetPathMapping(resource string, version Version) string {
	if err := s.ensureLoaded(); err != nil {
		return resource // Fallback to input resource
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	if s.matrix == nil || s.matrix.PathMappings == nil {
		return resource
	}

	pathMapping, ok := s.matrix.PathMappings[resource]
	if !ok {
		return resource
	}

	return resolvePathMapping(pathMapping, version)
}

// resolvePathMapping selects the appropriate path based on version.
func resolvePathMapping(mapping PathMapping, version Version) string {
	if version.Major == 7 && mapping.V7 != "" {
		return mapping.V7
	}
	if version.Major == 6 && mapping.V6 != "" {
		return mapping.V6
	}

	if mapping.Default != "" {
		return mapping.Default
	}

	if mapping.V7 != "" {
		return mapping.V7
	}
	if mapping.V6 != "" {
		return mapping.V6
	}

	return ""
}

// GetFeatureSupport returns FeatureSupport details for a feature/version combination.
func (s *service) GetFeatureSupport(featureID string, version Version, isCHR bool) FeatureSupport {
	feature := s.GetFeatureCompatibility(featureID)
	if feature == nil {
		return FeatureSupport{
			FeatureID: featureID,
			Supported: false,
			Reason:    "Unknown feature",
		}
	}

	supported := s.IsFeatureSupported(featureID, version, isCHR)

	fs := FeatureSupport{
		FeatureID:  featureID,
		Supported:  supported,
		UpgradeURL: feature.UpgradeURL,
	}

	if !supported {
		fs.Reason = s.GetVersionRequirement(featureID, isCHR)
	}

	return fs
}

// DefaultService is the global default compatibility service instance.
var DefaultService = NewService()

// LoadMatrix loads or reloads the default service's compatibility matrix.
func LoadMatrix() error {
	return DefaultService.LoadMatrix()
}

// GetFeatureCompatibility returns compatibility info using the default service.
func GetFeatureCompatibility(featureID string) *FeatureCompatibility {
	return DefaultService.GetFeatureCompatibility(featureID)
}

// IsFeatureSupported checks feature support using the default service.
func IsFeatureSupported(featureID string, version Version, isCHR bool) bool {
	return DefaultService.IsFeatureSupported(featureID, version, isCHR)
}

// GetVersionRequirement returns version requirement using the default service.
func GetVersionRequirement(featureID string, isCHR bool) string {
	return DefaultService.GetVersionRequirement(featureID, isCHR)
}

// GetFieldMapping returns field mapping using the default service.
func GetFieldMapping(resource, field string, version Version) string {
	return DefaultService.GetFieldMapping(resource, field, version)
}

// GetPathMapping returns path mapping using the default service.
func GetPathMapping(resource string, version Version) string {
	return DefaultService.GetPathMapping(resource, version)
}
