package firewall

import (
	"strings"
)

// ConflictDetector checks for conflicts between template rules and existing rules
type ConflictDetector struct{}

// NewConflictDetector creates a new conflict detector
func NewConflictDetector() *ConflictDetector {
	return &ConflictDetector{}
}

// DetectConflicts analyzes template rules against existing rules
func (cd *ConflictDetector) DetectConflicts(templateRules []TemplateRule, existingRules []FirewallRule) []Conflict {
	conflicts := make([]Conflict, 0)

	for _, templateRule := range templateRules {
		// Check for duplicate rules
		if duplicate := cd.findDuplicate(templateRule, existingRules); duplicate != nil {
			conflicts = append(conflicts, Conflict{
				Type:           "DUPLICATE_RULE",
				Message:        cd.formatDuplicateMessage(templateRule, *duplicate),
				ExistingRuleID: duplicate.ID,
				ProposedRule:   templateRule,
			})
		}

		// Check for chain conflicts
		if chainConflict := cd.detectChainConflict(templateRule, existingRules); chainConflict != nil {
			conflicts = append(conflicts, *chainConflict)
		}

		// Check for IP overlaps
		if ipConflict := cd.detectIPOverlap(templateRule, existingRules); ipConflict != nil {
			conflicts = append(conflicts, *ipConflict)
		}
	}

	return conflicts
}

// findDuplicate checks if a template rule duplicates an existing rule
func (cd *ConflictDetector) findDuplicate(templateRule TemplateRule, existingRules []FirewallRule) *FirewallRule {
	for _, existing := range existingRules {
		// Compare basic properties
		if existing.Table != templateRule.Table ||
			existing.Chain != templateRule.Chain ||
			existing.Action != templateRule.Action {
			continue
		}

		// Compare properties (simplified - would need deeper comparison in real implementation)
		if cd.propertiesMatch(templateRule.Properties, existing.Properties) {
			return &existing
		}
	}

	return nil
}

// propertiesMatch checks if two property maps match
func (cd *ConflictDetector) propertiesMatch(template, existing map[string]interface{}) bool {
	// Simplified comparison - checks only key existence
	// In real implementation, would compare values properly

	if len(template) != len(existing) {
		return false
	}

	for key := range template {
		if _, exists := existing[key]; !exists {
			return false
		}
		// In real implementation, would compare values here
	}

	return true
}

// detectChainConflict checks for chain-level conflicts
func (cd *ConflictDetector) detectChainConflict(templateRule TemplateRule, existingRules []FirewallRule) *Conflict {
	// Check for conflicting actions in same chain
	// For example, a "drop all" rule would conflict with subsequent "accept" rules

	for _, existing := range existingRules {
		if existing.Chain != templateRule.Chain {
			continue
		}

		// Check if existing rule is a "drop all" or "reject all"
		if cd.isDropAll(existing) && templateRule.Action == "accept" {
			return &Conflict{
				Type: "CHAIN_CONFLICT",
				Message: "This template adds an 'accept' rule in a chain with existing 'drop all' rule. " +
					"The template rule may not have the intended effect.",
				ExistingRuleID: existing.ID,
				ProposedRule:   templateRule,
			}
		}
	}

	return nil
}

// isDropAll checks if a rule is a drop/reject all rule
func (cd *ConflictDetector) isDropAll(rule FirewallRule) bool {
	action := strings.ToLower(rule.Action)
	if action != "drop" && action != "reject" {
		return false
	}

	// Check if rule has minimal properties (indicating "drop all")
	return len(rule.Properties) == 0
}

// detectIPOverlap checks for overlapping IP ranges
func (cd *ConflictDetector) detectIPOverlap(templateRule TemplateRule, existingRules []FirewallRule) *Conflict {
	// This would implement CIDR overlap detection
	// For example:
	// - 192.168.1.0/24 overlaps with 192.168.1.0/16
	// - 10.0.0.0/8 overlaps with 10.1.0.0/16

	// Simplified implementation - would need proper CIDR parsing in real code

	return nil
}

// formatDuplicateMessage creates a user-friendly message for duplicate rules
func (cd *ConflictDetector) formatDuplicateMessage(template TemplateRule, existing FirewallRule) string {
	return "A rule with similar configuration already exists in " +
		existing.Chain + " chain. " +
		"Applying this template may create duplicate rules."
}
