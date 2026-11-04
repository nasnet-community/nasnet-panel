package handler

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"strings"
	"sync"
	"testing"

	"github.com/go-routeros/routeros/v3/proto"

	"nasnet-panel/pkg/routeros"
)

// containerFake speaks just enough of the RouterOS API for the real
// routeros.Client to run against it. It records every command and answers the
// ones a plugin install makes; anything else gets an empty "done".
type containerFake struct {
	mu         sync.Mutex
	commands   [][]string
	containers map[string]map[string]string
	lastID     int
}

// newContainerFake starts a fake router on a loopback port and returns it with
// a client already connected to it.
func newContainerFake(t *testing.T) (*containerFake, *routeros.Client) {
	t.Helper()

	ln, err := (&net.ListenConfig{}).Listen(t.Context(), "tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = ln.Close() })

	f := &containerFake{containers: map[string]map[string]string{}}
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

func (f *containerFake) serve(conn net.Conn) {
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
		if words[0] != "/login" {
			f.commands = append(f.commands, words)
		}
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

// answer returns the reply sentences for one command. The caller holds f.mu.
func (f *containerFake) answer(words []string) [][]string {
	cmd := words[0]

	// Both "=key=value" arguments and "?=key=value" query words.
	args := map[string]string{}
	for _, word := range words[1:] {
		word = strings.TrimPrefix(strings.TrimPrefix(word, "?"), "=")
		if key, value, ok := strings.Cut(word, "="); ok {
			args[key] = value
		}
	}

	switch {
	case cmd == "/system/resource/print":
		return [][]string{{"!re", "=architecture-name=arm64"}, {"!done"}}

	case cmd == "/container/add":
		f.lastID++
		id := fmt.Sprintf("*%d", f.lastID)
		f.containers[args["name"]] = map[string]string{".id": id, "name": args["name"], "running": "true"}
		return [][]string{{"!done", "=ret=" + id}}

	case cmd == "/container/print":
		if container, ok := f.containers[args["name"]]; ok {
			re := []string{"!re"}
			for key, value := range container {
				re = append(re, "="+key+"="+value)
			}
			return [][]string{re, {"!done"}}
		}

	case strings.HasSuffix(cmd, "/add"):
		f.lastID++
		return [][]string{{"!done", fmt.Sprintf("=ret=*%d", f.lastID)}}
	}

	return [][]string{{"!done"}}
}

// find returns the last command sent to path (such as "/container/add"), or
// nil when there was none.
func (f *containerFake) find(path string) []string {
	f.mu.Lock()
	defer f.mu.Unlock()

	for i := len(f.commands) - 1; i >= 0; i-- {
		if f.commands[i][0] == path {
			return f.commands[i]
		}
	}
	return nil
}

// changes returns the commands sent so far that add, set, remove or start
// something, i.e. everything that would alter a real router.
func (f *containerFake) changes() []string {
	f.mu.Lock()
	defer f.mu.Unlock()

	var changes []string
	for _, words := range f.commands {
		for _, verb := range []string{"/add", "/set", "/remove", "/start", "/run"} {
			if strings.HasSuffix(words[0], verb) {
				changes = append(changes, words[0])
			}
		}
	}
	return changes
}

// readFakeSentence reads one API sentence: length-prefixed words up to an
// empty one. Only words under 16 KiB are supported, which is plenty here.
func readFakeSentence(r *bufio.Reader) ([]string, error) {
	var words []string
	for {
		first, err := r.ReadByte()
		if err != nil {
			return nil, err
		}

		length := int(first)
		switch {
		case first&0x80 == 0:
		case first&0xC0 == 0x80:
			next, err := r.ReadByte()
			if err != nil {
				return nil, err
			}
			length = int(first&0x3F)<<8 | int(next)
		default:
			return nil, fmt.Errorf("word too long for the fake router")
		}

		if length == 0 {
			return words, nil
		}
		word := make([]byte, length)
		if _, err := io.ReadFull(r, word); err != nil {
			return nil, err
		}
		words = append(words, string(word))
	}
}
