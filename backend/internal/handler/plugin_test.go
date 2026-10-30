package handler

import (
	"fmt"
	"io"
	"net/http"
	"slices"
	"strings"
	"testing"
	"time"
)

// pluginCatalogStub serves manifests by plugin id in place of the registry.
type pluginCatalogStub map[string]string

func (s pluginCatalogStub) RoundTrip(req *http.Request) (*http.Response, error) {
	status, body := http.StatusNotFound, ""
	for id, manifest := range s {
		if strings.HasSuffix(req.URL.Path, "/"+id+"/manifest.json") {
			status, body = http.StatusOK, manifest
		}
	}
	return &http.Response{
		StatusCode: status,
		Header:     make(http.Header),
		Body:       io.NopCloser(strings.NewReader(body)),
		Request:    req,
	}, nil
}

// testPluginManifest is a small but complete manifest; extra is spliced in as
// more members of its container object.
func testPluginManifest(id, extra string) string {
	return fmt.Sprintf(`{
		"id": %q, "name": "Test", "version": "1.2.3", "architectures": ["arm64"],
		"container": {
			"image": "ghcr.io/example/test:1",
			"interface": {"name": "veth-test", "address": "192.168.50.99/24", "gateway": "192.168.50.1"},
			"env": {"MODE": "on"},
			"mounts": [{"name": "test-data", "src": "test/data", "dst": "/data"}]%s
		}
	}`, id, extra)
}

// testContainerAdd is the /container/add an install of the test manifest
// sends: settings and restart are the words its optional settings add.
func testContainerAdd(id string, settings, restart []string) []string {
	words := []string{
		"/container/add", "=name=" + id, "=interface=veth-test", "=remote-image=ghcr.io/example/test:1",
		"=root-dir=nasnet-panel/containers/" + id, "=env=MODE=on", "=mountlists=test-data",
	}
	words = append(words, settings...)
	words = append(words, "=logging=yes", "=start-on-boot=yes")
	words = append(words, restart...)
	return append(words, "=comment=1.2.3")
}

func TestInstallContainerSettings(t *testing.T) {
	cases := []struct {
		name     string
		extra    string   // more members for the manifest's container object
		settings []string // what a successful install adds to /container/add
		restart  []string
		wantErr  string // part of the error shown when the install is refused
	}{
		{
			name: "no settings, container added as it always was",
		},
		{
			name: "every setting",
			extra: `, "memoryHigh": "128M", "memoryMax": "256M", "cpuList": "cpu0,cpu1",
				"user": "1000:1000", "devices": ["serial0"], "autoRestartInterval": "30s"`,
			settings: []string{
				"=devices=serial0", "=cpu-list=cpu0,cpu1", "=user=1000:1000",
				"=memory-high=134217728", "=memory-max=268435456",
			},
			restart: []string{"=restart-policy=always", "=restart-interval=30s"},
		},
		{
			name:     "some settings",
			extra:    `, "memoryMax": "64M", "user": "nobody"`,
			settings: []string{"=user=nobody", "=memory-max=67108864"},
		},
		{
			name:    "size that is not a size",
			extra:   `, "memoryMax": "lots"`,
			wantErr: "memoryMax",
		},
		{
			name:    "memoryMax under what RouterOS accepts",
			extra:   `, "memoryMax": "512k"`,
			wantErr: "memoryMax",
		},
		{
			name:    "user that is not a user",
			extra:   `, "user": "root user"`,
			wantErr: "user",
		},
		{
			name:    "interval that is not a time",
			extra:   `, "autoRestartInterval": "soon"`,
			wantErr: "autoRestartInterval",
		},
		{
			name:    "good settings next to a bad one",
			extra:   `, "memoryHigh": "128M", "cpuList": "0,1"`,
			wantErr: "cpuList",
		},
	}

	catalog := pluginCatalogStub{}
	for i, tc := range cases {
		catalog[fmt.Sprintf("settings-test-%d", i)] = testPluginManifest(fmt.Sprintf("settings-test-%d", i), tc.extra)
	}
	original := pluginHTTPClient
	pluginHTTPClient = &http.Client{Transport: catalog}
	t.Cleanup(func() { pluginHTTPClient = original })

	for i, tc := range cases {
		id := fmt.Sprintf("settings-test-%d", i)
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			router, client := newContainerFake(t)
			task := &pluginInstallTask{pluginID: id, phase: pluginInstallPhasePreparing, startedAt: time.Now()}
			installPluginAsync(client, task)
			got := task.snapshot()

			if tc.wantErr != "" {
				if got.Phase != string(pluginInstallPhaseError) || !strings.Contains(got.Message, tc.wantErr) {
					t.Fatalf("install ended in %q with %q, want an error mentioning %q", got.Phase, got.Message, tc.wantErr)
				}
				if changes := router.changes(); len(changes) > 0 {
					t.Fatalf("a refused manifest still changed the router: %v", changes)
				}
				return
			}

			if got.Phase != string(pluginInstallPhaseDone) {
				t.Fatalf("install ended in %q: %s", got.Phase, got.Message)
			}
			want := testContainerAdd(id, tc.settings, tc.restart)
			if add := router.find("/container/add"); !slices.Equal(add, want) {
				t.Fatalf("container added with\n got  %q\n want %q", add, want)
			}
		})
	}
}
