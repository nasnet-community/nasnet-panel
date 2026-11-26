package plugin

import (
	"encoding/json"
	"fmt"
	"slices"
	"strings"
	"testing"
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
			var got Addresses
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
	var many Addresses
	if err := json.Unmarshal([]byte(`["192.168.50.16/24", "192.168.50.17/24", "192.168.50.18/24"]`), &many); err != nil {
		t.Fatal(err)
	}
	if got, want := many.RouterOS(), "192.168.50.16/24,192.168.50.17/24,192.168.50.18/24"; got != want {
		t.Errorf("RouterOS() = %q, want %q", got, want)
	}
	if got := many.Primary(); got != "192.168.50.16/24" {
		t.Errorf("Primary() = %q, want the first address", got)
	}

	var none Addresses
	if none.Primary() != "" || none.RouterOS() != "" {
		t.Errorf("no addresses gave %q and %q", none.Primary(), none.RouterOS())
	}
}

// manifestWith decodes a manifest whose veth has the given address (JSON) and
// the other fields spliced in as written.
func manifestWith(t *testing.T, address, extra string) *Manifest {
	t.Helper()
	var manifest Manifest
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
		{"a list", threeAddresses, ``},
		{"a floor", `"192.168.50.99/24"`, `, "minRouterOS": "7.11"`},
		{"a floor of a release candidate", `"192.168.50.99/24"`, `, "minRouterOS": "7.12rc1"`},
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
	var manifest Manifest
	doc := `{"scripts": {"preInstall": "a.rsc", "postInstall": "b.rsc", "preUninstall": "c.rsc", "postWizard": "d.rsc"}}`
	if err := json.Unmarshal([]byte(doc), &manifest); err != nil {
		t.Fatal(err)
	}
	if got := manifest.Scripts; got != (ManifestScripts{PreInstall: "a.rsc", PostInstall: "b.rsc", PreUninstall: "c.rsc", PostWizard: "d.rsc"}) {
		t.Fatalf("scripts = %+v", got)
	}
}
