package handler

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

// InstallUpdateResponse is the response for POST /api/app/install-update.
type InstallUpdateResponse struct {
	UpdateAvailable bool   `json:"updateAvailable"`
	FromVersion     string `json:"fromVersion"`
	ToVersion       string `json:"toVersion,omitempty"`
}

// UpdateStatusResponse is the response for GET /api/app/update-status.
type UpdateStatusResponse struct {
	Phase     string `json:"phase"` // idle, preparing, pulling, restarting, done, error
	Message   string `json:"message,omitempty"`
	Version   string `json:"version,omitempty"`
	StartedAt string `json:"startedAt,omitempty"`
}
