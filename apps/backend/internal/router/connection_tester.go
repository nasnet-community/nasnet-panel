package router

import (
	"context"
	"fmt"
	"time"

	"backend/internal/network"
)

// ConnectionTester tests connections to routers with protocol fallback.
type ConnectionTester struct {
	dnsResolver  *network.DNSResolver
	timeout      time.Duration
	adapterCache *ProtocolCache
}

// ConnectionTesterConfig holds configuration for the connection tester.
type ConnectionTesterConfig struct {
	// DNSResolver for hostname resolution. Required.
	DNSResolver *network.DNSResolver

	// Timeout per protocol attempt. Defaults to 10 seconds.
	Timeout time.Duration

	// AdapterCache for caching successful protocols. Optional.
	AdapterCache *ProtocolCache
}

// ConnectionOptions contains options for testing a connection.
type ConnectionOptions struct {
	// Host is the router hostname or IP address.
	Host string

	// Port is the connection port. If 0, uses protocol default.
	Port int

	// Username for authentication.
	Username string

	// Password for authentication.
	Password string //nolint:gosec // G101: password field required for authentication

	// ProtocolPreference specifies which protocol to use.
	// If nil or AUTO, tries protocols in fallback order.
	ProtocolPreference *Protocol
}

// ConnectionTestResult contains the result of a connection test.
type ConnectionTestResult struct {
	// Success indicates whether the connection succeeded.
	Success bool

	// ProtocolUsed is the protocol that successfully connected.
	ProtocolUsed Protocol

	// ResponseTimeMs is the connection response time in milliseconds.
	ResponseTimeMs int

	// RouterInfo contains router details if connection succeeded.
	RouterInfo *RouterInfo

	// ProtocolsAttempted lists all protocols that were tried.
	ProtocolsAttempted []Protocol

	// Error contains connection error details if failed.
	Error *ConnectionError

	// ResolvedIP is the IP address used (after DNS resolution).
	ResolvedIP string

	// Capabilities detected from the router.
	Capabilities *PlatformCapabilities
}

// NewConnectionTester creates a new connection tester with the given configuration.
func NewConnectionTester(cfg ConnectionTesterConfig) *ConnectionTester {
	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 10 * time.Second
	}

	return &ConnectionTester{
		dnsResolver:  cfg.DNSResolver,
		timeout:      timeout,
		adapterCache: cfg.AdapterCache,
	}
}

// TestConnection tests connectivity to a router using the specified options.
// It handles DNS resolution, protocol fallback, and returns detailed results.
func (ct *ConnectionTester) TestConnection(ctx context.Context, opts ConnectionOptions) *ConnectionTestResult {
	result := &ConnectionTestResult{
		ProtocolsAttempted: make([]Protocol, 0),
	}

	// Step 1: Resolve hostname if needed
	host := opts.Host
	if !network.IsValidIP(host) {
		if ct.dnsResolver == nil {
			result.Error = NewDNSError(host, fmt.Errorf("DNS resolver not configured"))
			return result
		}
		dnsResult, err := ct.dnsResolver.Resolve(ctx, host)
		if err != nil {
			result.Error = NewDNSError(host, err)
			return result
		}
		host = dnsResult.PreferredIP.String()
	}
	result.ResolvedIP = host

	// Step 2: Determine protocol chain to try
	protocols := ct.getProtocolChain(opts.ProtocolPreference)

	// Step 3: Try each protocol in order
	startTime := time.Now()
	var lastError *ConnectionError

	for _, proto := range protocols {
		result.ProtocolsAttempted = append(result.ProtocolsAttempted, proto)

		port := opts.Port
		if port == 0 {
			port = proto.DefaultPort()
		}

		// Create context with per-protocol timeout
		protoCtx, cancel := context.WithTimeout(ctx, ct.timeout)

		protoResult, err := ct.tryProtocol(protoCtx, proto, host, port, opts.Username, opts.Password)
		cancel()

		if err == nil {
			// Success!
			result.Success = true
			result.ProtocolUsed = proto
			result.ResponseTimeMs = int(time.Since(startTime).Milliseconds())
			result.RouterInfo = protoResult.Info
			result.Capabilities = protoResult.Capabilities
			return result
		}

		// Classify and store the error
		lastError = ClassifyError(err, proto, host, port)

		// If it's an auth error, don't try other protocols
		if lastError.Code == ErrCodeAuthFailed {
			result.Error = lastError
			return result
		}
	}

	// All protocols failed
	if lastError != nil {
		result.Error = lastError
	} else {
		result.Error = NewProtocolMismatchError(result.ProtocolsAttempted)
	}

	return result
}

// protocolResult holds the result of trying a single protocol.
type protocolResult struct {
	Info         *RouterInfo
	Capabilities *PlatformCapabilities
}

// tryProtocol attempts to connect using a specific protocol.
func (ct *ConnectionTester) tryProtocol(ctx context.Context, proto Protocol, host string, port int, username, password string) (*protocolResult, error) {
	// Create adapter configuration
	cfg := AdapterConfig{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		Timeout:  int(ct.timeout.Seconds()),
	}

	// Create and test the adapter
	adapter, err := ct.createAdapter(proto, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create protocol adapter for %s: %w", proto.String(), err)
	}
	defer func() { _ = adapter.Disconnect() }() //nolint:errcheck // best effort disconnect

	// Attempt connection
	connectErr := adapter.Connect(ctx)
	if connectErr != nil {
		return nil, fmt.Errorf("failed to connect adapter: %w", connectErr)
	}

	// Get router info
	info, err := adapter.Info()
	if err != nil {
		return nil, fmt.Errorf("failed to get router info: %w", err)
	}

	// Get capabilities
	caps := adapter.Capabilities()

	return &protocolResult{
		Info:         info,
		Capabilities: &caps,
	}, nil
}

// createAdapter creates a protocol adapter for the given protocol.
func (ct *ConnectionTester) createAdapter(proto Protocol, cfg AdapterConfig) (RouterPort, error) {
	// This is a factory that creates the appropriate adapter.
	// The actual adapter implementations are in the adapters/ package.
	// For now, we return an error as adapters are created elsewhere.
	// In production, this would delegate to the adapter factory.
	return nil, fmt.Errorf("adapter creation not implemented in tester - use adapter factory")
}

// getProtocolChain returns the list of protocols to try in order.
func (ct *ConnectionTester) getProtocolChain(preference *Protocol) []Protocol {
	if preference != nil {
		// User specified a specific protocol
		return []Protocol{*preference}
	}

	// Default fallback chain: REST -> API -> API-SSL -> SSH -> Telnet
	return []Protocol{
		ProtocolREST,
		ProtocolAPI,
		ProtocolAPISSL,
		ProtocolSSH,
		ProtocolTelnet,
	}
}

// Note: AdapterConfig and AdapterFactory are defined in port.go and fallback_chain.go respectively.

// TestConnectionService provides a high-level interface for testing connections.
// It integrates with the resolver, adapter factory, and handles audit logging.
type TestConnectionService struct {
	adapterFactory AdapterFactory
	dnsResolver    *network.DNSResolver
	timeout        time.Duration
}

// TestConnectionServiceConfig holds configuration for the test connection service.
type TestConnectionServiceConfig struct {
	// DNSResolver for hostname resolution.
	DNSResolver *network.DNSResolver

	// AdapterFactory for creating protocol adapters.
	AdapterFactory AdapterFactory

	// Timeout per protocol attempt. Defaults to 10 seconds.
	Timeout time.Duration
}

// NewTestConnectionService creates a new test connection service.
func NewTestConnectionService(cfg TestConnectionServiceConfig) *TestConnectionService {
	timeout := cfg.Timeout
	if timeout == 0 {
		timeout = 10 * time.Second
	}

	return &TestConnectionService{
		adapterFactory: cfg.AdapterFactory,
		dnsResolver:    cfg.DNSResolver,
		timeout:        timeout,
	}
}

// Test performs a connection test with full protocol fallback and error handling.
func (s *TestConnectionService) Test(ctx context.Context, opts ConnectionOptions) *ConnectionTestResult {
	result := &ConnectionTestResult{
		ProtocolsAttempted: make([]Protocol, 0),
	}

	// Step 1: Resolve hostname if needed
	host := opts.Host
	if !network.IsValidIP(host) {
		if s.dnsResolver == nil {
			result.Error = NewDNSError(host, fmt.Errorf("DNS resolver not configured"))
			return result
		}
		dnsResult, err := s.dnsResolver.Resolve(ctx, host)
		if err != nil {
			result.Error = NewDNSError(host, err)
			return result
		}
		host = dnsResult.PreferredIP.String()
	}
	result.ResolvedIP = host

	// Step 2: Determine protocol chain
	protocols := s.getProtocolChain(opts.ProtocolPreference)

	// Step 3: Try each protocol
	startTime := time.Now()
	var lastError *ConnectionError

	for _, proto := range protocols {
		result.ProtocolsAttempted = append(result.ProtocolsAttempted, proto)

		port := opts.Port
		if port == 0 {
			port = proto.DefaultPort()
		}

		// Create adapter
		cfg := AdapterConfig{
			Host:     host,
			Port:     port,
			Username: opts.Username,
			Password: opts.Password,
			Timeout:  int(s.timeout.Seconds()),
		}

		adapter, err := s.adapterFactory(cfg, proto)
		if err != nil {
			lastError = ClassifyError(err, proto, host, port)
			continue
		}

		// Test connection with timeout
		protoCtx, cancel := context.WithTimeout(ctx, s.timeout)
		err = adapter.Connect(protoCtx)
		cancel()

		if err != nil {
			_ = adapter.Disconnect() //nolint:errcheck // best effort disconnect
			lastError = ClassifyError(err, proto, host, port)

			// Stop on auth errors
			if lastError.Code == ErrCodeAuthFailed {
				result.Error = lastError
				return result
			}
			continue
		}

		// Success - get router info
		info, infoErr := adapter.Info()
		caps := adapter.Capabilities()
		_ = adapter.Disconnect() //nolint:errcheck // best effort disconnect

		result.Success = true
		result.ProtocolUsed = proto
		result.ResponseTimeMs = int(time.Since(startTime).Milliseconds())
		if infoErr == nil {
			result.RouterInfo = info
		}
		result.Capabilities = &caps
		return result
	}

	// All protocols failed
	if lastError != nil {
		result.Error = lastError
	} else {
		result.Error = NewProtocolMismatchError(result.ProtocolsAttempted)
	}

	return result
}

// getProtocolChain returns the protocol fallback chain.
func (s *TestConnectionService) getProtocolChain(preference *Protocol) []Protocol {
	if preference != nil {
		return []Protocol{*preference}
	}
	return []Protocol{
		ProtocolREST,
		ProtocolAPI,
		ProtocolAPISSL,
		ProtocolSSH,
		ProtocolTelnet,
	}
}
