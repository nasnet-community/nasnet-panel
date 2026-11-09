package app

import (
	"sync"
	"time"

	"nasnet-panel/internal/handler/config"
)

type githubRelease struct {
	TagName     string `json:"tag_name"`
	HTMLURL     string `json:"html_url"`
	PublishedAt string `json:"published_at"`
}

type githubReleaseEntry struct {
	TagName     string `json:"tag_name"`
	HTMLURL     string `json:"html_url"`
	Prerelease  bool   `json:"prerelease"`
	Draft       bool   `json:"draft"`
	PublishedAt string `json:"published_at"`
	Body        string `json:"body"`
}

type routerOSVersion struct {
	major, minor, patch int
	preRank             int
	preNumber           int
}

type releaseCache struct {
	mu        sync.Mutex
	releases  []githubReleaseEntry
	fetchedAt time.Time
}

type releaseMeta struct {
	App struct {
		MinVersion string `json:"minVersion"`
	} `json:"app"`
	RouterOS struct {
		MinVersion string `json:"minVersion"`
	} `json:"routeros"`
}

// appUpdatePhase enumerates the stages of a self-update, tracked in-process so
// /api/app/update-status has something to report while the background watch
// goroutine runs independently of the request that started it.
type appUpdatePhase string

type appUpdateState struct {
	mu        sync.RWMutex
	phase     appUpdatePhase
	message   string
	version   string
	startedAt time.Time
}

// AppVersionResponse is the response for GET /api/app/version.
type AppVersionResponse struct {
	Version string `json:"version"`
}

// CheckForUpdatesResponse is the response for GET /api/app/check-for-updates.
type CheckForUpdatesResponse struct {
	AppVersion      string `json:"appVersion"`
	LatestVersion   string `json:"latestVersion"`
	ReleaseDate     string `json:"releaseDate"`
	ReleaseURL      string `json:"releaseUrl"`
	UpdateAvailable bool   `json:"updateAvailable"`
}

// ReleaseUpdateResponse is one release in the response for GET /api/app/updates.
type ReleaseUpdateResponse struct {
	Tag                string   `json:"tag"`
	Prerelease         bool     `json:"prerelease"`
	ReleaseDate        string   `json:"releaseDate"`
	ReleaseURL         string   `json:"releaseUrl"`
	MinRouterosVersion string   `json:"minRouterosVersion"`
	MinAppVersion      string   `json:"minAppVersion"`
	AutoReconfigable   bool     `json:"autoReconfigable"`
	Changelog          []string `json:"changelog"`
}

// StartUpdateRequest is the request body for POST /api/app/update.
type StartUpdateRequest struct {
	Version string `json:"version" example:"v1.3.0"`
}

// UpdateChannelResponse is the response for GET /api/app/update/channel.
type UpdateChannelResponse struct {
	Channel string `json:"channel"`
}

// CreateSettingRequest is the request body for POST /api/app/settings.
type CreateSettingRequest struct {
	Key   string `json:"key" example:"theme"`
	Value string `json:"value" example:"dark"`
}

// UpdateSettingRequest is the request body for PUT /api/app/settings/{key}.
type UpdateSettingRequest struct {
	Value *string `json:"value" example:"light"`
}

// SettingResponse represents one stored setting in the API response.
type SettingResponse struct {
	Key       string `json:"key"`
	Value     string `json:"value"`
	UpdatedAt string `json:"updatedAt"`
}

// UpdateStatusResponse is the response for GET /api/app/update-status and GET /api/app/update/status.
type UpdateStatusResponse struct {
	Phase     string `json:"phase"` // idle, preparing, pulling, restarting, done, error
	Message   string `json:"message,omitempty"`
	Version   string `json:"version,omitempty"`
	StartedAt string `json:"startedAt,omitempty"`

	Reconfig *config.ReconfigStatusResponse `json:"reconfig,omitempty"`
}
