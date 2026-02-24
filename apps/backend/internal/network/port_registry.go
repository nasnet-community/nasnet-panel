// Package network provides network-related utilities including port registry management.
package network

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"backend/generated/ent"
	"backend/generated/ent/portallocation"
	"backend/generated/ent/serviceinstance"
	"backend/internal/common/ulid"
)

// Instance status constant for orphan detection.
const instanceStatusDeleting = "deleting"

// PortRegistry manages port allocations for service instances across routers.
// It provides thread-safe port allocation, conflict detection, and orphan cleanup.
type PortRegistry struct {
	store  StorePort
	logger *slog.Logger
	mu     sync.RWMutex

	// In-memory cache for fast lookups: key format "routerID:port:protocol"
	cache map[string]PortAllocationEntity

	// Reserved ports that cannot be allocated
	reservedPorts map[int]bool
}

// PortRegistryConfig holds configuration for the port registry.
type PortRegistryConfig struct {
	// Store is the ent client for database operations.
	Store StorePort

	// Logger for structured logging.
	Logger *slog.Logger

	// ReservedPorts is a list of ports that cannot be allocated (e.g., SSH, HTTP, RouterOS API).
	// Defaults to [22, 53, 80, 443, 8080, 8291, 8728, 8729]
	ReservedPorts []int
}

// AllocatePortRequest contains parameters for port allocation.
type AllocatePortRequest struct {
	RouterID    string
	InstanceID  string
	ServiceType string
	Protocol    string // "TCP" or "UDP"
	Notes       string
}

// AllocatePortResponse contains the result of port allocation.
type AllocatePortResponse struct {
	AllocationID string
	Port         int
	Protocol     string
}

// serviceBasePorts maps service types to their preferred base ports.
// The auto-increment algorithm starts from these base ports.
var serviceBasePorts = map[string][]int{
	"tor":          {9050, 9151},
	"singbox":      {1080},
	"xray":         {1081},
	"mtproxy":      {8888},
	"psiphon":      {4443},
	"adguard":      {53, 3000},
	"adguard-home": {53, 3000},
}

// defaultReservedPorts are ports that should never be allocated.
var defaultReservedPorts = []int{
	22,   // SSH
	53,   // DNS
	80,   // HTTP
	443,  // HTTPS
	8080, // HTTP alternate
	8291, // MikroTik WinBox
	8728, // MikroTik RouterOS API
	8729, // MikroTik RouterOS API (SSL)
}

// NewPortRegistry creates a new port registry with the given configuration.
// It loads existing allocations from the database into memory cache.
func NewPortRegistry(cfg PortRegistryConfig) (*PortRegistry, error) {
	if cfg.Store == nil {
		return nil, fmt.Errorf("store is required")
	}

	logger := cfg.Logger
	if logger == nil {
		logger = slog.Default()
	}

	// Initialize reserved ports map
	reservedPorts := cfg.ReservedPorts
	if len(reservedPorts) == 0 {
		reservedPorts = defaultReservedPorts
	}

	reservedMap := make(map[int]bool)
	for _, port := range reservedPorts {
		reservedMap[port] = true
	}

	pr := &PortRegistry{
		store:         cfg.Store,
		logger:        logger,
		cache:         make(map[string]PortAllocationEntity),
		reservedPorts: reservedMap,
	}

	// Load cache from database
	ctx := context.Background()
	if err := pr.loadCache(ctx); err != nil {
		return nil, fmt.Errorf("failed to load port allocation cache: %w", err)
	}

	pr.logger.Info("port registry initialized",
		"cached_allocations", len(pr.cache),
		"reserved_ports", len(reservedPorts))

	return pr, nil
}

// AllocatePort allocates a port for a service instance using auto-increment algorithm.
// It starts from the service's base port and increments until an available port is found.
// The allocation is persisted to the database with a unique constraint on (router_id, port, protocol).
func (pr *PortRegistry) AllocatePort(ctx context.Context, req AllocatePortRequest) (*AllocatePortResponse, error) {
	if req.RouterID == "" || req.InstanceID == "" || req.ServiceType == "" {
		return nil, fmt.Errorf("router_id, instance_id, and service_type are required")
	}

	if req.Protocol != "TCP" && req.Protocol != "UDP" {
		return nil, fmt.Errorf("protocol must be 'TCP' or 'UDP', got '%s'", req.Protocol)
	}

	// Get base ports for this service type
	basePorts, ok := serviceBasePorts[req.ServiceType]
	if !ok {
		// Default to port 10000 if service type not found
		basePorts = []int{10000}
		pr.logger.Warn("unknown service type, using default base port",
			"service_type", req.ServiceType,
			"default_port", 10000)
	}

	// Lock for entire allocation process to prevent race conditions.
	// The lock is held from finding an available port through persisting the allocation,
	// ensuring atomicity and preventing double-allocation of the same port.
	pr.mu.Lock()
	defer pr.mu.Unlock()

	// Find next available port (must be called while holding lock).
	// No concurrent goroutine can allocate the same port since we hold the write lock.
	port, err := pr.findNextAvailablePortUnsafe(ctx, req.RouterID, req.Protocol, basePorts)
	if err != nil {
		return nil, fmt.Errorf("failed to find available port: %w", err)
	}

	// Prepare notes: pass nil if empty, otherwise pass pointer to string
	var notesPtr *string
	if req.Notes != "" {
		notesPtr = &req.Notes
	}

	allocation, err := pr.store.PortAllocation().Create().
		SetID(ulid.NewString()).
		SetRouterID(req.RouterID).
		SetPort(port).
		SetProtocol(req.Protocol).
		SetInstanceID(req.InstanceID).
		SetServiceType(req.ServiceType).
		SetNillableNotes(notesPtr).
		Save(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to allocate port %d: %w", port, err)
	}

	// Update cache
	cacheKey := pr.cacheKey(req.RouterID, port, req.Protocol)
	pr.cache[cacheKey] = allocation

	pr.logger.Info("port allocated",
		"router_id", req.RouterID,
		"instance_id", req.InstanceID,
		"service_type", req.ServiceType,
		"port", port,
		"protocol", req.Protocol)

	return &AllocatePortResponse{
		AllocationID: allocation.GetID(),
		Port:         port,
		Protocol:     req.Protocol,
	}, nil
}

// findNextAvailablePortUnsafe finds the next available port starting from base ports.
// It queries the database for the maximum allocated port and increments from there.
// Caller must hold the write lock (mu.Lock).
func (pr *PortRegistry) findNextAvailablePortUnsafe(ctx context.Context, routerID, protocol string, basePorts []int) (int, error) {
	// Try base ports first
	for _, basePort := range basePorts {
		if pr.isReserved(basePort) {
			continue
		}
		if pr.isPortAvailableUnsafe(ctx, routerID, basePort, protocol) {
			return basePort, nil
		}
	}

	// Find the maximum allocated port for this router + protocol
	maxPort, err := pr.store.PortAllocation().Query().
		Where(
			portallocation.RouterIDEQ(routerID),
			portallocation.ProtocolEQ(portallocation.Protocol(protocol)),
		).
		Aggregate(ent.Max(portallocation.FieldPort)).
		Int(ctx)

	if err != nil {
		// No allocations found, start from first base port
		if ent.IsNotFound(err) {
			startPort := basePorts[0]
			if pr.isReserved(startPort) {
				startPort = 10000
			}
			return startPort, nil
		}
		return 0, fmt.Errorf("failed to query max port: %w", err)
	}

	// Increment from max port
	nextPort := maxPort + 1
	maxIterations := 100
	for i := 0; i < maxIterations; i++ {
		if nextPort > 65535 {
			return 0, fmt.Errorf("no available ports (exceeded 65535)")
		}

		if !pr.isReserved(nextPort) && pr.isPortAvailableUnsafe(ctx, routerID, nextPort, protocol) {
			return nextPort, nil
		}

		nextPort++
	}

	return 0, fmt.Errorf("failed to find available port after %d iterations", maxIterations)
}

// IsPortAvailable checks if a port is available for allocation on a router.
// It checks the in-memory cache, database, and reserved ports list.
func (pr *PortRegistry) IsPortAvailable(ctx context.Context, routerID string, port int, protocol string) bool {
	// Validate port range (1-65535)
	if port < 1 || port > 65535 {
		return false
	}

	pr.mu.RLock()
	defer pr.mu.RUnlock()

	return pr.isPortAvailableUnsafe(ctx, routerID, port, protocol)
}

// isPortAvailableUnsafe is the internal implementation without locking.
// Caller must hold at least RLock.
func (pr *PortRegistry) isPortAvailableUnsafe(ctx context.Context, routerID string, port int, protocol string) bool {
	// Check reserved ports
	if pr.isReserved(port) {
		return false
	}

	// Check cache first
	cacheKey := pr.cacheKey(routerID, port, protocol)
	if _, exists := pr.cache[cacheKey]; exists {
		return false
	}

	// Double-check database (cache might be stale)
	exists, err := pr.store.PortAllocation().Query().
		Where(
			portallocation.RouterIDEQ(routerID),
			portallocation.PortEQ(port),
			portallocation.ProtocolEQ(portallocation.Protocol(protocol)),
		).
		Exist(ctx)

	if err != nil {
		pr.logger.Error("failed to check port availability in database",
			"router_id", routerID,
			"port", port,
			"protocol", protocol,
			"error", err)
		return false
	}

	return !exists
}

// ReleasePort releases a port allocation and removes it from cache.
func (pr *PortRegistry) ReleasePort(ctx context.Context, routerID string, port int, protocol string) error {
	pr.mu.Lock()
	defer pr.mu.Unlock()

	// Delete from database
	deleted, err := pr.store.PortAllocation().Delete().
		Where(
			portallocation.RouterIDEQ(routerID),
			portallocation.PortEQ(port),
			portallocation.ProtocolEQ(portallocation.Protocol(protocol)),
		).
		Exec(ctx)

	if err != nil {
		return fmt.Errorf("failed to release port: %w", err)
	}

	if deleted == 0 {
		return fmt.Errorf("port allocation not found: %s:%d/%s", routerID, port, protocol)
	}

	// Remove from cache
	cacheKey := pr.cacheKey(routerID, port, protocol)
	delete(pr.cache, cacheKey)

	pr.logger.Info("port released",
		"router_id", routerID,
		"port", port,
		"protocol", protocol)

	return nil
}

// DetectOrphans finds port allocations that reference missing or deleting service instances.
func (pr *PortRegistry) DetectOrphans(ctx context.Context, routerID string) ([]PortAllocationEntity, error) {
	pr.mu.RLock()
	defer pr.mu.RUnlock()

	// Get all allocations for this router
	allocations, err := pr.store.PortAllocation().Query().
		Where(portallocation.RouterIDEQ(routerID)).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to query allocations: %w", err)
	}

	var orphans []PortAllocationEntity

	for _, alloc := range allocations {
		// Check if instance exists and is not being deleted
		instance, err := pr.store.ServiceInstance().Query().
			Where(serviceinstance.IDEQ(alloc.GetInstanceID())).
			Only(ctx)

		if err != nil {
			if ent.IsNotFound(err) {
				// Instance doesn't exist - this is an orphan
				orphans = append(orphans, alloc)
				continue
			}
			pr.logger.Error("failed to query service instance",
				"instance_id", alloc.GetInstanceID(),
				"error", err)
			continue
		}

		// Check if instance is in "deleting" status
		if instance.GetStatus() == instanceStatusDeleting {
			orphans = append(orphans, alloc)
		}
	}

	if len(orphans) > 0 {
		pr.logger.Info("detected orphaned port allocations",
			"router_id", routerID,
			"count", len(orphans))
	}

	return orphans, nil
}

// CleanupOrphans removes orphaned port allocations from database and cache.
func (pr *PortRegistry) CleanupOrphans(ctx context.Context, routerID string) (int, error) {
	orphans, err := pr.DetectOrphans(ctx, routerID)
	if err != nil {
		return 0, fmt.Errorf("failed to detect orphans: %w", err)
	}

	if len(orphans) == 0 {
		return 0, nil
	}

	pr.mu.Lock()
	defer pr.mu.Unlock()

	var cleanedCount int

	for _, alloc := range orphans {
		// Delete from database
		_, err := pr.store.PortAllocation().DeleteOne(alloc).Exec(ctx)
		if err != nil {
			pr.logger.Error("failed to delete orphaned allocation",
				"allocation_id", alloc.GetID(),
				"router_id", alloc.GetRouterID(),
				"port", alloc.GetPort(),
				"error", err)
			continue
		}

		// Remove from cache
		cacheKey := pr.cacheKey(alloc.GetRouterID(), alloc.GetPort(), alloc.GetProtocol())
		delete(pr.cache, cacheKey)

		cleanedCount++
	}

	pr.logger.Info("cleaned up orphaned port allocations",
		"router_id", routerID,
		"cleaned_count", cleanedCount)

	return cleanedCount, nil
}

// loadCache loads all port allocations from the database into memory cache.
func (pr *PortRegistry) loadCache(ctx context.Context) error {
	allocations, err := pr.store.PortAllocation().Query().All(ctx)
	if err != nil {
		return fmt.Errorf("failed to query port allocations: %w", err)
	}

	for _, alloc := range allocations {
		cacheKey := pr.cacheKey(alloc.GetRouterID(), alloc.GetPort(), alloc.GetProtocol())
		pr.cache[cacheKey] = alloc
	}

	return nil
}

// isReserved checks if a port is in the reserved ports list.
func (pr *PortRegistry) isReserved(port int) bool {
	return pr.reservedPorts[port]
}

// cacheKey generates a cache key for the given router, port, and protocol.
func (pr *PortRegistry) cacheKey(routerID string, port int, protocol string) string {
	return fmt.Sprintf("%s:%d:%s", routerID, port, protocol)
}

// GetAllocationsByRouter returns all port allocations for a given router.
func (pr *PortRegistry) GetAllocationsByRouter(ctx context.Context, routerID string) ([]PortAllocationEntity, error) {
	pr.mu.RLock()
	defer pr.mu.RUnlock()

	return pr.store.PortAllocation().Query().
		Where(portallocation.RouterIDEQ(routerID)).
		All(ctx)
}

// GetAllocationsByInstance returns all port allocations for a given service instance.
func (pr *PortRegistry) GetAllocationsByInstance(ctx context.Context, instanceID string) ([]PortAllocationEntity, error) {
	pr.mu.RLock()
	defer pr.mu.RUnlock()

	return pr.store.PortAllocation().Query().
		Where(portallocation.InstanceIDEQ(instanceID)).
		All(ctx)
}
