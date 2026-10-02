package handler

import (
	"errors"
	"fmt"
	"reflect"
	"testing"

	"nasnet-panel/pkg/routeros"
)

type fakeWireGuardLookup struct {
	interfaces []routeros.WireGuardInfo
	addresses  map[string][]routeros.IPAddressInfo
	listErr    error
	addrErr    error
	addrCalls  []string
}

func (f *fakeWireGuardLookup) ListWireGuards() ([]routeros.WireGuardInfo, error) {
	return f.interfaces, f.listErr
}

func (f *fakeWireGuardLookup) GetIPAddressesByInterface(ifName string) ([]routeros.IPAddressInfo, error) {
	f.addrCalls = append(f.addrCalls, ifName)
	if f.addrErr != nil {
		return nil, f.addrErr
	}
	return f.addresses[ifName], nil
}

func TestFindWireGuardInterfaceByKeyAndAddress(t *testing.T) {
	lookup := func() *fakeWireGuardLookup {
		return &fakeWireGuardLookup{
			interfaces: []routeros.WireGuardInfo{
				{ID: "*1", Name: "other-wg-client", PrivateKey: "key-b"},
				{ID: "*2", Name: "same-key-other-ip-wg-client", PrivateKey: "key-a"},
				{ID: "*3", Name: "anais-spiegel-wg-client", PrivateKey: "key-a"},
			},
			addresses: map[string][]routeros.IPAddressInfo{
				"other-wg-client":             {{Address: "10.71.139.103/32"}},
				"same-key-other-ip-wg-client": {{Address: "10.0.0.2/32"}},
				"anais-spiegel-wg-client":     {{Address: "10.9.9.9/32"}, {Address: "10.71.139.103/32"}},
			},
		}
	}

	t.Run("matches only on both private key and address", func(t *testing.T) {
		f := lookup()
		got, err := findWireGuardInterfaceByKeyAndAddress(f, "key-a", "10.71.139.103/32")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got == nil || got.ID != "*3" {
			t.Fatalf("got %+v, want interface *3", got)
		}
		if want := []string{"same-key-other-ip-wg-client", "anais-spiegel-wg-client"}; !reflect.DeepEqual(f.addrCalls, want) {
			t.Errorf("addresses looked up for %v, want only same-key interfaces %v", f.addrCalls, want)
		}
	})

	t.Run("no match when the address differs", func(t *testing.T) {
		got, err := findWireGuardInterfaceByKeyAndAddress(lookup(), "key-b", "10.0.0.2/32")
		if err != nil || got != nil {
			t.Fatalf("got %+v, %v; want nil, nil", got, err)
		}
	})

	t.Run("no lookup when key or address is empty", func(t *testing.T) {
		for _, tc := range []struct{ key, addr string }{{"", "10.71.139.103/32"}, {"key-a", ""}} {
			f := lookup()
			f.listErr = errors.New("must not be called")
			got, err := findWireGuardInterfaceByKeyAndAddress(f, tc.key, tc.addr)
			if err != nil || got != nil {
				t.Errorf("key=%q addr=%q: got %+v, %v; want nil, nil", tc.key, tc.addr, got, err)
			}
		}
	})

	t.Run("propagates list errors", func(t *testing.T) {
		f := lookup()
		f.listErr = errors.New("boom")
		if _, err := findWireGuardInterfaceByKeyAndAddress(f, "key-a", "10.71.139.103/32"); !errors.Is(err, f.listErr) {
			t.Fatalf("got %v, want wrapped list error", err)
		}
	})

	t.Run("propagates address errors", func(t *testing.T) {
		f := lookup()
		f.addrErr = errors.New("boom")
		if _, err := findWireGuardInterfaceByKeyAndAddress(f, "key-a", "10.71.139.103/32"); !errors.Is(err, f.addrErr) {
			t.Fatalf("got %v, want wrapped address error", err)
		}
	})
}

func TestWireGuardPeerPlanner(t *testing.T) {
	t.Run("new interface numbers peers from 1 and reports nulls when nothing was skipped", func(t *testing.T) {
		p := newWireGuardPeerPlanner("swift-fox-wg-client", nil)
		if p.SkipIfDuplicate("pub-1") {
			t.Fatal("pub-1 reported as duplicate on an empty interface")
		}
		name := p.NextName()
		if name != "swift-fox-wg-client-peer1" {
			t.Fatalf("NextName = %q, want swift-fox-wg-client-peer1", name)
		}
		p.Added(name, "pub-1")

		got := p.Result(false)
		want := WireGuardPeerImportResult{
			PeerNames:         []string{"swift-fox-wg-client-peer1"},
			ImportedPeerCount: 1,
		}
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("Result = %+v, want %+v", got, want)
		}
		if got.SkippedDuplicatePeers != nil {
			t.Errorf("SkippedDuplicatePeers = %#v, want nil", got.SkippedDuplicatePeers)
		}
	})

	t.Run("reused interface skips existing keys and avoids taken names", func(t *testing.T) {
		existing := []routeros.WireGuardPeerInfo{
			{Name: "wg-peer1", PublicKey: "pub-1"},
			{Name: "wg-peer3", PublicKey: "pub-3"},
		}
		p := newWireGuardPeerPlanner("wg", existing)

		for _, key := range []string{"pub-1", "pub-new", "pub-3", "pub-new"} {
			if p.SkipIfDuplicate(key) {
				continue
			}
			p.Added(p.NextName(), key)
		}

		got := p.Result(true)
		want := WireGuardPeerImportResult{
			// Index starts at len(existing)+1 = 3, which is taken, so 4 is used.
			PeerNames:               []string{"wg-peer4"},
			ImportedPeerCount:       1,
			ReusedExistingInterface: true,
			// The second "pub-new" is skipped because the first one was just added.
			SkippedDuplicatePeers: []string{"pub-1", "pub-3", "pub-new"},
		}
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("Result = %+v, want %+v", got, want)
		}
	})

	t.Run("every peer already present imports nothing", func(t *testing.T) {
		p := newWireGuardPeerPlanner("wg", []routeros.WireGuardPeerInfo{{Name: "wg-peer1", PublicKey: "pub-1"}})
		if !p.SkipIfDuplicate("pub-1") {
			t.Fatal("pub-1 not reported as duplicate")
		}
		got := p.Result(true)
		if got.ImportedPeerCount != 0 || got.PeerNames != nil || !reflect.DeepEqual(got.SkippedDuplicatePeers, []string{"pub-1"}) {
			t.Fatalf("Result = %+v", got)
		}
	})
}

type fakeInterfaceLists struct {
	members  map[string]bool
	checkErr map[string]error
	added    []string
}

func (f *fakeInterfaceLists) InterfaceListMemberExists(list, iface string) (bool, error) {
	if err := f.checkErr[list]; err != nil {
		return false, err
	}
	return f.members[list+"/"+iface], nil
}

func (f *fakeInterfaceLists) AddInterfaceListMember(list, iface string) (string, error) {
	f.added = append(f.added, list+"/"+iface)
	return "*1", nil
}

func TestEnsureWireGuardClientOnWanLists(t *testing.T) {
	f := &fakeInterfaceLists{
		members:  map[string]bool{"WAN/wg": true},
		checkErr: map[string]error{},
	}
	var logs []string
	logf := func(format string, args ...interface{}) { logs = append(logs, fmt.Sprintf(format, args...)) }

	ensureWireGuardClientOnWanLists(f, "wg", logf)
	if want := []string{"VPN-WAN/wg"}; !reflect.DeepEqual(f.added, want) {
		t.Fatalf("added %v, want %v", f.added, want)
	}

	f = &fakeInterfaceLists{checkErr: map[string]error{"WAN": errors.New("boom")}}
	ensureWireGuardClientOnWanLists(f, "wg", logf)
	if want := []string{"VPN-WAN/wg"}; !reflect.DeepEqual(f.added, want) {
		t.Fatalf("added %v, want %v after a WAN check error", f.added, want)
	}
	if len(logs) != 1 {
		t.Fatalf("logged %v, want one entry for the failed check", logs)
	}
}
