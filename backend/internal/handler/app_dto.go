package handler

type appVersionResponse struct {
	Version string `json:"version"`
}

type checkForUpdatesResponse struct {
	AppVersion      string `json:"appVersion"`
	LatestVersion   string `json:"latestVersion"`
	ReleaseDate     string `json:"releaseDate"`
	ReleaseURL      string `json:"releaseUrl"`
	UpdateAvailable bool   `json:"updateAvailable"`
}

type installUpdateResponse struct {
	UpdateAvailable bool   `json:"updateAvailable"`
	FromVersion     string `json:"fromVersion"`
	ToVersion       string `json:"toVersion,omitempty"`
}

type updateStatusResponse struct {
	Phase     string `json:"phase"` // idle, preparing, pulling, restarting, done, error
	Message   string `json:"message,omitempty"`
	Version   string `json:"version,omitempty"`
	StartedAt string `json:"startedAt,omitempty"`
}
