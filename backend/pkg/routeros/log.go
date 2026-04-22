package routeros

import (
	"fmt"
	"strconv"
	"strings"
)

type LogEntry struct {
	ID      string `json:"id"`
	Time    string `json:"time"`
	Topic   string `json:"topic"`
	Level   string `json:"level"`
	Message string `json:"message"`
	Prefix  string `json:"prefix,omitempty"`
	Account string `json:"account,omitempty"`
	Count   int    `json:"count,omitempty"`
}

type LogFilter struct {
	Limit    int
	Text     string
	Topic    string
	Severity string
}

var AllLogTopics = []string{
	"critical", "debug", "error", "info", "packet", "raw", "warning",
	"account", "async", "backup", "bfd", "bgp", "bridge", "calc", "caps",
	"certificate", "client", "clock", "container", "ddns", "dhcp", "disk", "dns",
	"dot1x", "dude", "e-mail", "event", "evpn", "fetch", "firewall", "gps", "gsm",
	"health", "hotspot", "igmp-proxy", "interface", "ipsec", "iscsi", "isdn", "kvm",
	"l2tp", "lora", "ldp", "lte", "mme", "manager", "mqtt", "mpls", "mvrp",
	"natpmp", "netwatch", "ntp", "ospf", "ovpn", "pim", "poe-out", "ppp", "pppoe",
	"pptp", "ptp", "queue", "radvd", "radius", "read", "rip", "rsvp", "script",
	"sertcp", "simulator", "smb", "snmp", "socksify", "ssh", "sstp", "state", "store",
	"system", "telephony", "tftp", "timer", "tr069", "update", "upnp", "ups",
	"vpls", "vrrp", "watchdog", "web-proxy", "wiliot", "wireguard", "wireless",
	"write", "zerotier", "amt",
}

var AllLogLevels = []string{
	"debug", "info", "warning", "error", "critical",
}

// GetLogs retrieves log entries from RouterOS with optional filtering
//
// Parameters:
//   - limit: Maximum number of log entries to return (default 100, max 1000)
//   - text: Optional text to search in log messages (case-insensitive substring match)
//   - topic: Optional topic(s) to filter by (can be comma-separated)
//   - severity: Optional severity level to filter by (debug, info, warning, error, critical)
//
// Returns a slice of LogEntry and error
func (c *Client) GetLogs(filter LogFilter) ([]LogEntry, error) {
	if filter.Limit == 0 {
		filter.Limit = 100
	}

	if filter.Limit > 1000 {
		filter.Limit = 1000
	}

	results, err := c.GetAll("/log")
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve logs: %w", err)
	}

	var logs []LogEntry
	for _, result := range results {
		topic := result["topics"]
		message := result["message"]
		level := extractLogLevel(topic)

		if filter.Topic != "" {
			topics := strings.Split(strings.TrimSpace(filter.Topic), ",")
			topicMatched := false
			for _, t := range topics {
				t = strings.TrimSpace(t)
				if t != "" && strings.Contains(topic, t) {
					topicMatched = true
					break
				}
			}
			if !topicMatched {
				continue
			}
		}

		if filter.Severity != "" {
			if level != filter.Severity {
				continue
			}
		}

		if filter.Text != "" {
			if !strings.Contains(strings.ToLower(message), strings.ToLower(filter.Text)) {
				continue
			}
		}

		count := 0
		if countStr := result["count"]; countStr != "" {
			if c, err := parseCount(countStr); err == nil {
				count = c
			}
		}

		entry := LogEntry{
			ID:      result[".id"],
			Time:    result["time"],
			Topic:   topic,
			Level:   level,
			Message: message,
			Prefix:  result["prefix"],
			Account: result["account"],
			Count:   count,
		}

		logs = append(logs, entry)

		if len(logs) >= filter.Limit {
			break
		}
	}

	return logs, nil
}

func extractLogLevel(topicStr string) string {
	topicStr = strings.ToLower(topicStr)

	if strings.Contains(topicStr, "critical") {
		return "critical"
	}
	if strings.Contains(topicStr, "error") {
		return "error"
	}
	if strings.Contains(topicStr, "warning") {
		return "warning"
	}
	if strings.Contains(topicStr, "debug") {
		return "debug"
	}
	return "info"
}

func (c *Client) GetRecentLogs(limit int) ([]LogEntry, error) {
	if limit <= 0 {
		limit = 50
	}
	return c.GetLogs(LogFilter{Limit: limit})
}

func (c *Client) SearchLogs(searchText string, limit int) ([]LogEntry, error) {
	if limit <= 0 {
		limit = 100
	}
	return c.GetLogs(LogFilter{
		Limit: limit,
		Text:  searchText,
	})
}

func (c *Client) GetLogsByTopic(topic string, limit int) ([]LogEntry, error) {
	if limit <= 0 {
		limit = 100
	}
	return c.GetLogs(LogFilter{
		Limit: limit,
		Topic: topic,
	})
}

func (c *Client) GetLogsBySeverity(severity string, limit int) ([]LogEntry, error) {
	if limit <= 0 {
		limit = 100
	}
	return c.GetLogs(LogFilter{
		Limit:    limit,
		Severity: severity,
	})
}

func parseCount(countStr string) (int, error) {
	return strconv.Atoi(strings.TrimSpace(countStr))
}
