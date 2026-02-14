package orchestrator

import (
	"context"
	"fmt"
	"net"
	"time"
)

// TorSOCKS5Test tests SOCKS5 proxy connectivity for Tor
type TorSOCKS5Test struct {
	BaseTest
	Host string
	Port int
}

// NewTorSOCKS5Test creates a SOCKS5 connectivity test for Tor
func NewTorSOCKS5Test(host string, port int) *TorSOCKS5Test {
	if host == "" {
		host = "127.0.0.1"
	}
	if port == 0 {
		port = 9050
	}

	return &TorSOCKS5Test{
		BaseTest: BaseTest{
			TestName:        "tor_socks5",
			TestDescription: "Test SOCKS5 proxy connectivity",
		},
		Host: host,
		Port: port,
	}
}

// Run executes the SOCKS5 test
func (t *TorSOCKS5Test) Run(ctx context.Context) DiagnosticResult {
	start := time.Now()

	// Create a timeout context
	testCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	addr := fmt.Sprintf("%s:%d", t.Host, t.Port)

	// Try to connect to SOCKS5 port
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

	// Send SOCKS5 handshake (version 5, 1 auth method, no auth)
	handshake := []byte{0x05, 0x01, 0x00}
	if _, err := conn.Write(handshake); err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to send SOCKS5 handshake",
			fmt.Sprintf("Error: %v", err),
			time.Since(start),
		)
	}

	// Read response (should be version 5, method 0)
	response := make([]byte, 2)
	conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	if _, err := conn.Read(response); err != nil {
		return t.newResult(
			DiagnosticStatusFail,
			"Failed to read SOCKS5 response",
			fmt.Sprintf("Error: %v", err),
			time.Since(start),
		)
	}

	// Verify SOCKS5 response
	if response[0] != 0x05 {
		return t.newResult(
			DiagnosticStatusFail,
			"Invalid SOCKS5 version in response",
			fmt.Sprintf("Expected: 0x05, Got: 0x%02x", response[0]),
			time.Since(start),
		)
	}

	if response[1] != 0x00 {
		return t.newResult(
			DiagnosticStatusWarning,
			"SOCKS5 authentication required",
			fmt.Sprintf("Auth method: 0x%02x", response[1]),
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

// TorControlPortTest tests Tor control port connectivity
type TorControlPortTest struct {
	BaseTest
	Host string
	Port int
}

// NewTorControlPortTest creates a control port test for Tor
func NewTorControlPortTest(host string, port int) *TorControlPortTest {
	if host == "" {
		host = "127.0.0.1"
	}
	if port == 0 {
		port = 9051
	}

	return &TorControlPortTest{
		BaseTest: BaseTest{
			TestName:        "tor_control_port",
			TestDescription: "Test Tor control port connectivity",
		},
		Host: host,
		Port: port,
	}
}

// Run executes the control port test
func (t *TorControlPortTest) Run(ctx context.Context) DiagnosticResult {
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
			DiagnosticStatusWarning,
			"Control port not accessible",
			fmt.Sprintf("Address: %s, Error: %v (this is normal if control port is disabled)", addr, err),
			time.Since(start),
		)
	}
	defer conn.Close()

	// Try to read Tor greeting
	response := make([]byte, 256)
	conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	n, err := conn.Read(response)
	if err != nil {
		// No greeting is expected, connection is enough
		return t.newResult(
			DiagnosticStatusPass,
			"Control port is accessible",
			fmt.Sprintf("Address: %s", addr),
			time.Since(start),
		)
	}

	return t.newResult(
		DiagnosticStatusPass,
		"Control port is accessible",
		fmt.Sprintf("Address: %s, Response: %d bytes", addr, n),
		time.Since(start),
	)
}

// NewTorDiagnosticSuite creates a complete diagnostic suite for Tor
func NewTorDiagnosticSuite(process *ManagedProcess, socksPort, controlPort int) *DiagnosticSuite {
	return &DiagnosticSuite{
		ServiceName: "tor",
		Tests: []DiagnosticTest{
			NewHealthTest(process),
			NewLogTest(process, 5),
			NewTorSOCKS5Test("127.0.0.1", socksPort),
			NewTorControlPortTest("127.0.0.1", controlPort),
		},
	}
}
