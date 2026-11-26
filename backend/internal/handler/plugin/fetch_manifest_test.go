package plugin

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// A manifest the panel can't install is still fetched for an uninstall.
func TestOnlyInstallsCheckTheManifest(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/plugins/test/manifest.json" {
			http.NotFound(w, r)
			return
		}
		_, _ = w.Write([]byte(`{"id": "test", "container": {"interface": {"name": "veth-test", "address": "192.168.150.17/28"}}}`))
	}))
	defer srv.Close()

	was := pluginFilesURL
	pluginFilesURL = srv.URL + "/plugins"
	defer func() { pluginFilesURL = was }()

	manifest, err := fetchPluginManifest(t.Context(), "test")
	if err != nil {
		t.Fatalf("fetchPluginManifest: %v", err)
	}
	if manifest.Container.Interface.Name != "veth-test" {
		t.Errorf("got veth %q", manifest.Container.Interface.Name)
	}

	if _, err := fetchInstallManifest(t.Context(), "test"); err == nil || !strings.Contains(err.Error(), "container.interface.address") {
		t.Errorf("fetchInstallManifest err = %v, want the address refused", err)
	}
}
