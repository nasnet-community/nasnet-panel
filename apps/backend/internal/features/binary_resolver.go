package features

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/common/manifest"
	"backend/internal/registry"
)

// BinaryResolver resolves the correct download URL from a GitHub release for a given architecture.
type BinaryResolver struct {
	githubClient *registry.GitHubClient
}

// ResolvedBinary contains the resolved download information for a binary.
type ResolvedBinary struct {
	DownloadURL   string
	FileName      string
	ChecksumURL   string
	ArchiveFormat string // "tar.gz", "zip", "none"
	ExtractPath   string // path inside archive
	Size          int64
	Version       string // release version tag
}

// NewBinaryResolver creates a new binary resolver.
func NewBinaryResolver(githubClient *registry.GitHubClient) *BinaryResolver {
	return &BinaryResolver{githubClient: githubClient}
}

// Resolve resolves the correct binary download URL for the given manifest and architecture.
// It fetches the latest GitHub release and finds the asset matching the architecture.
func (r *BinaryResolver) Resolve(ctx context.Context, m *manifest.Manifest, architecture string) (*ResolvedBinary, error) {
	if m.Source == nil {
		return nil, fmt.Errorf("manifest %q has no source configuration", m.ID)
	}

	src := m.Source

	// Normalize architecture
	normalizedArch := manifest.NormalizeArchitecture(architecture)

	// Validate architecture support
	if !m.SupportsArchitecture(architecture) {
		return nil, fmt.Errorf("architecture %q not supported by %q (supported: %v)", architecture, m.ID, m.Architectures)
	}

	// Look up architecture-specific asset search string
	archSearchStr, ok := src.AssetArchMap[normalizedArch]
	if !ok {
		return nil, fmt.Errorf("architecture %q not in asset_arch_map for %q (available: %v)", normalizedArch, m.ID, mapKeys(src.AssetArchMap))
	}

	// Fetch latest release
	release, modified, err := r.githubClient.FetchLatestRelease(ctx, src.GitHubOwner, src.GitHubRepo)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch latest release for %s/%s: %w", src.GitHubOwner, src.GitHubRepo, err)
	}
	if !modified || release == nil {
		return nil, fmt.Errorf("could not fetch release information for %s/%s", src.GitHubOwner, src.GitHubRepo)
	}

	// Search release assets for matching binary and checksum
	var binaryAsset *registry.GitHubAsset
	var checksumURL string

	for i := range release.Assets {
		asset := &release.Assets[i]

		// Check for checksum files
		if isChecksumFile(asset.Name, src.ChecksumFiles) {
			checksumURL = asset.BrowserDownloadURL
			continue
		}

		// Check for matching binary asset
		if matchesBinaryAsset(asset.Name, src.BinaryName, archSearchStr) {
			binaryAsset = asset
		}
	}

	if binaryAsset == nil {
		return nil, fmt.Errorf("no matching asset found for %q (binary=%q, arch=%q) in release %s; available assets: %s",
			m.ID, src.BinaryName, archSearchStr, release.TagName, listAssetNames(release.Assets))
	}

	// Determine archive format
	archiveFormat := src.ArchiveFormat
	if archiveFormat == "" {
		archiveFormat = inferArchiveFormat(binaryAsset.Name)
	}

	extractPath := src.ExtractPath
	if archiveFormat == formatNone {
		extractPath = ""
	}

	return &ResolvedBinary{
		DownloadURL:   binaryAsset.BrowserDownloadURL,
		FileName:      binaryAsset.Name,
		ChecksumURL:   checksumURL,
		ArchiveFormat: archiveFormat,
		ExtractPath:   extractPath,
		Size:          binaryAsset.Size,
		Version:       release.TagName,
	}, nil
}

// matchesBinaryAsset checks if an asset name matches the expected binary and architecture.
func matchesBinaryAsset(assetName, binaryName, archSearchStr string) bool {
	lowerName := strings.ToLower(assetName)
	lowerBinary := strings.ToLower(binaryName)
	lowerArch := strings.ToLower(archSearchStr)

	return strings.Contains(lowerName, lowerBinary) && strings.Contains(lowerName, lowerArch)
}

// isChecksumFile checks if the asset name matches any of the known checksum file names.
func isChecksumFile(assetName string, checksumFiles []string) bool {
	for _, name := range checksumFiles {
		if strings.EqualFold(assetName, name) {
			return true
		}
	}
	return false
}

// inferArchiveFormat infers the archive format from a filename extension.
func inferArchiveFormat(filename string) string {
	lower := strings.ToLower(filename)
	switch {
	case strings.HasSuffix(lower, ".tar.gz") || strings.HasSuffix(lower, ".tgz"):
		return "tar.gz"
	case strings.HasSuffix(lower, ".zip"):
		return "zip"
	default:
		return formatNone
	}
}

// listAssetNames returns a comma-separated list of asset names for error messages.
func listAssetNames(assets []registry.GitHubAsset) string {
	if len(assets) == 0 {
		return "(none)"
	}
	names := make([]string, len(assets))
	for i, a := range assets {
		names[i] = a.Name
	}
	return strings.Join(names, ", ")
}

// mapKeys returns the keys of a string map for error messages.
func mapKeys(m map[string]string) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
