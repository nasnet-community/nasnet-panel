package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"slices"
	"strings"
	"testing"
)

func TestInstallRefusesARouterBelowMinRouterOS(t *testing.T) {
	cases := []struct {
		name, min, router string
		refused           string // part of the message, or "" when the install goes through
	}{
		{name: "a release behind", min: "7.11", router: "7.9.2 (stable)", refused: "7.11 or newer and the router runs 7.9.2"},
		{name: "numbers, not text, are compared", min: "7.11", router: "7.10.2 (stable)", refused: "router runs 7.10.2"},
		{name: "a release candidate is not the release", min: "7.12", router: "7.12rc1 (testing)", refused: "router runs 7.12rc1"},
		{name: "a beta is not a release candidate", min: "7.12rc1", router: "7.12beta3 (testing)", refused: "router runs 7.12beta3"},
		{name: "a router that cannot say", min: "7.11", router: "banana", refused: "can't tell which RouterOS the router runs"},
		{name: "a router that says nothing", min: "7.11", router: "", refused: "can't tell which RouterOS the router runs"},
		{name: "exactly the floor", min: "7.11", router: "7.11 (stable)"},
		{name: "a release past it", min: "7.11", router: "7.24.5 (stable)"},
		{name: "the release of a candidate floor", min: "7.12rc1", router: "7.12 (stable)"},
		{name: "no floor asks nothing of the version", min: "", router: "banana"},
	}
	files := map[string]string{}
	for i, tc := range cases {
		extra := ""
		if tc.min != "" {
			extra = fmt.Sprintf(`, "minRouterOS": %q`, tc.min)
		}
		files[fmt.Sprintf("floor-test-%d/manifest.json", i)] = routingManifest(fmt.Sprintf("floor-test-%d", i), `"192.168.50.99/24"`, extra)
	}
	stubPluginFiles(t, files)

	for i, tc := range cases {
		id := fmt.Sprintf("floor-test-%d", i)
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			router, client := newContainerFake(t)
			router.version = tc.router
			task := newInstallTask(id)
			installPluginAsync(client, task)
			got := task.snapshot()

			if tc.refused == "" {
				if got.Phase != string(pluginInstallPhaseDone) {
					t.Fatalf("install ended in %q: %s", got.Phase, got.Message)
				}
				return
			}
			if got.Phase != string(pluginInstallPhaseError) || !strings.Contains(got.Message, tc.refused) {
				t.Fatalf("install ended in %q with %q, want a refusal mentioning %q", got.Phase, got.Message, tc.refused)
			}
			if changes := router.changes(); len(changes) > 0 {
				t.Fatalf("a refused install still changed the router: %v", changes)
			}
		})
	}
}

func TestInstallAppliesRoutingAndKeepsItForTheWizard(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	const id = "remote-nodes"
	stubPluginFiles(t, map[string]string{
		id + "/manifest.json": routingManifest(id, threeAddresses, `,
			"minRouterOS": "7.11", "settingsSchema": "settings.json",
			"scripts": {"postWizard": "scripts/post-wizard.rsc"},
			"routing": [
				{"address": "192.168.50.16", "via": "foreign"},
				{"address": "192.168.50.17", "via": "vpn"},
				{"address": "192.168.50.18", "via": "domestic"}]`),
		id + "/settings.json":           `{"settings": [{"key": "who", "default": "nodes"}]}`,
		id + "/scripts/post-wizard.rsc": ":log info \"back for {{settings.who}}\"\n",
	})
	router := newFakeRouterOS(t)
	router.seed("/system/resource", map[string]string{"architecture-name": "arm64", "version": "7.24.5 (stable)"})
	seedWizardRouter(router, "to-Foreign", "to-VPN") // a router with no domestic link
	client := router.client(t)

	install := func() {
		t.Helper()
		task := newInstallTask(id)
		installPluginAsync(client, task)
		if got := task.snapshot(); got.Phase != string(pluginInstallPhaseDone) {
			t.Fatalf("install ended in %q: %s", got.Phase, got.Message)
		}
	}
	install()

	veth := router.rows("/interface/veth")
	if len(veth) != 1 || veth[0]["address"] != "192.168.50.16/24,192.168.50.17/24,192.168.50.18/24" {
		t.Errorf("veth rows %v, want one with all three addresses", veth)
	}
	if got, want := ruleLines(router.rows("/ip/firewall/mangle"), "plugin:remote-nodes"),
		[]string{"prerouting mark-routing src=192.168.50.16 dst=!LOCAL-IP mark=to-Foreign list= address= passthrough=no"}; !slices.Equal(got, want) {
		t.Errorf("mangle rules\n got  %q\n want %q", got, want)
	}
	if got, want := ruleLines(router.rows("/ip/firewall/address-list"), "plugin:remote-nodes"),
		[]string{"  src= dst= mark= list=VPN-LAN address=192.168.50.17 passthrough="}; !slices.Equal(got, want) {
		t.Errorf("address list entries\n got  %q\n want %q", got, want)
	}
	if got, want := ruleLines(router.rows("/ip/firewall/filter"), "plugin:remote-nodes"),
		[]string{"forward drop src=192.168.50.18 dst=!LOCAL-IP mark= list= address= passthrough="}; !slices.Equal(got, want) {
		t.Errorf("filter rules\n got  %q\n want %q", got, want)
	}

	// What the wizard needs later is on the router: the routing, and the
	// post-wizard script with its settings filled in.
	files := map[string]string{}
	for _, row := range router.rows("/file") {
		files[row["name"]] = row["contents"]
	}
	const dir = "nasnet-panel/plugins/remote-nodes/"
	wantRouting := `{"routing":[{"address":"192.168.50.16","via":"foreign"},{"address":"192.168.50.17","via":"vpn"},{"address":"192.168.50.18","via":"domestic"}]}` + "\n"
	if got := files[dir+"routing.json"]; got != wantRouting {
		t.Errorf("routing.json\n got  %q\n want %q", got, wantRouting)
	}
	if got, want := files[dir+"post-wizard.rsc"], ":log info \"back for nodes\"\n"; got != want {
		t.Errorf("post-wizard.rsc\n got  %q\n want %q", got, want)
	}
	for _, name := range []string{"nasnet-panel/container-volumes/remote-nodes/data", "nasnet-panel/plugins"} {
		if _, ok := files[name]; !ok {
			t.Errorf("%s was not made", name)
		}
	}

	// Installing again, as after a failed pull, changes none of it.
	firewall, fileChanges := router.changes("/ip/firewall/"), router.changes("/file/")
	install()
	if got := router.changes("/ip/firewall/"); !slices.Equal(got, firewall) {
		t.Errorf("a second install changed the firewall:\n%q", got[len(firewall):])
	}
	if got := router.changes("/file/"); !slices.Equal(got, fileChanges) {
		t.Errorf("a second install changed files:\n%q", got[len(fileChanges):])
	}
}

func TestInstallLeavesStateOnlyWhenThereIsSomething(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	const id = "plain-plugin"
	stubPluginFiles(t, map[string]string{id + "/manifest.json": routingManifest(id, `"192.168.50.99/24"`, "")})
	router := newFakeRouterOS(t)
	router.seed("/system/resource", map[string]string{"architecture-name": "arm64", "version": "7.24.5 (stable)"})
	seedWizardRouter(router, "to-Foreign", "to-Domestic", "to-VPN")
	client := router.client(t)

	task := newInstallTask(id)
	installPluginAsync(client, task)
	if got := task.snapshot(); got.Phase != string(pluginInstallPhaseDone) {
		t.Fatalf("install ended in %q: %s", got.Phase, got.Message)
	}

	// A manifest as before: the router is changed, and asked, as before.
	if got := router.changes("/ip/firewall/"); len(got) != 0 {
		t.Errorf("firewall changes for a plugin with no routing: %q", got)
	}
	for _, path := range []string{"/routing/table/print", "/ip/firewall/mangle/print", "/ip/firewall/filter/print", "/ip/firewall/address-list/print"} {
		if got := router.sent(path); len(got) != 0 {
			t.Errorf("%s was asked for by a plugin with no routing", path)
		}
	}
	for _, row := range router.rows("/file") {
		if strings.Contains(row["name"], "plugins") {
			t.Errorf("state kept for a plugin with nothing to keep: %v", row)
		}
	}
}

func TestUninstallRemovesItsRoutingAndNothingElse(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	const id = "remote-nodes"
	stubPluginCatalog(t, map[string]string{id: manifestJSON(id, "")})

	router := newFakeRouterOS(t)
	seedPlugin(router, id)
	seedWizardRouter(router, "to-Foreign", "to-VPN")
	client := router.client(t)

	// This plugin and a neighbour, each with routing and saved state.
	for _, plugin := range []string{id, "neighbour"} {
		if err := applyPluginRouting(client, plugin, remoteNodesRoutes()); err != nil {
			t.Fatal(err)
		}
		if err := savePluginState(client, plugin, remoteNodesRoutes(), ":log info hi"); err != nil {
			t.Fatal(err)
		}
	}
	router.seed("/ip/firewall/mangle", map[string]string{"chain": "prerouting", "action": "mark-routing", "comment": "plugin:remote-nodes-extra", "src-address": "10.1.1.1"})
	router.seed("/ip/firewall/address-list", map[string]string{"list": "VPN-LAN", "address": "10.1.1.1", "comment": ""})
	mine := func(path string) int {
		n := 0
		for _, row := range router.rows(path) {
			if row["comment"] == "plugin:remote-nodes" {
				n++
			}
		}
		return n
	}
	if mine("/ip/firewall/mangle")+mine("/ip/firewall/filter")+mine("/ip/firewall/address-list") != 3 {
		t.Fatal("the routing was not applied, so this test would prove nothing")
	}
	totals := func() []int {
		return []int{len(router.rows("/ip/firewall/mangle")), len(router.rows("/ip/firewall/filter")), len(router.rows("/ip/firewall/address-list"))}
	}
	before := totals()

	c, rec := newUninstallContext(t, id, "")
	if err := uninstallPlugin(c, client, id, nil); err != nil {
		t.Fatal(err)
	}
	var reply struct {
		Data UninstallPluginResponse `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &reply); err != nil {
		t.Fatal(err)
	}
	if rec.Code != http.StatusOK || len(reply.Data.Warnings) > 0 {
		t.Fatalf("status %d, warnings %v: %s", rec.Code, reply.Data.Warnings, rec.Body.String())
	}

	for _, path := range []string{"/ip/firewall/mangle", "/ip/firewall/filter", "/ip/firewall/address-list"} {
		if n := mine(path); n != 0 {
			t.Errorf("%s: %d entries with the plugin's comment are left", path, n)
		}
	}
	// One mark rule, one list entry and one drop were its own.
	after := totals()
	for i, path := range []string{"mangle", "filter", "address-list"} {
		if before[i]-after[i] != 1 {
			t.Errorf("%s: %d entries removed, want 1", path, before[i]-after[i])
		}
	}
	if len(ruleLines(router.rows("/ip/firewall/mangle"), "plugin:neighbour")) != 1 ||
		len(ruleLines(router.rows("/ip/firewall/mangle"), "plugin:remote-nodes-extra")) != 1 {
		t.Error("another plugin's rules were taken")
	}

	// Its saved state goes with it, the neighbour's stays.
	for _, row := range router.rows("/file") {
		if strings.HasPrefix(row["name"], "nasnet-panel/plugins/remote-nodes") {
			t.Errorf("%s was left behind", row["name"])
		}
	}
	if !router.has("/file", "name", "nasnet-panel/plugins/neighbour/routing.json") {
		t.Error("the neighbour's saved routing was removed")
	}
	if reply.Data.Interface != "veth-"+id {
		t.Errorf("veth removed = %q, want veth-%s", reply.Data.Interface, id)
	}
}
