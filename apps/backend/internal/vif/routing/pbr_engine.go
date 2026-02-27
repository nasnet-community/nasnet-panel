// Package vif implements Policy-Based Routing (PBR) engine for device-to-service routing.
// The PBR engine manages mangle rules that route traffic from specific client devices
// to designated service instances via routing marks.
package routing

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/devicerouting"
	"backend/generated/ent/serviceinstance"
	"backend/internal/vif/isolation"

	"backend/internal/events"
	"backend/internal/router"
)

// PBREngine manages Policy-Based Routing (PBR) rules for device-to-service routing.
// It creates and manages MikroTik mangle rules that use MAC addresses to route
// client device traffic through specific routing marks.
type PBREngine struct {
	routerPort router.RouterPort
	client     *ent.Client
	eventBus   events.EventBus
	publisher  *events.Publisher
}

// NewPBREngine creates a new PBR engine instance.
func NewPBREngine(
	routerPort router.RouterPort,
	client *ent.Client,
	eventBus events.EventBus,
	publisher *events.Publisher,
) *PBREngine {

	return &PBREngine{
		routerPort: routerPort,
		client:     client,
		eventBus:   eventBus,
		publisher:  publisher,
	}
}

// DeviceRoutingAssignment represents the result of a routing assignment operation.
type DeviceRoutingAssignment struct {
	DeviceID       string
	MacAddress     string
	RoutingMark    string
	MangleRuleID   string
	Success        bool
	Error          error
	ConflictExists bool
}

// AssignDeviceRouting creates a mangle rule to route traffic from a specific device
// to a service instance via routing mark.
//
// Flow (Apply-Confirm-Merge pattern):
// 1. Check for existing assignment conflict
// 2. If conflict exists, remove old mangle rule first
// 3. Create new mangle rule on router (Apply)
// 4. Store mangle_rule_id in DB (Confirm)
// 5. Emit event (Merge)
//
// Returns the RouterOS .id of the created mangle rule for O(1) removal.
func (p *PBREngine) AssignDeviceRouting(
	ctx context.Context,
	deviceID string,
	macAddress string,
	routingMark string,
	instanceID string,
) (*DeviceRoutingAssignment, error) {

	result := &DeviceRoutingAssignment{
		DeviceID:    deviceID,
		MacAddress:  macAddress,
		RoutingMark: routingMark,
	}

	// Step 1: Check for existing assignment (conflict detection)
	existingRule, err := p.findExistingRule(ctx, deviceID)
	if err != nil {
		result.Error = fmt.Errorf("failed to check existing rule: %w", err)
		return result, result.Error
	}

	// Step 2: Remove old assignment if conflict exists
	if existingRule != nil {
		result.ConflictExists = true
		if rmErr := p.removeMangleRule(ctx, existingRule.MangleRuleID); rmErr != nil {
			result.Error = fmt.Errorf("failed to remove conflicting rule: %w", rmErr)
			return result, result.Error
		}

		// Delete old DB record
		if delErr := p.client.DeviceRouting.DeleteOneID(existingRule.ID).Exec(ctx); delErr != nil {
			result.Error = fmt.Errorf("failed to delete old DB record: %w", delErr)
			return result, result.Error
		}
	}

	// Step 3: Create mangle rule on router (Apply)
	mangleRuleID, err := p.createMangleRule(ctx, deviceID, macAddress, routingMark)
	if err != nil {
		result.Error = fmt.Errorf("failed to create mangle rule: %w", err)
		return result, result.Error
	}

	result.MangleRuleID = mangleRuleID

	// Step 4: Persist to database (Confirm)
	_, err = p.client.DeviceRouting.
		Create().
		SetDeviceID(deviceID).
		SetMACAddress(macAddress).
		SetRoutingMark(routingMark).
		SetInstanceID(instanceID).
		SetMangleRuleID(mangleRuleID).
		Save(ctx)
	if err != nil {
		// Rollback: Remove the mangle rule we just created
		_ = p.removeMangleRule(ctx, mangleRuleID) //nolint:errcheck // best-effort device routing assignment
		result.Error = fmt.Errorf("failed to persist to database: %w", err)
		return result, result.Error
	}

	result.Success = true

	// Step 5: Emit event (Merge)
	if p.publisher != nil {
		event := events.NewBaseEvent(
			"device.routing.assigned",
			events.PriorityNormal,
			"pbr-engine",
		)
		_ = p.publisher.Publish(ctx, &event) //nolint:errcheck // best-effort event publication
	}

	return result, nil
}

// RemoveDeviceRouting removes a device routing assignment using the stored mangle_rule_id
// for O(1) removal (no query needed).
//
// Flow:
// 1. Remove kill switch rules if enabled
// 2. Remove mangle rule from router using stored .id
// 3. Delete DB record
// 4. Emit event
func (p *PBREngine) RemoveDeviceRouting(ctx context.Context, deviceID string) error {
	// Step 1: Fetch DB record to get mangle_rule_id
	record, err := p.client.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ(deviceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil // Already removed, idempotent
		}
		return fmt.Errorf("failed to fetch routing record: %w", err)
	}

	// Step 2: Remove kill switch rules if enabled (cleanup before removing routing)
	if record.KillSwitchEnabled && record.KillSwitchRuleID != "" {
		killSwitchManager := isolation.NewKillSwitchManager(p.routerPort, p.client, p.eventBus, p.publisher)
		// Intentionally suppress error: routing removal should continue even if kill switch cleanup fails
		_ = killSwitchManager.Disable(ctx, record.ID) //nolint:errcheck // best-effort cleanup
	}

	// Step 3: Remove mangle rule from router using stored .id (O(1) operation)
	if err := p.removeMangleRule(ctx, record.MangleRuleID); err != nil {
		return fmt.Errorf("failed to remove mangle rule: %w", err)
	}

	// Step 4: Delete DB record
	if err := p.client.DeviceRouting.DeleteOneID(record.ID).Exec(ctx); err != nil {
		return fmt.Errorf("failed to delete DB record: %w", err)
	}

	// Step 5: Emit event
	if p.publisher != nil {
		event := events.NewBaseEvent(
			"device.routing.removed",
			events.PriorityNormal,
			"pbr-engine",
		)
		_ = p.publisher.Publish(ctx, &event) //nolint:errcheck // best-effort event publication
	}

	return nil
}

// BulkAssignRouting processes multiple device routing assignments independently.
// Each assignment is processed separately with its own transaction and error handling.
// Returns results for all assignments, including both successes and failures.
func (p *PBREngine) BulkAssignRouting(
	ctx context.Context,
	assignments []struct {
		DeviceID    string
		MacAddress  string
		RoutingMark string
		InstanceID  string
	},
) []*DeviceRoutingAssignment {

	results := make([]*DeviceRoutingAssignment, len(assignments))

	for i, assignment := range assignments {
		result, _ := p.AssignDeviceRouting( //nolint:errcheck // best-effort assignment
			ctx,
			assignment.DeviceID,
			assignment.MacAddress,
			assignment.RoutingMark,
			assignment.InstanceID,
		)
		// Result is stored regardless of error (error is captured in result.Error)
		results[i] = result
	}

	return results
}

// ReconcileOnStartup reconciles routing state between database and router on system startup.
// Handles three scenarios:
// 1. Missing rules: Rules in DB but not on router -> recreate on router
// 2. Orphaned rules: Rules on router but not in DB -> remove from router
// 3. Deleted VIF cascade: Rules referencing deleted service instances -> remove both DB and router
//
// Returns reconciliation statistics.
func (p *PBREngine) ReconcileOnStartup(ctx context.Context) (*PBRReconcileResult, error) {
	result := &PBRReconcileResult{}

	// Step 1: Fetch all device routing records from DB
	dbRecords, err := p.client.DeviceRouting.Query().All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch DB records: %w", err)
	}

	// Step 2: Fetch all mangle rules from router with nnc-routing-* comment pattern
	routerRules, err := p.fetchAllMangleRules(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch router rules: %w", err)
	}

	// Create lookup maps
	dbRulesByID := make(map[string]*ent.DeviceRouting)
	for _, record := range dbRecords {
		dbRulesByID[record.MangleRuleID] = record
	}

	routerRulesByID := make(map[string]map[string]string)
	for _, rule := range routerRules {
		routerRulesByID[rule[".id"]] = rule
	}

	p.reconcileMissingRules(ctx, dbRecords, routerRulesByID, result)
	p.reconcileOrphanedRules(ctx, routerRulesByID, dbRulesByID, result)
	p.reconcileDeletedVIFCascade(ctx, dbRecords, result)

	return result, nil
}

// reconcileMissingRules recreates rules that exist in DB but not on router.
func (p *PBREngine) reconcileMissingRules(
	ctx context.Context,
	dbRecords []*ent.DeviceRouting,
	routerRulesByID map[string]map[string]string,
	result *PBRReconcileResult,
) {

	for _, dbRecord := range dbRecords {
		if _, exists := routerRulesByID[dbRecord.MangleRuleID]; exists {
			continue
		}

		result.MissingRules++
		newRuleID, err := p.createMangleRule(
			ctx,
			dbRecord.DeviceID,
			dbRecord.MACAddress,
			dbRecord.RoutingMark,
		)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("failed to recreate rule for device %s: %v", dbRecord.DeviceID, err))
			continue
		}

		_, err = p.client.DeviceRouting.
			UpdateOneID(dbRecord.ID).
			SetMangleRuleID(newRuleID).
			Save(ctx)
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("failed to update DB for device %s: %v", dbRecord.DeviceID, err))
			//nolint:errcheck // best-effort device routing assignment
			_ = p.removeMangleRule(ctx, newRuleID)
		} else {
			result.Recreated++
		}
	}
}

// reconcileOrphanedRules removes rules on router that have no matching DB record.
func (p *PBREngine) reconcileOrphanedRules(
	ctx context.Context,
	routerRulesByID map[string]map[string]string,
	dbRulesByID map[string]*ent.DeviceRouting,
	result *PBRReconcileResult,
) {

	for ruleID := range routerRulesByID {
		if _, exists := dbRulesByID[ruleID]; !exists {
			result.OrphanedRules++
			if err := p.removeMangleRule(ctx, ruleID); err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("failed to remove orphaned rule %s: %v", ruleID, err))
			} else {
				result.Removed++
			}
		}
	}
}

// reconcileDeletedVIFCascade removes rules referencing deleted service instances.
func (p *PBREngine) reconcileDeletedVIFCascade(
	ctx context.Context,
	dbRecords []*ent.DeviceRouting,
	result *PBRReconcileResult,
) {

	for _, dbRecord := range dbRecords {
		exists, err := p.client.ServiceInstance.Query().
			Where(serviceinstance.IDEQ(dbRecord.InstanceID)).
			Exist(ctx)

		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("failed to check instance %s: %v", dbRecord.InstanceID, err))
			continue
		}

		if !exists {
			result.DeletedVIFCascade++
			if err := p.removeMangleRule(ctx, dbRecord.MangleRuleID); err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("failed to remove rule for deleted VIF %s: %v", dbRecord.InstanceID, err))
			}

			if err := p.client.DeviceRouting.DeleteOneID(dbRecord.ID).Exec(ctx); err != nil {
				result.Errors = append(result.Errors, fmt.Sprintf("failed to delete DB record for deleted VIF %s: %v", dbRecord.InstanceID, err))
			} else {
				result.Removed++
			}
		}
	}
}

// PBRReconcileResult contains statistics from a PBR reconciliation operation.
type PBRReconcileResult struct {
	MissingRules      int      // Rules in DB but not on router
	OrphanedRules     int      // Rules on router but not in DB
	DeletedVIFCascade int      // Rules referencing deleted service instances
	Recreated         int      // Successfully recreated missing rules
	Removed           int      // Successfully removed orphaned/cascade rules
	Errors            []string // List of error messages
}

// createMangleRule creates a mangle rule on the router for PBR routing.
// Returns the RouterOS .id of the created rule.
func (p *PBREngine) createMangleRule(
	ctx context.Context,
	deviceID string,
	macAddress string,
	routingMark string,
) (string, error) {

	cmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "add",
		Args: map[string]string{
			"chain":            "prerouting",
			"src-mac-address":  macAddress,
			"action":           "mark-routing",
			"new-routing-mark": routingMark,
			"passthrough":      "yes",
			"comment":          fmt.Sprintf("nnc-routing-%s", deviceID),
		},
	}

	result, err := p.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return "", fmt.Errorf("failed to execute mangle add command: %w", err)
	}

	if !result.Success {
		return "", fmt.Errorf("mangle rule creation failed: %w", result.Error)
	}

	if result.ID == "" {
		return "", fmt.Errorf("router did not return .id for created mangle rule")
	}

	return result.ID, nil
}

// removeMangleRule removes a mangle rule from the router using its RouterOS .id.
// This is an O(1) operation since we have the exact .id.
func (p *PBREngine) removeMangleRule(ctx context.Context, mangleRuleID string) error {
	if mangleRuleID == "" {
		return fmt.Errorf("mangle rule ID is empty")
	}

	cmd := router.Command{
		Path:   "/ip/firewall/mangle",
		Action: "remove",
		ID:     mangleRuleID,
	}

	result, err := p.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to execute mangle remove command: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("mangle rule removal failed: %w", result.Error)
	}

	return nil
}

// findExistingRule checks if a routing rule already exists for the given device.
// Returns the existing DeviceRouting record or nil if none exists.
func (p *PBREngine) findExistingRule(ctx context.Context, deviceID string) (*ent.DeviceRouting, error) {
	record, err := p.client.DeviceRouting.
		Query().
		Where(devicerouting.DeviceIDEQ(deviceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return nil, nil //nolint:nilnil // nil device routing is valid not-found
		}
		return nil, fmt.Errorf("find existing rule: %w", err)
	}

	return record, nil
}

// fetchAllMangleRules fetches all mangle rules with nnc-routing-* comment pattern.
func (p *PBREngine) fetchAllMangleRules(ctx context.Context) ([]map[string]string, error) {
	query := router.StateQuery{
		Path:   "/ip/firewall/mangle",
		Fields: []string{".id", "comment", "src-mac-address", "new-routing-mark"},
		Filter: map[string]string{
			// This would need router adapter support for wildcard comment filtering
			// For now, we'll fetch all and filter in code
		},
	}

	result, err := p.routerPort.QueryState(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query mangle rules: %w", err)
	}

	// Filter for nnc-routing-* comments
	var filtered []map[string]string
	for _, rule := range result.Resources {
		comment, ok := rule["comment"]
		if ok && len(comment) > 12 && comment[:12] == "nnc-routing-" {
			filtered = append(filtered, rule)
		}
	}

	return filtered, nil
}
