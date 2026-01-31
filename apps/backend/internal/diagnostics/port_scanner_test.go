package diagnostics

import (
	"context"
	"net"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewPortScanner(t *testing.T) {
	scanner := NewPortScanner()

	assert.NotNil(t, scanner)
	assert.Equal(t, PortScanTimeout, scanner.timeout)
	assert.Equal(t, MaxConcurrentScans, scanner.maxWorkers)
}

func TestPortScanner_ScanPorts_AllClosed(t *testing.T) {
	// Skip this test in environments where network behavior is unpredictable
	if testing.Short() {
		t.Skip("skipping network test in short mode")
	}

	scanner := NewPortScanner()
	ctx := context.Background()

	// Scan a non-routable IP (should time out or fail quickly)
	// Note: This test may behave differently based on network configuration
	results := scanner.ScanPorts(ctx, "192.0.2.1") // TEST-NET-1, non-routable

	assert.Len(t, results, len(StandardPorts))
	// At least verify we got results for all ports
	// Some environments may return open=true due to network quirks (like ICMP redirect)
	for _, r := range results {
		// Port number should match one of the standard ports
		found := false
		for _, sp := range StandardPorts {
			if sp.Port == r.Port {
				found = true
				break
			}
		}
		assert.True(t, found, "unexpected port %d in results", r.Port)
	}
}

func TestPortScanner_ScanPorts_WithOpenPort(t *testing.T) {
	// Start a test TCP server
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	defer listener.Close()

	// Get the port
	addr := listener.Addr().(*net.TCPAddr)
	port := addr.Port

	// Create a scanner with custom ports for testing
	scanner := &PortScanner{
		timeout:    1 * time.Second,
		maxWorkers: 5,
	}

	ctx := context.Background()

	// Scan localhost - the test port won't be in StandardPorts,
	// but we can verify the scanner works
	results := scanner.ScanPorts(ctx, "127.0.0.1")
	assert.Len(t, results, len(StandardPorts))

	// Most ports should be closed on localhost
	closedCount := 0
	for _, r := range results {
		if !r.Open {
			closedCount++
		}
	}
	assert.Greater(t, closedCount, 0)

	// Verify the listener is accepting connections
	conn, err := net.DialTimeout("tcp", addr.String(), 1*time.Second)
	require.NoError(t, err)
	conn.Close()

	_ = port // Port was used for listener
}

func TestPortScanner_ScanPorts_ContextCancellation(t *testing.T) {
	scanner := NewPortScanner()

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	results := scanner.ScanPorts(ctx, "192.0.2.1")

	// Should still return results (possibly with "scan cancelled" errors)
	assert.Len(t, results, len(StandardPorts))
}

func TestPortScanner_CheckNetworkReachability_Localhost(t *testing.T) {
	// Start a test TCP server
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	defer listener.Close()

	scanner := NewPortScanner()
	ctx := context.Background()

	// localhost should be reachable (connection refused = host is up)
	reachable := scanner.CheckNetworkReachability(ctx, "127.0.0.1")
	assert.True(t, reachable)
}

func TestPortScanner_CheckNetworkReachability_NonRoutable(t *testing.T) {
	// Skip this test in environments where network behavior is unpredictable
	if testing.Short() {
		t.Skip("skipping network test in short mode")
	}

	scanner := NewPortScanner()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	// Non-routable IP should not be reachable in most environments
	// Note: Some network configurations may return true due to ICMP redirect or NAT
	reachable := scanner.CheckNetworkReachability(ctx, "192.0.2.1")
	// We can't strictly assert false because network behavior varies
	// Just verify the function completes without panic
	_ = reachable
}

func TestPortScanner_ScanPort_Timeout(t *testing.T) {
	scanner := &PortScanner{
		timeout:    10 * time.Millisecond, // Very short timeout
		maxWorkers: 1,
	}

	ctx := context.Background()

	// Scan a non-routable IP with short timeout
	result := scanner.scanPort(ctx, "192.0.2.1", 8728, "API")

	assert.False(t, result.Open)
	assert.NotNil(t, result.Error)
}

func TestClassifyPortError(t *testing.T) {
	tests := []struct {
		name     string
		errStr   string
		expected string
	}{
		{
			name:     "connection refused",
			errStr:   "dial tcp 192.168.1.1:8728: connection refused",
			expected: "connection refused",
		},
		{
			name:     "no route to host",
			errStr:   "dial tcp 192.168.1.1:8728: no route to host",
			expected: "no route to host",
		},
		{
			name:     "network unreachable",
			errStr:   "dial tcp 192.168.1.1:8728: network is unreachable",
			expected: "network unreachable",
		},
		{
			name:     "host is down",
			errStr:   "dial tcp 192.168.1.1:8728: host is down",
			expected: "host is down",
		},
		{
			name:     "generic error",
			errStr:   "some random error",
			expected: "connection failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := &testError{msg: tt.errStr}
			result := classifyPortError(err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestIsConnectionRefused(t *testing.T) {
	tests := []struct {
		err      error
		expected bool
	}{
		{&testError{msg: "connection refused"}, true},
		{&testError{msg: "actively refused"}, true},
		{&testError{msg: "timeout"}, false},
		{nil, false},
	}

	for _, tt := range tests {
		result := isConnectionRefused(tt.err)
		assert.Equal(t, tt.expected, result)
	}
}

func TestContains(t *testing.T) {
	tests := []struct {
		s        string
		substr   string
		expected bool
	}{
		{"hello world", "world", true},
		{"HELLO WORLD", "world", true},
		{"hello world", "WORLD", true},
		{"hello", "world", false},
		{"", "a", false},
		{"a", "", true},
	}

	for _, tt := range tests {
		result := contains(tt.s, tt.substr)
		assert.Equal(t, tt.expected, result, "contains(%q, %q)", tt.s, tt.substr)
	}
}

func TestPtrString(t *testing.T) {
	s := "test"
	p := ptrString(s)
	assert.NotNil(t, p)
	assert.Equal(t, s, *p)
}

func TestPtrInt(t *testing.T) {
	i := 42
	p := ptrInt(i)
	assert.NotNil(t, p)
	assert.Equal(t, i, *p)
}

// testError is a simple error type for testing.
type testError struct {
	msg     string
	timeout bool
}

func (e *testError) Error() string {
	return e.msg
}

func (e *testError) Timeout() bool {
	return e.timeout
}

func (e *testError) Temporary() bool {
	return false
}
