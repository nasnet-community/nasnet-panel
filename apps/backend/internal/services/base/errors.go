// Package base provides base service patterns for reducing code duplication.
package base

import "errors"

var (
	// ErrMissingRouterPort is returned when RouterPort is nil in config.
	ErrMissingRouterPort = errors.New("router port is required")

	// ErrNotConnected is returned when operation requires connection but not connected.
	ErrNotConnected = errors.New("router not connected")

	// ErrCommandFailed is returned when a command execution fails.
	ErrCommandFailed = errors.New("command execution failed")
)
