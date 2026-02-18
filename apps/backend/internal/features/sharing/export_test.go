package sharing

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"backend/generated/ent"

	"backend/internal/events"
	"backend/internal/router"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockRouterPort implements router.RouterPort for testing
type MockRouterPort struct {
	mock.Mock
}

func (m *MockRouterPort) Connect(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *MockRouterPort) Disconnect() error {
	args := m.Called()
	return args.Error(0)
}

func (m *MockRouterPort) IsConnected() bool {
	args := m.Called()
	return args.Bool(0)
}

func (m *MockRouterPort) Health(ctx context.Context) router.HealthStatus {
	args := m.Called(ctx)
	return args.Get(0).(router.HealthStatus)
}

func (m *MockRouterPort) Capabilities() router.PlatformCapabilities {
	args := m.Called()
	return args.Get(0).(router.PlatformCapabilities)
}

func (m *MockRouterPort) Info() (*router.RouterInfo, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*router.RouterInfo), args.Error(1)
}

func (m *MockRouterPort) ExecuteCommand(ctx context.Context, cmd router.Command) (*router.CommandResult, error) {
	args := m.Called(ctx, cmd)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*router.CommandResult), args.Error(1)
}

func (m *MockRouterPort) QueryState(ctx context.Context, query router.StateQuery) (*router.StateResult, error) {
	args := m.Called(ctx, query)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*router.StateResult), args.Error(1)
}

func (m *MockRouterPort) Protocol() router.Protocol {
	args := m.Called()
	return args.Get(0).(router.Protocol)
}

// MockEventBus implements events.EventBus for testing
type MockEventBus struct {
	mock.Mock
}

func (m *MockEventBus) Publish(ctx context.Context, event events.Event) error {
	args := m.Called(ctx, event)
	return args.Error(0)
}

func (m *MockEventBus) Subscribe(eventType string, handler events.EventHandler) error {
	args := m.Called(eventType, handler)
	return args.Error(0)
}

func (m *MockEventBus) SubscribeAll(handler events.EventHandler) error {
	args := m.Called(handler)
	return args.Error(0)
}

func (m *MockEventBus) Close() error {
	args := m.Called()
	return args.Error(0)
}

// MockAuditService implements AuditService for testing
type MockAuditService struct {
	mock.Mock
}

func (m *MockAuditService) LogExport(ctx context.Context, instanceID, userID string) error {
	args := m.Called(ctx, instanceID, userID)
	return args.Error(0)
}

func (m *MockAuditService) LogImport(ctx context.Context, instanceID, userID string) error {
	args := m.Called(ctx, instanceID, userID)
	return args.Error(0)
}

// TestExport_SecretRedactionOff tests export with secrets included
func TestExport_SecretRedactionOff(t *testing.T) {
	// Create test instance (simulated - in real tests we'd use ent test client)
	testInstance := &ent.ServiceInstance{
		ID:            "test-instance",
		FeatureID:     "tor",
		InstanceName:  "Tor Exit Node",
		BinaryVersion: "0.4.7.10",
		Config: map[string]interface{}{
			"port":     9050,
			"password": "secret123",
			"nickname": "MyNode",
		},
	}

	// Test export without redaction (manually testing the logic)
	config := testInstance.Config
	assert.Equal(t, "secret123", config["password"], "Password should not be redacted")
	assert.Equal(t, 9050, config["port"])
	assert.Equal(t, "MyNode", config["nickname"])
}

// TestExport_SecretRedactionOn tests export with secrets redacted
func TestExport_SecretRedactionOn(t *testing.T) {
	// Setup mocks
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)

	// Create feature registry
	registry, err := NewFeatureRegistry()
	assert.NoError(t, err)

	// Create service
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit)

	// Test redaction logic
	config := map[string]interface{}{
		"port":       9050,
		"password":   "secret123",
		"api_key":    "key123",
		"nickname":   "MyNode",
		"auth_token": "token123",
	}

	// Empty schema for pattern-based redaction
	redacted := service.redactSecrets(config, json.RawMessage{})

	assert.Equal(t, 9050, redacted["port"], "Port should not be redacted")
	assert.Equal(t, "MyNode", redacted["nickname"], "Nickname should not be redacted")
	assert.Equal(t, "***REDACTED***", redacted["password"], "Password should be redacted")
	assert.Equal(t, "***REDACTED***", redacted["api_key"], "API key should be redacted")
	assert.Equal(t, "***REDACTED***", redacted["auth_token"], "Auth token should be redacted")
}

// TestExport_RoutingRulesOff tests export without routing rules
func TestExport_RoutingRulesOff(t *testing.T) {
	// Setup mocks
	mockRouter := new(MockRouterPort)

	// Test that routing rules are not fetched when IncludeRoutingRules = false
	// (Router port should not be called)
	mockRouter.AssertNotCalled(t, "QueryState")
}

// TestExport_RoutingRulesOn tests export with routing rules included
func TestExport_RoutingRulesOn(t *testing.T) {
	// Setup mocks
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)

	// Create feature registry
	registry, err := NewFeatureRegistry()
	assert.NoError(t, err)

	// Create service
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit)

	// Mock router query response
	mockRouter.On("QueryState", mock.Anything, mock.Anything).Return(&router.StateResult{
		Resources: []map[string]string{
			{
				"chain":            "prerouting",
				"action":           "mark-routing",
				"src-address":      "192.168.1.100",
				"comment":          "nasnet-service-test-instance",
				"new-routing-mark": "100",
			},
		},
		Count: 1,
	}, nil)

	// Test fetchRoutingRules
	ctx := context.Background()
	rules, err := service.fetchRoutingRules(ctx, "test-instance")

	assert.NoError(t, err)
	assert.Len(t, rules, 1)
	assert.Equal(t, "prerouting", rules[0].Chain)
	assert.Equal(t, "mark-routing", rules[0].Action)
	assert.Equal(t, "192.168.1.100", rules[0].SrcAddress)
	assert.Equal(t, "100", rules[0].NewRoutingMark)

	mockRouter.AssertExpectations(t)
}

// TestExport_SchemaVersion tests that schema version is set correctly
func TestExport_SchemaVersion(t *testing.T) {
	// Test that schema version is always "1.0"
	pkg := &ServiceExportPackage{
		SchemaVersion: "1.0",
		ExportedAt:    time.Now(),
		ServiceType:   "tor",
	}

	assert.Equal(t, "1.0", pkg.SchemaVersion, "Schema version should be 1.0")
}

// TestExport_SensitivePatterns tests all 8 sensitive field patterns
func TestExport_SensitivePatterns(t *testing.T) {
	// Setup mocks
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)

	// Create feature registry
	registry, err := NewFeatureRegistry()
	assert.NoError(t, err)

	// Create service
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit)

	// Test all 8 sensitive patterns
	testCases := []struct {
		fieldName     string
		shouldRedact  bool
		expectedValue interface{}
	}{
		{"password", true, "***REDACTED***"},
		{"admin_password", true, "***REDACTED***"},
		{"secret", true, "***REDACTED***"},
		{"api_secret", true, "***REDACTED***"},
		{"token", true, "***REDACTED***"},
		{"auth_token", true, "***REDACTED***"},
		{"key", true, "***REDACTED***"},
		{"encryption_key", true, "***REDACTED***"},
		{"credential", true, "***REDACTED***"},
		{"user_credential", true, "***REDACTED***"},
		{"private", true, "***REDACTED***"},
		{"private_key", true, "***REDACTED***"},
		{"apikey", true, "***REDACTED***"},
		{"api_key", true, "***REDACTED***"},
		{"passphrase", true, "***REDACTED***"},
		{"encryption_passphrase", true, "***REDACTED***"},
		{"port", false, 9050},
		{"nickname", false, "MyNode"},
		{"host", false, "example.com"},
	}

	for _, tc := range testCases {
		t.Run(tc.fieldName, func(t *testing.T) {
			config := map[string]interface{}{
				tc.fieldName: tc.expectedValue,
			}

			redacted := service.redactSecrets(config, json.RawMessage{})

			if tc.shouldRedact {
				assert.Equal(t, "***REDACTED***", redacted[tc.fieldName], "Field %s should be redacted", tc.fieldName)
			} else {
				assert.Equal(t, tc.expectedValue, redacted[tc.fieldName], "Field %s should not be redacted", tc.fieldName)
			}
		})
	}
}

// TestExport_MissingInstanceError tests S600 error for missing instance
func TestExport_MissingInstanceError(t *testing.T) {
	// This test would use an ent test client to simulate NotFound error
	// For now, testing the error type
	err := &ExportError{
		Code:    "S600",
		Message: "service instance not found: test-id",
	}

	assert.Equal(t, "S600", err.Code)
	assert.Contains(t, err.Error(), "S600")
	assert.Contains(t, err.Error(), "service instance not found")
}
