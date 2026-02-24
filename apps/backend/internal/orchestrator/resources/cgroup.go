package resources

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"go.uber.org/zap"
)

const (
	cgroupV2BasePath     = "/sys/fs/cgroup"
	cgroupControllerFile = "cgroup.controllers"
	cgroupProcsFile      = "cgroup.procs"
	cgroupMemoryHighFile = "memory.high"
	cgroupMemoryMaxFile  = "memory.max"
	cgroupCPUWeightFile  = "cpu.weight"
	cgroupPrefix         = "nnc-"

	// CPU weight range: 1-10000 (cgroups v2)
	// We map service priority 1-100 to cgroup weight 1-10000
	minCPUWeight = 1
	maxCPUWeight = 10000
)

// CgroupManager manages cgroups v2 for resource limiting
type CgroupManager struct {
	logger    *zap.SugaredLogger
	available bool
	basePath  string
}

// NewCgroupManager creates a new cgroups v2 manager
func NewCgroupManager(logger *zap.SugaredLogger) *CgroupManager {
	mgr := &CgroupManager{
		logger:   logger,
		basePath: cgroupV2BasePath,
	}
	mgr.available = mgr.detectCgroupV2()

	if mgr.available {
		logger.Info("cgroups v2 detected and available")
	} else {
		logger.Warn("cgroups v2 not available, resource limits will not be enforced")
	}

	return mgr
}

// IsAvailable returns whether cgroups v2 is available on this system
func (cm *CgroupManager) IsAvailable() bool {
	return cm.available
}

// detectCgroupV2 checks if cgroups v2 is available on the system
func (cm *CgroupManager) detectCgroupV2() bool {
	// Check if the cgroup.controllers file exists at the base path
	controllerPath := filepath.Join(cm.basePath, cgroupControllerFile)
	if _, err := os.Stat(controllerPath); err != nil {
		cm.logger.Debugw("cgroups v2 not detected", "path", controllerPath, "error", err)
		return false
	}

	// Verify we can read the controllers
	data, err := os.ReadFile(controllerPath)
	if err != nil {
		cm.logger.Debugw("cannot read cgroup controllers", "path", controllerPath, "error", err)
		return false
	}

	controllers := strings.Fields(string(data))
	cm.logger.Debugw("detected cgroup v2 controllers", "controllers", controllers)

	// Check for required controllers (memory and cpu)
	hasMemory := false
	hasCPU := false
	for _, ctrl := range controllers {
		if ctrl == "memory" {
			hasMemory = true
		}
		if ctrl == "cpu" {
			hasCPU = true
		}
	}

	if !hasMemory || !hasCPU {
		cm.logger.Warnw("required cgroup controllers not available", "has_memory", hasMemory, "has_cpu", hasCPU)
		return false
	}

	return true
}

// CreateCgroup creates a new cgroup for a service instance
func (cm *CgroupManager) CreateCgroup(instanceID string) error {
	if !cm.available {
		// Graceful degradation - no-op if cgroups not available
		return nil
	}

	cgroupPath := cm.getCgroupPath(instanceID)

	// Create the cgroup directory
	if err := os.MkdirAll(cgroupPath, 0o755); err != nil {
		return fmt.Errorf("failed to create cgroup directory: %w", err)
	}

	cm.logger.Debugw("created cgroup", "instance_id", instanceID, "path", cgroupPath)

	return nil
}

// SetMemoryLimits sets memory limits for a cgroup
// softLimitMB is the soft limit (memory.high) - throttling starts here
// hardLimitMB is the hard limit (memory.max) - OOM kill happens here
func (cm *CgroupManager) SetMemoryLimits(instanceID string, softLimitMB, hardLimitMB int) error {
	if !cm.available {
		// Graceful degradation - no-op if cgroups not available
		return nil
	}

	cgroupPath := cm.getCgroupPath(instanceID)

	// Set memory.high (soft limit - 80% of hard limit recommended)
	if softLimitMB > 0 {
		softLimitBytes := softLimitMB * 1024 * 1024
		highPath := filepath.Join(cgroupPath, cgroupMemoryHighFile)
		if err := os.WriteFile(highPath, []byte(strconv.Itoa(softLimitBytes)), 0o644); err != nil {
			return fmt.Errorf("failed to set memory.high: %w", err)
		}

		cm.logger.Debugw("set memory soft limit", "instance_id", instanceID, "soft_limit_mb", softLimitMB)
	}

	// Set memory.max (hard limit)
	if hardLimitMB > 0 {
		hardLimitBytes := hardLimitMB * 1024 * 1024
		maxPath := filepath.Join(cgroupPath, cgroupMemoryMaxFile)
		if err := os.WriteFile(maxPath, []byte(strconv.Itoa(hardLimitBytes)), 0o644); err != nil {
			return fmt.Errorf("failed to set memory.max: %w", err)
		}

		cm.logger.Debugw("set memory hard limit", "instance_id", instanceID, "hard_limit_mb", hardLimitMB)
	}

	return nil
}

// SetCPUWeight sets the CPU weight (priority) for a cgroup
// priority is a value from 1-100 which gets mapped to cgroup weight 1-10000
func (cm *CgroupManager) SetCPUWeight(instanceID string, priority int) error {
	if !cm.available {
		// Graceful degradation - no-op if cgroups not available
		return nil
	}

	// Validate priority range
	if priority < 1 {
		priority = 1
	}
	if priority > 100 {
		priority = 100
	}

	// Map priority 1-100 to weight 1-10000
	// Linear mapping: weight = (priority * (maxWeight - minWeight) / 100) + minWeight
	weight := ((priority * (maxCPUWeight - minCPUWeight)) / 100) + minCPUWeight

	cgroupPath := cm.getCgroupPath(instanceID)
	weightPath := filepath.Join(cgroupPath, cgroupCPUWeightFile)

	if err := os.WriteFile(weightPath, []byte(strconv.Itoa(weight)), 0o644); err != nil {
		return fmt.Errorf("failed to set cpu.weight: %w", err)
	}

	cm.logger.Debugw("set CPU weight", "instance_id", instanceID, "priority", priority, "weight", weight)

	return nil
}

// AssignProcess assigns a process (by PID) to a cgroup
func (cm *CgroupManager) AssignProcess(instanceID string, pid int) error {
	if !cm.available {
		// Graceful degradation - no-op if cgroups not available
		return nil
	}

	cgroupPath := cm.getCgroupPath(instanceID)
	procsPath := filepath.Join(cgroupPath, cgroupProcsFile)

	// Write the PID to cgroup.procs
	if err := os.WriteFile(procsPath, []byte(strconv.Itoa(pid)), 0o644); err != nil {
		return fmt.Errorf("failed to assign process to cgroup: %w", err)
	}

	cm.logger.Infow("assigned process to cgroup", "instance_id", instanceID, "pid", pid, "cgroup", cgroupPath)

	return nil
}

// RemoveCgroup removes a cgroup (cleanup)
func (cm *CgroupManager) RemoveCgroup(instanceID string) error {
	if !cm.available {
		// Graceful degradation - no-op if cgroups not available
		return nil
	}

	cgroupPath := cm.getCgroupPath(instanceID)

	// Remove the cgroup directory
	// Note: The directory must be empty (no processes) before it can be removed
	if err := os.Remove(cgroupPath); err != nil {
		// It's okay if the directory doesn't exist
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("failed to remove cgroup: %w", err)
	}

	cm.logger.Debugw("removed cgroup", "instance_id", instanceID, "path", cgroupPath)

	return nil
}

// getCgroupPath returns the full path to a cgroup for an instance
func (cm *CgroupManager) getCgroupPath(instanceID string) string {
	return filepath.Join(cm.basePath, cgroupPrefix+instanceID)
}
