package handler

// NetwatchHostType categorizes a monitored host.
type NetwatchHostType string

// Netwatch host type constants.
const (
	NetwatchHostTypeForeign  NetwatchHostType = "foreign"
	NetwatchHostTypeVPN      NetwatchHostType = "vpn"
	NetwatchHostTypeDomestic NetwatchHostType = "domestic"
)

// NetStatusResponse represents a single Netwatch entry in the status response.
type NetStatusResponse struct {
	Host   string           `json:"host"`
	Status string           `json:"status"`
	Since  string           `json:"since"`
	Type   NetwatchHostType `json:"type"`
}
