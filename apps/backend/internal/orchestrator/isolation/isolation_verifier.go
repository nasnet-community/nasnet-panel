package isolation

import (
	"context"
	"fmt"
	"time"

	"backend/internal/common/isolation"

	"backend/internal/events"
	"backend/internal/network"

	"backend/generated/ent"

	"go.uber.org/zap"
)

// Severity is an alias for pkg/isolation.Severity.
//
//nolint:revive // stuttering name kept as type alias for backward compatibility with pkg/isolation
type IsolationSeverity = isolation.Severity

// Severity constants re-exported for backward compatibility.
var (
	SeverityError   = isolation.SeverityError
	SeverityWarning = isolation.SeverityWarning
)

// Violation is an alias for pkg/isolation.Violation.
//
//nolint:revive // stuttering name kept as type alias for backward compatibility with pkg/isolation
type IsolationViolation = isolation.Violation

// Report is an alias for pkg/isolation.Report.
//
//nolint:revive // stuttering name kept as type alias for backward compatibility with pkg/isolation
type IsolationReport = isolation.Report

// PortRegistryPort is the interface for port registry operations (avoids import cycle)
type PortRegistryPort interface {
	GetAllocationsByInstance(ctx context.Context, instanceID string) ([]network.PortAllocationEntity, error)
}

// ConfigBindingValidatorPort is the interface for Layer 1 IP binding validation
type ConfigBindingValidatorPort interface {
	ValidateBinding(ctx context.Context, instance *ent.ServiceInstance) (string, error)
}

// VerifierConfig holds configuration for the isolation verifier
//
//nolint:revive // stuttering name kept for clarity as the config type in the isolation package
type IsolationVerifierConfig struct {
	PortRegistry           PortRegistryPort
	ConfigBindingValidator ConfigBindingValidatorPort // Optional for Layer 1
	EventBus               events.EventBus            // Optional for event publishing
	Logger                 *zap.Logger
	// AllowedBaseDir is the allowed base directory for service instance files (default: "/data/services")
	AllowedBaseDir string
}

// Verifier performs 4-layer pre-start isolation checks
//
//nolint:revive // stuttering name kept for clarity as the primary exported type in the isolation package
type IsolationVerifier struct {
	portRegistry           PortRegistryPort
	configBindingValidator ConfigBindingValidatorPort
	eventBus               events.EventBus
	eventPublisher         *events.Publisher
	logger                 *zap.Logger
	allowedBaseDir         string
}

// NewIsolationVerifier creates a new isolation verifier with constructor injection
func NewIsolationVerifier(cfg IsolationVerifierConfig) (*IsolationVerifier, error) {
	if cfg.PortRegistry == nil {
		return nil, fmt.Errorf("port registry is required")
	}

	allowedBaseDir := cfg.AllowedBaseDir
	if allowedBaseDir == "" {
		allowedBaseDir = "/data/services"
	}

	var eventPublisher *events.Publisher
	if cfg.EventBus != nil {
		eventPublisher = events.NewPublisher(cfg.EventBus, "isolation-verifier")
	}

	return &IsolationVerifier{
		portRegistry:           cfg.PortRegistry,
		configBindingValidator: cfg.ConfigBindingValidator,
		eventBus:               cfg.EventBus,
		eventPublisher:         eventPublisher,
		logger:                 cfg.Logger,
		allowedBaseDir:         allowedBaseDir,
	}, nil
}

// VerifyPreStart runs all 4 layers of isolation checks and returns a report
func (iv *IsolationVerifier) VerifyPreStart(ctx context.Context, instance *ent.ServiceInstance) (*IsolationReport, error) {
	report := isolation.NewReport()

	// Layer 1: Config IP binding validation
	if bindIP, err := iv.verifyIPBinding(ctx, instance); err != nil {
		report.AddViolation("IP Binding", fmt.Sprintf("IP binding validation failed: %v", err), isolation.SeverityError)
		iv.emitIsolationViolationEvent(ctx, instance, "ip_binding", err.Error())
	} else {
		report.BindIP = bindIP
	}

	// Layer 2: Directory validation
	if err := iv.verifyDirectory(instance); err != nil {
		report.AddViolation("Directory", fmt.Sprintf("Directory validation failed: %v", err), isolation.SeverityError)
		iv.emitIsolationViolationEvent(ctx, instance, "filesystem_access", err.Error())
	}

	// Layer 3: Port availability check
	if allocatedPorts, err := iv.verifyPorts(ctx, instance); err != nil {
		report.AddViolation("Port Registry", fmt.Sprintf("Port availability check failed: %v", err), isolation.SeverityError)
		iv.emitIsolationViolationEvent(ctx, instance, "port_conflict", err.Error())
	} else {
		report.AllocatedPorts = allocatedPorts
	}

	// Layer 4: Process binding check (warning only)
	if err := iv.verifyProcessBinding(ctx, instance); err != nil {
		report.AddViolation("Process Binding", fmt.Sprintf("Process binding check warning: %v", err), isolation.SeverityWarning)
	}

	if report.Passed {
		iv.logger.Info("all isolation checks passed",
			zap.String("instance_id", instance.ID),
			zap.String("bind_ip", report.BindIP),
			zap.Any("ports", report.AllocatedPorts),
			zap.Int("warnings", report.CountWarnings()))
	} else {
		iv.logger.Error("isolation verification failed",
			zap.String("instance_id", instance.ID),
			zap.Int("violations", len(report.Violations)))
	}

	return report, nil
}

// verifyIPBinding validates that the service instance has a valid bind IP configured
// Layer 1: Config IP binding validation
func (iv *IsolationVerifier) verifyIPBinding(ctx context.Context, instance *ent.ServiceInstance) (string, error) {
	// If ConfigBindingValidator is provided, use it for advanced validation
	if iv.configBindingValidator != nil {
		bindIP, err := iv.configBindingValidator.ValidateBinding(ctx, instance)
		if err != nil {
			return "", fmt.Errorf("validate binding for instance %s: %w", instance.ID, err)
		}
		return bindIP, nil
	}

	// Fallback: Simple validation - check if bind_ip field is set
	if instance.BindIP == "" {
		return "", fmt.Errorf("bind_ip not configured for instance %s", instance.ID)
	}

	// Use pkg/isolation for IP validation
	if err := isolation.ValidateIP(instance.BindIP); err != nil {
		return "", fmt.Errorf("IP validation failed for %s: %w", instance.BindIP, err)
	}

	return instance.BindIP, nil
}

// verifyDirectory validates directory permissions and prevents symlink escapes
// Layer 2: Directory validation (exists, 0750 permissions, no symlink escapes)
func (iv *IsolationVerifier) verifyDirectory(instance *ent.ServiceInstance) error {
	binaryPath := instance.BinaryPath
	if binaryPath == "" {
		return fmt.Errorf("binary_path not set for instance %s", instance.ID)
	}

	// Use pkg/isolation for directory validation
	if err := isolation.ValidateDirectory(binaryPath, iv.allowedBaseDir); err != nil {
		return fmt.Errorf("directory validation failed for %s: %w", binaryPath, err)
	}

	// Use pkg/isolation for permission validation
	if err := isolation.ValidateDirectoryPermissions(binaryPath); err != nil {
		return fmt.Errorf("directory permission validation failed for %s: %w", binaryPath, err)
	}
	return nil
}

// verifyPorts checks port availability using PortRegistry
// Layer 3: Port availability (reuse existing PortRegistry)
func (iv *IsolationVerifier) verifyPorts(ctx context.Context, instance *ent.ServiceInstance) ([]int, error) {
	if len(instance.Ports) == 0 {
		return nil, fmt.Errorf("no ports allocated for instance %s", instance.ID)
	}

	// Get all port allocations for this instance from PortRegistry
	allocations, err := iv.portRegistry.GetAllocationsByInstance(ctx, instance.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to query port allocations: %w", err)
	}

	if len(allocations) == 0 {
		return nil, fmt.Errorf("no port allocations found in registry for instance %s", instance.ID)
	}

	// Verify that instance.Ports matches allocated ports
	allocatedPorts := make([]int, 0, len(allocations))
	for _, alloc := range allocations {
		allocatedPorts = append(allocatedPorts, alloc.GetPort())
	}

	// Check if instance.Ports is a subset of allocatedPorts
	for _, port := range instance.Ports {
		found := false
		for _, allocPort := range allocatedPorts {
			if port == allocPort {
				found = true
				break
			}
		}
		if !found {
			return nil, fmt.Errorf("port %d is in instance.Ports but not allocated in PortRegistry", port)
		}
	}

	return allocatedPorts, nil
}

// verifyProcessBinding checks if any process is already using the bind IP (warning only)
// Layer 4: Process binding check (warning only, /proc/net/tcp parser)
func (iv *IsolationVerifier) verifyProcessBinding(_ context.Context, instance *ent.ServiceInstance) error {
	if instance.BindIP == "" {
		return nil // Skip if no bind IP configured
	}

	// Parse /proc/net/tcp to check for existing bindings on this IP
	conflicts, err := iv.parseProcNetTCP(instance.BindIP)
	if err != nil {
		// Error is non-fatal (platform-specific limitations), just log and return
		iv.logger.Warn("failed to parse /proc/net/tcp for process binding check",
			zap.String("instance_id", instance.ID),
			zap.String("bind_ip", instance.BindIP),
			zap.Error(err))
		return nil
	}

	// If no conflicts found, return success
	if len(conflicts) == 0 {
		return nil
	}

	// Found conflicts - emit warning but don't block instance start
	conflictMsg := fmt.Sprintf("Found %d existing process binding(s) on %s: ", len(conflicts), instance.BindIP)
	for i, conflict := range conflicts {
		if i > 0 {
			conflictMsg += ", "
		}
		conflictMsg += fmt.Sprintf("%s:%d (state=%s)", conflict.LocalIP, conflict.LocalPort, conflict.State)
	}

	iv.logger.Warn("process binding check: potential conflict detected",
		zap.String("instance_id", instance.ID),
		zap.String("message", conflictMsg))

	// Return as a warning (caller will add to report with SeverityWarning)
	return fmt.Errorf("%s", conflictMsg)
}

// emitIsolationViolationEvent publishes an isolation violation event to the event bus
func (iv *IsolationVerifier) emitIsolationViolationEvent(ctx context.Context, instance *ent.ServiceInstance, violationType, errorMessage string) {
	// Skip event emission if event publisher is not configured
	if iv.eventPublisher == nil {
		return
	}

	// Determine router ID (may be empty for instances not yet associated with a router)
	routerID := ""
	if instance.Edges.Router != nil {
		routerID = instance.Edges.Router.ID
	}

	// Convert ports to string array for event
	affectedPorts := make([]string, len(instance.Ports))
	for i, port := range instance.Ports {
		affectedPorts[i] = fmt.Sprintf("%d", port)
	}

	// Publish isolation violation event
	err := iv.eventPublisher.PublishIsolationViolation(
		ctx,
		instance.ID,
		instance.FeatureID,
		routerID,
		violationType,
		"", // currentValue - not applicable for pre-start checks
		"", // limitValue - not applicable for pre-start checks
		"critical",
		time.Now().Format(time.RFC3339),
		"blocked_start",
		"", // cgroupPath - not applicable for pre-start checks
		errorMessage,
		true, // willTerminate - instance will not be started
		affectedPorts,
		nil, // affectedVLANs - not applicable for pre-start checks
	)

	if err != nil {
		iv.logger.Warn("failed to publish isolation violation event",
			zap.Error(err),
			zap.String("instance_id", instance.ID),
			zap.String("violation_type", violationType))
	}
}
