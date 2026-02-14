// Package registry provides utilities for downloading and verifying feature binaries
// from external registries (GitHub Releases, HTTP endpoints).
package registry

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// GitHubRelease represents a GitHub release from the API.
type GitHubRelease struct {
	TagName     string        `json:"tag_name"`
	Name        string        `json:"name"`
	Body        string        `json:"body"`
	Draft       bool          `json:"draft"`
	Prerelease  bool          `json:"prerelease"`
	PublishedAt string        `json:"published_at"`
	Assets      []GitHubAsset `json:"assets"`
	TarballURL  string        `json:"tarball_url"`
	ZipballURL  string        `json:"zipball_url"`
}

// GitHubAsset represents a release asset.
type GitHubAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	Size               int64  `json:"size"`
	ContentType        string `json:"content_type"`
}

// GitHubClient wraps an HTTP client with ETag caching for the GitHub Releases API.
type GitHubClient struct {
	httpClient *http.Client
	etags      map[string]string
	userAgent  string
}

// GitHubClientOption configures a GitHubClient.
type GitHubClientOption func(*GitHubClient)

// WithUserAgent sets a custom User-Agent header.
func WithUserAgent(ua string) GitHubClientOption {
	return func(gc *GitHubClient) { gc.userAgent = ua }
}

// WithHTTPClient sets a custom HTTP client.
func WithHTTPClient(c *http.Client) GitHubClientOption {
	return func(gc *GitHubClient) { gc.httpClient = c }
}

// NewGitHubClient creates a new GitHub API client.
func NewGitHubClient(opts ...GitHubClientOption) *GitHubClient {
	gc := &GitHubClient{
		httpClient: &http.Client{Timeout: 30 * time.Second},
		etags:      make(map[string]string),
		userAgent:  "NasNetConnect-UpdateManager/1.0",
	}
	for _, opt := range opts {
		opt(gc)
	}
	return gc
}

// FetchLatestRelease fetches the latest release with ETag caching.
// Returns (release, wasModified, error).
// wasModified is false if 304 Not Modified was returned.
func (gc *GitHubClient) FetchLatestRelease(ctx context.Context, owner, repo string) (*GitHubRelease, bool, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", owner, repo)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, false, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", gc.userAgent)

	if etag, ok := gc.etags[url]; ok {
		req.Header.Set("If-None-Match", etag)
	}

	resp, err := gc.httpClient.Do(req)
	if err != nil {
		return nil, false, fmt.Errorf("failed to fetch release: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotModified {
		return nil, false, nil
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, false, fmt.Errorf("GitHub API returned %d: %s", resp.StatusCode, string(body))
	}

	if etag := resp.Header.Get("ETag"); etag != "" {
		gc.etags[url] = etag
	}

	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, false, fmt.Errorf("failed to decode release: %w", err)
	}

	return &release, true, nil
}

// FetchAllReleases fetches all releases (used for version history).
func (gc *GitHubClient) FetchAllReleases(ctx context.Context, owner, repo string) ([]GitHubRelease, error) {
	url := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases", owner, repo)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", gc.userAgent)

	resp, err := gc.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch releases: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API returned %d: %s", resp.StatusCode, string(body))
	}

	var releases []GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&releases); err != nil {
		return nil, fmt.Errorf("failed to decode releases: %w", err)
	}

	return releases, nil
}
