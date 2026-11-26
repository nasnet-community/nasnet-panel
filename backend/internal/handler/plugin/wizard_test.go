package plugin

import (
	"slices"
	"strings"
	"testing"
)

func TestExitClassesScript(t *testing.T) {
	gateway := `:if ([:len [/interface bridge find where name="containers"]] > 0 && [:len [/ip address find where address="192.168.150.254/24" interface="containers"]] = 0) do={ /ip address add address="192.168.150.254/24" interface="containers" comment="Exit-Class-Gateway" }`
	for _, tc := range []struct {
		domestic bool
		tables   []string
	}{
		{true, wizardTables},
		{false, []string{"to-Foreign", "to-VPN", "to-Foreign-Foreign Link"}},
	} {
		lines := strings.Split(strings.TrimSuffix(ExitClassesScript(tc.domestic), "\n"), "\n")
		want := append([]string{gateway, "/routing rule"}, rulesRSC(exitClassRules(hasTables(tc.tables...)))...)
		if !slices.Equal(lines, want) {
			t.Errorf("domestic=%v:\n got  %q\n want %q", tc.domestic, lines, want)
		}
	}
}
