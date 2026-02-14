package health

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"runtime"
	"time"
)

// TCPProbe checks if a TCP port is accepting connections.
type TCPProbe struct {
	name    string
	address string
	timeout time.Duration
}

// NewTCPProbe creates a new TCP health probe.
func NewTCPProbe(name, address string, timeout time.Duration) *TCPProbe {
	if timeout == 0 {
		timeout = 5 * time.Second
	}
	return &TCPProbe{name: name, address: address, timeout: timeout}
}

// Check performs a TCP connection check.
func (p *TCPProbe) Check(ctx context.Context) error {
	dialer := net.Dialer{Timeout: p.timeout}
	conn, err := dialer.DialContext(ctx, "tcp", p.address)
	if err != nil {
		return fmt.Errorf("TCP probe failed for %s: %w", p.address, err)
	}
	conn.Close()
	return nil
}

// Name returns the probe name.
func (p *TCPProbe) Name() string { return p.name }

// HTTPProbe checks if an HTTP endpoint returns a successful status code.
type HTTPProbe struct {
	name           string
	url            string
	timeout        time.Duration
	expectedStatus int // 0 means any 2xx status
	client         *http.Client
}

// NewHTTPProbe creates a new HTTP health probe.
func NewHTTPProbe(name, url string, timeout time.Duration) *HTTPProbe {
	if timeout == 0 {
		timeout = 5 * time.Second
	}
	return &HTTPProbe{
		name:    name,
		url:     url,
		timeout: timeout,
		client:  &http.Client{Timeout: timeout},
	}
}

// WithExpectedStatus sets a specific expected HTTP status code.
func (p *HTTPProbe) WithExpectedStatus(status int) *HTTPProbe {
	p.expectedStatus = status
	return p
}

// Check performs an HTTP health check.
func (p *HTTPProbe) Check(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, p.url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("HTTP probe failed for %s: %w", p.url, err)
	}
	defer resp.Body.Close()

	if p.expectedStatus > 0 {
		if resp.StatusCode != p.expectedStatus {
			return fmt.Errorf("unexpected status code: got %d, expected %d", resp.StatusCode, p.expectedStatus)
		}
	} else {
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return fmt.Errorf("non-2xx status code: %d", resp.StatusCode)
		}
	}

	return nil
}

// Name returns the probe name.
func (p *HTTPProbe) Name() string { return p.name }

// ProcessProbe checks if a process with a given PID is alive.
type ProcessProbe struct {
	name string
	pid  int
}

// NewProcessProbe creates a new process health probe.
func NewProcessProbe(name string, pid int) *ProcessProbe {
	return &ProcessProbe{name: name, pid: pid}
}

// Check verifies if the process is still running.
func (p *ProcessProbe) Check(ctx context.Context) error {
	if p.pid <= 0 {
		return fmt.Errorf("invalid PID: %d", p.pid)
	}

	process, err := os.FindProcess(p.pid)
	if err != nil {
		return fmt.Errorf("process %d not found: %w", p.pid, err)
	}

	if runtime.GOOS == "windows" {
		// On Windows, os.FindProcess always succeeds.
		// A proper check requires Windows API (GetExitCodeProcess).
		// For now, trust FindProcess success.
		return nil
	}

	// On Unix, signal 0 checks if the process exists.
	err = process.Signal(os.Signal(nil))
	if err != nil {
		if err == os.ErrProcessDone {
			return fmt.Errorf("process %d has exited", p.pid)
		}
		return fmt.Errorf("process %d not running: %w", p.pid, err)
	}

	return nil
}

// Name returns the probe name.
func (p *ProcessProbe) Name() string { return p.name }

// UpdatePID updates the PID being monitored.
func (p *ProcessProbe) UpdatePID(newPID int) { p.pid = newPID }

// GetPID returns the currently monitored PID.
func (p *ProcessProbe) GetPID() int { return p.pid }

// CompositeProbe combines multiple health probes.
// All probes must pass for the composite to be healthy.
type CompositeProbe struct {
	name   string
	probes []Probe
}

// NewCompositeProbe creates a health probe that checks multiple probes.
func NewCompositeProbe(name string, probes ...Probe) *CompositeProbe {
	return &CompositeProbe{name: name, probes: probes}
}

// Check performs all health checks (fails if any probe fails).
func (p *CompositeProbe) Check(ctx context.Context) error {
	for _, probe := range p.probes {
		if err := probe.Check(ctx); err != nil {
			return fmt.Errorf("composite probe %s failed at %s: %w", p.name, probe.Name(), err)
		}
	}
	return nil
}

// Name returns the probe name.
func (p *CompositeProbe) Name() string { return p.name }
