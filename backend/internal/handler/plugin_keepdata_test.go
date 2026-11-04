package handler

import (
	"encoding/json"
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

const volumesDir = "nasnet-panel/container-volumes/"

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

	registry := &PluginRegistry{}
	for id := range manifests {
		registry.Plugins = append(registry.Plugins, PluginInfo{ID: id})
	}
	previousRegistry := cachedPluginRegistry()
	cachePluginRegistry(registry)

	t.Cleanup(func() {
		pluginHTTPClient = previousClient
		cachePluginRegistry(previousRegistry)
	})
	return fetches
}

func dirRow(name string) map[string]string {
	return map[string]string{"name": name, "type": "directory"}
}

func fileRow(name string) map[string]string {
	return map[string]string{"name": name, "type": "file"}
}

// seedPlugin puts an installed plugin on the fake router: its container, mount
// list, veth, bridge port and a data folder holding a file, next to another
// plugin's folder that an uninstall must never touch.
func seedPlugin(f *fakeRouterOS, id string) {
	f.seed("/container", map[string]string{"name": id, "running": "true"})
	f.seed("/container/mounts", map[string]string{"list": id + "-data", "src": volumesDir + id + "/data", "dst": "/data"})
	f.seed("/interface/veth", map[string]string{"name": "veth-" + id})
	f.seed("/interface/bridge/port", map[string]string{"bridge": "containers", "interface": "veth-" + id})
	f.seed("/file",
		dirRow("nasnet-panel"),
		dirRow(strings.TrimSuffix(volumesDir, "/")),
		dirRow(volumesDir+id),
		dirRow(volumesDir+id+"/data"),
		fileRow(volumesDir+id+"/data/ca.key"),
		dirRow(volumesDir+"bystander"),
		fileRow(volumesDir+"bystander/state"),
	)
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
		manifest := &PluginManifest{KeepDataOnUninstall: tc.flag}
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

func TestUninstallPluginDataFolder(t *testing.T) {
	// Keeps the router client's per-command logging out of the test output.
	t.Setenv("ENVIRONMENT", "production")

	yes, no := true, false
	cases := []struct {
		name     string
		flag     string // spliced into the manifest
		keepData *bool
		wantKept bool
	}{
		{name: "manifest keeps, request silent", flag: keepDataFlag, keepData: nil, wantKept: true},
		{name: "manifest keeps, request keeps", flag: keepDataFlag, keepData: &yes, wantKept: true},
		{name: "manifest keeps, request deletes", flag: keepDataFlag, keepData: &no, wantKept: false},
		{name: "flag absent, request silent", flag: "", keepData: nil, wantKept: false},
		{name: "flag absent, request keeps", flag: "", keepData: &yes, wantKept: true},
		{name: "flag absent, request deletes", flag: "", keepData: &no, wantKept: false},
	}

	manifests := make(map[string]string, len(cases))
	for i, tc := range cases {
		manifests[fmt.Sprintf("plugin-%d", i)] = manifestJSON(fmt.Sprintf("plugin-%d", i), tc.flag)
	}
	stubPluginCatalog(t, manifests)

	for i, tc := range cases {
		id := fmt.Sprintf("plugin-%d", i)
		dataDir := volumesDir + id

		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			router := newFakeRouterOS(t)
			seedPlugin(router, id)
			client := router.client(t)

			c, rec := newUninstallContext(t, id, "")
			if err := uninstallPlugin(c, client, id, tc.keepData); err != nil {
				t.Fatalf("uninstallPlugin: %v", err)
			}
			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d: %s", rec.Code, http.StatusOK, rec.Body.String())
			}
			var reply struct {
				Data UninstallPluginResponse `json:"data"`
			}
			if err := json.Unmarshal(rec.Body.Bytes(), &reply); err != nil {
				t.Fatalf("decode reply: %v", err)
			}
			if len(reply.Data.Warnings) > 0 {
				t.Errorf("warnings: %v", reply.Data.Warnings)
			}

			// Keeping data is only about the folder; the rest goes either way.
			if router.has("/container", "name", id) || router.has("/container/mounts", "list", id+"-data") ||
				router.has("/interface/veth", "name", "veth-"+id) || router.has("/interface/bridge/port", "interface", "veth-"+id) {
				t.Error("uninstall left the container, mount list or veth behind")
			}
			if !router.has("/file", "name", volumesDir+"bystander/state") {
				t.Error("uninstall touched another plugin's data")
			}

			wantVolumeDir, wantRemovals := "", 0
			if !tc.wantKept {
				wantVolumeDir, wantRemovals = dataDir, 1
			}
			for _, name := range []string{dataDir, dataDir + "/data/ca.key"} {
				if got := router.has("/file", "name", name); got != tc.wantKept {
					t.Errorf("%s present = %v, want %v", name, got, tc.wantKept)
				}
			}
			if reply.Data.VolumeDir != wantVolumeDir {
				t.Errorf("volumeDir = %q, want %q", reply.Data.VolumeDir, wantVolumeDir)
			}
			if got := len(router.sent("/file/remove")); got != wantRemovals {
				t.Errorf("/file/remove sent %d times, want %d", got, wantRemovals)
			}

			// A reinstall prepares the same folder again. Over kept data it must
			// not create or delete anything; over a deleted folder it starts fresh.
			addsBefore := len(router.sent("/file/add"))
			dir, err := preparePluginVolumeDir(client, id, "data")
			if err != nil {
				t.Fatalf("preparePluginVolumeDir: %v", err)
			}
			if dir != dataDir+"/data" {
				t.Errorf("preparePluginVolumeDir = %q, want %q", dir, dataDir+"/data")
			}
			created, wantCreated := len(router.sent("/file/add"))-addsBefore, 2
			if tc.wantKept {
				wantCreated = 0
			}
			if created != wantCreated {
				t.Errorf("reinstall created %d directories, want %d", created, wantCreated)
			}
			if got := router.has("/file", "name", dataDir+"/data/ca.key"); got != tc.wantKept {
				t.Errorf("after reinstall ca.key present = %v, want %v", got, tc.wantKept)
			}
			if got := len(router.sent("/file/remove")); got != wantRemovals {
				t.Errorf("reinstall sent /file/remove, now %d in total, want %d", got, wantRemovals)
			}
		})
	}
}

func TestPreparePluginVolumeDirCreatesOnlyWhatIsMissing(t *testing.T) {
	t.Setenv("ENVIRONMENT", "production")

	router := newFakeRouterOS(t)
	router.seed("/file", dirRow("nasnet-panel"), dirRow(strings.TrimSuffix(volumesDir, "/")), dirRow(volumesDir+"keeper"))
	client := router.client(t)

	dir, err := preparePluginVolumeDir(client, "keeper", "ca/data")
	if err != nil {
		t.Fatalf("preparePluginVolumeDir: %v", err)
	}
	if want := volumesDir + "keeper/ca/data"; dir != want {
		t.Errorf("dir = %q, want %q", dir, want)
	}

	var created []string
	for _, sentence := range router.sent("/file/add") {
		created = append(created, strings.TrimPrefix(sentence[1], "=name="))
	}
	want := []string{volumesDir + "keeper/ca", volumesDir + "keeper/ca/data"}
	if strings.Join(created, ",") != strings.Join(want, ",") {
		t.Errorf("created %v, want %v", created, want)
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

	list := func(version string) []PluginInfo {
		plugins := []PluginInfo{
			{ID: "keeper", Version: version, Installed: true},
			{ID: "plain", Version: version, Installed: true},
			{ID: "uninstalled", Version: version},
			{ID: "unreachable", Version: version, Installed: true},
		}
		fillKeepDataOnUninstall(t.Context(), plugins)
		return plugins
	}
	flags := func(plugins []PluginInfo) string {
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
