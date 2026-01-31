package adapters

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"backend/internal/router"
)

func TestNewRESTAdapter(t *testing.T) {
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
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			adapter, err := NewRESTAdapter(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewRESTAdapter() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && adapter == nil {
				t.Error("NewRESTAdapter() returned nil adapter")
			}
		})
	}
}

func TestRESTAdapter_Connect(t *testing.T) {
	// Create mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check authentication
		user, pass, ok := r.BasicAuth()
		if !ok || user != "admin" || pass != "testpass" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		switch r.URL.Path {
		case "/rest/system/resource":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"version":           "7.12.1 (stable)",
				"board-name":        "RB4011iGS+5HacQ2HnD-IN",
				"architecture-name": "arm64",
				"uptime":            "3d5h42m",
			})
		case "/rest/system/identity":
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"name": "TestRouter",
			})
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	// Extract host and port from server URL
	hostPort := strings.TrimPrefix(server.URL, "http://")
	parts := strings.Split(hostPort, ":")
	host := parts[0]
	var port int
	if len(parts) > 1 {
		fmt.Sscanf(parts[1], "%d", &port)
	}

	t.Run("successful connection", func(t *testing.T) {
		adapter, err := NewRESTAdapter(router.AdapterConfig{
			Host:     host,
			Port:     port,
			Username: "admin",
			Password: "testpass",
			Timeout:  5,
		})
		if err != nil {
			t.Fatalf("NewRESTAdapter() error = %v", err)
		}

		err = adapter.Connect(context.Background())
		if err != nil {
			t.Errorf("Connect() error = %v", err)
			return
		}

		if !adapter.IsConnected() {
			t.Error("IsConnected() = false after successful Connect()")
		}

		health := adapter.Health(context.Background())
		if health.Status != router.StatusConnected {
			t.Errorf("Health().Status = %v, want %v", health.Status, router.StatusConnected)
		}

		info, err := adapter.Info()
		if err != nil {
			t.Errorf("Info() error = %v", err)
		}
		if info.Identity != "TestRouter" {
			t.Errorf("Info().Identity = %v, want TestRouter", info.Identity)
		}
		if !info.Version.SupportsREST() {
			t.Error("Version should support REST")
		}
	})

	t.Run("authentication failure", func(t *testing.T) {
		adapter, err := NewRESTAdapter(router.AdapterConfig{
			Host:     host,
			Port:     port,
			Username: "admin",
			Password: "wrongpass",
			Timeout:  5,
		})
		if err != nil {
			t.Fatalf("NewRESTAdapter() error = %v", err)
		}

		err = adapter.Connect(context.Background())
		if err == nil {
			t.Error("Connect() should fail with wrong password")
		}

		if adapter.IsConnected() {
			t.Error("IsConnected() should be false after failed Connect()")
		}
	})
}

func TestRESTAdapter_ExecuteCommand(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, pass, ok := r.BasicAuth()
		if !ok || user != "admin" || pass != "testpass" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		switch {
		case r.Method == "GET" && r.URL.Path == "/rest/system/resource":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"version":    "7.12.1 (stable)",
				"board-name": "TestBoard",
			})
		case r.Method == "GET" && r.URL.Path == "/rest/system/identity":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"name": "TestRouter",
			})
		case r.Method == "GET" && r.URL.Path == "/rest/interface":
			json.NewEncoder(w).Encode([]map[string]interface{}{
				{".id": "*1", "name": "ether1", "type": "ether"},
				{".id": "*2", "name": "ether2", "type": "ether"},
			})
		case r.Method == "PUT" && r.URL.Path == "/rest/interface/bridge":
			json.NewEncoder(w).Encode(map[string]interface{}{
				".id": "*A1",
			})
		case r.Method == "PATCH" && strings.HasPrefix(r.URL.Path, "/rest/interface/"):
			w.WriteHeader(http.StatusOK)
		case r.Method == "DELETE" && strings.HasPrefix(r.URL.Path, "/rest/interface/"):
			w.WriteHeader(http.StatusOK)
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	hostPort := strings.TrimPrefix(server.URL, "http://")
	parts := strings.Split(hostPort, ":")
	host := parts[0]
	var port int
	if len(parts) > 1 {
		fmt.Sscanf(parts[1], "%d", &port)
	}

	adapter, _ := NewRESTAdapter(router.AdapterConfig{
		Host:     host,
		Port:     port,
		Username: "admin",
		Password: "testpass",
		Timeout:  5,
	})
	adapter.Connect(context.Background())

	t.Run("print command", func(t *testing.T) {
		result, err := adapter.ExecuteCommand(context.Background(), router.Command{
			Path:   "/interface",
			Action: "print",
		})
		if err != nil {
			t.Errorf("ExecuteCommand() error = %v", err)
			return
		}
		if !result.Success {
			t.Error("ExecuteCommand() Success = false")
		}
		if len(result.Data) != 2 {
			t.Errorf("ExecuteCommand() len(Data) = %d, want 2", len(result.Data))
		}
	})

	t.Run("add command", func(t *testing.T) {
		result, err := adapter.ExecuteCommand(context.Background(), router.Command{
			Path:   "/interface/bridge",
			Action: "add",
			Args:   map[string]string{"name": "bridge1"},
		})
		if err != nil {
			t.Errorf("ExecuteCommand() error = %v", err)
			return
		}
		if result.ID != "*A1" {
			t.Errorf("ExecuteCommand() ID = %v, want *A1", result.ID)
		}
	})

	t.Run("set command", func(t *testing.T) {
		result, err := adapter.ExecuteCommand(context.Background(), router.Command{
			Path:   "/interface",
			Action: "set",
			ID:     "*1",
			Args:   map[string]string{"comment": "updated"},
		})
		if err != nil {
			t.Errorf("ExecuteCommand() error = %v", err)
			return
		}
		if !result.Success {
			t.Error("ExecuteCommand() Success = false")
		}
	})

	t.Run("remove command", func(t *testing.T) {
		result, err := adapter.ExecuteCommand(context.Background(), router.Command{
			Path:   "/interface",
			Action: "remove",
			ID:     "*1",
		})
		if err != nil {
			t.Errorf("ExecuteCommand() error = %v", err)
			return
		}
		if !result.Success {
			t.Error("ExecuteCommand() Success = false")
		}
	})

	t.Run("set without ID", func(t *testing.T) {
		_, err := adapter.ExecuteCommand(context.Background(), router.Command{
			Path:   "/interface",
			Action: "set",
			Args:   map[string]string{"comment": "updated"},
		})
		if err == nil {
			t.Error("ExecuteCommand() should fail without ID for set")
		}
	})
}

func TestRESTAdapter_QueryState(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, pass, ok := r.BasicAuth()
		if !ok || user != "admin" || pass != "testpass" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")

		switch r.URL.Path {
		case "/rest/system/resource":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"version":    "7.12.1",
				"board-name": "TestBoard",
			})
		case "/rest/system/identity":
			json.NewEncoder(w).Encode(map[string]interface{}{
				"name": "TestRouter",
			})
		case "/rest/ip/address":
			json.NewEncoder(w).Encode([]map[string]interface{}{
				{".id": "*1", "address": "192.168.88.1/24", "interface": "ether1"},
				{".id": "*2", "address": "10.0.0.1/24", "interface": "ether2"},
				{".id": "*3", "address": "172.16.0.1/16", "interface": "bridge1"},
			})
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	hostPort := strings.TrimPrefix(server.URL, "http://")
	parts := strings.Split(hostPort, ":")
	host := parts[0]
	var port int
	if len(parts) > 1 {
		fmt.Sscanf(parts[1], "%d", &port)
	}

	adapter, _ := NewRESTAdapter(router.AdapterConfig{
		Host:     host,
		Port:     port,
		Username: "admin",
		Password: "testpass",
		Timeout:  5,
	})
	adapter.Connect(context.Background())

	t.Run("query all", func(t *testing.T) {
		result, err := adapter.QueryState(context.Background(), router.StateQuery{
			Path: "/ip/address",
		})
		if err != nil {
			t.Errorf("QueryState() error = %v", err)
			return
		}
		if result.Count != 3 {
			t.Errorf("QueryState() Count = %d, want 3", result.Count)
		}
	})

	t.Run("query with limit", func(t *testing.T) {
		result, err := adapter.QueryState(context.Background(), router.StateQuery{
			Path:  "/ip/address",
			Limit: 2,
		})
		if err != nil {
			t.Errorf("QueryState() error = %v", err)
			return
		}
		if result.Count != 2 {
			t.Errorf("QueryState() Count = %d, want 2", result.Count)
		}
	})
}

func TestRESTAdapter_Protocol(t *testing.T) {
	adapter, _ := NewRESTAdapter(router.AdapterConfig{
		Host:     "192.168.88.1",
		Username: "admin",
		Password: "password",
	})

	if got := adapter.Protocol(); got != router.ProtocolREST {
		t.Errorf("Protocol() = %v, want %v", got, router.ProtocolREST)
	}
}

func TestParseRouterOSVersion(t *testing.T) {
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
			v := parseRouterOSVersion(tt.input)
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

func TestParseUptime(t *testing.T) {
	tests := []struct {
		input string
		want  time.Duration
	}{
		{"1w2d3h4m5s", 7*24*time.Hour + 2*24*time.Hour + 3*time.Hour + 4*time.Minute + 5*time.Second},
		{"3d5h42m", 3*24*time.Hour + 5*time.Hour + 42*time.Minute},
		{"12h30m", 12*time.Hour + 30*time.Minute},
		{"45s", 45 * time.Second},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := parseUptime(tt.input)
			if got != tt.want {
				t.Errorf("parseUptime(%s) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestBuildRESTPath(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"/interface/bridge", "/interface/bridge"},
		{"interface/bridge", "/interface/bridge"},
		{"/rest/interface/bridge", "/interface/bridge"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			if got := buildRESTPath(tt.input); got != tt.want {
				t.Errorf("buildRESTPath(%s) = %s, want %s", tt.input, got, tt.want)
			}
		})
	}
}

