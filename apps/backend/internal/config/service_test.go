package config_test

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"backend/generated/ent"
	"backend/generated/ent/enttest"
	"backend/generated/ent/serviceinstance"
	"backend/internal/config"
	"backend/internal/config/services"

	"backend/internal/events"

	_ "github.com/mattn/go-sqlite3" // SQLite driver for tests
	"github.com/rs/zerolog"
)

// mockPathResolver is a mock implementation of storage.PathResolverPort for testing.
type mockPathResolver struct {
	configDir string
}

func (m *mockPathResolver) BinaryPath(serviceName string) string {
	return filepath.Join(m.configDir, "bin", serviceName)
}

func (m *mockPathResolver) ConfigPath(serviceName string) string {
	return filepath.Join(m.configDir, "config", serviceName+".json")
}

func (m *mockPathResolver) ManifestPath(serviceName string) string {
	return filepath.Join(m.configDir, "manifests", serviceName+".manifest")
}

func (m *mockPathResolver) DataPath(serviceName string) string {
	return filepath.Join(m.configDir, "data", serviceName)
}

func (m *mockPathResolver) LogsPath(serviceName string) string {
	return filepath.Join(m.configDir, "logs", serviceName)
}

func (m *mockPathResolver) RootPath(pathType string) string {
	return filepath.Join(m.configDir, pathType)
}

// mockEventBus is a minimal mock of events.EventBus for testing.
type mockEventBus struct {
	publishedEvents []events.Event
}

func (m *mockEventBus) Publish(ctx context.Context, event events.Event) error {
	m.publishedEvents = append(m.publishedEvents, event)
	return nil
}

func (m *mockEventBus) Subscribe(eventType string, handler events.EventHandler) error {
	return nil
}

func (m *mockEventBus) SubscribeAll(handler events.EventHandler) error {
	return nil
}

func (m *mockEventBus) Unsubscribe(eventType string, handler events.EventHandler) error {
	return nil
}

func (m *mockEventBus) Close() error {
	return nil
}

// setupTestService creates a test Service with in-memory database and temp storage.
func setupTestService(t *testing.T) (*config.Service, *ent.Client, string, func()) {
	// Create temp directory for config files
	tempDir, err := os.MkdirTemp("", "config_gen_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	// Create in-memory test database
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")

	// Create registry and register Tor generator
	registry := config.NewRegistry()
	if err := registry.Register(services.NewTorGenerator()); err != nil {
		t.Fatalf("Failed to register Tor generator: %v", err)
	}

	// Create mock dependencies
	pathResolver := &mockPathResolver{configDir: tempDir}
	eventBus := &mockEventBus{}
	logger := zerolog.Nop()

	// Create ConfigService
	service, err := config.NewService(config.Config{
		Registry:     registry,
		Store:        client,
		EventBus:     eventBus,
		PathResolver: pathResolver,
		Logger:       logger,
	})
	if err != nil {
		t.Fatalf("Failed to create Service: %v", err)
	}

	cleanup := func() {
		client.Close()
		os.RemoveAll(tempDir)
	}

	return service, client, tempDir, cleanup
}

func TestService_ValidateConfig(t *testing.T) {
	service, client, _, cleanup := setupTestService(t)
	defer cleanup()

	ctx := context.Background()

	// Create a test service instance
	instance, err := client.ServiceInstance.Create().
		SetID("test-instance-123").
		SetFeatureID("tor").
		SetInstanceName("Test Tor Relay").
		SetRouterID("router-1").
		SetStatus(serviceinstance.StatusInstalled).
		SetBindIP("192.168.1.100").
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create test instance: %v", err)
	}

	tests := []struct {
		name    string
		config  map[string]interface{}
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid config",
			config: map[string]interface{}{
				"nickname":        "TestRelay",
				"contact_info":    "test@example.com",
				"relay_type":      "relay",
				"socks_port":      9050,
				"control_port":    9051,
				"or_port":         9001,
				"bandwidth_rate":  1000,
				"bandwidth_burst": 2000,
			},
			wantErr: false,
		},
		{
			name: "invalid email",
			config: map[string]interface{}{
				"nickname":        "TestRelay",
				"contact_info":    "not-an-email",
				"relay_type":      "relay",
				"socks_port":      9050,
				"control_port":    9051,
				"or_port":         9001,
				"bandwidth_rate":  1000,
				"bandwidth_burst": 2000,
			},
			wantErr: true,
			errMsg:  "valid email",
		},
		{
			name: "missing required field",
			config: map[string]interface{}{
				"nickname":     "TestRelay",
				"contact_info": "test@example.com",
				// Missing required fields
			},
			wantErr: true,
			errMsg:  "required field",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.ValidateConfig(ctx, instance.ID, tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateConfig() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr && tt.errMsg != "" && err != nil {
				if !strings.Contains(err.Error(), tt.errMsg) {
					t.Errorf("ValidateConfig() error message = %v, want to contain %v", err.Error(), tt.errMsg)
				}
			}
		})
	}
}

func TestService_GetSchema(t *testing.T) {
	service, _, _, cleanup := setupTestService(t)
	defer cleanup()

	ctx := context.Background()

	schema, err := service.GetSchema(ctx, "tor")
	if err != nil {
		t.Fatalf("GetSchema() error = %v", err)
	}

	if schema.ServiceType != "tor" {
		t.Errorf("GetSchema() ServiceType = %v, want tor", schema.ServiceType)
	}

	if len(schema.Fields) == 0 {
		t.Error("GetSchema() returned schema with no fields")
	}
}

func TestService_ApplyConfig(t *testing.T) {
	service, client, tempDir, cleanup := setupTestService(t)
	defer cleanup()

	ctx := context.Background()

	// Create a test service instance
	instance, err := client.ServiceInstance.Create().
		SetID("test-instance-456").
		SetFeatureID("tor").
		SetInstanceName("Test Tor Relay").
		SetRouterID("router-1").
		SetStatus(serviceinstance.StatusInstalled).
		SetBindIP("192.168.1.100").
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create test instance: %v", err)
	}

	config := map[string]interface{}{
		"nickname":        "TestRelay",
		"contact_info":    "test@example.com",
		"relay_type":      "relay",
		"socks_port":      9050,
		"control_port":    9051,
		"or_port":         9001,
		"dir_port":        9030,
		"bandwidth_rate":  1000,
		"bandwidth_burst": 2000,
	}

	// Apply config
	err = service.ApplyConfig(ctx, instance.ID, config)
	if err != nil {
		t.Fatalf("ApplyConfig() error = %v", err)
	}

	// Verify config file was created
	configPath := filepath.Join(tempDir, "config", "tor", "torrc")
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		t.Errorf("Config file not created at %s", configPath)
	}

	// Verify config content
	content, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatalf("Failed to read config file: %v", err)
	}

	// Check that generated config contains expected values
	contentStr := string(content)
	expectedStrings := []string{
		"Nickname TestRelay",
		"ContactInfo test@example.com",
		"SOCKSPort 192.168.1.100:9050",
		"ControlPort 192.168.1.100:9051",
	}

	for _, expected := range expectedStrings {
		if !strings.Contains(contentStr, expected) {
			t.Errorf("Config content missing expected string: %s", expected)
		}
	}

	// Verify config was persisted to database
	updatedInstance, err := client.ServiceInstance.Get(ctx, instance.ID)
	if err != nil {
		t.Fatalf("Failed to fetch updated instance: %v", err)
	}

	if updatedInstance.Config == nil {
		t.Error("Config not persisted to database")
	}

	if nickname, ok := updatedInstance.Config["nickname"].(string); !ok || nickname != "TestRelay" {
		t.Errorf("Config nickname not persisted correctly, got %v", updatedInstance.Config["nickname"])
	}
}

func TestService_AtomicWrite(t *testing.T) {
	service, client, tempDir, cleanup := setupTestService(t)
	defer cleanup()

	ctx := context.Background()

	// Create a test service instance
	instance, err := client.ServiceInstance.Create().
		SetID("test-instance-789").
		SetFeatureID("tor").
		SetInstanceName("Test Tor Relay").
		SetRouterID("router-1").
		SetStatus(serviceinstance.StatusInstalled).
		SetBindIP("192.168.1.100").
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create test instance: %v", err)
	}

	config1 := map[string]interface{}{
		"nickname":        "Relay1",
		"contact_info":    "test1@example.com",
		"relay_type":      "relay",
		"socks_port":      9050,
		"control_port":    9051,
		"or_port":         9001,
		"bandwidth_rate":  1000,
		"bandwidth_burst": 2000,
	}

	// Apply first config
	err = service.ApplyConfig(ctx, instance.ID, config1)
	if err != nil {
		t.Fatalf("ApplyConfig() error = %v", err)
	}

	configPath := filepath.Join(tempDir, "config", "tor", "torrc")
	backupPath := configPath + ".backup"

	// Apply second config (should create backup)
	config2 := map[string]interface{}{
		"nickname":        "Relay2",
		"contact_info":    "test2@example.com",
		"relay_type":      "relay",
		"socks_port":      9050,
		"control_port":    9051,
		"or_port":         9001,
		"bandwidth_rate":  2000,
		"bandwidth_burst": 4000,
	}

	err = service.ApplyConfig(ctx, instance.ID, config2)
	if err != nil {
		t.Fatalf("ApplyConfig() second call error = %v", err)
	}

	// Verify new config is in place
	content, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatalf("Failed to read config file: %v", err)
	}

	if !strings.Contains(string(content), "Nickname Relay2") {
		t.Error("New config not applied correctly")
	}

	// Verify backup was created
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		t.Error("Backup file not created")
	} else {
		// Verify backup contains old config
		backupContent, err := os.ReadFile(backupPath)
		if err != nil {
			t.Fatalf("Failed to read backup file: %v", err)
		}

		if !strings.Contains(string(backupContent), "Nickname Relay1") {
			t.Error("Backup does not contain original config")
		}
	}
}

func TestService_GetConfig(t *testing.T) {
	service, client, _, cleanup := setupTestService(t)
	defer cleanup()

	ctx := context.Background()

	existingConfig := map[string]interface{}{
		"nickname":     "ExistingRelay",
		"contact_info": "existing@example.com",
	}

	// Create instance with existing config
	instance, err := client.ServiceInstance.Create().
		SetID("test-instance-999").
		SetFeatureID("tor").
		SetInstanceName("Test Tor Relay").
		SetRouterID("router-1").
		SetStatus(serviceinstance.StatusInstalled).
		SetBindIP("192.168.1.100").
		SetConfig(existingConfig).
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create test instance: %v", err)
	}

	// Get config
	retrievedConfig, err := service.GetConfig(ctx, instance.ID)
	if err != nil {
		t.Fatalf("GetConfig() error = %v", err)
	}

	if nickname, ok := retrievedConfig["nickname"].(string); !ok || nickname != "ExistingRelay" {
		t.Errorf("GetConfig() nickname = %v, want ExistingRelay", retrievedConfig["nickname"])
	}
}
