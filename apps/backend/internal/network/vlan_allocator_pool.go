package network

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/globalsettings"
	"backend/generated/ent/vlanallocation"
	"backend/internal/common/ulid"
	"backend/internal/events"
)

// GetPoolStart returns the start of the VLAN pool range.
func (va *VLANAllocator) GetPoolStart() int {
	return va.poolStart
}

// GetPoolEnd returns the end of the VLAN pool range.
func (va *VLANAllocator) GetPoolEnd() int {
	return va.poolEnd
}

// UpdatePoolConfig updates the VLAN pool configuration and persists it to GlobalSettings.
// It validates that:
// - poolStart < poolEnd
// - Range is within 1-4094 (IEEE 802.1Q valid range)
// - No existing allocations would be orphaned by the new range
func (va *VLANAllocator) UpdatePoolConfig(ctx context.Context, poolStart, poolEnd int) error {
	va.mu.Lock()
	defer va.mu.Unlock()

	// Validate range
	if poolStart < 1 || poolEnd > 4094 {
		return fmt.Errorf("%w: range must be within 1-4094 (got %d-%d)", ErrInvalidPoolConfig, poolStart, poolEnd)
	}

	if poolStart > poolEnd {
		return fmt.Errorf("%w: pool start (%d) must be <= pool end (%d)", ErrInvalidPoolConfig, poolStart, poolEnd)
	}

	// Check if any existing allocations would be orphaned
	allocations, err := va.store.VLANAllocation().Query().
		Where(vlanallocation.StatusEQ("allocated")).
		All(ctx)

	if err != nil {
		return fmt.Errorf("failed to check existing allocations: %w", err)
	}

	for _, alloc := range allocations {
		if alloc.GetVlanID() < poolStart || alloc.GetVlanID() > poolEnd {
			return fmt.Errorf("%w: existing allocation (VLAN %d) would be outside new pool range %d-%d",
				ErrInvalidPoolConfig, alloc.GetVlanID(), poolStart, poolEnd)
		}
	}

	// Save to GlobalSettings
	if err := savePoolConfigToDB(ctx, va.store, poolStart, poolEnd); err != nil {
		return fmt.Errorf("failed to save pool config: %w", err)
	}

	// Update in-memory config
	va.poolStart = poolStart
	va.poolEnd = poolEnd

	va.logger.Info("vlan pool config updated",
		"pool_start", poolStart,
		"pool_end", poolEnd,
		"pool_size", poolEnd-poolStart+1)

	return nil
}

// GetPoolStatus returns the current status of the VLAN pool for a router.
// Includes utilization percentage and warning flag if >80% utilized.
func (va *VLANAllocator) GetPoolStatus(ctx context.Context, routerID string) (*VLANPoolStatus, error) {
	va.mu.RLock()
	defer va.mu.RUnlock()

	// Count allocated VLANs for this router
	allocatedCount, err := va.store.VLANAllocation().Query().
		Where(
			vlanallocation.RouterIDEQ(routerID),
			vlanallocation.StatusEQ("allocated"),
		).
		Count(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to count allocations: %w", err)
	}

	totalVLANs := va.poolEnd - va.poolStart + 1
	availableVLANs := totalVLANs - allocatedCount
	utilization := float64(allocatedCount) / float64(totalVLANs) * 100.0
	shouldWarn := utilization > 80.0

	return &VLANPoolStatus{
		RouterID:       routerID,
		TotalVLANs:     totalVLANs,
		AllocatedVLANs: allocatedCount,
		AvailableVLANs: availableVLANs,
		Utilization:    utilization,
		ShouldWarn:     shouldWarn,
	}, nil
}

// GetAllocationsByRouter returns all VLAN allocations for a router.
func (va *VLANAllocator) GetAllocationsByRouter(ctx context.Context, routerID string) ([]VLANAllocationEntity, error) {
	va.mu.RLock()
	defer va.mu.RUnlock()

	return va.store.VLANAllocation().Query().
		Where(vlanallocation.RouterIDEQ(routerID)).
		All(ctx)
}

// GetAllocationsByInstance returns all VLAN allocations for a service instance.
func (va *VLANAllocator) GetAllocationsByInstance(ctx context.Context, instanceID string) ([]VLANAllocationEntity, error) {
	va.mu.RLock()
	defer va.mu.RUnlock()

	return va.store.VLANAllocation().Query().
		Where(vlanallocation.InstanceIDEQ(instanceID)).
		All(ctx)
}

// checkAndEmitPoolWarningUnsafe checks pool utilization and emits warning events if thresholds are exceeded.
// This method must be called while holding the write lock (mu.Lock).
// Emits events at 80% (warning) and 95% (critical) utilization thresholds.
func (va *VLANAllocator) checkAndEmitPoolWarningUnsafe(ctx context.Context, routerID string) {
	// Skip if event bus is not configured
	if va.eventBus == nil {
		return
	}

	// Count allocated VLANs for this router
	allocatedCount, err := va.store.VLANAllocation().Query().
		Where(
			vlanallocation.RouterIDEQ(routerID),
			vlanallocation.StatusEQ("allocated"),
		).
		Count(ctx)

	if err != nil {
		va.logger.Error("failed to count allocations for warning check",
			"router_id", routerID,
			"error", err)
		return
	}

	totalVLANs := va.poolEnd - va.poolStart + 1
	availableVLANs := totalVLANs - allocatedCount
	utilization := float64(allocatedCount) / float64(totalVLANs) * 100.0

	// Determine warning level and emit event if threshold exceeded
	var warningLevel string
	var recommendedAction string

	switch {
	case utilization >= 95.0:
		// Critical threshold (95%)
		warningLevel = "critical"
		recommendedAction = "expand_pool"
	case utilization >= 80.0:
		// Warning threshold (80%)
		warningLevel = "warning"
		recommendedAction = "cleanup"
	default:
		// Below warning threshold, no event needed
		return
	}

	// Create and publish warning event
	event := events.NewVLANPoolWarningEvent(
		routerID,
		totalVLANs,
		allocatedCount,
		availableVLANs,
		utilization,
		warningLevel,
		recommendedAction,
		"vlan_allocator",
	)

	if err := va.eventBus.Publish(ctx, event); err != nil {
		va.logger.Error("failed to publish vlan pool warning event",
			"router_id", routerID,
			"utilization", utilization,
			"warning_level", warningLevel,
			"error", err)
	} else {
		va.logger.Warn("vlan pool threshold exceeded",
			"router_id", routerID,
			"utilization", utilization,
			"warning_level", warningLevel,
			"allocated", allocatedCount,
			"available", availableVLANs,
			"total", totalVLANs,
			"recommended_action", recommendedAction)
	}
}

// loadPoolConfigFromDB loads VLAN pool configuration from GlobalSettings.
// Falls back to provided defaults or system defaults if not found.
func loadPoolConfigFromDB(ctx context.Context, store StorePort, fallbackStart, fallbackEnd int) (poolStart, poolEnd int, err error) {
	// Set fallback defaults
	if fallbackStart == 0 {
		fallbackStart = DefaultPoolStart
	}
	if fallbackEnd == 0 {
		fallbackEnd = DefaultPoolEnd
	}

	// Try to load pool_start from GlobalSettings
	poolStart = fallbackStart
	startSetting, err := store.GlobalSettings().Query().
		Where(
			globalsettings.NamespaceEQ(SettingsNamespace),
			globalsettings.KeyEQ(PoolStartKey),
		).
		Only(ctx)

	if err == nil {
		// Extract value from JSON map
		if val, ok := startSetting.GetValue()["value"].(float64); ok {
			poolStart = int(val)
		}
	} else if !ent.IsNotFound(err) {
		return 0, 0, fmt.Errorf("failed to query pool_start setting: %w", err)
	}

	// Try to load pool_end from GlobalSettings
	poolEnd = fallbackEnd
	endSetting, err := store.GlobalSettings().Query().
		Where(
			globalsettings.NamespaceEQ(SettingsNamespace),
			globalsettings.KeyEQ(PoolEndKey),
		).
		Only(ctx)

	if err == nil {
		// Extract value from JSON map
		if val, ok := endSetting.GetValue()["value"].(float64); ok {
			poolEnd = int(val)
		}
	} else if !ent.IsNotFound(err) {
		return 0, 0, fmt.Errorf("failed to query pool_end setting: %w", err)
	}

	return poolStart, poolEnd, nil
}

// savePoolConfigToDB saves VLAN pool configuration to GlobalSettings.
func savePoolConfigToDB(ctx context.Context, store StorePort, poolStart, poolEnd int) error {
	// Save pool_start
	_, err := store.GlobalSettings().Query().
		Where(
			globalsettings.NamespaceEQ(SettingsNamespace),
			globalsettings.KeyEQ(PoolStartKey),
		).
		Only(ctx)

	switch {
	case ent.IsNotFound(err):
		// Create new setting
		_, err = store.GlobalSettings().Create().
			SetID(ulid.NewString()).
			SetNamespace(SettingsNamespace).
			SetKey(PoolStartKey).
			SetValue(map[string]interface{}{"value": float64(poolStart)}).
			SetValueType("number").
			SetDescription("VLAN pool start ID (first allocatable VLAN)").
			SetEditable(true).
			SetRequiresRestart(true).
			Save(ctx)
		if err != nil {
			return fmt.Errorf("failed to create pool_start setting: %w", err)
		}
	case err != nil:
		return fmt.Errorf("failed to query pool_start setting: %w", err)
	default:
		// Update existing setting
		_, err = store.GlobalSettings().Update().
			Where(
				globalsettings.NamespaceEQ(SettingsNamespace),
				globalsettings.KeyEQ(PoolStartKey),
			).
			SetValue(map[string]interface{}{"value": float64(poolStart)}).
			Save(ctx)
		if err != nil {
			return fmt.Errorf("failed to update pool_start setting: %w", err)
		}
	}

	// Save pool_end
	_, err = store.GlobalSettings().Query().
		Where(
			globalsettings.NamespaceEQ(SettingsNamespace),
			globalsettings.KeyEQ(PoolEndKey),
		).
		Only(ctx)

	switch {
	case ent.IsNotFound(err):
		// Create new setting
		_, err = store.GlobalSettings().Create().
			SetID(ulid.NewString()).
			SetNamespace(SettingsNamespace).
			SetKey(PoolEndKey).
			SetValue(map[string]interface{}{"value": float64(poolEnd)}).
			SetValueType("number").
			SetDescription("VLAN pool end ID (last allocatable VLAN)").
			SetEditable(true).
			SetRequiresRestart(true).
			Save(ctx)
		if err != nil {
			return fmt.Errorf("failed to create pool_end setting: %w", err)
		}
	case err != nil:
		return fmt.Errorf("failed to query pool_end setting: %w", err)
	default:
		// Update existing setting
		_, err = store.GlobalSettings().Update().
			Where(
				globalsettings.NamespaceEQ(SettingsNamespace),
				globalsettings.KeyEQ(PoolEndKey),
			).
			SetValue(map[string]interface{}{"value": float64(poolEnd)}).
			Save(ctx)
		if err != nil {
			return fmt.Errorf("failed to update pool_end setting: %w", err)
		}
	}

	return nil
}
