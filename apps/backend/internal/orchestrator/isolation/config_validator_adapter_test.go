package isolation

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"backend/generated/ent"

	"github.com/rs/zerolog"
)

// setupTestInstance creates a test instance with the given feature ID and config content
// It creates the necessary directory structure and writes the config file
func setupTestInstance(t *testing.T, tmpDir, featureID, configContent string) *ent.ServiceInstance {
	// Create directory structure: tmpDir/bin/ and tmpDir/config/
	binDir := filepath.Join(tmpDir, "bin")
	configDir := filepath.Join(tmpDir, "config")

	if err := os.MkdirAll(binDir, 0750); err != nil {
		t.Fatalf("Failed to create bin dir: %v", err)
	}
	if err := os.MkdirAll(configDir, 0750); err != nil {
		t.Fatalf("Failed to create config dir: %v", err)
	}

	// Determine config file name
	adapter := NewConfigValidatorAdapter(zerolog.Nop())
	configFileName := adapter.getConfigFileName(featureID)

	// Write config file
	configPath := filepath.Join(configDir, configFileName)
	if err := os.WriteFile(configPath, []byte(configContent), 0640); err != nil {
		t.Fatalf("Failed to write config file: %v", err)
	}

	// Create instance with BinaryPath pointing to bin directory
	return &ent.ServiceInstance{
		ID:         "test-instance-" + featureID,
		FeatureID:  featureID,
		BinaryPath: filepath.Join(binDir, featureID),
	}
}

func TestConfigValidatorAdapter_Tor(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := `# Tor configuration
SOCKSPort 192.168.1.10:9050
ControlPort 192.168.1.10:9051
DataDirectory /data/tor
`
	instance := setupTestInstance(t, tmpDir, "tor", configContent)

	adapter := NewConfigValidatorAdapter(zerolog.Nop())
	bindIP, err := adapter.ValidateBinding(context.Background(), instance)
	if err != nil {
		t.Fatalf("ValidateBinding failed: %v", err)
	}

	if bindIP != "192.168.1.10" {
		t.Errorf("Expected bind IP '192.168.1.10', got '%s'", bindIP)
	}
}

func TestConfigValidatorAdapter_Tor_WildcardRejected(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := `# Tor configuration with wildcard
SOCKSPort 0.0.0.0:9050
ControlPort 127.0.0.1:9051
`
	instance := setupTestInstance(t, tmpDir, "tor", configContent)

	adapter := NewConfigValidatorAdapter(zerolog.Nop())
	_, err := adapter.ValidateBinding(context.Background(), instance)
	if err == nil {
		t.Fatal("Expected wildcard validation to fail, but it succeeded")
	}

	if !strings.Contains(err.Error(), "wildcard") {
		t.Errorf("Expected error to mention 'wildcard', got: %v", err)
	}
}

func TestConfigValidatorAdapter_SingBox(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := `{
  "inbounds": [
    {
      "type": "mixed",
      "listen": "192.168.1.20",
      "listen_port": 1080
    }
  ]
}`
	instance := setupTestInstance(t, tmpDir, "sing-box", configContent)

	adapter := NewConfigValidatorAdapter(zerolog.Nop())
	bindIP, err := adapter.ValidateBinding(context.Background(), instance)
	if err != nil {
		t.Fatalf("ValidateBinding failed: %v", err)
	}

	if bindIP != "192.168.1.20" {
		t.Errorf("Expected bind IP '192.168.1.20', got '%s'", bindIP)
	}
}

func TestConfigValidatorAdapter_SingBox_WildcardRejected(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := `{
  "inbounds": [
    {
      "type": "mixed",
      "listen": "0.0.0.0",
      "listen_port": 1080
    }
  ]
}`
	instance := setupTestInstance(t, tmpDir, "sing-box", configContent)

	adapter := NewConfigValidatorAdapter(zerolog.Nop())
	_, err := adapter.ValidateBinding(context.Background(), instance)
	if err == nil {
		t.Fatal("Expected wildcard validation to fail, but it succeeded")
	}

	if !strings.Contains(err.Error(), "wildcard") {
		t.Errorf("Expected error to mention 'wildcard', got: %v", err)
	}
}

func TestConfigValidatorAdapter_XrayCore(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := `{
  "inbounds": [
    {
      "protocol": "vless",
      "listen": "192.168.1.30",
      "port": 443
    }
  ]
}`
	instance := setupTestInstance(t, tmpDir, "xray-core", configContent)

	adapter := NewConfigValidatorAdapter(zerolog.Nop())
	bindIP, err := adapter.ValidateBinding(context.Background(), instance)
	if err != nil {
		t.Fatalf("ValidateBinding failed: %v", err)
	}

	if bindIP != "192.168.1.30" {
		t.Errorf("Expected bind IP '192.168.1.30', got '%s'", bindIP)
	}
}

func TestConfigValidatorAdapter_MTProxy(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := `-bind-to 192.168.1.40:8888 -secret <SECRET> -workers 4`
	instance := setupTestInstance(t, tmpDir, "mtproxy", configContent)

	adapter := NewConfigValidatorAdapter(zerolog.Nop())
	bindIP, err := adapter.ValidateBinding(context.Background(), instance)
	if err != nil {
		t.Fatalf("ValidateBinding failed: %v", err)
	}

	if bindIP != "192.168.1.40" {
		t.Errorf("Expected bind IP '192.168.1.40', got '%s'", bindIP)
	}
}

func TestConfigValidatorAdapter_AdGuard(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := `bind_host: 192.168.1.50
bind_port: 3000
dns:
  bind_hosts:
    - 192.168.1.50
  port: 53
`
	instance := setupTestInstance(t, tmpDir, "adguard-home", configContent)

	adapter := NewConfigValidatorAdapter(zerolog.Nop())
	bindIP, err := adapter.ValidateBinding(context.Background(), instance)
	if err != nil {
		t.Fatalf("ValidateBinding failed: %v", err)
	}

	if bindIP != "192.168.1.50" {
		t.Errorf("Expected bind IP '192.168.1.50', got '%s'", bindIP)
	}
}

func TestConfigValidatorAdapter_AdGuard_WildcardRejected(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := `bind_host: 0.0.0.0
bind_port: 3000
dns:
  bind_hosts:
    - 0.0.0.0
  port: 53
`
	instance := setupTestInstance(t, tmpDir, "adguard-home", configContent)

	adapter := NewConfigValidatorAdapter(zerolog.Nop())
	_, err := adapter.ValidateBinding(context.Background(), instance)
	if err == nil {
		t.Fatal("Expected wildcard validation to fail, but it succeeded")
	}

	if !strings.Contains(err.Error(), "wildcard") {
		t.Errorf("Expected error to mention 'wildcard', got: %v", err)
	}
}

func TestConfigValidatorAdapter_Psiphon(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := `{
  "ListenInterface": "192.168.1.60"
}`
	instance := setupTestInstance(t, tmpDir, "psiphon", configContent)

	adapter := NewConfigValidatorAdapter(zerolog.Nop())
	bindIP, err := adapter.ValidateBinding(context.Background(), instance)
	if err != nil {
		t.Fatalf("ValidateBinding failed: %v", err)
	}

	if bindIP != "192.168.1.60" {
		t.Errorf("Expected bind IP '192.168.1.60', got '%s'", bindIP)
	}
}

func TestConfigValidatorAdapter_Psiphon_WildcardRejected(t *testing.T) {
	tmpDir := t.TempDir()
	configContent := `{
  "ListenInterface": "::"
}`
	instance := setupTestInstance(t, tmpDir, "psiphon", configContent)

	adapter := NewConfigValidatorAdapter(zerolog.Nop())
	_, err := adapter.ValidateBinding(context.Background(), instance)
	if err == nil {
		t.Fatal("Expected wildcard validation to fail, but it succeeded")
	}

	if !strings.Contains(err.Error(), "wildcard") {
		t.Errorf("Expected error to mention 'wildcard', got: %v", err)
	}
}

func TestConfigValidatorAdapter_UnsupportedServiceType(t *testing.T) {
	adapter := NewConfigValidatorAdapter(zerolog.Nop())

	instance := &ent.ServiceInstance{
		ID:        "test-unsupported",
		FeatureID: "unsupported-service",
	}

	_, err := adapter.ValidateBinding(context.Background(), instance)
	if err == nil {
		t.Fatal("Expected unsupported service type validation to fail, but it succeeded")
	}

	if !strings.Contains(err.Error(), "unsupported") {
		t.Errorf("Expected error to mention 'unsupported', got: %v", err)
	}
}

func TestConfigValidatorAdapter_ConfigFileNotFound(t *testing.T) {
	adapter := NewConfigValidatorAdapter(zerolog.Nop())

	instance := &ent.ServiceInstance{
		ID:         "test-not-found",
		FeatureID:  "tor",
		BinaryPath: "/non/existent/path/tor",
	}

	_, err := adapter.ValidateBinding(context.Background(), instance)
	if err == nil {
		t.Fatal("Expected config file not found validation to fail, but it succeeded")
	}

	if !strings.Contains(err.Error(), "not found") {
		t.Errorf("Expected error to mention 'not found', got: %v", err)
	}
}

func TestConfigValidatorAdapter_GetConfigFileName(t *testing.T) {
	adapter := NewConfigValidatorAdapter(zerolog.Nop())

	tests := []struct {
		featureID        string
		expectedFileName string
	}{
		{"tor", "torrc"},
		{"sing-box", "config.json"},
		{"xray-core", "config.json"},
		{"mtproxy", "mtproxy.conf"},
		{"adguard-home", "AdGuardHome.yaml"},
		{"psiphon", "psiphon.config"},
		{"unknown", "config.conf"},
	}

	for _, tt := range tests {
		t.Run(tt.featureID, func(t *testing.T) {
			fileName := adapter.getConfigFileName(tt.featureID)
			if fileName != tt.expectedFileName {
				t.Errorf("Expected config file name '%s', got '%s'", tt.expectedFileName, fileName)
			}
		})
	}
}
