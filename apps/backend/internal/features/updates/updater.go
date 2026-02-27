package updates

import (
	"context"
	"fmt"
	"runtime"
	"strings"

	"golang.org/x/mod/semver"
)

// UpdateSeverity classifies update importance
type UpdateSeverity string

const (
	SeverityCritical UpdateSeverity = "CRITICAL" // Security fixes, immediate action required
	SeverityMajor    UpdateSeverity = "MAJOR"    // Breaking changes, major version bump
	SeverityMinor    UpdateSeverity = "MINOR"    // New features, minor version bump
	SeverityPatch    UpdateSeverity = "PATCH"    // Bug fixes, patch version bump
)

// UpdateInfo contains metadata about an available update
type UpdateInfo struct {
	FeatureID        string         `json:"featureId"`
	CurrentVersion   string         `json:"currentVersion"`
	AvailableVersion string         `json:"availableVersion"`
	Severity         UpdateSeverity `json:"severity"`
	ReleaseNotes     string         `json:"releaseNotes"`
	PublishedAt      string         `json:"publishedAt"`
	DownloadURL      string         `json:"downloadUrl"`
	ChecksumURL      string         `json:"checksumUrl"`
	Size             int64          `json:"size"`
	Architecture     string         `json:"architecture"`
}

// UpdateServiceConfig holds configuration for the update service
type UpdateServiceConfig struct {
	GitHubClient *GitHubClient
	// Feature manifest repository (e.g., "nasnetconnect/features")
	ManifestRepo string
	// Current OS architecture (amd64, arm64, arm)
	Architecture string
}

// UpdateService checks for and provides update information
type UpdateService struct {
	config       UpdateServiceConfig
	githubClient *GitHubClient
}

// NewUpdateService creates a new update service
func NewUpdateService(config UpdateServiceConfig) (*UpdateService, error) {
	if config.GitHubClient == nil {
		return nil, fmt.Errorf("github client is required")
	}
	if config.ManifestRepo == "" {
		return nil, fmt.Errorf("manifest repo is required")
	}
	if config.Architecture == "" {
		config.Architecture = runtime.GOARCH
	}

	return &UpdateService{
		config:       config,
		githubClient: config.GitHubClient,
	}, nil
}

// CheckForUpdate checks if an update is available for a feature
// Returns (updateInfo, available, error)
func (s *UpdateService) CheckForUpdate(ctx context.Context, featureID, currentVersion string) (*UpdateInfo, bool, error) {
	// Parse owner/repo from manifest repo
	parts := strings.Split(s.config.ManifestRepo, "/")
	if len(parts) != 2 {
		return nil, false, fmt.Errorf("invalid manifest repo format: %s", s.config.ManifestRepo)
	}
	owner, repo := parts[0], parts[1]

	// Fetch latest release with ETag caching
	release, modified, err := s.githubClient.FetchLatestRelease(ctx, owner, repo)
	if err != nil {
		return nil, false, fmt.Errorf("failed to fetch release: %w", err)
	}

	// If not modified (304), no update available
	if !modified {
		return nil, false, nil
	}

	// Verify release is not nil before accessing fields
	if release == nil {
		return nil, false, fmt.Errorf("unexpected nil value for release")
	}

	// Skip drafts and pre-releases
	if release.Draft || release.Prerelease {
		return nil, false, nil
	}

	// Ensure versions are semver compatible (add v prefix if missing)
	availableVersion := release.TagName
	if !strings.HasPrefix(availableVersion, "v") {
		availableVersion = "v" + availableVersion
	}
	currentVer := currentVersion
	if !strings.HasPrefix(currentVer, "v") {
		currentVer = "v" + currentVer
	}

	// Compare versions
	cmp := semver.Compare(availableVersion, currentVer)
	if cmp <= 0 {
		// Same or older version
		return nil, false, nil
	}

	// Find matching architecture asset
	downloadURL, checksumURL, size := s.findArchitectureAsset(release, featureID)
	if downloadURL == "" {
		return nil, false, fmt.Errorf("no binary found for architecture %s", s.config.Architecture)
	}

	// Classify severity
	severity := s.classifySeverity(currentVer, availableVersion, release.Body)

	updateInfo := &UpdateInfo{
		FeatureID:        featureID,
		CurrentVersion:   currentVersion,
		AvailableVersion: release.TagName,
		Severity:         severity,
		ReleaseNotes:     release.Body,
		PublishedAt:      release.PublishedAt,
		DownloadURL:      downloadURL,
		ChecksumURL:      checksumURL,
		Size:             size,
		Architecture:     s.config.Architecture,
	}

	return updateInfo, true, nil
}

// findArchitectureAsset finds the binary asset matching the current architecture
// Returns (downloadURL, checksumURL, size)
func (s *UpdateService) findArchitectureAsset(release *GitHubRelease, featureID string) (downloadURL, checksumURL string, size int64) {
	// Expected asset names:
	// - {featureID}-{version}-{os}-{arch} (e.g., tor-0.4.8.1-linux-amd64)
	// - checksums.txt (contains SHA256 checksums)

	archSuffix := fmt.Sprintf("linux-%s", s.config.Architecture)

	for _, asset := range release.Assets {
		// Look for checksums file
		if asset.Name == "checksums.txt" || asset.Name == "SHA256SUMS" {
			checksumURL = asset.BrowserDownloadURL
			continue
		}

		// Look for matching architecture binary
		if strings.Contains(asset.Name, archSuffix) && strings.HasPrefix(asset.Name, featureID) {
			downloadURL = asset.BrowserDownloadURL
			size = asset.Size
		}
	}

	return downloadURL, checksumURL, size
}

// classifySeverity determines update severity based on version diff and release notes
func (s *UpdateService) classifySeverity(currentVersion, newVersion, releaseNotes string) UpdateSeverity {
	// Check for security keywords in release notes
	securityKeywords := []string{
		"security", "vulnerability", "CVE-", "exploit", "patch",
		"critical", "urgent", "hotfix",
	}
	lowerNotes := strings.ToLower(releaseNotes)
	for _, keyword := range securityKeywords {
		if strings.Contains(lowerNotes, keyword) {
			return SeverityCritical
		}
	}

	// Parse semver to determine bump type
	currentMajor := semver.Major(currentVersion)
	newMajor := semver.Major(newVersion)

	if currentMajor != newMajor {
		return SeverityMajor
	}

	// Compare minor versions
	currentMinor := extractMinor(currentVersion)
	newMinor := extractMinor(newVersion)

	if currentMinor != newMinor {
		return SeverityMinor
	}

	// Otherwise it's a patch
	return SeverityPatch
}

// extractMinor extracts the minor version number from a semver string
func extractMinor(version string) string {
	// Remove v prefix
	v := strings.TrimPrefix(version, "v")

	// Split by dot
	parts := strings.Split(v, ".")
	if len(parts) >= 2 {
		return parts[1]
	}

	return "0"
}
