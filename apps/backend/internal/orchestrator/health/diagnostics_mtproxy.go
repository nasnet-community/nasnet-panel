package health

import (
	"context"
	"fmt"
	"net"
	"time"

	"backend/internal/orchestrator/supervisor"
)

// MTProxyPortTest tests MTProxy port connectivity
type MTProxyPortTest struct {
	BaseTest
	Host string
	Port int
}

// NewMTProxyPortTest creates a port connectivity test for MTProxy
func NewMTProxyPortTest(host string, port int) *MTProxyPortTest {
	if host == "" {
		host = "0.0.0.0"
	}
	if port == 0 {
		port = 443
	}

	return &MTProxyPortTest{
		BaseTest: BaseTest{
			TestName:        "mtproxy_port",
			TestDescription: "Test MTProxy port connectivity",
		},
		Host: host,
		Port: port,
	}
}

// Run executes the port test
func (t *MTProxyPortTest) Run(ctx context.Context) DiagnosticResult {
	start := time.Now()

	testCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	// MTProxy typically listens on 0.0.0.0, test on localhost
	testHost := defaultLocalhost
	addr := fmt.Sprintf("%s:%d", testHost, t.Port)

	dialer := &net.Dialer{
		Timeout: 5 * time.Second,
	}

	conn, err := dialer.DialContext(testCtx, "tcp", addr)
	if err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to connect to MTProxy port",
			fmt.Sprintf("Address: %s, Error: %v", addr, err),
			time.Since(start),
		)
	}
	defer conn.Close()

	// MTProxy doesn't have a handshake protocol we can easily test
	// Just verify the connection works
	return t.newResult(
		DiagnosticStatusPass,
		"MTProxy port is listening",
		fmt.Sprintf("Address: %s, Latency: %dms", addr, time.Since(start).Milliseconds()),
		time.Since(start),
	)
}

// MTProxyStatsTest tests MTProxy stats endpoint
type MTProxyStatsTest struct {
	BaseTest
	Host string
	Port int
}

// NewMTProxyStatsTest creates a stats endpoint test for MTProxy
func NewMTProxyStatsTest(host string, port int) *MTProxyStatsTest {
	if host == "" {
		host = defaultLocalhost
	}
	if port == 0 {
		port = 8888
	}

	return &MTProxyStatsTest{
		BaseTest: BaseTest{
			TestName:        "mtproxy_stats",
			TestDescription: "Test MTProxy stats endpoint",
		},
		Host: host,
		Port: port,
	}
}

// Run executes the stats test
func (t *MTProxyStatsTest) Run(ctx context.Context) DiagnosticResult {
	start := time.Now()

	testCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	addr := fmt.Sprintf("%s:%d", t.Host, t.Port)

	dialer := &net.Dialer{
		Timeout: 5 * time.Second,
	}

	conn, err := dialer.DialContext(testCtx, "tcp", addr)
	if err != nil {
		// Stats endpoint might not be enabled
		return t.newResult(
			DiagnosticStatusWarning,
			"Stats endpoint not accessible",
			fmt.Sprintf("Address: %s, Error: %v (this is normal if stats are disabled)", addr, err),
			time.Since(start),
		)
	}
	defer conn.Close()

	return t.newResult(
		DiagnosticStatusPass,
		"Stats endpoint is accessible",
		fmt.Sprintf("Address: %s", addr),
		time.Since(start),
	)
}

// NewMTProxyDiagnosticSuite creates a diagnostic suite for MTProxy
func NewMTProxyDiagnosticSuite(process *supervisor.ManagedProcess, proxyPort, statsPort int) *DiagnosticSuite {
	return &DiagnosticSuite{
		ServiceName: "mtproxy",
		Tests: []DiagnosticTest{
			NewHealthTest(process),
			NewLogTest(process, 5),
			NewMTProxyPortTest("0.0.0.0", proxyPort),
			NewMTProxyStatsTest("127.0.0.1", statsPort),
		},
	}
}
