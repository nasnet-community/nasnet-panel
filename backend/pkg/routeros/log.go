package routeros

import (
	"fmt"
	"sort"
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
		timeStr := result["time"]

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
			Time:    FormatLogTime(timeStr),
			Topic:   topic,
			Level:   level,
			Message: message,
			Prefix:  result["prefix"],
			Account: result["account"],
			Count:   count,
		}

		logs = append(logs, entry)
	}

	sort.Slice(logs, func(i, j int) bool {
		return logs[i].Time > logs[j].Time
	})

	// Limit after sorting to get the newest logs
	if len(logs) > filter.Limit {
		logs = logs[:filter.Limit]
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

// FormatLogTime formats log time entries to YYYY-MM-DD HH:MM:SS format
// Handles RouterOS log time formats:
// - "may/04 21:33:16" → "2026-05-04 21:33:16"
// - "02:11:27" → "2026-05-05 02:11:27" (adds today's date)
// - "sep/15/2025 00:47:41" → "2025-09-15 00:47:41"
func FormatLogTime(timeStr string) string {
	timeStr = strings.TrimSpace(timeStr)
	if timeStr == "" {
		return ""
	}

	parts := strings.Split(timeStr, " ")
	if len(parts) < 1 {
		return timeStr
	}

	monthMap := map[string]string{
		"jan": "01", "feb": "02", "mar": "03", "apr": "04",
		"may": "05", "jun": "06", "jul": "07", "aug": "08",
		"sep": "09", "oct": "10", "nov": "11", "dec": "12",
	}

	if len(parts) == 2 {
		// Has date and time
		dateParts := strings.Split(parts[0], "/")
		timeComponent := parts[1]

		if len(dateParts) == 3 {
			// Format: month/day/year time
			monthStr := strings.ToLower(dateParts[0])
			dayStr := dateParts[1]
			yearStr := dateParts[2]

			monthNum, ok := monthMap[monthStr]
			if !ok {
				return timeStr
			}

			dayInt, err := strconv.Atoi(dayStr)
			if err != nil {
				return timeStr
			}

			return fmt.Sprintf("%s-%s-%02d %s", yearStr, monthNum, dayInt, timeComponent)
		} else if len(dateParts) == 2 {
			// Format: month/day time (assume 2026)
			monthStr := strings.ToLower(dateParts[0])
			dayStr := dateParts[1]

			monthNum, ok := monthMap[monthStr]
			if !ok {
				return timeStr
			}

			dayInt, err := strconv.Atoi(dayStr)
			if err != nil {
				return timeStr
			}

			return fmt.Sprintf("2026-%s-%02d %s", monthNum, dayInt, timeComponent)
		}
	} else if len(parts) == 1 && isTimeOnly(parts[0]) {
		// Format: time only, add today's date (2026-05-05)
		return "2026-05-05 " + parts[0]
	}

	return timeStr
}

func isTimeOnly(s string) bool {
	parts := strings.Split(s, ":")
	if len(parts) != 3 {
		return false
	}
	for _, part := range parts {
		if _, err := strconv.Atoi(part); err != nil {
			return false
		}
	}
	return true
}
