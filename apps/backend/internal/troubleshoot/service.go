package troubleshoot

import (
	"context"
	"strings"
	"time"

	"go.uber.org/zap"

	"backend/internal/troubleshoot/diagnostics"

	"backend/internal/router"
)

// Service provides internet troubleshooting operations.
type Service struct {
	sessionStore       *SessionStore
	routerPort         router.RouterPort
	circuitBreakerDiag *diagnostics.CircuitBreakerDiagnostics
	dnsDiag            *diagnostics.DNSDiagnostics
	routeLookupDiag    *diagnostics.RouteLookupDiagnostics
	logger             *zap.Logger
}

// NewService creates a new troubleshooting service.
func NewService(routerPort router.RouterPort) *Service {
	logger := zap.L().Named("troubleshoot.Service")
	return &Service{
		sessionStore:       NewSessionStore(),
		routerPort:         routerPort,
		circuitBreakerDiag: diagnostics.NewCircuitBreakerDiagnostics(routerPort),
		dnsDiag:            diagnostics.NewDNSDiagnostics(routerPort),
		routeLookupDiag:    diagnostics.NewRouteLookupDiagnostics(routerPort),
		logger:             logger,
	}
}

// StartTroubleshoot creates a new troubleshooting session and detects network configuration.
func (s *Service) StartTroubleshoot(ctx context.Context, routerID string) (*Session, error) {
	// Create session
	session, err := s.sessionStore.Create(routerID)
	if err != nil {
		s.logger.Error("failed to create troubleshoot session", zap.String("routerID", routerID), zap.Error(err))
		return nil, err
	}

	// Update status to initializing
	session.Status = SessionStatusInitializing
	if updateErr := s.sessionStore.Update(session); updateErr != nil {
		return nil, updateErr
	}

	// Detect network configuration
	config, netErr := s.DetectNetworkConfig(ctx, routerID)
	if netErr != nil {
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
	for _, foundStep := range session.Steps {
		if foundStep.ID == stepType {
			step = foundStep
			break
		}
	}
	if step == nil {
		s.logger.Warn("diagnostic step not found", zap.String("sessionID", sessionID), zap.String("stepType", string(stepType)))
		return nil, ErrStepNotFound
	}

	// Mark step as running
	step.Status = StepStatusRunning
	now := time.Now()
	step.StartedAt = &now
	if updateErr := s.sessionStore.Update(session); updateErr != nil {
		return nil, updateErr
	}

	// Execute the diagnostic check
	result, diagErr := s.executeDiagnosticCheck(ctx, session.RouterID, stepType, session.WanInterface, session.Gateway)
	switch {
	case diagErr != nil:
		s.logger.Error("diagnostic check failed", zap.String("sessionID", sessionID), zap.String("stepType", string(stepType)), zap.Error(diagErr))
		step.Status = StepStatusFailed
		step.Result = &StepResult{
			Success:         false,
			Message:         "Diagnostic failed",
			ExecutionTimeMs: 0,
		}
	case result == nil:
		step.Status = StepStatusFailed
		step.Result = &StepResult{
			Success:         false,
			Message:         "Diagnostic check returned no result",
			ExecutionTimeMs: 0,
		}
	default:
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
func (s *Service) ApplyTroubleshootFix(ctx context.Context, sessionID, issueCode string) (success bool, message string, status FixApplicationStatus, err error) {
	// Get session
	session, err := s.sessionStore.Get(sessionID)
	if err != nil {
		return false, "", FixStatusFailed, err
	}

	// Get fix suggestion
	fix := GetFix(issueCode)
	if fix == nil {
		s.logger.Warn("no fix available for issue", zap.String("sessionID", sessionID), zap.String("issueCode", issueCode))
		return false, "Fix not found", FixStatusFailed, ErrFixNotFound
	}

	// Manual fixes cannot be applied
	if fix.IsManualFix || fix.Command == "" {
		return false, "This fix requires manual intervention", FixStatusAvailable, nil
	}

	// Update session status
	session.Status = SessionStatusApplyingFix
	if updateErr := s.sessionStore.Update(session); updateErr != nil {
		return false, "", FixStatusFailed, updateErr
	}

	// Execute the fix command
	success, message, execErr := s.executeFixCommand(ctx, session.RouterID, fix.Command)
	if execErr != nil {
		// Return error in message and as Go error - the fix failed
		return false, message, FixStatusFailed, execErr
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

	session.Status = SessionStatusCanceled
	now := time.Now()
	session.CompletedAt = &now

	if err := s.sessionStore.Update(session); err != nil {
		return nil, err
	}

	return session, nil
}

// DetectNetworkConfig detects WAN interface, gateway, and ISP information.
func (s *Service) DetectNetworkConfig(ctx context.Context, routerID string) (*NetworkConfig, error) {
	diagConfig, err := s.routeLookupDiag.DetectNetworkConfig(ctx, routerID)
	if err != nil {
		return nil, err
	}

	// Convert diagnostics.NetworkConfig to troubleshoot.NetworkConfig
	config := &NetworkConfig{
		WanInterface: diagConfig.WanInterface,
		Gateway:      diagConfig.Gateway,
	}

	if diagConfig.ISPInfo != nil {
		config.ISPInfo = &ISPInfo{
			Name:  diagConfig.ISPInfo.Name,
			Phone: diagConfig.ISPInfo.Phone,
			URL:   diagConfig.ISPInfo.URL,
		}
	}

	return config, nil
}

// DetectWanInterface detects the WAN interface from the default route.
func (s *Service) DetectWanInterface(ctx context.Context, routerID string) (string, error) {
	return s.routeLookupDiag.DetectWanInterface(ctx, routerID)
}

// DetectGateway detects the default gateway from DHCP client or static route.
func (s *Service) DetectGateway(ctx context.Context, routerID string) (string, error) {
	return s.routeLookupDiag.DetectGateway(ctx, routerID)
}

// DetectISP detects ISP information using ip-api.com.
func (s *Service) DetectISP(ctx context.Context, wanIP string) (*ISPInfo, error) {
	diagISPInfo, err := s.routeLookupDiag.DetectISP(ctx, wanIP)
	if err != nil {
		return nil, err
	}

	return &ISPInfo{
		Name:  diagISPInfo.Name,
		Phone: diagISPInfo.Phone,
		URL:   diagISPInfo.URL,
	}, nil
}

// executeDiagnosticCheck executes a diagnostic check based on step type.
func (s *Service) executeDiagnosticCheck(ctx context.Context, _ string, stepType StepType, wanInterface, gateway string) (*StepResult, error) {
	var diagResult *diagnostics.StepResult
	var err error

	switch stepType {
	case StepTypeWAN:
		diagResult, err = s.circuitBreakerDiag.CheckWAN(ctx, wanInterface)
	case StepTypeGateway:
		diagResult, err = s.circuitBreakerDiag.CheckGateway(ctx, gateway)
	case StepTypeInternet:
		diagResult, err = s.circuitBreakerDiag.CheckInternet(ctx)
	case StepTypeDNS:
		diagResult, err = s.dnsDiag.CheckDNS(ctx)
	case StepTypeNAT:
		diagResult, err = s.circuitBreakerDiag.CheckNAT(ctx, wanInterface)
	default:
		s.logger.Error("unknown diagnostic step type", zap.String("stepType", string(stepType)))
		return nil, ErrUnknownStepType
	}

	if err != nil {
		return nil, err
	}

	if diagResult == nil {
		s.logger.Error("diagnostic check returned nil result", zap.String("stepType", string(stepType)))
		return nil, ErrNilDiagnosticResult
	}

	// Convert diagnostics.StepResult to troubleshoot.StepResult
	return &StepResult{
		Success:         diagResult.Success,
		Message:         diagResult.Message,
		Details:         diagResult.Details,
		ExecutionTimeMs: diagResult.ExecutionTimeMs,
		IssueCode:       diagResult.IssueCode,
		Target:          diagResult.Target,
	}, nil
}

// executeFixCommand executes a fix command on the router.
func (s *Service) executeFixCommand(ctx context.Context, routerID, command string) (success bool, message string, err error) {
	// Parse command into Command struct (simplified)
	cmd := parseRouterOSCommand(command)

	result, err := s.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		s.logger.Error("failed to execute fix command", zap.String("routerID", routerID), zap.Error(err))
		return false, "Failed to execute command", err
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
