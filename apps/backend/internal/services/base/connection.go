// Package base provides base service patterns for reducing code duplication.
package base

import (
	"context"
	"fmt"

	"backend/internal/router"
)

// ConnectionManager provides advanced connection management utilities.
type ConnectionManager struct {
	port router.RouterPort
}

// NewConnectionManager creates a new connection manager.
func NewConnectionManager(port router.RouterPort) *ConnectionManager {
	return &ConnectionManager{
		port: port,
	}
}

// WithConnection ensures connection and executes the provided function.
// Automatically handles connection errors with consistent error wrapping.
//
// Usage:
//
//	err := connMgr.WithConnection(ctx, func() error {
//	    // Your logic here
//	    return nil
//	})
func (cm *ConnectionManager) WithConnection(ctx context.Context, fn func() error) error {
	if !cm.port.IsConnected() {
		if err := cm.port.Connect(ctx); err != nil {
			return fmt.Errorf("failed to connect to router: %w", err)
		}
	}
	return fn()
}

// WithConnectionT ensures connection and executes the provided function with a return value.
// Generic version for functions that return a value.
//
// Usage:
//
//	result, err := connMgr.WithConnectionT(ctx, func() (*Model, error) {
//	    // Your logic here
//	    return model, nil
//	})
func WithConnectionT[T any](ctx context.Context, cm *ConnectionManager, fn func() (T, error)) (T, error) {
	var zero T
	if !cm.port.IsConnected() {
		if err := cm.port.Connect(ctx); err != nil {
			return zero, fmt.Errorf("failed to connect to router: %w", err)
		}
	}
	return fn()
}
