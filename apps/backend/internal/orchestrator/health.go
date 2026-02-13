package orchestrator

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"time"
)

// TCPHealthProbe checks if a TCP port is accepting connections
type TCPHealthProbe struct {
	name    string
	address string
	timeout time.Duration
}

// NewTCPHealthProbe creates a new TCP health probe
func NewTCPHealthProbe(name, address string, timeout time.Duration) *TCPHealthProbe {
	if timeout == 0 {
		timeout = 5 * time.Second
	}
	return &TCPHealthProbe{
		name:    name,
		address: address,
		timeout: timeout,
	}
}

// Check performs a TCP connection check
func (p *TCPHealthProbe) Check(ctx context.Context) error {
	dialer := net.Dialer{
		Timeout: p.timeout,
	}

	conn, err := dialer.DialContext(ctx, "tcp", p.address)
	if err != nil {
		return fmt.Errorf("TCP probe failed for %s: %w", p.address, err)
	}
	conn.Close()
	return nil
}

// Name returns the probe name
func (p *TCPHealthProbe) Name() string {
	return p.name
}

// HTTPHealthProbe checks if an HTTP endpoint returns a successful status code
type HTTPHealthProbe struct {
	name           string
	url            string
	timeout        time.Duration
	expectedStatus int // 0 means any 2xx status
	client         *http.Client
}

// NewHTTPHealthProbe creates a new HTTP health probe
func NewHTTPHealthProbe(name, url string, timeout time.Duration) *HTTPHealthProbe {
	if timeout == 0 {
		timeout = 5 * time.Second
	}

	return &HTTPHealthProbe{
		name:           name,
		url:            url,
		timeout:        timeout,
		expectedStatus: 0, // Accept any 2xx
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

// WithExpectedStatus sets a specific expected HTTP status code
func (p *HTTPHealthProbe) WithExpectedStatus(status int) *HTTPHealthProbe {
	p.expectedStatus = status
	return p
}

// Check performs an HTTP health check
func (p *HTTPHealthProbe) Check(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, p.url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("HTTP probe failed for %s: %w", p.url, err)
	}
	defer resp.Body.Close()

	// Check status code
	if p.expectedStatus > 0 {
		if resp.StatusCode != p.expectedStatus {
			return fmt.Errorf("unexpected status code: got %d, expected %d", resp.StatusCode, p.expectedStatus)
		}
	} else {
		// Accept any 2xx status code
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return fmt.Errorf("non-2xx status code: %d", resp.StatusCode)
		}
	}

	return nil
}

// Name returns the probe name
func (p *HTTPHealthProbe) Name() string {
	return p.name
}

// CompositeHealthProbe combines multiple health probes
type CompositeHealthProbe struct {
	name   string
	probes []HealthProbe
}

// NewCompositeHealthProbe creates a health probe that checks multiple probes
func NewCompositeHealthProbe(name string, probes ...HealthProbe) *CompositeHealthProbe {
	return &CompositeHealthProbe{
		name:   name,
		probes: probes,
	}
}

// Check performs all health checks (fails if any probe fails)
func (p *CompositeHealthProbe) Check(ctx context.Context) error {
	for _, probe := range p.probes {
		if err := probe.Check(ctx); err != nil {
			return fmt.Errorf("composite probe %s failed at %s: %w", p.name, probe.Name(), err)
		}
	}
	return nil
}

// Name returns the probe name
func (p *CompositeHealthProbe) Name() string {
	return p.name
}
