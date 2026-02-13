package firewall

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
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
	service := &TemplateService{
		builtInTemplates: make(map[string]*Template),
		rollbackStore:    NewRollbackStore(),
	}

	// Load built-in templates
	if err := service.loadBuiltInTemplates(); err != nil {
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
	template, exists := s.builtInTemplates[id]
	if !exists {
		return nil, fmt.Errorf("template not found: %s", id)
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
	resolvedRules, err := s.resolveTemplateRules(template.Rules, variables)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve template rules: %w", err)
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

// validateVariables checks that all required variables are provided
func (s *TemplateService) validateVariables(template *Template, variables map[string]interface{}) error {
	for _, varDef := range template.Variables {
		if !varDef.Required {
			continue
		}

		value, exists := variables[varDef.Name]
		if !exists || value == nil || value == "" {
			return fmt.Errorf("required variable %s is missing", varDef.Name)
		}
	}

	return nil
}

// resolveTemplateRules substitutes variables in rule properties
func (s *TemplateService) resolveTemplateRules(rules []TemplateRule, variables map[string]interface{}) ([]TemplateRule, error) {
	resolved := make([]TemplateRule, len(rules))

	// Variable pattern: {{VARIABLE_NAME}}
	varPattern := regexp.MustCompile(`\{\{([A-Z_]+)\}\}`)

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
func (s *TemplateService) detectConflicts(rules []TemplateRule) []Conflict {
	conflicts := make([]Conflict, 0)

	// This is a simplified implementation
	// In a real implementation, we would:
	// 1. Fetch existing firewall rules from the router
	// 2. Compare with template rules
	// 3. Detect duplicates, IP overlaps, position conflicts

	// For now, return empty conflicts
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

// ApplyTemplate applies a template to the router
func (s *TemplateService) ApplyTemplate(ctx context.Context, routerID, templateID string, variables map[string]interface{}, routerPort RouterPort) (*ApplyResult, error) {
	// Preview template to get resolved rules
	preview, err := s.PreviewTemplate(ctx, routerID, templateID, variables)
	if err != nil {
		return nil, fmt.Errorf("preview failed: %w", err)
	}

	// Check for conflicts
	if len(preview.Conflicts) > 0 {
		// In a real implementation, we might allow overrides or handle conflicts
		// For now, we'll proceed anyway
	}

	// Store current firewall state for rollback
	currentRules, err := s.getCurrentFirewallRules(ctx, routerPort)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch current rules: %w", err)
	}

	// Apply each rule to the router
	createdRuleIDs := make([]string, 0, len(preview.ResolvedRules))
	appliedCount := 0
	errors := make([]string, 0)

	for _, rule := range preview.ResolvedRules {
		ruleID, err := s.applyRuleToRouter(ctx, routerPort, rule)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Failed to apply rule on chain %s: %v", rule.Chain, err))
			continue
		}

		createdRuleIDs = append(createdRuleIDs, ruleID)
		appliedCount++
	}

	// Create rollback state (valid for 5 minutes)
	rollbackID := uuid.New().String()
	rollbackState := &RollbackState{
		ID:             rollbackID,
		RouterID:       routerID,
		TemplateID:     templateID,
		AppliedAt:      time.Now(),
		ExpiresAt:      time.Now().Add(5 * time.Minute),
		CreatedRuleIDs: createdRuleIDs,
		PreviousState:  currentRules,
	}

	s.rollbackStore.Save(rollbackID, rollbackState)

	return &ApplyResult{
		Success:           len(errors) == 0,
		AppliedRulesCount: appliedCount,
		RollbackID:        rollbackID,
		Errors:            errors,
	}, nil
}

// getCurrentFirewallRules fetches current firewall rules from the router
func (s *TemplateService) getCurrentFirewallRules(ctx context.Context, routerPort RouterPort) ([]FirewallRule, error) {
	// This would call the router to get existing rules
	// For now, return empty slice
	// In real implementation:
	// 1. Query /ip/firewall/filter/print
	// 2. Query /ip/firewall/nat/print
	// 3. Query /ip/firewall/mangle/print
	// 4. Combine and return

	return []FirewallRule{}, nil
}

// applyRuleToRouter applies a single rule to the router
func (s *TemplateService) applyRuleToRouter(ctx context.Context, routerPort RouterPort, rule TemplateRule) (string, error) {
	// This would use the RouterPort interface to add the rule
	// Based on the rule.Table, call the appropriate MikroTik command:
	// - FILTER: /ip/firewall/filter/add
	// - NAT: /ip/firewall/nat/add
	// - MANGLE: /ip/firewall/mangle/add
	// - RAW: /ip/firewall/raw/add

	// For now, return a mock rule ID
	// In real implementation, would return the actual rule ID from MikroTik

	return "mock-rule-id-" + uuid.New().String()[:8], nil
}

// RollbackTemplate removes template rules and restores previous state
func (s *TemplateService) RollbackTemplate(ctx context.Context, rollbackID string, routerPort RouterPort) error {
	// Get rollback state
	state, err := s.rollbackStore.Get(rollbackID)
	if err != nil {
		return fmt.Errorf("rollback state not found or expired: %w", err)
	}

	// Check if expired
	if time.Now().After(state.ExpiresAt) {
		s.rollbackStore.Delete(rollbackID)
		return fmt.Errorf("rollback window expired (5 minutes)")
	}

	// Remove created rules
	for _, ruleID := range state.CreatedRuleIDs {
		if err := s.removeRuleFromRouter(ctx, routerPort, ruleID); err != nil {
			// Log error but continue
			// In real implementation, would use proper logging
			continue
		}
	}

	// Clean up rollback state
	s.rollbackStore.Delete(rollbackID)

	return nil
}

// removeRuleFromRouter removes a rule from the router
func (s *TemplateService) removeRuleFromRouter(ctx context.Context, routerPort RouterPort, ruleID string) error {
	// This would use the RouterPort interface to remove the rule
	// Based on the rule type, call the appropriate MikroTik command:
	// - /ip/firewall/filter/remove
	// - /ip/firewall/nat/remove
	// - /ip/firewall/mangle/remove
	// - /ip/firewall/raw/remove

	return nil
}

// RouterPort interface for router operations (simplified)
// In real implementation, would use the full RouterPort interface from pkg/router
type RouterPort interface {
	// Add methods as needed for firewall operations
}
