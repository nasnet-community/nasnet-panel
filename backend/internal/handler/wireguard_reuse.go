package handler

import (
	"fmt"

	"nasnet-panel/pkg/routeros"
)

// wireGuardInterfaceLookup is the subset of the RouterOS client needed to find
// an existing WireGuard interface by private key and IP address.
type wireGuardInterfaceLookup interface {
	ListWireGuards() ([]routeros.WireGuardInfo, error)
	GetIPAddressesByInterface(ifName string) ([]routeros.IPAddressInfo, error)
}

// findWireGuardInterfaceByKeyAndAddress returns the existing WireGuard
// interface whose private key equals privateKey and which carries exactly
// address, or nil when there is none. Both values must be non-empty for a
// match to be attempted.
func findWireGuardInterfaceByKeyAndAddress(client wireGuardInterfaceLookup, privateKey, address string) (*routeros.WireGuardInfo, error) {
	if privateKey == "" || address == "" {
		return nil, nil
	}
	existing, err := client.ListWireGuards()
	if err != nil {
		return nil, fmt.Errorf("list WireGuard interfaces: %w", err)
	}
	for i := range existing {
		if existing[i].PrivateKey != privateKey {
			continue
		}
		addrs, err := client.GetIPAddressesByInterface(existing[i].Name)
		if err != nil {
			return nil, fmt.Errorf("list IP addresses for interface %s: %w", existing[i].Name, err)
		}
		for _, a := range addrs {
			if a.Address == address {
				return &existing[i], nil
			}
		}
	}
	return nil, nil
}

// wireGuardPeerPlanner decides, peer by peer, whether a peer is a duplicate of
// one already on the interface and which name a new peer gets. It also records
// the outcome so a handler can report it.
type wireGuardPeerPlanner struct {
	interfaceName string
	publicKeys    map[string]struct{}
	usedNames     map[string]struct{}
	nextIndex     int

	added   []string
	skipped []string
}

func newWireGuardPeerPlanner(interfaceName string, existing []routeros.WireGuardPeerInfo) *wireGuardPeerPlanner {
	p := &wireGuardPeerPlanner{
		interfaceName: interfaceName,
		publicKeys:    make(map[string]struct{}, len(existing)),
		usedNames:     make(map[string]struct{}, len(existing)),
		nextIndex:     len(existing) + 1,
	}
	for i := range existing {
		if existing[i].PublicKey != "" {
			p.publicKeys[existing[i].PublicKey] = struct{}{}
		}
		if existing[i].Name != "" {
			p.usedNames[existing[i].Name] = struct{}{}
		}
	}
	return p
}

// SkipIfDuplicate reports whether publicKey is already present on the
// interface, recording it as skipped when it is.
func (p *wireGuardPeerPlanner) SkipIfDuplicate(publicKey string) bool {
	if _, ok := p.publicKeys[publicKey]; !ok {
		return false
	}
	p.skipped = append(p.skipped, publicKey)
	return true
}

// NextName returns the first free "<interface>-peerN" name.
func (p *wireGuardPeerPlanner) NextName() string {
	for {
		candidate := fmt.Sprintf("%s-peer%d", p.interfaceName, p.nextIndex)
		p.nextIndex++
		if _, used := p.usedNames[candidate]; !used {
			return candidate
		}
	}
}

// Added records a peer that was created on the router.
func (p *wireGuardPeerPlanner) Added(name, publicKey string) {
	p.usedNames[name] = struct{}{}
	p.publicKeys[publicKey] = struct{}{}
	p.added = append(p.added, name)
}

// Result reports the peers added and skipped so far.
func (p *wireGuardPeerPlanner) Result(reusedExistingInterface bool) WireGuardPeerImportResult {
	return WireGuardPeerImportResult{
		PeerNames:               p.added,
		ImportedPeerCount:       len(p.added),
		ReusedExistingInterface: reusedExistingInterface,
		SkippedDuplicatePeers:   p.skipped,
	}
}

// wireGuardInterfaceListClient is the subset of the RouterOS client needed to
// put a WireGuard client interface on the WAN interface lists.
type wireGuardInterfaceListClient interface {
	InterfaceListMemberExists(list, iface string) (bool, error)
	AddInterfaceListMember(list, iface string) (string, error)
}

// ensureWireGuardClientOnWanLists adds ifName to the WAN and VPN-WAN interface
// lists when it is not already a member. Failures are logged, not returned.
func ensureWireGuardClientOnWanLists(client wireGuardInterfaceListClient, ifName string, logf func(format string, args ...interface{})) {
	for _, list := range []string{"WAN", "VPN-WAN"} {
		onList, err := client.InterfaceListMemberExists(list, ifName)
		if err != nil {
			logf("Failed to check %s interface list membership: %v", list, err)
			continue
		}
		if onList {
			continue
		}
		if _, err := client.AddInterfaceListMember(list, ifName); err != nil {
			logf("Failed to add %s to %s interface list: %v", ifName, list, err)
		}
	}
}
