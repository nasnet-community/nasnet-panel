package alerttpl

import (
	"backend/generated/ent/alertrule"
	"backend/internal/services"
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// =============================================================================
// Test Setup
// =============================================================================

// mockAlertService is a minimal mock of services.AlertService for testing
type mockAlertService struct {
	createRuleFn func(ctx context.Context, input services.CreateAlertRuleInput) (*ent.AlertRule, error)
}

func (m *mockAlertService) CreateRule(ctx context.Context, input services.CreateAlertRuleInput) (*ent.AlertRule, error) {
	if m.createRuleFn != nil {
		return m.createRuleFn(ctx, input)
	}
	// Return mock alert rule
	return &ent.AlertRule{
		ID:          "rule-123",
		Name:        input.Name,
		Description: input.Description,
		EventType:   input.EventType,
		Severity:    input.Severity,
		Conditions:  input.Conditions,
		Channels:    input.Channels,
		Enabled:     input.Enabled,
	}, nil
}

func setupTestService(t *testing.T) (*AlertRuleTemplateService, *mockAlertService) {
	mockAlert := &mockAlertService{}
	svc, err := NewAlertRuleTemplateService(mockAlert, nil)
	require.NoError(t, err, "Failed to create template service")
	return svc, mockAlert
}

// =============================================================================
// Test Case 1: Load Built-in Templates
// =============================================================================

func TestLoadBuiltInTemplates(t *testing.T) {
	svc, _ := setupTestService(t)

	// Verify all 15 built-in templates are loaded
	templates, err := svc.GetTemplates(context.Background(), nil)
	require.NoError(t, err)
	assert.Len(t, templates, 15, "Should load 15 built-in templates")

	// Verify template structure
	for _, tmpl := range templates {
		assert.NotEmpty(t, tmpl.ID, "Template should have ID")
		assert.NotEmpty(t, tmpl.Name, "Template should have name")
		assert.NotEmpty(t, tmpl.Description, "Template should have description")
		assert.NotEmpty(t, tmpl.Category, "Template should have category")
		assert.NotEmpty(t, tmpl.EventType, "Template should have event type")
		assert.NotEmpty(t, tmpl.Severity, "Template should have severity")
		assert.True(t, tmpl.IsBuiltIn, "Built-in template should be marked")
		assert.NotEmpty(t, tmpl.Version, "Template should have version")
	}
}

// =============================================================================
// Test Case 2: Get Template by ID (Success)
// =============================================================================

func TestGetTemplateByID_Success(t *testing.T) {
	svc, _ := setupTestService(t)

	// Get a known template
	tmpl, err := svc.GetTemplateByID(context.Background(), "network-device-offline")
	require.NoError(t, err)
	assert.NotNil(t, tmpl)
	assert.Equal(t, "network-device-offline", tmpl.ID)
	assert.Equal(t, CategoryNetwork, tmpl.Category)
	assert.True(t, len(tmpl.Variables) > 0, "Template should have variables")
}

// =============================================================================
// Test Case 3: Get Template by ID (Not Found)
// =============================================================================

func TestGetTemplateByID_NotFound(t *testing.T) {
	svc, _ := setupTestService(t)

	// Try to get non-existent template
	tmpl, err := svc.GetTemplateByID(context.Background(), "non-existent-id")
	assert.Error(t, err)
	assert.Nil(t, tmpl)
	assert.Contains(t, err.Error(), "template not found")
}

// =============================================================================
// Test Case 4: Filter Templates by Category
// =============================================================================

func TestFilterByCategory(t *testing.T) {
	svc, _ := setupTestService(t)

	// Test each category
	categories := []AlertRuleTemplateCategory{
		CategoryNetwork,
		CategorySecurity,
		CategoryResources,
		CategoryVPN,
		CategoryDHCP,
		CategorySystem,
	}

	for _, cat := range categories {
		templates, err := svc.GetTemplates(context.Background(), &cat)
		require.NoError(t, err)

		// Verify all returned templates match the category
		for _, tmpl := range templates {
			assert.Equal(t, cat, tmpl.Category, "Template category should match filter")
		}

		// Verify we got at least some templates for each category
		assert.Greater(t, len(templates), 0, "Should have templates for category %s", cat)
	}
}

// =============================================================================
// Test Case 5: Preview Template with Default Values
// =============================================================================

func TestPreviewTemplate_DefaultValues(t *testing.T) {
	svc, _ := setupTestService(t)

	// Preview template with default variable values
	variables := map[string]interface{}{
		"OFFLINE_DURATION": 60,
	}

	preview, err := svc.PreviewTemplate(context.Background(), "network-device-offline", variables)
	require.NoError(t, err)
	assert.NotNil(t, preview)
	assert.True(t, preview.ValidationInfo.IsValid, "Preview should be valid with default values")
	assert.Equal(t, "router.offline", preview.ResolvedEventType)
	assert.Len(t, preview.ResolvedConditions, 2, "Should resolve both conditions")

	// Verify variable substitution worked
	assert.Equal(t, 60, preview.ResolvedConditions[1].Value)
}

// =============================================================================
// Test Case 6: Preview Template with Custom Values
// =============================================================================

func TestPreviewTemplate_CustomValues(t *testing.T) {
	svc, _ := setupTestService(t)

	// Preview template with custom variable values
	variables := map[string]interface{}{
		"OFFLINE_DURATION": 300,
	}

	preview, err := svc.PreviewTemplate(context.Background(), "network-device-offline", variables)
	require.NoError(t, err)
	assert.True(t, preview.ValidationInfo.IsValid)

	// Verify custom value was substituted
	assert.Equal(t, 300, preview.ResolvedConditions[1].Value)
}

// =============================================================================
// Test Case 7: Validate Variables (Missing Required)
// =============================================================================

func TestValidateVariables_MissingRequired(t *testing.T) {
	svc, _ := setupTestService(t)

	// Preview without required variable
	variables := map[string]interface{}{}

	preview, err := svc.PreviewTemplate(context.Background(), "network-device-offline", variables)
	require.NoError(t, err)
	assert.False(t, preview.ValidationInfo.IsValid, "Should be invalid without required variables")
	assert.Contains(t, preview.ValidationInfo.MissingVariables, "OFFLINE_DURATION")
}

// =============================================================================
// Test Case 8: Validate Variables (Out of Range)
// =============================================================================

func TestValidateVariables_OutOfRange(t *testing.T) {
	svc, _ := setupTestService(t)

	// Test value below minimum
	variables := map[string]interface{}{
		"OFFLINE_DURATION": 10, // Min is 30
	}

	preview, err := svc.PreviewTemplate(context.Background(), "network-device-offline", variables)
	require.NoError(t, err)
	assert.False(t, preview.ValidationInfo.IsValid, "Should be invalid with out-of-range value")
	assert.Contains(t, preview.ValidationInfo.InvalidVariables, "OFFLINE_DURATION")
	assert.Greater(t, len(preview.ValidationInfo.Warnings), 0, "Should have warning about range")

	// Test value above maximum
	variables["OFFLINE_DURATION"] = 5000 // Max is 3600

	preview, err = svc.PreviewTemplate(context.Background(), "network-device-offline", variables)
	require.NoError(t, err)
	assert.False(t, preview.ValidationInfo.IsValid, "Should be invalid with out-of-range value")
}

// =============================================================================
// Test Case 9: Apply Template - Create Rule with Default Values
// =============================================================================

func TestApplyTemplate_DefaultValues(t *testing.T) {
	svc, mockAlert := setupTestService(t)

	// Track what AlertService.CreateRule() was called with
	var capturedInput services.CreateAlertRuleInput
	mockAlert.createRuleFn = func(ctx context.Context, input services.CreateAlertRuleInput) (*ent.AlertRule, error) {
		capturedInput = input
		return &ent.AlertRule{
			ID:          "rule-456",
			Name:        input.Name,
			Description: input.Description,
			EventType:   input.EventType,
			Severity:    input.Severity,
			Conditions:  input.Conditions,
			Channels:    input.Channels,
			Enabled:     input.Enabled,
		}, nil
	}

	// Apply template with default values
	variables := map[string]interface{}{
		"OFFLINE_DURATION": 60,
	}

	customizations := services.CreateAlertRuleInput{
		Name:        "My Device Offline Alert",
		Description: "Alerts when my router goes offline",
		Enabled:     true,
	}

	rule, err := svc.ApplyTemplate(context.Background(), "network-device-offline", variables, customizations)
	require.NoError(t, err)
	assert.NotNil(t, rule)
	assert.Equal(t, "rule-456", rule.ID)

	// Verify AlertService.CreateRule() was called with correct data
	assert.Equal(t, "My Device Offline Alert", capturedInput.Name)
	assert.Equal(t, "router.offline", capturedInput.EventType)
	assert.Equal(t, alertrule.SeverityCritical, capturedInput.Severity)
	assert.Len(t, capturedInput.Conditions, 2, "Should have 2 resolved conditions")
	assert.True(t, capturedInput.Enabled)

	// Verify condition values were substituted
	durationCondition := capturedInput.Conditions[1]
	assert.Equal(t, "duration", durationCondition["field"])
	assert.Equal(t, 60, durationCondition["value"]) // Should be substituted integer
}

// =============================================================================
// Test Case 10: Apply Template - Validation Failure
// =============================================================================

func TestApplyTemplate_ValidationFailure(t *testing.T) {
	svc, _ := setupTestService(t)

	// Try to apply without required variables
	variables := map[string]interface{}{}

	customizations := services.CreateAlertRuleInput{
		Name:    "Test Alert",
		Enabled: true,
	}

	rule, err := svc.ApplyTemplate(context.Background(), "network-device-offline", variables, customizations)
	assert.Error(t, err)
	assert.Nil(t, rule)
	assert.Contains(t, err.Error(), "validation failed")
	assert.Contains(t, err.Error(), "missing variables")
}

// =============================================================================
// Test Case 11: Import/Export Template
// =============================================================================

func TestImportExportTemplate(t *testing.T) {
	svc, _ := setupTestService(t)

	// Export a built-in template
	exportJSON, err := svc.ExportTemplate(context.Background(), "network-device-offline")
	require.NoError(t, err)
	assert.NotEmpty(t, exportJSON)

	// Verify JSON is valid
	var exported AlertRuleTemplate
	err = json.Unmarshal([]byte(exportJSON), &exported)
	require.NoError(t, err)
	assert.Equal(t, "network-device-offline", exported.ID)

	// Import the template back (with new ID to avoid conflict)
	exported.ID = "custom-offline-template"
	exported.Name = "Custom Offline Alert"
	customJSON, err := json.Marshal(exported)
	require.NoError(t, err)

	imported, err := svc.ImportTemplate(context.Background(), string(customJSON))
	require.NoError(t, err)
	assert.NotNil(t, imported)
	assert.Equal(t, "custom-offline-template", imported.ID)
	assert.Equal(t, "Custom Offline Alert", imported.Name)
	assert.False(t, imported.IsBuiltIn, "Imported template should not be marked as built-in")
	assert.Equal(t, CategoryCustom, imported.Category, "Imported template should be CUSTOM category")
}

// =============================================================================
// Test Case 12: Import Template - Invalid JSON
// =============================================================================

func TestImportTemplate_InvalidJSON(t *testing.T) {
	svc, _ := setupTestService(t)

	// Try to import invalid JSON
	invalidJSON := `{"name": "test", "missing_required_fields": true}`

	imported, err := svc.ImportTemplate(context.Background(), invalidJSON)
	assert.Error(t, err)
	assert.Nil(t, imported)
	assert.Contains(t, err.Error(), "event type is required")
}

// =============================================================================
// Test Case 13: Save Custom Template
// =============================================================================

func TestSaveCustomTemplate(t *testing.T) {
	svc, _ := setupTestService(t)

	// Create a custom template
	customTemplate := &AlertRuleTemplate{
		ID:          "my-custom-template",
		Name:        "My Custom Alert",
		Description: "A custom alert rule template",
		Category:    CategoryNetwork,
		EventType:   "custom.event",
		Severity:    "WARNING",
		Conditions: []TemplateCondition{
			{
				Field:    "value",
				Operator: "GREATER_THAN",
				Value:    "{{THRESHOLD}}",
			},
		},
		Channels: []string{"email"},
		Variables: []AlertRuleTemplateVariable{
			{
				Name:         "THRESHOLD",
				Label:        "Threshold Value",
				Type:         VarTypeInteger,
				Required:     true,
				DefaultValue: ptr("100"),
				Min:          ptr(0),
				Max:          ptr(1000),
			},
		},
		Version: "1.0.0",
	}

	saved, err := svc.SaveCustomTemplate(context.Background(), customTemplate)
	require.NoError(t, err)
	assert.NotNil(t, saved)
	assert.False(t, saved.IsBuiltIn, "Custom template should not be marked as built-in")
	assert.Equal(t, CategoryCustom, saved.Category, "Custom template should be CUSTOM category")
	assert.NotNil(t, saved.CreatedAt, "Should set creation time")
	assert.NotNil(t, saved.UpdatedAt, "Should set update time")
}

// =============================================================================
// Test Case 14: Delete Custom Template
// =============================================================================

func TestDeleteCustomTemplate(t *testing.T) {
	svc, _ := setupTestService(t)

	// Attempt to delete a built-in template should fail
	err := svc.DeleteCustomTemplate(context.Background(), "network-device-offline")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot delete built-in template")

	// Deleting a custom template should succeed (mock - no database)
	err = svc.DeleteCustomTemplate(context.Background(), "custom-template-id")
	assert.NoError(t, err, "Should allow deleting custom templates")
}

// =============================================================================
// Test Case 15: Variable Substitution - String Type
// =============================================================================

func TestVariableSubstitution_StringType(t *testing.T) {
	svc, _ := setupTestService(t)

	// Get interface-down template (has STRING variable)
	tmpl, err := svc.GetTemplateByID(context.Background(), "interface-down")
	require.NoError(t, err)

	variables := map[string]interface{}{
		"INTERFACE_NAME": "ether2",
	}

	preview, err := svc.PreviewTemplate(context.Background(), "interface-down", variables)
	require.NoError(t, err)
	assert.True(t, preview.ValidationInfo.IsValid)

	// Find the condition with the substituted value
	var foundCondition *ResolvedCondition
	for _, cond := range preview.ResolvedConditions {
		if cond.Field == "interface" {
			foundCondition = &cond
			break
		}
	}

	require.NotNil(t, foundCondition, "Should find interface condition")
	assert.Equal(t, "ether2", foundCondition.Value)
}

// =============================================================================
// Test Case 16: Multiple Templates in Same Category
// =============================================================================

func TestMultipleTemplatesInCategory(t *testing.T) {
	svc, _ := setupTestService(t)

	// Get all network templates
	networkCategory := CategoryNetwork
	templates, err := svc.GetTemplates(context.Background(), &networkCategory)
	require.NoError(t, err)

	// Network category should have multiple templates
	assert.Greater(t, len(templates), 1, "Network category should have multiple templates")

	// Verify all are network category
	for _, tmpl := range templates {
		assert.Equal(t, CategoryNetwork, tmpl.Category)
	}
}

// =============================================================================
// Helper Functions
// =============================================================================

func ptr[T any](v T) *T {
	return &v
}
