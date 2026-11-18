package firewall

import (
	"net/netip"
	"testing"
)

func TestFindReservedConflict(t *testing.T) {
	reserved := append([]reservedAddress{}, panelRouteAddresses...)
	reserved = append(reserved, reservedAddress{addr: netip.MustParseAddr("203.0.113.7"), reason: ReservedNetwatch})

	tests := []struct {
		value    string
		conflict string
		reason   ReservedReason
		message  string
	}{
		{"0.0.0.0", "0.0.0.0", ReservedUnspecified, "0.0.0.0 stands for any address"},
		{"0.0.0.0/0", "0.0.0.0", ReservedUnspecified, "0.0.0.0/0 contains 0.0.0.0, which stands for any address"},
		{"0.0.0.0/8", "0.0.0.0", ReservedUnspecified, "0.0.0.0/8 contains 0.0.0.0, which stands for any address"},
		{"1.1.1.1", "1.1.1.1", ReservedPanelRoute, "1.1.1.1 is used in the panel's routes and connectivity checks"},
		{"1.1.1.1/32", "1.1.1.1", ReservedPanelRoute, "1.1.1.1 is used in the panel's routes and connectivity checks"},
		{
			"1.1.0.0/16", "1.1.1.1", ReservedPanelRoute,
			"1.1.0.0/16 contains 1.1.1.1, which the panel uses in its routes and connectivity checks",
		},
		{
			"1.0.0.0/24", "1.0.0.1", ReservedPanelRoute,
			"1.0.0.0/24 contains 1.0.0.1, which the panel uses in its routes and connectivity checks",
		},
		{
			"217.218.0.0/16", "217.218.127.127", ReservedPanelRoute,
			"217.218.0.0/16 contains 217.218.127.127, which the panel uses in its routes and connectivity checks",
		},
		{"203.0.113.7", "203.0.113.7", ReservedNetwatch, "203.0.113.7 is monitored by Netwatch on the router"},
		{
			"203.0.113.0/24", "203.0.113.7", ReservedNetwatch,
			"203.0.113.0/24 contains 203.0.113.7, which Netwatch monitors on the router",
		},
		// A range written with host bits set still covers the whole network.
		{
			"203.0.113.200/24", "203.0.113.7", ReservedNetwatch,
			"203.0.113.200/24 contains 203.0.113.7, which Netwatch monitors on the router",
		},
	}
	for _, tt := range tests {
		got := findReservedConflict(tt.value, reserved)
		if got == nil {
			t.Errorf("%s: no conflict, want %s", tt.value, tt.conflict)
			continue
		}
		if got.conflict.String() != tt.conflict || got.reason != tt.reason {
			t.Errorf("%s: got %s (%s), want %s (%s)", tt.value, got.conflict, got.reason, tt.conflict, tt.reason)
		}
		if msg := got.message(); msg != tt.message {
			t.Errorf("%s: message %q, want %q", tt.value, msg, tt.message)
		}
	}
}

func TestFindReservedConflictAllowsOtherAddresses(t *testing.T) {
	reserved := append([]reservedAddress{}, panelRouteAddresses...)
	reserved = append(reserved, reservedAddress{addr: netip.MustParseAddr("203.0.113.7"), reason: ReservedNetwatch})

	for _, value := range []string{
		"1.1.1.2", "1.1.1.2/31", "1.0.0.2/31", "217.218.127.128/25", "203.0.113.8/29", "5.200.0.0/16", "not-an-ip",
	} {
		if got := findReservedConflict(value, reserved); got != nil {
			t.Errorf("%s: unexpected conflict with %s (%s)", value, got.conflict, got.reason)
		}
	}
}
