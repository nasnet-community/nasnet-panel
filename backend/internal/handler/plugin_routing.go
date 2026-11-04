package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"regexp"
	"sort"
	"strconv"
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
	if err := savePluginRouting(client, pluginID, routes); err != nil {
		return err
	}
	return syncStateFile(client, pluginStateDir(client, pluginID)+"/"+pluginStatePostWizard, postWizard)
}

// savePluginRouting writes the routing alone, and removes the file when there
// is none, leaving the post-wizard script as it is.
func savePluginRouting(client *routeros.Client, pluginID string, routes []PluginRoute) error {
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
	return syncStateFile(client, dir+"/"+pluginStateRouting, routing)
}

// reapplyPluginRouting puts the routing of an updated plugin's new manifest on
// the router and keeps it for the wizard, as install does. A plugin with no
// routing, now or before, is left alone. The post-wizard script stays as
// install wrote it, with the settings the user chose already in it.
func reapplyPluginRouting(client *routeros.Client, pluginID string, routes []PluginRoute) error {
	_, had, err := readPluginRouting(client, pluginID)
	if err != nil {
		had = true // unreadable: written again below
	}
	if len(routes) == 0 && !had {
		return nil
	}
	if err := applyPluginRouting(client, pluginID, routes); err != nil {
		return err
	}
	return savePluginRouting(client, pluginID, routes)
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

// What follows is for the wizard: it reads what install kept, writes the
// plugins' routing into its script and runs their post-wizard scripts.

// rsc is the rule as the wizard script has it. The wizard writes the rules for
// the domestic list with quoted values and the ones for a single address
// without, and the plugin rules follow each.
func (r pluginMangleRule) rsc(comment string) string {
	dst, mark := r.DstList, r.Mark
	if dst == domesticAddressListName {
		dst, mark = strconv.Quote(dst), strconv.Quote(mark)
	}
	return fmt.Sprintf(`add action=mark-routing chain=prerouting comment=%q dst-address-list=%s new-routing-mark=%s passthrough=no src-address=%s`,
		comment, dst, mark, r.Src)
}

// pluginDropRSC is a drop as syncPluginDrops makes it.
func pluginDropRSC(src, comment string) string {
	return fmt.Sprintf(`add action=drop chain=forward comment=%q dst-address-list=!%s src-address=%s`, comment, localAddressList, src)
}

// pluginListRSC puts an address in VPN-LAN, where the wizard's own rule marks it for to-VPN.
func pluginListRSC(address, comment string) string {
	return fmt.Sprintf(`add address=%s list=%q comment=%q`, address, vpnAddressList, comment)
}

// readPluginRouting returns the routing install kept for pluginID, and whether
// there was any. It is read back as strictly as a manifest, since it goes into a script.
func readPluginRouting(client *routeros.Client, pluginID string) ([]PluginRoute, bool, error) {
	name := pluginStateDir(client, pluginID) + "/" + pluginStateRouting
	exists, err := client.FileExists(name)
	if err != nil || !exists {
		return nil, false, err
	}
	contents, err := client.GetFileContents(name, 0)
	if err != nil {
		return nil, false, err
	}

	var file pluginRoutingFile
	if err := json.Unmarshal([]byte(contents), &file); err != nil {
		return nil, false, fmt.Errorf("the saved routing in %s can't be read: %w", name, err)
	}
	if err := validatePluginRoutes(file.Routing); err != nil {
		return nil, false, fmt.Errorf("the saved routing in %s is not valid: %w", name, err)
	}
	return file.Routing, true, nil
}

// installedPluginNames lists the containers on the router, a plugin being
// installed as a container named after its id. A router without the container
// package, or with containers switched off, has none.
func installedPluginNames(client *routeros.Client) ([]string, error) {
	installed, err := client.IsPackageInstalled("container")
	if err != nil || !installed {
		return nil, err
	}
	enabled, err := client.IsDeviceModeFeatureEnabled("container")
	if err != nil || !enabled {
		return nil, err
	}
	containers, err := client.ListContainers()
	if err != nil {
		return nil, err
	}

	names := make([]string, 0, len(containers))
	for i := range containers {
		if pluginIDPattern.MatchString(containers[i].Name) {
			names = append(names, containers[i].Name)
		}
	}
	sort.Strings(names)
	return names, nil
}

// installedPluginRouting is the routing of each installed plugin that has
// some. One whose saved routing can't be read fails the lot, because the
// wizard would then leave that plugin's addresses with no rule at all.
func installedPluginRouting(client *routeros.Client) ([]pluginRouting, error) {
	names, err := installedPluginNames(client)
	if err != nil {
		return nil, fmt.Errorf("failed to list the installed plugins: %w", err)
	}

	var plugins []pluginRouting
	for _, name := range names {
		routes, found, err := readPluginRouting(client, name)
		if err != nil {
			return nil, fmt.Errorf("plugin %s: %w; uninstall and install it again", name, err)
		}
		if found {
			plugins = append(plugins, pluginRouting{ID: name, Routes: routes})
		}
	}
	return plugins, nil
}

// pluginRouting is one installed plugin's routes.
type pluginRouting struct {
	ID     string
	Routes []PluginRoute
}

// pluginRoutingScript is the plugin part of the wizard script, one piece for
// each place wizard.tmpl puts it.
type pluginRoutingScript struct {
	AddressLists string
	Filter       string
	Mangle       string
}

// renderPluginRouting writes the wizard script's lines for the plugins. The
// wizard creates to-Foreign and to-VPN every time, and to-Domestic only when it
// is given a Domestic link, which is all it takes to tell what tables will exist.
func renderPluginRouting(plugins []pluginRouting, domesticEnabled bool) (pluginRoutingScript, error) {
	sorted := append([]pluginRouting(nil), plugins...)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].ID < sorted[j].ID })

	var lists, filter, mangle []string
	for _, plugin := range sorted {
		comment, err := pluginRoutingComment(plugin.ID)
		if err != nil {
			return pluginRoutingScript{}, err
		}
		if err := validatePluginRoutes(plugin.Routes); err != nil {
			return pluginRoutingScript{}, fmt.Errorf("plugin %s: %w", plugin.ID, err)
		}

		plan := planPluginRouting(plugin.Routes, func(table string) bool {
			return table != routingTableDomestic || domesticEnabled
		})
		for _, address := range plan.Lists {
			lists = append(lists, pluginListRSC(address, comment))
		}
		for _, src := range plan.Drops {
			filter = append(filter, pluginDropRSC(src, comment))
		}
		for _, rule := range plan.Mangle {
			mangle = append(mangle, rule.rsc(comment))
		}
	}
	return pluginRoutingScript{
		AddressLists: strings.Join(lists, "\n"),
		Filter:       strings.Join(filter, "\n"),
		Mangle:       strings.Join(mangle, "\n"),
	}, nil
}

// runPluginPostWizard runs the post-wizard script of each installed plugin that
// has one. The wizard has just removed every script and scheduler on the
// router, so this is what brings back the ones a plugin keeps there. The
// scripts run in the background on the router, one after another here, and a
// failing one is logged and does not stop the rest.
func runPluginPostWizard(client *routeros.Client) {
	names, err := installedPluginNames(client)
	if err != nil {
		log.Printf("[plugin-post-wizard] failed to list the installed plugins: %v", err)
		return
	}

	for _, name := range names {
		file := pluginStateDir(client, name) + "/" + pluginStatePostWizard
		exists, err := client.FileExists(file)
		if err != nil || !exists {
			if err != nil {
				log.Printf("[plugin-post-wizard %s] failed to look for its script: %v", name, err)
			}
			continue
		}
		script, err := client.GetFileContents(file, 0)
		if err != nil {
			log.Printf("[plugin-post-wizard %s] failed to read its script: %v", name, err)
			continue
		}
		if strings.TrimSpace(script) == "" {
			continue
		}
		if err := client.ExecuteScriptString(script); err != nil {
			log.Printf("[plugin-post-wizard %s] its script failed: %v", name, err)
		}
	}
}
