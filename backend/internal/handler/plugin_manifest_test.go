package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"slices"
	"strings"
	"testing"
	"time"
)

func TestPluginAddressesJSON(t *testing.T) {
	for _, tc := range []struct {
		name    string
		in      string
		want    []string
		wantErr bool
	}{
		{name: "a string, as manifests always had it", in: `"192.168.50.99/24"`, want: []string{"192.168.50.99/24"}},
		{name: "a list", in: `["192.168.50.16/24", "192.168.50.17/24"]`, want: []string{"192.168.50.16/24", "192.168.50.17/24"}},
		{name: "a one-entry list", in: `["192.168.50.16/24"]`, want: []string{"192.168.50.16/24"}},
		{name: "a comma-separated string, as Local MTProto has it", in: `"192.168.50.13/24,192.168.50.14/24"`, want: []string{"192.168.50.13/24", "192.168.50.14/24"}},
		{name: "spaces around the commas", in: `" 192.168.50.13/24 , 192.168.50.14/24 "`, want: []string{"192.168.50.13/24", "192.168.50.14/24"}},
		{name: "commas inside a list", in: `["192.168.50.13/24,192.168.50.14/24", "192.168.50.15/24"]`, want: []string{"192.168.50.13/24", "192.168.50.14/24", "192.168.50.15/24"}},
		{name: "an empty string is no address", in: `""`, want: nil},
		{name: "null is no address", in: `null`, want: nil},
		{name: "an empty list is no address", in: `[]`, want: nil},
		{name: "a trailing comma leaves a blank to name", in: `"192.168.50.13/24,"`, want: []string{"192.168.50.13/24", ""}},
		{name: "a number", in: `5`, wantErr: true},
		{name: "an object", in: `{"ip": "192.168.50.1/24"}`, wantErr: true},
		{name: "numbers in a list", in: `[1, 2]`, wantErr: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var got PluginAddresses
			err := json.Unmarshal([]byte(tc.in), &got)
			if (err != nil) != tc.wantErr {
				t.Fatalf("error = %v, want an error: %v", err, tc.wantErr)
			}
			if !tc.wantErr && !slices.Equal(got, tc.want) {
				t.Fatalf("got %q, want %q", []string(got), tc.want)
			}
		})
	}
}

func TestPluginAddressesAsRouterOSTakesThem(t *testing.T) {
	var many PluginAddresses
	if err := json.Unmarshal([]byte(`["192.168.50.16/24", "192.168.50.17/24", "192.168.50.18/24"]`), &many); err != nil {
		t.Fatal(err)
	}
	if got, want := many.RouterOS(), "192.168.50.16/24,192.168.50.17/24,192.168.50.18/24"; got != want {
		t.Errorf("RouterOS() = %q, want %q", got, want)
	}
	if got := many.Primary(); got != "192.168.50.16/24" {
		t.Errorf("Primary() = %q, want the first address", got)
	}

	var none PluginAddresses
	if none.Primary() != "" || none.RouterOS() != "" {
		t.Errorf("no addresses gave %q and %q", none.Primary(), none.RouterOS())
	}
}

// manifestWith decodes a manifest whose veth has the given address (JSON) and
// the other fields spliced in as written.
func manifestWith(t *testing.T, address, extra string) *PluginManifest {
	t.Helper()
	var manifest PluginManifest
	doc := fmt.Sprintf(`{"id": "test", "container": {"interface": {"name": "veth-test", "address": %s, "gateway": "192.168.50.1"}}%s}`, address, extra)
	if err := json.Unmarshal([]byte(doc), &manifest); err != nil {
		t.Fatalf("decode: %v", err)
	}
	return &manifest
}

const threeAddresses = `["192.168.50.16/24", "192.168.50.17/24", "192.168.50.18/24"]`

func TestManifestValidateAccepts(t *testing.T) {
	for _, tc := range []struct{ name, address, extra string }{
		{"nothing new, as before", `"192.168.50.99/24"`, ``},
		{"no address at all", `""`, ``},
		{"a comma-separated string", `"192.168.50.13/24,192.168.50.14/24"`, ``},
		{"three roles", threeAddresses, `, "routing": [
			{"address": "192.168.50.16", "via": "foreign"},
			{"address": "192.168.50.17", "via": "vpn"},
			{"address": "192.168.50.18", "via": "domestic"}]`},
		{"one address routed of several", threeAddresses, `, "routing": [{"address": "192.168.50.18", "via": "domestic"}]`},
		{"domestic destinations direct", `"192.168.50.11/24"`, `, "routing": [{"address": "192.168.50.11", "via": "foreign", "domesticDirect": true}]`},
		{"a floor", `"192.168.50.99/24"`, `, "minRouterOS": "7.11"`},
		{"a floor of a release candidate", `"192.168.50.99/24"`, `, "minRouterOS": "7.12rc1"`},
		{"empty routing", `"192.168.50.99/24"`, `, "routing": []`},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if err := manifestWith(t, tc.address, tc.extra).validate(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestManifestValidateRefuses(t *testing.T) {
	for _, tc := range []struct {
		name, address, extra string
		wantErr              []string // each must be in the message
	}{
		{
			name: "address without its prefix length", address: `"192.168.50.99"`,
			wantErr: []string{"container.interface.address", "192.168.50.99", "prefix length"},
		},
		{
			name: "address that is not an address", address: `["192.168.50.16/24", "web"]`,
			wantErr: []string{"container.interface.address", `"web"`, "prefix length"},
		},
		{
			name: "a blank entry", address: `"192.168.50.13/24,"`,
			wantErr: []string{"container.interface.address", "empty entry"},
		},
		{
			name: "the same address twice", address: `["192.168.50.16/24", "192.168.50.16/24"]`,
			wantErr: []string{"192.168.50.16", "listed twice"},
		},
		{
			name: "routing for an address the veth doesn't have", address: `["192.168.50.16/24", "192.168.50.17/24"]`,
			extra:   `, "routing": [{"address": "192.168.50.18", "via": "foreign"}]`,
			wantErr: []string{"routing[0]", "192.168.50.18", "not one of the veth's addresses", "192.168.50.16, 192.168.50.17"},
		},
		{
			name: "routing for a veth with no address", address: `""`,
			extra:   `, "routing": [{"address": "192.168.50.16", "via": "foreign"}]`,
			wantErr: []string{"routing[0]", "not one of the veth's addresses", "it has none"},
		},
		{
			name: "the same address routed twice", address: threeAddresses,
			extra:   `, "routing": [{"address": "192.168.50.16", "via": "foreign"}, {"address": "192.168.50.16", "via": "vpn"}]`,
			wantErr: []string{"routing[1]", "192.168.50.16", "already routed by routing[0]"},
		},
		{
			name: "an unknown link", address: threeAddresses,
			extra:   `, "routing": [{"address": "192.168.50.16", "via": "satellite"}]`,
			wantErr: []string{"routing[0]", `"satellite"`, "foreign, domestic or vpn"},
		},
		{
			name: "no link", address: threeAddresses,
			extra:   `, "routing": [{"address": "192.168.50.16"}]`,
			wantErr: []string{"routing[0]", `via ""`},
		},
		{
			name: "a link in the wrong case", address: threeAddresses,
			extra:   `, "routing": [{"address": "192.168.50.16", "via": "Foreign"}]`,
			wantErr: []string{"routing[0]", `"Foreign"`},
		},
		{
			name: "an address with a prefix length", address: threeAddresses,
			extra:   `, "routing": [{"address": "192.168.50.16/24", "via": "foreign"}]`,
			wantErr: []string{"routing[0]", "192.168.50.16/24", "without a prefix length"},
		},
		{
			name: "an IPv6 address", address: `"fd00::10/64"`,
			extra:   `, "routing": [{"address": "fd00::10", "via": "foreign"}]`,
			wantErr: []string{"routing[0]", "not an IPv4 address"},
		},
		{
			name: "an address written with a leading zero", address: threeAddresses,
			extra:   `, "routing": [{"address": "192.168.050.16", "via": "foreign"}]`,
			wantErr: []string{"routing[0]", "192.168.050.16"},
		},
		{
			name: "domesticDirect on a link that is not foreign", address: threeAddresses,
			extra:   `, "routing": [{"address": "192.168.50.18", "via": "domestic", "domesticDirect": true}]`,
			wantErr: []string{"routing[0]", "domesticDirect", "foreign"},
		},
		{
			name: "a floor that is not a version", address: `"192.168.50.99/24"`,
			extra:   `, "minRouterOS": "recent"`,
			wantErr: []string{"minRouterOS", `"recent"`},
		},
		{
			name: "a floor with a v", address: `"192.168.50.99/24"`,
			extra:   `, "minRouterOS": "v7.11"`,
			wantErr: []string{"minRouterOS", `"v7.11"`},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			err := manifestWith(t, tc.address, tc.extra).validate()
			if err == nil {
				t.Fatal("the manifest was accepted")
			}
			for _, want := range tc.wantErr {
				if !strings.Contains(err.Error(), want) {
					t.Errorf("error %q does not mention %q", err, want)
				}
			}
		})
	}
}

func TestManifestScriptsPostWizard(t *testing.T) {
	var manifest PluginManifest
	doc := `{"scripts": {"preInstall": "a.rsc", "postInstall": "b.rsc", "preUninstall": "c.rsc", "postWizard": "d.rsc"}}`
	if err := json.Unmarshal([]byte(doc), &manifest); err != nil {
		t.Fatal(err)
	}
	if got := manifest.Scripts; got != (PluginManifestScripts{PreInstall: "a.rsc", PostInstall: "b.rsc", PreUninstall: "c.rsc", PostWizard: "d.rsc"}) {
		t.Fatalf("scripts = %+v", got)
	}
}

// routingManifest is a small manifest whose veth has the given address (as
// JSON); extra is spliced in after the container object, comma first.
func routingManifest(id, address, extra string) string {
	return fmt.Sprintf(`{
		"id": %q, "name": "Routing Test", "version": "1.0.0", "architectures": ["arm64"],
		"container": {
			"image": "ghcr.io/example/routing-test:1",
			"interface": {"name": "veth-%s", "address": %s, "gateway": "192.168.50.1"},
			"mounts": [{"name": "%s-data", "src": "data", "dst": "/data"}]
		}%s
	}`, id, id, address, id, extra)
}

// stubPluginFiles serves the files of the registry's plugins (keyed by
// "<id>/<path>") in place of the network.
func stubPluginFiles(t *testing.T, files map[string]string) {
	t.Helper()

	previous := pluginHTTPClient
	pluginHTTPClient = &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		body, found := files[strings.TrimPrefix(req.URL.String(), pluginFilesURL+"/")]
		status := http.StatusOK
		if !found {
			status = http.StatusNotFound
		}
		return &http.Response{StatusCode: status, Header: http.Header{}, Body: io.NopCloser(strings.NewReader(body)), Request: req}, nil
	})}
	t.Cleanup(func() { pluginHTTPClient = previous })
}

func newInstallTask(id string) *pluginInstallTask {
	return &pluginInstallTask{pluginID: id, phase: pluginInstallPhasePreparing, startedAt: time.Now()}
}

func TestInstallCreatesTheVethWithEveryAddress(t *testing.T) {
	cases := []struct {
		name, address, want string
	}{
		{"one address as a string, as ever", `"192.168.50.99/24"`, "192.168.50.99/24"},
		{"three addresses as a list", threeAddresses, "192.168.50.16/24,192.168.50.17/24,192.168.50.18/24"},
		{"two addresses as a comma-separated string", `"192.168.50.13/24,192.168.50.14/24"`, "192.168.50.13/24,192.168.50.14/24"},
	}
	files := map[string]string{}
	for i, tc := range cases {
		files[fmt.Sprintf("veth-test-%d/manifest.json", i)] = routingManifest(fmt.Sprintf("veth-test-%d", i), tc.address, "")
	}
	stubPluginFiles(t, files)

	for i, tc := range cases {
		id := fmt.Sprintf("veth-test-%d", i)
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			router, client := newContainerFake(t)
			task := newInstallTask(id)
			installPluginAsync(client, task)
			if got := task.snapshot(); got.Phase != string(pluginInstallPhaseDone) {
				t.Fatalf("install ended in %q: %s", got.Phase, got.Message)
			}

			want := []string{"/interface/veth/add", "=name=veth-" + id, "=address=" + tc.want, "=gateway=192.168.50.1"}
			if got := router.find("/interface/veth/add"); !slices.Equal(got, want) {
				t.Fatalf("veth added with\n got  %q\n want %q", got, want)
			}
		})
	}
}

func TestInstallRefusesAManifestWithBadRouting(t *testing.T) {
	const id = "bad-routing"
	stubPluginFiles(t, map[string]string{id + "/manifest.json": routingManifest(id, `"192.168.50.99/24"`,
		`, "routing": [{"address": "192.168.50.98", "via": "foreign"}]`)})

	router, client := newContainerFake(t)
	task := newInstallTask(id)
	installPluginAsync(client, task)

	got := task.snapshot()
	if got.Phase != string(pluginInstallPhaseError) || !strings.Contains(got.Message, "192.168.50.98") || !strings.Contains(got.Message, "not one of the veth's addresses") {
		t.Fatalf("install ended in %q with %q, want a refusal that names the address", got.Phase, got.Message)
	}
	if changes := router.changes(); len(changes) > 0 {
		t.Fatalf("a refused manifest still changed the router: %v", changes)
	}
}
