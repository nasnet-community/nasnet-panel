package handler

import (
	"regexp"
	"strings"
	"testing"

	"nasnet-panel/pkg/utils"
)

var (
	interfaceListAdd = regexp.MustCompile(`add name="([^"]+)"`)
	interfaceListUse = regexp.MustCompile(`interface-list="!?([^"]+)"`)
)

// RouterOS refuses a rule that names an interface list that does not exist, and
// the wizard stops there with the router half configured. Every list a rule in
// the script names has to be one the script creates, with or without a Domestic
// link: the lists for that link only exist when there is one.
func TestWizardOnlyNamesInterfaceListsItCreates(t *testing.T) {
	for _, domestic := range []bool{true, false} {
		name := "with a Domestic link"
		if !domestic {
			name = "without a Domestic link"
		}
		t.Run(name, func(t *testing.T) {
			out, err := utils.RenderTemplate("wizard.tmpl", escapeWizardTemplateData(wizardListsData(domestic)))
			if err != nil {
				t.Fatal(err)
			}

			_, afterHeading, ok := strings.Cut(out, "\n/interface list\n")
			if !ok {
				t.Fatal("the script has no /interface list section")
			}
			section, _, _ := strings.Cut(afterHeading, "\n/")
			made := map[string]bool{"all": true, "none": true, "dynamic": true, "static": true}
			for _, match := range interfaceListAdd.FindAllStringSubmatch(section, -1) {
				made[match[1]] = true
			}

			for _, line := range strings.Split(out, "\n") {
				for _, match := range interfaceListUse.FindAllStringSubmatch(line, -1) {
					if !made[match[1]] {
						t.Errorf("interface list %q is named but never created: %s", match[1], strings.TrimSpace(line))
					}
				}
			}
		})
	}
}

// wizardListsData has the keys the wizard handler fills, with zero values where
// those are enough to render.
func wizardListsData(domestic bool) map[string]any {
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
	}
}
