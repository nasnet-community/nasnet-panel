package handler

import (
	"flag"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"testing"

	"nasnet-panel/pkg/utils"
)

var updateGolden = flag.Bool("update", false, "rewrite the golden files in testdata")

// assertGolden compares got with testdata/<name>.golden, which -update rewrites.
func assertGolden(t *testing.T, name, got string) {
	t.Helper()

	path := filepath.Join("testdata", name+".golden")
	if *updateGolden {
		if err := os.MkdirAll("testdata", 0o750); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(got), 0o600); err != nil {
			t.Fatal(err)
		}
	}
	want, err := os.ReadFile(path) //nolint:gosec // a fixed path under testdata
	if err != nil {
		t.Fatalf("%v (run the test with -update to write it)", err)
	}
	if got != string(want) {
		t.Errorf("%s differs from the script rendered now (run the test with -update if the change is meant):\n--- got ---\n%s\n--- want ---\n%s", path, got, want)
	}
}

// renderWizard renders wizard.tmpl the way HandleFinalizeWizard does, with the
// routing of the given installed plugins.
func renderWizard(t *testing.T, domestic bool, plugins []pluginRouting) string {
	t.Helper()

	data := wizardData(domestic)
	script, err := renderPluginRouting(plugins, domestic)
	if err != nil {
		t.Fatal(err)
	}
	data["PluginRouting"] = script

	out, err := utils.RenderTemplate("base_config.tmpl", escapeWizardTemplateData(data))
	if err != nil {
		t.Fatalf("domestic=%v: %v", domestic, err)
	}
	return out
}

// pluginSection is every line of a rendered wizard that carries a plugin's
// comment, each section under its menu line, which is how the router reads it.
func pluginSection(out string) string {
	var section, last strings.Builder
	menu := ""
	for _, line := range strings.Split(out, "\n") {
		if strings.HasPrefix(line, "/ip firewall ") {
			menu = line
		}
		if !strings.Contains(line, `"plugin:`) {
			continue
		}
		if menu != last.String() {
			section.WriteString(menu + "\n")
			last.Reset()
			last.WriteString(menu)
		}
		section.WriteString(line + "\n")
	}
	return section.String()
}

var (
	remoteNodesPlugin = pluginRouting{ID: "remote-nodes", Routes: remoteNodesRoutes()}
	// What the Remote MTProto plugin needs to keep the routing the wizard used to
	// hard-code for it: foreign for everything but local traffic, and domestic
	// for what is bound for domestic destinations.
	mtprotoPlugin = pluginRouting{ID: "telegram-mtproto", Routes: []PluginRoute{
		{Address: "192.168.50.11", Via: pluginViaForeign, DomesticDirect: true},
	}}
)

func TestWizardPluginSectionGolden(t *testing.T) {
	for _, tc := range []struct {
		name     string
		domestic bool
		plugin   pluginRouting
	}{
		{"wizard_plugins_remote_nodes_domestic", true, remoteNodesPlugin},
		{"wizard_plugins_remote_nodes_no_domestic", false, remoteNodesPlugin},
		{"wizard_plugins_mtproto_domestic", true, mtprotoPlugin},
		{"wizard_plugins_mtproto_no_domestic", false, mtprotoPlugin},
	} {
		t.Run(tc.name, func(t *testing.T) {
			assertGolden(t, tc.name, pluginSection(renderWizard(t, tc.domestic, []pluginRouting{tc.plugin})))
		})
	}
}

// The two lines the wizard hard-coded for the MTProto plugin before its
// routing came from the manifest (commit 0d227a9c), as they were written.
const (
	mtprotoWasDomestic = `add action=mark-routing chain=prerouting comment="MTProto plugin to its servers via domestic" dst-address-list="DOMAddList" new-routing-mark="to-Domestic" passthrough=no src-address=192.168.50.11`
	mtprotoWasForeign  = `add action=mark-routing chain=prerouting comment="MTProto plugin outbound via foreign" dst-address-list=!LOCAL-IP new-routing-mark=to-Foreign passthrough=no src-address=192.168.50.11`
)

// What rendering the MTProto plugin's routing gives is what the hard-coded
// lines were, word for word, but for the comment: the plugin's rules carry its
// own comment so that uninstall can find them.
func TestMTProtoRoutingRendersWhatWasHardCoded(t *testing.T) {
	const comment = `comment="plugin:telegram-mtproto"`

	for _, domestic := range []bool{true, false} {
		// The domestic line was only written when the router had a Domestic link.
		want := []string{mtprotoWasForeign}
		if domestic {
			want = []string{mtprotoWasDomestic, mtprotoWasForeign}
		}
		for i, line := range want {
			start := strings.Index(line, "comment=")
			end := start + strings.Index(line[start:], `" `) + 1
			want[i] = line[:start] + comment + line[end:]
		}

		var got []string
		for _, line := range strings.Split(renderWizard(t, domestic, []pluginRouting{mtprotoPlugin}), "\n") {
			if strings.Contains(line, "192.168.50.11") {
				got = append(got, line)
			}
		}
		if !slices.Equal(got, want) {
			t.Errorf("domestic=%v:\n got  %q\n want %q", domestic, got, want)
		}
	}

	// And the comment is the only difference from the old lines.
	if !strings.Contains(mtprotoWasDomestic, `comment="MTProto plugin to its servers via domestic" dst-address-list="DOMAddList"`) {
		t.Fatal("the constants are not the lines of commit 0d227a9c")
	}
}

func TestWizardPutsPluginRoutingWhereItBelongs(t *testing.T) {
	for _, domestic := range []bool{true, false} {
		out := renderWizard(t, domestic, []pluginRouting{remoteNodesPlugin, mtprotoPlugin})
		at := func(s string) int {
			t.Helper()
			i := strings.Index(out, s)
			if i < 0 {
				t.Fatalf("domestic=%v: %q is not in the script", domestic, s)
			}
			return i
		}

		// The mark rules sit after the panel's own and ahead of the generic ones
		// that take a whole address list, which would win with the same source.
		panel, generic := at(`comment="Nasnet-Panel outbound via foreign"`), at(`comment="VPN Routing"`)
		for _, rule := range []string{
			`comment="plugin:remote-nodes" dst-address-list=!LOCAL-IP new-routing-mark=to-Foreign`,
			`comment="plugin:telegram-mtproto" dst-address-list=!LOCAL-IP new-routing-mark=to-Foreign`,
		} {
			if i := at(rule); i < panel || i > generic {
				t.Errorf("domestic=%v: %q is not between the panel's own rule and the generic ones", domestic, rule)
			}
		}

		// A plugin whose link is missing is dropped ahead of everything else the
		// wizard puts in the filter; with the link there is no drop.
		drop := `add action=drop chain=forward comment="plugin:remote-nodes"`
		if domestic {
			if strings.Contains(out, drop) {
				t.Errorf("a drop was written though every link exists")
			}
		} else if i := at(drop); i < at("/ip firewall filter\n") || i > at(`comment="Block non-Safe access to 192.168.100.1"`) {
			t.Errorf("the drop is not the first rule of the filter")
		}

		// The VPN address goes in the list the wizard's own rule keys on.
		list := at(`add address=192.168.50.17 list="VPN-LAN" comment="plugin:remote-nodes"`)
		if list < at("/ip firewall address-list\n") || list > at("/ip firewall filter\n") {
			t.Errorf("domestic=%v: the VPN-LAN entry is outside the address list section", domestic)
		}
	}
}

func TestWizardWritesNoPluginRoutingWithoutPlugins(t *testing.T) {
	for _, domestic := range []bool{true, false} {
		for _, plugins := range [][]pluginRouting{nil, {}} {
			out := renderWizard(t, domestic, plugins)
			if strings.Contains(out, "plugin:") || strings.Contains(out, "192.168.50.11") || strings.Contains(out, "MTProto") {
				t.Errorf("domestic=%v: plugin routing in a script for a router with no plugins", domestic)
			}
			if strings.Contains(out, "<no value>") {
				t.Errorf("domestic=%v: an unset template value in the script", domestic)
			}
		}
	}

	// A render with no PluginRouting at all (as other tests build it) is the same.
	out, err := utils.RenderTemplate("base_config.tmpl", wizardData(true))
	if err != nil || strings.Contains(out, "<no value>") || strings.Contains(out, "plugin:") {
		t.Errorf("render without PluginRouting: err=%v", err)
	}
}

func TestRenderPluginRoutingOrdersPluginsByID(t *testing.T) {
	script, err := renderPluginRouting([]pluginRouting{mtprotoPlugin, remoteNodesPlugin}, true)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Index(script.Mangle, "plugin:remote-nodes") > strings.Index(script.Mangle, "plugin:telegram-mtproto") {
		t.Errorf("plugins are not in id order:\n%s", script.Mangle)
	}
}

func TestRenderPluginRoutingRefusesWhatItCouldNotQuote(t *testing.T) {
	for name, plugin := range map[string]pluginRouting{
		"an id with a quote":      {ID: `x"; /system reset-configuration; "`, Routes: remoteNodesRoutes()},
		"an id with a dollar":     {ID: "x$y", Routes: remoteNodesRoutes()},
		"an empty id":             {ID: "", Routes: remoteNodesRoutes()},
		"an address with a quote": {ID: "ok", Routes: []PluginRoute{{Address: `1.1.1.1" x="`, Via: pluginViaForeign}}},
		"a link that isn't one":   {ID: "ok", Routes: []PluginRoute{{Address: dotSixteen, Via: "mars"}}},
	} {
		if script, err := renderPluginRouting([]pluginRouting{plugin}, true); err == nil {
			t.Errorf("%s: rendered %+v", name, script)
		}
	}
}

// seedContainerRouter puts on the fake a router with the container package and
// device mode, and a container for each name.
func seedContainerRouter(f *fakeRouterOS, containers ...string) {
	f.seed("/system/package", map[string]string{"name": "container", "disabled": "false"})
	f.seed("/system/device-mode", map[string]string{"container": "yes"})
	for _, name := range containers {
		f.seed("/container", map[string]string{"name": name, "running": "true"})
	}
}

// seedStateFile puts a file under the plugin's saved state, directories and all.
func seedStateFile(f *fakeRouterOS, plugin, name, contents string) {
	for _, dir := range []string{"nasnet-panel", "nasnet-panel/plugins", "nasnet-panel/plugins/" + plugin} {
		if !f.has("/file", "name", dir) {
			f.seed("/file", dirRow(dir))
		}
	}
	f.seed("/file", map[string]string{
		"name": "nasnet-panel/plugins/" + plugin + "/" + name, "type": "file",
		"contents": contents, "size": strconv.Itoa(len(contents)),
	})
}

func TestInstalledPluginRouting(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t)
	seedContainerRouter(router, "nasnet-panel", "telegram-mtproto", "remote-nodes", "no-routing", "Not A Slug")
	seedStateFile(router, "remote-nodes", pluginStateRouting, `{"routing":[{"address":"192.168.50.16","via":"foreign"},{"address":"192.168.50.18","via":"domestic"}]}`)
	seedStateFile(router, "telegram-mtproto", pluginStateRouting, `{"routing":[{"address":"192.168.50.11","via":"foreign","domesticDirect":true}]}`)
	seedStateFile(router, "no-routing", pluginStatePostWizard, ":log info hi") // a script, no routing
	seedStateFile(router, "gone", pluginStateRouting, `{"routing":[{"address":"192.168.50.30","via":"foreign"}]}`)
	client := router.client(t)

	got, err := installedPluginRouting(client)
	if err != nil {
		t.Fatal(err)
	}

	// In id order, only plugins that are installed and keep routing.
	if len(got) != 2 || got[0].ID != "remote-nodes" || got[1].ID != "telegram-mtproto" {
		t.Fatalf("plugins %+v, want remote-nodes then telegram-mtproto", got)
	}
	if want := []PluginRoute{{Address: dotSixteen, Via: "foreign"}, {Address: dotEighteen, Via: "domestic"}}; !slices.Equal(got[0].Routes, want) {
		t.Errorf("remote-nodes routes %+v, want %+v", got[0].Routes, want)
	}
	if want := []PluginRoute{{Address: "192.168.50.11", Via: "foreign", DomesticDirect: true}}; !slices.Equal(got[1].Routes, want) {
		t.Errorf("telegram-mtproto routes %+v, want %+v", got[1].Routes, want)
	}
	if got := router.changes("/"); len(got) != 0 {
		t.Errorf("reading the plugins changed the router: %q", got)
	}
}

func TestInstalledPluginRoutingNeedsContainers(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")

	for name, seed := range map[string]func(*fakeRouterOS){
		"no container package": func(f *fakeRouterOS) {
			f.seed("/system/device-mode", map[string]string{"container": "yes"})
			f.seed("/container", map[string]string{"name": "remote-nodes"})
		},
		"container package disabled": func(f *fakeRouterOS) {
			f.seed("/system/package", map[string]string{"name": "container", "disabled": "true"})
			f.seed("/system/device-mode", map[string]string{"container": "yes"})
			f.seed("/container", map[string]string{"name": "remote-nodes"})
		},
		"container mode off": func(f *fakeRouterOS) {
			f.seed("/system/package", map[string]string{"name": "container", "disabled": "false"})
			f.seed("/system/device-mode", map[string]string{"container": "no"})
			f.seed("/container", map[string]string{"name": "remote-nodes"})
		},
	} {
		t.Run(name, func(t *testing.T) {
			router := newFakeRouterOS(t)
			seed(router)
			seedStateFile(router, "remote-nodes", pluginStateRouting, `{"routing":[{"address":"192.168.50.16","via":"foreign"}]}`)

			got, err := installedPluginRouting(router.client(t))
			if err != nil || len(got) != 0 {
				t.Fatalf("got %+v, %v; want no plugins and no error", got, err)
			}
		})
	}
}

// A plugin whose saved routing can't be read stops the wizard: it would wipe
// that plugin's rules and have none to put back.
func TestInstalledPluginRoutingRefusesUnreadableState(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")

	for name, contents := range map[string]string{
		"not JSON":          `{"routing": [`,
		"an unknown link":   `{"routing":[{"address":"192.168.50.16","via":"mars"}]}`,
		"a quote in it":     `{"routing":[{"address":"1.1.1.1\" x=\"","via":"foreign"}]}`,
		"an address twice":  `{"routing":[{"address":"192.168.50.16","via":"foreign"},{"address":"192.168.50.16","via":"vpn"}]}`,
		"a prefix length":   `{"routing":[{"address":"192.168.50.16/24","via":"foreign"}]}`,
		"routing in a list": `{"routing":[["192.168.50.16","foreign"]]}`,
	} {
		t.Run(name, func(t *testing.T) {
			router := newFakeRouterOS(t)
			seedContainerRouter(router, "remote-nodes", "other")
			seedStateFile(router, "remote-nodes", pluginStateRouting, contents)
			seedStateFile(router, "other", pluginStateRouting, `{"routing":[{"address":"192.168.50.20","via":"foreign"}]}`)

			_, err := installedPluginRouting(router.client(t))
			if err == nil {
				t.Fatal("unreadable routing was accepted")
			}
			if !strings.Contains(err.Error(), "remote-nodes") || !strings.Contains(err.Error(), "install it again") {
				t.Errorf("error %q does not name the plugin and what to do", err)
			}
		})
	}
}

func TestRunPluginPostWizard(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t)
	seedContainerRouter(router, "nasnet-panel", "telegram-mtproto-local", "remote-nodes", "blank-script", "routing-only")
	seedStateFile(router, "remote-nodes", pluginStatePostWizard, ":log info \"remote nodes are back\"\n")
	seedStateFile(router, "telegram-mtproto-local", pluginStatePostWizard, "/system script run nasnet-mtproto-local")
	seedStateFile(router, "blank-script", pluginStatePostWizard, " \n")
	seedStateFile(router, "routing-only", pluginStateRouting, `{"routing":[{"address":"192.168.50.20","via":"foreign"}]}`)
	seedStateFile(router, "gone", pluginStatePostWizard, ":log info \"no container\"")

	runPluginPostWizard(router.client(t))

	var ran []string
	for _, sentence := range router.sent("/execute") {
		ran = append(ran, strings.Join(sentence, " "))
	}
	want := []string{
		"/execute =script={:log info \"remote nodes are back\"\n}",
		"/execute =script={/system script run nasnet-mtproto-local}",
	}
	if !slices.Equal(ran, want) {
		t.Errorf("scripts run\n got  %q\n want %q", ran, want)
	}
}

func TestRunPluginPostWizardWithoutContainers(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")
	router := newFakeRouterOS(t) // no container package
	seedStateFile(router, "remote-nodes", pluginStatePostWizard, ":log info hi")

	runPluginPostWizard(router.client(t))

	if got := router.sent("/execute"); len(got) != 0 {
		t.Errorf("ran %q on a router with no containers", got)
	}
}
