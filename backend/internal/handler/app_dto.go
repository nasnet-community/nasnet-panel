package handler

import "nasnet-panel/internal/db"

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
	Installable        bool     `json:"installable"`
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

// InstallUpdateResponse is the response for POST /api/app/install-update.
type InstallUpdateResponse struct {
	UpdateAvailable bool   `json:"updateAvailable"`
	FromVersion     string `json:"fromVersion"`
	ToVersion       string `json:"toVersion,omitempty"`
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
}

// ToSettingResponse converts a stored Setting to API SettingResponse.
func ToSettingResponse(setting *db.Setting) SettingResponse {
	return SettingResponse{
		Key:       setting.Key,
		Value:     setting.Value,
		UpdatedAt: setting.UpdatedAt,
	}
}
