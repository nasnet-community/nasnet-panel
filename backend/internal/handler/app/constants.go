// Package app holds the app API group handlers.
package app

import (
	"errors"
	"regexp"
	"time"

	"nasnet-panel/pkg/routeros"
)

const (
	updatePhaseIdle       appUpdatePhase = "idle"
	updatePhasePreparing  appUpdatePhase = "preparing"
	updatePhasePulling    appUpdatePhase = "pulling"
	updatePhaseRestarting appUpdatePhase = "restarting"
	updatePhaseDone       appUpdatePhase = "done"
	updatePhaseError      appUpdatePhase = "error"
)

var (
	appUpdate        = &appUpdateState{phase: updatePhaseIdle}
	releaseListCache = &releaseCache{}
)

const (
	githubReleasesURL           = "https://api.github.com/repos/nasnet-community/nasnet-panel/releases?per_page=100"
	githubReleaseByTagURL       = "https://api.github.com/repos/nasnet-community/nasnet-panel/releases/tags/"
	githubAPIPrefix             = "https://api.github.com/"
	maxGitHubReleasePages       = 10
	releaseListCacheTTL         = 5 * time.Minute
	releaseFetchTimeout         = 30 * time.Second
	appContainerImage           = "ghcr.io/nasnet-community/nasnet-panel"
	appUpdateContainerName      = "nasnet-panel-update"
	appDatabaseMountList        = "nasnet-panel-database"
	appDatabaseDir              = routeros.NasnetPanelDir + "/database"
	updateWatchInterval         = 3 * time.Second
	updateWatchTimeout          = 5 * time.Minute
	restartScheduleDelaySeconds = 3                // gives this request/response time to complete before nasnet-panel restarts
	minUpdateFreeStorageBytes   = 30 * 1024 * 1024 // 30MB, headroom for the pulled image layers
)

const (
	maxSettingKeyLength         = 128
	maxSettingValueLength       = 64 * 1024
	defaultMinRouterOSVersion   = "7.24"
	defaultMinAppVersion        = "1.2.0"
	localDevVersion             = "v0.0.0-dev"
	autoReconfigableFromVersion = "1.3.0"
)

var (
	githubNextLinkPattern  = regexp.MustCompile(`<([^>]+)>;\s*rel="next"`)
	settingKeyPattern      = regexp.MustCompile(`^[A-Za-z0-9_.:-]+$`)
	stableTagPattern       = regexp.MustCompile(`^v?\d+\.\d+\.\d+$`)
	minAppVersionPattern   = regexp.MustCompile(`^\d+\.\d+\.\d+$`)
	releaseMetaPattern     = regexp.MustCompile(`(?s)<!--\s*nasnet-meta:\s*(\{.*?\})\s*-->`)
	releaseChangesHeading  = regexp.MustCompile(`(?i)^#+\s*what's changed\s*$`)
	changePrefixPattern    = regexp.MustCompile(`^[A-Za-z]+(?:\([^)]*\))?!?:\s*`)
	changeSuffixPattern    = regexp.MustCompile(`\s+by\s+@\S+\s+in\s+(?:https?://\S+|#\d+)\s*$`)
	errGitHubNotFound      = errors.New("GitHub API returned 404")
	routerOSVersionPattern = regexp.MustCompile(`^(\d+)\.(\d+)(?:\.(\d+))?(?:(beta|rc)(\d+))?`)
)
