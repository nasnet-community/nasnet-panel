package dependencies

import (
	"context"
	"fmt"
	"sync"

	"backend/generated/ent"
	"backend/generated/ent/servicedependency"
	"backend/generated/ent/serviceinstance"

	"backend/internal/events"

	"github.com/oklog/ulid/v2"
	"github.com/rs/zerolog"
)

// DependencyManagerConfig holds configuration for the dependency manager
type DependencyManagerConfig struct {
	Store    *ent.Client
	EventBus events.EventBus
	Logger   zerolog.Logger
}

// DependencyManager manages service instance dependencies
type DependencyManager struct {
	mu        sync.RWMutex
	store     *ent.Client
	eventBus  events.EventBus
	publisher *events.Publisher
	logger    zerolog.Logger
}

// DependencyInfo represents a dependency relationship
type DependencyInfo struct {
	ID                   string
	FromInstanceID       string
	ToInstanceID         string
	DependencyType       string
	AutoStart            bool
	HealthTimeoutSeconds int
}

// DependencyGraph represents the full dependency graph for visualization
type DependencyGraph struct {
	Nodes []GraphNode
	Edges []GraphEdge
}

// GraphNode represents a service instance node in the dependency graph
type GraphNode struct {
	InstanceID   string
	InstanceName string
	FeatureID    string
	Status       string
}

// GraphEdge represents a dependency edge in the graph
type GraphEdge struct {
	FromInstanceID       string
	ToInstanceID         string
	DependencyType       string
	AutoStart            bool
	HealthTimeoutSeconds int
}

// NewDependencyManager creates a new dependency manager
func NewDependencyManager(cfg DependencyManagerConfig) (*DependencyManager, error) {
	if cfg.Store == nil {
		return nil, fmt.Errorf("ent store is required")
	}
	if cfg.EventBus == nil {
		return nil, fmt.Errorf("event bus is required")
	}

	dm := &DependencyManager{
		store:    cfg.Store,
		eventBus: cfg.EventBus,
		logger:   cfg.Logger,
	}

	// Create event publisher if event bus is provided
	if cfg.EventBus != nil {
		dm.publisher = events.NewPublisher(cfg.EventBus, "dependency-manager")
	}

	return dm, nil
}

// AddDependency adds a new dependency relationship between service instances
// Pre-validates that the relationship won't create a cycle
func (dm *DependencyManager) AddDependency(ctx context.Context, fromInstanceID, toInstanceID, dependencyType string, autoStart bool, healthTimeoutSeconds int) (string, error) {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	// Validate instances exist
	fromExists, err := dm.store.ServiceInstance.Query().Where(serviceinstance.ID(fromInstanceID)).Exist(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to check from_instance existence: %w", err)
	}
	if !fromExists {
		return "", fmt.Errorf("from_instance %s does not exist", fromInstanceID)
	}

	toExists, err := dm.store.ServiceInstance.Query().Where(serviceinstance.ID(toInstanceID)).Exist(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to check to_instance existence: %w", err)
	}
	if !toExists {
		return "", fmt.Errorf("to_instance %s does not exist", toInstanceID)
	}

	// Prevent self-dependency
	if fromInstanceID == toInstanceID {
		return "", fmt.Errorf("service instance cannot depend on itself")
	}

	// Check for cycle before adding
	hasCycle, cyclePath := dm.detectCycle(ctx, toInstanceID, fromInstanceID)
	if hasCycle {
		return "", fmt.Errorf("adding this dependency would create a cycle: %v", cyclePath)
	}

	// Check if dependency already exists
	exists, err := dm.store.ServiceDependency.Query().
		Where(
			servicedependency.FromInstanceID(fromInstanceID),
			servicedependency.ToInstanceID(toInstanceID),
		).
		Exist(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to check dependency existence: %w", err)
	}
	if exists {
		return "", fmt.Errorf("dependency from %s to %s already exists", fromInstanceID, toInstanceID)
	}

	// Create dependency
	id := ulid.Make().String()
	dep, err := dm.store.ServiceDependency.Create().
		SetID(id).
		SetFromInstanceID(fromInstanceID).
		SetToInstanceID(toInstanceID).
		SetDependencyType(servicedependency.DependencyType(dependencyType)).
		SetAutoStart(autoStart).
		SetHealthTimeoutSeconds(healthTimeoutSeconds).
		Save(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to create dependency: %w", err)
	}

	// Publish event
	if dm.publisher != nil {
		_ = dm.publisher.PublishDependencyAdded(ctx, fromInstanceID, toInstanceID, dependencyType) //nolint:errcheck // event publication is best-effort, dependency was already created
	}

	dm.logger.Info().
		Str("dependency_id", dep.ID).
		Str("from_instance", fromInstanceID).
		Str("to_instance", toInstanceID).
		Str("type", dependencyType).
		Msg("dependency added")

	return dep.ID, nil
}

// RemoveDependency removes a dependency relationship
func (dm *DependencyManager) RemoveDependency(ctx context.Context, dependencyID string) error {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	// Get dependency details for event
	dep, err := dm.store.ServiceDependency.Get(ctx, dependencyID)
	if err != nil {
		return fmt.Errorf("failed to get dependency: %w", err)
	}

	// Delete dependency
	if err := dm.store.ServiceDependency.DeleteOneID(dependencyID).Exec(ctx); err != nil {
		return fmt.Errorf("failed to delete dependency: %w", err)
	}

	// Publish event
	if dm.publisher != nil {
		_ = dm.publisher.PublishDependencyRemoved(ctx, dep.FromInstanceID, dep.ToInstanceID) //nolint:errcheck // event publication is best-effort, dependency was already deleted
	}

	dm.logger.Info().
		Str("dependency_id", dependencyID).
		Str("from_instance", dep.FromInstanceID).
		Str("to_instance", dep.ToInstanceID).
		Msg("dependency removed")

	return nil
}

// GetDependencies returns all dependencies of a service instance (services it depends on)
func (dm *DependencyManager) GetDependencies(ctx context.Context, instanceID string) ([]*ent.ServiceDependency, error) {
	dm.mu.RLock()
	defer dm.mu.RUnlock()

	deps, err := dm.store.ServiceDependency.Query().
		Where(servicedependency.FromInstanceID(instanceID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get dependencies: %w", err)
	}

	return deps, nil
}

// GetDependents returns all dependents of a service instance (services that depend on it)
func (dm *DependencyManager) GetDependents(ctx context.Context, instanceID string) ([]*ent.ServiceDependency, error) {
	dm.mu.RLock()
	defer dm.mu.RUnlock()

	deps, err := dm.store.ServiceDependency.Query().
		Where(servicedependency.ToInstanceID(instanceID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get dependents: %w", err)
	}

	return deps, nil
}

// GetFullGraph returns the complete dependency graph for visualization
func (dm *DependencyManager) GetFullGraph(ctx context.Context, routerID string) (*DependencyGraph, error) {
	dm.mu.RLock()
	defer dm.mu.RUnlock()

	// Get all service instances for this router
	instances, err := dm.store.ServiceInstance.Query().
		Where(serviceinstance.RouterID(routerID)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get instances: %w", err)
	}

	// Build node map
	nodes := make([]GraphNode, 0, len(instances))
	instanceMap := make(map[string]*ent.ServiceInstance)
	for _, inst := range instances {
		nodes = append(nodes, GraphNode{
			InstanceID:   inst.ID,
			InstanceName: inst.InstanceName,
			FeatureID:    inst.FeatureID,
			Status:       string(inst.Status),
		})
		instanceMap[inst.ID] = inst
	}

	// Get all dependencies for these instances
	instanceIDs := make([]string, 0, len(instances))
	for _, inst := range instances {
		instanceIDs = append(instanceIDs, inst.ID)
	}

	deps, err := dm.store.ServiceDependency.Query().
		Where(servicedependency.FromInstanceIDIn(instanceIDs...)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get dependencies: %w", err)
	}

	// Build edges
	edges := make([]GraphEdge, 0, len(deps))
	for _, dep := range deps {
		// Only include edges where both nodes exist in this router
		if _, ok := instanceMap[dep.FromInstanceID]; ok {
			if _, ok := instanceMap[dep.ToInstanceID]; ok {
				edges = append(edges, GraphEdge{
					FromInstanceID:       dep.FromInstanceID,
					ToInstanceID:         dep.ToInstanceID,
					DependencyType:       string(dep.DependencyType),
					AutoStart:            dep.AutoStart,
					HealthTimeoutSeconds: dep.HealthTimeoutSeconds,
				})
			}
		}
	}

	return &DependencyGraph{
		Nodes: nodes,
		Edges: edges,
	}, nil
}

// CleanupForInstance removes all dependency relationships for a service instance
// Called during instance deletion to maintain referential integrity
func (dm *DependencyManager) CleanupForInstance(ctx context.Context, instanceID string) error {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	// Delete all dependencies where this instance is the dependent (from)
	fromCount, err := dm.store.ServiceDependency.Delete().
		Where(servicedependency.FromInstanceID(instanceID)).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete from-dependencies: %w", err)
	}

	// Delete all dependencies where this instance is the dependency (to)
	toCount, err := dm.store.ServiceDependency.Delete().
		Where(servicedependency.ToInstanceID(instanceID)).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete to-dependencies: %w", err)
	}

	dm.logger.Info().
		Str("instance_id", instanceID).
		Int("from_dependencies", fromCount).
		Int("to_dependencies", toCount).
		Msg("cleaned up dependencies for instance")

	return nil
}
