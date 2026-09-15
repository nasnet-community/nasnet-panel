package env

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"nasnet-panel/test-lab/internal/drive"
	"nasnet-panel/test-lab/internal/probe"
	"nasnet-panel/test-lab/internal/profile"
)

const (
	RouterAddress      = "192.168.10.1"
	FreshRouterAddress = "192.168.88.1"
	RouterUser         = "admin"
	StarlinkPublic     = "198.51.100.10"
	DomesticPublic     = "198.51.100.20"

	StartFresh          = "fresh"
	StartBootstrapped   = "bootstrapped"
	StartContainerReady = "container-ready"
	StartInstalled      = "installed"

	PanelHost   = "host"
	PanelRouter = "router"

	starlinkGateway = "100.64.0.1"
	domesticGateway = "192.168.1.1"
	splitClient     = "192.168.10.50"
	splitHarness    = "192.168.10.253"
	freshHarness    = "192.168.88.253"
	foreignHostIP   = "203.0.113.80"
	domesticHostIP  = "5.160.0.80"
	domesticCIDR    = "5.160.0.0/24"
	listSourceIP    = "203.0.113.44"
	wireguardIP     = "203.0.113.51"
	l2tpIP          = "203.0.113.52"
	registryIP      = "185.199.108.133"

	ForeignResolver  = "4.2.2.1"
	VPNResolver      = "4.2.2.2"
	DomesticResolver = "217.218.127.127"
	GoogleDoH        = "8.8.8.8"
	CloudflareDoH    = "1.1.1.1"
	AltResolver      = "208.67.222.222"

	wireguardTunnelCIDR = "10.66.0.0/16"
	l2tpTunnelCIDR      = "10.67.0.0/16"

	counterStarlinkToDomestic = "starlink_to_domestic"
	counterDomesticToForeign  = "domestic_to_foreign"
)

var resolverAddresses = []string{ForeignResolver, VPNResolver, DomesticResolver, GoogleDoH, CloudflareDoH, AltResolver}

var ResolverRoles = map[string]string{
	ForeignResolver:        "foreign",
	VPNResolver:            "vpn",
	DomesticResolver:       "domestic",
	GoogleDoH:              "google-plain",
	CloudflareDoH:          "cloudflare-plain",
	AltResolver:            "foreign-alt",
	"doh:" + GoogleDoH:     "doh-google",
	"doh:" + CloudflareDoH: "doh-cloudflare",
}

var HostURLs = map[string]string{
	"foreign-host":  "http://" + foreignHostIP + "/",
	"domestic-host": "http://" + domesticHostIP + "/",
}

var aliases = map[string]string{
	"foreign-host":      foreignHostIP,
	"domestic-host":     domesticHostIP,
	"list-source":       listSourceIP,
	"wireguard-server":  wireguardIP,
	"l2tp-server":       l2tpIP,
	"registry":          registryIP,
	"foreign-resolver":  ForeignResolver,
	"vpn-resolver":      VPNResolver,
	"domestic-resolver": DomesticResolver,
	"doh-google":        GoogleDoH,
	"doh-cloudflare":    CloudflareDoH,
	"foreign-alt":       AltResolver,
}

var exits = map[string]string{
	"starlink": StarlinkPublic + "/32",
	"domestic": DomesticPublic + "/32",
	"vpn":      "10.66.0.0/15",
}

func Address(name string) (string, bool) {
	if ip := net.ParseIP(name); ip != nil {
		return name, true
	}
	addr, ok := aliases[name]
	return addr, ok
}

func ExitName(ip string) string {
	parsed := net.ParseIP(ip)
	for name, cidr := range exits {
		if _, network, err := net.ParseCIDR(cidr); err == nil && parsed != nil && network.Contains(parsed) {
			return name
		}
	}
	return "unknown"
}

func KnownExit(name string) bool {
	_, ok := exits[name]
	return ok
}

func internetAddresses() []string {
	return append([]string{foreignHostIP, domesticHostIP, listSourceIP, wireguardIP, l2tpIP, registryIP}, resolverAddresses...)
}

func domesticDestinations() []string {
	return []string{domesticCIDR, DomesticResolver}
}

func foreignDestinations() []string {
	return []string{foreignHostIP, listSourceIP, wireguardIP, l2tpIP, registryIP, ForeignResolver, VPNResolver, GoogleDoH, CloudflareDoH, AltResolver}
}

type Patch struct {
	File    string
	Find    string
	Replace string
}

type Options struct {
	Keep             bool
	CHRImage         string
	CHRSHA256        string
	CHRArm64Image    string
	EFI              string
	CacheDir         string
	Artifacts        string
	ImageTar         string
	PreviousImageTar string
	Internet         bool
}

type Setup struct {
	Start          string
	Panel          string
	Patch          *Patch
	DomesticSubnet string
	Snapshot       string
}

type Env struct {
	ID      string
	Profile *profile.Profile
	Dir     string
	Router  *drive.Router
	Panel   *drive.Panel
	Probe   *probe.Prober

	opts     Options
	setup    Setup
	assets   *assets
	password string
	liveArch string
	console  string
	monitor  string
	disk     string
	net      *network
	procs    []*process
	filters  []filter
	vpn      *vpnServers
	cleanups []func()
	restored bool
}

func New(t *testing.T, p *profile.Profile, opts Options, setup Setup) *Env {
	t.Helper()
	Preflight(t)

	a, err := loadAssets(opts)
	if err != nil {
		t.Fatalf("prepare lab assets: %v", err)
	}
	id, hostIdx, err := newID()
	if err != nil {
		t.Fatalf("generate lab id: %v", err)
	}
	dir, err := os.MkdirTemp("", "tl"+id+"-")
	if err != nil {
		t.Fatalf("create lab dir: %v", err)
	}

	e := &Env{
		ID:       id,
		Profile:  p,
		Dir:      dir,
		opts:     opts,
		setup:    setup,
		assets:   a,
		password: sessionPassword(),
		liveArch: liveArch(p, opts),
		net:      newNetwork(id, hostIdx),
	}
	if err := e.net.setDomesticSubnet(setup.DomesticSubnet); err != nil {
		t.Fatalf("domestic subnet: %v", err)
	}
	e.Router = &drive.Router{
		NS:       e.net.ns("mgmt"),
		Labsvc:   a.labsvc,
		Address:  RouterAddress,
		User:     RouterUser,
		Password: e.password,
	}
	t.Cleanup(func() { e.destroy(t) })

	steps := []struct {
		name string
		fn   func() error
	}{
		{"network", e.startNetwork},
		{"services", e.startServices},
		{"router", e.startRouter},
		{"panel", e.startPanel},
	}
	for _, step := range steps {
		start := time.Now()
		if err := step.fn(); err != nil {
			t.Fatalf("lab %s: %s: %v", id, step.name, err)
		}
		t.Logf("lab %s: %s ready in %s", id, step.name, time.Since(start).Round(time.Second))
	}
	return e
}

func (e *Env) startNetwork() error {
	if err := e.net.up(e.Profile, e.opts.Internet); err != nil {
		return err
	}
	namespaces := map[string]string{
		"split":         e.net.ns("split"),
		"mgmt":          e.net.ns("mgmt"),
		"starlink-side": e.net.ns("starlink"),
		"domestic-side": e.net.ns("domestic"),
		"internet":      e.net.ns("internet"),
	}
	for role := range e.net.spare {
		namespaces[role] = e.net.ns(role)
	}
	e.Probe = &probe.Prober{Labsvc: e.assets.labsvc, Namespaces: namespaces}
	return e.net.mgmtResolver(VPNResolver)
}

func (e *Env) Restored() bool {
	return e.restored
}

func (e *Env) SaveSnapshot() error {
	if e.setup.Snapshot == "" {
		return nil
	}
	return saveGolden(e, snapshotName(e.setup.Snapshot))
}

func snapshotName(key string) string {
	sum := sha256.Sum256([]byte(key))
	return "snapshot-" + hex.EncodeToString(sum[:6])
}

func (e *Env) Password() string {
	return e.password
}

func (e *Env) LiveArch() string {
	return e.liveArch
}

func (e *Env) Options() Options {
	return e.opts
}

func (e *Env) SpareClients() map[string]int {
	return e.net.spare
}

func (e *Env) WaitDomesticList(ctx context.Context, minimum int) error {
	count := 0
	for {
		rows, err := e.Router.Print(ctx, "/ip/firewall/address-list", "?list=DOMAddList")
		if err == nil {
			count = len(rows)
			if count >= minimum {
				return nil
			}
		}
		select {
		case <-ctx.Done():
			return fmt.Errorf("domestic IP list has %d entries, want at least %d", count, minimum)
		case <-time.After(10 * time.Second):
		}
	}
}

func (e *Env) destroy(t *testing.T) {
	if t.Failed() && e.opts.Artifacts != "" {
		dst := filepath.Join(e.opts.Artifacts, strings.NewReplacer("/", "_", " ", "_").Replace(t.Name()))
		if err := e.saveArtifacts(dst); err != nil {
			t.Logf("save artifacts: %v", err)
		} else {
			t.Logf("logs saved to %s", dst)
		}
	}

	if t.Failed() && e.opts.Keep {
		t.Logf("lab %s kept in %s: namespaces tl%s-*, links tl%s*", e.ID, e.Dir, e.ID, e.ID)
		return
	}

	for i := len(e.procs) - 1; i >= 0; i-- {
		e.procs[i].stop()
	}
	for i := len(e.cleanups) - 1; i >= 0; i-- {
		e.cleanups[i]()
	}
	e.net.down()
	_ = os.RemoveAll(e.Dir)
}

func (e *Env) saveArtifacts(dst string) error {
	if err := os.MkdirAll(dst, 0o755); err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if rows, err := e.Router.Run(ctx, "/export"); err == nil {
		_ = os.WriteFile(filepath.Join(e.Dir, "router-export.log"), []byte(fmt.Sprint(rows)), 0o644)
	}
	if rows, err := e.Router.Print(ctx, "/log"); err == nil {
		var lines []string
		for _, row := range rows {
			lines = append(lines, row["time"]+" "+row["topics"]+" "+row["message"])
		}
		_ = os.WriteFile(filepath.Join(e.Dir, "router-log.log"), []byte(strings.Join(lines, "\n")), 0o644)
	}

	logs, err := filepath.Glob(filepath.Join(e.Dir, "*.log"))
	if err != nil {
		return err
	}
	for _, src := range logs {
		if err := copyFile(src, filepath.Join(dst, filepath.Base(src))); err != nil {
			return err
		}
	}
	return nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer func() { _ = in.Close() }()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, in); err != nil {
		_ = out.Close()
		return err
	}
	return out.Close()
}

func newID() (string, int, error) {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "", 0, err
	}
	return hex.EncodeToString(b[:2]), int(b[2])%254 + 1, nil
}

func randomHex(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}

func LiveArchFor(p *profile.Profile, opts Options) string {
	return liveArch(p, opts)
}

func liveArch(p *profile.Profile, opts Options) string {
	if p.LiveArch() == "arm64" && opts.CHRArm64Image != "" && opts.EFI != "" {
		return "arm64"
	}
	return "x86_64"
}

func routerPortName(p *profile.Profile, role string) (string, error) {
	name, ok := p.Interface(role)
	if !ok {
		return "", fmt.Errorf("profile %s has no %s port", p.Name, role)
	}
	return name, nil
}
