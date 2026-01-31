package diagnostics

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"sync"
	"time"
)

const (
	// PortScanTimeout is the timeout for individual port scans.
	PortScanTimeout = 2 * time.Second
	// MaxConcurrentScans is the maximum number of concurrent port scans.
	MaxConcurrentScans = 10
	// PingTimeout is the timeout for network reachability checks.
	PingTimeout = 3 * time.Second
)

// PortScanner provides concurrent TCP port scanning capabilities.
type PortScanner struct {
	timeout    time.Duration
	maxWorkers int
}

// NewPortScanner creates a new port scanner with default settings.
func NewPortScanner() *PortScanner {
	return &PortScanner{
		timeout:    PortScanTimeout,
		maxWorkers: MaxConcurrentScans,
	}
}

// ScanPorts scans all standard MikroTik ports on the given host.
func (s *PortScanner) ScanPorts(ctx context.Context, host string) []PortStatus {
	var wg sync.WaitGroup
	results := make([]PortStatus, len(StandardPorts))
	resultChan := make(chan struct {
		index  int
		status PortStatus
	}, len(StandardPorts))

	// Use a semaphore to limit concurrent scans
	sem := make(chan struct{}, s.maxWorkers)

	for i, portInfo := range StandardPorts {
		wg.Add(1)
		go func(idx int, port int, service string) {
			defer wg.Done()

			// Acquire semaphore
			select {
			case sem <- struct{}{}:
				defer func() { <-sem }()
			case <-ctx.Done():
				resultChan <- struct {
					index  int
					status PortStatus
				}{idx, PortStatus{
					Port:    port,
					Service: service,
					Open:    false,
					Error:   ptrString("scan cancelled"),
				}}
				return
			}

			status := s.scanPort(ctx, host, port, service)
			resultChan <- struct {
				index  int
				status PortStatus
			}{idx, status}
		}(i, portInfo.Port, portInfo.Service)
	}

	// Close channel when all scans complete
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// Collect results
	for result := range resultChan {
		results[result.index] = result.status
	}

	return results
}

// scanPort performs a single port scan.
func (s *PortScanner) scanPort(ctx context.Context, host string, port int, service string) PortStatus {
	address := fmt.Sprintf("%s:%d", host, port)
	start := time.Now()

	// Create context with timeout
	scanCtx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	// Use a dialer with context
	var d net.Dialer
	conn, err := d.DialContext(scanCtx, "tcp", address)

	responseTime := int(time.Since(start).Milliseconds())

	if err != nil {
		errMsg := classifyPortError(err)
		return PortStatus{
			Port:    port,
			Service: service,
			Open:    false,
			Error:   &errMsg,
		}
	}
	defer conn.Close()

	return PortStatus{
		Port:           port,
		Service:        service,
		Open:           true,
		ResponseTimeMs: &responseTime,
	}
}

// CheckNetworkReachability verifies if the host is reachable via TCP.
// Uses TCP connection to port 80 or 443 as ICMP may be blocked.
func (s *PortScanner) CheckNetworkReachability(ctx context.Context, host string) bool {
	// Try common ports that indicate host is reachable
	testPorts := []int{80, 443, 8728, 22}

	scanCtx, cancel := context.WithTimeout(ctx, PingTimeout)
	defer cancel()

	for _, port := range testPorts {
		address := fmt.Sprintf("%s:%d", host, port)
		var d net.Dialer
		conn, err := d.DialContext(scanCtx, "tcp", address)
		if err == nil {
			conn.Close()
			return true
		}
		// Check if it's a connection refused (host is up but port is closed)
		if isConnectionRefused(err) {
			return true
		}
	}

	return false
}

// CheckTLSCertificate validates the TLS certificate on the given port.
func (s *PortScanner) CheckTLSCertificate(ctx context.Context, host string, port int) *TLSStatus {
	address := fmt.Sprintf("%s:%d", host, port)

	// Create TLS config that captures cert info even if invalid
	tlsConfig := &tls.Config{
		InsecureSkipVerify: true, // We'll verify manually to get full cert info
	}

	dialer := &net.Dialer{Timeout: s.timeout}
	conn, err := tls.DialWithDialer(dialer, "tcp", address, tlsConfig)
	if err != nil {
		errMsg := err.Error()
		return &TLSStatus{
			Valid: false,
			Error: &errMsg,
		}
	}
	defer conn.Close()

	// Get certificate info
	certs := conn.ConnectionState().PeerCertificates
	if len(certs) == 0 {
		errMsg := "no certificates presented"
		return &TLSStatus{
			Valid: false,
			Error: &errMsg,
		}
	}

	cert := certs[0]
	issuer := cert.Issuer.String()
	subject := cert.Subject.String()
	expiresAt := cert.NotAfter

	// Check if certificate is valid
	now := time.Now()
	valid := now.After(cert.NotBefore) && now.Before(cert.NotAfter)

	status := &TLSStatus{
		Valid:     valid,
		Issuer:    &issuer,
		Subject:   &subject,
		ExpiresAt: &expiresAt,
	}

	if !valid {
		var errMsg string
		if now.Before(cert.NotBefore) {
			errMsg = "certificate not yet valid"
		} else {
			errMsg = "certificate has expired"
		}
		status.Error = &errMsg
	}

	return status
}

// classifyPortError converts a network error to a user-friendly message.
func classifyPortError(err error) string {
	if netErr, ok := err.(net.Error); ok {
		if netErr.Timeout() {
			return "connection timeout"
		}
	}

	errStr := err.Error()
	if isConnectionRefused(err) {
		return "connection refused"
	}
	if contains(errStr, "no route to host") {
		return "no route to host"
	}
	if contains(errStr, "network is unreachable") {
		return "network unreachable"
	}
	if contains(errStr, "host is down") {
		return "host is down"
	}

	return "connection failed"
}

// isConnectionRefused checks if the error indicates connection refused.
func isConnectionRefused(err error) bool {
	if err == nil {
		return false
	}
	return contains(err.Error(), "connection refused") ||
		contains(err.Error(), "actively refused")
}

// contains checks if s contains substr (case-insensitive).
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr ||
		len(s) > 0 && containsLower(s, substr))
}

func containsLower(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if matchLower(s[i:i+len(substr)], substr) {
			return true
		}
	}
	return false
}

func matchLower(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := 0; i < len(a); i++ {
		ca, cb := a[i], b[i]
		if ca >= 'A' && ca <= 'Z' {
			ca += 'a' - 'A'
		}
		if cb >= 'A' && cb <= 'Z' {
			cb += 'a' - 'A'
		}
		if ca != cb {
			return false
		}
	}
	return true
}

// ptrString returns a pointer to the given string.
func ptrString(s string) *string {
	return &s
}

// ptrInt returns a pointer to the given int.
func ptrInt(i int) *int {
	return &i
}
