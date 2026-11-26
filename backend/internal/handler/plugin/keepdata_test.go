package plugin

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"path"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/labstack/echo/v4"
)

const keepDataFlag = `"keepDataOnUninstall": true,`

// manifestJSON is a minimal manifest document for plugin id. The flag argument
// is spliced in as written, so a test can set keepDataOnUninstall or leave it out
// the way a real manifest would.
func manifestJSON(id, flag string) string {
	return fmt.Sprintf(`{
  "id": %q,
  "version": "1.0.0",
  %s
  "container": {
    "interface": {"name": "veth-%s", "address": "192.168.50.99/24", "gateway": "192.168.50.1"},
    "mounts": [{"name": "%s-data", "src": "data", "dst": "/data"}]
  }
}`, id, flag, id, id)
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

// stubPluginCatalog serves the given manifests (JSON by plugin id) in place of
// the community registry and lists the same ids in the registry cache, so the
// handlers never touch the network. It returns how many manifests were fetched.
func stubPluginCatalog(t *testing.T, manifests map[string]string) *atomic.Int32 {
	t.Helper()

	fetches := new(atomic.Int32)
	previousClient := pluginHTTPClient
	pluginHTTPClient = &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
		fetches.Add(1)
		status, body := http.StatusOK, manifests[path.Base(path.Dir(req.URL.Path))]
		if path.Base(req.URL.Path) != "manifest.json" || body == "" {
			status = http.StatusNotFound
		}
		return &http.Response{
			StatusCode: status,
			Header:     http.Header{},
			Body:       io.NopCloser(strings.NewReader(body)),
			Request:    req,
		}, nil
	})}

	registry := &Registry{}
	for id := range manifests {
		registry.Plugins = append(registry.Plugins, Info{ID: id})
	}
	previousRegistry := cachedPluginRegistry()
	cachePluginRegistry(registry)

	t.Cleanup(func() {
		pluginHTTPClient = previousClient
		cachePluginRegistry(previousRegistry)
	})
	return fetches
}

// newUninstallContext builds the request context of DELETE /api/plugin/plugin/{id}.
func newUninstallContext(t *testing.T, id, query string) (echo.Context, *httptest.ResponseRecorder) {
	t.Helper()

	req := httptest.NewRequestWithContext(t.Context(), http.MethodDelete, "/api/plugin/plugin/"+id+query, http.NoBody)
	rec := httptest.NewRecorder()
	c := echo.New().NewContext(req, rec)
	c.SetParamNames("name")
	c.SetParamValues(id)
	return c, rec
}

func describeKeepData(keep *bool) string {
	if keep == nil {
		return "nil"
	}
	return strconv.FormatBool(*keep)
}

func TestKeepPluginData(t *testing.T) {
	yes, no := true, false
	for _, tc := range []struct {
		flag     bool
		keepData *bool
		want     bool
	}{
		{flag: true, keepData: nil, want: true},
		{flag: true, keepData: &yes, want: true},
		{flag: true, keepData: &no, want: false},
		{flag: false, keepData: nil, want: false},
		{flag: false, keepData: &yes, want: true},
		{flag: false, keepData: &no, want: false},
	} {
		manifest := &Manifest{KeepDataOnUninstall: tc.flag}
		if got := keepPluginData(manifest, tc.keepData); got != tc.want {
			t.Errorf("keepPluginData(flag=%v, keepData=%s) = %v, want %v", tc.flag, describeKeepData(tc.keepData), got, tc.want)
		}
	}
}

func TestKeepDataParam(t *testing.T) {
	for _, tc := range []struct {
		query   string
		want    string
		wantErr bool
	}{
		{query: "", want: "nil"},
		{query: "?keepData=", want: "nil"},
		{query: "?keepData=true", want: "true"},
		{query: "?keepData=false", want: "false"},
		{query: "?keepData=1", wantErr: true},
		{query: "?keepData=TRUE", wantErr: true},
		{query: "?keepData=maybe", wantErr: true},
	} {
		c, _ := newUninstallContext(t, "keeper", tc.query)
		got, err := keepDataParam(c)
		if (err != nil) != tc.wantErr {
			t.Errorf("keepDataParam(%q) error = %v, want error: %v", tc.query, err, tc.wantErr)
			continue
		}
		if !tc.wantErr && describeKeepData(got) != tc.want {
			t.Errorf("keepDataParam(%q) = %s, want %s", tc.query, describeKeepData(got), tc.want)
		}
	}
}

func TestHandleUninstallPluginRejectsBadKeepData(t *testing.T) {
	c, rec := newUninstallContext(t, "keeper", "?keepData=maybe")
	if err := HandleUninstallPlugin(c); err != nil {
		t.Fatalf("HandleUninstallPlugin: %v", err)
	}
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
	if !strings.Contains(rec.Body.String(), "keepData must be true or false") {
		t.Errorf("body %q doesn't say what's wrong with keepData", rec.Body.String())
	}
}

func TestFillKeepDataOnUninstall(t *testing.T) {
	fetches := stubPluginCatalog(t, map[string]string{
		"keeper": manifestJSON("keeper", keepDataFlag),
		"plain":  manifestJSON("plain", ""),
	})
	resetKeepData := func() {
		pluginKeepDataMu.Lock()
		defer pluginKeepDataMu.Unlock()
		clear(pluginKeepData)
	}
	resetKeepData()
	t.Cleanup(resetKeepData)

	list := func(version string) []Info {
		plugins := []Info{
			{ID: "keeper", Version: version, Installed: true},
			{ID: "plain", Version: version, Installed: true},
			{ID: "uninstalled", Version: version},
			{ID: "unreachable", Version: version, Installed: true},
		}
		fillKeepDataOnUninstall(t.Context(), plugins)
		return plugins
	}
	flags := func(plugins []Info) string {
		parts := make([]string, len(plugins))
		for i := range plugins {
			parts[i] = plugins[i].ID + "=" + strconv.FormatBool(plugins[i].KeepDataOnUninstall)
		}
		return strings.Join(parts, " ")
	}
	const want = "keeper=true plain=false uninstalled=false unreachable=false"

	// Three manifests are asked for: the uninstalled plugin is skipped, and the
	// unreachable one has none to give.
	if got := flags(list("1.0.0")); got != want {
		t.Errorf("flags = %q, want %q", got, want)
	}
	if got := fetches.Load(); got != 3 {
		t.Errorf("first list fetched %d manifests, want 3", got)
	}

	// Only the failed one is asked for again; the rest come from the cache.
	if got := flags(list("1.0.0")); got != want {
		t.Errorf("flags = %q, want %q", got, want)
	}
	if got := fetches.Load(); got != 4 {
		t.Errorf("second list fetched %d manifests in total, want 4", got)
	}

	// A new registry version means the manifest may have changed.
	if got := flags(list("1.1.0")); got != want {
		t.Errorf("flags = %q, want %q", got, want)
	}
	if got := fetches.Load(); got != 7 {
		t.Errorf("list after an update fetched %d manifests in total, want 7", got)
	}
}
