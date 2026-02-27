// Package diagnostics provides diagnostic checks for troubleshooting.
package diagnostics

import (
	"context"
	"fmt"
	"time"

	"backend/internal/router"
)

const (
	trueValue = "true"
)

// CircuitBreakerDiagnostics provides WAN and NAT diagnostic checks.
type CircuitBreakerDiagnostics struct {
	routerPort router.RouterPort
}

// NewCircuitBreakerDiagnostics creates a new circuit breaker diagnostics instance.
func NewCircuitBreakerDiagnostics(routerPort router.RouterPort) *CircuitBreakerDiagnostics {
	return &CircuitBreakerDiagnostics{
		routerPort: routerPort,
	}
}

// CheckWAN checks WAN interface status.
func (d *CircuitBreakerDiagnostics) CheckWAN(ctx context.Context, wanInterface string) (*StepResult, error) {
	startTime := time.Now()

	cmd := router.Command{
		Path:   "/interface",
		Action: "print",
		Query:  fmt.Sprintf("where name=%s", wanInterface),
	}

	result, err := d.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to check WAN status: %w", err)
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
	disabled := iface["disabled"] == trueValue
	running := iface["running"] == trueValue

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

// CheckNAT verifies NAT/masquerade configuration.
func (d *CircuitBreakerDiagnostics) CheckNAT(ctx context.Context, wanInterface string) (*StepResult, error) {
	startTime := time.Now()

	cmd := router.Command{
		Path:   "/ip/firewall/nat",
		Action: "print",
		Query:  "where action=masquerade",
	}

	result, err := d.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to check NAT configuration: %w", err)
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
		if rule["disabled"] != trueValue {
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

// CheckGateway pings the default gateway.
func (d *CircuitBreakerDiagnostics) CheckGateway(ctx context.Context, gateway string) (*StepResult, error) {
	startTime := time.Now()

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

	result, err := d.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		wrappedErr := fmt.Errorf("failed to ping gateway: %w", err)
		return &StepResult{
			Success:         false,
			Message:         "Gateway is unreachable",
			IssueCode:       "GATEWAY_UNREACHABLE",
			Details:         err.Error(),
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
			Target:          gateway,
		}, wrappedErr
	}

	// Parse ping result - check if packets were received
	if result.Success && len(result.Data) > 0 {
		received := result.Data[0]["received"]
		if received != "" && received != "0" {
			return &StepResult{
				Success:         true,
				Message:         "Gateway is reachable",
				ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
				Target:          gateway,
			}, nil
		}
	}

	return &StepResult{
		Success:         false,
		Message:         "Gateway is unreachable",
		IssueCode:       "GATEWAY_UNREACHABLE",
		ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
		Target:          gateway,
	}, nil
}

// CheckInternet pings an external server (8.8.8.8).
func (d *CircuitBreakerDiagnostics) CheckInternet(ctx context.Context) (*StepResult, error) {
	startTime := time.Now()
	target := "8.8.8.8"

	cmd := router.Command{
		Path:   "/ping",
		Action: "execute",
		Args: map[string]string{
			"address": target,
			"count":   "3",
		},
	}

	result, err := d.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		wrappedErr := fmt.Errorf("failed to check internet connectivity: %w", err)
		return &StepResult{
			Success:         false,
			Message:         "Cannot reach the internet",
			IssueCode:       "NO_INTERNET",
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
			Target:          target,
		}, wrappedErr
	}

	// Parse ping result - check if packets were received
	if result.Success && len(result.Data) > 0 {
		received := result.Data[0]["received"]
		if received != "" && received != "0" {
			return &StepResult{
				Success:         true,
				Message:         "Internet is reachable",
				ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
				Target:          target,
			}, nil
		}
	}

	return &StepResult{
		Success:         false,
		Message:         "Cannot reach the internet",
		IssueCode:       "NO_INTERNET",
		ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
		Target:          target,
	}, nil
}
