package dbsync

// Names, comments and settings keys shared by the sync code and the handlers.
const (
	WANForeignComment  = "WAN - Foreign Link"
	WANDomesticComment = "WAN - Domestic Link"
	ManagementWifiName = "wifi-management"

	LANBridgeNamePrefix      = "LANBridge"
	DNSAdBlockURL            = "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts"
	DNSGlobalServerName      = "global"
	DomesticBlockRuleComment = "Block traffic to DOMAddList"
	OvpnServerCommentPrefix  = "Client Certificate Password: "
	VPNClientVRFSuffix       = "@VRF-TunnelEnds"

	SettingKeyAdBlockEnabled       = "adblock_enabled"
	SettingKeyDomesticBlockEnabled = "domestic_block_enabled"
	SettingKeyForeignGateway       = "foreign_gateway"

	wireGuardClientSuffix = "-wg-client"
	wireGuardServerSuffix = "-server"
)
