package vif

import (
	"context"
	"testing"

	"backend/internal/router"
)

// BenchmarkServiceStart benchmarks the service start flow.
// Tests the execution of a command through MockRouterPort.
func BenchmarkServiceStart(b *testing.B) {
	ctx := context.Background()
	mock := NewMockRouterPort()

	// Setup
	if err := mock.Connect(ctx); err != nil {
		b.Fatalf("failed to connect: %v", err)
	}
	defer func() { _ = mock.Disconnect() }()

	cmd := router.Command{
		Path:   "/interface",
		Action: "enable",
		Args: map[string]string{
			"numbers": "ether1",
		},
	}

	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_, err := mock.ExecuteCommand(ctx, cmd)
		if err != nil {
			b.Fatalf("execution failed: %v", err)
		}
	}
}

// BenchmarkVLANCreation benchmarks VLAN creation command flow.
// Tests the execution of VLAN add command through MockRouterPort.
func BenchmarkVLANCreation(b *testing.B) {
	ctx := context.Background()
	mock := NewMockRouterPort()

	// Setup
	if err := mock.Connect(ctx); err != nil {
		b.Fatalf("failed to connect: %v", err)
	}
	defer func() { _ = mock.Disconnect() }()

	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		cmd := router.Command{
			Path:   "/interface/vlan",
			Action: "add",
			Args: map[string]string{
				"name":      "vlan100",
				"vlan-id":   "100",
				"interface": "ether1",
			},
		}

		_, err := mock.ExecuteCommand(ctx, cmd)
		if err != nil {
			b.Fatalf("VLAN creation failed: %v", err)
		}
	}
}

// BenchmarkRoutingRuleApply benchmarks routing rule application.
// Tests the execution of firewall filter add command through MockRouterPort.
func BenchmarkRoutingRuleApply(b *testing.B) {
	ctx := context.Background()
	mock := NewMockRouterPort()

	// Setup
	if err := mock.Connect(ctx); err != nil {
		b.Fatalf("failed to connect: %v", err)
	}
	defer func() { _ = mock.Disconnect() }()

	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		cmd := router.Command{
			Path:   "/ip/firewall/filter",
			Action: "add",
			Args: map[string]string{
				"chain":    "forward",
				"action":   "accept",
				"protocol": "tcp",
				"dst-port": "80",
			},
		}

		_, err := mock.ExecuteCommand(ctx, cmd)
		if err != nil {
			b.Fatalf("routing rule apply failed: %v", err)
		}
	}
}

// BenchmarkKillSwitchLatency benchmarks kill switch toggle speed.
// Tests the execution of enable/disable filter rule command.
func BenchmarkKillSwitchLatency(b *testing.B) {
	ctx := context.Background()
	mock := NewMockRouterPort()

	// Setup
	if err := mock.Connect(ctx); err != nil {
		b.Fatalf("failed to connect: %v", err)
	}
	defer func() { _ = mock.Disconnect() }()

	// Create a rule first
	createCmd := router.Command{
		Path:   "/ip/firewall/filter",
		Action: "add",
		Args: map[string]string{
			"chain":  "forward",
			"action": "drop",
		},
	}
	result, err := mock.ExecuteCommand(ctx, createCmd)
	if err != nil {
		b.Fatalf("failed to create rule: %v", err)
	}
	ruleID := result.ID

	b.ReportAllocs()
	b.ResetTimer()

	// Alternate enable/disable
	for i := 0; i < b.N; i++ {
		action := "disable"
		if i%2 == 0 {
			action = "enable"
		}

		cmd := router.Command{
			Path:   "/ip/firewall/filter",
			Action: action,
			ID:     ruleID,
		}

		_, err := mock.ExecuteCommand(ctx, cmd)
		if err != nil {
			b.Fatalf("kill switch toggle failed: %v", err)
		}
	}
}

// BenchmarkMemoryUnder20Instances benchmarks memory usage with multiple router instances.
// Tests initialization and tracking of 20 MockRouterPort instances.
func BenchmarkMemoryUnder20Instances(b *testing.B) {
	ctx := context.Background()

	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		// Create 20 mock instances
		instances := make([]*MockRouterPort, 20)
		for j := 0; j < 20; j++ {
			instances[j] = NewMockRouterPort()
		}

		// Connect all instances
		for j := 0; j < 20; j++ {
			if err := instances[j].Connect(ctx); err != nil {
				b.Fatalf("failed to connect instance %d: %v", j, err)
			}
		}

		// Execute a simple command on each
		for j := 0; j < 20; j++ {
			cmd := router.Command{
				Path:   "/system/identity",
				Action: "print",
			}
			_, err := instances[j].ExecuteCommand(ctx, cmd)
			if err != nil {
				b.Fatalf("execution failed on instance %d: %v", j, err)
			}
		}

		// Disconnect all instances
		for j := 0; j < 20; j++ {
			_ = instances[j].Disconnect()
		}
	}
}
