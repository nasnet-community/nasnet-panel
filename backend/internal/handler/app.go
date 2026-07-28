// Package handler contains Echo HTTP handler functions for the nasnet-panel REST API.
package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"nasnet-panel/internal/buildinfo"
	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"

	"github.com/labstack/echo/v4"
)

const (
	githubLatestReleaseURL = "https://api.github.com/repos/nasnet-community/nasnet-panel/releases/latest"
	appContainerImage      = "ghcr.io/nasnet-community/nasnet-panel"
	appContainerName       = "nnc" // matches CONTAINER_NAME in scripts/install.sh

	updateWatchInterval = 3 * time.Second
	updateWatchTimeout  = 20 * time.Minute

	minUpdateFreeStorageBytes = 15 * 1024 * 1024 // 15MB, headroom for the pulled image layers
)

// HandleAppVersion godoc
// @Summary Get panel version
// @Description Returns the current running version of nasnet-panel
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=appVersionResponse}
// @Router /api/app/version [get].
func HandleAppVersion(c echo.Context) error {
	return SuccessResponse(c, http.StatusOK, "Version retrieved", appVersionResponse{
		Version: buildinfo.Version,
	})
}

// HandleAppCheckForUpdates godoc
// @Summary Check for a newer nasnet-panel release
// @Description Compares the running version against the latest GitHub release
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=checkForUpdatesResponse}
// @Failure 502 {object} Response
// @Router /api/app/check-for-updates [get].
func HandleAppCheckForUpdates(c echo.Context) error {
	release, err := fetchLatestGitHubRelease(c.Request().Context())
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch latest release from GitHub", err)
	}

	return SuccessResponse(c, http.StatusOK, "Update check complete", checkForUpdatesResponse{
		AppVersion:      buildinfo.Version,
		LatestVersion:   release.TagName,
		ReleaseDate:     release.PublishedAt,
		ReleaseURL:      release.HTMLURL,
		UpdateAvailable: utils.IsNewerVersion(release.TagName, buildinfo.Version),
	})
}

// appUpdatePhase enumerates the stages of a self-update, tracked in-process so
// /api/app/update-status has something to report while the background watch
// goroutine runs independently of the request that started it.
type appUpdatePhase string

const (
	updatePhaseIdle       appUpdatePhase = "idle"
	updatePhaseRepulling  appUpdatePhase = "repulling"
	updatePhaseRestarting appUpdatePhase = "restarting"
	updatePhaseDone       appUpdatePhase = "done"
	updatePhaseError      appUpdatePhase = "error"
)

type appUpdateState struct {
	mu        sync.RWMutex
	phase     appUpdatePhase
	message   string
	version   string
	startedAt time.Time
}

func (s *appUpdateState) set(phase appUpdatePhase, version, message string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.phase = phase
	s.version = version
	s.message = message
	if phase == updatePhaseRepulling {
		s.startedAt = time.Now()
	}
}

func (s *appUpdateState) snapshot() updateStatusResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()

	resp := updateStatusResponse{
		Phase:   string(s.phase),
		Message: s.message,
		Version: s.version,
	}
	if !s.startedAt.IsZero() {
		resp.StartedAt = s.startedAt.Format(time.RFC3339)
	}
	return resp
}

var appUpdate = &appUpdateState{phase: updatePhaseIdle}

// HandleAppInstallUpdate godoc
// @Summary Install the latest nasnet-panel release
// @Description Checks the latest GitHub release and, if newer than the running
// @Description version, repulls the panel's container image. Restart happens
// @Description automatically once the pull finishes; poll /api/app/update-status
// @Description for progress.
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=installUpdateResponse}
// @Failure 502 {object} Response
// @Router /api/app/install-update [post].
func HandleAppInstallUpdate(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	release, err := fetchLatestGitHubRelease(c.Request().Context())
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch latest release from GitHub", err)
	}

	if !utils.IsNewerVersion(release.TagName, buildinfo.Version) {
		return SuccessResponse(c, http.StatusOK, "Already up to date", installUpdateResponse{
			UpdateAvailable: false,
			FromVersion:     buildinfo.Version,
			ToVersion:       release.TagName,
		})
	}

	resources, err := client.GetResourceInfo()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to check available storage", err)
	}
	if resources.HDDFree < minUpdateFreeStorageBytes {
		return ErrorResponse(c, http.StatusInsufficientStorage, "Not enough storage to update",
			fmt.Errorf("%s free, %s required", utils.BytesToSizeString(resources.HDDFree), utils.BytesToSizeString(minUpdateFreeStorageBytes)))
	}

	remoteImage := appContainerImage + ":" + strings.TrimPrefix(release.TagName, "v")

	appUpdate.set(updatePhaseRepulling, release.TagName, "pulling "+remoteImage)
	if err := client.RepullContainer(appContainerName, remoteImage, ""); err != nil {
		appUpdate.set(updatePhaseError, release.TagName, err.Error())
		return ErrorResponse(c, http.StatusBadGateway, "Failed to repull container image", err)
	}

	go watchRepullAndRestart(client, release.TagName)

	return SuccessResponse(c, http.StatusOK, "Update started", installUpdateResponse{
		UpdateAvailable: true,
		FromVersion:     buildinfo.Version,
		ToVersion:       release.TagName,
	})
}

// watchRepullAndRestart polls the container's download/extract state and
// restarts it once the pull finishes. Runs detached from the HTTP request
// that triggered it, so it uses its own timeout rather than a request context.
func watchRepullAndRestart(client *routeros.Client, version string) {
	deadline := time.Now().Add(updateWatchTimeout)

	for time.Now().Before(deadline) {
		time.Sleep(updateWatchInterval)

		info, err := client.GetContainer(appContainerName)
		if err != nil {
			appUpdate.set(updatePhaseError, version, "lost track of container during pull: "+err.Error())
			log.Printf("[app-update] failed to poll container %s: %v", appContainerName, err)
			return
		}

		if info.DownloadExtractFailed {
			msg := info.About
			if msg == "" {
				msg = "image pull failed"
			}
			appUpdate.set(updatePhaseError, version, msg)
			log.Printf("[app-update] repull failed for container %s: %s", appContainerName, msg)
			return
		}

		if info.DownloadingExtracting {
			appUpdate.set(updatePhaseRepulling, version, "pulling "+info.RemoteImage)
			continue
		}

		appUpdate.set(updatePhaseRestarting, version, "restarting "+appContainerName)
		if err := client.RestartContainer(appContainerName); err != nil {
			appUpdate.set(updatePhaseError, version, "repull finished but restart failed: "+err.Error())
			log.Printf("[app-update] failed to restart container %s: %v", appContainerName, err)
			return
		}

		appUpdate.set(updatePhaseDone, version, "update complete")
		return
	}

	appUpdate.set(updatePhaseError, version, "timed out waiting for image pull to finish")
}

// HandleAppUpdateStatus godoc
// @Summary Get self-update status
// @Description Returns the current phase of an in-progress or completed self-update
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=updateStatusResponse}
// @Router /api/app/update-status [get].
func HandleAppUpdateStatus(c echo.Context) error {
	return SuccessResponse(c, http.StatusOK, "Update status retrieved", appUpdate.snapshot())
}

type githubRelease struct {
	TagName     string `json:"tag_name"`
	HTMLURL     string `json:"html_url"`
	PublishedAt string `json:"published_at"`
}

func fetchLatestGitHubRelease(ctx context.Context) (*githubRelease, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, githubLatestReleaseURL, http.NoBody)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "nasnet-panel/"+buildinfo.Version)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp == nil {
		return nil, fmt.Errorf("empty response from GitHub API")
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned %d", resp.StatusCode)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, err
	}
	return &release, nil
}
