package orchestrator

import (
	"context"
	"fmt"
	"net"
	"path/filepath"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
)

// StartInstance starts a service instance with dependency resolution
func (im *InstanceManager) StartInstance(ctx context.Context, instanceID string) error {
	visited := make(map[string]bool)
	return im.startInstanceRecursive(ctx, instanceID, 0, visited)
}

// startInstanceRecursive starts an instance and its dependencies recursively
func (im *InstanceManager) startInstanceRecursive(ctx context.Context, instanceID string, depth int, visited map[string]bool) error {
	const maxDepth = 10

	if depth > maxDepth {
		return fmt.Errorf("dependency chain too deep (max %d)", maxDepth)
	}

	if visited[instanceID] {
		return nil
	}
	visited[instanceID] = true

	instance, err := im.config.Store.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		return fmt.Errorf("instance not found: %w", err)
	}

	if instance.Status == serviceinstance.StatusRunning {
		return nil
	}

	// Get dependencies if DependencyManager is configured
	if im.config.DependencyMgr != nil {
		deps, err := im.config.DependencyMgr.GetDependencies(ctx, instanceID)
		if err != nil {
			return fmt.Errorf("failed to get dependencies: %w", err)
		}

		for _, dep := range deps {
			if dep.AutoStart {
				im.logger.Info().
					Str("instance_id", instanceID).
					Str("dependency_id", dep.ToInstanceID).
					Msg("auto-starting dependency")

				if err := im.startInstanceRecursive(ctx, dep.ToInstanceID, depth+1, visited); err != nil {
					return fmt.Errorf("failed to auto-start dependency %s: %w", dep.ToInstanceID, err)
				}

				im.logger.Info().
					Str("instance_id", instanceID).
					Str("dependency_id", dep.ToInstanceID).
					Int("timeout_seconds", dep.HealthTimeoutSeconds).
					Msg("waiting for dependency health check")

				healthCtx, cancel := context.WithTimeout(ctx, time.Duration(dep.HealthTimeoutSeconds)*time.Second)
				defer cancel()

				if err := im.waitForInstanceHealth(healthCtx, dep.ToInstanceID); err != nil {
					return fmt.Errorf("dependency %s failed health check: %w", dep.ToInstanceID, err)
				}
			}
		}
	}

	return im.startInstanceInternal(ctx, instanceID)
}

// waitForInstanceHealth waits for an instance to become healthy
func (im *InstanceManager) waitForInstanceHealth(ctx context.Context, instanceID string) error {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("health check timeout: %w", ctx.Err())
		case <-ticker.C:
			instance, err := im.config.Store.ServiceInstance.Get(ctx, instanceID)
			if err != nil {
				return fmt.Errorf("failed to get instance: %w", err)
			}
			if instance.Status == serviceinstance.StatusRunning {
				return nil
			}
			if instance.Status == serviceinstance.StatusFailed {
				return fmt.Errorf("instance failed to start")
			}
		}
	}
}

// startInstanceInternal is the core StartInstance logic (without dependency resolution)
func (im *InstanceManager) startInstanceInternal(ctx context.Context, instanceID string) error {
	instance, err := im.config.Store.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		return fmt.Errorf("instance not found: %w", err)
	}

	currentStatus := InstanceStatus(instance.Status)
	if !im.canTransition(currentStatus, StatusStarting) {
		return fmt.Errorf("cannot start instance in %s state", currentStatus)
	}

	if err := im.updateInstanceStatus(ctx, instanceID, StatusStarting); err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}
	im.emitStateChangeEvent(ctx, instanceID, string(currentStatus), string(StatusStarting))

	manifest, err := im.config.Registry.GetManifest(instance.FeatureID)
	if err != nil {
		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		return fmt.Errorf("failed to get manifest: %w", err)
	}

	// Pre-start isolation checks (NAS-8.4)
	if err := im.runPreStartIsolationChecks(ctx, instanceID, instance); err != nil {
		return err
	}

	// Pre-flight resource availability check (NAS-8.15)
	if err := im.runPreFlightResourceCheck(ctx, instanceID, instance); err != nil {
		return err
	}

	// Create managed process
	processConfig := ProcessConfig{
		ID:            instanceID,
		Name:          instance.InstanceName,
		Command:       instance.BinaryPath,
		Args:          im.buildProcessArgs(manifest, instance),
		Env:           im.buildProcessEnv(manifest, instance),
		WorkDir:       filepath.Dir(instance.BinaryPath),
		AutoRestart:   true,
		ShutdownGrace: 10 * 1000000000, // 10 seconds in nanoseconds
		EventBus:      im.publisher,
		Logger:        im.logger.With().Str("instance_id", instanceID).Logger(),
		RouterID:      instance.RouterID,
		Ports:         instance.Ports,
	}

	process := NewManagedProcess(processConfig)

	if err := im.config.Supervisor.Add(process); err != nil {
		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStarting), string(StatusFailed))
		return fmt.Errorf("failed to add to supervisor: %w", err)
	}

	if err := im.config.Supervisor.Start(ctx, instanceID); err != nil {
		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStarting), string(StatusFailed))
		_ = im.config.Supervisor.Remove(instanceID)
		return fmt.Errorf("failed to start process: %w", err)
	}

	if err := im.updateInstanceStatus(ctx, instanceID, StatusRunning); err != nil {
		_ = im.config.Supervisor.Stop(ctx, instanceID)
		_ = im.config.Supervisor.Remove(instanceID)
		return fmt.Errorf("failed to update status to running: %w", err)
	}

	im.emitStateChangeEvent(ctx, instanceID, string(StatusStarting), string(StatusRunning))

	// Apply resource limits and start monitoring (NAS-8.4)
	im.applyResourceLimits(ctx, instanceID, instance)

	im.logger.Info().Str("instance_id", instanceID).Msg("Instance started successfully")

	// Setup virtual interface bridge (NAS-8.2)
	if err := im.setupBridgeIfNeeded(ctx, instanceID, instance, manifest); err != nil {
		return err
	}

	// Start gateway if configured and needed
	im.startGatewayIfNeeded(ctx, instanceID, instance, manifest)

	return nil
}

// runPreStartIsolationChecks runs pre-start isolation verification
func (im *InstanceManager) runPreStartIsolationChecks(ctx context.Context, instanceID string, instance *ent.ServiceInstance) error {
	if im.isolationVerifier == nil {
		return nil
	}

	im.logger.Debug().Str("instance_id", instanceID).Msg("Running pre-start isolation checks")

	report, err := im.isolationVerifier.VerifyPreStart(ctx, instance)
	if err != nil {
		im.logger.Error().Err(err).Str("instance_id", instanceID).Msg("Isolation verification failed")
		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		return fmt.Errorf("isolation verification error: %w", err)
	}

	if !report.Passed {
		errorViolations := []string{}
		for _, v := range report.Violations {
			if v.Severity == SeverityError {
				errorViolations = append(errorViolations, fmt.Sprintf("%s: %s", v.Layer, v.Description))
			}
		}

		if len(errorViolations) > 0 {
			im.logger.Error().
				Str("instance_id", instanceID).
				Strs("violations", errorViolations).
				Msg("Instance failed pre-start isolation checks")
			im.updateInstanceStatus(ctx, instanceID, StatusFailed)
			return fmt.Errorf("isolation violations detected: %v", errorViolations)
		}
	}

	im.logger.Info().
		Str("instance_id", instanceID).
		Str("bind_ip", report.BindIP).
		Int("allocated_ports", len(report.AllocatedPorts)).
		Msg("Pre-start isolation checks passed")
	return nil
}

// runPreFlightResourceCheck checks resource availability before starting
func (im *InstanceManager) runPreFlightResourceCheck(ctx context.Context, instanceID string, instance *ent.ServiceInstance) error {
	if im.resourceManager == nil || instance.MemoryLimit == nil || *instance.MemoryLimit <= 0 {
		return nil
	}

	requiredMB := int(*instance.MemoryLimit / (1024 * 1024))

	im.logger.Debug().
		Str("instance_id", instanceID).
		Int("required_mb", requiredMB).
		Msg("Checking resource availability")

	availability, err := im.resourceManager.CheckResourceAvailability(ctx, requiredMB)
	if err != nil {
		im.logger.Error().Err(err).Str("instance_id", instanceID).Msg("Failed to check resource availability")
		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		return fmt.Errorf("resource availability check error: %w", err)
	}

	if !availability.Available {
		errMsg := fmt.Sprintf("insufficient resources: required %d MB, available %d MB (after %d MB buffer)",
			availability.RequiredMB, availability.AvailableMB, availability.BufferMB)

		if len(availability.Suggestions) > 0 {
			errMsg += "\n\nSuggestions to free resources:"
			for i, suggestion := range availability.Suggestions {
				errMsg += fmt.Sprintf("\n%d. Stop %s (%s) - would free %d MB",
					i+1, suggestion.InstanceName, suggestion.FeatureID, suggestion.MemoryMB)
			}
		}

		im.logger.Warn().
			Str("instance_id", instanceID).
			Int("required_mb", requiredMB).
			Int("available_mb", availability.AvailableMB).
			Int("allocated_mb", availability.AllocatedMB).
			Msg("Insufficient resources to start instance")

		im.updateInstanceStatus(ctx, instanceID, StatusFailed)
		return fmt.Errorf("%s", errMsg)
	}

	im.logger.Info().
		Str("instance_id", instanceID).
		Int("required_mb", requiredMB).
		Int("available_mb", availability.AvailableMB).
		Int("allocated_mb", availability.AllocatedMB).
		Msg("Pre-flight resource check passed")
	return nil
}

// waitForSOCKSReady polls a SOCKS5 port until it's accepting connections
func (im *InstanceManager) waitForSOCKSReady(ctx context.Context, instance *ent.ServiceInstance, timeout time.Duration) error {
	var socksPort int
	switch p := instance.Config["socks_port"].(type) {
	case int:
		socksPort = p
	case float64:
		socksPort = int(p)
	case string:
		fmt.Sscanf(p, "%d", &socksPort)
	default:
		return nil
	}

	if socksPort <= 0 || socksPort > 65535 {
		return nil
	}

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	socksAddr := "127.0.0.1"
	if vlanIP, ok := instance.Config["vlan_ip"].(string); ok && vlanIP != "" {
		socksAddr = vlanIP
	}
	socksAddrPort := fmt.Sprintf("%s:%d", socksAddr, socksPort)

	im.logger.Debug().
		Str("instance_id", instance.ID).
		Str("socks_addr", socksAddrPort).
		Msg("waiting for SOCKS5 port to be ready")

	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("timeout waiting for SOCKS5 port %s: %w", socksAddrPort, ctx.Err())
		case <-ticker.C:
			conn, err := net.DialTimeout("tcp", socksAddrPort, 500*time.Millisecond)
			if err == nil {
				conn.Close()
				im.logger.Info().
					Str("instance_id", instance.ID).
					Str("socks_addr", socksAddrPort).
					Msg("SOCKS5 port is ready")
				return nil
			}
		}
	}
}
