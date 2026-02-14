package push

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"backend/internal/notifications"
)

// NtfyChannel delivers notifications via ntfy.sh.
type NtfyChannel struct {
	config NtfyConfig
	client *http.Client
}

// NtfyConfig holds ntfy.sh configuration.
type NtfyConfig struct {
	ServerURL string `json:"server_url"`
	Topic     string `json:"topic"`
	Token     string `json:"token"`
}

// NewNtfyChannel creates a new ntfy.sh notification channel.
func NewNtfyChannel(config NtfyConfig) *NtfyChannel {
	if config.ServerURL == "" {
		config.ServerURL = "https://ntfy.sh"
	}

	return &NtfyChannel{
		config: config,
		client: &http.Client{
			Timeout: 10 * time.Second,
			Transport: &http.Transport{
				DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
					host, _, err := net.SplitHostPort(addr)
					if err != nil {
						return nil, fmt.Errorf("invalid address format: %w", err)
					}
					ips, err := net.LookupHost(host)
					if err != nil {
						return nil, fmt.Errorf("failed to resolve hostname: %w", err)
					}
					for _, ipStr := range ips {
						ip := net.ParseIP(ipStr)
						if ip == nil {
							return nil, fmt.Errorf("invalid IP address resolved: %s", ipStr)
						}
						if isPrivateIP(ip) {
							return nil, fmt.Errorf("SSRF protection: resolved IP %s is in a private/internal range", ipStr)
						}
					}
					dialer := &net.Dialer{
						Timeout:   30 * time.Second,
						KeepAlive: 30 * time.Second,
					}
					return dialer.DialContext(ctx, network, addr)
				},
			},
		},
	}
}

// Name returns the channel identifier.
func (n *NtfyChannel) Name() string { return "ntfy" }

// Send delivers a notification via ntfy.sh.
func (n *NtfyChannel) Send(ctx context.Context, notification notifications.Notification) error {
	if err := n.validateServerURL(n.config.ServerURL); err != nil {
		return fmt.Errorf("invalid ntfy server URL: %w", err)
	}

	topicURL := strings.TrimRight(n.config.ServerURL, "/") + "/" + n.config.Topic
	priority := n.getPriority(notification.Severity)

	payload := map[string]interface{}{
		"topic":    n.config.Topic,
		"title":    notification.Title,
		"message":  notification.Message,
		"priority": priority,
	}

	switch notification.Severity {
	case "CRITICAL":
		payload["tags"] = []string{"rotating_light", "alert"}
	case "WARNING":
		payload["tags"] = []string{"warning"}
	case "INFO":
		payload["tags"] = []string{"information_source"}
	}

	if notification.Data != nil {
		if alertID, ok := notification.Data["alert_id"].(string); ok && alertID != "" {
			payload["click"] = fmt.Sprintf("https://nasnet.local/alerts/%s", alertID)
		}
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", topicURL, strings.NewReader(string(jsonData)))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "NasNetConnect-Ntfy/1.0")

	if n.config.Token != "" {
		req.Header.Set("Authorization", "Bearer "+n.config.Token)
	}

	resp, err := n.client.Do(req)
	if err != nil {
		if ctx.Err() != nil {
			return fmt.Errorf("connection timeout: %w", err)
		}
		if strings.Contains(err.Error(), "SSRF protection") {
			return fmt.Errorf("security error: %w", err)
		}
		return fmt.Errorf("network error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errorResp struct {
			Error string `json:"error"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&errorResp)

		switch resp.StatusCode {
		case 400:
			return fmt.Errorf("invalid request: %s", errorResp.Error)
		case 401, 403:
			return fmt.Errorf("unauthorized: invalid bearer token")
		case 429:
			return fmt.Errorf("quota_exceeded: rate limit reached")
		case 500, 502, 503, 504:
			return fmt.Errorf("temporary server error: HTTP %d", resp.StatusCode)
		default:
			if errorResp.Error != "" {
				return fmt.Errorf("ntfy API error: %s", errorResp.Error)
			}
			return fmt.Errorf("ntfy API returned status %d", resp.StatusCode)
		}
	}

	return nil
}

func (n *NtfyChannel) getPriority(severity string) int {
	switch severity {
	case "CRITICAL":
		return 5
	case "WARNING":
		return 4
	default:
		return 3
	}
}

func (n *NtfyChannel) validateServerURL(urlStr string) error {
	parsedURL, err := url.Parse(urlStr)
	if err != nil {
		return fmt.Errorf("invalid URL format: %w", err)
	}
	if parsedURL.Scheme != "https" {
		return fmt.Errorf("only HTTPS protocol is allowed")
	}
	hostname := parsedURL.Hostname()
	if hostname == "" {
		return fmt.Errorf("URL must have a hostname")
	}
	if hostname == "localhost" || hostname == "127.0.0.1" || hostname == "::1" {
		return fmt.Errorf("localhost URLs are not allowed")
	}
	ips, err := net.LookupHost(hostname)
	if err != nil {
		return fmt.Errorf("failed to resolve hostname: %w", err)
	}
	if len(ips) == 0 {
		return fmt.Errorf("hostname does not resolve to any IP addresses")
	}
	for _, ipStr := range ips {
		ip := net.ParseIP(ipStr)
		if ip == nil {
			return fmt.Errorf("invalid IP address resolved: %s", ipStr)
		}
		if isPrivateIP(ip) {
			return fmt.Errorf("resolved IP %s is in a private/internal range", ipStr)
		}
	}
	return nil
}

// Test verifies the ntfy configuration by sending a test notification.
func (n *NtfyChannel) Test(ctx context.Context, config map[string]interface{}) error {
	ntfyConfig, err := ParseNtfyConfig(config)
	if err != nil {
		return fmt.Errorf("invalid ntfy configuration: %w", err)
	}

	originalConfig := n.config
	n.config = ntfyConfig
	defer func() { n.config = originalConfig }()

	testChannel := NewNtfyChannel(ntfyConfig)
	n.client = testChannel.client

	testNotification := notifications.Notification{
		Title:    "NasNetConnect Test",
		Message:  "ntfy.sh notifications are configured correctly!",
		Severity: "INFO",
	}
	return n.Send(ctx, testNotification)
}

// ParseNtfyConfig converts a map to NtfyConfig.
func ParseNtfyConfig(config map[string]interface{}) (NtfyConfig, error) {
	cfg := NtfyConfig{ServerURL: "https://ntfy.sh"}

	topic, ok := config["topic"].(string)
	if !ok || topic == "" {
		return cfg, fmt.Errorf("topic is required")
	}
	cfg.Topic = topic

	if serverURL, ok := config["server_url"].(string); ok && serverURL != "" {
		cfg.ServerURL = serverURL
	}
	if token, ok := config["token"].(string); ok {
		cfg.Token = token
	}
	return cfg, nil
}

// isPrivateIP checks if an IP address falls within private/internal ranges.
func isPrivateIP(ip net.IP) bool {
	privateCIDRs := []string{
		"127.0.0.0/8",
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
		"169.254.0.0/16",
		"::1/128",
		"fe80::/10",
	}
	for _, cidr := range privateCIDRs {
		_, ipNet, err := net.ParseCIDR(cidr)
		if err != nil {
			continue
		}
		if ipNet.Contains(ip) {
			return true
		}
	}
	return false
}
