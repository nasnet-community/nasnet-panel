package services

import (
	"context"
	"testing"

	"go.uber.org/zap/zaptest"
)

// TestAlertTemplateService_LoadBuiltInTemplates verifies that built-in templates load correctly.
func TestAlertTemplateService_LoadBuiltInTemplates(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil, // Not needed for this test
		Logger:       logger,
		AlertService: nil, // Not needed for this test
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create alert template service: %v", err)
	}

	// Verify built-in templates were loaded
	if len(service.builtInTemplates) == 0 {
		t.Error("Expected built-in templates to be loaded, got 0")
	}

	t.Logf("Loaded %d built-in templates", len(service.builtInTemplates))

	// Verify specific templates exist
	expectedTemplates := []string{
		"router-offline-email",
		"router-offline-inapp",
		"interface-down-email",
		"cpu-high-inapp",
		"vpn-disconnected-telegram",
		"backup-completed-webhook",
	}

	for _, id := range expectedTemplates {
		if _, exists := service.builtInTemplates[id]; !exists {
			t.Errorf("Expected template %s to be loaded", id)
		}
	}
}

// TestAlertTemplateService_GetTemplateByID verifies template retrieval by ID.
func TestAlertTemplateService_GetTemplateByID(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	// Test retrieving a valid template
	tmpl, err := service.GetTemplateByID(ctx, "router-offline-email")
	if err != nil {
		t.Fatalf("Failed to get template: %v", err)
	}

	if tmpl == nil {
		t.Fatal("Expected template, got nil")
	}

	if tmpl.EventType != EventRouterOffline {
		t.Errorf("Expected event type %s, got %s", EventRouterOffline, tmpl.EventType)
	}

	if tmpl.Channel != ChannelEmail {
		t.Errorf("Expected channel %s, got %s", ChannelEmail, tmpl.Channel)
	}

	// Test retrieving non-existent template
	_, err = service.GetTemplateByID(ctx, "non-existent")
	if err == nil {
		t.Error("Expected error for non-existent template, got nil")
	}
}

// TestAlertTemplateService_GetTemplatesByEventType verifies filtering by event type.
func TestAlertTemplateService_GetTemplatesByEventType(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	// Get templates for router.offline event
	templates, err := service.GetTemplatesByEventType(ctx, EventRouterOffline)
	if err != nil {
		t.Fatalf("Failed to get templates: %v", err)
	}

	if len(templates) == 0 {
		t.Error("Expected at least one template for router.offline")
	}

	// Verify all templates are for the correct event type
	for _, tmpl := range templates {
		if tmpl.EventType != EventRouterOffline {
			t.Errorf("Expected event type %s, got %s", EventRouterOffline, tmpl.EventType)
		}
	}

	t.Logf("Found %d templates for %s", len(templates), EventRouterOffline)
}

// TestAlertTemplateService_PreviewTemplate verifies template rendering with variables.
func TestAlertTemplateService_PreviewTemplate(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	variables := map[string]interface{}{
		"RouterName": "TestRouter",
		"RouterIP":   "192.168.1.1",
		"LastSeen":   "5 minutes ago",
	}

	preview, err := service.PreviewTemplate(ctx, "router-offline-inapp", variables)
	if err != nil {
		t.Fatalf("Failed to preview template: %v", err)
	}

	if preview == nil {
		t.Fatal("Expected preview result, got nil")
	}

	// Check rendered subject contains variables
	if preview.RenderedSubject == "" {
		t.Error("Expected rendered subject to be non-empty")
	}

	if preview.RenderedBody == "" {
		t.Error("Expected rendered body to be non-empty")
	}

	t.Logf("Rendered Subject: %s", preview.RenderedSubject)
	t.Logf("Rendered Body: %s", preview.RenderedBody)

	// Verify validation info
	if !preview.ValidationInfo.IsValid {
		t.Errorf("Expected valid preview, got: %v", preview.ValidationInfo.Warnings)
	}
}

// TestAlertTemplateService_PreviewTemplate_MissingVariables verifies validation of required variables.
func TestAlertTemplateService_PreviewTemplate_MissingVariables(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	// Provide incomplete variables
	variables := map[string]interface{}{
		"RouterName": "TestRouter",
		// Missing RouterIP and LastSeen
	}

	preview, err := service.PreviewTemplate(ctx, "router-offline-inapp", variables)
	if err != nil {
		t.Fatalf("Failed to preview template: %v", err)
	}

	// Should have validation warnings
	if preview.ValidationInfo.IsValid {
		t.Error("Expected invalid preview due to missing variables")
	}

	if len(preview.ValidationInfo.MissingVariables) == 0 {
		t.Error("Expected missing variables to be reported")
	}

	t.Logf("Missing variables: %v", preview.ValidationInfo.MissingVariables)
}

// TestCommonEventTypes verifies the event types list.
func TestCommonEventTypes(t *testing.T) {
	eventTypes := CommonEventTypes()

	if len(eventTypes) == 0 {
		t.Error("Expected common event types list to be non-empty")
	}

	// Verify some key event types are present
	expectedTypes := []string{
		EventRouterOffline,
		EventInterfaceDown,
		EventCPUHigh,
		EventVPNDisconnected,
		EventBackupCompleted,
	}

	eventTypeMap := make(map[string]bool)
	for _, et := range eventTypes {
		eventTypeMap[et] = true
	}

	for _, expected := range expectedTypes {
		if !eventTypeMap[expected] {
			t.Errorf("Expected event type %s to be in common event types", expected)
		}
	}

	t.Logf("Found %d common event types", len(eventTypes))
}

// TestAlertTemplateService_GetTemplatesByChannel verifies filtering by channel.
func TestAlertTemplateService_GetTemplatesByChannel(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	// Get templates for email channel
	templates, err := service.GetTemplatesByChannel(ctx, ChannelEmail)
	if err != nil {
		t.Fatalf("Failed to get templates: %v", err)
	}

	// Verify all templates are for the correct channel
	for _, tmpl := range templates {
		if tmpl.Channel != ChannelEmail {
			t.Errorf("Expected channel %s, got %s", ChannelEmail, tmpl.Channel)
		}
	}

	t.Logf("Found %d templates for %s channel", len(templates), ChannelEmail)

	// Test all channels
	channels := []ChannelType{
		ChannelEmail, ChannelTelegram, ChannelInApp, ChannelWebhook,
	}

	for _, channel := range channels {
		tmplList, err := service.GetTemplatesByChannel(ctx, channel)
		if err != nil {
			t.Fatalf("Failed to get templates for channel %s: %v", channel, err)
		}
		t.Logf("Channel %s: %d templates", channel, len(tmplList))
	}
}

// TestAlertTemplateService_GetTemplates_MultipleFilters verifies combined filtering.
func TestAlertTemplateService_GetTemplates_MultipleFilters(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	// Filter by both event type and channel
	eventType := EventRouterOffline
	channel := ChannelEmail

	templates, err := service.GetTemplates(ctx, &eventType, &channel)
	if err != nil {
		t.Fatalf("Failed to get templates: %v", err)
	}

	// Verify all templates match both filters
	for _, tmpl := range templates {
		if tmpl.EventType != eventType {
			t.Errorf("Expected event type %s, got %s", eventType, tmpl.EventType)
		}
		if tmpl.Channel != channel {
			t.Errorf("Expected channel %s, got %s", channel, tmpl.Channel)
		}
	}

	t.Logf("Found %d templates for eventType=%s, channel=%s", len(templates), eventType, channel)
}

// TestAlertTemplateService_GetTemplates_NoFilters verifies getting all templates.
func TestAlertTemplateService_GetTemplates_NoFilters(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	// Get all templates (no filters)
	templates, err := service.GetTemplates(ctx, nil, nil)
	if err != nil {
		t.Fatalf("Failed to get templates: %v", err)
	}

	if len(templates) == 0 {
		t.Error("Expected at least one template")
	}

	// Should match the number of built-in templates
	if len(templates) != len(service.builtInTemplates) {
		t.Errorf("Expected %d templates, got %d", len(service.builtInTemplates), len(templates))
	}

	t.Logf("Found %d total templates", len(templates))
}

// TestAlertTemplateService_SearchTemplates verifies search functionality.
func TestAlertTemplateService_SearchTemplates(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	tests := []struct {
		name          string
		query         string
		expectResults bool
	}{
		{
			name:          "Search by name",
			query:         "Router Offline",
			expectResults: true,
		},
		{
			name:          "Search by event type",
			query:         "router.offline",
			expectResults: true,
		},
		{
			name:          "Search by tag",
			query:         "critical",
			expectResults: true,
		},
		{
			name:          "Search case-insensitive",
			query:         "ROUTER",
			expectResults: true,
		},
		{
			name:          "Search non-existent",
			query:         "nonexistent12345",
			expectResults: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results, err := service.SearchTemplates(ctx, tt.query)
			if err != nil {
				t.Fatalf("Search failed: %v", err)
			}

			if tt.expectResults && len(results) == 0 {
				t.Errorf("Expected results for query '%s', got none", tt.query)
			}

			if !tt.expectResults && len(results) > 0 {
				t.Errorf("Expected no results for query '%s', got %d", tt.query, len(results))
			}

			t.Logf("Query '%s': %d results", tt.query, len(results))
		})
	}
}

// TestAlertTemplateService_PreviewTemplate_VariableSubstitution verifies variable rendering.
func TestAlertTemplateService_PreviewTemplate_VariableSubstitution(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	variables := map[string]interface{}{
		"RouterName": "HomeRouter",
		"RouterIP":   "192.168.88.1",
		"LastSeen":   "2 minutes ago",
	}

	preview, err := service.PreviewTemplate(ctx, "router-offline-inapp", variables)
	if err != nil {
		t.Fatalf("Failed to preview template: %v", err)
	}

	// Check that variables were substituted in subject
	if !contains(preview.RenderedSubject, "HomeRouter") {
		t.Errorf("Expected subject to contain RouterName, got: %s", preview.RenderedSubject)
	}

	// Check that variables were substituted in body
	if !contains(preview.RenderedBody, "HomeRouter") {
		t.Errorf("Expected body to contain RouterName, got: %s", preview.RenderedBody)
	}

	if !contains(preview.RenderedBody, "192.168.88.1") {
		t.Errorf("Expected body to contain RouterIP, got: %s", preview.RenderedBody)
	}

	if !contains(preview.RenderedBody, "2 minutes ago") {
		t.Errorf("Expected body to contain LastSeen, got: %s", preview.RenderedBody)
	}

	t.Logf("Rendered: %s - %s", preview.RenderedSubject, preview.RenderedBody)
}

// TestAlertTemplateService_PreviewTemplate_InvalidTemplateID verifies error handling.
func TestAlertTemplateService_PreviewTemplate_InvalidTemplateID(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	variables := map[string]interface{}{
		"RouterName": "Test",
	}

	_, err = service.PreviewTemplate(ctx, "invalid-template-id", variables)
	if err == nil {
		t.Error("Expected error for invalid template ID, got nil")
	}
}

// TestAlertTemplateService_DeleteTemplate_BuiltIn verifies built-in templates cannot be deleted.
func TestAlertTemplateService_DeleteTemplate_BuiltIn(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	// Attempt to delete built-in template
	err = service.DeleteTemplate(ctx, "router-offline-email")
	if err == nil {
		t.Error("Expected error when deleting built-in template, got nil")
	}

	if !contains(err.Error(), "cannot delete built-in") {
		t.Errorf("Expected 'cannot delete built-in' error, got: %v", err)
	}
}

// TestAlertTemplateService_DeleteTemplate_NonExistent verifies error for non-existent templates.
func TestAlertTemplateService_DeleteTemplate_NonExistent(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	// Attempt to delete non-existent template
	err = service.DeleteTemplate(ctx, "non-existent-template")
	if err == nil {
		t.Error("Expected error when deleting non-existent template, got nil")
	}
}

// TestAlertTemplateService_ValidateEventType verifies event type validation.
func TestAlertTemplateService_ValidateEventType(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	// Valid event types
	validTypes := []string{
		EventRouterOffline,
		EventInterfaceDown,
		EventCPUHigh,
		EventVPNDisconnected,
	}

	for _, eventType := range validTypes {
		if !service.isValidEventType(eventType) {
			t.Errorf("Expected %s to be valid event type", eventType)
		}
	}

	// Invalid event types
	invalidTypes := []string{
		"invalid.event",
		"custom.unknown",
		"",
	}

	for _, eventType := range invalidTypes {
		if service.isValidEventType(eventType) {
			t.Errorf("Expected %s to be invalid event type", eventType)
		}
	}
}

// TestAlertTemplateService_GetCommonEventTypes verifies event types list.
func TestAlertTemplateService_GetCommonEventTypes(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	eventTypes := service.GetCommonEventTypes()

	if len(eventTypes) == 0 {
		t.Error("Expected non-empty event types list")
	}

	// Verify no duplicates
	seen := make(map[string]bool)
	for _, et := range eventTypes {
		if seen[et] {
			t.Errorf("Duplicate event type: %s", et)
		}
		seen[et] = true
	}

	t.Logf("Common event types: %d", len(eventTypes))
}

// TestAlertTemplateService_TemplateStructure verifies template data structure.
func TestAlertTemplateService_TemplateStructure(t *testing.T) {
	logger := zaptest.NewLogger(t).Sugar()

	cfg := AlertTemplateServiceConfig{
		DB:           nil,
		Logger:       logger,
		AlertService: nil,
	}

	service, err := NewAlertTemplateService(cfg)
	if err != nil {
		t.Fatalf("Failed to create service: %v", err)
	}

	ctx := context.Background()

	// Get all templates and verify structure
	templates, err := service.GetTemplates(ctx, nil, nil)
	if err != nil {
		t.Fatalf("Failed to get templates: %v", err)
	}

	for _, tmpl := range templates {
		// Required fields
		if tmpl.ID == "" {
			t.Error("Template ID is empty")
		}
		if tmpl.Name == "" {
			t.Error("Template Name is empty")
		}
		if tmpl.EventType == "" {
			t.Error("Template EventType is empty")
		}
		if tmpl.Channel == "" {
			t.Error("Template Channel is empty")
		}
		if tmpl.BodyTemplate == "" {
			t.Error("Template BodyTemplate is empty")
		}

		// Verify IsBuiltIn is set
		if !tmpl.IsBuiltIn {
			t.Errorf("Template %s should be marked as built-in", tmpl.ID)
		}

		// Verify variables structure
		for _, v := range tmpl.Variables {
			if v.Name == "" {
				t.Errorf("Template %s has variable with empty name", tmpl.ID)
			}
			if v.Type == "" {
				t.Errorf("Template %s has variable with empty type", tmpl.ID)
			}
		}

		t.Logf("Template %s: %d variables", tmpl.ID, len(tmpl.Variables))
	}
}

// Helper function
func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && (s == substr || len(s) >= len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || findInString(s, substr)))
}

func findInString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
