package failover

import (
	"fmt"
	"sort"
	"strings"

	"nasnet-panel/internal/db"
	"nasnet-panel/pkg/routeros"
)

// Entry is one VPN client of the failover: its interface, the probe address its
// failover routes point at, its distance, and the routes that carry that distance.
type Entry struct {
	Interface string
	Gateway   string
	Distance  int
	Routes    []routeros.IPRouteInfo
}

// RoleIndex returns the position of a role name, or -1 when it is not one.
func RoleIndex(role string) int {
	for i, name := range roleNames {
		if name == role {
			return i
		}
	}
	return -1
}

// RoleNames returns the valid role names in failover order.
func RoleNames() []string {
	return append([]string(nil), roleNames[:]...)
}

// LoadEntries reads the failover clients from the router's routes, ordered by distance.
func LoadEntries(client *routeros.Client) ([]Entry, error) {
	routes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{
		RoutingTable: routingTable,
		DstAddress:   "0.0.0.0/0",
	})
	if err != nil {
		return nil, err
	}
	probes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{
		RoutingTable: "main",
		Scope:        probeScope,
		Dynamic:      "false",
	})
	if err != nil {
		return nil, err
	}

	resolverDsts, err := resolverRoutes(client)
	if err != nil {
		return nil, err
	}
	var resolvers []routeros.IPRouteInfo
	for _, dst := range resolverDsts {
		found, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{RoutingTable: "main", DstAddress: dst})
		if err != nil {
			return nil, err
		}
		resolvers = append(resolvers, found...)
	}

	interfaceByProbe := make(map[string]string, len(probes))
	for i := range probes {
		probe := &probes[i]
		if probe.Gateway == "" || !strings.HasSuffix(probe.DstAddress, "/32") {
			continue
		}
		interfaceByProbe[strings.TrimSuffix(probe.DstAddress, "/32")] = probe.Gateway
	}

	sort.SliceStable(routes, func(i, j int) bool { return routes[i].Distance < routes[j].Distance })

	entries := make([]Entry, 0, len(routes))
	for i := range routes {
		route := &routes[i]
		gateway, _, _ := strings.Cut(route.Gateway, "@")
		iface, ok := interfaceByProbe[gateway]
		if !ok {
			continue
		}
		entry := Entry{Interface: iface, Gateway: gateway, Distance: route.Distance, Routes: []routeros.IPRouteInfo{*route}}
		for j := range resolvers {
			if resolverGateway, _, _ := strings.Cut(resolvers[j].Gateway, "@"); resolverGateway == gateway {
				entry.Routes = append(entry.Routes, resolvers[j])
			}
		}
		entries = append(entries, entry)
	}

	return entries, nil
}

// StandbyRole is the role name of a failover client that is behind the three roles.
const StandbyRole = "standby"

// Roles maps each failover client's interface to its role: the first three clients by
// distance are primary, backup1 and backup2, every one after them is standby.
func Roles(client *routeros.Client) (map[string]string, error) {
	entries, err := LoadEntries(client)
	if err != nil {
		return nil, err
	}

	result := make(map[string]string, len(roleNames))
	for i := range entries {
		if i >= len(roleNames) {
			result[entries[i].Interface] = StandbyRole
			continue
		}
		result[entries[i].Interface] = roleNames[i]
	}
	return result, nil
}

// ActiveInterface returns the interface whose to-VPN default route the router is using, or
// an empty string when none is active.
func ActiveInterface(client *routeros.Client) (string, error) {
	entries, err := LoadEntries(client)
	if err != nil {
		return "", err
	}
	for i := range entries {
		if len(entries[i].Routes) > 0 && entries[i].Routes[0].Active {
			return entries[i].Interface, nil
		}
	}
	return "", nil
}

// Records returns the failover clients as the database stores them.
func Records(client *routeros.Client) ([]db.FailoverInterface, error) {
	entries, err := LoadEntries(client)
	if err != nil {
		return nil, err
	}

	rows := make([]db.FailoverInterface, 0, len(entries))
	for i := range entries {
		rows = append(rows, db.FailoverInterface{Interface: entries[i].Interface, ProbeIP: entries[i].Gateway, Distance: entries[i].Distance})
	}
	return rows, nil
}

// Assign gives the interface the failover role. The client that held the role is moved
// above every failover client. An interface that is not in the failover yet gets its routes created.
func Assign(client *routeros.Client, interfaceName, role string) error {
	if err := applyRole(client, interfaceName, role); err != nil {
		return err
	}
	return Relabel(client)
}

func applyRole(client *routeros.Client, interfaceName, role string) error {
	slot := RoleIndex(role)
	if slot < 0 {
		return fmt.Errorf("failoverRole must be one of %s", strings.Join(roleNames[:], ", "))
	}

	entries, err := LoadEntries(client)
	if err != nil {
		return err
	}

	target := -1
	highest := len(roleNames)
	for i := range entries {
		if entries[i].Interface == interfaceName {
			target = i
		}
		if entries[i].Distance > highest {
			highest = entries[i].Distance
		}
	}
	if target == slot {
		return nil
	}

	slotDistance := slot + 1
	if slot < len(entries) {
		slotDistance = entries[slot].Distance
	}

	if target < 0 {
		probe, err := freeProbe(entries)
		if err != nil {
			return err
		}
		if err := addRoutes(client, interfaceName, probe, roleLabels[slot], slotDistance); err != nil {
			return err
		}
	} else if err := setDistance(client, &entries[target], slotDistance); err != nil {
		return err
	}

	if slot < len(entries) {
		return setDistance(client, &entries[slot], highest+1)
	}
	return nil
}

// Restore makes the router's failover routes match the stored failover interfaces. An
// interface that already has failover routes only gets its distance set; one that has none
// gets them created. Problems are returned per interface and do not stop the others.
func Restore(client *routeros.Client, rows []db.FailoverInterface) []error {
	if len(rows) == 0 {
		return nil
	}

	entries, err := LoadEntries(client)
	if err != nil {
		return []error{err}
	}
	byInterface := make(map[string]*Entry, len(entries))
	usedProbes := make(map[string]string, len(entries))
	for i := range entries {
		byInterface[entries[i].Interface] = &entries[i]
		usedProbes[entries[i].Gateway] = entries[i].Interface
	}

	var errs []error
	for i := range rows {
		row := &rows[i]
		if entry, ok := byInterface[row.Interface]; ok {
			if entry.Distance != row.Distance {
				if err := setDistance(client, entry, row.Distance); err != nil {
					errs = append(errs, fmt.Errorf("failover interface %s: %w", row.Interface, err))
				}
			}
			continue
		}

		if owner, taken := usedProbes[row.ProbeIP]; taken {
			errs = append(errs, fmt.Errorf("failover interface %s: probe address %s already belongs to %s", row.Interface, row.ProbeIP, owner))
			continue
		}
		if _, err := client.GetVPNClient(row.Interface); err != nil {
			errs = append(errs, fmt.Errorf("failover interface %s: the VPN client does not exist: %w", row.Interface, err))
			continue
		}

		label := standbyLabel
		if i < len(roleLabels) {
			label = roleLabels[i]
		}
		if err := addRoutes(client, row.Interface, row.ProbeIP, label, row.Distance); err != nil {
			errs = append(errs, fmt.Errorf("failover interface %s: %w", row.Interface, err))
			continue
		}
		usedProbes[row.ProbeIP] = row.Interface
	}
	if err := Relabel(client); err != nil {
		errs = append(errs, fmt.Errorf("failover route comments: %w", err))
	}
	return errs
}

// Relabel rewrites the comments of every failover route so each names the role its client
// holds by distance order: the probe, probe guard, default and resolver routes.
func Relabel(client *routeros.Client) error {
	entries, err := LoadEntries(client)
	if err != nil {
		return err
	}
	resolverDsts, err := resolverRoutes(client)
	if err != nil {
		return err
	}

	for i := range entries {
		entry := &entries[i]
		label := standbyLabel
		if i < len(roleLabels) {
			label = roleLabels[i]
		}
		suffix := " (" + entry.Interface + ")"

		for j := range entry.Routes {
			route := &entry.Routes[j]
			comment := failoverCommentPrefix + label + suffix
			if j > 0 {
				name := ""
				for k, dst := range resolverDsts {
					if dst == route.DstAddress {
						name = ResolverNames[k]
						break
					}
				}
				if name == "" {
					continue
				}
				comment = failoverCommentPrefix + "resolver " + name + " " + label + suffix
			}
			if err := setComment(client, route, comment); err != nil {
				return err
			}
		}

		probes, err := client.ListIPRoutesWithFilters(routeros.IPRouteFilter{RoutingTable: "main", DstAddress: entry.Gateway + "/32"})
		if err != nil {
			return err
		}
		for j := range probes {
			route := &probes[j]
			var comment string
			switch {
			case strings.HasPrefix(route.Comment, probeGuardCommentPrefix):
				comment = probeGuardCommentPrefix + label
			case strings.HasPrefix(route.Comment, probeCommentPrefix):
				comment = probeCommentPrefix + label + suffix
			default:
				continue
			}
			if err := setComment(client, route, comment); err != nil {
				return err
			}
		}
	}
	return nil
}

func setComment(client *routeros.Client, route *routeros.IPRouteInfo, comment string) error {
	if route.Comment == comment {
		return nil
	}
	return client.SetIPRouteComment(route.ID, comment)
}

func setDistance(client *routeros.Client, entry *Entry, distance int) error {
	for i := range entry.Routes {
		if err := client.SetIPRouteDistance(entry.Routes[i].ID, distance); err != nil {
			return err
		}
	}
	return nil
}

func freeProbe(entries []Entry) (string, error) {
	used := make(map[string]bool, len(entries))
	for i := range entries {
		used[entries[i].Gateway] = true
	}
	for _, probe := range ProbePool {
		if !used[probe] {
			return probe, nil
		}
	}
	return "", ErrNoFreeProbe
}

// resolverRoutes returns the /32 destinations of the VPN resolvers, which are the first
// address of the VPN-Primary, VPN-Backup1 and VPN-Backup2 DNS forwarders. A forwarder that is
// missing or empty falls back to its default address.
func resolverRoutes(client *routeros.Client) ([]string, error) {
	forwarders, err := client.ListDNSForwarders()
	if err != nil {
		return nil, err
	}

	routes := make([]string, len(ResolverNames))
	for i, name := range ResolverNames {
		routes[i] = defaultResolverIPs[i] + "/32"
		for j := range forwarders {
			if strings.TrimSpace(forwarders[j].Name) == name && len(forwarders[j].DNSServers) > 0 {
				routes[i] = forwarders[j].DNSServers[0] + "/32"
				break
			}
		}
	}
	return routes, nil
}

func addRoutes(client *routeros.Client, interfaceName, probe, label string, distance int) error {
	resolverDsts, err := resolverRoutes(client)
	if err != nil {
		return err
	}

	var created []string
	add := func(config routeros.RouteConfig) error {
		id, err := client.AddRoute(config)
		if err != nil {
			return err
		}
		created = append(created, id)
		return nil
	}

	err = func() error {
		if err := add(routeros.RouteConfig{
			DstAddress: probe + "/32", Gateway: interfaceName, RoutingTable: "main", Scope: 10,
			Comment: "Failover probe " + label + " (" + interfaceName + ")",
		}); err != nil {
			return err
		}
		if err := add(routeros.RouteConfig{
			DstAddress: probe + "/32", Blackhole: true, RoutingTable: "main", Distance: guardDistance, Scope: guardScope,
			Comment: "Failover probe guard " + label,
		}); err != nil {
			return err
		}
		if err := add(routeros.RouteConfig{
			DstAddress: "0.0.0.0/0", Gateway: probe + "@main", RoutingTable: routingTable, Distance: distance,
			TargetScope: targetScope, CheckGateway: "ping",
			Comment: "Failover " + label + " (" + interfaceName + ")",
		}); err != nil {
			return err
		}
		for i, dst := range resolverDsts {
			if err := add(routeros.RouteConfig{
				DstAddress: dst, Gateway: probe, RoutingTable: "main", Distance: distance,
				TargetScope: targetScope, CheckGateway: "ping",
				Comment: "Failover resolver " + ResolverNames[i] + " " + label + " (" + interfaceName + ")",
			}); err != nil {
				return err
			}
		}
		return nil
	}()
	if err != nil {
		for _, id := range created {
			_ = client.RemoveIPRoute(id)
		}
	}
	return err
}
