package lifecycle

import (
	"context"
	"fmt"
	"net"
	"path/filepath"
	"strconv"
	"time"

	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/generated/ent/serviceinstance"
	isolationpkg "backend/internal/isolation"
	"backend/internal/orchestrator/isolation"
	"backend/internal/orchestrator/supervisor"
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
	if im.config.DependencyMgr != nil { //nolint:nestif // startup dependency check
		deps, err := im.config.DependencyMgr.GetDependencies(ctx, instanceID)
		if err != nil {
			return fmt.Errorf("failed to get dependencies: %w", err)
		}

		for _, dep := range deps {
			if !dep.AutoStart {
				continue
			}
			im.logger.Info("auto-starting dependency",
				zap.String("instance_id", instanceID),
				zap.String("dependency_id", dep.ToInstanceID))

			if err := im.startInstanceRecursive(ctx, dep.ToInstanceID, depth+1, visited); err != nil {
				return fmt.Errorf("failed to auto-start dependency %s: %w", dep.ToInstanceID, err)
			}

			im.logger.Info("waiting for dependency health check",
				zap.String("instance_id", instanceID),
				zap.String("dependency_id", dep.ToInstanceID),
				zap.Int("timeout_seconds", dep.HealthTimeoutSeconds))

			healthCtx, cancel := context.WithTimeout(ctx, time.Duration(dep.HealthTimeoutSeconds)*time.Second)
			defer cancel() //nolint:gocritic // intentional per-iteration cleanup

			if err := im.waitForInstanceHealth(healthCtx, dep.ToInstanceID); err != nil {
				return fmt.Errorf("dependency %s failed health check: %w", dep.ToInstanceID, err)
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

	if startErr := im.updateInstanceStatus(ctx, instanceID, StatusStarting); startErr != nil {
		return fmt.Errorf("failed to update status: %w", startErr)
	}
	im.emitStateChangeEvent(ctx, instanceID, string(currentStatus), string(StatusStarting))

	manifest, err := im.config.Registry.GetManifest(instance.FeatureID)
	if err != nil {
		_ = im.updateInstanceStatus(ctx, instanceID, StatusFailed) //nolint:errcheck // best-effort status update on start failure path
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
	isolationConfig := &isolationpkg.ProcessIsolationConfig{
		InstanceID: instanceID,
		BindIP:     instance.BindIP,
		Ports:      instance.Ports,
	}

	processConfig := supervisor.ProcessConfig{
		ID:                instanceID,
		Name:              instance.InstanceName,
		Command:           instance.BinaryPath,
		Args:              im.buildProcessArgs(manifest, instance),
		Env:               im.buildProcessEnv(manifest, instance),
		WorkDir:           filepath.Dir(instance.BinaryPath),
		AutoRestart:       true,
		ShutdownGrace:     10 * 1000000000, // 10 seconds in nanoseconds
		EventBus:          im.publisher,
		Logger:            im.logger.With(zap.String("instance_id", instanceID)),
		RouterID:          instance.RouterID,
		Ports:             instance.Ports,
		IsolationStrategy: im.isolationStrategy,
		IsolationConfig:   isolationConfig,
	}

	process := supervisor.NewManagedProcess(processConfig)

	if err := im.config.Supervisor.Add(process); err != nil {
		_ = im.updateInstanceStatus(ctx, instanceID, StatusFailed) //nolint:errcheck // best-effort status update after supervisor add failure
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStarting), string(StatusFailed))
		return fmt.Errorf("failed to add to supervisor: %w", err)
	}

	if err := im.config.Supervisor.Start(ctx, instanceID); err != nil {
		_ = im.updateInstanceStatus(ctx, instanceID, StatusFailed) //nolint:errcheck // best-effort status update after process start failure
		im.emitStateChangeEvent(ctx, instanceID, string(StatusStarting), string(StatusFailed))
		_ = im.config.Supervisor.Remove(instanceID) //nolint:errcheck // best-effort cleanup after failed process start
		return fmt.Errorf("failed to start process: %w", err)
	}

	if err := im.updateInstanceStatus(ctx, instanceID, StatusRunning); err != nil {
		_ = im.config.Supervisor.Stop(ctx, instanceID) //nolint:errcheck // best-effort cleanup after status update failure
		_ = im.config.Supervisor.Remove(instanceID)    //nolint:errcheck // best-effort cleanup after status update failure
		return fmt.Errorf("failed to update status to running: %w", err)
	}

	im.emitStateChangeEvent(ctx, instanceID, string(StatusStarting), string(StatusRunning))

	// Apply resource limits and start monitoring (NAS-8.4)
	im.applyResourceLimits(ctx, instanceID, instance)

	im.logger.Info("Instance started successfully", zap.String("instance_id", instanceID))

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

	im.logger.Debug("Running pre-start isolation checks", zap.String("instance_id", instanceID))

	report, err := im.isolationVerifier.VerifyPreStart(ctx, instance)
	if err != nil {
		im.logger.Error("Isolation verification failed", zap.Error(err), zap.String("instance_id", instanceID))
		_ = im.updateInstanceStatus(ctx, instanceID, StatusFailed) //nolint:errcheck // best-effort status update after isolation verification error
		return fmt.Errorf("isolation verification error: %w", err)
	}

	if !report.Passed {
		errorViolations := []string{}
		for _, v := range report.Violations {
			if v.Severity == isolation.SeverityError {
				errorViolations = append(errorViolations, fmt.Sprintf("%s: %s", v.Layer, v.Description))
			}
		}

		if len(errorViolations) > 0 {
			im.logger.Error("Instance failed pre-start isolation checks",
				zap.String("instance_id", instanceID),
				zap.Strings("violations", errorViolations))
			_ = im.updateInstanceStatus(ctx, instanceID, StatusFailed) //nolint:errcheck // best-effort status update after isolation violations detected
			return fmt.Errorf("isolation violations detected: %s", errorViolations)
		}
	}

	im.logger.Info("Pre-start isolation checks passed",
		zap.String("instance_id", instanceID),
		zap.String("bind_ip", report.BindIP),
		zap.Int("allocated_ports", len(report.AllocatedPorts)))
	return nil
}

// runPreFlightResourceCheck checks resource availability before starting
func (im *InstanceManager) runPreFlightResourceCheck(ctx context.Context, instanceID string, instance *ent.ServiceInstance) error {
	if im.resourceManager == nil || instance.MemoryLimit == nil || *instance.MemoryLimit <= 0 {
		return nil
	}

	requiredMB := int(*instance.MemoryLimit / (1024 * 1024))

	im.logger.Debug("Checking resource availability",
		zap.String("instance_id", instanceID),
		zap.Int("required_mb", requiredMB))

	availability, err := im.resourceManager.CheckResourceAvailability(ctx, requiredMB)
	if err != nil {
		im.logger.Error("Failed to check resource availability", zap.Error(err), zap.String("instance_id", instanceID))
		_ = im.updateInstanceStatus(ctx, instanceID, StatusFailed) //nolint:errcheck // best-effort status update after resource check failure
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

		im.logger.Warn("Insufficient resources to start instance",
			zap.String("instance_id", instanceID),
			zap.Int("required_mb", requiredMB),
			zap.Int("available_mb", availability.AvailableMB),
			zap.Int("allocated_mb", availability.AllocatedMB))

		_ = im.updateInstanceStatus(ctx, instanceID, StatusFailed) //nolint:errcheck // best-effort status update after insufficient resources detected
		return fmt.Errorf("%s", errMsg)
	}

	im.logger.Info("Pre-flight resource check passed",
		zap.String("instance_id", instanceID),
		zap.Int("required_mb", requiredMB),
		zap.Int("available_mb", availability.AvailableMB),
		zap.Int("allocated_mb", availability.AllocatedMB))
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
		_, _ = fmt.Sscanf(p, "%d", &socksPort) //nolint:errcheck // parse failure is handled by the socksPort <= 0 check below
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
	socksAddrPort := net.JoinHostPort(socksAddr, strconv.Itoa(socksPort))

	im.logger.Debug("waiting for SOCKS5 port to be ready",
		zap.String("instance_id", instance.ID),
		zap.String("socks_addr", socksAddrPort))

	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("timeout waiting for SOCKS5 port %s: %w", socksAddrPort, ctx.Err())
		case <-ticker.C:
			dialCtx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
			dialer := &net.Dialer{}
			conn, err := dialer.DialContext(dialCtx, "tcp", socksAddrPort)
			cancel()
			if err == nil {
				conn.Close()
				im.logger.Info("SOCKS5 port is ready",
					zap.String("instance_id", instance.ID),
					zap.String("socks_addr", socksAddrPort))
				return nil
			}
		}
	}
}
