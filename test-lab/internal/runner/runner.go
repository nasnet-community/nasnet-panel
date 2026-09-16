package runner

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"testing"
	"time"

	"nasnet-panel/test-lab/internal/drive"
	"nasnet-panel/test-lab/internal/env"
	"nasnet-panel/test-lab/internal/expect"
	"nasnet-panel/test-lab/internal/profile"
	"nasnet-panel/test-lab/internal/scenario"
)

const (
	ovpnUser     = "labuser"
	ovpnPassword = "labpass123"
	ovpnCertPass = "labcert123"
)

type Config struct {
	Options      env.Options
	Scenario     string
	Profile      string
	ScenariosDir string
	ProfilesDir  string
	Shard        string
}

func Stage(t *testing.T, stage string, cfg Config) {
	t.Helper()
	all, err := scenario.LoadStage(cfg.ScenariosDir, stage)
	if err != nil {
		t.Fatalf("load %s scenarios: %v", stage, err)
	}

	shard, shards, err := parseShard(cfg.Shard)
	if err != nil {
		t.Fatalf("shard: %v", err)
	}
	index := 0
	ran := false
	for _, sc := range all {
		if !strings.HasPrefix(sc.ID, cfg.Scenario) {
			continue
		}
		names := sc.Profiles
		if len(names) == 1 && names[0] == "all" {
			if names, err = profile.All(cfg.ProfilesDir); err != nil {
				t.Fatalf("list profiles: %v", err)
			}
		}
		for _, name := range names {
			if cfg.Profile != "" && name != cfg.Profile {
				continue
			}
			index++
			if (index-1)%shards != shard-1 {
				continue
			}
			p, err := profile.Load(cfg.ProfilesDir, name)
			if err != nil {
				t.Fatalf("scenario %s: %v", sc.ID, err)
			}
			ran = true
			t.Run(sc.ID+"/"+name, func(t *testing.T) { runScenario(t, cfg, sc, p) })
		}
	}
	if !ran {
		t.Skipf("no %s scenarios match -scenario %q -profile %q", stage, cfg.Scenario, cfg.Profile)
	}
}

type run struct {
	t         *testing.T
	cfg       Config
	sc        *scenario.Scenario
	p         *profile.Profile
	lab       *env.Env
	snapshots map[string]map[string][]map[string]string
}

func runScenario(t *testing.T, cfg Config, sc *scenario.Scenario, p *profile.Profile) {
	if reason := skipReason(sc, p, cfg.Options); reason != "" {
		t.Skip(reason)
	}
	t.Logf("%s: %s", sc.ID, sc.Title)

	setup := env.Setup{Start: sc.Start, Panel: sc.Panel, DomesticSubnet: sc.Domestic, Snapshot: snapshotKey(sc)}
	if sc.PanelPatch != nil {
		setup.Patch = &env.Patch{File: sc.PanelPatch.File, Find: sc.PanelPatch.Find, Replace: sc.PanelPatch.Replace}
	}

	r := &run{t: t, cfg: cfg, sc: sc, p: p, snapshots: map[string]map[string][]map[string]string{}}
	r.lab = env.New(t, p, cfg.Options, setup)
	if err := r.lab.ResetCounters(); err != nil {
		t.Fatalf("reset leak counters: %v", err)
	}

	if sc.Wizard != nil && !r.lab.Restored() {
		if !r.wizard(sc.Wizard) {
			return
		}
		if setup.Snapshot != "" {
			if err := r.lab.SaveSnapshot(); err != nil {
				t.Fatalf("save wizard snapshot: %v", err)
			}
		}
	}
	for i, step := range sc.Steps {
		if !r.step(i, step) {
			return
		}
		expect.All(t, r.lab, step.Expect, bug(step.KnownBug, sc.KnownBug))
		r.unchanged(step.Expect, bug(step.KnownBug, sc.KnownBug))
	}
	expect.All(t, r.lab, &sc.Expect, sc.KnownBug)
	r.unchanged(&sc.Expect, sc.KnownBug)
}

func skipReason(sc *scenario.Scenario, p *profile.Profile, opts env.Options) string {
	if sc.Stage == "install" {
		if p.Arch == "arm" {
			return fmt.Sprintf("not applicable: %s uses the armv7 image, which no virtual RouterOS can run", p.Name)
		}
		if p.LiveArch() != env.LiveArchFor(p, opts) {
			return fmt.Sprintf("not applicable: %s needs an arm64 CHR, pass -chr-arm64 and -efi", p.Name)
		}
	}
	if missing := p.MissingRoles(sc.Requires.Roles); len(missing) > 0 {
		return fmt.Sprintf("not applicable: %s has no %s port", p.Name, strings.Join(missing, ", "))
	}
	if missing := p.MissingCapabilities(sc.Requires.Capabilities); len(missing) > 0 {
		return fmt.Sprintf("not applicable: %s lacks %s, which a virtual router cannot provide", p.Name, strings.Join(missing, ", "))
	}
	if len(sc.Requires.LiveArch) > 0 {
		arch := env.LiveArchFor(p, opts)
		if !contains(sc.Requires.LiveArch, arch) {
			return fmt.Sprintf("not applicable: %s runs as a %s CHR in this lab", p.Name, arch)
		}
	}
	if sc.Start == env.StartInstalled {
		if opts.ImageTar == "" {
			return "needs -image-tar"
		}
		if missing := env.MissingFeatureTools("cli-install"); len(missing) > 0 {
			return fmt.Sprintf("needs tools: %s", strings.Join(missing, ", "))
		}
	}
	for _, need := range sc.Requires.Lab {
		switch need {
		case "image-tar":
			if opts.ImageTar == "" {
				return "needs -image-tar"
			}
		case "previous-image-tar":
			if opts.PreviousImageTar == "" {
				return "needs -previous-image-tar"
			}
		case "internet":
			if !opts.Internet {
				return "needs -internet"
			}
		default:
			if missing := env.MissingFeatureTools(need); len(missing) > 0 {
				return fmt.Sprintf("needs tools: %s", strings.Join(missing, ", "))
			}
		}
	}
	if usesOpenVPNClient(sc) {
		return "not applicable: the wizard has no OpenVPN client yet"
	}
	return ""
}

func usesOpenVPNClient(sc *scenario.Scenario) bool {
	if sc.Wizard != nil && sc.Wizard.OpenVPNClient {
		return true
	}
	for _, st := range sc.Steps {
		if st.Wizard != nil && st.Wizard.OpenVPNClient {
			return true
		}
	}
	return false
}

func (r *run) action(name, knownBug string, err error) bool {
	r.t.Helper()
	if err == nil {
		return true
	}
	expect.Report(r.t, name, bug(knownBug, r.sc.KnownBug), err)
	return false
}

func (r *run) wizard(w *scenario.Wizard) bool {
	r.t.Helper()
	if w == nil {
		r.t.Fatalf("wizard step without wizard inputs")
	}
	req, err := r.wizardRequest(w)
	if err != nil {
		r.t.Fatalf("wizard inputs: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), scenario.Duration(w.Timeout, 15*time.Minute))
	defer cancel()

	if w.ExpectError != "" {
		startErr := r.lab.Panel.StartWizard(ctx, req)
		var err error
		switch {
		case startErr == nil:
			err = fmt.Errorf("wizard accepted the inputs, want an error mentioning %q", w.ExpectError)
		case !strings.Contains(strings.ToLower(startErr.Error()), strings.ToLower(w.ExpectError)):
			err = fmt.Errorf("error %q does not mention %q", startErr, w.ExpectError)
		}
		expect.Report(r.t, "wizard rejects the inputs", bug(w.KnownBug, r.sc.KnownBug), err)
		return err == nil
	}

	if w.ExpectIncomplete {
		if !r.action("start wizard", w.KnownBug, r.lab.Panel.StartWizard(ctx, req)) {
			return false
		}
		var err error
		if r.lab.Panel.WaitWizard(ctx) == nil {
			err = fmt.Errorf("wizard completed, want it to stop partway")
		}
		expect.Report(r.t, "wizard stops partway", bug(w.KnownBug, r.sc.KnownBug), err)
		return true
	}

	if !r.action("apply wizard", w.KnownBug, r.lab.Panel.ApplyWizard(ctx, req)) {
		return false
	}
	if w.WaitDomesticList {
		listCtx, listCancel := context.WithTimeout(context.Background(), 8*time.Minute)
		defer listCancel()
		return r.action("domestic IP list loaded", w.KnownBug, r.lab.WaitDomesticList(listCtx, 1000))
	}
	return true
}

func (r *run) wizardRequest(w *scenario.Wizard) (drive.WizardRequest, error) {
	var req drive.WizardRequest
	link := func(role string) (*drive.WizardLink, error) {
		if role == "" {
			return nil, nil
		}
		name, ok := r.p.Interface(role)
		if !ok {
			return nil, fmt.Errorf("profile %s has no %s port", r.p.Name, role)
		}
		return &drive.WizardLink{Interface: name}, nil
	}

	var err error
	if req.Foreign, err = link(w.Foreign); err != nil {
		return req, err
	}
	if req.Domestic, err = link(w.Domestic); err != nil {
		return req, err
	}
	if w.L2TPClient {
		if !r.lab.HasVPNServer("l2tp") {
			return req, fmt.Errorf("lab L2TP server is not running, install xl2tpd and ppp")
		}
		host, user, password := r.lab.L2TPClient()
		req.L2tpClient = &drive.WizardL2TP{ConnectTo: host, User: user, Password: password}
	}
	if w.WireGuardClient {
		if !r.lab.HasVPNServer("wireguard") {
			return req, fmt.Errorf("lab WireGuard server is not running, install wireguard-tools")
		}
		req.WireGuardClient = &drive.WizardWireGuard{Config: r.lab.WireGuardClientConfig()}
	}
	if w.OvpnServer {
		req.OvpnServer = &drive.WizardOvpnServer{
			ClientCertificatePassword: ovpnCertPass,
			Users:                     []drive.WizardOvpnUser{{Username: ovpnUser, Password: ovpnPassword}},
		}
	}
	if w.WiFi != nil {
		req.WiFiAP = &drive.WizardWiFi{SSID: w.WiFi.SSID, Password: w.WiFi.Password, Split: w.WiFi.Split}
	}
	return req, nil
}

func (r *run) step(i int, st scenario.Step) bool {
	r.t.Helper()
	name := st.Name
	if name == "" {
		name = fmt.Sprintf("step %d %s", i+1, st.Do)
	}
	w := st.With
	lab := r.lab

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Minute)
	defer cancel()

	var err error
	switch st.Do {
	case "wizard":
		return r.wizard(st.Wizard)
	case "wizard_start":
		var req drive.WizardRequest
		if req, err = r.wizardRequest(st.Wizard); err == nil {
			err = lab.Panel.StartWizard(ctx, req)
		}
	case "wizard_wait":
		err = lab.Panel.WaitWizard(ctx)
	case "disconnect_panel":
		err = lab.DisconnectPanel(ctx, scenario.Duration(w["for"], 30*time.Second))
	case "reboot":
		err = lab.Reboot(ctx)
	case "power_cycle":
		err = lab.PowerCycle(ctx)
	case "link_down", "link_up":
		if w["mode"] == "carrier" {
			err = lab.SetCarrier(w["link"], st.Do == "link_up")
		} else {
			err = lab.SetUpstream(w["link"], st.Do == "link_up")
		}
	case "filter":
		err = lab.AddFilter(w["link"], w["target"])
	case "clear_filters":
		err = lab.ClearFilters()
	case "vpn_server_down", "vpn_server_up":
		err = lab.SetVPNServer(w["type"], st.Do == "vpn_server_up")
	case "api":
		return r.api(ctx, st.API)
	case "restart_panel":
		err = lab.RestartPanel(ctx)
	case "install", "uninstall":
		err = r.installer(ctx, st)
	case "plugin_install":
		var status drive.PluginStatus
		status, err = lab.Panel.InstallPlugin(ctx, w["id"])
		want := w["phase"]
		if want == "" {
			want = "done"
		}
		if err == nil && status.Phase != want {
			err = fmt.Errorf("plugin %s ended in phase %q (%s), want %q", w["id"], status.Phase, status.Message, want)
		}
	case "plugin_uninstall":
		var resp *drive.Response
		resp, err = lab.Panel.UninstallPlugin(ctx, w["id"])
		want := http.StatusOK
		if w["status"] != "" {
			want, _ = strconv.Atoi(w["status"])
		}
		if err == nil && resp.Status != want {
			err = fmt.Errorf("uninstall %s returned %d (%s %s), want %d", w["id"], resp.Status, resp.Message, resp.Error, want)
		}
	case "lab_registry":
		err = lab.PrepareLabRegistry(ctx)
	case "router":
		var words []string
		if w["words"] != "" {
			words = strings.Split(w["words"], "|")
		}
		_, err = lab.Router.Run(ctx, w["cmd"], words...)
	case "segment_client":
		err = lab.AttachSegmentClient(ctx, w["client"], w["bridge"])
	case "openvpn_connect":
		err = r.openvpnConnect(ctx)
	case "sleep":
		time.Sleep(scenario.Duration(w["for"], 10*time.Second))
	case "reset_counters":
		err = lab.ResetCounters()
	case "change_wan":
		iface, ok := r.p.Interface(w["role"])
		if !ok {
			err = fmt.Errorf("profile %s has no %s port", r.p.Name, w["role"])
			break
		}
		var resp *drive.Response
		resp, err = lab.Panel.Call(ctx, http.MethodPut, "/api/interface/wan", nil, map[string]string{"interface": iface, "type": w["type"]})
		if err == nil && resp.Status != http.StatusOK {
			err = fmt.Errorf("change WAN returned %d: %s %s", resp.Status, resp.Message, resp.Error)
		}
	case "container_mode":
		err = lab.SetContainerMode(ctx, w["value"] == "on")
	case "container_restart":
		err = r.restartContainer(ctx, w["name"])
	case "config_snapshot":
		err = r.snapshot(ctx, w["name"], splitPaths(w["paths"]))
	case "wait_domestic_list":
		err = lab.WaitDomesticList(ctx, 1000)
	default:
		r.t.Fatalf("%s: unknown action %q", name, st.Do)
	}
	return r.action(name, st.KnownBug, err)
}

func (r *run) installer(ctx context.Context, st scenario.Step) error {
	w := st.With
	tar := r.cfg.Options.ImageTar
	if w["image"] == "previous" {
		tar = r.cfg.Options.PreviousImageTar
	}
	if w["image"] == "corrupt" {
		tar = corruptTar(r.lab)
	}

	var output string
	var err error
	if st.Do == "uninstall" {
		output, err = r.lab.Uninstall(ctx, w["installer"])
	} else {
		output, err = r.lab.Install(ctx, w["installer"], tar)
	}

	if w["expect_fail"] != "true" {
		return err
	}
	if err == nil {
		return fmt.Errorf("installer succeeded, want a failure")
	}
	if w["error"] != "" && !strings.Contains(strings.ToLower(output), strings.ToLower(w["error"])) {
		return fmt.Errorf("installer output does not mention %q", w["error"])
	}
	return nil
}

func (r *run) openvpnConnect(ctx context.Context) error {
	name, err := r.lab.OvpnServerName(ctx)
	if err != nil {
		return err
	}
	addr, err := r.lab.RouterWANAddress("domestic")
	if err != nil {
		return err
	}
	config, err := r.lab.Panel.ExportOvpn(ctx, name, addr)
	if err != nil {
		return err
	}
	connectCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	return r.lab.ConnectOpenVPN(connectCtx, config, ovpnUser, ovpnPassword, ovpnCertPass)
}

func (r *run) api(ctx context.Context, call *scenario.APICall) bool {
	r.t.Helper()
	if call == nil {
		r.t.Fatalf("api step without api call")
	}
	name := fmt.Sprintf("api %s %s", call.Method, call.Path)
	resp, err := r.lab.Panel.Call(ctx, strings.ToUpper(call.Method), call.Path, call.Query, call.Body)
	if err == nil {
		err = checkResponse(resp, call)
	}
	expect.Report(r.t, name, bug(call.KnownBug, r.sc.KnownBug), err)
	return true
}

func checkResponse(resp *drive.Response, call *scenario.APICall) error {
	want := call.Status
	if want == 0 {
		want = http.StatusOK
	}
	if resp.Status != want {
		return fmt.Errorf("status %d (%s %s), want %d", resp.Status, resp.Message, resp.Error, want)
	}
	body := strings.ToLower(string(resp.Body))
	for _, c := range call.Contains {
		if !strings.Contains(body, strings.ToLower(c)) {
			return fmt.Errorf("response does not contain %q", c)
		}
	}
	if len(call.JSON) == 0 && len(call.Unique) == 0 {
		return nil
	}
	var data any
	if err := json.Unmarshal(resp.Data, &data); err != nil {
		return fmt.Errorf("decode data: %w", err)
	}
	for _, u := range call.Unique {
		if err := checkUnique(data, u); err != nil {
			return err
		}
	}
	for path, wantValue := range call.JSON {
		got, ok := lookup(data, path)
		if !ok {
			if wantValue == "!present" {
				continue
			}
			return fmt.Errorf("%s missing in response", path)
		}
		if wantValue == "!present" {
			return fmt.Errorf("%s present in response", path)
		}
		if !expect.MatchValue(fmt.Sprint(got), wantValue) {
			return fmt.Errorf("%s is %v, want %q", path, got, wantValue)
		}
	}
	return nil
}

func lookup(data any, path string) (any, bool) {
	current := data
	for _, part := range strings.Split(path, ".") {
		switch node := current.(type) {
		case map[string]any:
			v, ok := node[part]
			if !ok {
				return nil, false
			}
			current = v
		case []any:
			if part == "#" {
				current = len(node)
				continue
			}
			idx, err := strconv.Atoi(part)
			if err != nil || idx < 0 || idx >= len(node) {
				return nil, false
			}
			current = node[idx]
		default:
			return nil, false
		}
	}
	return current, true
}

func corruptTar(lab *env.Env) string {
	path := lab.Dir + "/corrupt-image.tar"
	_ = writeFile(path, []byte("not a container image"))
	return path
}

func bug(own, inherited string) string {
	if own != "" {
		return own
	}
	return inherited
}

func contains(list []string, v string) bool {
	for _, item := range list {
		if item == v {
			return true
		}
	}
	return false
}

func snapshotKey(sc *scenario.Scenario) string {
	w := sc.Wizard
	if w == nil || w.ExpectError != "" || w.ExpectIncomplete || sc.PanelPatch != nil {
		return ""
	}
	inputs := *w
	inputs.KnownBug = ""
	inputs.Timeout = ""
	data, err := json.Marshal(struct {
		Start    string
		Domestic string
		Wizard   scenario.Wizard
	}{sc.Start, sc.Domestic, inputs})
	if err != nil {
		return ""
	}
	return string(data)
}

func parseShard(value string) (int, int, error) {
	if value == "" {
		return 1, 1, nil
	}
	left, right, ok := strings.Cut(value, "/")
	shard, err1 := strconv.Atoi(left)
	shards, err2 := strconv.Atoi(right)
	if !ok || err1 != nil || err2 != nil || shards < 1 || shard < 1 || shard > shards {
		return 0, 0, fmt.Errorf("want i/n with 1 <= i <= n, got %q", value)
	}
	return shard, shards, nil
}
