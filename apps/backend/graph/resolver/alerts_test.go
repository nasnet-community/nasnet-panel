package resolver

import (
	"context"
	"testing"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/alert"
	"backend/generated/ent/alertrule"
	"backend/generated/ent/enttest"
	"backend/graph/model"

	"backend/internal/services"

	"backend/internal/events"
	"github.com/99designs/gqlgen/graphql"

	"go.uber.org/zap/zaptest"

	_ "github.com/mattn/go-sqlite3" // SQLite driver for tests
)

// setupTestResolver creates a test resolver with in-memory database.
func setupTestResolver(t *testing.T) (*Resolver, *ent.Client, func()) {
	client := enttest.Open(t, "sqlite3", "file:ent?mode=memory&cache=shared&_fk=1")

	eventBus, err := events.NewEventBus(events.DefaultEventBusOptions())
	if err != nil {
		t.Fatalf("Failed to create event bus: %v", err)
	}

	logger := zaptest.NewLogger(t).Sugar()

	alertService := services.NewAlertService(services.AlertServiceConfig{
		DB:       client,
		EventBus: eventBus,
		Logger:   logger,
	})

	resolver := NewResolverWithConfig(Config{
		EventBus:     eventBus,
		AlertService: alertService,
	})

	cleanup := func() {
		eventBus.Close()
		client.Close()
	}

	return resolver, client, cleanup
}

// TestCreateAlertRule verifies creating an alert rule via GraphQL mutation (AC1).
func TestCreateAlertRule(t *testing.T) {
	resolver, _, cleanup := setupTestResolver(t)
	defer cleanup()

	ctx := context.Background()

	enabled := true
	input := model.CreateAlertRuleInput{
		Name:      "Test Router Offline Alert",
		EventType: "router.disconnected",
		Severity:  model.AlertSeverityCritical,
		Channels:  []string{"email", "inapp"},
		Enabled:   graphql.OmittableOf(&enabled),
	}

	// Create rule
	result, err := resolver.Mutation().CreateAlertRule(ctx, input)
	if err != nil {
		t.Fatalf("CreateAlertRule failed: %v", err)
	}

	// Verify no errors
	if len(result.Errors) > 0 {
		t.Errorf("Expected no errors, got: %v", result.Errors)
	}

	// Verify rule was created
	if result.AlertRule == nil {
		t.Fatal("Expected alertRule in result, got nil")
	}

	rule := result.AlertRule
	if rule.Name != input.Name {
		t.Errorf("Expected name '%s', got '%s'", input.Name, rule.Name)
	}
	if rule.EventType != input.EventType {
		t.Errorf("Expected event type '%s', got '%s'", input.EventType, rule.EventType)
	}
	if rule.Severity != input.Severity {
		t.Errorf("Expected severity '%s', got '%s'", input.Severity, rule.Severity)
	}
	if !rule.Enabled {
		t.Error("Expected rule to be enabled")
	}
}

// TestCreateAlertRuleWithConditions verifies creating rule with conditions (AC2).
func TestCreateAlertRuleWithConditions(t *testing.T) {
	resolver, _, cleanup := setupTestResolver(t)
	defer cleanup()

	ctx := context.Background()

	// Create rule with conditions
	conditions := []*model.AlertConditionInput{
		{
			Field:    "cpu_usage",
			Operator: model.ConditionOperatorGreaterThan,
			Value:    "80",
		},
		{
			Field:    "severity",
			Operator: model.ConditionOperatorEquals,
			Value:    "critical",
		},
	}

	enabled := true
	input := model.CreateAlertRuleInput{
		Name:       "High CPU Alert",
		EventType:  "metric.updated",
		Severity:   model.AlertSeverityWarning,
		Channels:   []string{"inapp"},
		Conditions: graphql.OmittableOf(conditions),
		Enabled:    graphql.OmittableOf(&enabled),
	}

	// Create rule
	result, err := resolver.Mutation().CreateAlertRule(ctx, input)
	if err != nil {
		t.Fatalf("CreateAlertRule failed: %v", err)
	}

	// Verify conditions were saved
	if result.AlertRule == nil {
		t.Fatal("Expected alertRule in result")
	}

	if len(result.AlertRule.Conditions) != 2 {
		t.Errorf("Expected 2 conditions, got %d", len(result.AlertRule.Conditions))
	}

	// Verify condition details
	cond1 := result.AlertRule.Conditions[0]
	if cond1.Field != "cpu_usage" {
		t.Errorf("Expected field 'cpu_usage', got '%s'", cond1.Field)
	}
	if cond1.Operator != model.ConditionOperatorGreaterThan {
		t.Errorf("Expected operator GREATER_THAN, got %s", cond1.Operator)
	}
}

// TestUpdateAlertRule verifies updating an existing alert rule.
func TestUpdateAlertRule(t *testing.T) {
	resolver, client, cleanup := setupTestResolver(t)
	defer cleanup()

	ctx := context.Background()

	// Create initial rule
	rule, err := client.AlertRule.Create().
		SetName("Original Name").
		SetEventType("router.connected").
		SetSeverity(alertrule.SeverityINFO).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create rule: %v", err)
	}

	// Update rule
	newName := "Updated Name"
	newSeverity := model.AlertSeverityWarning
	updateInput := model.UpdateAlertRuleInput{
		Name:     graphql.OmittableOf(&newName),
		Severity: graphql.OmittableOf(&newSeverity),
	}

	result, err := resolver.Mutation().UpdateAlertRule(ctx, rule.ID, updateInput)
	if err != nil {
		t.Fatalf("UpdateAlertRule failed: %v", err)
	}

	// Verify update
	if len(result.Errors) > 0 {
		t.Errorf("Expected no errors, got: %v", result.Errors)
	}

	if result.AlertRule == nil {
		t.Fatal("Expected alertRule in result")
	}

	if result.AlertRule.Name != newName {
		t.Errorf("Expected name '%s', got '%s'", newName, result.AlertRule.Name)
	}
	if result.AlertRule.Severity != newSeverity {
		t.Errorf("Expected severity '%s', got '%s'", newSeverity, result.AlertRule.Severity)
	}
}

// TestToggleAlertRule verifies toggling rule enabled/disabled state (AC6).
func TestToggleAlertRule(t *testing.T) {
	resolver, client, cleanup := setupTestResolver(t)
	defer cleanup()

	ctx := context.Background()

	// Create enabled rule
	rule, err := client.AlertRule.Create().
		SetName("Toggle Test").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityWARNING).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create rule: %v", err)
	}

	// Toggle to disabled
	result, err := resolver.Mutation().ToggleAlertRule(ctx, rule.ID)
	if err != nil {
		t.Fatalf("ToggleAlertRule failed: %v", err)
	}

	if len(result.Errors) > 0 {
		t.Errorf("Expected no errors, got: %v", result.Errors)
	}

	if result.AlertRule == nil {
		t.Fatal("Expected alertRule in result")
	}

	if result.AlertRule.Enabled {
		t.Error("Expected rule to be disabled after toggle")
	}

	// Toggle back to enabled
	result2, err := resolver.Mutation().ToggleAlertRule(ctx, rule.ID)
	if err != nil {
		t.Fatalf("Second ToggleAlertRule failed: %v", err)
	}

	if !result2.AlertRule.Enabled {
		t.Error("Expected rule to be enabled after second toggle")
	}
}

// TestDeleteAlertRule verifies deleting an alert rule.
func TestDeleteAlertRule(t *testing.T) {
	resolver, client, cleanup := setupTestResolver(t)
	defer cleanup()

	ctx := context.Background()

	// Create rule
	rule, err := client.AlertRule.Create().
		SetName("Delete Test").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityINFO).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create rule: %v", err)
	}

	// Delete rule
	result, err := resolver.Mutation().DeleteAlertRule(ctx, rule.ID)
	if err != nil {
		t.Fatalf("DeleteAlertRule failed: %v", err)
	}

	if !result.Success {
		t.Error("Expected successful deletion")
	}

	if len(result.Errors) > 0 {
		t.Errorf("Expected no errors, got: %v", result.Errors)
	}

	// Verify rule is deleted
	exists, err := client.AlertRule.Query().
		Where(alertrule.ID(rule.ID)).
		Exist(ctx)
	if err != nil {
		t.Fatalf("Failed to check rule existence: %v", err)
	}

	if exists {
		t.Error("Rule still exists after deletion")
	}
}

// TestAlertRulesQuery verifies querying alert rules (AC8).
func TestAlertRulesQuery(t *testing.T) {
	resolver, client, cleanup := setupTestResolver(t)
	defer cleanup()

	ctx := context.Background()

	// Create multiple rules
	_, err := client.AlertRule.Create().
		SetName("Rule 1").
		SetEventType("test.event1").
		SetSeverity(alertrule.SeverityCRITICAL).
		SetChannels([]string{"email"}).
		SetEnabled(true).
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create rule 1: %v", err)
	}

	_, err = client.AlertRule.Create().
		SetName("Rule 2").
		SetEventType("test.event2").
		SetSeverity(alertrule.SeverityWARNING).
		SetChannels([]string{"inapp"}).
		SetDeviceID("device-1").
		SetEnabled(false).
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create rule 2: %v", err)
	}

	// Query all rules
	rules, err := resolver.Query().AlertRules(ctx, nil)
	if err != nil {
		t.Fatalf("AlertRules query failed: %v", err)
	}

	if len(rules) != 2 {
		t.Errorf("Expected 2 rules, got %d", len(rules))
	}

	// Query rules by device ID
	deviceID := "device-1"
	filteredRules, err := resolver.Query().AlertRules(ctx, &deviceID)
	if err != nil {
		t.Fatalf("AlertRules query with filter failed: %v", err)
	}

	if len(filteredRules) != 1 {
		t.Errorf("Expected 1 rule for device-1, got %d", len(filteredRules))
	}

	if filteredRules[0].Name != "Rule 2" {
		t.Errorf("Expected Rule 2, got %s", filteredRules[0].Name)
	}
}

// TestAlertsQuery verifies querying alerts with pagination (AC8).
func TestAlertsQuery(t *testing.T) {
	resolver, client, cleanup := setupTestResolver(t)
	defer cleanup()

	ctx := context.Background()

	// Create test rule
	rule, err := client.AlertRule.Create().
		SetName("Test Rule").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityCRITICAL).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create rule: %v", err)
	}

	// Create multiple alerts
	for i := 0; i < 5; i++ {
		severity := alert.SeverityWARNING
		if i%2 == 0 {
			severity = alert.SeverityCRITICAL
		}

		_, err := client.Alert.Create().
			SetRuleID(rule.ID).
			SetEventType("test.event").
			SetSeverity(severity).
			SetTitle("Test Alert").
			SetMessage("Test message").
			SetTriggeredAt(time.Now()).
			Save(ctx)
		if err != nil {
			t.Fatalf("Failed to create alert %d: %v", i, err)
		}
	}

	// Query all alerts
	connection, err := resolver.Query().Alerts(ctx, nil, nil, nil, nil, nil)
	if err != nil {
		t.Fatalf("Alerts query failed: %v", err)
	}

	if connection.TotalCount != 5 {
		t.Errorf("Expected 5 total alerts, got %d", connection.TotalCount)
	}

	if len(connection.Edges) != 5 {
		t.Errorf("Expected 5 edges, got %d", len(connection.Edges))
	}

	// Query with pagination (limit 2)
	limit := 2
	limitedConnection, err := resolver.Query().Alerts(ctx, nil, nil, nil, &limit, nil)
	if err != nil {
		t.Fatalf("Alerts query with limit failed: %v", err)
	}

	if len(limitedConnection.Edges) != 2 {
		t.Errorf("Expected 2 edges with limit, got %d", len(limitedConnection.Edges))
	}

	if !limitedConnection.PageInfo.HasNextPage {
		t.Error("Expected hasNextPage=true with limit=2 and total=5")
	}

	// Query by severity
	severityFilter := model.AlertSeverityCritical
	criticalConnection, err := resolver.Query().Alerts(ctx, nil, &severityFilter, nil, nil, nil)
	if err != nil {
		t.Fatalf("Alerts query with severity filter failed: %v", err)
	}

	if criticalConnection.TotalCount != 3 {
		t.Errorf("Expected 3 critical alerts, got %d", criticalConnection.TotalCount)
	}
}

// TestAcknowledgeAlert verifies acknowledging a single alert.
func TestAcknowledgeAlert(t *testing.T) {
	resolver, client, cleanup := setupTestResolver(t)
	defer cleanup()

	ctx := context.Background()

	// Create test rule and alert
	rule, err := client.AlertRule.Create().
		SetName("Test Rule").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityCRITICAL).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create rule: %v", err)
	}

	alertEntity, err := client.Alert.Create().
		SetRuleID(rule.ID).
		SetEventType("test.event").
		SetSeverity(alert.SeverityCRITICAL).
		SetTitle("Test Alert").
		SetMessage("Test message").
		SetTriggeredAt(time.Now()).
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create alert: %v", err)
	}

	// Acknowledge alert
	result, err := resolver.Mutation().AcknowledgeAlert(ctx, alertEntity.ID)
	if err != nil {
		t.Fatalf("AcknowledgeAlert failed: %v", err)
	}

	if len(result.Errors) > 0 {
		t.Errorf("Expected no errors, got: %v", result.Errors)
	}

	if result.Alert == nil {
		t.Fatal("Expected alert in result")
	}

	if result.Alert.AcknowledgedAt == nil {
		t.Error("Expected acknowledgedAt to be set")
	}

	if result.Alert.AcknowledgedBy == nil {
		t.Error("Expected acknowledgedBy to be set")
	} else if *result.Alert.AcknowledgedBy != "system" {
		t.Errorf("Expected acknowledgedBy='system', got '%s'", *result.Alert.AcknowledgedBy)
	}
}

// TestAcknowledgeAlerts verifies bulk acknowledging alerts.
func TestAcknowledgeAlerts(t *testing.T) {
	resolver, client, cleanup := setupTestResolver(t)
	defer cleanup()

	ctx := context.Background()

	// Create test rule
	rule, err := client.AlertRule.Create().
		SetName("Test Rule").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityWARNING).
		SetChannels([]string{"inapp"}).
		SetEnabled(true).
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create rule: %v", err)
	}

	// Create multiple alerts
	var alertIDs []string
	for i := 0; i < 3; i++ {
		alertEntity, err := client.Alert.Create().
			SetRuleID(rule.ID).
			SetEventType("test.event").
			SetSeverity(alert.SeverityWARNING).
			SetTitle("Test Alert").
			SetMessage("Test message").
			SetTriggeredAt(time.Now()).
			Save(ctx)
		if err != nil {
			t.Fatalf("Failed to create alert %d: %v", i, err)
		}
		alertIDs = append(alertIDs, alertEntity.ID)
	}

	// Bulk acknowledge
	result, err := resolver.Mutation().AcknowledgeAlerts(ctx, alertIDs)
	if err != nil {
		t.Fatalf("AcknowledgeAlerts failed: %v", err)
	}

	if len(result.Errors) > 0 {
		t.Errorf("Expected no errors, got: %v", result.Errors)
	}

	if result.AcknowledgedCount != 3 {
		t.Errorf("Expected 3 acknowledged alerts, got %d", result.AcknowledgedCount)
	}

	// Verify all alerts are acknowledged in DB
	acknowledgedAlerts, err := client.Alert.Query().
		Where(alert.AcknowledgedAtNotNil()).
		All(ctx)
	if err != nil {
		t.Fatalf("Failed to query acknowledged alerts: %v", err)
	}

	if len(acknowledgedAlerts) != 3 {
		t.Errorf("Expected 3 acknowledged alerts in DB, got %d", len(acknowledgedAlerts))
	}
}

// TestAlertRuleQuery verifies querying a single rule by ID.
func TestAlertRuleQuery(t *testing.T) {
	resolver, client, cleanup := setupTestResolver(t)
	defer cleanup()

	ctx := context.Background()

	// Create rule
	rule, err := client.AlertRule.Create().
		SetName("Single Rule Test").
		SetEventType("test.event").
		SetSeverity(alertrule.SeverityINFO).
		SetChannels([]string{"email"}).
		SetEnabled(true).
		Save(ctx)
	if err != nil {
		t.Fatalf("Failed to create rule: %v", err)
	}

	// Query rule by ID
	result, err := resolver.Query().AlertRule(ctx, rule.ID)
	if err != nil {
		t.Fatalf("AlertRule query failed: %v", err)
	}

	if result == nil {
		t.Fatal("Expected rule in result, got nil")
	}

	if result.ID != rule.ID {
		t.Errorf("Expected rule ID '%s', got '%s'", rule.ID, result.ID)
	}

	if result.Name != rule.Name {
		t.Errorf("Expected name '%s', got '%s'", rule.Name, result.Name)
	}

	// Query non-existent rule
	nonExistent, err := resolver.Query().AlertRule(ctx, "non-existent-id")
	if err != nil {
		t.Errorf("Expected no error for non-existent rule, got: %v", err)
	}

	if nonExistent != nil {
		t.Error("Expected nil for non-existent rule")
	}
}
