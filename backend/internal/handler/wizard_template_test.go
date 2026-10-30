package handler

// wizardData has the keys the wizard handler fills, with zero values where
// those are enough to render.
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
