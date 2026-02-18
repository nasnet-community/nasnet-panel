package diagnostics

import (
	"context"
	"time"

	"backend/internal/router"
)

// DNSDiagnostics provides DNS resolution diagnostic checks.
type DNSDiagnostics struct {
	routerPort router.RouterPort
}

// NewDNSDiagnostics creates a new DNS diagnostics instance.
func NewDNSDiagnostics(routerPort router.RouterPort) *DNSDiagnostics {
	return &DNSDiagnostics{
		routerPort: routerPort,
	}
}

// CheckDNS tests DNS resolution.
func (d *DNSDiagnostics) CheckDNS(ctx context.Context) (*StepResult, error) {
	startTime := time.Now()
	domain := "google.com"

	cmd := router.Command{
		Path:   "/tool/dns-lookup",
		Action: "execute",
		Args: map[string]string{
			"name": domain,
		},
	}

	result, err := d.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil || !result.Success {
		return &StepResult{
			Success:         false,
			Message:         "DNS resolution failed",
			IssueCode:       "DNS_FAILED",
			ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
			Target:          domain,
		}, err
	}

	return &StepResult{
		Success:         true,
		Message:         "DNS is working correctly",
		ExecutionTimeMs: int(time.Since(startTime).Milliseconds()),
		Target:          domain,
	}, nil
}
