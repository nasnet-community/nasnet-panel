package troubleshoot

import (
	"backend/internal/router"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// Service provides internet troubleshooting operations.
type Service struct {
	sessionStore *SessionStore
	routerPort   router.RouterPort
}

// NewService creates a new troubleshooting service.
func NewService(routerPort router.RouterPort) *Service {
	return &Service{
		sessionStore: NewSessionStore(),
		routerPort:   routerPort,
	}
}

// StartTroubleshoot creates a new troubleshooting session and detects network configuration.
func (s *Service) StartTroubleshoot(ctx context.Context, routerID string) (*Session, error) {
	// Create session
	session, err := s.sessionStore.Create(routerID)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	// Update status to initializing
	session.Status = SessionStatusInitializing
	if err := s.sessionStore.Update(session); err != nil {
		return nil, err
	}

	// Detect network configuration
	config, err := s.DetectNetworkConfig(ctx, routerID)
	if err != nil {
		// Continue with defaults if detection fails
		session.WanInterface = "ether1"
		session.Gateway = ""
	} else {
		session.WanInterface = config.WanInterface
		session.Gateway = config.Gateway
		session.ISPInfo = config.ISPInfo
	}

	// Update session status to running
	session.Status = SessionStatusRunning
	if err := s.sessionStore.Update(session); err != nil {
		return nil, err
	}

	return session, nil
}

// GetSession retrieves a troubleshooting session by ID.
func (s *Service) GetSession(ctx context.Context, sessionID string) (*Session, error) {
	return s.sessionStore.Get(sessionID)
}

// RunTroubleshootStep executes a specific diagnostic step.
func (s *Service) RunTroubleshootStep(ctx context.Context, sessionID string, stepType StepType) (*Step, error) {
	// Get session
	session, err := s.sessionStore.Get(sessionID)
	if err != nil {
		return nil, err
	}

	// Find the step
	var step *Step
	for _, s := range session.Steps {
		if s.ID == stepType {
			step = s
			break
		}
	}
	if step == nil {
		return nil, fmt.Errorf("step not found: %s", stepType)
	}

	// Mark step as running
	step.Status = StepStatusRunning
	now := time.Now()
	step.StartedAt = &now
	if err := s.sessionStore.Update(session); err != nil {
		return nil, err
	}

	// Execute the diagnostic check
	result, err := s.executeDiagnosticCheck(ctx, session.RouterID, stepType, session.WanInterface, session.Gateway)
	if err != nil {
		step.Status = StepStatusFailed
		step.Result = &StepResult{
			Success:         false,
			Message:         fmt.Sprintf("Diagnostic failed: %s", err.Error()),
			ExecutionTimeMs: 0,
		}
	} else {
		step.Result = result
		if result.Success {
			step.Status = StepStatusPassed
		} else {
			step.Status = StepStatusFailed
			// Add fix suggestion if available
			step.Fix = GetFix(result.IssueCode)
		}
	}

	// Mark step as completed
	completedAt := time.Now()
	step.CompletedAt = &completedAt
	if err := s.sessionStore.Update(session); err != nil {
		return nil, err
	}

	return step, nil
}

// ApplyTroubleshootFix applies a fix for a failed diagnostic step.
func (s *Service) ApplyTroubleshootFix(ctx context.Context, sessionID string, issueCode string) (bool, string, FixApplicationStatus, error) {
	// Get session
	session, err := s.sessionStore.Get(sessionID)
	if err != nil {
		return false, "", FixStatusFailed, err
	}

	// Get fix suggestion
	fix := GetFix(issueCode)
	if fix == nil {
		return false, "Fix not found", FixStatusFailed, fmt.Errorf("no fix available for issue: %s", issueCode)
	}

	// Manual fixes cannot be applied
	if fix.IsManualFix || fix.Command == "" {
		return false, "This fix requires manual intervention", FixStatusFailed, nil
	}

	// Update session status
	session.Status = SessionStatusApplyingFix
	if err := s.sessionStore.Update(session); err != nil {
		return false, "", FixStatusFailed, err
	}

	// Execute the fix command
	success, message, err := s.executeFixCommand(ctx, session.RouterID, fix.Command)
	if err != nil {
		return false, message, FixStatusFailed, err
	}

	if success {
		// Add to applied fixes list
		session.AppliedFixes = append(session.AppliedFixes, issueCode)
		session.Status = SessionStatusRunning
		if err := s.sessionStore.Update(session); err != nil {
			return false, "", FixStatusFailed, err
		}
		return true, message, FixStatusApplied, nil
	}

	return false, message, FixStatusFailed, nil
}

// CancelTroubleshoot cancels an ongoing troubleshooting session.
func (s *Service) CancelTroubleshoot(ctx context.Context, sessionID string) (*Session, error) {
	session, err := s.sessionStore.Get(sessionID)
	if err != nil {
		return nil, err
	}

	session.Status = SessionStatusCancelled
	now := time.Now()
	session.CompletedAt = &now

	if err := s.sessionStore.Update(session); err != nil {
		return nil, err
	}

	return session, nil
}

// DetectNetworkConfig detects WAN interface, gateway, and ISP information.
func (s *Service) DetectNetworkConfig(ctx context.Context, routerID string) (*NetworkConfig, error) {
	config := &NetworkConfig{}

	// Detect WAN interface
	wanInterface, err := s.DetectWanInterface(ctx, routerID)
	if err != nil {
		config.WanInterface = "ether1" // Default fallback
	} else {
		config.WanInterface = wanInterface
	}

	// Detect gateway
	gateway, err := s.DetectGateway(ctx, routerID)
	if err != nil {
		config.Gateway = ""
	} else {
		config.Gateway = gateway
	}

	// Detect ISP (best effort)
	if config.Gateway != "" {
		ispInfo, _ := s.DetectISP(ctx, config.Gateway)
		config.ISPInfo = ispInfo
	}

	return config, nil
}

// DetectWanInterface detects the WAN interface from the default route.
func (s *Service) DetectWanInterface(ctx context.Context, routerID string) (string, error) {
	cmd := router.Command{
		Path:   "/ip/route",
		Action: "print",
		Query:  "where dst-address=0.0.0.0/0",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to query routes: %w", err)
	}

	if len(result.Data) == 0 {
		return "", fmt.Errorf("no default route configured")
	}

	// Get interface from first default route
	iface := result.Data[0]["interface"]
	if iface == "" {
		return "", fmt.Errorf("default route has no interface")
	}

	return iface, nil
}

// DetectGateway detects the default gateway from DHCP client or static route.
func (s *Service) DetectGateway(ctx context.Context, routerID string) (string, error) {
	// Try DHCP client first
	cmd := router.Command{
		Path:   "/ip/dhcp-client",
		Action: "print",
		Query:  "where status=bound",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err == nil && len(result.Data) > 0 {
		gateway := result.Data[0]["gateway"]
		if gateway != "" {
			return gateway, nil
		}
	}

	// Fallback to static route
	cmd = router.Command{
		Path:   "/ip/route",
		Action: "print",
		Query:  "where dst-address=0.0.0.0/0",
	}

	result, err = s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to query routes: %w", err)
	}

	if len(result.Data) == 0 {
		return "", fmt.Errorf("no gateway found")
	}

	gateway := result.Data[0]["gateway"]
	if gateway == "" {
		return "", fmt.Errorf("no gateway in default route")
	}

	return gateway, nil
}

// DetectISP detects ISP information using ip-api.com.
func (s *Service) DetectISP(ctx context.Context, wanIP string) (*ISPInfo, error) {
	// Use ip-api.com for ISP detection (free tier)
	url := fmt.Sprintf("http://ip-api.com/json/%s?fields=isp,org", wanIP)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ISP detection failed: status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var data struct {
		ISP string `json:"isp"`
		Org string `json:"org"`
	}

	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}

	ispName := data.ISP
	if ispName == "" {
		ispName = data.Org
	}

	if ispName == "" {
		return nil, fmt.Errorf("no ISP info found")
	}

	// Map to known ISP support info
	ispInfo := &ISPInfo{Name: ispName}
	normalized := normalizeISPName(ispName)

	// Known ISP support database (US-centric, can be expanded)
	supportDB := map[string]struct{ phone, url string }{
		"spectrum":        {phone: "1-833-267-6094", url: "https://www.spectrum.com/contact-us"},
		"comcast":         {phone: "1-800-934-6489", url: "https://www.xfinity.com/support"},
		"xfinity":         {phone: "1-800-934-6489", url: "https://www.xfinity.com/support"},
		"att":             {phone: "1-800-288-2020", url: "https://www.att.com/support/"},
		"verizon":         {phone: "1-800-837-4966", url: "https://www.verizon.com/support/"},
		"cox":             {phone: "1-800-234-3993", url: "https://www.cox.com/residential/support.html"},
		"centurylink":     {phone: "1-800-244-1111", url: "https://www.centurylink.com/home/help.html"},
		"frontier":        {phone: "1-800-921-8101", url: "https://frontier.com/helpcenter"},
		"optimum":         {phone: "1-866-200-7273", url: "https://www.optimum.net/support/"},
	}

	if support, exists := supportDB[normalized]; exists {
		ispInfo.Phone = support.phone
		ispInfo.URL = support.url
	}

	return ispInfo, nil
}

// normalizeISPName normalizes ISP names for matching.
func normalizeISPName(name string) string {
	// Remove common suffixes and punctuation
	re := regexp.MustCompile(`[^a-z0-9]`)
	normalized := strings.ToLower(name)
	normalized = re.ReplaceAllString(normalized, "")
	normalized = strings.ReplaceAll(normalized, "communications", "")
	normalized = strings.ReplaceAll(normalized, "communication", "")
	normalized = strings.ReplaceAll(normalized, "telecom", "")
	normalized = strings.ReplaceAll(normalized, "corp", "")
	normalized = strings.ReplaceAll(normalized, "inc", "")
	normalized = strings.ReplaceAll(normalized, "llc", "")
	normalized = strings.ReplaceAll(normalized, "ltd", "")
	return normalized
}

// executeDiagnosticCheck executes a diagnostic check based on step type.
func (s *Service) executeDiagnosticCheck(ctx context.Context, routerID string, stepType StepType, wanInterface, gateway string) (*StepResult, error) {
	startTime := time.Now()

	switch stepType {
	case StepTypeWAN:
		return s.checkWAN(ctx, wanInterface)
	case StepTypeGateway:
		return s.checkGateway(ctx, gateway, startTime)
	case StepTypeInternet:
		return s.checkInternet(ctx, startTime)
	case StepTypeDNS:
		return s.checkDNS(ctx, startTime)
	case StepTypeNAT:
		return s.checkNAT(ctx, wanInterface, startTime)
	default:
		return nil, fmt.Errorf("unknown step type: %s", stepType)
	}
}

// checkWAN checks WAN interface status.
func (s *Service) checkWAN(ctx context.Context, wanInterface string) (*StepResult, error) {
	startTime := time.Now()

	cmd := router.Command{
		Path:   "/interface",
		Action: "print",
		Query:  fmt.Sprintf("where name=%s", wanInterface),
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	if len(result.Data) == 0 {
		return &StepResult{
			Success:         false,
			Message:         "WAN interface not found",
			IssueCode:       "WAN_NOT_FOUND",
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
		}, nil
	}

	iface := result.Data[0]
	disabled := iface["disabled"] == "true"
	running := iface["running"] == "true"

	if disabled {
		return &StepResult{
			Success:         false,
			Message:         "WAN interface is disabled",
			IssueCode:       "WAN_DISABLED",
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
		}, nil
	}

	if !running {
		return &StepResult{
			Success:         false,
			Message:         "WAN interface link is down",
			IssueCode:       "WAN_LINK_DOWN",
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
		}, nil
	}

	return &StepResult{
		Success:         true,
		Message:         "WAN interface is up and running",
		ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
	}, nil
}

// checkGateway pings the default gateway.
func (s *Service) checkGateway(ctx context.Context, gateway string, startTime time.Time) (*StepResult, error) {
	if gateway == "" {
		return &StepResult{
			Success:         false,
			Message:         "No gateway detected",
			IssueCode:       "GATEWAY_UNREACHABLE",
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
		}, nil
	}

	cmd := router.Command{
		Path:   "/ping",
		Action: "execute",
		Args: map[string]string{
			"address": gateway,
			"count":   "3",
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return &StepResult{
			Success:         false,
			Message:         "Gateway is unreachable",
			IssueCode:       "GATEWAY_UNREACHABLE",
			Details:         err.Error(),
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
			Target:          gateway,
		}, nil
	}

	// Parse ping result (simplified - actual parsing depends on output format)
	if result.Success {
		return &StepResult{
			Success:         true,
			Message:         "Gateway is reachable",
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
			Target:          gateway,
		}, nil
	}

	return &StepResult{
		Success:         false,
		Message:         "Gateway is unreachable",
		IssueCode:       "GATEWAY_UNREACHABLE",
		ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
		Target:          gateway,
	}, nil
}

// checkInternet pings an external server (8.8.8.8).
func (s *Service) checkInternet(ctx context.Context, startTime time.Time) (*StepResult, error) {
	target := "8.8.8.8"

	cmd := router.Command{
		Path:   "/ping",
		Action: "execute",
		Args: map[string]string{
			"address": target,
			"count":   "3",
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil || !result.Success {
		return &StepResult{
			Success:         false,
			Message:         "Cannot reach the internet",
			IssueCode:       "NO_INTERNET",
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
			Target:          target,
		}, nil
	}

	return &StepResult{
		Success:         true,
		Message:         "Internet is reachable",
		ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
		Target:          target,
	}, nil
}

// checkDNS tests DNS resolution.
func (s *Service) checkDNS(ctx context.Context, startTime time.Time) (*StepResult, error) {
	domain := "google.com"

	cmd := router.Command{
		Path:   "/tool/dns-lookup",
		Action: "execute",
		Args: map[string]string{
			"name": domain,
		},
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil || !result.Success {
		return &StepResult{
			Success:         false,
			Message:         "DNS resolution failed",
			IssueCode:       "DNS_FAILED",
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
			Target:          domain,
		}, nil
	}

	return &StepResult{
		Success:         true,
		Message:         "DNS is working correctly",
		ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
		Target:          domain,
	}, nil
}

// checkNAT verifies NAT/masquerade configuration.
func (s *Service) checkNAT(ctx context.Context, wanInterface string, startTime time.Time) (*StepResult, error) {
	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "print",
		Query:  "where action=masquerade",
	}

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, err
	}

	if len(result.Data) == 0 {
		return &StepResult{
			Success:         false,
			Message:         "NAT rule is missing",
			IssueCode:       "NAT_MISSING",
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
		}, nil
	}

	// Check if any rule is enabled
	for _, rule := range result.Data {
		if rule["disabled"] != "true" {
			return &StepResult{
				Success:         true,
				Message:         "NAT is configured correctly",
				ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
			}, nil
		}
	}

	return &StepResult{
		Success:         false,
		Message:         "NAT rule is disabled",
		IssueCode:       "NAT_DISABLED",
		ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
	}, nil
}

// executeFixCommand executes a fix command on the router.
func (s *Service) executeFixCommand(ctx context.Context, routerID string, command string) (bool, string, error) {
	// Parse command into Command struct (simplified)
	cmd := parseRouterOSCommand(command)

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return false, fmt.Sprintf("Failed to execute command: %s", err.Error()), err
	}

	if !result.Success {
		return false, "Command execution failed", result.Error
	}

	return true, "Fix applied successfully", nil
}

// parseRouterOSCommand parses a RouterOS CLI command into a Command struct.
// This is a simplified parser - a full implementation would need proper parsing.
func parseRouterOSCommand(cmdStr string) router.Command {
	// Simple parsing for common command patterns
	parts := strings.Fields(cmdStr)
	if len(parts) == 0 {
		return router.Command{}
	}

	path := parts[0]
	action := ""
	args := make(map[string]string)

	if len(parts) > 1 {
		action = parts[1]
	}

	// Parse remaining parts as key=value pairs
	for i := 2; i < len(parts); i++ {
		if strings.Contains(parts[i], "=") {
			kv := strings.SplitN(parts[i], "=", 2)
			if len(kv) == 2 {
				args[kv[0]] = kv[1]
			}
		}
	}

	return router.Command{
		Path:   path,
		Action: action,
		Args:   args,
	}
}
