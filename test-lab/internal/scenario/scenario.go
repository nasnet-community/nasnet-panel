package scenario

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"

	"gopkg.in/yaml.v3"
)

const (
	StartFresh          = "fresh"
	StartBootstrapped   = "bootstrapped"
	StartContainerReady = "container-ready"
	StartInstalled      = "installed"

	PanelHost   = "host"
	PanelRouter = "router"
)

type Requires struct {
	Roles        []string `yaml:"roles"`
	Capabilities []string `yaml:"capabilities"`
	Lab          []string `yaml:"lab"`
	LiveArch     []string `yaml:"live_arch"`
}

type Patch struct {
	File    string `yaml:"file"`
	Find    string `yaml:"find"`
	Replace string `yaml:"replace"`
}

type WiFi struct {
	SSID     string `yaml:"ssid"`
	Password string `yaml:"password"`
	Split    bool   `yaml:"split"`
}

type Wizard struct {
	Foreign          string `yaml:"foreign"`
	Domestic         string `yaml:"domestic"`
	L2TPClient       bool   `yaml:"l2tp_client"`
	WireGuardClient  bool   `yaml:"wireguard_client"`
	OpenVPNClient    bool   `yaml:"openvpn_client"`
	OvpnServer       bool   `yaml:"ovpn_server"`
	WiFi             *WiFi  `yaml:"wifi"`
	WaitDomesticList bool   `yaml:"wait_domestic_list"`
	ExpectError      string `yaml:"expect_error"`
	ExpectIncomplete bool   `yaml:"expect_incomplete"`
	Timeout          string `yaml:"timeout"`
	KnownBug         string `yaml:"known_bug"`
}

type APICall struct {
	Method   string            `yaml:"method"`
	Path     string            `yaml:"path"`
	Query    map[string]string `yaml:"query"`
	Body     any               `yaml:"body"`
	Status   int               `yaml:"status"`
	Contains []string          `yaml:"contains"`
	JSON     map[string]string `yaml:"json"`
	Unique   []string          `yaml:"unique"`
	KnownBug string            `yaml:"known_bug"`
}

type Step struct {
	Name     string            `yaml:"name"`
	Do       string            `yaml:"do"`
	With     map[string]string `yaml:"with"`
	Wizard   *Wizard           `yaml:"wizard"`
	API      *APICall          `yaml:"api"`
	Expect   *Expect           `yaml:"expect"`
	KnownBug string            `yaml:"known_bug"`
}

type Section struct {
	Path     string   `yaml:"path"`
	Key      string   `yaml:"key"`
	Present  []string `yaml:"present"`
	Absent   []string `yaml:"absent"`
	KnownBug string   `yaml:"known_bug"`
}

type Value struct {
	Path     string            `yaml:"path"`
	Where    map[string]string `yaml:"where"`
	Fields   map[string]string `yaml:"fields"`
	Absent   bool              `yaml:"absent"`
	Count    *int              `yaml:"count"`
	KnownBug string            `yaml:"known_bug"`
}

type Traffic struct {
	From     string `yaml:"from"`
	To       string `yaml:"to"`
	Exits    string `yaml:"exits"`
	Within   string `yaml:"within"`
	KnownBug string `yaml:"known_bug"`
}

type DNS struct {
	From     string `yaml:"from"`
	Server   string `yaml:"server"`
	Name     string `yaml:"name"`
	Resolver string `yaml:"resolver"`
	Exits    string `yaml:"exits"`
	Within   string `yaml:"within"`
	KnownBug string `yaml:"known_bug"`
}

type Leak struct {
	StarlinkToDomestic bool   `yaml:"starlink_to_domestic"`
	DomesticToForeign  bool   `yaml:"domestic_to_foreign"`
	KnownBug           string `yaml:"known_bug"`
}

type Port struct {
	From     string `yaml:"from"`
	Port     int    `yaml:"port"`
	Open     bool   `yaml:"open"`
	KnownBug string `yaml:"known_bug"`
}

type Files struct {
	Present   []string `yaml:"present"`
	Absent    []string `yaml:"absent"`
	NoSecrets bool     `yaml:"no_secrets"`
	KnownBug  string   `yaml:"known_bug"`
}

type Container struct {
	Name     string            `yaml:"name"`
	Present  *bool             `yaml:"present"`
	Running  *bool             `yaml:"running"`
	Fields   map[string]string `yaml:"fields"`
	KnownBug string            `yaml:"known_bug"`
}

type Tunnel struct {
	Type     string `yaml:"type"`
	Up       bool   `yaml:"up"`
	Within   string `yaml:"within"`
	KnownBug string `yaml:"known_bug"`
}

type DHCP struct {
	From     string `yaml:"from"`
	Lease    bool   `yaml:"lease"`
	Gateway  string `yaml:"gateway"`
	DNS      string `yaml:"dns"`
	KnownBug string `yaml:"known_bug"`
}

type Applied struct {
	Sections      []string `yaml:"sections"`
	ExpectMissing []string `yaml:"expect_missing"`
	KnownBug      string   `yaml:"known_bug"`
}

type Unchanged struct {
	Since    string   `yaml:"since"`
	Paths    []string `yaml:"paths"`
	Ignore   []string `yaml:"ignore"`
	KnownBug string   `yaml:"known_bug"`
}

type PanelCheck struct {
	Healthy  bool   `yaml:"healthy"`
	KnownBug string `yaml:"known_bug"`
}

type Plugin struct {
	ID        string `yaml:"id"`
	Installed *bool  `yaml:"installed"`
	Running   *bool  `yaml:"running"`
	Within    string `yaml:"within"`
	KnownBug  string `yaml:"known_bug"`
}

type Expect struct {
	Sections  []Section   `yaml:"sections"`
	Values    []Value     `yaml:"values"`
	Traffic   []Traffic   `yaml:"traffic"`
	DNS       []DNS       `yaml:"dns"`
	Leak      *Leak       `yaml:"leak"`
	Ports     []Port      `yaml:"ports"`
	Files     *Files      `yaml:"files"`
	Container []Container `yaml:"container"`
	Tunnels   []Tunnel    `yaml:"tunnels"`
	DHCP      []DHCP      `yaml:"dhcp"`
	Applied   *Applied    `yaml:"applied"`
	Panel     *PanelCheck `yaml:"panel"`
	Plugins   []Plugin    `yaml:"plugins"`
	Unchanged []Unchanged `yaml:"unchanged"`
}

type Scenario struct {
	ID         string   `yaml:"id"`
	Stage      string   `yaml:"stage"`
	Title      string   `yaml:"title"`
	Profiles   []string `yaml:"profiles"`
	Requires   Requires `yaml:"requires"`
	Start      string   `yaml:"start"`
	Panel      string   `yaml:"panel"`
	PanelPatch *Patch   `yaml:"panel_patch"`
	Domestic   string   `yaml:"domestic_subnet"`
	Wizard     *Wizard  `yaml:"wizard"`
	Steps      []Step   `yaml:"steps"`
	Expect     Expect   `yaml:"expect"`
	KnownBug   string   `yaml:"known_bug"`
}

var stageStarts = map[string]string{
	"install":    StartContainerReady,
	"wizard":     StartBootstrapped,
	"resilience": StartBootstrapped,
}

func LoadStage(root, stage string) ([]*Scenario, error) {
	paths, err := filepath.Glob(filepath.Join(root, stage, "*.yaml"))
	if err != nil {
		return nil, err
	}
	sort.Strings(paths)

	scenarios := make([]*Scenario, 0, len(paths))
	for _, path := range paths {
		s, err := load(path)
		if err != nil {
			return nil, err
		}
		if err := s.normalize(stage); err != nil {
			return nil, fmt.Errorf("%s: %w", path, err)
		}
		scenarios = append(scenarios, s)
	}
	return scenarios, nil
}

func (s *Scenario) normalize(stage string) error {
	if s.ID == "" {
		return fmt.Errorf("missing id")
	}
	if s.Stage != stage {
		return fmt.Errorf("stage is %q but the file is under %s", s.Stage, stage)
	}
	if s.Start == "" {
		s.Start = stageStarts[stage]
	}
	switch s.Start {
	case StartFresh, StartBootstrapped, StartContainerReady, StartInstalled:
	default:
		return fmt.Errorf("unknown start %q", s.Start)
	}
	if s.Panel == "" {
		s.Panel = PanelHost
		if s.Start == StartInstalled {
			s.Panel = PanelRouter
		}
	}
	if s.Panel != PanelHost && s.Panel != PanelRouter {
		return fmt.Errorf("unknown panel %q", s.Panel)
	}
	if len(s.Profiles) == 0 {
		return fmt.Errorf("no profiles listed")
	}
	return nil
}

func load(path string) (*Scenario, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func() { _ = f.Close() }()

	dec := yaml.NewDecoder(f)
	dec.KnownFields(true)

	var s Scenario
	if err := dec.Decode(&s); err != nil {
		return nil, fmt.Errorf("%s: %w", path, err)
	}
	return &s, nil
}

func Duration(value string, fallback time.Duration) time.Duration {
	if value == "" {
		return fallback
	}
	d, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return d
}
