package handler

import (
	"strings"
	"testing"

	"nasnet-panel/pkg/utils"
)

const (
	mtprotoDomestic = `comment="MTProto plugin to its servers via domestic" dst-address-list="DOMAddList" new-routing-mark="to-Domestic" passthrough=no src-address=192.168.50.11`
	mtprotoForeign  = `comment="MTProto plugin outbound via foreign" dst-address-list=!LOCAL-IP new-routing-mark=to-Foreign passthrough=no src-address=192.168.50.11`
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

		"DomesticUserEntryComment": domesticUserEntryComment,
	}
}

func TestWizardRoutesTheMTProtoContainer(t *testing.T) {
	for _, domestic := range []bool{true, false} {
		out, err := utils.RenderTemplate("base_config.tmpl", wizardData(domestic))
		if err != nil {
			t.Fatalf("domestic=%v: %v", domestic, err)
		}
		if strings.Count(out, mtprotoForeign) != 1 {
			t.Fatalf("domestic=%v: want the foreign rule once, got %d", domestic, strings.Count(out, mtprotoForeign))
		}
		d := strings.Count(out, mtprotoDomestic)
		if !domestic {
			if d != 0 {
				t.Fatal("the domestic rule needs the to-Domestic table, which this mode doesn't create")
			}
			continue
		}
		if d != 1 {
			t.Fatalf("want the domestic rule once, got %d", d)
		}
		// both end the chain, so the servers' domestic route must match first
		if strings.Index(out, mtprotoDomestic) > strings.Index(out, mtprotoForeign) {
			t.Fatal("the domestic rule must come before the foreign one")
		}
	}
}
