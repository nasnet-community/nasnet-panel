package main

import (
	"fmt"
	"os"
	"regexp"
	"strings"

	"nasnet-panel/test-lab/internal/env"
	"nasnet-panel/test-lab/internal/expect"
	"nasnet-panel/test-lab/internal/profile"
	"nasnet-panel/test-lab/internal/runner"
	"nasnet-panel/test-lab/internal/scenario"
)

var (
	roles      = map[string]bool{"starlink": true, "domestic": true, "split": true, "spare": true}
	clients    = map[string]bool{"split": true, "router": true, "mgmt": true, "starlink-side": true, "domestic-side": true, "internet": true}
	spareName  = regexp.MustCompile(`^p[0-9]+$`)
	labNeeds   = map[string]bool{"image-tar": true, "previous-image-tar": true, "internet": true, "wireguard": true, "l2tp": true, "openvpn": true, "cli-install": true, "arm64": true}
	tunnels    = map[string]bool{"wireguard": true, "l2tp": true}
	installers = map[string]bool{"cli": true, "gui": true}
)

type checker struct {
	problems []string
	where    string
}

func (c *checker) fail(format string, args ...any) {
	c.problems = append(c.problems, c.where+": "+fmt.Sprintf(format, args...))
}

func main() {
	c := &checker{}
	names, err := profile.All("profiles")
	if err != nil || len(names) == 0 {
		fmt.Fprintln(os.Stderr, "labcheck: no profiles:", err)
		os.Exit(1)
	}
	known := map[string]bool{}
	for _, name := range names {
		c.where = "profiles/" + name
		p, err := profile.Load("profiles", name)
		if err != nil {
			c.fail("%v", err)
			continue
		}
		known[name] = true
		c.checkProfile(p)
	}

	ids := map[string]string{}
	total := 0
	for _, stage := range []string{"install", "wizard", "resilience"} {
		scenarios, err := scenario.LoadStage("scenarios", stage)
		if err != nil {
			c.where = "scenarios/" + stage
			c.fail("%v", err)
			continue
		}
		for _, sc := range scenarios {
			total++
			c.where = "scenarios/" + stage + "/" + sc.ID
			if prev, ok := ids[sc.ID]; ok {
				c.fail("duplicate id, also in %s", prev)
			}
			ids[sc.ID] = stage
			c.checkScenario(sc, known)
		}
	}

	if len(c.problems) > 0 {
		for _, p := range c.problems {
			fmt.Fprintln(os.Stderr, p)
		}
		os.Exit(1)
	}
	fmt.Printf("labcheck: %d profiles and %d scenarios are valid\n", len(names), total)
}

func (c *checker) checkProfile(p *profile.Profile) {
	if p.Arch != "x86_64" && p.Arch != "arm64" && p.Arch != "arm" {
		c.fail("unknown arch %q", p.Arch)
	}
	if len(p.Ports) == 0 {
		c.fail("no ports")
	}
	if _, _, ok := p.PortByRole("split"); !ok {
		c.fail("no split port")
	}
	seen := map[string]bool{}
	for _, port := range p.Ports {
		if !roles[port.Role] {
			c.fail("port %s has unknown role %q", port.Name, port.Role)
		}
		if port.Role != "spare" && seen[port.Role] {
			c.fail("role %s used twice", port.Role)
		}
		seen[port.Role] = true
	}
}

func (c *checker) checkScenario(sc *scenario.Scenario, known map[string]bool) {
	if sc.Title == "" {
		c.fail("missing title")
	}
	for _, name := range sc.Profiles {
		if name != "all" && !known[name] {
			c.fail("unknown profile %q", name)
		}
	}
	for _, role := range sc.Requires.Roles {
		if !roles[role] {
			c.fail("unknown role %q", role)
		}
	}
	for _, need := range sc.Requires.Lab {
		if !labNeeds[need] {
			c.fail("unknown lab requirement %q", need)
		}
	}
	c.checkWizard(sc.Wizard)
	for i, st := range sc.Steps {
		c.checkStep(i, st)
	}
	c.checkExpect(&sc.Expect)
}

func (c *checker) checkWizard(w *scenario.Wizard) {
	if w == nil {
		return
	}
	for _, role := range []string{w.Foreign, w.Domestic} {
		if role != "" && !roles[role] {
			c.fail("wizard uses unknown role %q", role)
		}
	}
	if w.Timeout != "" && scenario.Duration(w.Timeout, 0) == 0 {
		c.fail("wizard timeout %q is not a duration", w.Timeout)
	}
}

func (c *checker) checkStep(i int, st scenario.Step) {
	required, ok := runner.Actions[st.Do]
	if !ok {
		c.fail("step %d: unknown action %q", i+1, st.Do)
		return
	}
	for _, key := range required {
		if st.With[key] == "" {
			c.fail("step %d %s: missing with.%s", i+1, st.Do, key)
		}
	}
	switch st.Do {
	case "wizard", "wizard_start":
		if st.Wizard == nil {
			c.fail("step %d %s: missing wizard inputs", i+1, st.Do)
		}
		c.checkWizard(st.Wizard)
	case "api":
		if st.API == nil || st.API.Method == "" || st.API.Path == "" {
			c.fail("step %d api: needs method and path", i+1)
		}
	case "filter":
		if _, ok := env.Address(st.With["target"]); !ok {
			c.fail("step %d filter: unknown target %q", i+1, st.With["target"])
		}
	case "vpn_server_down", "vpn_server_up":
		if !tunnels[st.With["type"]] {
			c.fail("step %d %s: unknown type %q", i+1, st.Do, st.With["type"])
		}
	case "install", "uninstall":
		if !installers[st.With["installer"]] {
			c.fail("step %d %s: unknown installer %q", i+1, st.Do, st.With["installer"])
		}
	case "link_down", "link_up":
		if st.With["link"] != "starlink" && st.With["link"] != "domestic" {
			c.fail("step %d %s: unknown link %q", i+1, st.Do, st.With["link"])
		}
	case "sleep", "disconnect_panel":
		if v := st.With["for"]; v != "" && scenario.Duration(v, 0) == 0 {
			c.fail("step %d %s: %q is not a duration", i+1, st.Do, v)
		}
	}
	c.checkExpect(st.Expect)
}

func (c *checker) client(name string) bool {
	return clients[name] || spareName.MatchString(name)
}

func (c *checker) checkExpect(e *scenario.Expect) {
	if e == nil {
		return
	}
	for _, tr := range e.Traffic {
		if _, ok := env.HostURLs[tr.To]; !ok {
			c.fail("traffic to unknown destination %q", tr.To)
		}
		if tr.Exits != "blocked" && !env.KnownExit(tr.Exits) {
			c.fail("traffic exits unknown link %q", tr.Exits)
		}
		if !c.client(tr.From) {
			c.fail("traffic from unknown client %q", tr.From)
		}
		c.duration(tr.Within)
	}
	for _, d := range e.DNS {
		if !c.client(d.From) || d.From == "router" {
			c.fail("dns from unsupported client %q", d.From)
		}
		if d.Server != "" {
			if _, ok := env.Address(d.Server); !ok {
				c.fail("dns server %q is unknown", d.Server)
			}
		}
		if d.Resolver != "" && !knownRole(strings.TrimLeft(d.Resolver, "!~")) {
			c.fail("dns resolver %q is unknown", d.Resolver)
		}
		if d.Exits != "" && d.Exits != "blocked" && !env.KnownExit(d.Exits) {
			c.fail("dns exits unknown link %q", d.Exits)
		}
		c.duration(d.Within)
	}
	for _, p := range e.Ports {
		if !c.client(p.From) || p.From == "router" {
			c.fail("port check from unsupported client %q", p.From)
		}
		if p.Port <= 0 || p.Port > 65535 {
			c.fail("port %d out of range", p.Port)
		}
	}
	for _, s := range e.Sections {
		if s.Path == "" || s.Key == "" {
			c.fail("section needs path and key")
		}
	}
	for _, v := range e.Values {
		if v.Path == "" {
			c.fail("value needs a path")
		}
	}
	for _, t := range e.Tunnels {
		if !tunnels[t.Type] {
			c.fail("unknown tunnel type %q", t.Type)
		}
	}
	for _, d := range e.DHCP {
		if !c.client(d.From) || d.From == "router" {
			c.fail("dhcp from unsupported client %q", d.From)
		}
	}
	if e.Applied != nil {
		catalog := map[string]bool{}
		for _, name := range expect.AppliedSectionNames() {
			catalog[name] = true
		}
		for _, name := range append(append([]string{}, e.Applied.Sections...), e.Applied.ExpectMissing...) {
			if !catalog[name] {
				c.fail("applied section %q is unknown", name)
			}
		}
	}
	for _, u := range e.Unchanged {
		if u.Since == "" {
			c.fail("unchanged needs since")
		}
	}
}

func knownRole(role string) bool {
	for _, r := range env.ResolverRoles {
		if r == role {
			return true
		}
	}
	return false
}

func (c *checker) duration(value string) {
	if value != "" && scenario.Duration(value, 0) == 0 {
		c.fail("%q is not a duration", value)
	}
}
