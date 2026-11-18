package net

// NetwatchHostType categorizes a monitored host.
type NetwatchHostType string

// NetStatusResponse represents a single Netwatch entry in the status response.
type NetStatusResponse struct {
	Host   string           `json:"host"`
	Status string           `json:"status"`
	Since  string           `json:"since"`
	Type   NetwatchHostType `json:"type"`
}
