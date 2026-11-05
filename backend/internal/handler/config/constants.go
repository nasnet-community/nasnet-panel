// Package config holds the config API group handlers.
package config

import (
	"errors"
	"sync"
	"time"

	"nasnet-panel/internal/handler/common"
)

const (
	wizardWireGuardName    = "wireguard-client-wg-client"
	wizardWireGuardComment = "wg-client-wg-client"

	wizardWireGuardPeerName    = "wireguard-client-wg-client-peer"
	wizardWireGuardPeerComment = "wireguard-client-wg-client-peer"

	wizardOvpnPort    = 1194
	wizardVPNProfile  = "VPN-VPN"
	wizardL2TPName    = "wizard-l2tp-client"
	wizardL2TPComment = "L2TP-Client L2TP"

	wizardLANBridge         = "LANBridgeSplit"
	wizardBridgePortComment = "Split"
	wizardWifiAuthTypes     = "wpa2-psk,wpa3-psk"
	wizardWifiModeAP        = "ap"
	wizardWifiModeWAN       = "station-pseudobridge"
)

const (
	wizardSaveTimeout      = 30 * time.Minute
	wizardSavePollInterval = 5 * time.Second
)

// wizardSuccessFile is the marker file the wizard script itself writes to the
// router on successful completion, containing the completion timestamp.
const wizardSuccessFile = common.NasnetPanelDir + "/nasnet-panel-base-config-success.txt"

// wizardScriptFile is where the rendered wizard script is uploaded on the router.
const wizardScriptFile = common.NasnetPanelDir + "/wizard.rsc"

const (
	settingKeyPendingReconfig   = "pending_reconfig"
	reconfigBaseStart           = 2
	reconfigBaseEnd             = 80
	reconfigExtrasEnd           = 98
	reconfigPollInterval        = 2 * time.Second
	reconfigSaveTimeout         = time.Minute
	reconfigSSTPDefault         = 443
	reconfigSSTPServerPort      = 4433
	reconfigTunnelVRF           = "VRF-TunnelEnds"
	reconfigGatewayRouteComment = "Route-to-VPN-Client"
	reconfigVPNUserSecret       = "any"
)

var (
	reconfigJobs     sync.Map
	reconfigGuard    sync.Mutex
	reconfigResumeMu sync.Mutex
)

const (
	vpnClientRoutingTable      = "to-VPN-Client"
	vpnClientCheckRouteComment = "CheckIP-Route-to-VPN-Client"
	vpnClientCheckHost         = "1.0.0.1"
	vpnClientNetwatchComment   = "Failover Netwatch - VPN-Client"
	vpnRoutingTable            = "to-VPN"

	l2tpClientBridge         = "LANBridgeVPN-L2TP-Client"
	l2tpClientComment        = "VPN-L2TP-Client"
	l2tpClientListWAN        = "VPN-L2TP-Client-WAN"
	l2tpClientListLAN        = "VPN-L2TP-Client-LAN"
	l2tpClientPool           = "DHCP-pool-VPN-L2TP-Client"
	l2tpClientDHCPServer     = "DHCP-VPN-L2TP-Client"
	l2tpClientSubnet         = "192.168.41.0/24"
	l2tpClientGatewayIP      = "192.168.41.1"
	l2tpClientAddress        = "192.168.41.1/24"
	l2tpClientPoolRange      = "192.168.41.2-192.168.41.254"
	l2tpClientDefaultProfile = "default-encryption"

	wgClientBridge         = "LANBridgeVPN-wg-client"
	wgClientBridgeComment  = "VPN-wg-client"
	wgClientAddressComment = "VPN-client-wg-client"
	wgClientBridgeAddress  = "192.168.42.1/24"
	wgClientBridgeNetwork  = "192.168.42.0"
	wgClientComment        = "VPN-client"
)

const (
	ovpnServerAuth            = "sha1,md5,sha256,sha384,sha512"
	ovpnServerCipher          = "blowfish128,aes128-cbc,aes192-cbc,aes256-cbc,aes128-gcm,aes192-gcm,aes256-gcm"
	ovpnServerRedirectGateway = "def1"
	ovpnServerKeepalive       = 60
	vpnReplyRoutingRule       = "Route VPN Server Replies via Domestic WAN"
)

const (
	reconfigStateIdle      = "idle"
	reconfigStatePending   = "pending"
	reconfigStateRunning   = "running"
	reconfigStateCompleted = "completed"
	reconfigStateFailed    = "failed"
)

var errReconfigNoConfig = errors.New("no stored configuration to apply, run the wizard first")
