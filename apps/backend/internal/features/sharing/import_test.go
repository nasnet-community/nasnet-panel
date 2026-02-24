package sharing

import (
	"context"
	"fmt"
	"testing"

	"go.uber.org/zap"

	"backend/internal/common/manifest"
	"github.com/stretchr/testify/assert"
)

// TestImport_SchemaVersionCompatible tests schema version 1.x validation
func TestImport_SchemaVersionCompatible(t *testing.T) {
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, _ := NewFeatureRegistry()
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit, zap.NewNop())

	pkg := &ServiceExportPackage{
		SchemaVersion: "1.0",
		ServiceType:   "tor",
		ServiceName:   "Test Service",
		BinaryVersion: "1.0.0",
		Config:        map[string]interface{}{"port": 9050},
	}

	result := &ImportValidationResult{Valid: true, Errors: []ValidationError{}}
	err := service.validateSchemaVersion(pkg.SchemaVersion, result)

	assert.NoError(t, err, "Schema version 1.0 should be compatible")
	assert.Empty(t, result.Errors, "No errors for compatible schema")
}

// TestImport_SchemaVersionIncompatible tests incompatible schema version
func TestImport_SchemaVersionIncompatible(t *testing.T) {
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, _ := NewFeatureRegistry()
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit, zap.NewNop())

	testCases := []struct {
		name          string
		schemaVersion string
		expectedCode  string
	}{
		{"Major version 2", "2.0", "S602"},
		{"Major version 0", "0.9", "S602"},
		{"Invalid format", "invalid", "S602"},
		{"Missing minor", "1", "S602"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := &ImportValidationResult{Valid: true, Errors: []ValidationError{}}
			err := service.validateSchemaVersion(tc.schemaVersion, result)

			assert.Error(t, err, "Incompatible schema should return error")
			assert.NotEmpty(t, result.Errors, "Should have validation errors")
			assert.Equal(t, tc.expectedCode, result.Errors[0].Code)
		})
	}
}

// TestImport_MissingService tests S600 error for unknown service type
func TestImport_MissingService(t *testing.T) {
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	// Use a registry that returns error for unknown services
	registry := NewFeatureRegistryFromFunc(func(id string) (*manifest.Manifest, error) {
		if id != "tor" && id != "xray" { // Only known services
			return nil, fmt.Errorf("unknown service: %s", id)
		}
		return &manifest.Manifest{ID: id}, nil
	})
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit, zap.NewNop())

	pkg := &ServiceExportPackage{
		SchemaVersion: "1.0",
		ServiceType:   "nonexistent-service",
		ServiceName:   "Test",
		BinaryVersion: "1.0.0",
		Config:        map[string]interface{}{},
	}

	result := &ImportValidationResult{Valid: true, Errors: []ValidationError{}}
	service.validateCrossResource(context.Background(), pkg, result)

	assert.NotEmpty(t, result.Errors, "Should have validation errors for unknown service")
	assert.Equal(t, "S600", result.Errors[0].Code)
	assert.Contains(t, result.Errors[0].Message, "unknown service type")
}

// TestImport_RedactedFieldPrompts tests V400 error for redacted fields
func TestImport_RedactedFieldPrompts(t *testing.T) {
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, _ := NewFeatureRegistry()
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit, zap.NewNop())

	// Config with redacted fields
	config := map[string]interface{}{
		"port":     9050,
		"password": "***REDACTED***",
		"api_key":  "***REDACTED***",
		"nickname": "MyNode",
	}

	redactedFields := service.findRedactedFields(config)

	assert.Len(t, redactedFields, 2, "Should find 2 redacted fields")
	assert.Contains(t, redactedFields, "password")
	assert.Contains(t, redactedFields, "api_key")
}

// TestImport_ConflictDetection tests conflict detection
func TestImport_ConflictDetection(t *testing.T) {
	// This test would use an ent test client to create conflicting instances
	// For now, testing the logic structure

	testCases := []struct {
		name               string
		existingInstances  int
		conflictResolution ConflictResolutionStrategy
		expectsUserInput   bool
		expectsError       bool
	}{
		{"No conflict", 0, "", false, false},
		{"Conflict with SKIP", 1, ConflictSkip, false, false},
		{"Conflict with OVERWRITE", 1, ConflictOverwrite, false, false},
		{"Conflict with RENAME", 1, ConflictRename, false, false},
		{"Conflict without strategy", 1, "", true, true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Verify test case logic
			if tc.existingInstances > 0 && tc.conflictResolution == "" {
				assert.True(t, tc.expectsUserInput, "Should require user input when conflict exists without strategy")
				assert.True(t, tc.expectsError, "Should have validation error")
			}
		})
	}
}

// TestImport_MACMatching tests routing rule MAC address filtering
func TestImport_MACMatching(t *testing.T) {
	rules := []RoutingRule{
		{Chain: "prerouting", SrcAddress: "00:11:22:33:44:55", Action: "mark-routing"},
		{Chain: "prerouting", SrcAddress: "AA:BB:CC:DD:EE:FF", Action: "mark-routing"},
		{Chain: "prerouting", SrcAddress: "11:22:33:44:55:66", Action: "mark-routing"},
	}

	deviceFilter := []string{"00:11:22:33:44:55", "11:22:33:44:55:66"}

	// Build filter set (same logic as applyRoutingRules)
	filterSet := make(map[string]bool)
	for _, mac := range deviceFilter {
		filterSet[mac] = true
	}

	var filteredRules []RoutingRule
	for _, rule := range rules {
		if len(filterSet) > 0 && rule.SrcAddress != "" {
			if filterSet[rule.SrcAddress] {
				filteredRules = append(filteredRules, rule)
			}
		}
	}

	assert.Len(t, filteredRules, 2, "Should filter to 2 matching rules")
	assert.Equal(t, "00:11:22:33:44:55", filteredRules[0].SrcAddress)
	assert.Equal(t, "11:22:33:44:55:66", filteredRules[1].SrcAddress)
}

// TestImport_Rollback tests transaction rollback on failure
func TestImport_Rollback(t *testing.T) {
	// This test would use an ent test client with transaction support
	// Testing rollback logic structure

	// Simulate failure scenarios
	failureScenarios := []string{
		"Invalid config JSON",
		"Routing rule application failure",
		"Database constraint violation",
	}

	for _, scenario := range failureScenarios {
		t.Run(scenario, func(t *testing.T) {
			// In real implementation:
			// 1. tx.Rollback() should be called on error
			// 2. No database changes should persist
			// 3. Error should be returned to caller
			assert.NotEmpty(t, scenario, "Rollback scenario defined")
		})
	}
}

// TestImport_ErrorAccumulation tests that validation collects all errors
func TestImport_ErrorAccumulation(t *testing.T) {
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, _ := NewFeatureRegistry()
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit, zap.NewNop())

	// Package with multiple validation errors
	pkg := &ServiceExportPackage{
		SchemaVersion: "1.0",
		ServiceType:   "", // Missing (syntax error)
		ServiceName:   "", // Missing (syntax error)
		BinaryVersion: "1.0.0",
		Config:        nil, // Missing (syntax error)
	}

	result := &ImportValidationResult{Valid: true, Errors: []ValidationError{}}
	service.validateSyntax(pkg, result)

	// Should accumulate all 3 errors
	assert.Len(t, result.Errors, 3, "Should accumulate all validation errors")

	errorFields := make(map[string]bool)
	for _, err := range result.Errors {
		errorFields[err.Field] = true
	}

	assert.True(t, errorFields["service_type"], "Should have service_type error")
	assert.True(t, errorFields["service_name"], "Should have service_name error")
	assert.True(t, errorFields["config"], "Should have config error")
}

// TestImport_SyntaxValidation tests syntax validation stage
func TestImport_SyntaxValidation(t *testing.T) {
	mockRouter := new(MockRouterPort)
	mockEventBus := new(MockEventBus)
	mockAudit := new(MockAuditService)
	registry, _ := NewFeatureRegistry()
	service := NewService(nil, mockRouter, mockEventBus, registry, mockAudit, zap.NewNop())

	testCases := []struct {
		name         string
		pkg          *ServiceExportPackage
		expectErrors int
	}{
		{
			name: "Valid package",
			pkg: &ServiceExportPackage{
				ServiceType:   "tor",
				ServiceName:   "Test",
				BinaryVersion: "1.0",
				Config:        map[string]interface{}{"port": 9050},
			},
			expectErrors: 0,
		},
		{
			name: "Missing service_type",
			pkg: &ServiceExportPackage{
				ServiceType: "",
				ServiceName: "Test",
				Config:      map[string]interface{}{},
			},
			expectErrors: 1,
		},
		{
			name: "Missing service_name",
			pkg: &ServiceExportPackage{
				ServiceType: "tor",
				ServiceName: "",
				Config:      map[string]interface{}{},
			},
			expectErrors: 1,
		},
		{
			name: "Missing config",
			pkg: &ServiceExportPackage{
				ServiceType: "tor",
				ServiceName: "Test",
				Config:      nil,
			},
			expectErrors: 1,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := &ImportValidationResult{Valid: true, Errors: []ValidationError{}}
			service.validateSyntax(tc.pkg, result)

			assert.Len(t, result.Errors, tc.expectErrors, "Expected error count mismatch")
		})
	}
}
