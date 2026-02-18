package health

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"time"

	"backend/internal/orchestrator/supervisor"
)

// Default localhost address for AdGuard Home diagnostics.
const defaultLocalhost = "127.0.0.1"

// AdGuardDNSTest tests DNS resolution through AdGuard Home
type AdGuardDNSTest struct {
	BaseTest
	Host string
	Port int
}

// NewAdGuardDNSTest creates a DNS resolution test for AdGuard Home
func NewAdGuardDNSTest(host string, port int) *AdGuardDNSTest {
	if host == "" {
		host = defaultLocalhost
	}
	if port == 0 {
		port = 53
	}

	return &AdGuardDNSTest{
		BaseTest: BaseTest{
			TestName:        "adguard_dns",
			TestDescription: "Test DNS resolution through AdGuard Home",
		},
		Host: host,
		Port: port,
	}
}

// Run executes the DNS test
func (t *AdGuardDNSTest) Run(ctx context.Context) DiagnosticResult {
	start := time.Now()

	testCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Create a custom resolver
	resolver := &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			d := net.Dialer{
				Timeout: 5 * time.Second,
			}
			return d.DialContext(ctx, "udp", fmt.Sprintf("%s:%d", t.Host, t.Port))
		},
	}

	// Try to resolve a test domain
	testDomain := "example.com"
	addrs, err := resolver.LookupHost(testCtx, testDomain)
	if err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"DNS resolution failed",
			fmt.Sprintf("Server: %s:%d, Domain: %s, Error: %v", t.Host, t.Port, testDomain, err),
			time.Since(start),
		)
	}

	if len(addrs) == 0 {
		return t.newResult(
			DiagnosticStatusFail,
			"DNS returned no results",
			fmt.Sprintf("Server: %s:%d, Domain: %s", t.Host, t.Port, testDomain),
			time.Since(start),
		)
	}

	return t.newResult(
		DiagnosticStatusPass,
		"DNS resolution successful",
		fmt.Sprintf("Server: %s:%d, Domain: %s, IPs: %v, Latency: %dms",
			t.Host, t.Port, testDomain, addrs, time.Since(start).Milliseconds()),
		time.Since(start),
	)
}

// AdGuardWebUITest tests AdGuard Home web UI accessibility
type AdGuardWebUITest struct {
	BaseTest
	Host string
	Port int
}

// NewAdGuardWebUITest creates a web UI test for AdGuard Home
func NewAdGuardWebUITest(host string, port int) *AdGuardWebUITest {
	if host == "" {
		host = defaultLocalhost
	}
	if port == 0 {
		port = 3000
	}

	return &AdGuardWebUITest{
		BaseTest: BaseTest{
			TestName:        "adguard_webui",
			TestDescription: "Test AdGuard Home web UI accessibility",
		},
		Host: host,
		Port: port,
	}
}

// Run executes the web UI test
func (t *AdGuardWebUITest) Run(ctx context.Context) DiagnosticResult {
	start := time.Now()

	testCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	url := fmt.Sprintf("http://%s/", net.JoinHostPort(t.Host, fmt.Sprintf("%d", t.Port)))

	req, err := http.NewRequestWithContext(testCtx, http.MethodGet, url, http.NoBody)
	if err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to create HTTP request",
			fmt.Sprintf("Error: %v", err),
			time.Since(start),
		)
	}

	client := &http.Client{
		Timeout: 5 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Allow redirects (AdGuard might redirect to /login)
			return nil
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to connect to web UI",
			fmt.Sprintf("URL: %s, Error: %v", url, err),
			time.Since(start),
		)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 500 {
		return t.newResult(
			DiagnosticStatusWarning,
			"Web UI returned unexpected status",
			fmt.Sprintf("URL: %s, Status: %d", url, resp.StatusCode),
			time.Since(start),
		)
	}

	return t.newResult(
		DiagnosticStatusPass,
		"Web UI is accessible",
		fmt.Sprintf("URL: %s, Status: %d, Latency: %dms", url, resp.StatusCode, time.Since(start).Milliseconds()),
		time.Since(start),
	)
}

// AdGuardAPITest tests AdGuard Home API endpoint
type AdGuardAPITest struct {
	BaseTest
	Host string
	Port int
}

// NewAdGuardAPITest creates an API test for AdGuard Home
func NewAdGuardAPITest(host string, port int) *AdGuardAPITest {
	if host == "" {
		host = defaultLocalhost
	}
	if port == 0 {
		port = 3000
	}

	return &AdGuardAPITest{
		BaseTest: BaseTest{
			TestName:        "adguard_api",
			TestDescription: "Test AdGuard Home API endpoint",
		},
		Host: host,
		Port: port,
	}
}

// Run executes the API test
func (t *AdGuardAPITest) Run(ctx context.Context) DiagnosticResult {
	start := time.Now()

	testCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// Test /status endpoint (usually doesn't require auth)
	url := fmt.Sprintf("http://%s/control/status", net.JoinHostPort(t.Host, fmt.Sprintf("%d", t.Port)))

	req, err := http.NewRequestWithContext(testCtx, http.MethodGet, url, http.NoBody)
	if err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to create API request",
			fmt.Sprintf("Error: %v", err),
			time.Since(start),
		)
	}

	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to connect to API",
			fmt.Sprintf("URL: %s, Error: %v", url, err),
			time.Since(start),
		)
	}
	defer resp.Body.Close()

	// 401 Unauthorized is also acceptable (means API is working but requires auth)
	if resp.StatusCode == http.StatusUnauthorized {
		return t.newResult(
			DiagnosticStatusPass,
			"API is responding (authentication required)",
			fmt.Sprintf("URL: %s, Status: %d", url, resp.StatusCode),
			time.Since(start),
		)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 500 {
		return t.newResult(
			DiagnosticStatusWarning,
			"API returned unexpected status",
			fmt.Sprintf("URL: %s, Status: %d", url, resp.StatusCode),
			time.Since(start),
		)
	}

	return t.newResult(
		DiagnosticStatusPass,
		"API is responding",
		fmt.Sprintf("URL: %s, Status: %d, Latency: %dms", url, resp.StatusCode, time.Since(start).Milliseconds()),
		time.Since(start),
	)
}

// NewAdGuardDiagnosticSuite creates a diagnostic suite for AdGuard Home
func NewAdGuardDiagnosticSuite(process *supervisor.ManagedProcess, dnsPort, webPort int) *DiagnosticSuite {
	return &DiagnosticSuite{
		ServiceName: "adguard",
		Tests: []DiagnosticTest{
			NewHealthTest(process),
			NewLogTest(process, 5),
			NewAdGuardDNSTest(defaultLocalhost, dnsPort),
			NewAdGuardWebUITest(defaultLocalhost, webPort),
			NewAdGuardAPITest(defaultLocalhost, webPort),
		},
	}
}
