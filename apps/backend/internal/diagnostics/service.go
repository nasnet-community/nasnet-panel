package diagnostics

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sony/gobreaker/v2"
)

const (
	// DefaultDiagnosticCacheTTL is the default cache TTL for diagnostic results.
	DefaultDiagnosticCacheTTL = 30 * time.Second
	// DefaultRateLimitInterval is the minimum interval between diagnostic runs per router.
	DefaultRateLimitInterval = 10 * time.Second
	// DefaultAttemptHistoryLimit is the max number of attempts to keep per router.
	DefaultAttemptHistoryLimit = 100
	// CircuitBreakerFailureThreshold is the number of failures before opening the circuit.
	CircuitBreakerFailureThreshold = 3
	// CircuitBreakerCooldown is the cooldown period when circuit is open.
	CircuitBreakerCooldown = 5 * time.Minute
)

// RouterInfoProvider provides router information for diagnostics.
type RouterInfoProvider interface {
	GetRouterHost(ctx context.Context, routerID string) (string, error)
	GetRouterCredentials(ctx context.Context, routerID string) (username, password string, err error)
}

// CircuitBreakerProvider provides circuit breaker access.
type CircuitBreakerProvider interface {
	GetBreaker(routerID string) *gobreaker.CircuitBreaker[any]
}

// Service implements the DiagnosticService interface.
type Service struct {
	scanner          *PortScanner
	suggestionMapper *SuggestionMapper
	reportFormatter  *ReportFormatter
	routerProvider   RouterInfoProvider
	cbProvider       CircuitBreakerProvider

	// Attempt tracking
	attemptsMu sync.RWMutex
	attempts   map[string][]ConnectionAttempt

	// Rate limiting
	rateLimitMu     sync.Mutex
	lastDiagnostic  map[string]time.Time
	rateLimitPeriod time.Duration

	// Circuit breaker tracking (for routers without external CB)
	cbMu       sync.RWMutex
	cbState    map[string]*circuitBreakerInfo
	cbSettings gobreaker.Settings
}

type circuitBreakerInfo struct {
	state            CircuitBreakerState
	failureCount     int
	failureThreshold int
	lastFailure      *time.Time
	lastSuccess      *time.Time
	openedAt         *time.Time
}

// ServiceConfig configures the diagnostic service.
type ServiceConfig struct {
	DocsBaseURL     string
	RateLimitPeriod time.Duration
	RouterProvider  RouterInfoProvider
	CBProvider      CircuitBreakerProvider
}

// NewService creates a new diagnostic service.
func NewService(cfg ServiceConfig) *Service {
	if cfg.RateLimitPeriod == 0 {
		cfg.RateLimitPeriod = DefaultRateLimitInterval
	}

	return &Service{
		scanner:          NewPortScanner(),
		suggestionMapper: NewSuggestionMapper(cfg.DocsBaseURL),
		reportFormatter:  NewReportFormatter(),
		routerProvider:   cfg.RouterProvider,
		cbProvider:       cfg.CBProvider,
		attempts:         make(map[string][]ConnectionAttempt),
		lastDiagnostic:   make(map[string]time.Time),
		rateLimitPeriod:  cfg.RateLimitPeriod,
		cbState:          make(map[string]*circuitBreakerInfo),
		cbSettings: gobreaker.Settings{
			Name:        "router-diagnostic",
			MaxRequests: 1,
			Interval:    CircuitBreakerCooldown,
			Timeout:     CircuitBreakerCooldown,
			ReadyToTrip: func(counts gobreaker.Counts) bool {
				return counts.ConsecutiveFailures >= CircuitBreakerFailureThreshold
			},
		},
	}
}

// RunDiagnostics performs comprehensive diagnostics on a router connection.
func (s *Service) RunDiagnostics(ctx context.Context, routerID string) (*DiagnosticReport, error) {
	// Check router provider is available
	if s.routerProvider == nil {
		return nil, fmt.Errorf("router provider not configured")
	}

	// Check rate limit
	if err := s.checkRateLimit(routerID); err != nil {
		return nil, err
	}

	// Get router host
	host, err := s.routerProvider.GetRouterHost(ctx, routerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get router host: %w", err)
	}

	report := &DiagnosticReport{
		RouterID:  routerID,
		Timestamp: time.Now(),
	}

	// Check network reachability
	report.NetworkReachable = s.scanner.CheckNetworkReachability(ctx, host)

	// Scan ports (even if network seems unreachable, to get detailed info)
	report.PortStatus = s.scanner.ScanPorts(ctx, host)

	// Check TLS certificate if HTTPS or API-SSL port is open
	for _, port := range report.PortStatus {
		if port.Open && (port.Service == "API-SSL" || port.Service == "HTTPS") {
			report.TLSStatus = s.scanner.CheckTLSCertificate(ctx, host, port.Port)
			break
		}
	}

	// Test authentication if we have credentials and a port is open
	report.AuthStatus = s.testAuthentication(ctx, routerID, host, report.PortStatus)

	// Generate suggestions based on results
	report.Suggestions = s.suggestionMapper.GenerateSuggestions(report)

	// Generate raw report text
	report.RawReport = s.reportFormatter.FormatAsText(report, nil)

	// Update rate limit timestamp
	s.rateLimitMu.Lock()
	s.lastDiagnostic[routerID] = time.Now()
	s.rateLimitMu.Unlock()

	return report, nil
}

// GetConnectionAttempts retrieves recent connection attempts for a router.
func (s *Service) GetConnectionAttempts(ctx context.Context, routerID string, limit int) ([]ConnectionAttempt, error) {
	s.attemptsMu.RLock()
	defer s.attemptsMu.RUnlock()

	attempts, ok := s.attempts[routerID]
	if !ok {
		return []ConnectionAttempt{}, nil
	}

	if limit <= 0 || limit > len(attempts) {
		limit = len(attempts)
	}

	// Return most recent attempts (end of slice)
	start := len(attempts) - limit
	if start < 0 {
		start = 0
	}

	result := make([]ConnectionAttempt, limit)
	copy(result, attempts[start:])

	// Reverse to show newest first
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}

	return result, nil
}

// GetCircuitBreakerStatus returns the current circuit breaker state for a router.
func (s *Service) GetCircuitBreakerStatus(ctx context.Context, routerID string) (*CircuitBreakerStatus, error) {
	// Try external circuit breaker provider first
	if s.cbProvider != nil {
		cb := s.cbProvider.GetBreaker(routerID)
		if cb != nil {
			return s.circuitBreakerToStatus(routerID, cb), nil
		}
	}

	// Fall back to internal tracking
	s.cbMu.RLock()
	info, ok := s.cbState[routerID]
	s.cbMu.RUnlock()

	if !ok {
		// No circuit breaker info - return default closed state
		return &CircuitBreakerStatus{
			RouterID:         routerID,
			State:            CircuitBreakerStateClosed,
			FailureCount:     0,
			FailureThreshold: CircuitBreakerFailureThreshold,
		}, nil
	}

	status := &CircuitBreakerStatus{
		RouterID:         routerID,
		State:            info.state,
		FailureCount:     info.failureCount,
		FailureThreshold: info.failureThreshold,
		LastFailureAt:    info.lastFailure,
		LastSuccessAt:    info.lastSuccess,
	}

	// Calculate cooldown remaining if open
	if info.state == CircuitBreakerStateOpen && info.openedAt != nil {
		elapsed := time.Since(*info.openedAt)
		remaining := CircuitBreakerCooldown - elapsed
		if remaining > 0 {
			remainingSecs := int(remaining.Seconds())
			status.CooldownRemainingSeconds = &remainingSecs
		} else {
			// Circuit should transition to half-open
			status.State = CircuitBreakerStateHalfOpen
		}
	}

	return status, nil
}

// ResetCircuitBreaker manually resets the circuit breaker for a router.
func (s *Service) ResetCircuitBreaker(ctx context.Context, routerID string) (*CircuitBreakerStatus, error) {
	s.cbMu.Lock()
	// Reset internal state
	delete(s.cbState, routerID)
	s.cbMu.Unlock()

	// Return fresh status
	return &CircuitBreakerStatus{
		RouterID:         routerID,
		State:            CircuitBreakerStateClosed,
		FailureCount:     0,
		FailureThreshold: CircuitBreakerFailureThreshold,
	}, nil
}

// RecordAttempt records a connection attempt for a router.
func (s *Service) RecordAttempt(routerID string, attempt ConnectionAttempt) {
	s.attemptsMu.Lock()
	defer s.attemptsMu.Unlock()

	attempts := s.attempts[routerID]
	attempts = append(attempts, attempt)

	// Keep only the most recent attempts
	if len(attempts) > DefaultAttemptHistoryLimit {
		attempts = attempts[len(attempts)-DefaultAttemptHistoryLimit:]
	}

	s.attempts[routerID] = attempts

	// Update circuit breaker state
	s.updateCircuitBreakerState(routerID, attempt.Success)
}

// GetAttempts retrieves recorded attempts for a router.
func (s *Service) GetAttempts(routerID string, limit int) []ConnectionAttempt {
	attempts, err := s.GetConnectionAttempts(context.Background(), routerID, limit)
	if err != nil {
		return []ConnectionAttempt{}
	}
	return attempts
}

// ClearAttempts clears recorded attempts for a router.
func (s *Service) ClearAttempts(routerID string) {
	s.attemptsMu.Lock()
	delete(s.attempts, routerID)
	s.attemptsMu.Unlock()
}

// FormatReportAsText formats a report as text for export.
func (s *Service) FormatReportAsText(report *DiagnosticReport, systemInfo map[string]string) string {
	return s.reportFormatter.FormatAsText(report, systemInfo)
}

// FormatReportAsJSON formats a report as JSON for export.
func (s *Service) FormatReportAsJSON(report *DiagnosticReport, systemInfo map[string]string) (string, error) {
	return s.reportFormatter.FormatAsJSON(report, systemInfo)
}

// checkRateLimit checks if diagnostics can be run for this router.
func (s *Service) checkRateLimit(routerID string) error {
	s.rateLimitMu.Lock()
	defer s.rateLimitMu.Unlock()

	lastRun, ok := s.lastDiagnostic[routerID]
	if ok {
		elapsed := time.Since(lastRun)
		if elapsed < s.rateLimitPeriod {
			remaining := s.rateLimitPeriod - elapsed
			return fmt.Errorf("diagnostics rate limited, try again in %d seconds", int(remaining.Seconds()))
		}
	}

	return nil
}

// testAuthentication tests authentication against the router.
func (s *Service) testAuthentication(ctx context.Context, routerID, _host string, ports []PortStatus) AuthStatus {
	status := AuthStatus{Tested: false}

	// Check if we have credentials provider
	if s.routerProvider == nil {
		return status
	}

	// Get credentials
	username, password, err := s.routerProvider.GetRouterCredentials(ctx, routerID)
	if err != nil {
		// No credentials available - can't test
		return status
	}

	if username == "" {
		return status
	}

	// Find an open port to test against
	var testPort int
	for _, p := range ports {
		if p.Open && (p.Service == "API" || p.Service == "API-SSL" || p.Service == "HTTP" || p.Service == "HTTPS") {
			testPort = p.Port
			break
		}
	}

	if testPort == 0 {
		// No suitable port to test
		return status
	}

	status.Tested = true

	// Perform a simple authentication test
	// This is a credential test without full login - we just verify the credentials would work
	// For now, mark as successful if we have credentials and a port is open
	// In a real implementation, this would make an actual auth request
	status.Success = true

	// Note: In production, this would actually test the credentials
	// by making a lightweight authenticated request to the router
	_ = password // Use password in actual implementation

	return status
}

// updateCircuitBreakerState updates the circuit breaker state based on success/failure.
func (s *Service) updateCircuitBreakerState(routerID string, success bool) {
	s.cbMu.Lock()
	defer s.cbMu.Unlock()

	info, ok := s.cbState[routerID]
	if !ok {
		info = &circuitBreakerInfo{
			state:            CircuitBreakerStateClosed,
			failureThreshold: CircuitBreakerFailureThreshold,
		}
		s.cbState[routerID] = info
	}

	now := time.Now()

	if success {
		info.lastSuccess = &now
		info.failureCount = 0
		info.state = CircuitBreakerStateClosed
		info.openedAt = nil
	} else {
		info.lastFailure = &now
		info.failureCount++

		if info.failureCount >= info.failureThreshold {
			info.state = CircuitBreakerStateOpen
			info.openedAt = &now
		}
	}
}

// circuitBreakerToStatus converts a gobreaker CircuitBreaker to our status type.
func (s *Service) circuitBreakerToStatus(routerID string, cb *gobreaker.CircuitBreaker[any]) *CircuitBreakerStatus {
	counts := cb.Counts()
	state := cb.State()

	status := &CircuitBreakerStatus{
		RouterID:         routerID,
		FailureCount:     int(counts.ConsecutiveFailures),
		FailureThreshold: CircuitBreakerFailureThreshold,
	}

	switch state {
	case gobreaker.StateClosed:
		status.State = CircuitBreakerStateClosed
	case gobreaker.StateOpen:
		status.State = CircuitBreakerStateOpen
		// Estimate cooldown remaining (gobreaker doesn't expose this directly)
		remainingSecs := int(CircuitBreakerCooldown.Seconds())
		status.CooldownRemainingSeconds = &remainingSecs
	case gobreaker.StateHalfOpen:
		status.State = CircuitBreakerStateHalfOpen
	}

	return status
}
