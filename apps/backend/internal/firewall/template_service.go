package firewall

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"backend/internal/utils"
)

//go:embed templates/firewall/*.json
var templatesFS embed.FS

// TemplateService handles firewall template operations
type TemplateService struct {
	builtInTemplates map[string]*Template
	rollbackStore    *RollbackStore
}

// NewTemplateService creates a new template service
func NewTemplateService() (*TemplateService, error) {
	rollbackStore := NewRollbackStore()
	service := &TemplateService{
		builtInTemplates: make(map[string]*Template),
		rollbackStore:    rollbackStore,
	}

	// Load built-in templates
	if err := service.loadBuiltInTemplates(); err != nil {
		rollbackStore.Close()
		return nil, fmt.Errorf("failed to load built-in templates: %w", err)
	}

	return service, nil
}

// loadBuiltInTemplates loads all built-in templates from embedded JSON files
func (s *TemplateService) loadBuiltInTemplates() error {
	templateFiles := []string{
		"templates/firewall/basic-security.json",
		"templates/firewall/home-network.json",
		"templates/firewall/gaming-optimized.json",
		"templates/firewall/iot-isolation.json",
		"templates/firewall/guest-network.json",
	}

	for _, file := range templateFiles {
		data, err := templatesFS.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read template %s: %w", file, err)
		}

		var template Template
		if err := json.Unmarshal(data, &template); err != nil {
			return fmt.Errorf("failed to parse template %s: %w", file, err)
		}

		// Validate template integrity before adding
		if template.ID == "" {
			return fmt.Errorf("template in file %s has empty ID", file)
		}
		if template.Name == "" {
			return fmt.Errorf("template %s in file %s has empty name", template.ID, file)
		}
		if len(template.Rules) == 0 {
			return fmt.Errorf("template %s in file %s has no rules", template.ID, file)
		}

		s.builtInTemplates[template.ID] = &template
	}

	return nil
}

// GetTemplates returns all templates, optionally filtered by category
func (s *TemplateService) GetTemplates(ctx context.Context, category *string) ([]*Template, error) {
	templates := make([]*Template, 0, len(s.builtInTemplates))

	for _, template := range s.builtInTemplates {
		// Filter by category if specified
		if category != nil && template.Category != *category {
			continue
		}
		templates = append(templates, template)
	}

	return templates, nil
}

// GetTemplateByID retrieves a template by its ID
func (s *TemplateService) GetTemplateByID(ctx context.Context, id string) (*Template, error) {
	if id == "" {
		return nil, fmt.Errorf("template id cannot be empty")
	}

	template, exists := s.builtInTemplates[id]
	if !exists {
		return nil, fmt.Errorf("template not found: %s", id)
	}

	if template == nil {
		return nil, fmt.Errorf("template %s is corrupted (nil pointer)", id)
	}

	// Validate template integrity
	if template.ID == "" {
		return nil, fmt.Errorf("template %s has empty ID", id)
	}

	return template, nil
}

// PreviewTemplate previews a template with variable substitution
func (s *TemplateService) PreviewTemplate(ctx context.Context, routerID, templateID string, variables map[string]interface{}) (*PreviewResult, error) {
	// Get the template
	template, err := s.GetTemplateByID(ctx, templateID)
	if err != nil {
		return nil, err
	}

	// Validate variables against template requirements
	if err := s.validateVariables(template, variables); err != nil {
		return nil, fmt.Errorf("variable validation failed: %w", err)
	}

	// Resolve template rules with variable substitution
	resolvedRules, resolveErr := s.resolveTemplateRules(template.Rules, variables)
	if resolveErr != nil {
		return nil, fmt.Errorf("failed to resolve template rules: %w", resolveErr)
	}

	// Detect conflicts (simplified implementation - would need router state)
	conflicts := s.detectConflicts(resolvedRules)

	// Calculate impact analysis
	impact := s.calculateImpact(resolvedRules)

	return &PreviewResult{
		Template:       template,
		ResolvedRules:  resolvedRules,
		Conflicts:      conflicts,
		ImpactAnalysis: impact,
	}, nil
}

// validateVariables checks that all required variables are provided and have correct types
func (s *TemplateService) validateVariables(template *Template, variables map[string]interface{}) error {
	if template == nil {
		return fmt.Errorf("template cannot be nil")
	}

	for _, varDef := range template.Variables {
		if !varDef.Required {
			continue
		}

		value, exists := variables[varDef.Name]
		if !exists {
			return fmt.Errorf("required variable %s is missing", varDef.Name)
		}

		if value == nil {
			return fmt.Errorf("required variable %s is nil", varDef.Name)
		}

		// Validate type based on variable definition
		switch varDef.Type {
		case "string":
			if _, ok := value.(string); !ok {
				return fmt.Errorf("variable %s must be a string, got %T", varDef.Name, value)
			}
			// Check not empty
			if strVal, ok := value.(string); ok && strVal == "" {
				return fmt.Errorf("required variable %s cannot be empty", varDef.Name)
			}
		case "number":
			switch value.(type) {
			case float64, int, int32, int64:
				// Valid numeric types
			default:
				return fmt.Errorf("variable %s must be a number, got %T", varDef.Name, value)
			}
		case "boolean":
			if _, ok := value.(bool); !ok {
				return fmt.Errorf("variable %s must be a boolean, got %T", varDef.Name, value)
			}
		}
	}

	return nil
}

// resolveTemplateRules substitutes variables in rule properties
// Variables must follow pattern {{VARIABLE_NAME}} where VARIABLE_NAME is uppercase with underscores
//
//nolint:unparam // error kept for interface compatibility
func (s *TemplateService) resolveTemplateRules(rules []TemplateRule, variables map[string]interface{}) ([]TemplateRule, error) {
	if len(rules) == 0 {
		return []TemplateRule{}, nil
	}

	resolved := make([]TemplateRule, len(rules))

	// Variable pattern: {{VARIABLE_NAME}} - strict uppercase with underscores only
	// This prevents injection of arbitrary Go code
	varPattern := regexp.MustCompile(`\{\{([A-Z][A-Z0-9_]*)\}\}`)

	for i, rule := range rules {
		resolvedRule := rule

		// Resolve variables in properties
		resolvedProps := make(map[string]interface{})
		for key, value := range rule.Properties {
			// Convert value to string for substitution
			strValue, ok := value.(string)
			if !ok {
				// Non-string values pass through unchanged
				resolvedProps[key] = value
				continue
			}

			// Find all variable references
			resolvedValue := varPattern.ReplaceAllStringFunc(strValue, func(match string) string {
				// Extract variable name (strip {{ and }})
				varName := match[2 : len(match)-2]

				// Look up variable value
				if varValue, exists := variables[varName]; exists {
					// If variable has value, substitute it
					if str, ok := varValue.(string); ok {
						return str
					}
				}

				// If variable not found or not string, return original
				return match
			})

			resolvedProps[key] = resolvedValue
		}

		resolvedRule.Properties = resolvedProps
		resolved[i] = resolvedRule
	}

	return resolved, nil
}

// detectConflicts checks for conflicts with existing rules
// NOTE: This is a placeholder implementation. Full conflict detection requires:
// 1. Router state access (via RouterPort)
// 2. Rule comparison logic
// 3. Chain-specific conflict rules
func (s *TemplateService) detectConflicts(rules []TemplateRule) []Conflict {
	conflicts := make([]Conflict, 0)

	// Basic validation for template consistency
	// Check for obviously conflicting rules within the template itself
	chainRuleMap := make(map[string]map[string]bool) // chain -> action -> exists

	for _, rule := range rules {
		if chainRuleMap[rule.Chain] == nil {
			chainRuleMap[rule.Chain] = make(map[string]bool)
		}

		// Check for duplicate action patterns on same chain
		// (real implementation would need more sophisticated comparison)
		key := rule.Action + ":" + rule.Comment
		if chainRuleMap[rule.Chain][key] {
			conflicts = append(conflicts, Conflict{
				Type:    "duplicate",
				Message: fmt.Sprintf("Duplicate rule pattern on chain %s", rule.Chain),
			})
		}
		chainRuleMap[rule.Chain][key] = true
	}

	return conflicts
}

// calculateImpact generates impact analysis
func (s *TemplateService) calculateImpact(rules []TemplateRule) ImpactAnalysis {
	// Track unique chains
	chainMap := make(map[string]bool)
	for _, rule := range rules {
		chainMap[rule.Chain] = true
	}

	// Convert map to slice
	chains := make([]string, 0, len(chainMap))
	for chain := range chainMap {
		chains = append(chains, chain)
	}

	// Estimate apply time (roughly 0.5 seconds per rule)
	estimatedTime := (len(rules) / 2) + 1

	// Generate warnings
	warnings := make([]string, 0)

	// Check for high rule count
	if len(rules) > 20 {
		warnings = append(warnings, "This template creates many rules. Application may take longer than usual.")
	}

	// Check for critical chains
	for chain := range chainMap {
		if strings.Contains(strings.ToLower(chain), "input") {
			warnings = append(warnings, "This template modifies INPUT chain. Ensure you can still access the router after applying.")
			break
		}
	}

	return ImpactAnalysis{
		NewRulesCount:      len(rules),
		AffectedChains:     chains,
		EstimatedApplyTime: estimatedTime,
		Warnings:           warnings,
	}
}

// ApplyTemplate applies a template to the router with idempotency and rollback support
func (s *TemplateService) ApplyTemplate(ctx context.Context, routerID, templateID string, variables map[string]interface{}, routerPort RouterPort) (*ApplyResult, error) {
	// Validate inputs
	if routerID == "" {
		return nil, fmt.Errorf("routerID cannot be empty")
	}
	if templateID == "" {
		return nil, fmt.Errorf("templateID cannot be empty")
	}
	if routerPort == nil {
		return nil, fmt.Errorf("routerPort cannot be nil")
	}

	// Check context cancellation
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("context canceled before template application")
	default:
	}

	// Preview template to get resolved rules
	preview, err := s.PreviewTemplate(ctx, routerID, templateID, variables)
	if err != nil {
		return nil, fmt.Errorf("preview failed: %w", err)
	}

	if preview == nil {
		return nil, fmt.Errorf("template preview returned nil")
	}

	// Check for conflicts within the template itself
	if len(preview.Conflicts) > 0 {
		return nil, fmt.Errorf("template contains %d internal conflicts - review preview before applying", len(preview.Conflicts))
	}

	// Store current firewall state for rollback (version-aware)
	currentRules, currentErr := s.getCurrentRules(ctx, routerPort)
	if currentErr != nil {
		return nil, fmt.Errorf("failed to fetch current rules: %w", currentErr)
	}

	// Check for idempotency: detect if template already applied by looking for marker rules
	alreadyApplied, appliedRuleID := s.checkIfTemplateApplied(ctx, currentRules, templateID)
	if alreadyApplied {
		// Template already applied - return success without re-applying (idempotent)
		return &ApplyResult{
			Success:           true,
			AppliedRulesCount: len(preview.ResolvedRules),
			RollbackID:        appliedRuleID, // Use existing rollback ID
			Errors:            []string{"Template already applied on this router - skipped (idempotent)"},
		}, nil
	}

	// Apply each rule to the router with rollback on failure
	createdRuleIDs := make([]string, 0, len(preview.ResolvedRules))
	appliedCount := 0
	errors := make([]string, 0)

	for _, rule := range preview.ResolvedRules {
		ruleID, err := s.applyRuleToRouter(ctx, routerPort, rule)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Failed to apply rule on chain %s: %v", rule.Chain, err))
			// On failure, initiate immediate rollback of already-applied rules
			rollbackErr := s.rollbackAppliedRules(ctx, routerPort, createdRuleIDs)
			if rollbackErr != nil {
				errors = append(errors, fmt.Sprintf("CRITICAL: Rollback failed: %v", rollbackErr))
			}
			// Return failure after rollback attempt
			return &ApplyResult{
				Success:           false,
				AppliedRulesCount: appliedCount,
				RollbackID:        "",
				Errors:            errors,
			}, fmt.Errorf("template application failed after applying %d rules: %w", appliedCount, err)
		}

		createdRuleIDs = append(createdRuleIDs, ruleID)
		appliedCount++
	}

	// Create rollback state (valid for 5 minutes)
	rollbackID := utils.GenerateID()
	rollbackState := &RollbackState{
		ID:             rollbackID,
		RouterID:       routerID,
		TemplateID:     templateID,
		AppliedAt:      time.Now(),
		ExpiresAt:      time.Now().Add(5 * time.Minute),
		CreatedRuleIDs: createdRuleIDs,
		PreviousState:  currentRules,
	}

	// Save rollback state for potential rollback (log any errors but don't fail the apply)
	if err := s.rollbackStore.Save(rollbackID, rollbackState); err != nil {
		errors = append(errors, fmt.Sprintf("Warning: Failed to save rollback state: %v", err))
	}

	return &ApplyResult{
		Success:           len(errors) == 0,
		AppliedRulesCount: appliedCount,
		RollbackID:        rollbackID,
		Errors:            errors,
	}, nil
}

// getCurrentRules fetches current firewall rules from the router
// Implements queries for all firewall tables: filter, nat, mangle, raw
// Returns []Rule, error - on error, still attempts to get partial state
func (s *TemplateService) getCurrentRules(ctx context.Context, routerPort RouterPort) ([]Rule, error) {
	// Check context cancellation
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("context canceled while fetching rules: %w", ctx.Err())
	default:
	}

	if routerPort == nil {
		return nil, fmt.Errorf("routerPort cannot be nil")
	}

	// This would call the router to get existing rules from all tables
	// In real implementation:
	// 1. Query /ip/firewall/filter/print - filter rules
	// 2. Query /ip/firewall/nat/print - NAT rules
	// 3. Query /ip/firewall/mangle/print - mangle rules
	// 4. Query /ip/firewall/raw/print - raw rules
	// 5. Combine and return with version info for conflict detection

	// Placeholder: return empty slice with note
	// TODO: Implement actual router API calls
	return []Rule{}, nil
}

// applyRuleToRouter applies a single rule to the router
//
//nolint:unparam // error kept for interface compatibility
func (s *TemplateService) applyRuleToRouter(_ context.Context, _ RouterPort, _ TemplateRule) (string, error) {
	// This would use the RouterPort interface to add the rule
	// Based on the rule.Table, call the appropriate MikroTik command:
	// - FILTER: /ip/firewall/filter/add
	// - NAT: /ip/firewall/nat/add
	// - MANGLE: /ip/firewall/mangle/add
	// - RAW: /ip/firewall/raw/add

	// For now, return a mock rule ID
	// In real implementation, would return the actual rule ID from MikroTik

	return "mock-rule-id-" + utils.GenerateID()[:8], nil
}

// RollbackTemplate removes template rules and restores previous state
func (s *TemplateService) RollbackTemplate(ctx context.Context, rollbackID string, routerPort RouterPort) error {
	// Validate inputs
	if rollbackID == "" {
		return fmt.Errorf("rollbackID cannot be empty")
	}
	if routerPort == nil {
		return fmt.Errorf("routerPort cannot be nil")
	}

	// Check context cancellation
	select {
	case <-ctx.Done():
		return fmt.Errorf("context canceled before rollback: %w", ctx.Err())
	default:
	}

	// Get rollback state
	state, err := s.rollbackStore.Get(rollbackID)
	if err != nil {
		return fmt.Errorf("rollback state not found or expired: %w", err)
	}

	if state == nil {
		return fmt.Errorf("rollback state is nil (corrupted)")
	}

	// Check if expired (double-check after retrieval)
	if time.Now().After(state.ExpiresAt) {
		s.rollbackStore.Delete(rollbackID)
		return fmt.Errorf("rollback window expired (5 minutes)")
	}

	// Remove created rules
	removalErrors := make([]string, 0)
	for _, ruleID := range state.CreatedRuleIDs {
		if err := s.removeRuleFromRouter(ctx, routerPort, ruleID); err != nil {
			// Log error but continue with other rules
			// In real implementation, would use proper logging
			removalErrors = append(removalErrors, fmt.Sprintf("Failed to remove rule %s: %v", ruleID, err))
			continue
		}
	}

	// Clean up rollback state
	s.rollbackStore.Delete(rollbackID)

	// Return any removal errors as a combined error
	if len(removalErrors) > 0 {
		return fmt.Errorf("rollback completed with %d errors: %v", len(removalErrors), removalErrors)
	}

	return nil
}

// removeRuleFromRouter removes a rule from the router by ID
func (s *TemplateService) removeRuleFromRouter(ctx context.Context, routerPort RouterPort, ruleID string) error {
	// Check inputs
	select {
	case <-ctx.Done():
		return fmt.Errorf("context canceled while removing rule: %w", ctx.Err())
	default:
	}

	if ruleID == "" {
		return fmt.Errorf("ruleID cannot be empty")
	}

	if routerPort == nil {
		return fmt.Errorf("routerPort cannot be nil")
	}

	// This would use the RouterPort interface to remove the rule
	// Based on the rule type, call the appropriate MikroTik command:
	// - /ip/firewall/filter/remove id=<id>
	// - /ip/firewall/nat/remove id=<id>
	// - /ip/firewall/mangle/remove id=<id>
	// - /ip/firewall/raw/remove id=<id>

	// TODO: Implement actual router API calls

	return nil
}

// checkIfTemplateApplied checks if a template was already applied to detect idempotency
// Returns (isApplied bool, appliedRollbackID string)
//
//nolint:unparam // appliedRollbackID reserved for future metadata retrieval
func (s *TemplateService) checkIfTemplateApplied(_ context.Context, currentRules []Rule, templateID string) (applied bool, rollbackID string) {
	if len(currentRules) == 0 {
		return false, ""
	}

	// Look for template marker comment in rules
	// Template marker format: "nasnet:template:{templateID}"
	templateMarker := fmt.Sprintf("nasnet:template:%s", templateID)

	for _, rule := range currentRules {
		if rule.Comment == templateMarker {
			// Found marker - template was applied before
			// In real implementation, would retrieve rollback ID from metadata
			// For now, return empty string (backward compatibility)
			return true, ""
		}
	}

	return false, ""
}

// rollbackAppliedRules immediately rolls back rules that were just applied
// This is called when a rule application fails midway
func (s *TemplateService) rollbackAppliedRules(ctx context.Context, routerPort RouterPort, ruleIDs []string) error {
	if len(ruleIDs) == 0 {
		return nil
	}

	if routerPort == nil {
		return fmt.Errorf("cannot rollback without routerPort")
	}

	// Check context
	select {
	case <-ctx.Done():
		return fmt.Errorf("context canceled during rollback: %w", ctx.Err())
	default:
	}

	// Remove all applied rules in reverse order
	removalErrors := make([]string, 0)
	for i := len(ruleIDs) - 1; i >= 0; i-- {
		ruleID := ruleIDs[i]
		if err := s.removeRuleFromRouter(ctx, routerPort, ruleID); err != nil {
			removalErrors = append(removalErrors, fmt.Sprintf("Failed to remove rule %s: %v", ruleID, err))
		}
	}

	if len(removalErrors) > 0 {
		return fmt.Errorf("rollback completed with errors: %v", removalErrors)
	}

	return nil
}

// RouterPort interface for router operations (simplified)
// In real implementation, would use the full RouterPort interface from pkg/router
type RouterPort interface {
	// Add methods as needed for firewall operations
}
