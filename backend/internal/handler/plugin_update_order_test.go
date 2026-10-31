package handler

import (
	"bufio"
	"net"
	"slices"
	"strings"
	"sync"
	"testing"

	"github.com/go-routeros/routeros/v3/proto"

	"nasnet-panel/pkg/routeros"
)

// updateFake is a router with one container, answering what a plugin update
// sends it. Like RouterOS, it restarts a running container whose property is
// set, and counts those restarts.
type updateFake struct {
	mu        sync.Mutex
	container map[string]string
	files     map[string]string // by name: what an update that saves routing wrote
	commands  []string
	restarts  int
}

func newUpdateFake(t *testing.T) (*updateFake, *routeros.Client) {
	t.Helper()

	ln, err := (&net.ListenConfig{}).Listen(t.Context(), "tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = ln.Close() })

	f := &updateFake{files: map[string]string{}, container: map[string]string{
		".id": "*1", "name": "demo", "running": "true", "healthy": "true",
		"image-id": "old-image", "config-json": "old-config", "comment": "0.1.1",
	}}
	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			go f.serve(conn)
		}
	}()

	client, err := routeros.NewClient(routeros.ConnectionConfig{
		Address:  "127.0.0.1",
		Port:     ln.Addr().(*net.TCPAddr).Port,
		Username: "admin",
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = client.Close() })
	return f, client
}

func (f *updateFake) serve(conn net.Conn) {
	defer func() { _ = conn.Close() }()

	r := bufio.NewReader(conn)
	w := proto.NewWriter(conn)
	for {
		words, err := readFakeSentence(r)
		if err != nil {
			return
		}
		if len(words) == 0 {
			continue
		}

		f.mu.Lock()
		replies := f.answer(words)
		f.mu.Unlock()

		for _, reply := range replies {
			w.BeginSentence()
			for _, word := range reply {
				w.WriteWord(word)
			}
			if err := w.EndSentence(); err != nil {
				return
			}
		}
	}
}

// answer replies to one command. The caller holds f.mu.
func (f *updateFake) answer(words []string) [][]string {
	if words[0] == "/login" {
		return [][]string{{"!done"}}
	}
	f.commands = append(f.commands, words[0])

	switch words[0] {
	case "/container/print":
		re := []string{"!re"}
		for key, value := range f.container {
			re = append(re, "="+key+"="+value)
		}
		return [][]string{re, {"!done"}}
	case "/container/stop":
		f.container["running"], f.container["healthy"], f.container["stopped"] = "false", "false", "true"
	case "/container/repull":
		f.container["image-id"], f.container["config-json"] = "new-image", "new-config"
	case "/container/start":
		f.container["running"], f.container["stopped"] = "true", "false"
	case "/file/add":
		if name := wordValue(words, "name"); name != "" {
			f.files[name] = ""
		}
	case "/file/print":
		name := wordValue(words, "name")
		if _, ok := f.files[name]; !ok {
			return [][]string{{"!done"}}
		}
		return [][]string{{"!re", "=.id=*f:" + name, "=name=" + name, "=size=0", "=type=file"}, {"!done"}}
	case "/file/set":
		if id := wordValue(words, ".id"); strings.HasPrefix(id, "*f:") {
			f.files[strings.TrimPrefix(id, "*f:")] = wordValue(words, "contents")
		}
	case "/container/set":
		if f.container["running"] == "true" {
			f.restarts++
		}
		for _, word := range words[1:] {
			if key, value, ok := strings.Cut(strings.TrimPrefix(word, "="), "="); ok && key == "comment" {
				f.container[key] = value
			}
		}
	}
	if strings.HasSuffix(words[0], "/add") { // an add answers with the new row's id
		return [][]string{{"!done", "=ret=*9"}}
	}
	return [][]string{{"!done"}}
}

// An update sets the new version on the container while it is stopped. RouterOS
// restarts a running container when a property is set, which stopped the
// plugin right after the update had started it.
func TestUpdateRecordsTheVersionBeforeStartingTheContainer(t *testing.T) {
	f, client := newUpdateFake(t)

	task := &pluginUpdateTask{pluginID: "demo"}
	manifest := &PluginManifest{ID: "demo", Version: "0.1.2", Container: PluginManifestContainer{Image: "example/demo:0.1.2"}}
	updatePluginAsync(client, task, manifest)

	if got := task.snapshot(); got.Phase != string(pluginUpdatePhaseDone) {
		t.Fatalf("update ended in phase %q (%s), want done", got.Phase, got.Message)
	}

	f.mu.Lock()
	defer f.mu.Unlock()

	if f.restarts != 0 {
		t.Errorf("a property was set on a running container %d time(s), and RouterOS restarts it each time", f.restarts)
	}
	if got := f.container["comment"]; got != "0.1.2" {
		t.Errorf("container comment = %q, want 0.1.2", got)
	}
	if got := f.container["running"]; got != "true" {
		t.Errorf("container running = %q after the update, want true", got)
	}

	var changes []string
	for _, command := range f.commands {
		// reads are not changes: the container's state, and the saved routing the update looks for
		if command != "/container/print" && command != "/file/print" {
			changes = append(changes, command)
		}
	}
	want := []string{"/container/stop", "/container/repull", "/container/set", "/container/start"}
	if !slices.Equal(changes, want) {
		t.Errorf("commands = %v, want %v", changes, want)
	}
}

// wordValue is the value of a command's =key= or ?=key= word, or "".
func wordValue(words []string, key string) string {
	for _, word := range words[1:] {
		word = strings.TrimPrefix(strings.TrimPrefix(word, "?"), "=")
		if value, ok := strings.CutPrefix(word, key+"="); ok {
			return value
		}
	}
	return ""
}
