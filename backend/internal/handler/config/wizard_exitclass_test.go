package config

import (
	"regexp"
	"strings"
	"testing"

	"nasnet-panel/internal/handler/firewall"
	"nasnet-panel/internal/handler/plugin"
	"nasnet-panel/pkg/utils"
)

// wizardData has the keys the wizard handler fills. Zero values are enough to render.
func wizardData(domestic bool) map[string]any {
	return map[string]any{
		"DomesticEnabled":   domestic,
		"ManagementWifi":    WiFiAP{},
		"ForeignInterface":  InterfaceConfig{Interface: "ether1", Type: "ether", Type2: "ethernet"},
		"DomesticInterface": InterfaceConfig{Interface: "ether2", Type: "ether", Type2: "ethernet"},
		"WifiAPs":           []WiFiAP{},
		"WifiSplit":         false,
		"BridgePorts":       []BridgePort{{DefaultName: "ether3", Type: "ethernet"}},
		"CurrentDate":       "Jan/02/2026",
		"CurrentTimestamp":  int64(0),
		"BackupTime":        "2026-01-02_00-00-00",
		"Identity":          "Test",
		"RouterUsername":    "admin",
		"RouterPassword":    "secret",
		"RandomUserID":      "u1",

		"DomesticUserEntryComment": firewall.DomesticUserEntryComment,
	}
}

func renderWizardWithExitClasses(t *testing.T, domestic bool) string {
	t.Helper()

	data := wizardData(domestic)
	data["ContainerExitClasses"] = plugin.ExitClassesScript(domestic)
	out, err := utils.RenderTemplate("base_config.tmpl", escapeWizardTemplateData(data))
	if err != nil {
		t.Fatalf("domestic=%v: %v", domestic, err)
	}
	return out
}

var exitClassTable = regexp.MustCompile(`comment="Exit-Class-[^"]+" .*table="([^"]+)"`)

func TestWizardWritesTheExitClassesAfterItsOwnRules(t *testing.T) {
	for _, domestic := range []bool{true, false} {
		out := renderWizardWithExitClasses(t, domestic)

		script := plugin.ExitClassesScript(domestic)
		at := strings.Index(out, script)
		if at < 0 || strings.Count(out, script) != 1 {
			t.Fatalf("domestic=%v: the exit classes are not in the script once", domestic)
		}
		// After the wizard's own routing rules, which it writes after removing every rule there was.
		if own := strings.Index(out, `comment="Tunnel endpoints always leave via Foreign"`); own < 0 || own > at {
			t.Errorf("domestic=%v: the exit classes come before the wizard's own rules", domestic)
		}

		// Each table a class leaves through is one the script has made by then.
		for _, match := range exitClassTable.FindAllStringSubmatch(script, -1) {
			table := match[1]
			if table == "main" {
				continue
			}
			made := strings.Index(out, `add fib name="`+table+`"`)
			if made < 0 || made > at {
				t.Errorf("domestic=%v: %s is used by an exit class but not made before it", domestic, table)
			}
		}
		if !domestic && strings.Contains(script, `table="to-Domestic`) {
			t.Error("without a Domestic link the Domestic classes must drop")
		}
	}
}

func TestWizardWithoutExitClassesStillRenders(t *testing.T) {
	out, err := utils.RenderTemplate("base_config.tmpl", wizardData(true))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(out, "<no value>") {
		t.Error("a render without ContainerExitClasses prints <no value>")
	}
}
