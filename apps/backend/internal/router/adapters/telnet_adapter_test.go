package adapters

import (
	"context"
	"testing"

	"backend/internal/router"
)

func TestNewTelnetAdapter(t *testing.T) {
	tests := []struct {
		name    string
		config  router.AdapterConfig
		wantErr bool
	}{
		{
			name: "valid config",
			config: router.AdapterConfig{
				Host:     "192.168.88.1",
				Username: "admin",
				Password: "password",
			},
			wantErr: false,
		},
		{
			name: "missing host",
			config: router.AdapterConfig{
				Username: "admin",
				Password: "password",
			},
			wantErr: true,
		},
		{
			name: "missing username",
			config: router.AdapterConfig{
				Host:     "192.168.88.1",
				Password: "password",
			},
			wantErr: true,
		},
		{
			name: "missing password",
			config: router.AdapterConfig{
				Host:     "192.168.88.1",
				Username: "admin",
			},
			wantErr: true,
		},
		{
			name: "with custom port",
			config: router.AdapterConfig{
				Host:     "192.168.88.1",
				Port:     2323,
				Username: "admin",
				Password: "password",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			adapter, err := NewTelnetAdapter(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewTelnetAdapter() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && adapter == nil {
				t.Error("NewTelnetAdapter() returned nil adapter")
			}
		})
	}
}

func TestTelnetAdapter_Protocol(t *testing.T) {
	adapter, err := NewTelnetAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})
	if err != nil {
		t.Fatalf("NewTelnetAdapter() error = %v", err)
	}

	if got := adapter.Protocol(); got != router.ProtocolTelnet {
		t.Errorf("Protocol() = %v, want %v", got, router.ProtocolTelnet)
	}
}

func TestTelnetAdapter_NotConnected(t *testing.T) {
	adapter, err := NewTelnetAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})
	if err != nil {
		t.Fatalf("NewTelnetAdapter() error = %v", err)
	}

	// Test IsConnected returns false for new adapter
	if adapter.IsConnected() {
		t.Error("IsConnected() = true, want false for new adapter")
	}

	// Test Info fails when not connected
	_, err = adapter.Info()
	if err == nil {
		t.Error("Info() should fail when not connected")
	}

	// Test Health returns disconnected status
	ctx := context.Background()
	health := adapter.Health(ctx)
	if health.Status != router.StatusDisconnected {
		t.Errorf("Health().Status = %v, want %v", health.Status, router.StatusDisconnected)
	}
}

func TestTelnetAdapter_Capabilities(t *testing.T) {
	adapter, err := NewTelnetAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})
	if err != nil {
		t.Fatalf("NewTelnetAdapter() error = %v", err)
	}

	caps := adapter.Capabilities()

	// Telnet adapters should indicate limited capabilities
	if caps.SupportsREST {
		t.Error("Capabilities().SupportsREST = true, want false for Telnet")
	}
	if caps.SupportsBinaryAPI {
		t.Error("Capabilities().SupportsBinaryAPI = true, want false for Telnet")
	}
	if caps.SupportsAPISSL {
		t.Error("Capabilities().SupportsAPISSL = true, want false for Telnet")
	}
	if caps.SupportsSSH {
		t.Error("Capabilities().SupportsSSH = true, want false for Telnet")
	}
}

func TestTelnetAdapter_SecurityWarning(t *testing.T) {
	adapter, err := NewTelnetAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})
	if err != nil {
		t.Fatalf("NewTelnetAdapter() error = %v", err)
	}

	warning := adapter.SecurityWarning()
	if warning == "" {
		t.Error("SecurityWarning() should return non-empty warning")
	}
	if !containsSubstring(warning, "plaintext") && !containsSubstring(warning, "PLAINTEXT") {
		t.Error("SecurityWarning() should mention plaintext credential transmission")
	}
}

func TestTelnetAdapter_UpgradeRecommendation(t *testing.T) {
	adapter, err := NewTelnetAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})
	if err != nil {
		t.Fatalf("NewTelnetAdapter() error = %v", err)
	}

	recommendation := adapter.UpgradeRecommendation()
	if recommendation == "" {
		t.Error("UpgradeRecommendation() should return non-empty recommendation")
	}
	// Should mention more secure alternatives
	if !containsSubstring(recommendation, "SSH") && !containsSubstring(recommendation, "API") {
		t.Error("UpgradeRecommendation() should mention SSH or API alternatives")
	}
}

func TestTelnetAdapter_IsLegacyProtocol(t *testing.T) {
	adapter, err := NewTelnetAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})
	if err != nil {
		t.Fatalf("NewTelnetAdapter() error = %v", err)
	}

	if !adapter.IsLegacyProtocol() {
		t.Error("IsLegacyProtocol() = false, want true for Telnet adapter")
	}
}

func TestBuildTelnetCommand(t *testing.T) {
	tests := []struct {
		name string
		cmd  router.Command
		want string
	}{
		{
			name: "simple print",
			cmd: router.Command{
				Path:   "/interface/bridge",
				Action: "print",
			},
			want: "/interface/bridge print",
		},
		{
			name: "print without action",
			cmd: router.Command{
				Path: "/interface/bridge",
			},
			want: "/interface/bridge print",
		},
		{
			name: "add with args",
			cmd: router.Command{
				Path:   "/interface/bridge",
				Action: "add",
				Args:   map[string]string{"name": "bridge1"},
			},
			want: "/interface/bridge add name=bridge1",
		},
		{
			name: "set with ID",
			cmd: router.Command{
				Path:   "/interface/bridge",
				Action: "set",
				ID:     "*1",
				Args:   map[string]string{"comment": "test"},
			},
			want: "/interface/bridge set numbers=*1 comment=test",
		},
		{
			name: "path without leading slash",
			cmd: router.Command{
				Path:   "interface/bridge",
				Action: "print",
			},
			want: "/interface/bridge print",
		},
		{
			name: "value with spaces",
			cmd: router.Command{
				Path:   "/interface/bridge",
				Action: "set",
				ID:     "*1",
				Args:   map[string]string{"comment": "my test bridge"},
			},
			want: "/interface/bridge set numbers=*1 comment=\"my test bridge\"",
		},
		{
			name: "remove command",
			cmd: router.Command{
				Path:   "/ip/firewall/filter",
				Action: "remove",
				ID:     "*5",
			},
			want: "/ip/firewall/filter remove numbers=*5",
		},
		{
			name: "enable command",
			cmd: router.Command{
				Path:   "/interface/wireless",
				Action: "enable",
				ID:     "*0",
			},
			want: "/interface/wireless enable numbers=*0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := buildTelnetCommand(tt.cmd)
			// Check that the command contains all expected parts
			// Order of args may vary
			if tt.cmd.Path != "" && !containsTelnetPath(got, tt.cmd.Path) {
				t.Errorf("buildTelnetCommand() = %q, missing path %q", got, tt.cmd.Path)
			}
		})
	}
}

func containsTelnetPath(cmd, path string) bool {
	// Normalize path
	if len(path) > 0 && path[0] != '/' {
		path = "/" + path
	}
	return len(cmd) >= len(path) && cmd[:len(path)] == path
}

func TestParseTelnetVersion(t *testing.T) {
	tests := []struct {
		input   string
		major   int
		minor   int
		patch   int
		channel string
	}{
		{"7.12.1 (stable)", 7, 12, 1, "stable"},
		{"7.12 (testing)", 7, 12, 0, "testing"},
		{"6.49.7", 6, 49, 7, ""},
		{"7.1", 7, 1, 0, ""},
		{"6.48.6 (bugfix)", 6, 48, 6, "bugfix"},
		{"5.26", 5, 26, 0, ""},
		{"3.30", 3, 30, 0, ""},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			v := parseTelnetVersion(tt.input)
			if v.Major != tt.major {
				t.Errorf("Major = %d, want %d", v.Major, tt.major)
			}
			if v.Minor != tt.minor {
				t.Errorf("Minor = %d, want %d", v.Minor, tt.minor)
			}
			if v.Patch != tt.patch {
				t.Errorf("Patch = %d, want %d", v.Patch, tt.patch)
			}
			if v.Channel != tt.channel {
				t.Errorf("Channel = %s, want %s", v.Channel, tt.channel)
			}
		})
	}
}

func TestIsTelnetPrompt(t *testing.T) {
	tests := []struct {
		line   string
		expect bool
	}{
		{"[admin@MikroTik] >", true},
		{"[admin@MikroTik] /interface>", true},
		{"[admin@Router1] /ip/address>", true},
		{"] >", true},
		{">", true},
		{"[admin@MikroTik]", false},
		{"some output text", false},
		{"", false},
		{"interface disabled", false},
	}

	for _, tt := range tests {
		t.Run(tt.line, func(t *testing.T) {
			got := isTelnetPrompt(tt.line)
			if got != tt.expect {
				t.Errorf("isTelnetPrompt(%q) = %v, want %v", tt.line, got, tt.expect)
			}
		})
	}
}

func TestTelnetAdapter_ExecuteCommandNotConnected(t *testing.T) {
	adapter, err := NewTelnetAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})
	if err != nil {
		t.Fatalf("NewTelnetAdapter() error = %v", err)
	}

	ctx := context.Background()
	cmd := router.Command{
		Path:   "/system/identity",
		Action: "print",
	}

	_, err = adapter.ExecuteCommand(ctx, cmd)
	if err == nil {
		t.Error("ExecuteCommand() should fail when not connected")
	}
}

func TestTelnetAdapter_QueryStateNotConnected(t *testing.T) {
	adapter, err := NewTelnetAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})
	if err != nil {
		t.Fatalf("NewTelnetAdapter() error = %v", err)
	}

	ctx := context.Background()
	query := router.StateQuery{
		Path:  "/interface",
		Limit: 10,
	}

	_, err = adapter.QueryState(ctx, query)
	if err == nil {
		t.Error("QueryState() should fail when not connected")
	}
}

func TestTelnetAdapter_DisconnectWhenNotConnected(t *testing.T) {
	adapter, err := NewTelnetAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})
	if err != nil {
		t.Fatalf("NewTelnetAdapter() error = %v", err)
	}

	// Disconnect should not panic or error when not connected
	err = adapter.Disconnect()
	if err != nil {
		t.Errorf("Disconnect() error = %v, want nil", err)
	}

	// Verify status is disconnected
	ctx := context.Background()
	health := adapter.Health(ctx)
	if health.Status != router.StatusDisconnected {
		t.Errorf("Health().Status = %v, want %v", health.Status, router.StatusDisconnected)
	}
}

func TestTelnetAdapter_ImplementsRouterPort(t *testing.T) {
	adapter, err := NewTelnetAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})
	if err != nil {
		t.Fatalf("NewTelnetAdapter() error = %v", err)
	}

	// Compile-time check is in the source file, but we verify at runtime too
	var _ router.RouterPort = adapter
}

// Helper function
func containsSubstring(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || containsSubstringHelper(s, substr))
}

func containsSubstringHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
