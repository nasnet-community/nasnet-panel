package plugin

import (
	"fmt"
	"net/netip"
	"strconv"
	"strings"
	"sync"

	"nasnet-panel/pkg/routeros"
)

// A container picks the link it leaves by with its source address. Each /28
// of 192.168.150.0/24 is an exit class, and a routing rule sends what its
// addresses send out one routing table, or drops it while the router has no
// such link, so nothing falls into the main table and out the wrong link. The
// router's 192.168.150.254 on the containers bridge is the containers'
// gateway. Their management traffic (the panel opening a plugin's page) stays
// on 192.168.50.0/24, which the classes leave alone.
//
// The rules are found by the comment they all start with, so a router keeps
// one set however often install, update and the wizard put it there.

const (
	exitClassGateway   = "192.168.150.254/24" // the router's address on the containers bridge
	exitClassPrefix    = "Exit-Class-"
	exitClassLocal     = exitClassPrefix + "Local"
	exitClassUnclassed = exitClassPrefix + "None"
	exitClassGatewayID = exitClassPrefix + "Gateway"
)

var exitClassNetwork = netip.MustParsePrefix("192.168.150.0/24")

// exitClass is one block of source addresses and the routing table it leaves
// through. Table is empty for a link no router has yet: Domestic Link 2 to 4,
// Starlink 2 to 4 and the backup VPNs. A failover class leaves through the
// table that fails over between links, the others through one link's own.
type exitClass struct {
	Name  string
	Src   netip.Prefix
	Table string
}

var exitClasses = []exitClass{
	{"Exit-Class-Domestic-Failover", netip.MustParsePrefix("192.168.150.0/28"), "to-Domestic"},
	{"Exit-Class-Domestic-1", netip.MustParsePrefix("192.168.150.16/28"), "to-Domestic-Domestic Link"},
	{"Exit-Class-Domestic-2", netip.MustParsePrefix("192.168.150.32/28"), ""},
	{"Exit-Class-Domestic-3", netip.MustParsePrefix("192.168.150.48/28"), ""},
	{"Exit-Class-Domestic-4", netip.MustParsePrefix("192.168.150.64/28"), ""},
	{"Exit-Class-Foreign-Failover", netip.MustParsePrefix("192.168.150.80/28"), "to-Foreign"},
	{"Exit-Class-Foreign-1", netip.MustParsePrefix("192.168.150.96/28"), "to-Foreign-Foreign Link"},
	{"Exit-Class-Foreign-2", netip.MustParsePrefix("192.168.150.112/28"), ""},
	{"Exit-Class-Foreign-3", netip.MustParsePrefix("192.168.150.128/28"), ""},
	{"Exit-Class-Foreign-4", netip.MustParsePrefix("192.168.150.144/28"), ""},
	// One VPN today, so the primary's own table is the one with the VPN in it.
	{"Exit-Class-VPN-Failover", netip.MustParsePrefix("192.168.150.160/28"), "to-VPN"},
	{"Exit-Class-VPN-Primary", netip.MustParsePrefix("192.168.150.176/28"), "to-VPN"},
	{"Exit-Class-VPN-Backup-1", netip.MustParsePrefix("192.168.150.192/28"), ""},
	{"Exit-Class-VPN-Backup-2", netip.MustParsePrefix("192.168.150.208/28"), ""},
}

// The wizard's LOCAL-IP list. What a container sends there (a reply to a LAN
// client, the panel) stays inside, as it does for every other source.
var exitClassLocalNets = []string{"10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"}

// exitClassRule is one /routing/rule entry of the set.
type exitClassRule struct {
	Comment string
	Src     string
	Dst     string
	Action  string // lookup-only-in-table, or drop
	Table   string
}

// exitClassRules is the set in the order it must be tried: local destinations
// first, then a rule for each class (a drop when its table doesn't exist), then
// a drop for the addresses past the last class.
func exitClassRules(hasTable func(string) bool) []exitClassRule {
	network := exitClassNetwork.String()
	rules := make([]exitClassRule, 0, len(exitClassLocalNets)+len(exitClasses)+1)
	for _, dst := range exitClassLocalNets {
		rules = append(rules, exitClassRule{Comment: exitClassLocal, Src: network, Dst: dst, Action: "lookup-only-in-table", Table: "main"})
	}
	for _, class := range exitClasses {
		rule := exitClassRule{Comment: class.Name, Src: class.Src.String(), Action: "drop"}
		if class.Table != "" && hasTable(class.Table) {
			rule.Action, rule.Table = "lookup-only-in-table", class.Table
		}
		rules = append(rules, rule)
	}
	return append(rules, exitClassRule{Comment: exitClassUnclassed, Src: network, Action: "drop"})
}

// rsc is the rule as the wizard script writes it.
func (r exitClassRule) rsc() string {
	line := fmt.Sprintf("add action=%s comment=%q disabled=no src-address=%s", r.Action, r.Comment, r.Src)
	if r.Dst != "" {
		line += " dst-address=" + r.Dst
	}
	if r.Table != "" {
		line += " table=" + strconv.Quote(r.Table)
	}
	return line
}

func (r exitClassRule) matches(have *routeros.RoutingRuleInfo) bool {
	return have.Comment == r.Comment && have.Action == r.Action && have.SrcAddress == r.Src &&
		have.DstAddress == r.Dst && have.Table == r.Table && have.RoutingMark == "" && !have.Disabled
}

// exitClassMu lets one reconciliation run at a time. Two installs that listed
// the rules together would each remove only what they saw, and could leave one
// install's class rules ahead of the other's local ones.
var exitClassMu sync.Mutex

// ensureExitClasses puts the gateway address and the rules on the router,
// changing nothing when they are right already. A set that differs is added
// whole before the old one goes: the rules are tried in order, so the old ones
// decide until they are removed and no address is unrouted in between.
func ensureExitClasses(client *routeros.Client) error {
	exitClassMu.Lock()
	defer exitClassMu.Unlock()

	if err := ensureExitClassGateway(client); err != nil {
		return err
	}

	tables, err := client.ListRoutingTables()
	if err != nil {
		return err
	}
	have := map[string]bool{"main": true}
	for i := range tables {
		have[tables[i].Name] = true
	}
	wanted := exitClassRules(func(table string) bool { return have[table] })

	existing, err := client.ListRoutingRules()
	if err != nil {
		return err
	}
	ours := make([]routeros.RoutingRuleInfo, 0, len(wanted))
	for i := range existing {
		if strings.HasPrefix(existing[i].Comment, exitClassPrefix) {
			ours = append(ours, existing[i])
		}
	}
	if len(ours) == len(wanted) {
		same := true
		for i := range wanted {
			same = same && wanted[i].matches(&ours[i])
		}
		if same {
			return nil
		}
	}

	for _, rule := range wanted {
		if _, err := client.AddRoutingRule(routeros.RoutingRuleConfig{
			Action:     rule.Action,
			SrcAddress: rule.Src,
			DstAddress: rule.Dst,
			Table:      rule.Table,
			Comment:    rule.Comment,
		}); err != nil {
			return err
		}
	}
	// From the end, so the old local rules stay first until the old classes
	// are gone. A failed removal stops here; the next run replaces what's left.
	for i := len(ours) - 1; i >= 0; i-- {
		if err := client.RemoveRoutingRule(ours[i].ID); err != nil {
			return err
		}
	}
	return nil
}

// ensureExitClassGateway puts 192.168.150.254/24 on the containers bridge,
// unless it is there already. On another interface it would take the
// containers' gateway somewhere else, so that is refused.
func ensureExitClassGateway(client *routeros.Client) error {
	addresses, err := client.ListIPAddresses()
	if err != nil {
		return err
	}
	for i := range addresses {
		if addresses[i].Address != exitClassGateway {
			continue
		}
		if addresses[i].Interface != pluginContainersBridge {
			return fmt.Errorf("%s is on %s, where the containers can't reach it as their gateway", exitClassGateway, addresses[i].Interface)
		}
		return nil
	}
	_, err = client.AddIPAddress(routeros.IPAddressConfig{
		Address:   exitClassGateway,
		Interface: pluginContainersBridge,
		Comment:   exitClassGatewayID,
	})
	return err
}

// usesExitClasses reports whether any of the addresses is in 192.168.150.0/24.
func (a Addresses) usesExitClasses() bool {
	for _, address := range a {
		if prefix, err := netip.ParsePrefix(address); err == nil && exitClassNetwork.Contains(prefix.Addr()) {
			return true
		}
	}
	return false
}

// validateExitClassAddress checks an address in 192.168.150.0/24: it sits on
// the classes' /24 and in one of them, so what it sends meets a rule that
// sends it somewhere on purpose.
func validateExitClassAddress(prefix netip.Prefix) error {
	addr := prefix.Addr()
	if !exitClassNetwork.Contains(addr) {
		return nil
	}
	switch {
	case prefix.Bits() != exitClassNetwork.Bits():
		return fmt.Errorf("write %s as %s/%d: the exit classes share one /%d", prefix, addr, exitClassNetwork.Bits(), exitClassNetwork.Bits())
	case addr == exitClassNetwork.Addr():
		return fmt.Errorf("%s is the network's own address", addr)
	}
	if gateway := netip.MustParsePrefix(exitClassGateway).Addr(); addr == gateway {
		return fmt.Errorf("%s is the router's, the containers' gateway", addr)
	}
	for _, class := range exitClasses {
		if class.Src.Contains(addr) {
			return nil
		}
	}
	return fmt.Errorf("%s is in no exit class (they end at 192.168.150.223)", addr)
}
