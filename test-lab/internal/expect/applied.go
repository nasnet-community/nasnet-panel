package expect

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"nasnet-panel/test-lab/internal/env"
	"nasnet-panel/test-lab/internal/scenario"
)

type sectionProbe struct {
	path    string
	where   map[string]string
	minimum int
}

var appliedCatalog = map[string]sectionProbe{
	"bridges":         {"/interface/bridge", map[string]string{"name": "LANBridgeForeign"}, 1},
	"interface-lists": {"/interface/list", map[string]string{"name": "Split-LAN"}, 1},
	"macvlans":        {"/interface/macvlan", nil, 1},
	"addresses":       {"/ip/address", map[string]string{"comment": "Foreign"}, 1},
	"dhcp-servers":    {"/ip/dhcp-server", map[string]string{"name": "DHCP-Foreign"}, 1},
	"dhcp-networks":   {"/ip/dhcp-server/network", map[string]string{"comment": "Foreign"}, 1},
	"pools":           {"/ip/pool", map[string]string{"name": "DHCP-pool-Foreign"}, 1},
	"dns":             {"/ip/dns/forwarders", nil, 3},
	"dns-static":      {"/ip/dns/static", nil, 1},
	"routing-tables":  {"/routing/table", map[string]string{"name": "to-Foreign"}, 1},
	"routing-rules":   {"/routing/rule", nil, 4},
	"routes":          {"/ip/route", map[string]string{"comment": "Route-to-Foreign-Foreign Link"}, 1},
	"blackholes":      {"/ip/route", map[string]string{"comment": "Blackhole"}, 3},
	"firewall-filter": {"/ip/firewall/filter", nil, 1},
	"nat":             {"/ip/firewall/nat", map[string]string{"action": "masquerade"}, 1},
	"mangle":          {"/ip/firewall/mangle", nil, 5},
	"address-lists":   {"/ip/firewall/address-list", map[string]string{"list": "LOCAL-IP"}, 3},
	"netwatch":        {"/tool/netwatch", nil, 1},
	"scripts":         {"/system/script", map[string]string{"name": "DomesticIPUpdate"}, 1},
	"schedulers":      {"/system/scheduler", map[string]string{"name": "DomesticIPUpdate"}, 1},
	"ppp-profiles":    {"/ppp/profile", map[string]string{"name": "VPN-VPN"}, 1},
	"marker":          {"/file", map[string]string{"name": "nasnet-panel-wizard-success.txt"}, 1},
}

func AppliedSectionNames() []string {
	names := make([]string, 0, len(appliedCatalog))
	for name := range appliedCatalog {
		names = append(names, name)
	}
	return names
}

func Applied(t *testing.T, lab *env.Env, a scenario.Applied, inherited string) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	var missing, unknown []string
	for _, name := range a.Sections {
		probe, ok := appliedCatalog[name]
		if !ok {
			unknown = append(unknown, name)
			continue
		}
		rows, err := lab.Router.PrintWhere(ctx, probe.path, probe.where)
		if err != nil || len(rows) < probe.minimum {
			missing = append(missing, name)
		}
	}
	if len(unknown) > 0 {
		t.Errorf("applied: unknown sections %s", strings.Join(unknown, ", "))
	}

	var err error
	if len(a.ExpectMissing) > 0 {
		err = expectMissing(ctx, lab, missing, a.ExpectMissing)
		Report(t, "applied report names the missing sections", bug(a.KnownBug, inherited), err)
		return
	}
	if len(missing) > 0 {
		err = fmt.Errorf("sections not applied: %s. %s", strings.Join(missing, ", "), diagnose(ctx, lab))
	}
	Report(t, "applied sections", bug(a.KnownBug, inherited), err)
}

func diagnose(ctx context.Context, lab *env.Env) string {
	var parts []string

	if rows, err := lab.Router.Print(ctx, "/system/script/environment", "?name=WizardProgress"); err == nil && len(rows) > 0 {
		parts = append(parts, "wizard stopped at progress "+rows[0]["value"])
	} else {
		parts = append(parts, "no WizardProgress variable")
	}

	if rows, err := lab.Router.Print(ctx, "/file", "?name=nasnet-panel-wizard-success.txt"); err == nil && len(rows) == 0 {
		parts = append(parts, "success marker absent")
	}

	if rows, err := lab.Router.Print(ctx, "/log"); err == nil {
		var errs []string
		for _, row := range rows {
			msg := strings.ToLower(row["message"])
			if strings.Contains(row["topics"], "error") || strings.Contains(msg, "failure") || strings.Contains(msg, "syntax error") || strings.Contains(msg, "script error") {
				errs = append(errs, row["message"])
			}
		}
		if len(errs) > 5 {
			errs = errs[len(errs)-5:]
		}
		if len(errs) > 0 {
			parts = append(parts, "router log errors: "+strings.Join(errs, " | "))
		}
	}
	return strings.Join(parts, ", ")
}

func expectMissing(ctx context.Context, lab *env.Env, missing, want []string) error {
	have := map[string]bool{}
	for _, name := range missing {
		have[name] = true
	}
	var notMissing []string
	for _, name := range want {
		if !have[name] {
			notMissing = append(notMissing, name)
		}
	}
	if len(notMissing) > 0 {
		return fmt.Errorf("sections %s were applied, want them missing", strings.Join(notMissing, ", "))
	}
	diagnosis := diagnose(ctx, lab)
	if !strings.Contains(diagnosis, "progress") {
		return fmt.Errorf("report does not say where the wizard stopped: %s", diagnosis)
	}
	return nil
}
