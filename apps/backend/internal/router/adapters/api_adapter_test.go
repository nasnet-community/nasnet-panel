package adapters

import (
	"fmt"
	"testing"

	"backend/internal/router"
)

func TestNewAPIAdapter(t *testing.T) {
	tests := []struct {
		name    string
		config  router.AdapterConfig
		useTLS  bool
		wantErr bool
	}{
		{
			name: "valid config without TLS",
			config: router.AdapterConfig{
				Host:     "192.168.88.1",
				Username: "admin",
				Password: "password",
			},
			useTLS:  false,
			wantErr: false,
		},
		{
			name: "valid config with TLS",
			config: router.AdapterConfig{
				Host:     "192.168.88.1",
				Username: "admin",
				Password: "password",
			},
			useTLS:  true,
			wantErr: false,
		},
		{
			name: "missing host",
			config: router.AdapterConfig{
				Username: "admin",
				Password: "password",
			},
			useTLS:  false,
			wantErr: true,
		},
		{
			name: "missing username",
			config: router.AdapterConfig{
				Host:     "192.168.88.1",
				Password: "password",
			},
			useTLS:  false,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			adapter, err := NewAPIAdapter(tt.config, tt.useTLS)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewAPIAdapter() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && adapter == nil {
				t.Error("NewAPIAdapter() returned nil adapter")
			}
		})
	}
}

func TestAPIAdapter_Protocol(t *testing.T) {
	t.Run("API protocol", func(t *testing.T) {
		adapter, _ := NewAPIAdapter(router.AdapterConfig{
			Host:     "192.168.88.1",
			Username: "admin",
			Password: "password",
		}, false)

		if got := adapter.Protocol(); got != router.ProtocolAPI {
			t.Errorf("Protocol() = %v, want %v", got, router.ProtocolAPI)
		}
	})

	t.Run("API-SSL protocol", func(t *testing.T) {
		adapter, _ := NewAPIAdapter(router.AdapterConfig{
			Host:     "192.168.88.1",
			Username: "admin",
			Password: "password",
		}, true)

		if got := adapter.Protocol(); got != router.ProtocolAPISSL {
			t.Errorf("Protocol() = %v, want %v", got, router.ProtocolAPISSL)
		}
	})
}

func TestAPIAdapter_NotConnected(t *testing.T) {
	adapter, _ := NewAPIAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	}, false)

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

func TestBuildAPIPath(t *testing.T) {
	tests := []struct {
		path   string
		action string
		want   string
	}{
		{"/interface/bridge", "add", "/interface/bridge/add"},
		{"/interface/bridge", "print", "/interface/bridge/print"},
		{"/interface/bridge", "", "/interface/bridge/print"},
		{"interface/bridge", "set", "/interface/bridge/set"},
		{"/interface/bridge/", "remove", "/interface/bridge/remove"},
	}

	for _, tt := range tests {
		t.Run(tt.path+"_"+tt.action, func(t *testing.T) {
			if got := buildAPIPath(tt.path, tt.action); got != tt.want {
				t.Errorf("buildAPIPath(%s, %s) = %s, want %s", tt.path, tt.action, got, tt.want)
			}
		})
	}
}

func TestBuildAPIArgs(t *testing.T) {
	tests := []struct {
		name    string
		args    map[string]string
		id      string
		query   string
		wantLen int
		wantHas []string
	}{
		{
			name:    "empty",
			args:    nil,
			id:      "",
			query:   "",
			wantLen: 0,
		},
		{
			name:    "with id",
			args:    nil,
			id:      "*1",
			query:   "",
			wantLen: 1,
			wantHas: []string{"=.id=*1"},
		},
		{
			name:    "with query",
			args:    nil,
			id:      "",
			query:   "interface=ether1",
			wantLen: 1,
			wantHas: []string{"?interface=ether1"},
		},
		{
			name:    "with args",
			args:    map[string]string{"name": "bridge1", "comment": "test"},
			id:      "",
			query:   "",
			wantLen: 2,
			wantHas: []string{"=name=bridge1", "=comment=test"},
		},
		{
			name:    "combined",
			args:    map[string]string{"name": "bridge1"},
			id:      "*1",
			query:   "",
			wantLen: 2,
			wantHas: []string{"=.id=*1", "=name=bridge1"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := buildAPIArgs(tt.args, tt.id, tt.query)
			if len(got) != tt.wantLen {
				t.Errorf("buildAPIArgs() len = %d, want %d", len(got), tt.wantLen)
			}

			for _, want := range tt.wantHas {
				found := false
				for _, arg := range got {
					if arg == want {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("buildAPIArgs() missing %s in %v", want, got)
				}
			}
		})
	}
}

func TestParseAPIVersion(t *testing.T) {
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
			v := parseAPIVersion(tt.input)
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

func TestTranslateAPIError(t *testing.T) {
	tests := []struct {
		name      string
		errMsg    string
		retryable bool
	}{
		{"session expired", "not logged in", true},
		{"unknown command", "no such command", false},
		{"timeout", "timeout reached", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := translateAPIError(fmt.Errorf("%s", tt.errMsg))
			if aerr, ok := err.(*router.AdapterError); ok {
				if aerr.Retryable != tt.retryable {
					t.Errorf("Retryable = %v, want %v", aerr.Retryable, tt.retryable)
				}
			}
		})
	}
}
