package diagnostics

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"backend/internal/router"
)

// RouteLookupDiagnostics provides network route and gateway detection.
type RouteLookupDiagnostics struct {
	routerPort router.RouterPort
}

// NewRouteLookupDiagnostics creates a new route lookup diagnostics instance.
func NewRouteLookupDiagnostics(routerPort router.RouterPort) *RouteLookupDiagnostics {
	return &RouteLookupDiagnostics{
		routerPort: routerPort,
	}
}

// DetectWanInterface detects the WAN interface from the default route.
func (d *RouteLookupDiagnostics) DetectWanInterface(ctx context.Context, routerID string) (string, error) {
	cmd := router.Command{
		Path:   "/ip/route",
		Action: "print",
		Query:  "where dst-address=0.0.0.0/0",
	}

	result, err := d.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to query routes: %w", err)
	}

	if len(result.Data) == 0 {
		return "", fmt.Errorf("no default route configured")
	}

	// Get interface from first default route
	iface := result.Data[0]["interface"]
	if iface == "" {
		return "", fmt.Errorf("default route has no interface")
	}

	return iface, nil
}

// DetectGateway detects the default gateway from DHCP client or static route.
func (d *RouteLookupDiagnostics) DetectGateway(ctx context.Context, routerID string) (string, error) {
	// Try DHCP client first
	cmd := router.Command{
		Path:   "/ip/dhcp-client",
		Action: "print",
		Query:  "where status=bound",
	}

	result, err := d.routerPort.ExecuteCommand(ctx, cmd)
	if err == nil && len(result.Data) > 0 {
		gateway := result.Data[0]["gateway"]
		if gateway != "" {
			return gateway, nil
		}
	}

	// Fallback to static route
	cmd = router.Command{
		Path:   "/ip/route",
		Action: "print",
		Query:  "where dst-address=0.0.0.0/0",
	}

	result, err = d.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to query routes: %w", err)
	}

	if len(result.Data) == 0 {
		return "", fmt.Errorf("no gateway found")
	}

	gateway := result.Data[0]["gateway"]
	if gateway == "" {
		return "", fmt.Errorf("no gateway in default route")
	}

	return gateway, nil
}

// DetectISP detects ISP information using ip-api.com.
func (d *RouteLookupDiagnostics) DetectISP(ctx context.Context, wanIP string) (*ISPInfo, error) {
	// Use ip-api.com for ISP detection (free tier)
	url := fmt.Sprintf("http://ip-api.com/json/%s?fields=isp,org", wanIP)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, http.NoBody)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ISP detection failed: status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var data struct {
		ISP string `json:"isp"`
		Org string `json:"org"`
	}

	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}

	ispName := data.ISP
	if ispName == "" {
		ispName = data.Org
	}

	if ispName == "" {
		return nil, fmt.Errorf("no ISP info found")
	}

	// Map to known ISP support info
	ispInfo := &ISPInfo{Name: ispName}
	normalized := normalizeISPName(ispName)

	// Known ISP support database (US-centric, can be expanded)
	supportDB := map[string]struct{ phone, url string }{
		"spectrum":    {phone: "1-833-267-6094", url: "https://www.spectrum.com/contact-us"},
		"comcast":     {phone: "1-800-934-6489", url: "https://www.xfinity.com/support"},
		"xfinity":     {phone: "1-800-934-6489", url: "https://www.xfinity.com/support"},
		"att":         {phone: "1-800-288-2020", url: "https://www.att.com/support/"},
		"verizon":     {phone: "1-800-837-4966", url: "https://www.verizon.com/support/"},
		"cox":         {phone: "1-800-234-3993", url: "https://www.cox.com/residential/support.html"},
		"centurylink": {phone: "1-800-244-1111", url: "https://www.centurylink.com/home/help.html"},
		"frontier":    {phone: "1-800-921-8101", url: "https://frontier.com/helpcenter"},
		"optimum":     {phone: "1-866-200-7273", url: "https://www.optimum.net/support/"},
	}

	if support, exists := supportDB[normalized]; exists {
		ispInfo.Phone = support.phone
		ispInfo.URL = support.url
	}

	return ispInfo, nil
}

// normalizeISPName normalizes ISP names for matching.
func normalizeISPName(name string) string {
	// Remove common suffixes and punctuation
	re := regexp.MustCompile(`[^a-z0-9]`)
	normalized := strings.ToLower(name)
	normalized = re.ReplaceAllString(normalized, "")
	normalized = strings.ReplaceAll(normalized, "communications", "")
	normalized = strings.ReplaceAll(normalized, "communication", "")
	normalized = strings.ReplaceAll(normalized, "telecom", "")
	normalized = strings.ReplaceAll(normalized, "corp", "")
	normalized = strings.ReplaceAll(normalized, "inc", "")
	normalized = strings.ReplaceAll(normalized, "llc", "")
	normalized = strings.ReplaceAll(normalized, "ltd", "")
	return normalized
}

// DetectNetworkConfig detects WAN interface, gateway, and ISP information.
func (d *RouteLookupDiagnostics) DetectNetworkConfig(ctx context.Context, routerID string) (*NetworkConfig, error) {
	config := &NetworkConfig{}

	// Detect WAN interface
	wanInterface, err := d.DetectWanInterface(ctx, routerID)
	if err != nil {
		return nil, err
	}
	config.WanInterface = wanInterface

	// Detect gateway
	gateway, err := d.DetectGateway(ctx, routerID)
	if err != nil {
		return nil, err
	}
	config.Gateway = gateway

	// Detect ISP (best effort)
	if config.Gateway != "" {
		ispInfo, err := d.DetectISP(ctx, config.Gateway)
		if err == nil {
			config.ISPInfo = ispInfo
		}
	}

	return config, nil
}
