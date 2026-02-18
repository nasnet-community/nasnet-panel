package sharing

import (
	"context"
	"fmt"
	"strings"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/internal/router"
)

// findRedactedFields returns list of fields that have redacted values.
func (s *Service) findRedactedFields(config map[string]interface{}) []string {
	var redacted []string
	for key, value := range config {
		if strVal, ok := value.(string); ok {
			if strVal == "***REDACTED***" {
				redacted = append(redacted, key)
			}
		}
	}
	return redacted
}

// createNewInstance creates a new service instance in a transaction.
func (s *Service) createNewInstance(ctx context.Context, tx *ent.Tx, pkg *ServiceExportPackage, config map[string]interface{}, name string) (*ent.ServiceInstance, error) {
	instance, err := tx.ServiceInstance.Create().
		SetFeatureID(pkg.ServiceType).
		SetInstanceName(name).
		SetRouterID("default-router"). // TODO: Get from context
		SetConfig(config).
		SetBinaryVersion(pkg.BinaryVersion).
		SetStatus(serviceinstance.StatusInstalled).
		Save(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to create instance: %w", err)
	}

	return instance, nil
}

// applyRoutingRules applies routing rules to the router, filtering by device MAC addresses.
func (s *Service) applyRoutingRules(ctx context.Context, instanceID string, rules []RoutingRule, deviceFilter []string) error {
	// Build MAC address filter set
	filterSet := make(map[string]bool)
	for _, mac := range deviceFilter {
		filterSet[strings.ToLower(mac)] = true
	}

	for _, rule := range rules {
		// Filter by source MAC if filter is specified
		if len(filterSet) > 0 {
			// Extract MAC from src-address comment or other field
			// In real implementation, parse rule for MAC matching
			// For now, skip if device filter is specified but no MAC match
			if rule.SrcAddress != "" {
				macLower := strings.ToLower(rule.SrcAddress)
				if !filterSet[macLower] {
					continue // Skip this rule
				}
			}
		}

		// Apply rule via RouterPort
		cmd := router.Command{
			Path:   "/ip/firewall/mangle",
			Action: "add",
			Args: map[string]string{
				"chain":            rule.Chain,
				"action":           rule.Action,
				"src-address":      rule.SrcAddress,
				"dst-address":      rule.DstAddress,
				"protocol":         rule.Protocol,
				"comment":          fmt.Sprintf("nasnet-service-%s", instanceID),
				"routing-mark":     rule.RoutingMark,
				"new-routing-mark": rule.NewRoutingMark,
			},
		}

		if _, err := s.routerPort.ExecuteCommand(ctx, cmd); err != nil {
			return fmt.Errorf("failed to apply routing rule: %w", err)
		}
	}

	return nil
}
