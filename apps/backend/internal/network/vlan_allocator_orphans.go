package network

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	"backend/generated/ent/vlanallocation"
)

// CleanupOrphans finds and removes orphaned VLAN allocations.
// An allocation is orphaned if:
// - Its ServiceInstance no longer exists
// - Its ServiceInstance is in "deleting" status
//
// Called during InstanceManager.Reconcile() on system startup.
// Returns the count of cleaned allocations.
func (va *VLANAllocator) CleanupOrphans(ctx context.Context, routerID string) (int, error) {
	va.mu.Lock()
	defer va.mu.Unlock()

	// Query all allocated VLANs for this router
	allocations, err := va.store.VLANAllocation().Query().
		Where(
			vlanallocation.RouterIDEQ(routerID),
			vlanallocation.StatusEQ("allocated"),
		).
		All(ctx)

	if err != nil {
		return 0, fmt.Errorf("failed to query allocations: %w", err)
	}

	cleanedCount := 0

	for _, alloc := range allocations {
		// Check if instance exists
		instance, err := va.store.ServiceInstance().Query().
			Where(serviceinstance.IDEQ(alloc.GetInstanceID())).
			Only(ctx)

		isOrphan := false

		if err != nil {
			if ent.IsNotFound(err) {
				// Instance doesn't exist - this is an orphan
				isOrphan = true
			} else {
				va.logger.Error("failed to query service instance",
					"instance_id", alloc.GetInstanceID(),
					"error", err)
				continue
			}
		}

		// Check if instance is in "deleting" status
		if !isOrphan && instance.GetStatus() == "deleting" {
			isOrphan = true
		}

		if isOrphan {
			// Mark as released
			_, err := alloc.Update().
				SetStatus("released").
				Save(ctx)

			if err != nil {
				va.logger.Error("failed to release orphaned allocation",
					"allocation_id", alloc.GetID(),
					"router_id", alloc.GetRouterID(),
					"vlan_id", alloc.GetVlanID(),
					"error", err)
				continue
			}

			// Remove from cache
			cacheKey := va.cacheKey(alloc.GetRouterID(), alloc.GetVlanID())
			delete(va.cache, cacheKey)

			cleanedCount++
		}
	}

	if cleanedCount > 0 {
		va.logger.Info("cleaned up orphaned vlan allocations",
			"router_id", routerID,
			"cleaned_count", cleanedCount)
	}

	return cleanedCount, nil
}

// DetectOrphans finds orphaned VLAN allocations without removing them.
// Useful for reporting/diagnostics before cleanup.
func (va *VLANAllocator) DetectOrphans(ctx context.Context, routerID string) ([]VLANAllocationEntity, error) {
	va.mu.RLock()
	defer va.mu.RUnlock()

	allocations, err := va.store.VLANAllocation().Query().
		Where(
			vlanallocation.RouterIDEQ(routerID),
			vlanallocation.StatusEQ("allocated"),
		).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to query allocations: %w", err)
	}

	var orphans []VLANAllocationEntity

	for _, alloc := range allocations {
		instance, err := va.store.ServiceInstance().Query().
			Where(serviceinstance.IDEQ(alloc.GetInstanceID())).
			Only(ctx)

		if err != nil {
			if ent.IsNotFound(err) {
				orphans = append(orphans, alloc)
				continue
			}
			va.logger.Error("failed to query service instance",
				"instance_id", alloc.GetInstanceID(),
				"error", err)
			continue
		}

		if instance.GetStatus() == "deleting" {
			orphans = append(orphans, alloc)
		}
	}

	return orphans, nil
}
