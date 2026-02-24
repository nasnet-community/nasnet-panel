// Package network provides network resource management including VLAN allocation.
package network

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"backend/generated/ent"
	"backend/generated/ent/vlanallocation"
	"backend/internal/common/ulid"
	"backend/internal/events"
)

// VLANAllocator manages automatic VLAN allocation for service instances.
// It provides thread-safe allocation from a configurable pool, conflict detection
// with existing router VLANs, and orphan cleanup reconciliation.
//
// Architecture:
// - Composes VlanService for router conflict detection (don't duplicate RouterPort commands)
// - Uses RWMutex for thread-safety with internal unsafe methods (pattern: port_registry.go)
// - Maintains in-memory cache for fast lookups
// - Database unique constraint on (router_id, vlan_id) prevents races at source
type VLANAllocator struct {
	store       StorePort
	vlanService VlanServicePort
	eventBus    events.EventBus
	logger      *slog.Logger
	mu          sync.RWMutex

	// In-memory cache for fast lookups: key format "routerID:vlanID"
	cache map[string]VLANAllocationEntity

	// VLAN pool configuration (hardcoded for MVP, configurable later via GlobalSettings)
	poolStart int // Default: 100
	poolEnd   int // Default: 199
}

// NewVLANAllocator creates a new VLAN allocator with the given configuration.
// It loads existing allocations from the database into memory cache.
func NewVLANAllocator(cfg VLANAllocatorConfig) (*VLANAllocator, error) {
	if cfg.Store == nil {
		return nil, fmt.Errorf("store is required")
	}

	if cfg.VlanService == nil {
		return nil, fmt.Errorf("vlan service is required")
	}

	logger := cfg.Logger
	if logger == nil {
		logger = slog.Default()
	}

	// Load pool range from GlobalSettings or use provided config as fallback
	ctx := context.Background()
	poolStart, poolEnd, err := loadPoolConfigFromDB(ctx, cfg.Store, cfg.PoolStart, cfg.PoolEnd)
	if err != nil {
		return nil, fmt.Errorf("failed to load pool config: %w", err)
	}

	// IEEE 802.1Q VLAN ID range: 0-4095, but 0 and 4095 are reserved.
	// Valid range for user VLANs: 1-4094
	// The allocator explicitly skips VLAN IDs 1 and 4094 in findNextAvailableVLANUnsafe
	if poolStart < 1 || poolEnd > 4094 || poolStart > poolEnd {
		return nil, fmt.Errorf("invalid pool range: %d-%d (must be 1-4094 and start <= end)", poolStart, poolEnd)
	}

	va := &VLANAllocator{
		store:       cfg.Store,
		vlanService: cfg.VlanService,
		eventBus:    cfg.EventBus,
		logger:      logger,
		cache:       make(map[string]VLANAllocationEntity),
		poolStart:   poolStart,
		poolEnd:     poolEnd,
	}

	// Load cache from database (reuse ctx from above)
	if err := va.loadCache(ctx); err != nil {
		return nil, fmt.Errorf("failed to load VLAN allocation cache: %w", err)
	}

	va.logger.Info("vlan allocator initialized",
		"cached_allocations", len(va.cache),
		"pool_start", poolStart,
		"pool_end", poolEnd,
		"pool_size", poolEnd-poolStart+1)

	return va, nil
}

// AllocateVLAN allocates a VLAN from the pool for a service instance.
// It automatically:
// - Finds the next available VLAN ID (skipping conflicts with router VLANs)
// - Generates a subnet using the template 10.99.{vlan_id}.0/24
// - Persists the allocation to the database with unique constraint
// - Updates the in-memory cache
//
// Thread-safe: Uses write lock for entire allocation process.
func (va *VLANAllocator) AllocateVLAN(ctx context.Context, req AllocateVLANRequest) (*AllocateVLANResponse, error) {
	if req.RouterID == "" || req.InstanceID == "" || req.ServiceType == "" {
		return nil, fmt.Errorf("%w: router_id, instance_id, and service_type are required", ErrInvalidRequest)
	}

	// Lock for entire allocation process to prevent race conditions
	va.mu.Lock()
	defer va.mu.Unlock()

	// Find next available VLAN (must be called while holding lock)
	vlanID, err := va.findNextAvailableVLANUnsafe(ctx, req.RouterID)
	if err != nil {
		return nil, err
	}

	// Generate subnet from template
	subnet := va.generateSubnet(vlanID)

	// Create allocation in database (unique constraint on router_id+vlan_id prevents races)
	allocation, err := va.store.VLANAllocation().Create().
		SetID(ulid.NewString()).
		SetRouterID(req.RouterID).
		SetVlanID(vlanID).
		SetInstanceID(req.InstanceID).
		SetServiceType(req.ServiceType).
		SetSubnet(subnet).
		SetStatus("allocated").
		Save(ctx)

	if err != nil {
		// Check if it's a unique constraint violation (race condition)
		if ent.IsConstraintError(err) {
			va.logger.Warn("vlan allocation race condition detected, retrying",
				"router_id", req.RouterID,
				"vlan_id", vlanID)
			// Let caller retry - they'll get the next available VLAN
			return nil, fmt.Errorf("vlan allocation conflict (race condition), please retry: %w", err)
		}
		return nil, fmt.Errorf("failed to allocate vlan %d: %w", vlanID, err)
	}

	// Update cache
	cacheKey := va.cacheKey(req.RouterID, vlanID)
	va.cache[cacheKey] = allocation

	va.logger.Info("vlan allocated",
		"router_id", req.RouterID,
		"instance_id", req.InstanceID,
		"service_type", req.ServiceType,
		"vlan_id", vlanID,
		"subnet", subnet)

	// Check pool utilization and emit warning event if needed
	va.checkAndEmitPoolWarningUnsafe(ctx, req.RouterID)

	return &AllocateVLANResponse{
		AllocationID: allocation.GetID(),
		VlanID:       vlanID,
		Subnet:       subnet,
	}, nil
}

// ReleaseVLAN releases a VLAN allocation.
// Updates the database status to "released" and removes it from the cache.
// Note: Router VLAN interface cleanup is handled separately in Story 8.2 Interface Factory.
func (va *VLANAllocator) ReleaseVLAN(ctx context.Context, routerID string, vlanID int) error {
	va.mu.Lock()
	defer va.mu.Unlock()

	// Find allocation in database
	allocation, err := va.store.VLANAllocation().Query().
		Where(
			vlanallocation.RouterIDEQ(routerID),
			vlanallocation.VlanIDEQ(vlanID),
			vlanallocation.StatusEQ("allocated"),
		).
		Only(ctx)

	if err != nil {
		if ent.IsNotFound(err) {
			return fmt.Errorf("%w: router=%s vlan=%d", ErrVLANNotFound, routerID, vlanID)
		}
		return fmt.Errorf("failed to query vlan allocation: %w", err)
	}

	// Update status to released
	_, err = allocation.Update().
		SetStatus("released").
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to release vlan: %w", err)
	}

	// Remove from cache
	cacheKey := va.cacheKey(routerID, vlanID)
	delete(va.cache, cacheKey)

	va.logger.Info("vlan released",
		"router_id", routerID,
		"vlan_id", vlanID,
		"instance_id", allocation.GetInstanceID())

	return nil
}

// findNextAvailableVLANUnsafe finds the next available VLAN ID from the pool.
// It checks:
// 1. In-memory cache (fast path)
// 2. Database allocations (double-check)
// 3. Router VLANs via VlanService (conflict detection)
//
// Fail-safe: If router query fails, assumes conflict and skips that VLAN.
// This prevents allocating VLANs that might conflict, even if router is temporarily unavailable.
//
// Caller must hold the write lock (mu.Lock).
func (va *VLANAllocator) findNextAvailableVLANUnsafe(ctx context.Context, routerID string) (int, error) {
	// Iterate through pool range
	for vlanID := va.poolStart; vlanID <= va.poolEnd; vlanID++ {
		// Check cache (fast path)
		cacheKey := va.cacheKey(routerID, vlanID)
		if _, exists := va.cache[cacheKey]; exists {
			continue // Already allocated in cache
		}

		// Double-check database (cache might be stale)
		exists, err := va.store.VLANAllocation().Query().
			Where(
				vlanallocation.RouterIDEQ(routerID),
				vlanallocation.VlanIDEQ(vlanID),
				vlanallocation.StatusEQ("allocated"),
			).
			Exist(ctx)

		if err != nil {
			va.logger.Error("failed to check vlan availability in database",
				"router_id", routerID,
				"vlan_id", vlanID,
				"error", err)
			continue // Skip this VLAN on error (fail-safe)
		}

		if exists {
			continue // Already allocated in database
		}

		// Skip reserved VLAN IDs 1 and 4094 per IEEE 802.1Q standard
		if vlanID == 1 || vlanID == 4094 {
			continue // Reserved VLAN ID
		}

		// Check router for conflicts using VlanService
		// Note: We check all interfaces since we don't know which interface will be used yet
		// (that's determined later in Story 8.2 Interface Factory)
		if va.isVLANConflictOnRouter(ctx, routerID, vlanID) {
			continue // Conflict detected on router, skip this VLAN
		}

		// VLAN is available
		return vlanID, nil
	}

	// Pool exhausted
	return 0, ErrPoolExhausted
}

// isVLANConflictOnRouter checks if a VLAN ID is already used on the router.
// Uses VlanService to query router VLANs. Returns true if conflict detected or query fails.
// Fail-safe: Returns true (assume conflict) if router query fails to prevent allocating conflicting VLANs.
func (va *VLANAllocator) isVLANConflictOnRouter(ctx context.Context, routerID string, vlanID int) bool {
	// Query router VLANs using composed VlanService
	vlans, err := va.vlanService.ListVlans(ctx, routerID, nil)
	if err != nil {
		// Router query failed - assume conflict (fail-safe)
		va.logger.Warn("router vlan query failed, assuming conflict (fail-safe)",
			"router_id", routerID,
			"vlan_id", vlanID,
			"error", err)
		return true
	}

	// Check if any router VLAN matches this VLAN ID
	for _, vlan := range vlans {
		if vlan == nil {
			continue // Skip nil entries
		}
		if vlan.VlanID == vlanID {
			va.logger.Debug("vlan conflict detected on router",
				"router_id", routerID,
				"vlan_id", vlanID,
				"conflicting_interface", vlan.Name)
			return true
		}
	}

	return false
}

// loadCache loads all allocated VLANs from the database into memory cache.
func (va *VLANAllocator) loadCache(ctx context.Context) error {
	allocations, err := va.store.VLANAllocation().Query().
		Where(vlanallocation.StatusEQ("allocated")).
		All(ctx)

	if err != nil {
		return fmt.Errorf("failed to query vlan allocations: %w", err)
	}

	for _, alloc := range allocations {
		cacheKey := va.cacheKey(alloc.GetRouterID(), alloc.GetVlanID())
		va.cache[cacheKey] = alloc
	}

	return nil
}

// cacheKey generates a cache key for the given router and VLAN ID.
func (va *VLANAllocator) cacheKey(routerID string, vlanID int) string {
	return fmt.Sprintf("%s:%d", routerID, vlanID)
}

// generateSubnet generates a subnet from the VLAN ID using the template 10.99.{vlan_id}.0/24.
func (va *VLANAllocator) generateSubnet(vlanID int) string {
	return fmt.Sprintf("10.99.%d.0/24", vlanID)
}
