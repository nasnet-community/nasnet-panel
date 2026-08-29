package install

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"nasnet-panel-installer/internal/ros"
)

const (
	ghOwner         = "nasnet-community"
	ghRepo          = "nasnet-panel"
	assetPrefix     = "nasnet-panel"
	snapshotRelease = "snapshot"
	snapshotChannel = "dev"

	bridgeName   = "containers"
	bridgeIPCIDR = "192.168.50.1/24"
	bridgeNet    = "192.168.50.0/24"

	vethName       = "veth-nasnet-panel"
	legacyVethName = "veth1"
	vethAddrCIDR   = "192.168.50.2/24"
	vethIP         = "192.168.50.2"
	vethGW         = "192.168.50.1"

	containerName       = "nasnet-panel"
	legacyContainerName = "nnc"
	containerImagesDir  = "images/nasnet-panel"

	lanBridge      = "LANBridgeSplit"
	lanBridgeIP    = "192.168.10.1"
	lanDstNet      = "192.168.0.0/16"
	lanBaselineRsc = "nasnet-lan-baseline.rsc"

	commentTag        = "nasnet-panel-installer"
	minFreeMB         = 30
	deviceModeTimeout = 120 * time.Second
	startTimeout      = 120 * time.Second
)

type Options struct {
	Host            string `json:"host"`
	SSHPort         int    `json:"sshPort"`
	User            string `json:"user"`
	Password        string `json:"password"`
	Version         string `json:"version"`
	ImageTar        string `json:"imageTar"`
	LANPort         int    `json:"lanPort"`
	HTTPSLANPort    int    `json:"httpsLanPort"`
	SkipLANBaseline bool   `json:"skipLanBaseline"`
	DryRun          bool   `json:"dryRun"`
	NoRollback      bool   `json:"noRollback"`
}

type SystemInfo struct {
	Board         string `json:"board"`
	Arch          string `json:"arch"`
	Version       string `json:"version"`
	FreeMB        int64  `json:"freeMb"`
	Storage       string `json:"storage"`
	StorageFreeMB int64  `json:"storageFreeMb"`
}

type StepInfo struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type Events struct {
	Step             func(id, status, detail string)
	Log              func(line string)
	Progress         func(id string, percent float64, detail string)
	SysInfo          func(info SystemInfo)
	DeviceModePrompt func() bool
	DeviceModeTick   func(remaining int, routerState string)
	Done             func(urls []string, note string)
}

type step struct {
	id string
	fn func() error
}

var errSkipped = errors.New("skipped")

type Engine struct {
	opts Options
	ev   Events
	ctx  context.Context
	cl   *ros.Client

	rollback []func()
	sys      SystemInfo
	note     string

	assetName string
	localTar  string
	remoteTar string
	storage   string

	finalPort       int
	baselineApplied bool
}

func New(ctx context.Context, opts Options, ev Events) *Engine {
	if opts.User == "" {
		opts.User = "admin"
	}
	if opts.SSHPort == 0 {
		opts.SSHPort = 22
	}
	if opts.LANPort == 0 {
		opts.LANPort = 8080
	}
	if opts.HTTPSLANPort == 0 {
		opts.HTTPSLANPort = 8443
	}
	return &Engine{opts: opts, ev: ev, ctx: ctx}
}

func InstallStepList() []StepInfo {
	return []StepInfo{
		{ID: "connect", Title: "Connect to router"},
		{ID: "check", Title: "Check system"},
		{ID: "device-mode", Title: "Enable container device-mode"},
		{ID: "download", Title: "Download image"},
		{ID: "upload", Title: "Upload to router"},
		{ID: "network", Title: "Configure network"},
		{ID: "container", Title: "Deploy container"},
		{ID: "health", Title: "Start and health check"},
		{ID: "baseline", Title: "LAN baseline"},
	}
}

func UninstallStepList() []StepInfo {
	return []StepInfo{
		{ID: "connect", Title: "Connect to router"},
		{ID: "un-container", Title: "Remove container"},
		{ID: "un-network", Title: "Remove network config"},
		{ID: "un-files", Title: "Remove uploaded files"},
	}
}

func (e *Engine) Run() error {
	steps := []step{
		{"connect", e.stepConnect},
		{"check", e.stepCheck},
		{"device-mode", e.stepDeviceMode},
		{"download", e.stepDownload},
		{"upload", e.stepUpload},
		{"network", e.stepNetwork},
		{"container", e.stepContainer},
		{"health", e.stepHealth},
		{"baseline", e.stepBaseline},
	}
	err := e.runSteps(steps)
	if err != nil && !e.opts.DryRun && !e.opts.NoRollback {
		e.doRollback()
	}
	if err == nil {
		e.finish()
	}
	if e.cl != nil {
		e.cl.Close()
	}
	return err
}

func (e *Engine) runSteps(steps []step) error {
	for _, s := range steps {
		if e.ctx.Err() != nil {
			e.ev.Step(s.id, "failed", "cancelled")
			return errors.New("cancelled by user")
		}
		e.note = ""
		e.ev.Step(s.id, "running", "")
		err := s.fn()
		switch {
		case errors.Is(err, errSkipped):
			e.ev.Step(s.id, "skipped", e.note)
		case err != nil:
			if e.ctx.Err() != nil {
				e.ev.Step(s.id, "failed", "cancelled")
				return errors.New("cancelled by user")
			}
			e.ev.Step(s.id, "failed", err.Error())
			return err
		default:
			e.ev.Step(s.id, "success", e.note)
		}
	}
	return nil
}

func (e *Engine) finish() {
	port := e.finalPort
	if port == 0 {
		port = e.opts.LANPort
	}
	var urls []string
	var note string
	switch {
	case e.opts.DryRun:
		note = "Dry run complete, no changes were made."
	case e.baselineApplied:
		urls = []string{
			fmt.Sprintf("http://%s:%d/", lanBridgeIP, port),
			fmt.Sprintf("https://%s:%d/", lanBridgeIP, e.opts.HTTPSLANPort),
		}
		note = fmt.Sprintf("Baseline LAN %s.0/24 configured. The address you installed from no longer serves the panel, so reconnect or renew your DHCP lease on the %s.x network, then use the links below.",
			lanBridgeIP[:strings.LastIndex(lanBridgeIP, ".")], lanBridgeIP[:strings.LastIndex(lanBridgeIP, ".")])
	default:
		urls = []string{
			fmt.Sprintf("http://%s:%d/", e.opts.Host, port),
			fmt.Sprintf("https://%s:%d/", e.opts.Host, e.opts.HTTPSLANPort),
		}
	}
	e.ev.Done(urls, note)
}

// ---- helpers ---------------------------------------------------------------

func (e *Engine) log(format string, args ...any) {
	e.ev.Log(fmt.Sprintf(format, args...))
}

func (e *Engine) pushRollback(fn func()) {
	e.rollback = append(e.rollback, fn)
}

func (e *Engine) doRollback() {
	if len(e.rollback) == 0 {
		return
	}
	e.log("rolling back %d action(s)", len(e.rollback))
	for i := len(e.rollback) - 1; i >= 0; i-- {
		e.rollback[i]()
	}
	e.rollback = nil
}

func (e *Engine) exists(path, selector string) bool {
	out, err := e.cl.RunRaw(fmt.Sprintf(":put [:len [%s/find %s]]", path, selector), 15*time.Second)
	if err != nil {
		return false
	}
	out = strings.TrimSpace(out)
	return out != "" && out[0] >= '1' && out[0] <= '9'
}

func (e *Engine) ensure(label, path, selector, addArgs string) error {
	if e.exists(path, selector) {
		e.log("%s (exists)", label)
		return nil
	}
	if e.opts.DryRun {
		e.log("[dry-run] would add %s", label)
		return nil
	}
	if out, err := e.cl.Run(fmt.Sprintf("%s/add %s", path, addArgs)); err != nil {
		return fmt.Errorf("failed to add %s: %w (%s)", label, err, strings.TrimSpace(out))
	}
	e.log("added %s", label)
	e.pushRollback(func() {
		_, _ = e.cl.RunRaw(fmt.Sprintf("%s/remove [find %s]", path, selector), 15*time.Second)
	})
	return nil
}

func (e *Engine) removeObj(label, path, selector string) {
	if !e.exists(path, selector) {
		return
	}
	e.log("remove %s", label)
	if e.opts.DryRun {
		return
	}
	_, _ = e.cl.RunRaw(fmt.Sprintf("%s/remove [find %s]", path, selector), 15*time.Second)
}

func (e *Engine) removeRemoteFile(name string) {
	if name == "" {
		return
	}
	if e.opts.DryRun {
		e.log("[dry-run] would remove %s from the router", name)
		return
	}
	e.log("removing %s from the router", name)
	if out, err := e.cl.RunChecked(fmt.Sprintf("/file/remove [find name=%q]", name), 15*time.Second); err != nil {
		e.log("could not remove %s from the router: %v (%s)", name, err, strings.TrimSpace(out))
	}
}

func (e *Engine) moveToTop(path, selector string) {
	if e.opts.DryRun {
		return
	}
	cmd := fmt.Sprintf(`:local n 0; :local stop false; :foreach i in=[%s/find] do={ :if (!$stop) do={ :if ([%s/get $i dynamic]) do={ :set n ($n + 1) } else={ :set stop true } } }; %s/move [find %s] destination=$n`,
		path, path, path, selector)
	_, _ = e.cl.RunRaw(cmd, 15*time.Second)
}

var filePrintRow = regexp.MustCompile(`(?m)^\s*\d+`)

func (e *Engine) ensureDir(dir string) {
	if e.opts.DryRun {
		e.log("[dry-run] mkdir %s", dir)
		return
	}
	out, err := e.cl.RunRaw(fmt.Sprintf("/file/print where name=%q", dir), 15*time.Second)
	if err == nil && filePrintRow.MatchString(out) {
		return
	}
	_, _ = e.cl.RunRaw(fmt.Sprintf("/file/add name=%q type=directory", dir), 15*time.Second)
}

func (e *Engine) sleep(d time.Duration) error {
	select {
	case <-e.ctx.Done():
		return e.ctx.Err()
	case <-time.After(d):
		return nil
	}
}

func assetSuffix(arch string) (string, error) {
	switch arch {
	case "x86_64":
		return "amd64", nil
	case "arm64":
		return "arm64", nil
	case "arm":
		return "armv7", nil
	default:
		return "", fmt.Errorf("unsupported architecture: %s (need arm, arm64, or x86_64)", arch)
	}
}

func humanBytes(n int64) string {
	switch {
	case n >= 1<<20:
		return fmt.Sprintf("%.1f MB", float64(n)/(1<<20))
	case n >= 1<<10:
		return fmt.Sprintf("%.1f KB", float64(n)/(1<<10))
	default:
		return fmt.Sprintf("%d B", n)
	}
}
