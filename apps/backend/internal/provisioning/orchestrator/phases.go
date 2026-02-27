package orchestrator

import (
	"strings"
	"sync"
)

// Phase represents an execution phase in the provisioning pipeline.
type Phase int

const (
	PhaseInterfaceSetup Phase = 1
	PhaseTunnelPeers    Phase = 2
	PhaseIPAddressPools Phase = 3
	PhasePPPVPNServers  Phase = 4
	PhaseDHCPNetworking Phase = 5
	PhaseRouting        Phase = 6
	PhaseFirewall       Phase = 7
	PhaseSystemDNS      Phase = 8
)

// String returns the human-readable name of the phase.
func (p Phase) String() string {
	switch p {
	case PhaseInterfaceSetup:
		return "INTERFACE_SETUP"
	case PhaseTunnelPeers:
		return "TUNNEL_PEERS"
	case PhaseIPAddressPools:
		return "IP_ADDRESS_POOLS"
	case PhasePPPVPNServers:
		return "PPP_VPN_SERVERS"
	case PhaseDHCPNetworking:
		return "DHCP_NETWORKING"
	case PhaseRouting:
		return "ROUTING"
	case PhaseFirewall:
		return "FIREWALL"
	case PhaseSystemDNS:
		return "SYSTEM_DNS"
	default:
		return "UNKNOWN"
	}
}

// PhaseDefinition describes a phase including its name, description, and associated RouterOS paths.
type PhaseDefinition struct {
	Phase       Phase
	Name        string
	Description string
	Paths       []string
}

// AllPhases defines all 8 provisioning phases in execution order.
var AllPhases = []PhaseDefinition{
	{
		Phase:       PhaseInterfaceSetup,
		Name:        "Interface Setup",
		Description: "Create network interfaces: bridges, WireGuard, PPPoE clients, tunnels, VLANs, LTE",
		Paths: []string{
			"/interface/bridge",
			"/interface/wireguard",
			"/interface/pppoe-client",
			"/interface/l2tp-client",
			"/interface/sstp-client",
			"/interface/pptp-client",
			"/interface/ovpn-client",
			"/interface/wifi/security",
			"/interface/wifi/configuration",
			"/interface/wifi",
			"/interface/ipip",
			"/interface/eoip",
			"/interface/gre",
			"/interface/vxlan",
			"/interface/vlan",
			"/interface/macvlan",
			"/interface/lte",
			"/interface/list",
		},
	},
	{
		Phase:       PhaseTunnelPeers,
		Name:        "Tunnel Peers",
		Description: "Configure WireGuard peers and IPsec profiles, peers, proposals, mode-configs",
		Paths: []string{
			"/interface/wireguard/peers",
			"/ip/ipsec/profile",
			"/ip/ipsec/peer",
			"/ip/ipsec/proposal",
			"/ip/ipsec/mode-config",
		},
	},
	{
		Phase:       PhaseIPAddressPools,
		Name:        "IP Address Pools",
		Description: "Allocate IP pools and assign IP addresses to interfaces",
		Paths: []string{
			"/ip/pool",
			"/ip/address",
		},
	},
	{
		Phase:       PhasePPPVPNServers,
		Name:        "PPP/VPN Servers",
		Description: "Configure PPP profiles, secrets, VPN server endpoints and IPsec identities/policies",
		Paths: []string{
			"/ppp/profile",
			"/ppp/secret",
			"/interface/pptp-server",
			"/interface/l2tp-server",
			"/interface/sstp-server",
			"/interface/ovpn-server",
			"/ip/ipsec/identity",
			"/ip/ipsec/policy",
		},
	},
	{
		Phase:       PhaseDHCPNetworking,
		Name:        "DHCP Networking",
		Description: "Configure DHCP servers, clients, bridge ports and interface list members",
		Paths: []string{
			"/interface/wifi/provisioning",
			"/ip/dhcp-server/network",
			"/ip/dhcp-server",
			"/ip/dhcp-client",
			"/interface/bridge/port",
			"/interface/list/member",
		},
	},
	{
		Phase:       PhaseRouting,
		Name:        "Routing",
		Description: "Set up routing tables, static routes and routing rules (PBR)",
		Paths: []string{
			"/routing/table",
			"/ip/route",
			"/routing/rule",
		},
	},
	{
		Phase:       PhaseFirewall,
		Name:        "Firewall",
		Description: "Apply firewall address lists, mangle, NAT, filter and raw rules",
		Paths: []string{
			"/ip/firewall/address-list",
			"/ip/firewall/mangle",
			"/ip/firewall/nat",
			"/ip/firewall/filter",
			"/ip/firewall/raw",
			"/ip/upnp/interfaces",
			"/ip/nat-pmp/interfaces",
			"/ip/upnp",
			"/ip/nat-pmp",
		},
	},
	{
		Phase:       PhaseSystemDNS,
		Name:        "System/DNS",
		Description: "Configure DNS, system identity, NTP, scheduler, scripts and system services",
		Paths: []string{
			"/system/routerboard/settings",
			"/system/package/update",
			"/system/logging/action",
			"/tool/graphing/interface",
			"/tool/graphing/resource",
			"/tool/graphing/queue",
			"/certificate/settings",
			"/ip/dns",
			"/ip/ssh",
			"/ip/socks",
			"/system/identity",
			"/system/ntp/client",
			"/system/scheduler",
			"/system/script",
			"/system/logging",
			"/system/clock",
			"/ip/service",
			"/ip/cloud",
			"/tool/romon",
			"/certificate",
		},
	},
}

// phasePathEntry maps a RouterOS path prefix to its provisioning phase.
type phasePathEntry struct {
	prefix string
	phase  Phase
}

var (
	phasePathOnce    sync.Once
	phasePathEntries []phasePathEntry
)

// ensureSorted initializes phasePathEntries exactly once (lazy, thread-safe).
func ensureSorted() {
	phasePathOnce.Do(func() {
		// Collect all path→phase mappings; longer paths must be matched first.
		for _, def := range AllPhases {
			for _, p := range def.Paths {
				phasePathEntries = append(phasePathEntries, phasePathEntry{prefix: p, phase: def.Phase})
			}
		}
		// Sort longest prefix first to avoid short paths shadowing longer ones.
		sortPhasePathEntries(phasePathEntries)
	})
}

// sortPhasePathEntries sorts entries by descending prefix length (insertion sort – small slice).
func sortPhasePathEntries(entries []phasePathEntry) {
	n := len(entries)
	for i := 1; i < n; i++ {
		key := entries[i]
		j := i - 1
		for j >= 0 && len(entries[j].prefix) < len(key.prefix) {
			entries[j+1] = entries[j]
			j--
		}
		entries[j+1] = key
	}
}

// ClassifyResourcePath returns the Phase for a given RouterOS resource path.
// It uses longest-prefix matching so that "/interface/wireguard/peers" is matched
// before "/interface/wireguard". Returns PhaseInterfaceSetup as the default fallback.
func ClassifyResourcePath(path string) Phase {
	ensureSorted()
	for _, entry := range phasePathEntries {
		if strings.HasPrefix(path, entry.prefix) {
			return entry.phase
		}
	}
	// Default to interface setup for unrecognized paths.
	return PhaseInterfaceSetup
}

// PhaseOrder returns all phases in their canonical execution order (1→8).
func PhaseOrder() []Phase {
	return []Phase{
		PhaseInterfaceSetup,
		PhaseTunnelPeers,
		PhaseIPAddressPools,
		PhasePPPVPNServers,
		PhaseDHCPNetworking,
		PhaseRouting,
		PhaseFirewall,
		PhaseSystemDNS,
	}
}
