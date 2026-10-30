package handler

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"slices"
	"sort"
	"strings"
	"sync"
	"testing"

	"nasnet-panel/pkg/routeros"

	"github.com/go-routeros/routeros/v3/proto"
)

// fakeRouterOS is an in-memory RouterOS API server for handler tests. It speaks
// just enough of the protocol (login, print with ?=key=value filters, add and
// remove) for a real routeros.Client to run against it, keeps rows per command
// path, and records every command it receives. Any other command is accepted
// and does nothing.
type fakeRouterOS struct {
	listener net.Listener

	mu       sync.Mutex
	tables   map[string][]map[string]string // rows by command path, e.g. "/container"
	commands [][]string
	nextID   int
}

func newFakeRouterOS(t *testing.T) *fakeRouterOS {
	t.Helper()

	listener, err := (&net.ListenConfig{}).Listen(t.Context(), "tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	f := &fakeRouterOS{listener: listener, tables: map[string][]map[string]string{}}
	t.Cleanup(func() { _ = listener.Close() })

	go f.accept()
	return f
}

// client returns a routeros.Client connected to the fake.
func (f *fakeRouterOS) client(t *testing.T) *routeros.Client {
	t.Helper()

	addr, ok := f.listener.Addr().(*net.TCPAddr)
	if !ok {
		t.Fatalf("unexpected listener address %v", f.listener.Addr())
	}
	client, err := routeros.NewClient(routeros.ConnectionConfig{Address: "127.0.0.1", Port: addr.Port, Username: "admin"})
	if err != nil {
		t.Fatalf("connect to fake router: %v", err)
	}
	t.Cleanup(func() { _ = client.Close() })
	return client
}

// seed adds rows under a command path such as "/file", giving each one an .id
// the way RouterOS does.
func (f *fakeRouterOS) seed(path string, rows ...map[string]string) {
	f.mu.Lock()
	defer f.mu.Unlock()

	for _, row := range rows {
		f.nextID++
		row[".id"] = fmt.Sprintf("*%X", f.nextID)
		f.tables[path] = append(f.tables[path], row)
	}
}

// has reports whether path holds a row whose key is value.
func (f *fakeRouterOS) has(path, key, value string) bool {
	f.mu.Lock()
	defer f.mu.Unlock()

	return slices.ContainsFunc(f.tables[path], func(row map[string]string) bool { return row[key] == value })
}

// sent returns the commands received so far for cmd, such as "/file/remove".
func (f *fakeRouterOS) sent(cmd string) [][]string {
	f.mu.Lock()
	defer f.mu.Unlock()

	var matching [][]string
	for _, sentence := range f.commands {
		if sentence[0] == cmd {
			matching = append(matching, sentence)
		}
	}
	return matching
}

func (f *fakeRouterOS) accept() {
	for {
		conn, err := f.listener.Accept()
		if err != nil {
			return
		}
		go f.serve(conn)
	}
}

func (f *fakeRouterOS) serve(conn net.Conn) {
	defer func() { _ = conn.Close() }()

	reader := bufio.NewReader(conn)
	writer := proto.NewWriter(conn)
	for {
		sentence, err := readSentence(reader)
		if err != nil {
			return
		}
		for _, reply := range f.run(sentence) {
			writer.BeginSentence()
			for _, word := range reply {
				writer.WriteWord(word)
			}
			if writer.EndSentence() != nil {
				return
			}
		}
	}
}

// run executes one command and returns the reply sentences to send back.
func (f *fakeRouterOS) run(sentence []string) [][]string {
	done := [][]string{{"!done"}}
	if len(sentence) == 0 || sentence[0] == "/login" {
		return done
	}

	f.mu.Lock()
	defer f.mu.Unlock()
	f.commands = append(f.commands, sentence)

	slash := strings.LastIndex(sentence[0], "/")
	if slash < 0 {
		return [][]string{{"!trap", "=message=bad command"}, {"!done"}}
	}
	path, verb, args := sentence[0][:slash], sentence[0][slash+1:], sentence[1:]

	switch verb {
	case "print":
		var replies [][]string
		for _, row := range f.tables[path] {
			if matchesQuery(row, args) {
				replies = append(replies, append([]string{"!re"}, rowWords(row)...))
			}
		}
		return append(replies, []string{"!done"})
	case "add":
		f.nextID++
		row := map[string]string{".id": fmt.Sprintf("*%X", f.nextID)}
		for key, value := range attributes(args) {
			row[key] = value
		}
		f.tables[path] = append(f.tables[path], row)
		return [][]string{{"!done", "=ret=" + row[".id"]}}
	case "remove":
		if !f.removeRow(path, attributes(args)[".id"]) {
			return [][]string{{"!trap", "=message=no such item"}, {"!done"}}
		}
	}
	return done
}

// removeRow deletes the row with the given .id. Deleting a directory under
// /file takes everything inside it along, as RouterOS does.
func (f *fakeRouterOS) removeRow(path, id string) bool {
	rows := f.tables[path]
	for i, row := range rows {
		if row[".id"] != id {
			continue
		}
		remaining := slices.Concat(rows[:i], rows[i+1:])
		if path == "/file" {
			remaining = slices.DeleteFunc(remaining, func(other map[string]string) bool {
				return strings.HasPrefix(other["name"], row["name"]+"/")
			})
		}
		f.tables[path] = remaining
		return true
	}
	return false
}

// attributes collects the =key=value words of a command.
func attributes(words []string) map[string]string {
	attrs := map[string]string{}
	for _, word := range words {
		if strings.HasPrefix(word, "=") {
			key, value, _ := strings.Cut(word[1:], "=")
			attrs[key] = value
		}
	}
	return attrs
}

// matchesQuery reports whether row satisfies every ?=key=value word in args.
func matchesQuery(row map[string]string, args []string) bool {
	for _, word := range args {
		if !strings.HasPrefix(word, "?") {
			continue
		}
		key, value, _ := strings.Cut(strings.TrimPrefix(word[1:], "="), "=")
		if row[key] != value {
			return false
		}
	}
	return true
}

func rowWords(row map[string]string) []string {
	keys := make([]string, 0, len(row))
	for key := range row {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	words := make([]string, 0, len(keys))
	for _, key := range keys {
		words = append(words, "="+key+"="+row[key])
	}
	return words
}

// readSentence reads words up to the empty word that ends a sentence.
func readSentence(r *bufio.Reader) ([]string, error) {
	var words []string
	for {
		length, err := readLength(r)
		if err != nil {
			return nil, err
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

// readLength decodes the RouterOS word length prefix, which takes one to five
// bytes depending on how big the word is.
func readLength(r *bufio.Reader) (int, error) {
	first, err := r.ReadByte()
	if err != nil {
		return 0, err
	}

	extra, length := 0, int(first)
	switch {
	case first&0x80 == 0:
	case first&0xC0 == 0x80:
		extra, length = 1, int(first&0x3F)
	case first&0xE0 == 0xC0:
		extra, length = 2, int(first&0x1F)
	case first&0xF0 == 0xE0:
		extra, length = 3, int(first&0x0F)
	default:
		extra, length = 4, 0
	}
	for ; extra > 0; extra-- {
		next, err := r.ReadByte()
		if err != nil {
			return 0, err
		}
		length = length<<8 | int(next)
	}
	return length, nil
}
