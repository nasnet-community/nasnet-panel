package types

// StarState is the top-level provisioning state aggregating all wizard sections.
type StarState struct {
	Choose ChooseState       `json:"choose"`
	WAN    WANState          `json:"wan"`
	LAN    *LANState         `json:"lan,omitempty"`
	Extra  *ExtraConfigState `json:"extra,omitempty"`
}

// Mode represents the wizard complexity mode.
type Mode string

const (
	ModeEasy    Mode = "easy"
	ModeAdvance Mode = "advance"
)

// FirmwareType represents the router firmware.
type FirmwareType string

const (
	FirmwareMikroTik FirmwareType = "MikroTik"
	FirmwareOpenWRT  FirmwareType = "OpenWRT"
)

// RouterModeType represents the router operating mode.
type RouterModeType string

const (
	RouterModeAP    RouterModeType = "AP Mode"
	RouterModeTrunk RouterModeType = "Trunk Mode"
)

// WANLinkType represents the WAN link classification.
type WANLinkType string

const (
	WANLinkDomestic WANLinkType = "domestic"
	WANLinkForeign  WANLinkType = "foreign"
	WANLinkBoth     WANLinkType = "both"
)

// NetworkType represents the four-network architecture types.
type NetworkType string

const (
	NetworkDomestic NetworkType = "Domestic"
	NetworkForeign  NetworkType = "Foreign"
	NetworkVPN      NetworkType = "VPN"
	NetworkSplit    NetworkType = "Split"
)

// ChooseState holds the router selection and mode configuration.
type ChooseState struct {
	Mode        Mode           `json:"mode"`
	Firmware    FirmwareType   `json:"firmware"`
	WANLinkType WANLinkType    `json:"wanLinkType"`
	RouterMode  RouterModeType `json:"routerMode"`
	Networks    Networks       `json:"networks"`
}
