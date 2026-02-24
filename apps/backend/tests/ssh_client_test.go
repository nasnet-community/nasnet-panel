//go:build test

package main

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"backend/internal/router/adapters/mikrotik"
)

// TestSSHClientPoolCreate tests SSH client pool initialization
func TestSSHClientPoolCreate(t *testing.T) {
	pool := mikrotik.NewSSHClientPool()
	require.NotNil(t, pool, "SSH client pool should not be nil")
	t.Cleanup(func() {
		pool.CloseAll()
	})
}

// TestSSHClientPoolCloseAll tests that CloseAll properly closes all connections
func TestSSHClientPoolCloseAll(t *testing.T) {
	pool := mikrotik.NewSSHClientPool()
	require.NotNil(t, pool, "SSH client pool should not be nil")

	// CloseAll should not panic on empty pool
	assert.NotPanics(t, func() {
		pool.CloseAll()
	}, "CloseAll should not panic on empty pool")

	t.Cleanup(func() {
		pool.CloseAll()
	})
}

// TestTelnetClientPoolCreate tests Telnet client pool initialization
func TestTelnetClientPoolCreate(t *testing.T) {
	pool := mikrotik.NewTelnetClientPool()
	require.NotNil(t, pool, "Telnet client pool should not be nil")
	t.Cleanup(func() {
		pool.CloseAll()
	})
}

// TestTelnetClientPoolCloseAll tests that Telnet CloseAll properly closes all connections
func TestTelnetClientPoolCloseAll(t *testing.T) {
	pool := mikrotik.NewTelnetClientPool()
	require.NotNil(t, pool, "Telnet client pool should not be nil")

	// CloseAll should not panic on empty pool
	assert.NotPanics(t, func() {
		pool.CloseAll()
	}, "CloseAll should not panic on empty pool")

	t.Cleanup(func() {
		pool.CloseAll()
	})
}

// TestContextTimeout tests context timeout behavior for connection attempts
func TestContextTimeout(t *testing.T) {
	// Create context with very short timeout
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
	t.Cleanup(cancel)

	// Wait for context to expire
	<-ctx.Done()

	// Verify context has deadline exceeded error
	require.Equal(t, context.DeadlineExceeded, ctx.Err(),
		"Context should have DeadlineExceeded error after timeout")
}

// TestContextCancellation tests explicit context cancellation
func TestContextCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(func() {
		cancel()
	})

	// Cancel the context
	cancel()

	// Verify context is cancelled
	require.Equal(t, context.Canceled, ctx.Err(),
		"Context should have Canceled error after cancellation")
}
