package updates

import "backend/pkg/registry"

// GitHubRelease is an alias for pkg/registry.GitHubRelease.
type GitHubRelease = registry.GitHubRelease

// GitHubAsset is an alias for pkg/registry.GitHubAsset.
type GitHubAsset = registry.GitHubAsset

// GitHubClient is an alias for pkg/registry.GitHubClient.
type GitHubClient = registry.GitHubClient

// NewGitHubClient creates a new GitHub API client.
// Delegates to pkg/registry.NewGitHubClient.
var NewGitHubClient = registry.NewGitHubClient
