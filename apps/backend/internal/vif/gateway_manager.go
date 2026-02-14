package vif

import (
	"context"
	"fmt"
	"net"
	"path/filepath"
	"sync"
	"time"

	"backend/generated/ent"
	"backend/internal/features"
	"backend/internal/orchestrator"
	"backend/internal/storage"

	"github.com/rs/zerolog"
)

// GatewayManager manages SOCKS-to-TUN gateways using hev-socks5-tunnel
type GatewayManager struct {
	supervisor    ProcessSupervisor
	hevBinaryPath string
	pathResolver  storage.PathResolverPort
	gateways      map[string]*GatewayInstance
	mu            sync.RWMutex
	logger        zerolog.Logger
}

// GatewayInstance represents a running gateway
type GatewayInstance struct {
	InstanceID string
	TunName    string
	ConfigPath string
	ProcessID  string
	SocksAddr  string
	SocksPort  int
	UDPEnabled bool
	StartTime  time.Time
}

// GatewayManagerConfig holds configuration for GatewayManager
type GatewayManagerConfig struct {
	Supervisor    ProcessSupervisor        // Required
	PathResolver  storage.PathResolverPort // Required
	HevBinaryPath string                   // Optional, defaults to "/app/hev-socks5-tunnel"
	Logger        zerolog.Logger
}

// NewGatewayManager creates a new GatewayManager instance
func NewGatewayManager(config GatewayManagerConfig) (*GatewayManager, error) {
	if config.Supervisor == nil {
		return nil, fmt.Errorf("supervisor is required")
	}
	if config.PathResolver == nil {
		return nil, fmt.Errorf("path resolver is required")
	}

	hevPath := config.HevBinaryPath
	if hevPath == "" {
		hevPath = "/app/hev-socks5-tunnel"
	}

	logger := config.Logger
	if logger.GetLevel() == zerolog.Disabled {
		logger = zerolog.Nop()
	}

	return &GatewayManager{
		supervisor:    config.Supervisor,
		hevBinaryPath: hevPath,
		pathResolver:  config.PathResolver,
		gateways:      make(map[string]*GatewayInstance),
		logger:        logger.With().Str("component", "gateway_manager").Logger(),
	}, nil
}

// StartGateway creates a TUN interface for a SOCKS5 proxy service
func (gm *GatewayManager) StartGateway(ctx context.Context, instance *ent.ServiceInstance, manifest *features.Manifest) error {
	instanceID := instance.ID

	gm.mu.Lock()
	defer gm.mu.Unlock()

	// Check if gateway already exists
	if _, exists := gm.gateways[instanceID]; exists {
		return fmt.Errorf("gateway already exists for instance %s", instanceID)
	}

	// Check if gateway is needed
	mode := ""
	if m, ok := instance.Config["mode"].(string); ok {
		mode = m
	}
	if !gm.needsGateway(manifest, mode) {
		gm.logger.Debug().Str("instance_id", instanceID).Msg("gateway not needed")
		return nil
	}

	// Generate gateway configuration
	config, tunName, err := GenerateGatewayConfig(instance, manifest)
	if err != nil {
		return fmt.Errorf("failed to generate gateway config: %w", err)
	}

	// Resolve config file path using ConfigPath
	configDir := gm.pathResolver.ConfigPath("gateways")
	fullConfigPath := filepath.Join(filepath.Dir(configDir), "gateways", fmt.Sprintf("%s.yaml", instanceID))

	// Write config file
	if err := WriteGatewayYAML(config, fullConfigPath); err != nil {
		return fmt.Errorf("failed to write gateway config: %w", err)
	}

	// Create managed process
	processID := fmt.Sprintf("gw-%s", instanceID)
	mp := &orchestrator.ManagedProcess{
		ID:          processID,
		Command:     gm.hevBinaryPath,
		Args:        []string{fullConfigPath},
		Name:        fmt.Sprintf("Gateway-%s (%s)", manifest.ID, instanceID),
		AutoRestart: true,
		HealthProbe: &TUNProbe{tunName: tunName},
	}

	// Register with supervisor
	if err := gm.supervisor.Add(mp); err != nil {
		return fmt.Errorf("failed to add gateway to supervisor: %w", err)
	}

	// Start the process
	if err := gm.supervisor.Start(ctx, processID); err != nil {
		gm.supervisor.Remove(processID)
		return fmt.Errorf("failed to start gateway process: %w", err)
	}

	// Wait for TUN interface to be created (poll with timeout)
	if err := gm.waitForTUN(ctx, tunName, 5*time.Second); err != nil {
		gm.supervisor.Stop(ctx, processID)
		gm.supervisor.Remove(processID)
		return fmt.Errorf("TUN interface not created: %w", err)
	}

	// Store gateway instance
	gm.gateways[instanceID] = &GatewayInstance{
		InstanceID: instanceID,
		TunName:    tunName,
		ConfigPath: fullConfigPath,
		ProcessID:  processID,
		SocksAddr:  config.Socks5.Address,
		SocksPort:  config.Socks5.Port,
		UDPEnabled: config.Socks5.UDP != nil,
		StartTime:  time.Now(),
	}

	gm.logger.Info().
		Str("instance_id", instanceID).
		Str("tun_name", tunName).
		Str("socks_addr", config.Socks5.Address).
		Int("socks_port", config.Socks5.Port).
		Msg("gateway started successfully")

	return nil
}

// StopGateway gracefully stops a gateway
func (gm *GatewayManager) StopGateway(ctx context.Context, instanceID string) error {
	gm.mu.Lock()
	defer gm.mu.Unlock()

	gateway, exists := gm.gateways[instanceID]
	if !exists {
		gm.logger.Debug().Str("instance_id", instanceID).Msg("gateway not found, nothing to stop")
		return nil
	}

	// Stop supervised process (SIGTERM → timeout → SIGKILL)
	if err := gm.supervisor.Stop(ctx, gateway.ProcessID); err != nil {
		gm.logger.Warn().Err(err).Str("process_id", gateway.ProcessID).Msg("error stopping gateway process")
	}

	// Verify TUN interface removed (poll with timeout)
	if err := gm.waitForTUNRemoval(ctx, gateway.TunName, 2*time.Second); err != nil {
		gm.logger.Warn().Err(err).Str("tun_name", gateway.TunName).Msg("TUN interface not removed cleanly")
	}

	// Remove from supervisor
	if err := gm.supervisor.Remove(gateway.ProcessID); err != nil {
		gm.logger.Warn().Err(err).Str("process_id", gateway.ProcessID).Msg("error removing gateway from supervisor")
	}

	// Remove from map
	delete(gm.gateways, instanceID)

	gm.logger.Info().
		Str("instance_id", instanceID).
		Str("tun_name", gateway.TunName).
		Msg("gateway stopped successfully")

	return nil
}

// GetStatus returns the current status of a gateway
func (gm *GatewayManager) GetStatus(instanceID string) (*orchestrator.GatewayStatus, error) {
	gm.mu.RLock()
	defer gm.mu.RUnlock()

	gateway, exists := gm.gateways[instanceID]
	if !exists {
		return &orchestrator.GatewayStatus{
			State: orchestrator.GatewayStopped,
		}, nil
	}

	// Query supervisor for process state
	mp, found := gm.supervisor.Get(gateway.ProcessID)
	if !found {
		return &orchestrator.GatewayStatus{
			State:        orchestrator.GatewayError,
			TunName:      gateway.TunName,
			ErrorMessage: "process not found in supervisor",
		}, nil
	}

	// Determine state
	var state orchestrator.GatewayState
	var errorMsg string
	processState := mp.State()

	if processState == orchestrator.ProcessStateRunning {
		state = orchestrator.GatewayRunning
	} else if processState == orchestrator.ProcessStateCrashed {
		state = orchestrator.GatewayError
		errorMsg = "process crashed"
	} else {
		state = orchestrator.GatewayStopped
	}

	// Get PID using accessor method
	pid := mp.PID()

	// Calculate uptime
	uptime := time.Since(gateway.StartTime)

	return &orchestrator.GatewayStatus{
		State:           state,
		TunName:         gateway.TunName,
		PID:             pid,
		Uptime:          uptime,
		LastHealthCheck: time.Time{}, // Health check time not tracked in ManagedProcess
		ErrorMessage:    errorMsg,
	}, nil
}

// NeedsGateway checks if a service requires a gateway
func (gm *GatewayManager) NeedsGateway(manifest *features.Manifest, mode string) bool {
	return gm.needsGateway(manifest, mode)
}

// needsGateway internal implementation
func (gm *GatewayManager) needsGateway(manifest *features.Manifest, mode string) bool {
	// Services that don't need gateways
	if manifest.NetworkMode == "host" {
		return false
	}

	// Inbound services don't need gateways
	if mode == "server" || mode == "inbound" {
		return false
	}

	// DNS servers don't need gateways
	if manifest.ID == "adguard" || manifest.ID == "pihole" {
		return false
	}

	// Native TUN modes don't need our gateway
	if mode == "tun" {
		return false
	}

	// SOCKS5 client modes need gateways
	socksServices := map[string]bool{
		"tor":     true,
		"singbox": true,
		"xray":    true,
		"psiphon": true,
	}

	return socksServices[manifest.ID]
}

// waitForTUN polls for TUN interface creation
func (gm *GatewayManager) waitForTUN(ctx context.Context, tunName string, timeout time.Duration) error {
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("timeout waiting for TUN interface %s", tunName)
		case <-ticker.C:
			if _, err := net.InterfaceByName(tunName); err == nil {
				return nil
			}
		}
	}
}

// waitForTUNRemoval polls for TUN interface removal
func (gm *GatewayManager) waitForTUNRemoval(ctx context.Context, tunName string, timeout time.Duration) error {
	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("timeout waiting for TUN interface %s removal", tunName)
		case <-ticker.C:
			if _, err := net.InterfaceByName(tunName); err != nil {
				// Interface not found = removed
				return nil
			}
		}
	}
}
