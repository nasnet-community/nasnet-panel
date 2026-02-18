package dependencies

import (
	"context"
	"fmt"

	"backend/generated/ent/servicedependency"
)

// ComputeStartupOrder computes the startup order for service instances using Kahn's algorithm (topological sort)
// Returns layers where each layer can be started in parallel
// Layer 0 = no dependencies, Layer 1 = depends only on Layer 0, etc.
func (dm *DependencyManager) ComputeStartupOrder(ctx context.Context, instanceIDs []string) ([][]string, error) {
	dm.mu.RLock()
	defer dm.mu.RUnlock()

	if len(instanceIDs) == 0 {
		return [][]string{}, nil
	}

	// Build adjacency list and in-degree map
	adjList := make(map[string][]string)     // toID -> []fromID (reverse direction for Kahn's)
	inDegree := make(map[string]int)         // instanceID -> count of dependencies
	instanceSet := make(map[string]struct{}) // Set of all instances

	// Initialize
	for _, id := range instanceIDs {
		instanceSet[id] = struct{}{}
		inDegree[id] = 0
		adjList[id] = []string{}
	}

	// Get all dependencies for these instances
	deps, err := dm.store.ServiceDependency.Query().
		Where(servicedependency.FromInstanceIDIn(instanceIDs...)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get dependencies: %w", err)
	}

	// Build graph
	for _, dep := range deps {
		// Only consider dependencies where both instances are in our set
		_, fromExists := instanceSet[dep.FromInstanceID]
		_, toExists := instanceSet[dep.ToInstanceID]

		if fromExists && toExists {
			// fromInstance depends on toInstance
			// In Kahn's algorithm: increase in-degree of dependent (from), add to adjacency list of dependency (to)
			inDegree[dep.FromInstanceID]++
			adjList[dep.ToInstanceID] = append(adjList[dep.ToInstanceID], dep.FromInstanceID)
		}
	}

	// Kahn's algorithm - BFS-based topological sort
	var layers [][]string
	currentLayer := []string{}

	// Start with nodes that have no dependencies (in-degree = 0)
	for id := range instanceSet {
		if inDegree[id] == 0 {
			currentLayer = append(currentLayer, id)
		}
	}

	visited := 0
	for len(currentLayer) > 0 {
		layers = append(layers, currentLayer)
		visited += len(currentLayer)

		nextLayer := []string{}
		for _, id := range currentLayer {
			// For each dependent of this instance
			for _, dependentID := range adjList[id] {
				inDegree[dependentID]--
				if inDegree[dependentID] == 0 {
					nextLayer = append(nextLayer, dependentID)
				}
			}
		}
		currentLayer = nextLayer
	}

	// Check for cycles - if we didn't visit all nodes, there's a cycle
	if visited != len(instanceIDs) {
		return nil, fmt.Errorf("dependency graph contains cycles, cannot compute startup order")
	}

	return layers, nil
}

// detectCycle detects if adding a dependency from fromID to toID would create a cycle
// Uses DFS from toID to see if it can reach fromID
// Returns (hasCycle bool, cyclePath []string)
func (dm *DependencyManager) detectCycle(ctx context.Context, toID, fromID string) (hasCycle bool, cyclePath []string) {
	// If we can reach fromID starting from toID by following dependencies, we have a cycle
	visited := make(map[string]bool)
	path := []string{toID}

	return dm.dfsDetectCycle(ctx, toID, fromID, visited, path)
}

// dfsDetectCycle performs depth-first search to detect cycles
func (dm *DependencyManager) dfsDetectCycle(ctx context.Context, current, target string, visited map[string]bool, path []string) (hasCycle bool, cyclePath []string) {
	if current == target && len(path) > 1 {
		// Found cycle
		return true, append(path, target)
	}

	if visited[current] {
		return false, nil
	}

	visited[current] = true

	// Get all dependencies of current instance (services it depends on)
	deps, err := dm.store.ServiceDependency.Query().
		Where(servicedependency.FromInstanceID(current)).
		All(ctx)
	if err != nil {
		dm.logger.Error().Err(err).Str("instance_id", current).Msg("failed to get dependencies during cycle detection")
		return false, nil
	}

	// Follow each dependency
	for _, dep := range deps {
		newPath := append([]string{}, path...)
		newPath = append(newPath, dep.ToInstanceID)
		if hasCycle, cyclePath := dm.dfsDetectCycle(ctx, dep.ToInstanceID, target, visited, newPath); hasCycle {
			return true, cyclePath
		}
	}

	return false, nil
}

// DetectCycle is a public method for cycle detection (used in testing)
func (dm *DependencyManager) DetectCycle(ctx context.Context, fromID, toID string) (hasCycle bool, cyclePath []string) {
	dm.mu.RLock()
	defer dm.mu.RUnlock()

	return dm.detectCycle(ctx, toID, fromID)
}
