package failover

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"text/template"

	nastemplate "nasnet-panel/internal/template"
	"nasnet-panel/pkg/routeros"
)

// ErrInvalidClientName means the interface name cannot be used in the failover segment.
var ErrInvalidClientName = errors.New("the VPN client name may only contain letters, digits, dots, dashes and underscores")

// ErrNoFreeSegment means every pinned segment subnet is already in use.
var ErrNoFreeSegment = errors.New("no free failover segment subnet is left")

var clientNamePattern = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)

// Segment is the pinned LAN segment of one failover VPN client as failover_segment.tmpl sees it.
type Segment struct {
	Name      string
	ProbeIP   string
	Bridge    string
	ListName  string
	Table     string
	Subnet    string
	Network   string
	Gateway   string
	Address   string
	PoolRange string
}

func newSegment(name, probe string, index int) Segment {
	subnet := fmt.Sprintf(segmentSubnetFormat, index)
	return Segment{
		Name:      name,
		ProbeIP:   probe,
		Bridge:    segmentBridgePrefix + name,
		ListName:  name + segmentListSuffix,
		Table:     segmentTablePrefix + name,
		Subnet:    subnet + ".0/24",
		Network:   subnet + ".0",
		Gateway:   subnet + ".1",
		Address:   subnet + ".1/24",
		PoolRange: subnet + ".2-" + subnet + ".254",
	}
}

// Enroll puts a VPN client that is not in the failover yet through the same setup the
// wizard gives its clients: the failover routes, then the pinned LAN segment with its
// bridge, interface list, DHCP server, routing table, rules and DNS redirect. A client
// that already is in the failover is left as it is.
func Enroll(client *routeros.Client, interfaceName string) error {
	if !clientNamePattern.MatchString(interfaceName) {
		return ErrInvalidClientName
	}

	entries, err := LoadEntries(client)
	if err != nil {
		return err
	}
	highest := 0
	for i := range entries {
		if entries[i].Interface == interfaceName {
			return nil
		}
		if entries[i].Distance > highest {
			highest = entries[i].Distance
		}
	}

	probe, err := freeProbe(entries)
	if err != nil {
		return err
	}
	index, err := freeSegmentIndex(client)
	if err != nil {
		return err
	}

	label := standbyLabel
	if len(entries) < len(roleLabels) {
		label = roleLabels[len(entries)]
	}
	if err := addRoutes(client, interfaceName, probe, label, highest+1); err != nil {
		return err
	}

	script, err := renderSegment(newSegment(interfaceName, probe, index))
	if err == nil {
		err = client.ExecuteScriptString(script)
	}
	if err != nil {
		removeRoutes(client, interfaceName)
		return fmt.Errorf("failed to create the pinned segment of %s: %w", interfaceName, err)
	}
	return nil
}

// SegmentBridges returns the names of the bridges that already exist on the router.
func SegmentBridges(client *routeros.Client) (map[string]bool, error) {
	bridges, err := client.ListBridges()
	if err != nil {
		return nil, err
	}
	names := make(map[string]bool, len(bridges))
	for i := range bridges {
		names[bridges[i].Name] = true
	}
	return names, nil
}

// EnsureSegment gives a failover VPN client its pinned LAN segment when the router has none
// for it, using the probe address its failover routes already use. A client whose segment
// exists is left as it is. The existing map is the result of SegmentBridges and is updated.
func EnsureSegment(client *routeros.Client, existing map[string]bool, interfaceName, probe string) error {
	if !clientNamePattern.MatchString(interfaceName) {
		return ErrInvalidClientName
	}
	if existing[segmentBridgePrefix+interfaceName] {
		return nil
	}

	index, err := freeSegmentIndex(client)
	if err != nil {
		return err
	}
	script, err := renderSegment(newSegment(interfaceName, probe, index))
	if err == nil {
		err = client.ExecuteScriptString(script)
	}
	if err != nil {
		return fmt.Errorf("failed to create the pinned segment of %s: %w", interfaceName, err)
	}
	existing[segmentBridgePrefix+interfaceName] = true
	return nil
}

// Withdraw removes everything Enroll or the wizard created for a VPN client: its failover
// routes and its pinned LAN segment. Missing pieces are not an error.
func Withdraw(client *routeros.Client, interfaceName string) error {
	removeRoutes(client, interfaceName)
	if !clientNamePattern.MatchString(interfaceName) {
		return nil
	}
	return client.ExecuteScriptString(withdrawScript(interfaceName))
}

func removeRoutes(client *routeros.Client, interfaceName string) {
	removeRoutesByComment(client, interfaceName)

	entries, err := LoadEntries(client)
	if err != nil {
		return
	}
	for i := range entries {
		if entries[i].Interface != interfaceName {
			continue
		}
		for j := range entries[i].Routes {
			_ = client.RemoveIPRoute(entries[i].Routes[j].ID)
		}
		probes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{RoutingTable: "main", DstAddress: entries[i].Gateway + "/32"})
		if err != nil {
			return
		}
		for j := range probes {
			_ = client.RemoveIPRoute(probes[j].ID)
		}
	}
}

func removeRoutesByComment(client *routeros.Client, interfaceName string) {
	routes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{Dynamic: "false"})
	if err != nil {
		return
	}

	suffix := " (" + interfaceName + ")"
	probes := make(map[string]bool)
	for i := range routes {
		route := &routes[i]
		if !strings.HasPrefix(route.Comment, failoverCommentPrefix) || !strings.HasSuffix(route.Comment, suffix) {
			continue
		}
		if strings.HasPrefix(route.Comment, probeCommentPrefix) {
			probes[route.DstAddress] = true
		}
		_ = client.RemoveIPRoute(route.ID)
	}

	for i := range routes {
		if strings.HasPrefix(routes[i].Comment, probeGuardCommentPrefix) && probes[routes[i].DstAddress] {
			_ = client.RemoveIPRoute(routes[i].ID)
		}
	}
}

func freeSegmentIndex(client *routeros.Client) (int, error) {
	addresses, err := client.ListIPAddresses()
	if err != nil {
		return 0, err
	}
	for index := 1; index <= segmentMaxIndex; index++ {
		prefix := fmt.Sprintf(segmentSubnetFormat, index) + "."
		used := false
		for i := range addresses {
			if strings.HasPrefix(addresses[i].Address, prefix) {
				used = true
				break
			}
		}
		if !used {
			return index, nil
		}
	}
	return 0, ErrNoFreeSegment
}

func renderSegment(segment Segment) (string, error) {
	raw, err := nastemplate.Files.ReadFile("failover_segment.tmpl")
	if err != nil {
		return "", err
	}
	tmpl, err := template.New("failover_segment").Parse(string(raw))
	if err != nil {
		return "", err
	}
	var out strings.Builder
	if err := tmpl.Execute(&out, segment); err != nil {
		return "", err
	}
	return out.String(), nil
}

func withdrawScript(name string) string {
	segment := newSegment(name, "", 0)
	comment := "Failover pinned " + name
	lines := []string{
		fmt.Sprintf(`/ip firewall nat remove [find comment=%q]`, "Failover DNS "+name),
		fmt.Sprintf(`/ip firewall mangle remove [find comment=%q]`, comment+" routing"),
		fmt.Sprintf(`/ip route remove [find comment=%q]`, comment+" default"),
		fmt.Sprintf(`/ip route remove [find comment=%q]`, comment+" blackhole"),
		fmt.Sprintf(`/routing rule remove [find comment=%q]`, comment+" router"),
		fmt.Sprintf(`/routing rule remove [find comment=%q]`, comment+" SRC"),
		fmt.Sprintf(`/routing rule remove [find comment=%q]`, comment+" mark"),
		fmt.Sprintf(`/routing table remove [find name=%q]`, segment.Table),
		fmt.Sprintf(`/ip firewall address-list remove [find comment=%q]`, comment),
		fmt.Sprintf(`/ip nat-pmp interfaces remove [find interface=%q]`, segment.Bridge),
		fmt.Sprintf(`/ip dhcp-server remove [find name=%q]`, "DHCP-"+name),
		fmt.Sprintf(`/ip dhcp-server network remove [find comment=%q]`, comment),
		fmt.Sprintf(`/ip pool remove [find name=%q]`, "DHCP-pool-"+name),
		fmt.Sprintf(`/ip address remove [find comment=%q]`, comment),
		fmt.Sprintf(`/interface list member remove [find comment=%q]`, comment),
		fmt.Sprintf(`/interface list remove [find name=%q]`, segment.ListName),
		fmt.Sprintf(`/interface bridge remove [find name=%q]`, segment.Bridge),
	}
	return strings.Join(lines, "\n")
}
