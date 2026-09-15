package expect

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"
	"testing"
	"time"

	"nasnet-panel/test-lab/internal/drive"
	"nasnet-panel/test-lab/internal/env"
	"nasnet-panel/test-lab/internal/scenario"
)

const defaultWithin = 30 * time.Second

func Eventually(ctx context.Context, timeout, interval time.Duration, check func(context.Context) error) error {
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	var last error
	for {
		if last = check(ctx); last == nil {
			return nil
		}
		select {
		case <-ctx.Done():
			return fmt.Errorf("still failing after %s: %w", timeout, last)
		case <-time.After(interval):
		}
	}
}

func Report(t *testing.T, name, knownBug string, err error) {
	t.Helper()
	switch {
	case knownBug == "" && err != nil:
		t.Errorf("%s: %v", name, err)
	case knownBug != "" && err != nil:
		t.Logf("KNOWN BUG %s: %v (%s)", name, err, knownBug)
	case knownBug != "" && err == nil:
		t.Errorf("%s: passes but is marked known_bug %q, remove the marker", name, knownBug)
	}
}

const knownBugWithin = 10 * time.Second

func bugWithin(within time.Duration, knownBug string) time.Duration {
	if knownBug != "" && within > knownBugWithin {
		return knownBugWithin
	}
	return within
}

func bug(own, inherited string) string {
	if own != "" {
		return own
	}
	return inherited
}

func All(t *testing.T, lab *env.Env, e *scenario.Expect, inherited string) {
	t.Helper()
	if e == nil {
		return
	}
	Sections(t, lab.Router, e.Sections, inherited)
	for _, v := range e.Values {
		Value(t, lab.Router, v, inherited)
	}
	for _, tr := range e.Traffic {
		Traffic(t, lab, tr, inherited)
	}
	for _, d := range e.DNS {
		DNS(t, lab, d, inherited)
	}
	if e.Leak != nil {
		Leak(t, lab, *e.Leak, inherited)
	}
	for _, p := range e.Ports {
		Port(t, lab, p, inherited)
	}
	if e.Files != nil {
		Files(t, lab, *e.Files, inherited)
	}
	for _, c := range e.Container {
		Container(t, lab, c, inherited)
	}
	for _, tun := range e.Tunnels {
		Tunnel(t, lab, tun, inherited)
	}
	for _, d := range e.DHCP {
		DHCP(t, lab, d, inherited)
	}
	if e.Applied != nil {
		Applied(t, lab, *e.Applied, inherited)
	}
	if e.Panel != nil {
		Panel(t, lab, *e.Panel, inherited)
	}
	for _, p := range e.Plugins {
		Plugin(t, lab, p, inherited)
	}
}

func Sections(t *testing.T, r *drive.Router, sections []scenario.Section, inherited string) {
	t.Helper()
	for _, s := range sections {
		ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
		rows, err := r.Print(ctx, s.Path)
		cancel()
		if err == nil {
			have := make(map[string]bool, len(rows))
			for _, row := range rows {
				have[row[s.Key]] = true
			}
			var problems []string
			for _, v := range s.Present {
				if !have[v] {
					problems = append(problems, fmt.Sprintf("missing %s %q", s.Key, v))
				}
			}
			for _, v := range s.Absent {
				if have[v] {
					problems = append(problems, fmt.Sprintf("unexpected %s %q", s.Key, v))
				}
			}
			if len(problems) > 0 {
				err = fmt.Errorf("%s", strings.Join(problems, ", "))
			}
		}
		Report(t, "section "+s.Path, bug(s.KnownBug, inherited), err)
	}
}

func Value(t *testing.T, r *drive.Router, v scenario.Value, inherited string) {
	t.Helper()
	name := fmt.Sprintf("value %s %v", v.Path, v.Where)
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	rows, err := r.PrintWhere(ctx, v.Path, v.Where)
	if err == nil {
		err = matchRows(rows, v)
	}
	Report(t, name, bug(v.KnownBug, inherited), err)
}

func matchRows(rows []map[string]string, v scenario.Value) error {
	switch {
	case v.Absent && len(rows) > 0:
		return fmt.Errorf("expected no entries, found %d", len(rows))
	case v.Absent:
		return nil
	case v.Count != nil && len(rows) != *v.Count:
		return fmt.Errorf("found %d entries, want %d", len(rows), *v.Count)
	case len(rows) == 0 && v.Count == nil:
		return fmt.Errorf("no matching entries")
	}
	for _, row := range rows {
		for key, want := range v.Fields {
			if !MatchValue(row[key], want) {
				return fmt.Errorf("%s is %q, want %q", key, row[key], want)
			}
		}
	}
	return nil
}

func MatchValue(got, want string) bool {
	switch {
	case want == "!empty":
		return got != ""
	case strings.HasPrefix(want, "~"):
		return strings.Contains(got, want[1:])
	case strings.HasPrefix(want, "!~"):
		return !strings.Contains(got, want[2:])
	case strings.HasPrefix(want, "!"):
		return got != want[1:]
	case want == "yes" || want == "true":
		return got == "yes" || got == "true"
	case want == "no" || want == "false":
		return got == "no" || got == "false" || got == ""
	}
	return got == want
}

func Traffic(t *testing.T, lab *env.Env, tr scenario.Traffic, inherited string) {
	t.Helper()
	name := fmt.Sprintf("traffic from %s to %s exits %s", tr.From, tr.To, tr.Exits)
	url, ok := env.HostURLs[tr.To]
	if !ok {
		t.Errorf("%s: unknown destination %q", name, tr.To)
		return
	}
	if tr.Exits != "blocked" && !env.KnownExit(tr.Exits) {
		t.Errorf("%s: unknown link %q", name, tr.Exits)
		return
	}

	fetch := func(ctx context.Context) (string, error) {
		if tr.From == "router" {
			return lab.Router.Fetch(ctx, url)
		}
		return lab.Probe.Fetch(ctx, tr.From, url)
	}
	within := bugWithin(scenario.Duration(tr.Within, defaultWithin), bug(tr.KnownBug, inherited))

	var err error
	if tr.Exits == "blocked" {
		err = Eventually(context.Background(), within, 2*time.Second, func(ctx context.Context) error {
			got, ferr := fetch(ctx)
			if ferr == nil {
				return fmt.Errorf("reachable, exited via %s (%s)", env.ExitName(strings.TrimSpace(got)), strings.TrimSpace(got))
			}
			return nil
		})
		if err == nil {
			err = holdFailing(10*time.Second, func(ctx context.Context) error {
				got, ferr := fetch(ctx)
				if ferr == nil {
					return fmt.Errorf("became reachable via %s", env.ExitName(strings.TrimSpace(got)))
				}
				return nil
			})
		}
	} else {
		err = Eventually(context.Background(), within, 2*time.Second, func(ctx context.Context) error {
			got, ferr := fetch(ctx)
			if ferr != nil {
				return ferr
			}
			got = strings.TrimSpace(got)
			if env.ExitName(got) != tr.Exits {
				return fmt.Errorf("exited via %s (%s), want %s", env.ExitName(got), got, tr.Exits)
			}
			return nil
		})
	}
	Report(t, name, bug(tr.KnownBug, inherited), err)
}

func holdFailing(d time.Duration, check func(context.Context) error) error {
	deadline := time.Now().Add(d)
	for time.Now().Before(deadline) {
		ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
		err := check(ctx)
		cancel()
		if err != nil {
			return err
		}
		time.Sleep(2 * time.Second)
	}
	return nil
}

func DNS(t *testing.T, lab *env.Env, d scenario.DNS, inherited string) {
	t.Helper()
	name := fmt.Sprintf("dns %s from %s resolver %s exits %s", d.Name, d.From, d.Resolver, d.Exits)
	within := bugWithin(scenario.Duration(d.Within, defaultWithin), bug(d.KnownBug, inherited))

	err := Eventually(context.Background(), within, 3*time.Second, func(ctx context.Context) error {
		query := randomLabel() + "." + strings.TrimPrefix(d.Name, "*.")
		server := env.RouterAddress
		if d.Server != "" {
			addr, ok := env.Address(d.Server)
			if !ok {
				return fmt.Errorf("unknown dns server %q", d.Server)
			}
			server = addr
		}
		answers, rerr := lab.Probe.Resolve(ctx, d.From, server, "TXT", query)
		if d.Exits == "blocked" {
			if rerr == nil {
				return fmt.Errorf("resolved %q: %v", query, answers)
			}
			return nil
		}
		if rerr != nil {
			return rerr
		}
		resolver, src := parseTXT(answers)
		if d.Resolver != "" && !MatchValue(env.ResolverRoles[resolver], d.Resolver) {
			return fmt.Errorf("answered by %s (%s), want %s", env.ResolverRoles[resolver], resolver, d.Resolver)
		}
		if d.Exits != "" && env.ExitName(src) != d.Exits {
			return fmt.Errorf("query left via %s (%s), want %s", env.ExitName(src), src, d.Exits)
		}
		return nil
	})
	Report(t, name, bug(d.KnownBug, inherited), err)
}

func parseTXT(answers []string) (string, string) {
	var resolver, src string
	for _, answer := range answers {
		for _, field := range strings.Fields(answer) {
			if v, ok := strings.CutPrefix(field, "resolver="); ok {
				resolver = v
			}
			if v, ok := strings.CutPrefix(field, "src="); ok {
				src = v
			}
		}
	}
	return resolver, src
}

func randomLabel() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return "q" + hex.EncodeToString(b)
}

func Leak(t *testing.T, lab *env.Env, l scenario.Leak, inherited string) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	counters, err := lab.Counters(ctx)
	starlinkToDomestic, domesticToForeign := env.LeakCounterNames()
	if l.StarlinkToDomestic {
		var cerr error
		if err != nil {
			cerr = err
		} else if n := counters[starlinkToDomestic]; n > 0 {
			cerr = fmt.Errorf("%d packets from the Starlink IP reached domestic destinations", n)
		}
		Report(t, "leak starlink to domestic", bug(l.KnownBug, inherited), cerr)
	}
	if l.DomesticToForeign {
		var cerr error
		if err != nil {
			cerr = err
		} else if n := counters[domesticToForeign]; n > 0 {
			cerr = fmt.Errorf("%d packets over the domestic link reached foreign destinations", n)
		}
		Report(t, "leak domestic to foreign", bug(l.KnownBug, inherited), cerr)
	}
}

func Port(t *testing.T, lab *env.Env, p scenario.Port, inherited string) {
	t.Helper()
	state := "closed"
	if p.Open {
		state = "open"
	}
	name := fmt.Sprintf("port %d from %s is %s", p.Port, p.From, state)

	target := env.RouterAddress
	switch p.From {
	case "starlink-side", "domestic-side":
		addr, err := lab.RouterWANAddress(strings.TrimSuffix(p.From, "-side"))
		if err != nil {
			Report(t, name, bug(p.KnownBug, inherited), err)
			return
		}
		target = addr
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	dialErr := lab.Probe.Dial(ctx, p.From, target+":"+strconv.Itoa(p.Port))

	var err error
	switch {
	case p.Open && dialErr != nil:
		err = fmt.Errorf("closed: %v", dialErr)
	case !p.Open && dialErr == nil:
		err = fmt.Errorf("open on %s", target)
	}
	Report(t, name, bug(p.KnownBug, inherited), err)
}

func Files(t *testing.T, lab *env.Env, f scenario.Files, inherited string) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	rows, err := lab.Router.Run(ctx, "/file/print", "=.proplist=name,size,contents")
	if err != nil {
		Report(t, "files", bug(f.KnownBug, inherited), err)
		return
	}

	has := func(name string) bool {
		for _, row := range rows {
			if row["name"] == name || strings.HasSuffix(row["name"], "/"+name) {
				return true
			}
		}
		return false
	}

	var problems []string
	for _, name := range f.Present {
		if !has(name) {
			problems = append(problems, "missing "+name)
		}
	}
	for _, name := range f.Absent {
		if has(name) {
			problems = append(problems, "unexpected "+name)
		}
	}
	if f.NoSecrets {
		for _, row := range rows {
			if strings.Contains(row["contents"], lab.Password()) {
				problems = append(problems, row["name"]+" contains the router password")
			}
		}
	}

	if len(problems) > 0 {
		err = fmt.Errorf("%s", strings.Join(problems, ", "))
	}
	Report(t, "files", bug(f.KnownBug, inherited), err)
}

func Container(t *testing.T, lab *env.Env, c scenario.Container, inherited string) {
	t.Helper()
	name := "container " + c.Name
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	rows, err := lab.Router.Print(ctx, "/container", "?name="+c.Name)
	if err == nil {
		err = matchContainer(rows, c)
	}
	Report(t, name, bug(c.KnownBug, inherited), err)
}

func matchContainer(rows []map[string]string, c scenario.Container) error {
	present := len(rows) > 0
	if c.Present != nil && *c.Present != present {
		return fmt.Errorf("present is %t, want %t", present, *c.Present)
	}
	if !present {
		if c.Running != nil || len(c.Fields) > 0 {
			return fmt.Errorf("not present")
		}
		return nil
	}
	row := rows[0]
	if c.Running != nil {
		running := row["status"] == "running" || row["running"] == "true"
		if running != *c.Running {
			return fmt.Errorf("running is %t (status %q), want %t", running, row["status"], *c.Running)
		}
	}
	for key, want := range c.Fields {
		if !MatchValue(row[key], want) {
			return fmt.Errorf("%s is %q, want %q", key, row[key], want)
		}
	}
	return nil
}

func Tunnel(t *testing.T, lab *env.Env, tun scenario.Tunnel, inherited string) {
	t.Helper()
	name := fmt.Sprintf("tunnel %s up %t", tun.Type, tun.Up)
	within := bugWithin(scenario.Duration(tun.Within, 90*time.Second), bug(tun.KnownBug, inherited))

	err := Eventually(context.Background(), within, 5*time.Second, func(ctx context.Context) error {
		up, err := tunnelUp(ctx, lab, tun.Type)
		if err != nil {
			return err
		}
		if up != tun.Up {
			return fmt.Errorf("tunnel up is %t", up)
		}
		return nil
	})
	Report(t, name, bug(tun.KnownBug, inherited), err)
}

func tunnelUp(ctx context.Context, lab *env.Env, kind string) (bool, error) {
	switch kind {
	case "wireguard":
		rows, err := lab.Router.Print(ctx, "/interface/wireguard/peers")
		if err != nil {
			return false, err
		}
		for _, row := range rows {
			if hs := row["last-handshake"]; hs != "" && hs != "never" && handshakeRecent(hs) {
				return true, nil
			}
		}
		return false, nil
	case "l2tp":
		rows, err := lab.Router.Print(ctx, "/interface/l2tp-client")
		if err != nil {
			return false, err
		}
		for _, row := range rows {
			if row["running"] == "true" {
				return true, nil
			}
		}
		return false, nil
	}
	return false, fmt.Errorf("unknown tunnel type %q", kind)
}

func handshakeRecent(value string) bool {
	d, err := time.ParseDuration(strings.ReplaceAll(value, "w", "*168h"))
	if err != nil {
		return !strings.ContainsAny(value, "dw")
	}
	return d < 3*time.Minute
}

func DHCP(t *testing.T, lab *env.Env, d scenario.DHCP, inherited string) {
	t.Helper()
	name := "dhcp lease on " + d.From
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()

	offer, err := lab.Probe.DHCP(ctx, d.From)
	switch {
	case d.Lease && err != nil:
	case !d.Lease && err == nil:
		err = fmt.Errorf("got an offer %v, want none", offer)
	case !d.Lease:
		err = nil
	case d.Gateway != "" && offer["router"] != d.Gateway:
		err = fmt.Errorf("gateway %q, want %q", offer["router"], d.Gateway)
	case d.DNS != "" && offer["dns"] != d.DNS:
		err = fmt.Errorf("dns %q, want %q", offer["dns"], d.DNS)
	}
	Report(t, name, bug(d.KnownBug, inherited), err)
}

func Panel(t *testing.T, lab *env.Env, p scenario.PanelCheck, inherited string) {
	t.Helper()
	if !p.Healthy {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	Report(t, "panel healthy", bug(p.KnownBug, inherited), lab.Panel.WaitReady(ctx))
}

func Plugin(t *testing.T, lab *env.Env, p scenario.Plugin, inherited string) {
	t.Helper()
	name := "plugin " + p.ID
	within := bugWithin(scenario.Duration(p.Within, time.Minute), bug(p.KnownBug, inherited))

	err := Eventually(context.Background(), within, 5*time.Second, func(ctx context.Context) error {
		plugins, err := lab.Panel.Plugins(ctx)
		if err != nil {
			return err
		}
		for _, info := range plugins {
			if info.ID != p.ID {
				continue
			}
			if p.Installed != nil && info.Installed != *p.Installed {
				return fmt.Errorf("installed is %t, want %t", info.Installed, *p.Installed)
			}
			if p.Running != nil && info.Running != *p.Running {
				return fmt.Errorf("running is %t (%s), want %t", info.Running, info.Note, *p.Running)
			}
			return nil
		}
		return fmt.Errorf("not in the plugin list")
	})
	Report(t, name, bug(p.KnownBug, inherited), err)
}
