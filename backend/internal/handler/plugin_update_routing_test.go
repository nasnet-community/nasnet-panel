package handler

import (
	"slices"
	"strings"
	"testing"

	"nasnet-panel/pkg/routeros"
)

// An update used to leave a plugin with the routing its install put there: a
// plugin installed before its manifest had routing stayed without it, and one
// whose routing changed kept the old rules.

const updateTestPlugin = "remote-nodes"

// installedForUpdate installs updateTestPlugin from a manifest with the given
// extra fields (comma first, as routingManifest takes them) and returns the
// router and a client to it.
func installedForUpdate(t *testing.T, extra string) (*fakeRouterOS, *routeros.Client) {
	t.Helper()
	t.Setenv("ENVIRONMENT", "production")
	stubPluginFiles(t, map[string]string{
		updateTestPlugin + "/manifest.json":           routingManifest(updateTestPlugin, threeAddresses, extra),
		updateTestPlugin + "/scripts/post-wizard.rsc": ":log info \"back\"\n",
	})
	router := newFakeRouterOS(t)
	router.seed("/system/resource", map[string]string{"architecture-name": "arm64", "version": "7.24.5 (stable)"})
	seedWizardRouter(router, "to-Foreign", "to-VPN") // a router with no domestic link
	client := router.client(t)
	task := newInstallTask(updateTestPlugin)
	installPluginAsync(client, task)
	if got := task.snapshot(); got.Phase != string(pluginInstallPhaseDone) {
		t.Fatalf("install ended in %q: %s", got.Phase, got.Message)
	}
	return router, client
}

func stateFiles(router *fakeRouterOS) map[string]string {
	files := map[string]string{}
	for _, row := range router.rows("/file") {
		files[row["name"]] = row["contents"]
	}
	return files
}

const stateDir = "nasnet-panel/plugins/" + updateTestPlugin + "/"

func TestUpdateReplacesTheRoutingTheInstallPut(t *testing.T) {
	router, client := installedForUpdate(t, `,
		"scripts": {"postWizard": "scripts/post-wizard.rsc"},
		"routing": [{"address": "192.168.50.16", "via": "foreign"}, {"address": "192.168.50.17", "via": "vpn"}]`)

	// the new manifest sends .16 the other way, drops .17 and adds .18
	routes := []PluginRoute{{Address: "192.168.50.16", Via: "vpn"}, {Address: "192.168.50.18", Via: "foreign"}}
	if err := reapplyPluginRouting(client, updateTestPlugin, routes); err != nil {
		t.Fatal(err)
	}

	if got, want := ruleLines(router.rows("/ip/firewall/mangle"), "plugin:remote-nodes"),
		[]string{"prerouting mark-routing src=192.168.50.18 dst=!LOCAL-IP mark=to-Foreign list= address= passthrough=no"}; !slices.Equal(got, want) {
		t.Errorf("mangle rules\n got  %q\n want %q", got, want)
	}
	if got, want := ruleLines(router.rows("/ip/firewall/address-list"), "plugin:remote-nodes"),
		[]string{"  src= dst= mark= list=VPN-LAN address=192.168.50.16 passthrough="}; !slices.Equal(got, want) {
		t.Errorf("address list entries\n got  %q\n want %q", got, want)
	}
	files := stateFiles(router)
	wantRouting := `{"routing":[{"address":"192.168.50.16","via":"vpn"},{"address":"192.168.50.18","via":"foreign"}]}` + "\n"
	if got := files[stateDir+"routing.json"]; got != wantRouting {
		t.Errorf("routing.json\n got  %q\n want %q", got, wantRouting)
	}
	if got, want := files[stateDir+"post-wizard.rsc"], ":log info \"back\"\n"; got != want {
		t.Errorf("the post-wizard script was touched: got %q, want %q", got, want)
	}

	// doing it again changes nothing
	firewall, fileChanges := router.changes("/ip/firewall/"), router.changes("/file/")
	if err := reapplyPluginRouting(client, updateTestPlugin, routes); err != nil {
		t.Fatal(err)
	}
	if got := router.changes("/ip/firewall/"); !slices.Equal(got, firewall) {
		t.Errorf("a second update changed the firewall:\n%q", got[len(firewall):])
	}
	if got := router.changes("/file/"); !slices.Equal(got, fileChanges) {
		t.Errorf("a second update changed files:\n%q", got[len(fileChanges):])
	}
}

func TestUpdateGivesRoutingToAPluginInstalledWithoutIt(t *testing.T) {
	router, client := installedForUpdate(t, "")
	if got := ruleLines(router.rows("/ip/firewall/mangle"), "plugin:remote-nodes"); len(got) != 0 {
		t.Fatalf("an install with no routing made rules: %q", got)
	}
	if _, ok := stateFiles(router)[stateDir+"routing.json"]; ok {
		t.Fatal("an install with no routing kept a routing file")
	}

	routes := []PluginRoute{{Address: "192.168.50.16", Via: "foreign"}}
	if err := reapplyPluginRouting(client, updateTestPlugin, routes); err != nil {
		t.Fatal(err)
	}
	if got, want := ruleLines(router.rows("/ip/firewall/mangle"), "plugin:remote-nodes"),
		[]string{"prerouting mark-routing src=192.168.50.16 dst=!LOCAL-IP mark=to-Foreign list= address= passthrough=no"}; !slices.Equal(got, want) {
		t.Errorf("mangle rules\n got  %q\n want %q", got, want)
	}
	wantRouting := `{"routing":[{"address":"192.168.50.16","via":"foreign"}]}` + "\n"
	if got := stateFiles(router)[stateDir+"routing.json"]; got != wantRouting {
		t.Errorf("routing.json\n got  %q\n want %q", got, wantRouting)
	}
}

func TestUpdateLeavesAPluginWithNoRoutingAlone(t *testing.T) {
	router, client := installedForUpdate(t, "")
	firewall, fileChanges := router.changes("/ip/firewall/"), router.changes("/file/")

	if err := reapplyPluginRouting(client, updateTestPlugin, nil); err != nil {
		t.Fatal(err)
	}
	if got := router.changes("/ip/firewall/"); !slices.Equal(got, firewall) {
		t.Errorf("the firewall was touched:\n%q", got[len(firewall):])
	}
	if got := router.changes("/file/"); !slices.Equal(got, fileChanges) {
		t.Errorf("files were touched:\n%q", got[len(fileChanges):])
	}
}

func TestUpdateDropsTheRoutingTheNewManifestNoLongerHas(t *testing.T) {
	router, client := installedForUpdate(t, `,
		"scripts": {"postWizard": "scripts/post-wizard.rsc"},
		"routing": [{"address": "192.168.50.16", "via": "foreign"}, {"address": "192.168.50.17", "via": "vpn"}]`)

	if err := reapplyPluginRouting(client, updateTestPlugin, nil); err != nil {
		t.Fatal(err)
	}
	for _, path := range []string{"/ip/firewall/mangle", "/ip/firewall/address-list", "/ip/firewall/filter"} {
		if got := ruleLines(router.rows(path), "plugin:remote-nodes"); len(got) != 0 {
			t.Errorf("%s still has the plugin's rules: %q", path, got)
		}
	}
	files := stateFiles(router)
	if _, ok := files[stateDir+"routing.json"]; ok {
		t.Error("the saved routing is still there")
	}
	if got, want := files[stateDir+"post-wizard.rsc"], ":log info \"back\"\n"; got != want {
		t.Errorf("the post-wizard script was touched: got %q, want %q", got, want)
	}
}

// The update itself, not only the helper: the new manifest's routing is on the
// router before the container starts again.
func TestUpdateAppliesTheNewRoutingBeforeStartingTheContainer(t *testing.T) {
	f, client := newUpdateFake(t)

	task := &pluginUpdateTask{pluginID: "demo"}
	manifest := &PluginManifest{
		ID: "demo", Version: "0.1.2",
		Container: PluginManifestContainer{Image: "example/demo:0.1.2"},
		Routing:   []PluginRoute{{Address: "192.168.50.16", Via: "vpn"}},
	}
	updatePluginAsync(client, task, manifest)
	if got := task.snapshot(); got.Phase != string(pluginUpdatePhaseDone) {
		t.Fatalf("update ended in phase %q (%s), want done", got.Phase, got.Message)
	}

	f.mu.Lock()
	defer f.mu.Unlock()
	start := slices.Index(f.commands, "/container/start")
	routing := slices.IndexFunc(f.commands, func(c string) bool {
		return strings.HasPrefix(c, "/ip/firewall/") && strings.HasSuffix(c, "/add")
	})
	if routing < 0 {
		t.Fatalf("the update put no routing on the router: %v", f.commands)
	}
	if start < 0 || routing > start {
		t.Errorf("routing came after the container started: %v", f.commands)
	}
	if !slices.Contains(f.commands, "/file/add") {
		t.Errorf("the routing was not kept for the wizard: %v", f.commands)
	}
}
