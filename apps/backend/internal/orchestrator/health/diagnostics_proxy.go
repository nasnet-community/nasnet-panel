package health

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"time"

	"backend/internal/orchestrator/supervisor"
)

// ProxySOCKS5Test tests SOCKS5 proxy connectivity for sing-box/Xray
type ProxySOCKS5Test struct {
	BaseTest
	Host string
	Port int
}

// NewProxySOCKS5Test creates a SOCKS5 connectivity test
func NewProxySOCKS5Test(serviceName, host string, port int) *ProxySOCKS5Test {
	if host == "" {
		host = defaultLocalhost
	}

	return &ProxySOCKS5Test{
		BaseTest: BaseTest{
			TestName:        fmt.Sprintf("%s_socks5", serviceName),
			TestDescription: "Test SOCKS5 proxy connectivity",
		},
		Host: host,
		Port: port,
	}
}

// Run executes the SOCKS5 test
func (t *ProxySOCKS5Test) Run(ctx context.Context) DiagnosticResult {
	start := time.Now()

	testCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	addr := fmt.Sprintf("%s:%d", t.Host, t.Port)

	dialer := &net.Dialer{
		Timeout: 5 * time.Second,
	}

	conn, err := dialer.DialContext(testCtx, "tcp", addr)
	if err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to connect to SOCKS5 port",
			fmt.Sprintf("Address: %s, Error: %v", addr, err),
			time.Since(start),
		)
	}
	defer conn.Close()

	// Send SOCKS5 handshake
	handshake := []byte{0x05, 0x01, 0x00}
	if _, err := conn.Write(handshake); err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to send SOCKS5 handshake",
			fmt.Sprintf("Error: %v", err),
			time.Since(start),
		)
	}

	// Read response
	response := make([]byte, 2)
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second)) //nolint:errcheck // deadline error is non-critical for diagnostic probe
	if _, err := conn.Read(response); err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to read SOCKS5 response",
			fmt.Sprintf("Error: %v", err),
			time.Since(start),
		)
	}

	if response[0] != 0x05 {
		return t.newResult(
			DiagnosticStatusFail,
			"Invalid SOCKS5 version",
			fmt.Sprintf("Expected: 0x05, Got: 0x%02x", response[0]),
			time.Since(start),
		)
	}

	return t.newResult(
		DiagnosticStatusPass,
		"SOCKS5 proxy is responding",
		fmt.Sprintf("Address: %s, Latency: %dms", addr, time.Since(start).Milliseconds()),
		time.Since(start),
	)
}

// ProxyHTTPTest tests HTTP proxy connectivity
type ProxyHTTPTest struct {
	BaseTest
	Host string
	Port int
}

// NewProxyHTTPTest creates an HTTP proxy connectivity test
func NewProxyHTTPTest(serviceName, host string, port int) *ProxyHTTPTest {
	if host == "" {
		host = defaultLocalhost
	}

	return &ProxyHTTPTest{
		BaseTest: BaseTest{
			TestName:        fmt.Sprintf("%s_http", serviceName),
			TestDescription: "Test HTTP proxy connectivity",
		},
		Host: host,
		Port: port,
	}
}

// Run executes the HTTP test
func (t *ProxyHTTPTest) Run(ctx context.Context) DiagnosticResult {
	start := time.Now()

	testCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	addr := fmt.Sprintf("%s:%d", t.Host, t.Port)

	// Try to connect to HTTP port
	dialer := &net.Dialer{
		Timeout: 5 * time.Second,
	}

	conn, dialErr := dialer.DialContext(testCtx, "tcp", addr)
	if dialErr != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to connect to HTTP port",
			fmt.Sprintf("Address: %s, Error: %v", addr, dialErr),
			time.Since(start),
		)
	}
	defer conn.Close()

	// Send HTTP CONNECT request
	request := "CONNECT example.com:80 HTTP/1.1\r\nHost: example.com:80\r\n\r\n"
	if _, err := conn.Write([]byte(request)); err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to send HTTP CONNECT",
			fmt.Sprintf("Error: %v", err),
			time.Since(start),
		)
	}

	// Read response
	response := make([]byte, 1024)
	_ = conn.SetReadDeadline(time.Now().Add(2 * time.Second)) //nolint:errcheck // deadline error is non-critical for diagnostic probe
	n, err := conn.Read(response)
	if err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to read HTTP response",
			fmt.Sprintf("Error: %v", err),
			time.Since(start),
		)
	}

	// Check for HTTP response
	responseStr := string(response[:n])
	if responseStr != "" && (responseStr[:4] == "HTTP" || responseStr[:4] == "http") {
		return t.newResult(
			DiagnosticStatusPass,
			"HTTP proxy is responding",
			fmt.Sprintf("Address: %s, Latency: %dms", addr, time.Since(start).Milliseconds()),
			time.Since(start),
		)
	}

	return t.newResult(
		DiagnosticStatusWarning,
		"Received unexpected HTTP response",
		fmt.Sprintf("Response: %s", responseStr),
		time.Since(start),
	)
}

// ProxyAPITest tests API endpoint connectivity (for sing-box/Xray)
type ProxyAPITest struct {
	BaseTest
	Host string
	Port int
}

// NewProxyAPITest creates an API connectivity test
func NewProxyAPITest(serviceName, host string, port int) *ProxyAPITest {
	if host == "" {
		host = defaultLocalhost
	}

	return &ProxyAPITest{
		BaseTest: BaseTest{
			TestName:        fmt.Sprintf("%s_api", serviceName),
			TestDescription: "Test API endpoint connectivity",
		},
		Host: host,
		Port: port,
	}
}

// Run executes the API test
func (t *ProxyAPITest) Run(ctx context.Context) DiagnosticResult {
	start := time.Now()

	testCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	url := fmt.Sprintf("http://%s/", net.JoinHostPort(t.Host, fmt.Sprintf("%d", t.Port)))

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
		// API might not be enabled, this is a warning not a failure
		return t.newResult(
			DiagnosticStatusWarning,
			"API endpoint not accessible",
			fmt.Sprintf("URL: %s, Error: %v (this is normal if API is disabled)", url, err),
			time.Since(start),
		)
	}
	defer resp.Body.Close()

	return t.newResult(
		DiagnosticStatusPass,
		"API endpoint is accessible",
		fmt.Sprintf("URL: %s, Status: %d", url, resp.StatusCode),
		time.Since(start),
	)
}

// NewSingBoxDiagnosticSuite creates a diagnostic suite for sing-box
func NewSingBoxDiagnosticSuite(process *supervisor.ManagedProcess, socksPort, httpPort, apiPort int) *DiagnosticSuite {
	tests := []DiagnosticTest{
		NewHealthTest(process),
		NewLogTest(process, 5),
	}

	if socksPort > 0 {
		tests = append(tests, NewProxySOCKS5Test("singbox", defaultLocalhost, socksPort))
	}
	if httpPort > 0 {
		tests = append(tests, NewProxyHTTPTest("singbox", defaultLocalhost, httpPort))
	}
	if apiPort > 0 {
		tests = append(tests, NewProxyAPITest("singbox", defaultLocalhost, apiPort))
	}

	return &DiagnosticSuite{
		ServiceName: "singbox",
		Tests:       tests,
	}
}

// NewXrayDiagnosticSuite creates a diagnostic suite for Xray
func NewXrayDiagnosticSuite(process *supervisor.ManagedProcess, socksPort, httpPort, apiPort int) *DiagnosticSuite {
	tests := []DiagnosticTest{
		NewHealthTest(process),
		NewLogTest(process, 5),
	}

	if socksPort > 0 {
		tests = append(tests, NewProxySOCKS5Test("xray", defaultLocalhost, socksPort))
	}
	if httpPort > 0 {
		tests = append(tests, NewProxyHTTPTest("xray", defaultLocalhost, httpPort))
	}
	if apiPort > 0 {
		tests = append(tests, NewProxyAPITest("xray", defaultLocalhost, apiPort))
	}

	return &DiagnosticSuite{
		ServiceName: "xray",
		Tests:       tests,
	}
}
