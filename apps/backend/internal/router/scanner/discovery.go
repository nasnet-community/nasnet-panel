package scanner

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"
)

const (
	httpProto  = "http"
	httpsProto = "https"
)

// RouterOSInfo represents information extracted from a RouterOS API response.
type RouterOSInfo struct {
	Version      string
	Architecture string
	BoardName    string
	Confidence   int
	IsValid      bool
}

// ValidateRouterOSResponse validates if the response body is from RouterOS.
func ValidateRouterOSResponse(body []byte) RouterOSInfo { //nolint:gocyclo // network discovery inherently complex
	var result RouterOSInfo

	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return result
	}

	confidence := 0

	routerOSFields := []string{
		"version", "version-string", "architecture", "architecture-name", "board-name",
		"cpu", "cpu-count", "cpu-frequency", "total-memory", "free-memory",
		"platform", "factory-software", "uptime",
	}

	presentFields := 0
	for _, field := range routerOSFields {
		if _, exists := data[field]; exists {
			presentFields++
			confidence += 10
		}
	}

	if version, ok := data["version"].(string); ok {
		result.Version = version
		if matched, err := regexp.MatchString(`^\d+\.\d+`, version); err == nil && matched {
			confidence += 20
		}
		if strings.Contains(strings.ToLower(version), "routeros") { //nolint:misspell // routeros is correct
			confidence += 30
		}
	} else if versionString, ok := data["version-string"].(string); ok {
		result.Version = versionString
		confidence += 15
	}

	if arch, ok := data["architecture"].(string); ok {
		result.Architecture = arch
		archLower := strings.ToLower(arch)
		if strings.Contains(archLower, "arm") || strings.Contains(archLower, "x86") || strings.Contains(archLower, "mips") {
			confidence += 15
		}
	} else if archName, ok := data["architecture-name"].(string); ok {
		result.Architecture = archName
		archLower := strings.ToLower(archName)
		if strings.Contains(archLower, "arm") || strings.Contains(archLower, "x86") || strings.Contains(archLower, "mips") {
			confidence += 15
		}
	}

	if boardName, ok := data["board-name"].(string); ok {
		result.BoardName = boardName
		confidence += 15
	}

	if platform, ok := data["platform"].(string); ok {
		if strings.Contains(strings.ToLower(platform), "mikrotik") {
			confidence += 25
		}
	}

	result.Confidence = confidence
	result.IsValid = presentFields >= 3 && confidence >= 40

	return result
}

// CheckRouterOSAPI attempts to verify if the device is actually running RouterOS.
func CheckRouterOSAPI(ctx context.Context, ip string, port int, timeout time.Duration) *RouterOSInfo {
	protocol := httpProto
	if port == 443 {
		protocol = httpsProto
	}

	url := fmt.Sprintf("%s://%s:%d/rest/system/resource", protocol, ip, port)

	client := &http.Client{
		Timeout: timeout,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec // required for router TLS connections
		},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, http.NoBody)
	if err != nil {
		return nil
	}
	req.SetBasicAuth("admin", "")

	resp, err := client.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	if resp.StatusCode == http.StatusOK {
		validation := ValidateRouterOSResponse(body)
		if validation.IsValid {
			return &validation
		}
		return nil
	}

	if resp.StatusCode == http.StatusUnauthorized { //nolint:nestif // RouterOS detection requires multi-level checks
		contentType := resp.Header.Get("Content-Type")

		if strings.Contains(strings.ToLower(contentType), "application/json") {
			bodyLower := strings.ToLower(string(body))
			if strings.Contains(bodyLower, "unauthorized") || strings.Contains(bodyLower, "error") {
				return &RouterOSInfo{IsValid: true, Confidence: 35}
			}
		}

		wwwAuth := resp.Header.Get("WWW-Authenticate")
		if strings.Contains(strings.ToLower(wwwAuth), "basic") {
			return &RouterOSInfo{IsValid: true, Confidence: 30}
		}

		return &RouterOSInfo{IsValid: true, Confidence: 25}
	}

	return nil
}

// ScanGatewayIP scans a single gateway IP specifically for RouterOS devices.
func ScanGatewayIP(ctx context.Context, ip string, ports []int, timeout time.Duration) *Device {
	var openPorts []int
	var services []string
	var routerOSInfo *RouterOSInfo

	for _, port := range ports {
		select {
		case <-ctx.Done():
			return nil
		default:
			if IsPortOpen(ctx, ip, port, timeout) {
				openPorts = append(openPorts, port)
				services = append(services, GetServiceName(port))

				if info := CheckRouterOSAPI(ctx, ip, port, timeout); info != nil {
					routerOSInfo = info
					break
				}
			}
		}
	}

	if routerOSInfo != nil && routerOSInfo.IsValid {
		hostname := ""
		if names, err := net.LookupAddr(ip); err == nil && len(names) > 0 {
			hostname = names[0]
		}

		mikrotikServices := make([]string, len(services))
		for i, service := range services {
			switch service {
			case "http":
				mikrotikServices[i] = "mikrotik-rest"
			case "https":
				mikrotikServices[i] = "mikrotik-rest-ssl"
			default:
				mikrotikServices[i] = service
			}
		}

		return &Device{
			IP:       ip,
			Hostname: hostname,
			Ports:    openPorts,
			Type:     "router",
			Vendor:   "MikroTik",
			Services: mikrotikServices,
		}
	}

	return nil
}

// GenerateGatewayIPs generates all 192.168.x.1 addresses (256 total).
func GenerateGatewayIPs() []string {
	var ips []string
	for i := 0; i <= 255; i++ {
		ip := fmt.Sprintf("192.168.%d.1", i)
		ips = append(ips, ip)
	}
	return ips
}

// ProcessGatewayScan executes automatic gateway scanning for 192.168.0-255.1.
func ProcessGatewayScan(ctx context.Context, cfg Config, resultFn func(Device)) {
	ips := GenerateGatewayIPs()
	totalIPs := len(ips)
	if totalIPs == 0 {
		return
	}

	jobs := make(chan string, cfg.MaxWorkers)
	results := make(chan Device, cfg.MaxWorkers)

	var wg sync.WaitGroup
	for i := 0; i < cfg.MaxWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for ip := range jobs {
				select {
				case <-ctx.Done():
					return
				default:
					if device := ScanGatewayIP(ctx, ip, HTTPAPIPorts, cfg.Timeout); device != nil {
						results <- *device
					}
				}
			}
		}()
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	go func() {
		for device := range results {
			if resultFn != nil {
				resultFn(device)
			}
		}
	}()

	go func() {
		defer close(jobs)
		for _, ip := range ips {
			select {
			case <-ctx.Done():
				return
			case jobs <- ip:
			}
		}
	}()

	wg.Wait()
}
