package handler

import (
	"errors"
	"fmt"
	"slices"
	"strings"
	"testing"

	"nasnet-panel/pkg/routeros"
	"nasnet-panel/pkg/utils"
)

// fakeWizardRouter stands in for both the RouterOS client and the SFTP client
// while the wizard script is started. It keeps the files on the "router", logs
// every call, and fails the one named in failAt.
type fakeWizardRouter struct {
	failAt string
	calls  []string
	files  map[string]string
	script routeros.ScriptConfig
}

func newFakeWizardRouter(failAt string) *fakeWizardRouter {
	return &fakeWizardRouter{failAt: failAt, files: map[string]string{}}
}

func (f *fakeWizardRouter) call(name string) error {
	f.calls = append(f.calls, name)
	if f.failAt == name {
		return errors.New(name + " failed")
	}
	return nil
}

func (f *fakeWizardRouter) UploadFromString(content, remotePath string) error {
	// A failed upload can still leave a partial file behind.
	f.files[remotePath] = content
	return f.call("upload " + remotePath)
}

func (f *fakeWizardRouter) DeleteFile(filename string) error {
	if _, ok := f.files[filename]; !ok {
		return fmt.Errorf("failed to get file %s", filename)
	}
	delete(f.files, filename)
	return f.call("delete " + filename)
}

func (f *fakeWizardRouter) RemoveScript(name string) error {
	return f.call("remove script " + name)
}

func (f *fakeWizardRouter) AddScript(config routeros.ScriptConfig) (string, error) {
	f.script = config
	return "*1", f.call("add script " + config.Name)
}

func (f *fakeWizardRouter) RunScript(name string) error {
	return f.call("run script " + name)
}

func TestStartWizardScript(t *testing.T) {
	const file = "nasnet-panel/wizard.rsc"

	for _, tc := range []struct {
		name      string
		failAt    string
		wantMsg   string
		wantCalls []string
	}{
		{
			name:      "started, the router removes the file itself",
			wantCalls: []string{"upload " + file, "remove script wizard", "add script wizard", "run script wizard"},
		},
		{
			name:      "upload fails",
			failAt:    "upload " + file,
			wantMsg:   "Failed to upload wizard script",
			wantCalls: []string{"upload " + file, "delete " + file},
		},
		{
			name:      "script cannot be created",
			failAt:    "add script wizard",
			wantMsg:   "Failed to create wizard script",
			wantCalls: []string{"upload " + file, "remove script wizard", "add script wizard", "delete " + file},
		},
		{
			name:      "script cannot be run",
			failAt:    "run script wizard",
			wantMsg:   "Failed to execute wizard script",
			wantCalls: []string{"upload " + file, "remove script wizard", "add script wizard", "run script wizard", "delete " + file},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			router := newFakeWizardRouter(tc.failAt)

			msg, err := startWizardScript(router, router, "rendered wizard script")

			if (err != nil) != (tc.failAt != "") {
				t.Fatalf("err = %v, want failure at %q", err, tc.failAt)
			}
			if msg != tc.wantMsg {
				t.Errorf("message = %q, want %q", msg, tc.wantMsg)
			}
			if !slices.Equal(router.calls, tc.wantCalls) {
				t.Errorf("calls\n got  %q\n want %q", router.calls, tc.wantCalls)
			}
			if tc.failAt != "" && len(router.files) > 0 {
				t.Errorf("the wizard script was left on the router: %v", router.files)
			}
		})
	}
}

// The text is what was run against a RouterOS 7.24 router; change it only
// along with a check there.
func TestStartWizardScriptImportsThenRemovesTheFile(t *testing.T) {
	router := newFakeWizardRouter("")
	if _, err := startWizardScript(router, router, "x"); err != nil {
		t.Fatal(err)
	}

	want := `:execute script={:onerror e in={/import file-name="nasnet-panel/wizard.rsc"} ` +
		`do={:log error ("Wizard: import failed: " . $e)}; /file remove [find name="nasnet-panel/wizard.rsc"]}`
	if router.script.Name != "wizard" || router.script.Source != want {
		t.Fatalf("script %q has source\n got  %s\n want %s", router.script.Name, router.script.Source, want)
	}
}

func TestWizardTemplateRemovesItsOwnFileFirst(t *testing.T) {
	const password = "pw-for-test"
	out, err := utils.RenderTemplate("wizard.tmpl", escapeWizardTemplateData(map[string]any{
		"DomesticEnabled":   false,
		"ManagementWifi":    WiFiAP{},
		"ForeignInterface":  InterfaceConfig{Interface: "ether1", Type: "ether", Type2: "ethernet"},
		"DomesticInterface": InterfaceConfig{},
		"WifiAPs":           []WiFiAP{},
		"WifiSplit":         false,
		"BridgePorts":       []BridgePort{{DefaultName: "ether3", Type: "ethernet"}},
		"CurrentDate":       "Jan/02/2026",
		"CurrentTimestamp":  int64(0),
		"BackupTime":        "2026-01-02_00-00-00",
		"Identity":          "Test",
		"RouterUsername":    "admin",
		"RouterPassword":    password,
		"RandomUserID":      "u1",
	}))
	if err != nil {
		t.Fatal(err)
	}

	removal := `/file remove [find where name=($nasnetDir . "/wizard.rsc")]`
	if strings.Count(out, removal) != 1 {
		t.Fatalf("want the file removed once, got %d", strings.Count(out, removal))
	}
	at := strings.Index(out, removal)

	// Only declarations may come before it: nothing that can fail, exit or use the password.
	for _, line := range strings.Split(strings.TrimSpace(out[:at]), "\n") {
		if line != "" && !strings.HasPrefix(line, ":local ") && !strings.HasPrefix(line, "#") {
			t.Errorf("%q runs before the file removes itself", line)
		}
	}
	if !strings.Contains(out, password) {
		t.Error("the router password is not in the script, so this test would prove nothing")
	}
}
