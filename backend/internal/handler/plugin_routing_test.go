package handler

import (
	"fmt"
	"slices"
	"strings"
	"testing"
)

const (
	dotSixteen  = "192.168.50.16"
	dotSeventen = "192.168.50.17"
	dotEighteen = "192.168.50.18"
)

// remoteNodesRoutes is the routing of a plugin with three roles: downloads
// out the foreign link, the exit through the VPN, the tunnel through the
// domestic link.
func remoteNodesRoutes() []PluginRoute {
	return []PluginRoute{
		{Address: dotSixteen, Via: pluginViaForeign},
		{Address: dotSeventen, Via: pluginViaVPN},
		{Address: dotEighteen, Via: pluginViaDomestic},
	}
}

func allTables() func(string) bool { return func(string) bool { return true } }

func tablesExcept(missing ...string) func(string) bool {
	return func(table string) bool { return !slices.Contains(missing, table) }
}

func TestPlanPluginRouting(t *testing.T) {
	foreign := pluginMangleRule{Src: dotSixteen, DstList: "!LOCAL-IP", Mark: "to-Foreign"}
	domestic := pluginMangleRule{Src: dotEighteen, DstList: "!LOCAL-IP", Mark: "to-Domestic"}

	for _, tc := range []struct {
		name   string
		routes []PluginRoute
		has    func(string) bool
		want   pluginRoutingPlan
	}{
		{
			name:   "all three roles with every link",
			routes: remoteNodesRoutes(),
			has:    allTables(),
			want:   pluginRoutingPlan{Lists: []string{dotSeventen}, Mangle: []pluginMangleRule{foreign, domestic}},
		},
		{
			name:   "no domestic link: its address is dropped, not left to the main table",
			routes: remoteNodesRoutes(),
			has:    tablesExcept("to-Domestic"),
			want:   pluginRoutingPlan{Lists: []string{dotSeventen}, Mangle: []pluginMangleRule{foreign}, Drops: []string{dotEighteen}},
		},
		{
			name:   "no VPN table: the exit address is dropped and not listed",
			routes: remoteNodesRoutes(),
			has:    tablesExcept("to-VPN"),
			want:   pluginRoutingPlan{Mangle: []pluginMangleRule{foreign, domestic}, Drops: []string{dotSeventen}},
		},
		{
			name:   "no foreign table",
			routes: remoteNodesRoutes(),
			has:    tablesExcept("to-Foreign"),
			want:   pluginRoutingPlan{Lists: []string{dotSeventen}, Mangle: []pluginMangleRule{domestic}, Drops: []string{dotSixteen}},
		},
		{
			name:   "no tables at all, the router before its wizard",
			routes: remoteNodesRoutes(),
			has:    tablesExcept("to-Foreign", "to-Domestic", "to-VPN"),
			want:   pluginRoutingPlan{Drops: []string{dotSixteen, dotSeventen, dotEighteen}},
		},
		{
			name:   "domestic destinations go first, ahead of the catch-all",
			routes: []PluginRoute{{Address: "192.168.50.11", Via: pluginViaForeign, DomesticDirect: true}},
			has:    allTables(),
			want: pluginRoutingPlan{Mangle: []pluginMangleRule{
				{Src: "192.168.50.11", DstList: "DOMAddList", Mark: "to-Domestic"},
				{Src: "192.168.50.11", DstList: "!LOCAL-IP", Mark: "to-Foreign"},
			}},
		},
		{
			name:   "domestic destinations without a domestic link are plain foreign",
			routes: []PluginRoute{{Address: "192.168.50.11", Via: pluginViaForeign, DomesticDirect: true}},
			has:    tablesExcept("to-Domestic"),
			want:   pluginRoutingPlan{Mangle: []pluginMangleRule{{Src: "192.168.50.11", DstList: "!LOCAL-IP", Mark: "to-Foreign"}}},
		},
		{
			name:   "nothing to route",
			routes: nil,
			has:    allTables(),
			want:   pluginRoutingPlan{},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got := planPluginRouting(tc.routes, tc.has)
			if fmt.Sprintf("%+v", got) != fmt.Sprintf("%+v", tc.want) {
				t.Fatalf("plan\n got  %+v\n want %+v", got, tc.want)
			}
		})
	}
}

// seedWizardRouter puts on the fake what a router the wizard has run on has
// that matters here: the routing tables named, and the generic mark-routing
// rules, an accept, the installer's forward rule and another filter rule
// that a plugin's rules must go around.
func seedWizardRouter(f *fakeRouterOS, tables ...string) {
	for _, name := range tables {
		f.seed("/routing/table", map[string]string{"name": name, "fib": "true"})
	}
	f.seed("/ip/firewall/mangle",
		map[string]string{"chain": "prerouting", "action": "accept", "comment": "Accept", "src-address-list": "LOCAL-IP", "dst-address-list": "LOCAL-IP"},
		map[string]string{"chain": "output", "action": "mark-routing", "comment": "S4I Route", "new-routing-mark": "to-Foreign"},
		map[string]string{"chain": "prerouting", "action": "mark-routing", "comment": "Split-DOM", "src-address-list": "Split-LAN", "new-routing-mark": "to-Domestic"},
		map[string]string{"chain": "prerouting", "action": "mark-routing", "comment": "Nasnet-Panel outbound via foreign", "src-address": "192.168.50.2", "dst-address-list": "!LOCAL-IP", "new-routing-mark": "to-Foreign"},
		map[string]string{"chain": "prerouting", "action": "mark-routing", "comment": "VPN Routing", "src-address-list": "VPN-LAN", "new-routing-mark": "to-VPN"},
	)
	f.seed("/ip/firewall/filter",
		map[string]string{"chain": "forward", "action": "accept", "comment": "nasnet-panel-installer-forward"},
		map[string]string{"chain": "forward", "action": "drop", "comment": "Block non-Safe access to 192.168.100.1"},
	)
	f.seed("/ip/firewall/address-list",
		map[string]string{"list": "LOCAL-IP", "address": "192.168.0.0/16", "comment": "LOCAL-IP"},
		map[string]string{"list": "VPN-LAN", "address": "192.168.40.0/24", "comment": "VPN"},
	)
}

func comments(rows []map[string]string) []string {
	list := []string{}
	for _, row := range rows {
		list = append(list, row["comment"])
	}
	return list
}

// ruleLines describes the rows with comment as one line each, in table order.
func ruleLines(rows []map[string]string, comment string) []string {
	var lines []string
	for _, row := range rows {
		if row["comment"] != comment {
			continue
		}
		lines = append(lines, fmt.Sprintf("%s %s src=%s dst=%s mark=%s list=%s address=%s passthrough=%s",
			row["chain"], row["action"], row["src-address"], row["dst-address-list"], row["new-routing-mark"], row["list"], row["address"], row["passthrough"]))
	}
	return lines
}

func TestApplyPluginRoutingThreeRoles(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t)
	seedWizardRouter(router, "to-Foreign", "to-Domestic", "to-VPN")
	client := router.client(t)

	if err := applyPluginRouting(client, "remote-nodes", remoteNodesRoutes()); err != nil {
		t.Fatal(err)
	}

	mangle := router.rows("/ip/firewall/mangle")
	want := []string{
		"prerouting mark-routing src=192.168.50.16 dst=!LOCAL-IP mark=to-Foreign list= address= passthrough=no",
		"prerouting mark-routing src=192.168.50.18 dst=!LOCAL-IP mark=to-Domestic list= address= passthrough=no",
	}
	if got := ruleLines(mangle, "plugin:remote-nodes"); !slices.Equal(got, want) {
		t.Errorf("mangle rules\n got  %q\n want %q", got, want)
	}
	// The first match ends the chain, so they sit ahead of the rules that mark
	// whole address lists, and after the accept that exempts local traffic.
	wantOrder := []string{
		"Accept", "S4I Route", "plugin:remote-nodes", "plugin:remote-nodes", "Split-DOM",
		"Nasnet-Panel outbound via foreign", "VPN Routing",
	}
	if got := comments(mangle); !slices.Equal(got, wantOrder) {
		t.Errorf("mangle order\n got  %q\n want %q", got, wantOrder)
	}

	lists := router.rows("/ip/firewall/address-list")
	if got, want := ruleLines(lists, "plugin:remote-nodes"), []string{"  src= dst= mark= list=VPN-LAN address=192.168.50.17 passthrough="}; !slices.Equal(got, want) {
		t.Errorf("address list entries\n got  %q\n want %q", got, want)
	}
	if got := ruleLines(router.rows("/ip/firewall/filter"), "plugin:remote-nodes"); len(got) != 0 {
		t.Errorf("filter rules %q, want none while every link exists", got)
	}
}

func TestApplyPluginRoutingIsIdempotent(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t)
	seedWizardRouter(router, "to-Foreign", "to-VPN") // no domestic link
	client := router.client(t)

	if err := applyPluginRouting(client, "remote-nodes", remoteNodesRoutes()); err != nil {
		t.Fatal(err)
	}
	first := router.changes("/ip/firewall/")
	if len(first) != 3 { // a mark rule, a list entry and a drop
		t.Fatalf("first run made %d changes, want 3: %q", len(first), first)
	}
	rules := slices.Clone(router.rows("/ip/firewall/mangle"))

	for run := 2; run <= 3; run++ {
		if err := applyPluginRouting(client, "remote-nodes", remoteNodesRoutes()); err != nil {
			t.Fatal(err)
		}
		if got := router.changes("/ip/firewall/"); !slices.Equal(got, first) {
			t.Fatalf("run %d changed the router again:\n%q", run, got[len(first):])
		}
	}
	if got := router.rows("/ip/firewall/mangle"); fmt.Sprint(got) != fmt.Sprint(rules) {
		t.Errorf("the mangle rules are not what they were")
	}
}

func TestApplyPluginRoutingMissingTableDrops(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t)
	seedWizardRouter(router, "to-Foreign", "to-VPN") // no domestic link
	client := router.client(t)

	if err := applyPluginRouting(client, "remote-nodes", remoteNodesRoutes()); err != nil {
		t.Fatal(err)
	}

	// A drop in forward in place of a mark rule, ahead of every other rule, so
	// nothing above it can accept the traffic and nothing marks it first.
	filter := router.rows("/ip/firewall/filter")
	if got, want := ruleLines(filter, "plugin:remote-nodes"), []string{"forward drop src=192.168.50.18 dst=!LOCAL-IP mark= list= address= passthrough="}; !slices.Equal(got, want) {
		t.Fatalf("filter rules\n got  %q\n want %q", got, want)
	}
	if got := filter[0]["comment"]; got != "plugin:remote-nodes" {
		t.Errorf("the drop is behind %q, want it first in the chain", got)
	}
	for _, line := range ruleLines(router.rows("/ip/firewall/mangle"), "plugin:remote-nodes") {
		if strings.Contains(line, dotEighteen) {
			t.Errorf("a mark rule for the address with no table: %s", line)
		}
	}

	// The link comes back and the install is run again: the drop gives way.
	router.seed("/routing/table", map[string]string{"name": "to-Domestic"})
	if err := applyPluginRouting(client, "remote-nodes", remoteNodesRoutes()); err != nil {
		t.Fatal(err)
	}
	if got := ruleLines(router.rows("/ip/firewall/filter"), "plugin:remote-nodes"); len(got) != 0 {
		t.Errorf("the drop is still there: %q", got)
	}
	mark := "prerouting mark-routing src=192.168.50.18 dst=!LOCAL-IP mark=to-Domestic list= address= passthrough=no"
	if got := ruleLines(router.rows("/ip/firewall/mangle"), "plugin:remote-nodes"); !slices.Contains(got, mark) {
		t.Errorf("no mark rule for the address once its table exists: %q", got)
	}
}

func TestApplyPluginRoutingNoTablesDropsEverything(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t)
	seedWizardRouter(router) // a router the wizard has not run on
	client := router.client(t)

	if err := applyPluginRouting(client, "remote-nodes", remoteNodesRoutes()); err != nil {
		t.Fatal(err)
	}

	if got := len(ruleLines(router.rows("/ip/firewall/filter"), "plugin:remote-nodes")); got != 3 {
		t.Errorf("%d drops, want one for each address", got)
	}
	if got := ruleLines(router.rows("/ip/firewall/mangle"), "plugin:remote-nodes"); len(got) != 0 {
		t.Errorf("mark rules %q for tables that don't exist", got)
	}
	if got := ruleLines(router.rows("/ip/firewall/address-list"), "plugin:remote-nodes"); len(got) != 0 {
		t.Errorf("address list entries %q for a VPN that doesn't exist", got)
	}
}

func TestApplyPluginRoutingDomesticDestinationsFirst(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t)
	seedWizardRouter(router, "to-Foreign", "to-Domestic", "to-VPN")
	client := router.client(t)
	routes := []PluginRoute{{Address: "192.168.50.11", Via: pluginViaForeign, DomesticDirect: true}}

	if err := applyPluginRouting(client, "telegram-mtproto", routes); err != nil {
		t.Fatal(err)
	}

	want := []string{
		"prerouting mark-routing src=192.168.50.11 dst=DOMAddList mark=to-Domestic list= address= passthrough=no",
		"prerouting mark-routing src=192.168.50.11 dst=!LOCAL-IP mark=to-Foreign list= address= passthrough=no",
	}
	if got := ruleLines(router.rows("/ip/firewall/mangle"), "plugin:telegram-mtproto"); !slices.Equal(got, want) {
		t.Fatalf("mangle rules\n got  %q\n want %q", got, want)
	}

	// One of them lost: the other stays, and the new one goes in front of it.
	mangle := router.rows("/ip/firewall/mangle")
	i := slices.IndexFunc(mangle, func(row map[string]string) bool { return row["dst-address-list"] == "DOMAddList" })
	if _, err := client.Remove("/ip/firewall/mangle", "=.id="+mangle[i][".id"]); err != nil {
		t.Fatal(err)
	}
	if err := applyPluginRouting(client, "telegram-mtproto", routes); err != nil {
		t.Fatal(err)
	}
	if got := ruleLines(router.rows("/ip/firewall/mangle"), "plugin:telegram-mtproto"); !slices.Equal(got, want) {
		t.Fatalf("after a rule was lost\n got  %q\n want %q", got, want)
	}
}

func TestApplyPluginRoutingFollowsTheManifest(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t)
	seedWizardRouter(router, "to-Foreign", "to-Domestic", "to-VPN")
	client := router.client(t)

	if err := applyPluginRouting(client, "remote-nodes", remoteNodesRoutes()); err != nil {
		t.Fatal(err)
	}
	// A later version sends .16 through the VPN and drops the other two.
	if err := applyPluginRouting(client, "remote-nodes", []PluginRoute{{Address: dotSixteen, Via: pluginViaVPN}}); err != nil {
		t.Fatal(err)
	}

	if got := ruleLines(router.rows("/ip/firewall/mangle"), "plugin:remote-nodes"); len(got) != 0 {
		t.Errorf("old mark rules left: %q", got)
	}
	lists := router.rows("/ip/firewall/address-list")
	if got, want := ruleLines(lists, "plugin:remote-nodes"), []string{"  src= dst= mark= list=VPN-LAN address=192.168.50.16 passthrough="}; !slices.Equal(got, want) {
		t.Errorf("address list entries\n got  %q\n want %q", got, want)
	}

	// And a version with no routing at all clears what is left.
	if err := applyPluginRouting(client, "remote-nodes", nil); err != nil {
		t.Fatal(err)
	}
	if got := ruleLines(router.rows("/ip/firewall/address-list"), "plugin:remote-nodes"); len(got) != 0 {
		t.Errorf("list entries left: %q", got)
	}
}

func TestApplyPluginRoutingLeavesAnEntryItDidNotMake(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t)
	seedWizardRouter(router, "to-Foreign", "to-Domestic", "to-VPN")
	router.seed("/ip/firewall/address-list", map[string]string{"list": "VPN-LAN", "address": dotSeventen, "comment": "by hand"})
	client := router.client(t)

	if err := applyPluginRouting(client, "remote-nodes", remoteNodesRoutes()); err != nil {
		t.Fatal(err)
	}

	// The router refuses a twin, and the entry does the job as it is.
	var entries []string
	for _, row := range router.rows("/ip/firewall/address-list") {
		if row["address"] == dotSeventen {
			entries = append(entries, row["comment"])
		}
	}
	if !slices.Equal(entries, []string{"by hand"}) {
		t.Errorf("entries for %s: %q, want the one made by hand left alone", dotSeventen, entries)
	}
}

func TestApplyPluginRoutingRefusesWhatItCannotFence(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t)
	seedWizardRouter(router, "to-Foreign")
	client := router.client(t)

	for _, id := range []string{"", "Remote Nodes", "a/b", `x"y`, "plugin:x", "x$y", strings.Repeat("a", 64)} {
		if err := applyPluginRouting(client, id, nil); err == nil {
			t.Errorf("plugin id %q accepted", id)
		}
		if err := removePluginRouting(client, id); err == nil {
			t.Errorf("plugin id %q accepted for removal", id)
		}
	}
	if got := router.changes("/ip/firewall/"); len(got) != 0 {
		t.Errorf("changes for bad ids: %q", got)
	}
}

func TestRemovePluginRoutingTakesOnlyItsOwn(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t)
	seedWizardRouter(router, "to-Foreign", "to-Domestic", "to-VPN")
	client := router.client(t)
	if err := applyPluginRouting(client, "remote-nodes", remoteNodesRoutes()); err != nil {
		t.Fatal(err)
	}
	if err := applyPluginRouting(client, "telegram-mtproto", []PluginRoute{{Address: "192.168.50.11", Via: pluginViaForeign}}); err != nil {
		t.Fatal(err)
	}

	// Look-alikes that a prefix, a case-folding or an empty match would take.
	for _, comment := range []string{"plugin:remote-nodes-extra", "plugin:remote", "Plugin:remote-nodes", "plugin:remote-nodes ", "nasnet:remote-nodes", ""} {
		router.seed("/ip/firewall/mangle", map[string]string{"chain": "prerouting", "action": "mark-routing", "comment": comment, "src-address": "10.1.1.1"})
		router.seed("/ip/firewall/filter", map[string]string{"chain": "forward", "action": "drop", "comment": comment, "src-address": "10.1.1.1"})
		router.seed("/ip/firewall/address-list", map[string]string{"list": "VPN-LAN", "address": "10.1.1.1", "comment": comment})
	}
	router.seed("/ip/firewall/filter", map[string]string{"chain": "forward", "action": "drop", "comment": "plugin:remote-nodes", "src-address": dotEighteen, "dst-address-list": "!LOCAL-IP"})
	before := map[string]int{}
	for _, path := range []string{"/ip/firewall/mangle", "/ip/firewall/filter", "/ip/firewall/address-list"} {
		before[path] = len(router.rows(path))
	}

	if err := removePluginRouting(client, "remote-nodes"); err != nil {
		t.Fatal(err)
	}

	for path, want := range map[string]int{"/ip/firewall/mangle": 2, "/ip/firewall/filter": 1, "/ip/firewall/address-list": 1} {
		if got := before[path] - len(router.rows(path)); got != want {
			t.Errorf("%s: %d entries removed, want %d", path, got, want)
		}
		for _, row := range router.rows(path) {
			if row["comment"] == "plugin:remote-nodes" {
				t.Errorf("%s: %v is still there", path, row)
			}
		}
	}
	// The other plugin's rule, and the wizard's own, are where they were.
	if got := ruleLines(router.rows("/ip/firewall/mangle"), "plugin:telegram-mtproto"); len(got) != 1 {
		t.Errorf("the other plugin's rules: %q", got)
	}
	if got := comments(router.rows("/ip/firewall/filter"))[:2]; !slices.Equal(got, []string{"nasnet-panel-installer-forward", "Block non-Safe access to 192.168.100.1"}) {
		t.Errorf("the wizard's filter rules are %q", got)
	}
}
