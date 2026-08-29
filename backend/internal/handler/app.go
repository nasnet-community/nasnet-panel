// Package handler contains Echo HTTP handler functions for the nasnet-panel REST API.
package handler

import (
	"context"
	"crypto/rand"
	"encoding/hex"
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
	appContainerName       = "nasnet-panel" // matches CONTAINER_NAME in scripts/install.sh
	appUpdateContainerName = "nasnet-panel-update"

	updateWatchInterval         = 3 * time.Second
	updateWatchTimeout          = 5 * time.Minute
	restartScheduleDelaySeconds = 3 // gives this request/response time to complete before nasnet-panel restarts

	minUpdateFreeStorageBytes = 30 * 1024 * 1024 // 30MB, headroom for the pulled image layers
)

// HandleAppVersion godoc
// @Summary Get panel version
// @Description Returns the current running version of nasnet-panel
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=AppVersionResponse}
// @Router /api/app/version [get].
func HandleAppVersion(c echo.Context) error {
	return SuccessResponse(c, http.StatusOK, "Version retrieved", AppVersionResponse{
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
// @Success 200 {object} Response{data=CheckForUpdatesResponse}
// @Failure 502 {object} Response
// @Router /api/app/check-for-updates [get].
func HandleAppCheckForUpdates(c echo.Context) error {
	release, err := fetchLatestGitHubRelease(c.Request().Context())
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch latest release from GitHub", err)
	}

	return SuccessResponse(c, http.StatusOK, "Update check complete", CheckForUpdatesResponse{
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
	updatePhasePreparing  appUpdatePhase = "preparing"
	updatePhasePulling    appUpdatePhase = "pulling"
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
	if phase == updatePhasePreparing {
		s.startedAt = time.Now()
	}
}

// inProgress reports whether a prepare, pull, or restart is currently running.
func (s *appUpdateState) inProgress() (bool, appUpdatePhase) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	busy := s.phase == updatePhasePreparing || s.phase == updatePhasePulling || s.phase == updatePhaseRestarting
	return busy, s.phase
}

func (s *appUpdateState) snapshot() UpdateStatusResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()

	resp := UpdateStatusResponse{
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
// @Description version, pulls it into a fresh nasnet-panel-update container alongside
// @Description the running one. Once the pull finishes, nasnet-panel-update is promoted
// @Description into nasnet-panel's place and started; poll /api/app/update-status for
// @Description progress.
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=InstallUpdateResponse}
// @Failure 502 {object} Response
// @Router /api/app/install-update [post].
func HandleAppInstallUpdate(c echo.Context) error {
	client, err := GetRouterOSClient(c)
	if err != nil {
		return err
	}

	if busy, phase := appUpdate.inProgress(); busy {
		return ErrorResponse(c, http.StatusConflict, "An update is already in progress",
			fmt.Errorf("current phase: %s", phase))
	}

	sysUpdate, err := client.CheckForUpdates()
	if err != nil {
		return ErrorResponse(c, http.StatusInternalServerError, "Failed to check RouterOS system updates", err)
	}
	if sysUpdate.UpdateAvailable {
		return ErrorResponse(c, http.StatusPreconditionFailed, "RouterOS system update available; install it before updating the panel",
			fmt.Errorf("installed %s, latest %s (%s)", sysUpdate.InstalledVersion, sysUpdate.LatestVersion, sysUpdate.Status))
	}

	release, err := fetchLatestGitHubRelease(c.Request().Context())
	if err != nil {
		return ErrorResponse(c, http.StatusBadGateway, "Failed to fetch latest release from GitHub", err)
	}

	if !utils.IsNewerVersion(release.TagName, buildinfo.Version) {
		return SuccessResponse(c, http.StatusOK, "Already up to date", InstallUpdateResponse{
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

	appUpdate.set(updatePhasePreparing, release.TagName, "starting update")

	go watchNewContainerAndPromote(client, release.TagName)

	return SuccessResponse(c, http.StatusOK, "Update started", InstallUpdateResponse{
		UpdateAvailable: true,
		FromVersion:     buildinfo.Version,
		ToVersion:       release.TagName,
	})
}

// watchNewContainerAndPromote removes any leftover nasnet-panel-update container,
// creates a fresh one pulling the target release, polls its download/extract
// state, and once the pull finishes promotes it into the running nasnet-panel
// container's place. Runs detached from the HTTP request that triggered it,
// so it uses its own timeout rather than a request context.
func watchNewContainerAndPromote(client *routeros.Client, releaseTag string) {
	// A leftover nasnet-panel-update from a previous failed run would otherwise collide
	// with AddContainer below. Safe to delete here since the in-progress guard
	// in HandleAppInstallUpdate already ruled out a live update.
	if _, err := client.GetContainer(appUpdateContainerName); err == nil {
		appUpdate.set(updatePhasePreparing, releaseTag, "removing leftover "+appUpdateContainerName)
		if err := client.RemoveContainer(appUpdateContainerName); err != nil {
			appUpdate.set(updatePhaseError, releaseTag, "failed to remove leftover update container: "+err.Error())
			log.Printf("[app-update] failed to remove leftover container %s: %v", appUpdateContainerName, err)
			return
		}
	}

	running, err := client.GetContainer(appContainerName)
	if err != nil {
		appUpdate.set(updatePhaseError, releaseTag, "failed to inspect running container: "+err.Error())
		log.Printf("[app-update] failed to inspect container %s: %v", appContainerName, err)
		return
	}

	version := strings.TrimPrefix(releaseTag, "v")
	remoteImage := appContainerImage + ":" + version

	randSuffix := make([]byte, 2)
	if _, err := rand.Read(randSuffix); err != nil {
		appUpdate.set(updatePhaseError, releaseTag, "failed to generate random root-dir suffix: "+err.Error())
		log.Printf("[app-update] failed to generate random root-dir suffix: %v", err)
		return
	}
	rootDir := fmt.Sprintf("disk1/images/%s-%s-%s", appContainerName, version, hex.EncodeToString(randSuffix))

	appUpdate.set(updatePhasePreparing, releaseTag, "creating "+appUpdateContainerName)
	if _, err := client.AddContainer(routeros.ContainerConfig{
		Name:        appUpdateContainerName,
		Interface:   running.Interface,
		RootDir:     rootDir,
		RemoteImage: remoteImage,
		Logging:     true,
		StartOnBoot: false,
	}); err != nil {
		appUpdate.set(updatePhaseError, releaseTag, "failed to create update container: "+err.Error())
		log.Printf("[app-update] failed to create container %s: %v", appUpdateContainerName, err)
		return
	}

	appUpdate.set(updatePhasePulling, releaseTag, "pulling "+remoteImage+" into "+appUpdateContainerName)

	deadline := time.Now().Add(updateWatchTimeout)

	for time.Now().Before(deadline) {
		time.Sleep(updateWatchInterval)

		info, err := client.GetContainer(appUpdateContainerName)
		if err != nil {
			appUpdate.set(updatePhaseError, releaseTag, "lost track of update container during pull: "+err.Error())
			log.Printf("[app-update] failed to poll container %s: %v", appUpdateContainerName, err)
			return
		}

		if info.DownloadExtractFailed {
			msg := info.About
			if msg == "" {
				msg = "image pull failed"
			}
			appUpdate.set(updatePhaseError, releaseTag, msg)
			log.Printf("[app-update] pull failed for container %s: %s", appUpdateContainerName, msg)
			if rmErr := client.RemoveContainer(appUpdateContainerName); rmErr != nil {
				log.Printf("[app-update] failed to clean up failed update container %s: %v", appUpdateContainerName, rmErr)
			}
			return
		}

		if info.DownloadingExtracting {
			appUpdate.set(updatePhasePulling, releaseTag, "pulling "+info.RemoteImage)
			continue
		}

		appUpdate.set(updatePhaseRestarting, releaseTag, "promoting "+appUpdateContainerName+" to "+appContainerName)
		if err := client.PromoteContainer(appContainerName, appUpdateContainerName, restartScheduleDelaySeconds); err != nil {
			appUpdate.set(updatePhaseError, releaseTag, "pull finished but promotion failed: "+err.Error())
			log.Printf("[app-update] failed to promote container %s: %v", appUpdateContainerName, err)
			return
		}

		appUpdate.set(updatePhaseDone, releaseTag,
			fmt.Sprintf("update complete; version %s will be applied in a few seconds", releaseTag))
		return
	}

	appUpdate.set(updatePhaseError, releaseTag, "timed out waiting for image pull to finish")
}

// HandleAppUpdateStatus godoc
// @Summary Get self-update status
// @Description Returns the current phase of an in-progress or completed self-update
// @Tags App
// @Security BasicAuth
// @Param X-RouterOS-Host header string true "RouterOS host address"
// @Produce json
// @Success 200 {object} Response{data=UpdateStatusResponse}
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
