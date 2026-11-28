// Package vpn holds the vpn API group handlers.
package vpn

import (
	"sync"
	"time"

	"nasnet-panel/pkg/routeros"
)

// vpnStatusCheckIP is the well-known address pinged through a VPN client
// interface to verify reachability and measure round-trip time, in place of
// a peer's own endpoint address (which may not be reachable once the tunnel
// is up). Used across VPN client types, not just WireGuard.
const vpnStatusCheckIP = "1.0.0.1"

const (
	claimClientPrefix = "L2TP-VPN-"
	claimProfileName  = "default"
	vrfTunnelEnds     = "@VRF-TunnelEnds"

	claimActionAdded   = "added"
	claimActionUpdated = "updated"
	claimActionRole    = "role"
	claimActionDeleted = "deleted"
	claimActionSkipped = "skipped"
)

// vpnAccountTimeout bounds the call to the NasNet API for the router's VPN account.
const vpnAccountTimeout = 30 * time.Second

const (
	claimRetryFirstDelay     = 20 * time.Second
	claimRetryInterval       = 2 * time.Minute
	claimRetryAttemptTimeout = 90 * time.Second
)

var claimRetries = struct {
	sync.Mutex
	clients map[string]*routeros.Client
}{clients: make(map[string]*routeros.Client)}

const failoverEnrollFailedMessage = "The VPN client was added, but its failover setup (routes, pinned LAN segment) failed: %v"

const fallbackAccountWarning = "This VPN client uses the shared fallback account because NasNet could not provide your own. Replace its credentials immediately."

// vpnLANAddressList is the firewall address list the VPN routing rules match
// on as src-address-list, set up by the wizard template.
const (
	VpnLANAddressList = "VPN-LAN"
	L2tpServerComment = "l2tp-server"
)

// L2tpServerRuleSpecs lists the rules L2TP-over-IPsec needs: accept/mark rules for the L2TP data port itself (udp/1701) plus the IPsec
// negotiation traffic that carries it: IKE (udp/500), NAT-T (udp/4500), and ESP (protocol ipsec-esp, no port).
var L2tpServerRuleSpecs = []L2tpRuleSpec{
	{Protocol: "udp", DstPort: "1701", Suffix: ""},
	{Protocol: "udp", DstPort: "500", Suffix: "-ike"},
	{Protocol: "udp", DstPort: "4500", Suffix: "-nat-t"},
	{Protocol: "ipsec-esp", DstPort: "", Suffix: "-esp"},
}

var ovpnServerPool = &OvpnServerPool{
	activeTasks: make(map[string]*OvpnServerTask),
}

// VpnServerAllowedInterfaceList is the interface list every VPN server's
// firewall accept rule restricts connections to.
const VpnServerAllowedInterfaceList = "Domestic-WAN"

var sstpServerPool = &SstpServerPool{
	activeTasks: make(map[string]*SstpServerTask),
}

// wireGuardNameGenerationAttempts bounds how many random candidates
// generateUniqueWireGuardInterfaceName tries before giving up.
const wireGuardNameGenerationAttempts = 10

// wireGuardRecentHandshakeThreshold is how recent a peer's last handshake
// must be for the interface to be considered actively connected.
const wireGuardRecentHandshakeThreshold = 4 * time.Minute

// wireGuardPeerCreationLocks holds one *sync.Mutex per WireGuard interface
// name, lazily created. Locking on the interface name (rather than a single
// global lock) serializes peer creation for that interface only, so
// concurrent requests for the same interface can't race to pick and create
// the same clientAddress, while requests against different interfaces still
// proceed independently.
var wireGuardPeerCreationLocks sync.Map

// activeWireGuardPeerHandshakeMaxAgeSeconds bounds how stale a WireGuard
// peer's last handshake may be for ToActiveVPNConnectionsResponse to still
// consider it actively connected.
const activeWireGuardPeerHandshakeMaxAgeSeconds = 5 * 60
