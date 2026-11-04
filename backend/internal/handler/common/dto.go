package common

// ReleaseVersion is a parsed release version with its channel.
type ReleaseVersion struct {
	major, minor, patch int
	Channel             string
	rc                  int
	date                int
	build               int
}

// InstallUpdateResponse is the response for POST /api/app/install-update.
type InstallUpdateResponse struct {
	UpdateAvailable bool   `json:"updateAvailable"`
	FromVersion     string `json:"fromVersion"`
	ToVersion       string `json:"toVersion,omitempty"`
}

// Response is the common envelope of every API response.
type Response struct {
	Status  int         `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
