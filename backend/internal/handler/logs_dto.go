package handler

import pkgRouteros "nasnet-panel/pkg/routeros"

type LogEntryResponse struct {
	ID      string `json:"id"`
	Time    string `json:"time"`
	Topic   string `json:"topic"`
	Level   string `json:"level"`
	Message string `json:"message"`
	Prefix  string `json:"prefix,omitempty"`
	Account string `json:"account,omitempty"`
	Count   int    `json:"count,omitempty"`
}

type GetLogsRequest struct {
	Limit    int    `query:"limit" default:"100"`
	Text     string `query:"text"`
	Topic    string `query:"topic"`
	Severity string `query:"severity"`
}

type GetLogsResponse struct {
	Count   int                `json:"count"`
	Entries []LogEntryResponse `json:"entries"`
	Topics  []string           `json:"availableTopics,omitempty"`
	Levels  []string           `json:"availableLevels,omitempty"`
}

type LogTopicInfo struct {
	Topic       string `json:"topic"`
	Description string `json:"description"`
}

func ToLogEntryResponse(entry pkgRouteros.LogEntry) LogEntryResponse {
	return LogEntryResponse{
		ID:      entry.ID,
		Time:    entry.Time,
		Topic:   entry.Topic,
		Level:   entry.Level,
		Message: entry.Message,
		Prefix:  entry.Prefix,
		Account: entry.Account,
		Count:   entry.Count,
	}
}

var TopicDescriptions = map[string]string{
	"critical": "Critical errors and system failures",
	"debug":    "Debug level messages for troubleshooting",
	"error":    "Error messages",
	"info":     "Informative messages",
	"packet":   "Packet contents from received/sent packets",
	"raw":      "Raw contents of received/sent packets",
	"warning":  "Warning messages",

	"account":     "User accounting facility messages",
	"async":       "Asynchronous devices messages",
	"backup":      "Backup creation facility messages",
	"bfd":         "BFD protocol messages",
	"bgp":         "BGP routing protocol messages",
	"bridge":      "Bridge/switching messages",
	"calc":        "Routing calculation messages",
	"caps":        "CAPsMAN wireless device management",
	"certificate": "Security certificate messages",
	"clock":       "Clock and time synchronization",
	"container":   "Container functionality messages",
	"ddns":        "Dynamic DNS messages",
	"dhcp":        "DHCP client, server and relay",
	"dns":         "DNS name server lookup",
	"dot1x":       "802.1X authentication",
	"dude":        "The Dude monitoring tool",
	"e-mail":      "E-mail tool messages",
	"event":       "Routing events",
	"firewall":    "Firewall rule log messages",
	"gps":         "GPS module messages",
	"gsm":         "GSM device messages",
	"health":      "Health monitoring messages",
	"hotspot":     "Hotspot authentication messages",
	"igmp-proxy":  "IGMP proxy messages",
	"interface":   "Interface changes",
	"ipsec":       "IPSec/VPN messages",
	"kvm":         "KVM virtual machine messages",
	"l2tp":        "L2TP tunnel messages",
	"lora":        "LoRa radio messages",
	"ldp":         "LDP routing protocol messages",
	"lte":         "LTE/4G modem messages",
	"manager":     "User Manager messages",
	"mme":         "MME routing protocol",
	"mqtt":        "MQTT messaging protocol",
	"mpls":        "MPLS protocol messages",
	"ntp":         "NTP time synchronization",
	"ospf":        "OSPF routing protocol messages",
	"ovpn":        "OpenVPN messages",
	"pim":         "Multicast PIM-SM",
	"ppp":         "PPP protocol messages",
	"pppoe":       "PPPoE server/client messages",
	"pptp":        "PPTP tunnel messages",
	"queue":       "Queue/traffic shaping",
	"radvd":       "IPv6 RA daemon",
	"radius":      "RADIUS authentication",
	"rip":         "RIP routing protocol messages",
	"route":       "Routing facility messages",
	"rsvp":        "RSVP reservation protocol",
	"script":      "Script execution messages",
	"smb":         "SMB file sharing",
	"snmp":        "SNMP protocol messages",
	"ssh":         "SSH session messages",
	"sstp":        "SSTP VPN messages",
	"system":      "Generic system messages",
	"store":       "Store facility messages",
	"state":       "DHCP client and routing state",
	"tftp":        "TFTP server messages",
	"timer":       "Timer related messages",
	"ups":         "UPS monitoring messages",
	"vrrp":        "VRRP protocol messages",
	"watchdog":    "Watchdog messages",
	"web-proxy":   "Web proxy messages",
	"wireless":    "Wireless interface messages",
}

var SeverityDescriptions = map[string]string{
	"critical": "Critical system failures and emergency alerts",
	"error":    "Error conditions that require attention",
	"warning":  "Warning conditions that may cause issues",
	"info":     "Informational messages about normal operations",
	"debug":    "Detailed debug information for troubleshooting",
}
