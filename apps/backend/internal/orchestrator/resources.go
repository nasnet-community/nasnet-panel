//go:build linux

package orchestrator

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"

	"github.com/rs/zerolog"
)

const (
	// DefaultSystemMemoryMB is the fallback total system memory if /proc is unavailable (1GB)
	DefaultSystemMemoryMB = 1024

	// DefaultAvailableMemoryMB is the fallback available memory if /proc is unavailable (512MB)
	DefaultAvailableMemoryMB = 512

	// ResourceBufferPercentage is the safety buffer for resource allocation (10%)
	ResourceBufferPercentage = 0.10

	// ProcMemInfoPath is the path to /proc/meminfo
	ProcMemInfoPath = "/proc/meminfo"
)

// SystemResources represents system-wide resource availability
type SystemResources struct {
	TotalMemoryMB     int     `json:"totalMemoryMb"`     // Total system memory in MB
	AvailableMemoryMB int     `json:"availableMemoryMb"` // Available system memory in MB
	UsedMemoryMB      int     `json:"usedMemoryMb"`      // Used system memory in MB
	UsagePercent      float64 `json:"usagePercent"`      // Memory usage percentage
	IsProcAvailable   bool    `json:"isProcAvailable"`   // Whether /proc filesystem is available
}

// AllocatedResources represents resources allocated to running service instances
type AllocatedResources struct {
	TotalAllocatedMB int                       `json:"totalAllocatedMb"` // Total memory allocated to all running instances
	InstanceCount    int                       `json:"instanceCount"`    // Number of running instances
	Instances        []InstanceResourceSummary `json:"instances"`        // Per-instance resource allocation
}

// InstanceResourceSummary represents resource allocation for a single instance
type InstanceResourceSummary struct {
	InstanceID    string `json:"instanceId"`
	FeatureID     string `json:"featureId"`
	InstanceName  string `json:"instanceName"`
	MemoryLimitMB int    `json:"memoryLimitMb"` // Memory limit in MB
	Status        string `json:"status"`
}

// ResourceAvailability represents the result of a pre-flight resource check
type ResourceAvailability struct {
	Available         bool                       `json:"available"`         // Whether resources are available
	RequiredMB        int                        `json:"requiredMb"`        // Requested memory in MB
	AvailableMB       int                        `json:"availableMb"`       // Available memory after buffer
	AllocatedMB       int                        `json:"allocatedMb"`       // Currently allocated memory
	BufferMB          int                        `json:"bufferMb"`          // Safety buffer in MB
	Suggestions       []ResourceSuggestion       `json:"suggestions"`       // Suggestions if resources unavailable
	RunningInstances  []InstanceResourceSummary  `json:"runningInstances"`  // Currently running instances
}

// ResourceSuggestion represents a suggestion for freeing resources
type ResourceSuggestion struct {
	Action       string `json:"action"`       // "stop" or "reduce_limit"
	InstanceID   string `json:"instanceId"`
	InstanceName string `json:"instanceName"`
	FeatureID    string `json:"featureId"`
	MemoryMB     int    `json:"memoryMb"`     // Memory that would be freed
	Reason       string `json:"reason"`       // Human-readable reason
}

// ResourceManagerConfig configures the ResourceManager
type ResourceManagerConfig struct {
	Store  *ent.Client
	Logger zerolog.Logger
}

// ResourceManager manages system resource detection and pre-flight checks
type ResourceManager struct {
	mu     sync.RWMutex
	store  *ent.Client
	logger zerolog.Logger
}

// NewResourceManager creates a new ResourceManager instance
func NewResourceManager(config ResourceManagerConfig) (*ResourceManager, error) {
	if config.Store == nil {
		return nil, fmt.Errorf("Store is required")
	}

	rm := &ResourceManager{
		store:  config.Store,
		logger: config.Logger,
	}

	return rm, nil
}

// GetSystemResources reads system memory information from /proc/meminfo
// Falls back to safe defaults if /proc is unavailable
func (rm *ResourceManager) GetSystemResources(ctx context.Context) (*SystemResources, error) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	// Try to read from /proc/meminfo
	totalMB, availableMB, err := rm.readMemInfo()
	if err != nil {
		rm.logger.Warn().
			Err(err).
			Int("fallback_total_mb", DefaultSystemMemoryMB).
			Int("fallback_available_mb", DefaultAvailableMemoryMB).
			Msg("Failed to read /proc/meminfo, using fallback values")

		return &SystemResources{
			TotalMemoryMB:     DefaultSystemMemoryMB,
			AvailableMemoryMB: DefaultAvailableMemoryMB,
			UsedMemoryMB:      DefaultSystemMemoryMB - DefaultAvailableMemoryMB,
			UsagePercent:      float64(DefaultSystemMemoryMB-DefaultAvailableMemoryMB) / float64(DefaultSystemMemoryMB) * 100,
			IsProcAvailable:   false,
		}, nil
	}

	usedMB := totalMB - availableMB
	usagePercent := float64(usedMB) / float64(totalMB) * 100

	return &SystemResources{
		TotalMemoryMB:     totalMB,
		AvailableMemoryMB: availableMB,
		UsedMemoryMB:      usedMB,
		UsagePercent:      usagePercent,
		IsProcAvailable:   true,
	}, nil
}

// readMemInfo parses /proc/meminfo to extract MemTotal and MemAvailable
func (rm *ResourceManager) readMemInfo() (totalMB int, availableMB int, err error) {
	file, err := os.Open(ProcMemInfoPath)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to open %s: %w", ProcMemInfoPath, err)
	}
	defer file.Close()

	var memTotalKB, memAvailableKB int64
	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		line := scanner.Text()
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}

		switch fields[0] {
		case "MemTotal:":
			if val, err := strconv.ParseInt(fields[1], 10, 64); err == nil {
				memTotalKB = val
			}
		case "MemAvailable:":
			if val, err := strconv.ParseInt(fields[1], 10, 64); err == nil {
				memAvailableKB = val
			}
		}

		// Break early if we have both values
		if memTotalKB > 0 && memAvailableKB > 0 {
			break
		}
	}

	if err := scanner.Err(); err != nil {
		return 0, 0, fmt.Errorf("error reading %s: %w", ProcMemInfoPath, err)
	}

	if memTotalKB == 0 {
		return 0, 0, fmt.Errorf("MemTotal not found in %s", ProcMemInfoPath)
	}

	if memAvailableKB == 0 {
		return 0, 0, fmt.Errorf("MemAvailable not found in %s", ProcMemInfoPath)
	}

	// Convert from KB to MB
	totalMB = int(memTotalKB / 1024)
	availableMB = int(memAvailableKB / 1024)

	return totalMB, availableMB, nil
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
		// memory_limit is stored in bytes, convert to MB
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

// CheckResourceAvailability performs a pre-flight resource check
// Returns whether the requested resources are available and suggestions if not
func (rm *ResourceManager) CheckResourceAvailability(ctx context.Context, requiredMB int) (*ResourceAvailability, error) {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	// Get system resources
	sysRes, err := rm.GetSystemResources(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get system resources: %w", err)
	}

	// Get allocated resources
	allocatedRes, err := rm.GetAllocatedResources(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get allocated resources: %w", err)
	}

	// Calculate buffer (10% of total memory)
	bufferMB := int(float64(sysRes.TotalMemoryMB) * ResourceBufferPercentage)

	// Calculate available memory after buffer
	availableAfterBufferMB := sysRes.AvailableMemoryMB - bufferMB

	// Check if resources are available
	// Formula: required + allocated + buffer <= total available
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

	// If not available, generate suggestions
	if !isAvailable {
		result.Suggestions = rm.generateSuggestions(requiredMB, allocatedRes)
	}

	return result, nil
}

// generateSuggestions generates suggestions for freeing resources
// Instances are ranked by memory usage (highest first) as stopping high-memory
// services frees more resources with fewer disruptions
func (rm *ResourceManager) generateSuggestions(requiredMB int, allocated *AllocatedResources) []ResourceSuggestion {
	if len(allocated.Instances) == 0 {
		return []ResourceSuggestion{}
	}

	// Create a copy of instances and sort by memory descending (bubble sort for simplicity)
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
