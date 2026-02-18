// Package base provides base service patterns for reducing code duplication.
package base

import (
	"context"
	"fmt"

	"backend/internal/router"
)

// Service provides common service functionality for all services.
type Service struct {
	routerPort router.RouterPort
}

// NewService creates a new base service.
func NewService(port router.RouterPort) Service {
	return Service{
		routerPort: port,
	}
}

// EnsureConnected checks if the router is connected and connects if needed.
// This pattern appears 47+ times across service files.
//
// Usage:
//
//	if err := s.EnsureConnected(ctx); err != nil {
//	    return nil, fmt.Errorf("connection failed: %w", err)
//	}
func (b *Service) EnsureConnected(ctx context.Context) error {
	if !b.routerPort.IsConnected() {
		if err := b.routerPort.Connect(ctx); err != nil {
			return fmt.Errorf("failed to connect to router: %w", err)
		}
	}
	return nil
}

// ExecuteCommand executes a command and checks the result.
// This pattern appears 50+ times across service files.
//
// Usage:
//
//	result, err := s.ExecuteCommand(ctx, cmd, "create bridge")
//	if err != nil {
//	    return nil, err
//	}
func (b *Service) ExecuteCommand(ctx context.Context, cmd router.Command, operation string) (*router.CommandResult, error) {
	result, err := b.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to %s: %w", operation, err)
	}

	if !result.Success {
		return nil, fmt.Errorf("%s failed: %w", operation, result.Error)
	}

	return result, nil
}

// Port returns the underlying router port.
// Useful when you need direct access to the RouterPort interface.
func (b *Service) Port() router.RouterPort {
	return b.routerPort
}

// IsConnected returns whether the router connection is established.
func (b *Service) IsConnected() bool {
	return b.routerPort.IsConnected()
}
