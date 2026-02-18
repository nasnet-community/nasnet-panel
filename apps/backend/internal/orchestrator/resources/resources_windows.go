//go:build windows

package resources

import (
	"context"
	"fmt"
	"sync"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"

	"github.com/rs/zerolog"
)

const (
	// DefaultSystemMemoryMB is the fallback total system memory (4GB)
	DefaultSystemMemoryMB = 4096

	// DefaultAvailableMemoryMB is the fallback available memory (2GB)
	DefaultAvailableMemoryMB = 2048

	// ResourceBufferPercentage is the safety buffer for resource allocation (10%)
	ResourceBufferPercentage = 0.10
)

// SystemResources represents system-wide resource availability
type SystemResources struct {
	TotalMemoryMB     int     `json:"totalMemoryMb"`
	AvailableMemoryMB int     `json:"availableMemoryMb"`
	UsedMemoryMB      int     `json:"usedMemoryMb"`
	UsagePercent      float64 `json:"usagePercent"`
	IsProcAvailable   bool    `json:"isProcAvailable"`
}

// AllocatedResources represents resources allocated to running service instances
type AllocatedResources struct {
	TotalAllocatedMB int                       `json:"totalAllocatedMb"`
	InstanceCount    int                       `json:"instanceCount"`
	Instances        []InstanceResourceSummary `json:"instances"`
}

// InstanceResourceSummary represents resource allocation for a single instance
type InstanceResourceSummary struct {
	InstanceID    string `json:"instanceId"`
	FeatureID     string `json:"featureId"`
	InstanceName  string `json:"instanceName"`
	MemoryLimitMB int    `json:"memoryLimitMb"`
	Status        string `json:"status"`
}

// ResourceAvailability represents the result of a pre-flight resource check
type ResourceAvailability struct {
	Available        bool                      `json:"available"`
	RequiredMB       int                       `json:"requiredMb"`
	AvailableMB      int                       `json:"availableMb"`
	AllocatedMB      int                       `json:"allocatedMb"`
	BufferMB         int                       `json:"bufferMb"`
	Suggestions      []ResourceSuggestion      `json:"suggestions"`
	RunningInstances []InstanceResourceSummary `json:"runningInstances"`
}

// ResourceSuggestion represents a suggestion for freeing resources
type ResourceSuggestion struct {
	Action       string `json:"action"`
	InstanceID   string `json:"instanceId"`
	InstanceName string `json:"instanceName"`
	FeatureID    string `json:"featureId"`
	MemoryMB     int    `json:"memoryMb"`
	Reason       string `json:"reason"`
}

// ResourceManagerConfig configures the ResourceManager
type ResourceManagerConfig struct {
	Store  *ent.Client
	Logger zerolog.Logger
}

// ResourceManager manages system resource detection and pre-flight checks (stub for Windows)
type ResourceManager struct {
	mu     sync.RWMutex
	store  *ent.Client
	logger zerolog.Logger
}

// NewResourceManager creates a new ResourceManager instance (stub for Windows)
func NewResourceManager(config ResourceManagerConfig) (*ResourceManager, error) {
	if config.Store == nil {
		return nil, fmt.Errorf("store is required")
	}

	rm := &ResourceManager{
		store:  config.Store,
		logger: config.Logger,
	}

	rm.logger.Warn().Msg("ResourceManager on Windows uses fallback values - /proc not available")

	return rm, nil
}

// GetSystemResources returns fallback system resources for Windows
func (rm *ResourceManager) GetSystemResources(ctx context.Context) (*SystemResources, error) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	rm.logger.Warn().
		Int("fallback_total_mb", DefaultSystemMemoryMB).
		Int("fallback_available_mb", DefaultAvailableMemoryMB).
		Msg("Using fallback values for Windows (no /proc filesystem)")

	return &SystemResources{
		TotalMemoryMB:     DefaultSystemMemoryMB,
		AvailableMemoryMB: DefaultAvailableMemoryMB,
		UsedMemoryMB:      DefaultSystemMemoryMB - DefaultAvailableMemoryMB,
		UsagePercent:      float64(DefaultSystemMemoryMB-DefaultAvailableMemoryMB) / float64(DefaultSystemMemoryMB) * 100,
		IsProcAvailable:   false,
	}, nil
}

// GetAllocatedResources queries the database for memory allocated to running instances
func (rm *ResourceManager) GetAllocatedResources(ctx context.Context) (*AllocatedResources, error) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	// Query for all running service instances
	instances, err := rm.store.ServiceInstance.
		Query().
		Where(serviceinstance.StatusEQ(serviceinstance.StatusRunning)).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to query running instances: %w", err)
	}

	var totalAllocatedMB int
	instanceSummaries := make([]InstanceResourceSummary, 0, len(instances))

	for _, inst := range instances {
		memoryLimitMB := 0
		if inst.MemoryLimit != nil {
			memoryLimitMB = int(*inst.MemoryLimit / (1024 * 1024))
		}

		totalAllocatedMB += memoryLimitMB

		instanceSummaries = append(instanceSummaries, InstanceResourceSummary{
			InstanceID:    inst.ID,
			FeatureID:     inst.FeatureID,
			InstanceName:  inst.InstanceName,
			MemoryLimitMB: memoryLimitMB,
			Status:        string(inst.Status),
		})
	}

	return &AllocatedResources{
		TotalAllocatedMB: totalAllocatedMB,
		InstanceCount:    len(instances),
		Instances:        instanceSummaries,
	}, nil
}

// CheckResourceAvailability performs a pre-flight resource check (stub for Windows)
func (rm *ResourceManager) CheckResourceAvailability(ctx context.Context, requiredMB int) (*ResourceAvailability, error) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	sysRes, err := rm.GetSystemResources(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get system resources: %w", err)
	}

	allocatedRes, err := rm.GetAllocatedResources(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get allocated resources: %w", err)
	}

	bufferMB := int(float64(sysRes.TotalMemoryMB) * ResourceBufferPercentage)
	availableAfterBufferMB := sysRes.AvailableMemoryMB - bufferMB
	isAvailable := (requiredMB + allocatedRes.TotalAllocatedMB + bufferMB) <= sysRes.AvailableMemoryMB

	result := &ResourceAvailability{
		Available:        isAvailable,
		RequiredMB:       requiredMB,
		AvailableMB:      availableAfterBufferMB,
		AllocatedMB:      allocatedRes.TotalAllocatedMB,
		BufferMB:         bufferMB,
		Suggestions:      []ResourceSuggestion{},
		RunningInstances: allocatedRes.Instances,
	}

	if !isAvailable {
		result.Suggestions = rm.generateSuggestions(requiredMB, allocatedRes)
	}

	return result, nil
}

// generateSuggestions generates suggestions for freeing resources
func (rm *ResourceManager) generateSuggestions(requiredMB int, allocated *AllocatedResources) []ResourceSuggestion {
	if len(allocated.Instances) == 0 {
		return []ResourceSuggestion{}
	}

	sortedInstances := make([]InstanceResourceSummary, len(allocated.Instances))
	copy(sortedInstances, allocated.Instances)

	for i := 0; i < len(sortedInstances); i++ {
		for j := i + 1; j < len(sortedInstances); j++ {
			if sortedInstances[j].MemoryLimitMB > sortedInstances[i].MemoryLimitMB {
				sortedInstances[i], sortedInstances[j] = sortedInstances[j], sortedInstances[i]
			}
		}
	}

	suggestions := make([]ResourceSuggestion, 0, len(sortedInstances))
	freedMB := 0

	for _, inst := range sortedInstances {
		if freedMB >= requiredMB {
			break
		}

		suggestion := ResourceSuggestion{
			Action:       "stop",
			InstanceID:   inst.InstanceID,
			InstanceName: inst.InstanceName,
			FeatureID:    inst.FeatureID,
			MemoryMB:     inst.MemoryLimitMB,
			Reason:       fmt.Sprintf("Stopping %s would free %d MB", inst.InstanceName, inst.MemoryLimitMB),
		}

		suggestions = append(suggestions, suggestion)
		freedMB += inst.MemoryLimitMB
	}

	return suggestions
}
