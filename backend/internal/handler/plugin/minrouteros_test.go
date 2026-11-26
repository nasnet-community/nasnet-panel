package plugin

import (
	"strings"
	"testing"
)

func TestCheckMinRouterOS(t *testing.T) {
	for _, tc := range []struct {
		name, min, router string
		refused           string // part of the message, or "" when the router is new enough
	}{
		{name: "a release behind", min: "7.11", router: "7.9.2 (stable)", refused: "7.11 or newer and the router runs 7.9.2"},
		{name: "numbers, not text, are compared", min: "7.11", router: "7.10.2 (stable)", refused: "router runs 7.10.2"},
		{name: "a release candidate is not the release", min: "7.12", router: "7.12rc1 (testing)", refused: "router runs 7.12rc1"},
		{name: "a beta is not a release candidate", min: "7.12rc1", router: "7.12beta3 (testing)", refused: "router runs 7.12beta3"},
		{name: "a router that cannot say", min: "7.11", router: "banana", refused: "can't tell which RouterOS the router runs"},
		{name: "a router that says nothing", min: "7.11", router: "", refused: "can't tell which RouterOS the router runs"},
		{name: "exactly the floor", min: "7.11", router: "7.11 (stable)"},
		{name: "a release past it", min: "7.11", router: "7.24.5 (stable)"},
		{name: "the release of a candidate floor", min: "7.12rc1", router: "7.12 (stable)"},
		{name: "no floor asks nothing of the version", min: "", router: "banana"},
	} {
		err := checkMinRouterOS(tc.min, tc.router)
		switch {
		case tc.refused == "" && err != nil:
			t.Errorf("%s: refused: %v", tc.name, err)
		case tc.refused != "" && (err == nil || !strings.Contains(err.Error(), tc.refused)):
			t.Errorf("%s: err = %v, want one mentioning %q", tc.name, err, tc.refused)
		}
	}
}
