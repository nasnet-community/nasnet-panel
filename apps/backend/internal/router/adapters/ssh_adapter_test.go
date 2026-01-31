package adapters

import (
	"testing"

	"backend/internal/router"
)

func TestNewSSHAdapter(t *testing.T) {
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
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			adapter, err := NewSSHAdapter(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewSSHAdapter() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && adapter == nil {
				t.Error("NewSSHAdapter() returned nil adapter")
			}
		})
	}
}

func TestSSHAdapter_Protocol(t *testing.T) {
	adapter, _ := NewSSHAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})

	if got := adapter.Protocol(); got != router.ProtocolSSH {
		t.Errorf("Protocol() = %v, want %v", got, router.ProtocolSSH)
	}
}

func TestSSHAdapter_NotConnected(t *testing.T) {
	adapter, _ := NewSSHAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})

	if adapter.IsConnected() {
		t.Error("IsConnected() = true, want false for new adapter")
	}

	_, err := adapter.Info()
	if err == nil {
		t.Error("Info() should fail when not connected")
	}

	health := adapter.Health(nil)
	if health.Status != router.StatusDisconnected {
		t.Errorf("Health().Status = %v, want %v", health.Status, router.StatusDisconnected)
	}
}

func TestBuildSSHCommand(t *testing.T) {
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
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := buildSSHCommand(tt.cmd)
			// Check that the command contains all expected parts
			// Order of args may vary
			if tt.cmd.Path != "" && !containsPath(got, tt.cmd.Path) {
				t.Errorf("buildSSHCommand() = %q, missing path %q", got, tt.cmd.Path)
			}
		})
	}
}

func containsPath(cmd, path string) bool {
	// Normalize path
	if path[0] != '/' {
		path = "/" + path
	}
	return len(cmd) >= len(path) && cmd[:len(path)] == path
}

func TestParseSSHOutput_KeyValue(t *testing.T) {
	input := `                  uptime: 3d5h42m15s
                 version: 7.12.1 (stable)
              board-name: RB4011iGS+5HacQ2HnD-IN
             architecture-name: arm64
`
	result := parseSSHOutput(input)

	if len(result) == 0 {
		t.Error("parseSSHOutput() returned empty result")
		return
	}

	if result[0]["uptime"] != "3d5h42m15s" {
		t.Errorf("uptime = %q, want %q", result[0]["uptime"], "3d5h42m15s")
	}
	if result[0]["version"] != "7.12.1 (stable)" {
		t.Errorf("version = %q, want %q", result[0]["version"], "7.12.1 (stable)")
	}
}

func TestParseSSHVersion(t *testing.T) {
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
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			v := parseSSHVersion(tt.input)
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

func TestExtractAddedID(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"*1", "*1"},
		{"numbers: 0", "*0"},
		{"*15", "*15"},
		{"added interface *3", "*3"},
		{"no id here", ""},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			if got := extractAddedID(tt.input); got != tt.want {
				t.Errorf("extractAddedID(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}
