// Package config holds the config API group handlers.
package config

import (
	"errors"
	"sync"
	"time"

	"nasnet-panel/internal/handler/common"
)

const (
	wizardOvpnPort   = 1194
	wizardVPNProfile = "VPN-VPN"

	wizardLANBridge             = "LANBridgeSplit"
	wizardBridgePortComment     = "Split"
	wizardWifiAuthTypes         = "wpa2-psk,wpa3-psk"
	wizardWifiMinPasswordLength = 8
	wizardWifiModeAP            = "ap"
	wizardWifiModeWAN           = "station-pseudobridge"
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
	settingKeyPendingReconfig = "pending_reconfig"
	reconfigBaseStart         = 2
	reconfigBaseEnd           = 80
	reconfigExtrasEnd         = 98
	reconfigPollInterval      = 2 * time.Second
	reconfigSaveTimeout       = time.Minute
	reconfigSSTPDefault       = 443
	reconfigSSTPServerPort    = 4433
	reconfigTunnelVRF         = "VRF-TunnelEnds"
	reconfigVPNUserSecret     = "any"
)

var (
	reconfigJobs     sync.Map
	reconfigGuard    sync.Mutex
	reconfigResumeMu sync.Mutex
)

const (
	failoverMaxClients      = 3
	failoverL2TPPrefix      = "L2TP-VPN-"
	failoverWireGuardPrefix = "WG-VPN-"
	failoverBridgePrefix    = "LANBridge-"
	failoverTablePrefix     = "to-"
	failoverListSuffix      = "-LAN"
	failoverSubnetFormat    = "192.168.6%d"
	failoverPeerSuffix      = "-peer"
	failoverCommentPrefix   = "Failover "

	managementPortsBlockComment = "Block WAN access to management ports"
)

var (
	failoverRoles = [failoverMaxClients]string{"Primary", "Backup1", "Backup2"}
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

var (
	errReconfigNoConfig = errors.New("no stored configuration to apply, run the wizard first")
	errInvalidVPNClient = errors.New("invalid VPN client")
)
