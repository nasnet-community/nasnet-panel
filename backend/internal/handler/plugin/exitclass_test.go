package plugin

import (
	"slices"
	"strings"
	"testing"
)

// wizardTables are the routing tables the wizard makes on a router with both links.
var wizardTables = []string{"to-Split", "to-Domestic", "to-Domestic-Domestic Link", "to-Foreign", "to-VPN", "to-Foreign-Foreign Link"}

// Armin's table, as the wizard script writes it, on a router with both links.
var wantExitClassRSC = []string{
	`add action=lookup-only-in-table comment="Exit-Class-Local" disabled=no src-address=192.168.150.0/24 dst-address=10.0.0.0/8 table="main"`,
	`add action=lookup-only-in-table comment="Exit-Class-Local" disabled=no src-address=192.168.150.0/24 dst-address=172.16.0.0/12 table="main"`,
	`add action=lookup-only-in-table comment="Exit-Class-Local" disabled=no src-address=192.168.150.0/24 dst-address=192.168.0.0/16 table="main"`,
	`add action=lookup-only-in-table comment="Exit-Class-Domestic-Failover" disabled=no src-address=192.168.150.0/28 table="to-Domestic"`,
	`add action=lookup-only-in-table comment="Exit-Class-Domestic-1" disabled=no src-address=192.168.150.16/28 table="to-Domestic-Domestic Link"`,
	`add action=drop comment="Exit-Class-Domestic-2" disabled=no src-address=192.168.150.32/28`,
	`add action=drop comment="Exit-Class-Domestic-3" disabled=no src-address=192.168.150.48/28`,
	`add action=drop comment="Exit-Class-Domestic-4" disabled=no src-address=192.168.150.64/28`,
	`add action=lookup-only-in-table comment="Exit-Class-Foreign-Failover" disabled=no src-address=192.168.150.80/28 table="to-Foreign"`,
	`add action=lookup-only-in-table comment="Exit-Class-Foreign-1" disabled=no src-address=192.168.150.96/28 table="to-Foreign-Foreign Link"`,
	`add action=drop comment="Exit-Class-Foreign-2" disabled=no src-address=192.168.150.112/28`,
	`add action=drop comment="Exit-Class-Foreign-3" disabled=no src-address=192.168.150.128/28`,
	`add action=drop comment="Exit-Class-Foreign-4" disabled=no src-address=192.168.150.144/28`,
	`add action=lookup-only-in-table comment="Exit-Class-VPN-Failover" disabled=no src-address=192.168.150.160/28 table="to-VPN"`,
	`add action=lookup-only-in-table comment="Exit-Class-VPN-Primary" disabled=no src-address=192.168.150.176/28 table="to-VPN"`,
	`add action=drop comment="Exit-Class-VPN-Backup-1" disabled=no src-address=192.168.150.192/28`,
	`add action=drop comment="Exit-Class-VPN-Backup-2" disabled=no src-address=192.168.150.208/28`,
	`add action=drop comment="Exit-Class-None" disabled=no src-address=192.168.150.0/24`,
}

func rulesRSC(rules []exitClassRule) []string {
	lines := make([]string, len(rules))
	for i, rule := range rules {
		lines[i] = rule.rsc()
	}
	return lines
}

func hasTables(names ...string) func(string) bool {
	return func(table string) bool { return table == "main" || slices.Contains(names, table) }
}

func TestExitClassRulesFollowArminsTable(t *testing.T) {
	if got := rulesRSC(exitClassRules(hasTables(wizardTables...))); !slices.Equal(got, wantExitClassRSC) {
		t.Fatalf("rules\n got  %q\n want %q", got, wantExitClassRSC)
	}
}

func TestExitClassesWithoutADomesticLinkDrop(t *testing.T) {
	got := rulesRSC(exitClassRules(hasTables("to-Foreign", "to-VPN", "to-Foreign-Foreign Link")))
	want := append([]string{}, wantExitClassRSC...)
	want[3] = `add action=drop comment="Exit-Class-Domestic-Failover" disabled=no src-address=192.168.150.0/28`
	want[4] = `add action=drop comment="Exit-Class-Domestic-1" disabled=no src-address=192.168.150.16/28`
	if !slices.Equal(got, want) {
		t.Fatalf("rules\n got  %q\n want %q", got, want)
	}
}

func TestExitClassesCoverTheNetworkWithoutOverlap(t *testing.T) {
	seen := map[int]string{}
	for _, class := range exitClasses {
		if class.Src.Bits() != 28 || !exitClassNetwork.Contains(class.Src.Addr()) {
			t.Errorf("%s: %s is not a /28 of %s", class.Name, class.Src, exitClassNetwork)
		}
		first := int(class.Src.Addr().As4()[3])
		for host := first; host < first+16; host++ {
			if other, dup := seen[host]; dup {
				t.Errorf(".%d is in %s and %s", host, other, class.Name)
			}
			seen[host] = class.Name
		}
	}
	// .0 to .223, back to back; what's past them meets Exit-Class-None.
	if len(seen) != 224 {
		t.Errorf("the classes cover %d addresses, want 224", len(seen))
	}
}

func TestManifestExitClassAddresses(t *testing.T) {
	accepted := []string{
		`["192.168.50.16/24", "192.168.150.1/24", "192.168.150.80/24", "192.168.150.160/24"]`,
		`["192.168.50.20/24", "192.168.150.17/24", "192.168.150.97/24"]`,
		`"192.168.150.223/24"`,
	}
	for _, address := range accepted {
		if err := manifestWith(t, address, "").validate(); err != nil {
			t.Errorf("%s: %v", address, err)
		}
	}

	for _, tc := range []struct{ address, want string }{
		{`"192.168.150.1/28"`, "write 192.168.150.1/28 as 192.168.150.1/24"},
		{`"192.168.150.0/24"`, "the network's own address"},
		{`"192.168.150.254/24"`, "the router's"},
		{`["192.168.50.16/24", "192.168.150.230/24"]`, "192.168.150.230 is in no exit class"},
	} {
		err := manifestWith(t, tc.address, "").validate()
		if err == nil || !strings.Contains(err.Error(), tc.want) || !strings.Contains(err.Error(), "container.interface.address") {
			t.Errorf("%s: err = %v, want one saying %q", tc.address, err, tc.want)
		}
	}
}

func TestAddressesUseExitClasses(t *testing.T) {
	for _, tc := range []struct {
		addresses Addresses
		want      bool
	}{
		{Addresses{"192.168.50.13/24", "192.168.50.14/24"}, false},
		{Addresses{"192.168.50.16/24", "192.168.150.80/24"}, true},
		{nil, false},
	} {
		if got := tc.addresses.usesExitClasses(); got != tc.want {
			t.Errorf("%v: %v, want %v", tc.addresses, got, tc.want)
		}
	}
}
