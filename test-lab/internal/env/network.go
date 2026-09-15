package env

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"strings"

	"nasnet-panel/test-lab/internal/profile"
	"nasnet-panel/test-lab/internal/sh"
)

type network struct {
	domesticGW    string
	domesticFirst string
	domesticLast  string
	id            string
	hostIdx       int
	internet      bool
	namespaces    []string
	links         []string
	spare         map[string]int
}

type filter struct {
	link   string
	target string
}

func newNetwork(id string, hostIdx int) *network {
	return &network{
		id:            id,
		hostIdx:       hostIdx,
		spare:         map[string]int{},
		domesticGW:    domesticGateway,
		domesticFirst: "192.168.1.100",
		domesticLast:  "192.168.1.200",
	}
}

func (n *network) ns(role string) string {
	return "tl" + n.id + "-" + role
}

func (n *network) link(kind string, idx int) string {
	return fmt.Sprintf("tl%s%s%d", n.id, kind, idx)
}

func (n *network) hostAddr() string {
	return fmt.Sprintf("10.255.%d.2", n.hostIdx)
}

func (n *network) addNamespace(role string) error {
	name := n.ns(role)
	if err := sh.Run("ip", "netns", "add", name); err != nil {
		return err
	}
	n.namespaces = append(n.namespaces, name)
	return sh.Run("ip", "-n", name, "link", "set", "lo", "up")
}

func (n *network) up(p *profile.Profile, internet bool) error {
	n.internet = internet
	if _, _, ok := p.PortByRole("split"); !ok {
		return fmt.Errorf("profile %s has no split port for the harness to reach the router", p.Name)
	}

	for _, role := range []string{"internet", "starlink", "domestic", "split", "mgmt"} {
		if err := n.addNamespace(role); err != nil {
			return err
		}
	}

	disableBridgeNetfilter()

	if err := n.internetNS(); err != nil {
		return err
	}
	if err := n.upstream("starlink", 1, StarlinkPublic); err != nil {
		return err
	}
	if err := n.upstream("domestic", 2, DomesticPublic); err != nil {
		return err
	}
	if err := n.labTable(); err != nil {
		return err
	}

	for i, port := range p.Ports {
		idx := i + 1
		bridge, err := n.port(idx)
		if err != nil {
			return err
		}
		switch port.Role {
		case "starlink":
			err = n.attach(bridge, "starlink", "s", idx, starlinkGateway+"/24")
		case "domestic":
			err = n.attach(bridge, "domestic", "d", idx, n.domesticGW+"/24")
		case "split":
			err = n.attach(bridge, "split", "a", idx, splitClient+"/24")
			if err == nil {
				err = n.attach(bridge, "mgmt", "m", idx, splitHarness+"/24", freshHarness+"/24")
			}
		default:
			role := fmt.Sprintf("p%d", idx)
			if err = n.addNamespace(role); err == nil {
				err = n.attach(bridge, role, "p", idx)
				n.spare[role] = idx
			}
		}
		if err != nil {
			return err
		}
	}

	if err := sh.Run("ip", "-n", n.ns("split"), "route", "add", "default", "via", RouterAddress); err != nil {
		return err
	}
	if err := n.mgmtInternet(); err != nil {
		return err
	}
	if err := n.hostLink(); err != nil {
		return err
	}
	if internet {
		return n.internetUplink()
	}
	return nil
}

func (n *network) down() {
	for _, ns := range n.namespaces {
		_ = sh.Run("ip", "netns", "del", ns)
	}
	for i := len(n.links) - 1; i >= 0; i-- {
		_ = sh.Run("ip", "link", "del", n.links[i])
	}
	if n.internet {
		_ = sh.Run("nft", "delete", "table", "ip", "tl"+n.id)
	}
	_ = os.RemoveAll("/etc/netns/" + n.ns("mgmt"))
}

func (n *network) internetNS() error {
	ns := n.ns("internet")
	cmds := [][]string{
		{"ip", "-n", ns, "link", "add", "dummy0", "type", "dummy"},
		{"ip", "-n", ns, "link", "set", "dummy0", "up"},
		sh.InNS(ns, "sysctl", "-qw", "net.ipv4.ip_forward=1"),
	}
	for _, addr := range internetAddresses() {
		cmds = append(cmds, []string{"ip", "-n", ns, "addr", "add", addr + "/32", "dev", "dummy0"})
	}
	return sh.RunAll(cmds...)
}

func (n *network) upstream(role string, idx int, public string) error {
	ns, inet := n.ns(role), n.ns("internet")
	outer, inner := n.link("u", idx), n.link("i", idx)
	inetIface := role[:2] + "0"
	upAddr := fmt.Sprintf("10.0.%d.1", idx)
	inetAddr := fmt.Sprintf("10.0.%d.2", idx)

	return sh.RunAll(
		[]string{"ip", "link", "add", outer, "type", "veth", "peer", "name", inner},
		[]string{"ip", "link", "set", outer, "netns", ns},
		[]string{"ip", "-n", ns, "link", "set", outer, "name", "up0"},
		[]string{"ip", "link", "set", inner, "netns", inet},
		[]string{"ip", "-n", inet, "link", "set", inner, "name", inetIface},
		[]string{"ip", "-n", ns, "addr", "add", upAddr + "/30", "dev", "up0"},
		[]string{"ip", "-n", ns, "addr", "add", public + "/32", "dev", "up0"},
		[]string{"ip", "-n", ns, "link", "set", "up0", "up"},
		[]string{"ip", "-n", inet, "addr", "add", inetAddr + "/30", "dev", inetIface},
		[]string{"ip", "-n", inet, "link", "set", inetIface, "up"},
		[]string{"ip", "-n", inet, "route", "add", public + "/32", "via", upAddr},
		[]string{"ip", "-n", ns, "route", "add", "default", "via", inetAddr},
		sh.InNS(ns, "sysctl", "-qw", "net.ipv4.ip_forward=1"),
		sh.InNS(ns, "nft", "add", "table", "ip", "nat"),
		sh.InNS(ns, "nft", "add", "chain", "ip", "nat", "post", "{ type nat hook postrouting priority 100 ; }"),
		sh.InNS(ns, "nft", "add", "rule", "ip", "nat", "post", "oifname", "up0", "snat", "to", public),
	)
}

func (n *network) labTable() error {
	ns := n.ns("internet")
	domestic := "{ " + strings.Join(domesticDestinations(), ", ") + " }"
	foreign := "{ " + strings.Join(foreignDestinations(), ", ") + " }"
	return sh.RunAll(
		sh.InNS(ns, "nft", "add", "table", "inet", "lab"),
		sh.InNS(ns, "nft", "add", "counter", "inet", "lab", counterStarlinkToDomestic),
		sh.InNS(ns, "nft", "add", "counter", "inet", "lab", counterDomesticToForeign),
		sh.InNS(ns, "nft", "add", "chain", "inet", "lab", "faults", "{ type filter hook prerouting priority -10 ; }"),
		sh.InNS(ns, "nft", "add", "chain", "inet", "lab", "leaks", "{ type filter hook input priority 0 ; }"),
		sh.InNS(ns, "nft", "add", "rule", "inet", "lab", "leaks", "iifname", "st0", "ip", "daddr", domestic, "counter", "name", counterStarlinkToDomestic),
		sh.InNS(ns, "nft", "add", "rule", "inet", "lab", "leaks", "iifname", "do0", "ip", "daddr", foreign, "counter", "name", counterDomesticToForeign),
	)
}

func (n *network) setFilters(filters []filter) error {
	ns := n.ns("internet")
	cmds := [][]string{sh.InNS(ns, "nft", "flush", "chain", "inet", "lab", "faults")}
	for _, f := range filters {
		rule := []string{"nft", "add", "rule", "inet", "lab", "faults"}
		if f.link != "" {
			rule = append(rule, "iifname", f.link[:2]+"0")
		}
		rule = append(rule, "ip", "daddr", f.target, "drop")
		cmds = append(cmds, sh.InNS(ns, rule...))
	}
	return sh.RunAll(cmds...)
}

func (n *network) counters(ctx context.Context) (map[string]uint64, error) {
	out, err := sh.Output(ctx, sh.InNS(n.ns("internet"), "nft", "-j", "list", "counters", "table", "inet", "lab")...)
	if err != nil {
		return nil, err
	}
	var doc struct {
		Nftables []map[string]json.RawMessage `json:"nftables"`
	}
	if err := json.Unmarshal(out, &doc); err != nil {
		return nil, err
	}
	result := map[string]uint64{}
	for _, item := range doc.Nftables {
		raw, ok := item["counter"]
		if !ok {
			continue
		}
		var c struct {
			Name    string `json:"name"`
			Packets uint64 `json:"packets"`
		}
		if err := json.Unmarshal(raw, &c); err == nil {
			result[c.Name] = c.Packets
		}
	}
	return result, nil
}

func (n *network) resetCounters() error {
	return sh.Run(sh.InNS(n.ns("internet"), "nft", "reset", "counters", "table", "inet", "lab")...)
}

func (n *network) port(idx int) (string, error) {
	bridge, tap := n.link("b", idx), n.link("t", idx)
	if err := sh.Run("ip", "link", "add", bridge, "type", "bridge"); err != nil {
		return "", err
	}
	n.links = append(n.links, bridge)
	if err := sh.Run("ip", "tuntap", "add", "dev", tap, "mode", "tap"); err != nil {
		return "", err
	}
	n.links = append(n.links, tap)

	return bridge, sh.RunAll(
		[]string{"ip", "link", "set", tap, "master", bridge},
		[]string{"ip", "link", "set", tap, "up"},
		[]string{"ip", "link", "set", bridge, "up"},
	)
}

func (n *network) attach(bridge, role, kind string, idx int, cidrs ...string) error {
	ns := n.ns(role)
	outer := n.link(kind, idx)
	inner := outer + "p"
	if err := sh.Run("ip", "link", "add", outer, "type", "veth", "peer", "name", inner); err != nil {
		return err
	}
	n.links = append(n.links, outer)

	cmds := [][]string{
		{"ip", "link", "set", outer, "master", bridge},
		{"ip", "link", "set", outer, "up"},
		{"ip", "link", "set", inner, "netns", ns},
		{"ip", "-n", ns, "link", "set", inner, "name", "lan0"},
	}
	for _, cidr := range cidrs {
		cmds = append(cmds, []string{"ip", "-n", ns, "addr", "add", cidr, "dev", "lan0"})
	}
	cmds = append(cmds, []string{"ip", "-n", ns, "link", "set", "lan0", "up"})
	return sh.RunAll(cmds...)
}

func (n *network) hostLink() error {
	outer := n.link("h", 0)
	inner := outer + "p"
	mgmt := n.ns("mgmt")
	if err := sh.Run("ip", "link", "add", outer, "type", "veth", "peer", "name", inner); err != nil {
		return err
	}
	n.links = append(n.links, outer)

	return sh.RunAll(
		[]string{"ip", "link", "set", inner, "netns", mgmt},
		[]string{"ip", "-n", mgmt, "link", "set", inner, "name", "host0"},
		[]string{"ip", "addr", "add", fmt.Sprintf("10.255.%d.1/30", n.hostIdx), "dev", outer},
		[]string{"ip", "link", "set", outer, "up"},
		[]string{"ip", "-n", mgmt, "addr", "add", n.hostAddr() + "/30", "dev", "host0"},
		[]string{"ip", "-n", mgmt, "link", "set", "host0", "up"},
	)
}

func (n *network) internetUplink() error {
	inet := n.ns("internet")
	outer := n.link("w", 0)
	inner := outer + "p"
	root := fmt.Sprintf("10.254.%d.1", n.hostIdx)
	peer := fmt.Sprintf("10.254.%d.2", n.hostIdx)
	table := "tl" + n.id

	if err := sh.Run("ip", "link", "add", outer, "type", "veth", "peer", "name", inner); err != nil {
		return err
	}
	n.links = append(n.links, outer)

	return sh.RunAll(
		[]string{"ip", "link", "set", inner, "netns", inet},
		[]string{"ip", "-n", inet, "link", "set", inner, "name", "wan0"},
		[]string{"ip", "addr", "add", root + "/30", "dev", outer},
		[]string{"ip", "link", "set", outer, "up"},
		[]string{"ip", "-n", inet, "addr", "add", peer + "/30", "dev", "wan0"},
		[]string{"ip", "-n", inet, "link", "set", "wan0", "up"},
		[]string{"ip", "-n", inet, "route", "add", "default", "via", root},
		sh.InNS(inet, "nft", "add", "table", "ip", "nat"),
		sh.InNS(inet, "nft", "add", "chain", "ip", "nat", "post", "{ type nat hook postrouting priority 100 ; }"),
		sh.InNS(inet, "nft", "add", "rule", "ip", "nat", "post", "oifname", "wan0", "masquerade"),
		[]string{"sysctl", "-qw", "net.ipv4.ip_forward=1"},
		[]string{"nft", "add", "table", "ip", table},
		[]string{"nft", "add", "chain", "ip", table, "post", "{ type nat hook postrouting priority 100 ; }"},
		[]string{"nft", "add", "rule", "ip", table, "post", "ip", "saddr", peer, "oifname", "!=", outer, "masquerade"},
		[]string{"nft", "add", "chain", "ip", table, "fwd", "{ type filter hook forward priority -10 ; }"},
		[]string{"nft", "add", "rule", "ip", table, "fwd", "iifname", outer, "accept"},
		[]string{"nft", "add", "rule", "ip", table, "fwd", "oifname", outer, "accept"},
	)
}

func (n *network) setLinkState(ns, iface string, up bool) error {
	state := "down"
	if up {
		state = "up"
	}
	return sh.Run("ip", "-n", n.ns(ns), "link", "set", iface, state)
}

func (n *network) mgmtResolver(server string) error {
	dir := "/etc/netns/" + n.ns("mgmt")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	return os.WriteFile(dir+"/resolv.conf", []byte("nameserver "+server+"\n"), 0o644)
}

func disableBridgeNetfilter() {
	for _, name := range []string{"bridge-nf-call-iptables", "bridge-nf-call-ip6tables", "bridge-nf-call-arptables"} {
		_ = os.WriteFile("/proc/sys/net/bridge/"+name, []byte("0"), 0o644)
	}
}

func (n *network) setDomesticSubnet(subnet string) error {
	if subnet == "" {
		return nil
	}
	ip, network, err := net.ParseCIDR(subnet)
	if err != nil {
		return err
	}
	base := ip.Mask(network.Mask).To4()
	if base == nil {
		return fmt.Errorf("%s is not IPv4", subnet)
	}
	host := func(last byte) string {
		return net.IPv4(base[0], base[1], base[2], last).String()
	}
	n.domesticGW, n.domesticFirst, n.domesticLast = host(1), host(100), host(200)
	return nil
}

func (n *network) mgmtInternet() error {
	outer := n.link("g", 0)
	inner := outer + "p"
	mgmt, inet := n.ns("mgmt"), n.ns("internet")
	return sh.RunAll(
		[]string{"ip", "link", "add", outer, "type", "veth", "peer", "name", inner},
		[]string{"ip", "link", "set", outer, "netns", mgmt},
		[]string{"ip", "-n", mgmt, "link", "set", outer, "name", "inet0"},
		[]string{"ip", "link", "set", inner, "netns", inet},
		[]string{"ip", "-n", inet, "link", "set", inner, "name", "mg0"},
		[]string{"ip", "-n", mgmt, "addr", "add", "10.253.0.1/30", "dev", "inet0"},
		[]string{"ip", "-n", mgmt, "link", "set", "inet0", "up"},
		[]string{"ip", "-n", inet, "addr", "add", "10.253.0.2/30", "dev", "mg0"},
		[]string{"ip", "-n", inet, "link", "set", "mg0", "up"},
		[]string{"ip", "-n", mgmt, "route", "add", "default", "via", "10.253.0.2"},
	)
}
