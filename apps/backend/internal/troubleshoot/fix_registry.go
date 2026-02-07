package troubleshoot

// FixRegistry maps issue codes to fix suggestions.
var FixRegistry = map[string]FixSuggestion{
	"WAN_DISABLED": {
		IssueCode:            "WAN_DISABLED",
		Title:                "Enable WAN Interface",
		Explanation:          "Your WAN interface is currently disabled. We can enable it for you automatically.",
		Confidence:           FixConfidenceHigh,
		RequiresConfirmation: true,
		IsManualFix:          false,
		Command:              "/interface/enable [find where default-name~\"ether1\" or comment~\"WAN\"]",
		RollbackCommand:      "/interface/disable [find where default-name~\"ether1\" or comment~\"WAN\"]",
	},

	"WAN_LINK_DOWN": {
		IssueCode:            "WAN_LINK_DOWN",
		Title:                "Check Physical Connection",
		Explanation:          "The cable to your internet provider appears disconnected. This requires manual intervention.",
		Confidence:           FixConfidenceHigh,
		RequiresConfirmation: false,
		IsManualFix:          true,
		ManualSteps: []string{
			"Check that the ethernet cable from your ISP is firmly plugged into the WAN port",
			"Look for a green link light on the WAN port (usually labeled \"ether1\" or \"WAN\")",
			"If using a modem, ensure the modem is powered on and showing an active connection",
			"Try unplugging and re-plugging the cable to reseat the connection",
		},
	},

	"NO_DEFAULT_ROUTE": {
		IssueCode:            "NO_DEFAULT_ROUTE",
		Title:                "Configure Default Route",
		Explanation:          "Your router has no default route configured. This is usually provided by DHCP.",
		Confidence:           FixConfidenceMedium,
		RequiresConfirmation: true,
		IsManualFix:          false,
		Command:              "/ip/dhcp-client/enable [find where interface~\"ether1\"]",
	},

	"GATEWAY_UNREACHABLE": {
		IssueCode:            "GATEWAY_UNREACHABLE",
		Title:                "Reset DHCP Client",
		Explanation:          "Your DHCP lease may have expired. Renewing it might restore gateway connectivity.",
		Confidence:           FixConfidenceMedium,
		RequiresConfirmation: true,
		IsManualFix:          false,
		Command:              "/ip/dhcp-client/renew [find where interface~\"ether1\"]",
	},

	"GATEWAY_TIMEOUT": {
		IssueCode:            "GATEWAY_TIMEOUT",
		Title:                "Network Latency Issue",
		Explanation:          "Your gateway is responding slowly. This may be a temporary ISP issue.",
		Confidence:           FixConfidenceLow,
		RequiresConfirmation: false,
		IsManualFix:          true,
		ManualSteps: []string{
			"Wait a few minutes and try again - this may be temporary",
			"Contact your ISP if the issue persists",
			"Check if other devices on your network are experiencing similar issues",
		},
	},

	"NO_INTERNET": {
		IssueCode:            "NO_INTERNET",
		Title:                "ISP Connection Issue",
		Explanation:          "Gateway is reachable but internet is not. This is likely an ISP issue.",
		Confidence:           FixConfidenceLow,
		RequiresConfirmation: false,
		IsManualFix:          true,
		ManualSteps: []string{
			"Contact your ISP support - there may be an outage in your area",
			"Check your ISP's status page for known issues",
			"Reboot your modem (if using one) and wait 2 minutes before testing again",
		},
	},

	"INTERNET_TIMEOUT": {
		IssueCode:            "INTERNET_TIMEOUT",
		Title:                "Slow Internet Connection",
		Explanation:          "Internet is reachable but very slow. This may be an ISP bandwidth issue.",
		Confidence:           FixConfidenceLow,
		RequiresConfirmation: false,
		IsManualFix:          true,
		ManualSteps: []string{
			"Run a speed test to confirm bandwidth",
			"Check if other devices are consuming bandwidth",
			"Contact your ISP if speeds are significantly below your plan",
		},
	},

	"DNS_FAILED": {
		IssueCode:            "DNS_FAILED",
		Title:                "Configure DNS Servers",
		Explanation:          "Your router needs to be configured with working DNS servers to resolve domain names.",
		Confidence:           FixConfidenceHigh,
		RequiresConfirmation: true,
		IsManualFix:          false,
		Command:              "/ip/dns/set servers=8.8.8.8,8.8.4.4",
	},

	"DNS_TIMEOUT": {
		IssueCode:            "DNS_TIMEOUT",
		Title:                "Slow DNS Resolution",
		Explanation:          "DNS is working but responding slowly. Switching to faster DNS servers may help.",
		Confidence:           FixConfidenceMedium,
		RequiresConfirmation: true,
		IsManualFix:          false,
		Command:              "/ip/dns/set servers=1.1.1.1,1.0.0.1",
	},

	"NAT_MISSING": {
		IssueCode:            "NAT_MISSING",
		Title:                "Add NAT Masquerade Rule",
		Explanation:          "Your router is missing a NAT masquerade rule. This is required for internet access from LAN devices.",
		Confidence:           FixConfidenceHigh,
		RequiresConfirmation: true,
		IsManualFix:          false,
		Command:              "/ip/firewall/nat/add chain=srcnat out-interface=ether1 action=masquerade",
		RollbackCommand:      "/ip/firewall/nat/remove [find where out-interface=\"ether1\" and action=masquerade]",
	},

	"NAT_DISABLED": {
		IssueCode:            "NAT_DISABLED",
		Title:                "Enable NAT Masquerade",
		Explanation:          "Your NAT masquerade rule is disabled. Enabling it will restore internet access for LAN devices.",
		Confidence:           FixConfidenceHigh,
		RequiresConfirmation: true,
		IsManualFix:          false,
		Command:              "/ip/firewall/nat/enable [find where action=masquerade]",
		RollbackCommand:      "/ip/firewall/nat/disable [find where action=masquerade]",
	},
}

// GetFix retrieves a fix suggestion by issue code.
func GetFix(issueCode string) *FixSuggestion {
	if fix, exists := FixRegistry[issueCode]; exists {
		return &fix
	}
	return nil
}
