package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"regexp"
	"strings"

	"nasnet-panel/pkg/routeros"
)

// A plugin's container holds one or more source addresses on its veth, and the
// router sends each of them out through the link its manifest names. Install
// puts the rules on the router through the API; the wizard wipes every
// firewall rule and address list when it runs, so it writes them again from
// what install left on the router, without needing the registry.
//
// Everything made for a plugin carries the comment "plugin:<id>". It is how the
// rules are found again, and the only thing uninstall removes by: an entry
// without it is never touched.

const (
	// The routing tables the wizard creates, one for each link a plugin can use.
	routingTableForeign  = "to-Foreign"
	routingTableDomestic = "to-Domestic"
	routingTableVPN      = "to-VPN"

	// The wizard's own address lists. A source address in VPN-LAN is sent to
	// to-VPN by the rule the wizard already has for it.
	localAddressList = "LOCAL-IP"
	vpnAddressList   = "VPN-LAN"

	pluginRoutingPrefix = "plugin:"

	// What install leaves on the router for the wizard, in <storage>/nasnet-panel/plugins/<id>/.
	pluginStateRouting    = "routing.json"
	pluginStatePostWizard = "post-wizard.rsc"
)

// A plugin id ends up in comments, queries and paths, so it must be a plain slug.
var pluginIDPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,62}$`)

func pluginRoutingComment(pluginID string) (string, error) {
	if !pluginIDPattern.MatchString(pluginID) {
		return "", fmt.Errorf("%q is not a plugin id", pluginID)
	}
	return pluginRoutingPrefix + pluginID, nil
}

// pluginMangleRule marks everything one source address sends to a destination
// list with a routing table. The rules end the chain (passthrough=no), so the
// first one that matches decides.
type pluginMangleRule struct {
	Src     string
	DstList string // "!LOCAL-IP", or "DOMAddList" for the domestic destinations
	Mark    string
}

func (r pluginMangleRule) key() string { return r.Src + "|" + r.DstList + "|" + r.Mark }

// pluginRoutingPlan is what the router needs for a plugin's routes, given the
// links it has.
type pluginRoutingPlan struct {
	Lists  []string           // addresses to put in VPN-LAN
	Mangle []pluginMangleRule // in the order they must be tried
	Drops  []string           // source addresses to drop in forward
}

func routingTableFor(via string) string {
	switch via {
	case pluginViaDomestic:
		return routingTableDomestic
	case pluginViaVPN:
		return routingTableVPN
	}
	return routingTableForeign
}

// planPluginRouting works out the rules for routes. A route whose link has no
// routing table gets a drop in forward instead of a rule, so what it sends
// can never fall into the main table and out of the wrong link. Install and
// the wizard both plan here, and differ only in how they tell what tables exist.
func planPluginRouting(routes []PluginRoute, hasTable func(string) bool) pluginRoutingPlan {
	var plan pluginRoutingPlan
	for _, route := range routes {
		table := routingTableFor(route.Via)
		if !hasTable(table) {
			plan.Drops = append(plan.Drops, route.Address)
			continue
		}

		switch route.Via {
		case pluginViaVPN:
			plan.Lists = append(plan.Lists, route.Address)
		case pluginViaDomestic:
			plan.Mangle = append(plan.Mangle, pluginMangleRule{Src: route.Address, DstList: "!" + localAddressList, Mark: table})
		default:
			// The domestic destinations go first: both rules end the chain.
			if route.DomesticDirect && hasTable(routingTableDomestic) {
				plan.Mangle = append(plan.Mangle, pluginMangleRule{Src: route.Address, DstList: domesticAddressListName, Mark: routingTableDomestic})
			}
			plan.Mangle = append(plan.Mangle, pluginMangleRule{Src: route.Address, DstList: "!" + localAddressList, Mark: table})
		}
	}
	return plan
}

// staleRule is a rule or list entry that carries a plugin's comment but is not
// what its routing asks for any more.
type staleRule struct {
	kind string // mangle, filter or address-list
	id   string
}

// applyPluginRouting makes the router carry the routing of a plugin's routes
// and nothing else under its comment, changing only what differs, so running
// it again changes nothing. What is wanted is added before anything stale is
// removed, so an address is never left unrouted in between.
func applyPluginRouting(client *routeros.Client, pluginID string, routes []PluginRoute) error {
	comment, err := pluginRoutingComment(pluginID)
	if err != nil {
		return err
	}
	if err := validatePluginRoutes(routes); err != nil {
		return err
	}

	tables, err := client.ListRoutingTables()
	if err != nil {
		return fmt.Errorf("failed to list the routing tables: %w", err)
	}
	have := make(map[string]bool, len(tables))
	for i := range tables {
		have[tables[i].Name] = true
	}
	plan := planPluginRouting(routes, func(table string) bool { return have[table] })

	var stale []staleRule
	for _, sync := range []func() ([]staleRule, error){
		func() ([]staleRule, error) { return syncPluginAddressList(client, comment, plan.Lists) },
		func() ([]staleRule, error) { return syncPluginMangle(client, comment, plan.Mangle) },
		func() ([]staleRule, error) { return syncPluginDrops(client, comment, plan.Drops) },
	} {
		more, err := sync()
		if err != nil {
			return err
		}
		stale = append(stale, more...)
	}
	return removeStaleRules(client, stale)
}

func syncPluginAddressList(client *routeros.Client, comment string, wanted []string) ([]staleRule, error) {
	existing, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{Comment: comment})
	if err != nil {
		return nil, err
	}

	want := make(map[string]bool, len(wanted))
	for _, address := range wanted {
		want[address] = true
	}
	have := make(map[string]bool, len(wanted))
	var stale []staleRule
	for i := range existing {
		item := &existing[i]
		if item.Comment != comment {
			continue // never trust the router's filtering with a delete
		}
		if item.List == vpnAddressList && !item.Disabled && want[item.Address] && !have[item.Address] {
			have[item.Address] = true
			continue
		}
		stale = append(stale, staleRule{"address-list", item.ID})
	}

	for _, address := range wanted {
		if have[address] {
			continue
		}
		// An entry somebody else made does the same job, and the router refuses a twin.
		others, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{ListName: vpnAddressList, Address: address})
		if err != nil {
			return nil, err
		}
		if listedByOthers(others, comment) {
			log.Printf("[plugin-routing %s] %s is in %s already, leaving that entry as it is", comment, address, vpnAddressList)
			continue
		}
		if _, err := client.AddFirewallAddressListItem(vpnAddressList, address, false, comment); err != nil {
			return nil, err
		}
	}
	return stale, nil
}

// listedByOthers reports whether items has an entry that is not the plugin's own.
func listedByOthers(items []routeros.FirewallAddressListItem, comment string) bool {
	for i := range items {
		if items[i].Comment != comment {
			return true
		}
	}
	return false
}

func syncPluginMangle(client *routeros.Client, comment string, wanted []pluginMangleRule) ([]staleRule, error) {
	existing, err := client.ListMangleRulesByComment(comment)
	if err != nil {
		return nil, err
	}

	want := make(map[string]bool, len(wanted))
	for _, rule := range wanted {
		want[rule.key()] = true
	}
	haveID := make(map[string]string, len(wanted))
	var stale []staleRule
	for i := range existing {
		rule := &existing[i]
		if rule.Comment != comment {
			continue
		}
		key := pluginMangleRule{Src: rule.SrcAddr, DstList: rule.DstAddressList, Mark: rule.NewRoutingMark}.key()
		isOurs := rule.Chain == "prerouting" && rule.Action == "mark-routing" && !rule.PassThrough && !rule.Disabled
		if _, dup := haveID[key]; isOurs && want[key] && !dup {
			haveID[key] = rule.ID
			continue
		}
		stale = append(stale, staleRule{"mangle", rule.ID})
	}

	// The first match ends the chain, so these rules must come before any generic
	// one that could take the same source, such as the wizard's rules for a whole
	// address list. Those are all mark-routing rules, so none of them is ahead of
	// the first one that isn't a plugin's, and the new rules go right before it.
	// Working from the end keeps the planned order, and puts a missing rule in
	// front of a later one that is already there, not ahead of the lot.
	before, err := firstGenericMarkRule(client)
	if err != nil {
		return nil, err
	}
	for i := len(wanted) - 1; i >= 0; i-- {
		if id, ok := haveID[wanted[i].key()]; ok {
			before = id
			continue
		}
		id, err := client.AddMangleRule(routeros.MangleRuleConfig{
			Chain:          "prerouting",
			Action:         "mark-routing",
			SrcAddr:        wanted[i].Src,
			DstAddressList: wanted[i].DstList,
			NewRoutingMark: wanted[i].Mark,
			PlaceBefore:    before,
			Comment:        comment,
		})
		if err != nil {
			return nil, err
		}
		before = id
	}
	return stale, nil
}

// firstGenericMarkRule is the id of the first mark-routing rule in prerouting
// that is not a plugin's, or "" when there is none and a new rule can go last.
func firstGenericMarkRule(client *routeros.Client) (string, error) {
	rules, err := client.ListMangleRulesInChain("prerouting")
	if err != nil {
		return "", err
	}
	for i := range rules {
		if rules[i].Action == "mark-routing" && !strings.HasPrefix(rules[i].Comment, pluginRoutingPrefix) {
			return rules[i].ID, nil
		}
	}
	return "", nil
}

// syncPluginDrops makes the drops in forward for the addresses whose link has no
// routing table. A drop leaves local destinations alone, as the mark rules do: a
// reply to a LAN client is no leak, and the plugin's own web page has to keep
// working when its link is missing.
func syncPluginDrops(client *routeros.Client, comment string, wanted []string) ([]staleRule, error) {
	existing, err := client.ListFirewallFilterRulesByComment(comment)
	if err != nil {
		return nil, err
	}

	want := make(map[string]bool, len(wanted))
	for _, src := range wanted {
		want[src] = true
	}
	have := make(map[string]bool, len(wanted))
	var stale []staleRule
	for i := range existing {
		rule := &existing[i]
		if rule.Comment != comment {
			continue
		}
		isOurs := rule.Chain == "forward" && rule.Action == "drop" && !rule.Disabled && rule.DstAddressList == "!"+localAddressList
		if isOurs && want[rule.SrcAddr] && !have[rule.SrcAddr] {
			have[rule.SrcAddr] = true
			continue
		}
		stale = append(stale, staleRule{"filter", rule.ID})
	}

	var missing []string
	for _, src := range wanted {
		if !have[src] {
			missing = append(missing, src)
		}
	}
	if len(missing) == 0 {
		return stale, nil
	}

	// Ahead of everything, so no accept above it can let the traffic through.
	chain, err := client.ListFirewallFilterRulesInChain("forward")
	if err != nil {
		return nil, err
	}
	top := ""
	if len(chain) > 0 {
		top = chain[0].ID
	}
	for _, src := range missing {
		if _, err := client.AddFirewallRule(routeros.FirewallRuleConfig{
			Chain:          "forward",
			Action:         "drop",
			SrcAddr:        src,
			DstAddressList: "!" + localAddressList,
			PlaceBefore:    top,
			Comment:        comment,
		}); err != nil {
			return nil, err
		}
	}
	return stale, nil
}

func removeStaleRules(client *routeros.Client, stale []staleRule) error {
	var errs []error
	for _, rule := range stale {
		var err error
		switch rule.kind {
		case "mangle":
			err = client.RemoveMangleRule(rule.id)
		case "filter":
			err = client.RemoveFirewallRule(rule.id)
		default:
			err = client.RemoveFirewallAddressListItem(rule.id)
		}
		if err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}

// removePluginRouting removes every mangle rule, filter rule and address list
// entry whose comment is exactly the plugin's, and nothing else.
func removePluginRouting(client *routeros.Client, pluginID string) error {
	comment, err := pluginRoutingComment(pluginID)
	if err != nil {
		return err
	}

	var stale []staleRule
	mangle, err := client.ListMangleRulesByComment(comment)
	if err != nil {
		return err
	}
	for i := range mangle {
		if mangle[i].Comment == comment {
			stale = append(stale, staleRule{"mangle", mangle[i].ID})
		}
	}
	filter, err := client.ListFirewallFilterRulesByComment(comment)
	if err != nil {
		return err
	}
	for i := range filter {
		if filter[i].Comment == comment {
			stale = append(stale, staleRule{"filter", filter[i].ID})
		}
	}
	lists, err := client.ListFirewallAddressListItems(routeros.FirewallAddressListFilter{Comment: comment})
	if err != nil {
		return err
	}
	for i := range lists {
		if lists[i].Comment == comment {
			stale = append(stale, staleRule{"address-list", lists[i].ID})
		}
	}
	return removeStaleRules(client, stale)
}

// What install keeps on the router for the wizard: the routing, and the
// plugin's post-wizard script with its settings already filled in, so the wizard
// needs no registry. The plugin's data folder is no place for them: its
// container can write there, and a kept folder outlives the plugin.

func pluginStateDir(client *routeros.Client, pluginID string) string {
	return pluginStoragePrefix(client) + routeros.NasnetPanelDir + "/plugins/" + pluginID
}

// savePluginState writes the routing and post-wizard script for pluginID, and
// removes whichever of the two an earlier install left that this one doesn't have.
func savePluginState(client *routeros.Client, pluginID string, routes []PluginRoute, postWizard string) error {
	if !pluginIDPattern.MatchString(pluginID) {
		return fmt.Errorf("%q is not a plugin id", pluginID)
	}

	dir := pluginStateDir(client, pluginID)
	panelDir := pluginStoragePrefix(client) + routeros.NasnetPanelDir
	for _, d := range []string{panelDir, panelDir + "/plugins", dir} {
		if err := client.EnsureDir(d); err != nil {
			return err
		}
	}

	var routing string
	if len(routes) > 0 {
		data, err := json.Marshal(pluginRoutingFile{Routing: routes})
		if err != nil {
			return err
		}
		routing = string(data) + "\n"
	}
	if err := syncStateFile(client, dir+"/"+pluginStateRouting, routing); err != nil {
		return err
	}
	return syncStateFile(client, dir+"/"+pluginStatePostWizard, postWizard)
}

// syncStateFile makes the file hold contents, or not exist when contents is
// empty, and writes nothing when it is right already, to spare the flash.
func syncStateFile(client *routeros.Client, name, contents string) error {
	exists, err := client.FileExists(name)
	if err != nil {
		return err
	}
	if contents == "" {
		if exists {
			return client.DeleteFile(name)
		}
		return nil
	}
	if exists {
		current, err := client.GetFileContents(name, 0)
		if err != nil {
			return err
		}
		if current == contents {
			return nil
		}
	}
	return client.AddFile(name, contents)
}

// removePluginState deletes the plugin's folder, if it has one.
func removePluginState(client *routeros.Client, pluginID string) error {
	if !pluginIDPattern.MatchString(pluginID) {
		return fmt.Errorf("%q is not a plugin id", pluginID)
	}
	dir := pluginStateDir(client, pluginID)
	exists, err := client.FileExists(dir)
	if err != nil || !exists {
		return err
	}
	return client.DeleteFile(dir)
}

type pluginRoutingFile struct {
	Routing []PluginRoute `json:"routing"`
}
