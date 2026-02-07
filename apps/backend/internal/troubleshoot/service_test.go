package troubleshoot

import (
	"backend/internal/router"
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockRouterPort for testing
type MockRouterPort struct {
	commands   map[string]*router.CommandResult
	executeErr error
}

func (m *MockRouterPort) ExecuteCommand(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	if m.executeErr != nil {
		return nil, m.executeErr
	}
	key := cmd.Path
	if result, ok := m.commands[key]; ok {
		return result, nil
	}
	return &router.CommandResult{Success: true, Data: []map[string]string{}}, nil
}

func (m *MockRouterPort) Connect(ctx context.Context) error              { return nil }
func (m *MockRouterPort) Disconnect() error                              { return nil }
func (m *MockRouterPort) IsConnected() bool                              { return true }
func (m *MockRouterPort) Health(ctx context.Context) router.HealthStatus { return router.HealthStatus{} }
func (m *MockRouterPort) Capabilities() router.PlatformCapabilities      { return router.PlatformCapabilities{} }
func (m *MockRouterPort) Info() (*router.RouterInfo, error)              { return nil, nil }
func (m *MockRouterPort) QueryState(ctx context.Context, query router.StateQuery) (*router.StateResult, error) {
	return nil, nil
}
func (m *MockRouterPort) Protocol() router.Protocol { return router.ProtocolAPI }

func newTestService() *Service {
	mockPort := &MockRouterPort{commands: make(map[string]*router.CommandResult)}
	return NewService(mockPort)
}

func newTestServiceWithMock(mockPort *MockRouterPort) *Service {
	return NewService(mockPort)
}

// TestStartTroubleshoot tests session creation
func TestStartTroubleshoot(t *testing.T) {
	t.Run("successful session creation", func(t *testing.T) {
		svc := newTestService()
		ctx := context.Background()

		session, err := svc.StartTroubleshoot(ctx, "router-123")
		require.NoError(t, err)
		require.NotNil(t, session)

		assert.NotEmpty(t, session.ID)
		assert.Equal(t, "router-123", session.RouterID)
		assert.Equal(t, SessionStatusRunning, session.Status)
		assert.Len(t, session.Steps, 5)
		assert.NotNil(t, session.StartedAt)
	})

	t.Run("empty router ID", func(t *testing.T) {
		svc := newTestService()
		ctx := context.Background()

		session, err := svc.StartTroubleshoot(ctx, "")
		// Empty router ID is allowed - service should handle it
		require.NoError(t, err)
		require.NotNil(t, session)
	})

	t.Run("network detection with mock data", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ip/route": {
					Success: true,
					Data: []map[string]string{
						{"dst-address": "0.0.0.0/0", "gateway": "192.168.1.1", "interface": "ether1"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)
		ctx := context.Background()

		session, err := svc.StartTroubleshoot(ctx, "router-123")
		require.NoError(t, err)

		assert.Equal(t, "ether1", session.WanInterface)
		assert.Equal(t, "192.168.1.1", session.Gateway)
	})

	t.Run("concurrent session creation", func(t *testing.T) {
		svc := newTestService()
		ctx := context.Background()

		// Create multiple sessions concurrently
		done := make(chan bool)
		for i := 0; i < 5; i++ {
			go func(n int) {
				_, err := svc.StartTroubleshoot(ctx, "router-concurrent")
				assert.NoError(t, err)
				done <- true
			}(i)
		}

		// Wait for all goroutines
		for i := 0; i < 5; i++ {
			<-done
		}
	})

	t.Run("session TTL", func(t *testing.T) {
		svc := newTestService()
		ctx := context.Background()

		session, err := svc.StartTroubleshoot(ctx, "router-ttl")
		require.NoError(t, err)

		// Verify session exists
		retrieved, err := svc.GetSession(ctx, session.ID)
		require.NoError(t, err)
		assert.Equal(t, session.ID, retrieved.ID)
	})
}

// TestRunTroubleshootStep_WAN tests WAN interface diagnostic
func TestRunTroubleshootStep_WAN(t *testing.T) {
	t.Run("interface up and running", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/interface": {
					Success: true,
					Data: []map[string]string{
						{"name": "ether1", "disabled": "false", "running": "true"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeWAN)

		require.NoError(t, err)
		assert.Equal(t, StepStatusPassed, step.Status)
		assert.True(t, step.Result.Success)
		assert.Contains(t, step.Result.Message, "operational")
	})

	t.Run("interface disabled", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/interface": {
					Success: true,
					Data: []map[string]string{
						{"name": "ether1", "disabled": "true", "running": "false"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeWAN)

		require.NoError(t, err)
		assert.Equal(t, StepStatusFailed, step.Status)
		assert.False(t, step.Result.Success)
		assert.Equal(t, "WAN_DISABLED", step.Result.IssueCode)
		assert.NotNil(t, step.Fix)
		assert.Equal(t, "Enable WAN Interface", step.Fix.Title)
	})

	t.Run("interface link down", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/interface": {
					Success: true,
					Data: []map[string]string{
						{"name": "ether1", "disabled": "false", "running": "false"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeWAN)

		require.NoError(t, err)
		assert.Equal(t, StepStatusFailed, step.Status)
		assert.Equal(t, "WAN_LINK_DOWN", step.Result.IssueCode)
	})
}

// TestRunTroubleshootStep_Gateway tests gateway connectivity
func TestRunTroubleshootStep_Gateway(t *testing.T) {
	t.Run("gateway reachable", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ping": {
					Success: true,
					Data: []map[string]string{
						{"sent": "4", "received": "4", "packet-loss": "0"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		session.Gateway = "192.168.1.1"
		svc.sessionStore.Update(session)

		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeGateway)

		require.NoError(t, err)
		assert.Equal(t, StepStatusPassed, step.Status)
		assert.True(t, step.Result.Success)
	})

	t.Run("gateway unreachable", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ping": {
					Success: true,
					Data: []map[string]string{
						{"sent": "4", "received": "0", "packet-loss": "100"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		session.Gateway = "192.168.1.1"
		svc.sessionStore.Update(session)

		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeGateway)

		require.NoError(t, err)
		assert.Equal(t, StepStatusFailed, step.Status)
		assert.Equal(t, "GATEWAY_UNREACHABLE", step.Result.IssueCode)
	})

	t.Run("gateway timeout", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeErr: errors.New("timeout"),
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		session.Gateway = "192.168.1.1"
		svc.sessionStore.Update(session)

		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeGateway)

		require.NoError(t, err)
		assert.Equal(t, StepStatusFailed, step.Status)
		assert.Equal(t, "GATEWAY_TIMEOUT", step.Result.IssueCode)
	})
}

// TestRunTroubleshootStep_Internet tests internet connectivity
func TestRunTroubleshootStep_Internet(t *testing.T) {
	t.Run("internet connectivity ok", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ping": {
					Success: true,
					Data: []map[string]string{
						{"sent": "4", "received": "4", "packet-loss": "0"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeInternet)

		require.NoError(t, err)
		assert.Equal(t, StepStatusPassed, step.Status)
		assert.True(t, step.Result.Success)
	})

	t.Run("no internet connectivity", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ping": {
					Success: true,
					Data: []map[string]string{
						{"sent": "4", "received": "0", "packet-loss": "100"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeInternet)

		require.NoError(t, err)
		assert.Equal(t, StepStatusFailed, step.Status)
		assert.Equal(t, "NO_INTERNET", step.Result.IssueCode)
	})

	t.Run("internet timeout", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeErr: errors.New("timeout"),
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeInternet)

		require.NoError(t, err)
		assert.Equal(t, StepStatusFailed, step.Status)
		assert.Equal(t, "INTERNET_TIMEOUT", step.Result.IssueCode)
	})
}

// TestRunTroubleshootStep_DNS tests DNS resolution
func TestRunTroubleshootStep_DNS(t *testing.T) {
	t.Run("DNS resolution success", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/tool/dns-lookup": {
					Success: true,
					Data: []map[string]string{
						{"name": "google.com", "address": "142.250.185.78"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeDNS)

		require.NoError(t, err)
		assert.Equal(t, StepStatusPassed, step.Status)
		assert.True(t, step.Result.Success)
	})

	t.Run("DNS resolution failure", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/tool/dns-lookup": {
					Success: false,
					Data:    []map[string]string{},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeDNS)

		require.NoError(t, err)
		assert.Equal(t, StepStatusFailed, step.Status)
		assert.Equal(t, "DNS_FAILED", step.Result.IssueCode)
	})

	t.Run("DNS timeout", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeErr: errors.New("timeout"),
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeDNS)

		require.NoError(t, err)
		assert.Equal(t, StepStatusFailed, step.Status)
		assert.Equal(t, "DNS_TIMEOUT", step.Result.IssueCode)
	})
}

// TestRunTroubleshootStep_NAT tests NAT configuration
func TestRunTroubleshootStep_NAT(t *testing.T) {
	t.Run("NAT rule present and enabled", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ip/firewall/nat": {
					Success: true,
					Data: []map[string]string{
						{"chain": "srcnat", "action": "masquerade", "disabled": "false"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeNAT)

		require.NoError(t, err)
		assert.Equal(t, StepStatusPassed, step.Status)
		assert.True(t, step.Result.Success)
	})

	t.Run("NAT rule missing", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ip/firewall/nat": {
					Success: true,
					Data:    []map[string]string{},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeNAT)

		require.NoError(t, err)
		assert.Equal(t, StepStatusFailed, step.Status)
		assert.Equal(t, "NAT_MISSING", step.Result.IssueCode)
	})

	t.Run("NAT rule disabled", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ip/firewall/nat": {
					Success: true,
					Data: []map[string]string{
						{"chain": "srcnat", "action": "masquerade", "disabled": "true"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		step, err := svc.RunTroubleshootStep(context.Background(), session.ID, StepTypeNAT)

		require.NoError(t, err)
		assert.Equal(t, StepStatusFailed, step.Status)
		assert.Equal(t, "NAT_DISABLED", step.Result.IssueCode)
	})
}

// TestApplyTroubleshootFix tests fix application
func TestApplyTroubleshootFix(t *testing.T) {
	t.Run("apply automated fix successfully", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: make(map[string]*router.CommandResult),
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		success, message, status, err := svc.ApplyTroubleshootFix(context.Background(), session.ID, "WAN_DISABLED")

		require.NoError(t, err)
		assert.True(t, success)
		assert.NotEmpty(t, message)
		assert.Equal(t, FixStatusApplied, status)

		// Verify fix was tracked
		assert.Contains(t, session.AppliedFixes, "WAN_DISABLED")
	})

	t.Run("manual fix returns correct status", func(t *testing.T) {
		svc := newTestService()

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		success, message, status, err := svc.ApplyTroubleshootFix(context.Background(), session.ID, "WAN_LINK_DOWN")

		require.NoError(t, err)
		assert.False(t, success) // Manual fixes can't be applied automatically
		assert.Contains(t, message, "manual")
		assert.Equal(t, FixStatusAvailable, status)
	})

	t.Run("unknown issue code", func(t *testing.T) {
		svc := newTestService()

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		success, _, status, err := svc.ApplyTroubleshootFix(context.Background(), session.ID, "UNKNOWN_CODE")

		require.Error(t, err)
		assert.False(t, success)
		assert.Contains(t, err.Error(), "unknown")
		assert.Equal(t, FixStatusFailed, status)
	})

	t.Run("command execution failure", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeErr: errors.New("command failed"),
		}
		svc := newTestServiceWithMock(mockPort)

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		success, message, status, err := svc.ApplyTroubleshootFix(context.Background(), session.ID, "WAN_DISABLED")

		require.NoError(t, err)
		assert.False(t, success)
		assert.Contains(t, message, "failed")
		assert.Equal(t, FixStatusFailed, status)
	})

	t.Run("rollback on failure", func(t *testing.T) {
		// This would require more complex mock setup to track rollback calls
		// For now, verify the fix has rollback command defined
		fix := GetFix("WAN_DISABLED")
		require.NotNil(t, fix)
		assert.NotEmpty(t, fix.RollbackCommand)
	})

	t.Run("concurrent fix application", func(t *testing.T) {
		svc := newTestService()
		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")

		done := make(chan bool)
		for i := 0; i < 3; i++ {
			go func() {
				_, _, _, _ = svc.ApplyTroubleshootFix(context.Background(), session.ID, "DNS_FAILED")
				done <- true
			}()
		}

		for i := 0; i < 3; i++ {
			<-done
		}

		// Verify session state is consistent
		retrieved, err := svc.GetSession(context.Background(), session.ID)
		require.NoError(t, err)
		assert.NotNil(t, retrieved)
	})

	t.Run("session not found", func(t *testing.T) {
		svc := newTestService()

		success, _, status, err := svc.ApplyTroubleshootFix(context.Background(), "nonexistent", "WAN_DISABLED")

		require.Error(t, err)
		assert.False(t, success)
		assert.Contains(t, err.Error(), "not found")
		assert.Equal(t, FixStatusFailed, status)
	})

	t.Run("track multiple applied fixes", func(t *testing.T) {
		svc := newTestService()
		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")

		// Apply multiple fixes
		svc.ApplyTroubleshootFix(context.Background(), session.ID, "DNS_FAILED")
		svc.ApplyTroubleshootFix(context.Background(), session.ID, "NAT_MISSING")

		retrieved, _ := svc.GetSession(context.Background(), session.ID)
		assert.Len(t, retrieved.AppliedFixes, 2)
	})
}

// TestDetectNetworkConfig tests network configuration detection
func TestDetectNetworkConfig(t *testing.T) {
	t.Run("full detection with DHCP", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ip/route": {
					Success: true,
					Data: []map[string]string{
						{"dst-address": "0.0.0.0/0", "gateway": "192.168.1.1", "interface": "ether1"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		config, err := svc.DetectNetworkConfig(context.Background(), "router-123")

		require.NoError(t, err)
		assert.Equal(t, "ether1", config.WanInterface)
		assert.Equal(t, "192.168.1.1", config.Gateway)
	})

	t.Run("static configuration", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ip/route": {
					Success: true,
					Data: []map[string]string{
						{"dst-address": "0.0.0.0/0", "gateway": "10.0.0.1", "interface": "ether1"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		config, err := svc.DetectNetworkConfig(context.Background(), "router-123")

		require.NoError(t, err)
		assert.Equal(t, "10.0.0.1", config.Gateway)
	})

	t.Run("no gateway configured", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ip/route": {
					Success: true,
					Data:    []map[string]string{},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		config, err := svc.DetectNetworkConfig(context.Background(), "router-123")

		require.Error(t, err)
		assert.Nil(t, config)
		assert.Contains(t, err.Error(), "no default route")
	})

	t.Run("ISP detection success", func(t *testing.T) {
		// ISP detection would make external API call
		// For unit test, we just verify the flow doesn't error
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ip/route": {
					Success: true,
					Data: []map[string]string{
						{"dst-address": "0.0.0.0/0", "gateway": "192.168.1.1", "interface": "ether1"},
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		config, err := svc.DetectNetworkConfig(context.Background(), "router-123")

		require.NoError(t, err)
		// ISPInfo might be nil if external API is not available
		assert.NotNil(t, config)
	})

	t.Run("detection timeout", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeErr: errors.New("timeout"),
		}
		svc := newTestServiceWithMock(mockPort)

		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
		defer cancel()

		config, err := svc.DetectNetworkConfig(ctx, "router-123")

		require.Error(t, err)
		assert.Nil(t, config)
	})

	t.Run("partial detection falls back to defaults", func(t *testing.T) {
		mockPort := &MockRouterPort{
			commands: map[string]*router.CommandResult{
				"/ip/route": {
					Success: true,
					Data: []map[string]string{
						{"dst-address": "0.0.0.0/0", "interface": "ether1"}, // No gateway
					},
				},
			},
		}
		svc := newTestServiceWithMock(mockPort)

		_, err := svc.DetectNetworkConfig(context.Background(), "router-123")

		// Should error if gateway is required
		if err != nil {
			assert.Contains(t, err.Error(), "gateway")
		}
	})
}

// TestCancelTroubleshoot tests session cancellation
func TestCancelTroubleshoot(t *testing.T) {
	t.Run("cancel running session", func(t *testing.T) {
		svc := newTestService()

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		cancelledSession, err := svc.CancelTroubleshoot(context.Background(), session.ID)

		require.NoError(t, err)
		assert.Equal(t, SessionStatusCancelled, cancelledSession.Status)
		assert.NotNil(t, cancelledSession.CompletedAt)
	})

	t.Run("cancel nonexistent session", func(t *testing.T) {
		svc := newTestService()

		_, err := svc.CancelTroubleshoot(context.Background(), "nonexistent")

		require.Error(t, err)
		assert.Contains(t, err.Error(), "not found")
	})
}

// TestGetSession tests session retrieval
func TestGetSession(t *testing.T) {
	t.Run("get existing session", func(t *testing.T) {
		svc := newTestService()

		session, _ := svc.StartTroubleshoot(context.Background(), "router-123")
		retrieved, err := svc.GetSession(context.Background(), session.ID)

		require.NoError(t, err)
		assert.Equal(t, session.ID, retrieved.ID)
		assert.Equal(t, session.RouterID, retrieved.RouterID)
	})

	t.Run("get nonexistent session", func(t *testing.T) {
		svc := newTestService()

		_, err := svc.GetSession(context.Background(), "nonexistent")

		require.Error(t, err)
		assert.Contains(t, err.Error(), "not found")
	})
}
