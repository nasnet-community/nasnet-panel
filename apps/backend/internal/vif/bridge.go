package vif

import (
	"context"
	"fmt"

	"backend/generated/ent"
	"backend/generated/ent/virtualinterface"
	"backend/internal/features"

	"backend/internal/events"
	"backend/internal/router"
	"backend/internal/vif/ingress"
	"backend/internal/vif/wan"

	"github.com/rs/zerolog/log"
)

// BridgeOrchestrator coordinates the creation and teardown of virtual interface bridges.
type BridgeOrchestrator struct {
	interfaceFactory *InterfaceFactory
	gatewayManager   *GatewayManager
	vlanAllocator    VLANAllocator
	store            *ent.Client
	eventBus         events.EventBus
	publisher        *events.Publisher
	routerPort       router.RouterPort
	ingressService   *ingress.Service
	egressService    *wan.EgressService
}

// BridgeOrchestratorConfig holds configuration for BridgeOrchestrator.
type BridgeOrchestratorConfig struct {
	InterfaceFactory *InterfaceFactory
	GatewayManager   *GatewayManager
	VLANAllocator    VLANAllocator
	Store            *ent.Client
	EventBus         events.EventBus
	RouterPort       router.RouterPort
	IngressService   *ingress.Service
	EgressService    *wan.EgressService
}

// NewBridgeOrchestrator creates a new bridge orchestrator.
func NewBridgeOrchestrator(cfg BridgeOrchestratorConfig) *BridgeOrchestrator {
	b := &BridgeOrchestrator{
		interfaceFactory: cfg.InterfaceFactory,
		gatewayManager:   cfg.GatewayManager,
		vlanAllocator:    cfg.VLANAllocator,
		store:            cfg.Store,
		eventBus:         cfg.EventBus,
		routerPort:       cfg.RouterPort,
		ingressService:   cfg.IngressService,
		egressService:    cfg.EgressService,
	}
	if cfg.EventBus != nil {
		b.publisher = events.NewPublisher(cfg.EventBus, "bridge-orchestrator")
	}
	return b
}

// SetupBridge creates a complete virtual interface bridge for a service instance.
func (b *BridgeOrchestrator) SetupBridge(
	ctx context.Context,
	instance *ent.ServiceInstance,
	manifest *features.Manifest,
) (*ent.VirtualInterface, error) {

	log.Info().
		Str("instance_id", instance.ID).
		Str("feature_id", manifest.ID).
		Msg("Setting up virtual interface bridge")

	// Allocate VLAN ID using router/instance context for DB-backed allocator.
	vlanID, err := b.vlanAllocator.Allocate(ctx, instance.RouterID, instance.ID, manifest.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to allocate VLAN ID: %w", err)
	}

	// Track cleanup for VLAN on failure
	defer func() {
		if err != nil {
			if releaseErr := b.vlanAllocator.Release(ctx, instance.RouterID, vlanID); releaseErr != nil {
				log.Error().Err(releaseErr).Msg("Failed to release VLAN ID during cleanup")
			}
		}
	}()

	// Create interface via InterfaceFactory
	vif, err := b.interfaceFactory.CreateInterface(
		ctx,
		instance.ID,
		manifest.ID,
		instance.InstanceName,
		vlanID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create interface: %w", err)
	}

	// Calculate IPs
	bindIP := fmt.Sprintf("10.99.%d.1", vlanID)

	// Check if gateway is needed
	mode := ""
	if m, ok := instance.Config["mode"].(string); ok {
		mode = m
	}
	if b.gatewayManager.NeedsGateway(manifest, mode) { //nolint:nestif // gateway setup requires nested error handling
		log.Info().Str("instance_id", instance.ID).Msg("Gateway required for this service")

		// Start gateway (handles all config generation internally)
		if gwErr := b.gatewayManager.StartGateway(ctx, instance, manifest); gwErr != nil {
			// Gateway failed - cleanup interface
			if cleanupErr := b.interfaceFactory.RemoveInterface(ctx, instance.ID); cleanupErr != nil {
				log.Error().Err(cleanupErr).Msg("Failed to cleanup interface after gateway failure")
			}
			return nil, fmt.Errorf("failed to start gateway: %w", gwErr)
		}
	} else {
		log.Info().Str("instance_id", instance.ID).Msg("No gateway needed for this service")
	}

	// Update ServiceInstance with VLAN and bind IP
	updatedInstance, err := instance.Update().
		SetVlanID(vlanID).
		SetBindIP(bindIP).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to update ServiceInstance: %w", err)
	}
	instance = updatedInstance

	// Emit event
	if b.publisher != nil {
		event := events.NewGenericEvent("bridge.setup.complete", events.PriorityNormal, "bridge-orchestrator", map[string]interface{}{
			"instance_id":    instance.ID,
			"interface_id":   vif.ID,
			"interface_name": vif.InterfaceName,
			"vlan_id":        vlanID,
			"bind_ip":        bindIP,
		})
		if pubErr := b.publisher.Publish(ctx, event); pubErr != nil {
			log.Warn().Err(pubErr).Msg("Failed to publish BridgeSetupComplete event")
		}
	}

	log.Info().
		Str("instance_id", instance.ID).
		Str("interface", vif.InterfaceName).
		Int("vlan_id", vlanID).
		Msg("Bridge setup complete")

	return vif, nil
}

// TeardownBridge removes a virtual interface bridge and all associated resources.
func (b *BridgeOrchestrator) TeardownBridge(
	ctx context.Context,
	instanceID string,
) error {

	log.Info().Str("instance_id", instanceID).Msg("Tearing down virtual interface bridge")

	// Load ServiceInstance
	instance, err := b.store.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		if ent.IsNotFound(err) {
			log.Warn().Str("instance_id", instanceID).Msg("ServiceInstance not found")
			return nil
		}
		return fmt.Errorf("failed to load ServiceInstance: %w", err)
	}

	// Load VirtualInterface
	vif, vifErr := b.store.VirtualInterface.
		Query().
		Where(virtualinterface.InstanceIDEQ(instanceID)).
		Only(ctx)
	if vifErr != nil {
		if ent.IsNotFound(vifErr) {
			log.Warn().Str("instance_id", instanceID).Msg("VirtualInterface not found")
			// Continue to cleanup instance fields
		} else {
			return fmt.Errorf("failed to load VirtualInterface: %w", vifErr)
		}
	}

	// Stop gateway if running
	if vif != nil && vif.GatewayStatus == virtualinterface.GatewayStatusRunning {
		if stopErr := b.gatewayManager.StopGateway(ctx, instanceID); stopErr != nil {
			log.Warn().Err(stopErr).Msg("Failed to stop gateway")
		}
	}

	// Remove interface
	if removeErr := b.interfaceFactory.RemoveInterface(ctx, instanceID); removeErr != nil {
		log.Warn().Err(removeErr).Msg("Failed to remove interface")
	}

	// Release VLAN if allocated
	if instance.VlanID != nil {
		if releaseErr := b.vlanAllocator.Release(ctx, instance.RouterID, *instance.VlanID); releaseErr != nil {
			log.Warn().Err(releaseErr).Int("vlan_id", *instance.VlanID).Msg("Failed to release VLAN ID")
		}
	}

	// Clear ServiceInstance fields
	instance.Update().
		ClearVlanID().
		ClearBindIP().
		SaveX(ctx)

	// Emit event
	if b.publisher != nil {
		event := events.NewGenericEvent("bridge.teardown.complete", events.PriorityNormal, "bridge-orchestrator", map[string]interface{}{
			"instance_id": instanceID,
		})
		if pubErr := b.publisher.Publish(ctx, event); pubErr != nil {
			log.Warn().Err(pubErr).Msg("Failed to publish BridgeTeardownComplete event")
		}
	}

	log.Info().Str("instance_id", instanceID).Msg("Bridge teardown complete")

	return nil
}

// ReconcileOnStartup cleans up orphaned virtual interfaces on startup.
func (b *BridgeOrchestrator) ReconcileOnStartup(ctx context.Context) error {
	log.Info().Msg("Reconciling virtual interfaces on startup")

	// Query router for all nnc-* interfaces
	cmd := router.Command{
		Path:   "/interface/vlan",
		Action: "print",
		Args:   map[string]string{},
	}
	response, err := b.routerPort.ExecuteCommand(ctx, cmd)
	if err != nil {
		return fmt.Errorf("failed to query router interfaces: %w", err)
	}

	// Parse router interfaces
	var routerInterfaces []string
	for _, item := range response.Data {
		if name, ok := item["name"]; ok {
			// Only consider nnc-* interfaces
			if len(name) >= 4 && name[:4] == "nnc-" {
				routerInterfaces = append(routerInterfaces, name)
			}
		}
	}

	// Load all VirtualInterface records from database
	dbInterfaces, err := b.store.VirtualInterface.
		Query().
		All(ctx)
	if err != nil {
		return fmt.Errorf("failed to query VirtualInterface records: %w", err)
	}

	// Build map of known interfaces
	knownInterfaces := make(map[string]bool)
	for _, vif := range dbInterfaces {
		knownInterfaces[vif.InterfaceName] = true
	}

	// Find orphaned interfaces (exist on router but not in DB)
	var orphaned []string
	for _, routerIface := range routerInterfaces {
		if !knownInterfaces[routerIface] {
			orphaned = append(orphaned, routerIface)
		}
	}

	// Remove orphaned interfaces
	for _, orphanedIface := range orphaned {
		log.Warn().
			Str("interface", orphanedIface).
			Msg("Removing orphaned virtual interface")

		// Remove VLAN interface
		removeCmd := router.Command{
			Path:   "/interface/vlan",
			Action: "remove",
			Args: map[string]string{
				"numbers": orphanedIface,
			},
		}
		if _, rmErr := b.routerPort.ExecuteCommand(ctx, removeCmd); rmErr != nil {
			log.Error().
				Err(rmErr).
				Str("interface", orphanedIface).
				Msg("Failed to remove orphaned interface")
		}
	}

	log.Info().
		Int("total_router", len(routerInterfaces)).
		Int("total_db", len(dbInterfaces)).
		Int("orphaned", len(orphaned)).
		Msg("Virtual interface reconciliation complete")

	return nil
}

// SetupDualVLANBridge creates a dual-VLAN bridge: an ingress VLAN running
// udhcpd (DHCP server) and links it to one or more egress VLANs for outbound
// traffic. Adding the ingress VLAN to a router bridge routes ALL bridge devices
// through this service — zero mangle rules needed.
//
//nolint:gocyclo,cyclop // complex dual-VLAN setup with multiple error paths
func (b *BridgeOrchestrator) SetupDualVLANBridge(
	ctx context.Context,
	instance *ent.ServiceInstance,
	manifest *features.Manifest,
	egressVLANIDs []int,
	bridgeName string,
) (*ent.VirtualInterface, error) {

	log.Info().
		Str("instance_id", instance.ID).
		Str("feature_id", manifest.ID).
		Str("bridge_name", bridgeName).
		Ints("egress_vlan_ids", egressVLANIDs).
		Msg("Setting up dual-VLAN bridge")

	// Allocate a VLAN ID from the ingress pool (100-149)
	vlanID, err := b.vlanAllocator.Allocate(ctx, instance.RouterID, instance.ID, manifest.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to allocate ingress VLAN ID: %w", err)
	}

	// Track cleanup for VLAN on failure
	defer func() {
		if err != nil {
			if releaseErr := b.vlanAllocator.Release(ctx, instance.RouterID, vlanID); releaseErr != nil {
				log.Error().Err(releaseErr).Msg("Failed to release VLAN ID during cleanup")
			}
		}
	}()

	// Create the interface via InterfaceFactory
	vif, err := b.interfaceFactory.CreateInterface(
		ctx,
		instance.ID,
		manifest.ID,
		instance.InstanceName,
		vlanID,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create interface: %w", err)
	}

	// Create ingress VLAN if IngressService is available
	if b.ingressService != nil {
		if _, createErr := b.ingressService.CreateVLAN(ctx, instance.RouterID, manifest.ID, instance.ID, egressVLANIDs); createErr != nil {
			// Cleanup interface on ingress VLAN creation failure
			if cleanupErr := b.interfaceFactory.RemoveInterface(ctx, instance.ID); cleanupErr != nil {
				log.Error().Err(cleanupErr).Msg("Failed to cleanup interface after ingress VLAN creation failure")
			}
			return nil, fmt.Errorf("failed to create ingress VLAN: %w", createErr)
		}
	}

	// Add ingress VLAN to bridge if bridgeName is provided and IngressService is available
	//nolint:nestif // nested conditions required for bridge configuration logic
	if bridgeName != "" && b.ingressService != nil {
		if addErr := b.ingressService.AddToBridge(ctx, vlanID, bridgeName); addErr != nil {
			// Cleanup ingress VLAN on bridge add failure
			if cleanupErr := b.ingressService.RemoveVLAN(ctx, vlanID); cleanupErr != nil {
				log.Error().Err(cleanupErr).Msg("Failed to cleanup ingress VLAN after bridge add failure")
			}
			if cleanupErr := b.interfaceFactory.RemoveInterface(ctx, instance.ID); cleanupErr != nil {
				log.Error().Err(cleanupErr).Msg("Failed to cleanup interface after bridge add failure")
			}
			return nil, fmt.Errorf("failed to add ingress VLAN to bridge: %w", addErr)
		}
	}

	// Check if gateway is needed and setup
	mode := ""
	if m, ok := instance.Config["mode"].(string); ok {
		mode = m
	}
	if gwSetupErr := b.setupGatewayIfNeeded(ctx, instance, manifest, mode); gwSetupErr != nil {
		b.cleanupOnGatewayFailure(ctx, instance.ID, vlanID)
		return nil, gwSetupErr
	}

	// Calculate bindIP as 10.99.{vlanID}.1
	bindIP := fmt.Sprintf("10.99.%d.1", vlanID)

	// Update ServiceInstance with vlanID and bindIP
	updatedInstance, err := instance.Update().
		SetVlanID(vlanID).
		SetBindIP(bindIP).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to update ServiceInstance: %w", err)
	}
	instance = updatedInstance

	// Emit event
	if b.publisher != nil {
		event := events.NewGenericEvent("bridge.dual_vlan.setup.complete", events.PriorityNormal, "bridge-orchestrator", map[string]interface{}{
			"instance_id":     instance.ID,
			"interface_id":    vif.ID,
			"interface_name":  vif.InterfaceName,
			"vlan_id":         vlanID,
			"bind_ip":         bindIP,
			"bridge_name":     bridgeName,
			"egress_vlan_ids": egressVLANIDs,
		})
		if err := b.publisher.Publish(ctx, event); err != nil {
			log.Warn().Err(err).Msg("Failed to publish dual-VLAN bridge setup complete event")
		}
	}

	log.Info().
		Str("instance_id", instance.ID).
		Str("interface", vif.InterfaceName).
		Int("vlan_id", vlanID).
		Str("bridge_name", bridgeName).
		Msg("Dual-VLAN bridge setup complete")

	return vif, nil
}

// TeardownDualVLANBridge removes a dual-VLAN bridge setup: stops gateway,
// removes ingress VLAN (stops udhcpd, removes router config), removes the
// interface factory entry, and releases the VLAN ID.
//
//nolint:gocyclo,cyclop // complex multi-step teardown
func (b *BridgeOrchestrator) TeardownDualVLANBridge(
	ctx context.Context,
	instanceID string,
) error {

	log.Info().Str("instance_id", instanceID).Msg("Tearing down dual-VLAN bridge")

	// Load ServiceInstance
	instance, err := b.store.ServiceInstance.Get(ctx, instanceID)
	if err != nil {
		if ent.IsNotFound(err) {
			log.Warn().Str("instance_id", instanceID).Msg("ServiceInstance not found")
			return nil
		}
		return fmt.Errorf("failed to load ServiceInstance: %w", err)
	}

	// Load VirtualInterface
	vif, err := b.store.VirtualInterface.
		Query().
		Where(virtualinterface.InstanceIDEQ(instanceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			log.Warn().Str("instance_id", instanceID).Msg("VirtualInterface not found")
			// Continue to cleanup instance fields
		} else {
			return fmt.Errorf("failed to load VirtualInterface: %w", err)
		}
	}

	// Stop gateway if running
	if vif != nil && vif.GatewayStatus == virtualinterface.GatewayStatusRunning {
		if err := b.gatewayManager.StopGateway(ctx, instanceID); err != nil {
			log.Warn().Err(err).Msg("Failed to stop gateway")
		}
	}

	// Remove ingress VLAN if IngressService is available and vlanID is set
	if instance.VlanID != nil && b.ingressService != nil {
		if err := b.ingressService.RemoveVLAN(ctx, *instance.VlanID); err != nil {
			log.Warn().Err(err).Int("vlan_id", *instance.VlanID).Msg("Failed to remove ingress VLAN")
		}
	}

	// Remove interface
	if err := b.interfaceFactory.RemoveInterface(ctx, instanceID); err != nil {
		log.Warn().Err(err).Msg("Failed to remove interface")
	}

	// Release VLAN if allocated
	if instance.VlanID != nil {
		if err := b.vlanAllocator.Release(ctx, instance.RouterID, *instance.VlanID); err != nil {
			log.Warn().Err(err).Int("vlan_id", *instance.VlanID).Msg("Failed to release VLAN ID")
		}
	}

	// Clear ServiceInstance fields
	instance.Update().
		ClearVlanID().
		ClearBindIP().
		SaveX(ctx)

	// Emit event
	if b.publisher != nil {
		event := events.NewGenericEvent("bridge.dual_vlan.teardown.complete", events.PriorityNormal, "bridge-orchestrator", map[string]interface{}{
			"instance_id": instanceID,
		})
		if err := b.publisher.Publish(ctx, event); err != nil {
			log.Warn().Err(err).Msg("Failed to publish dual-VLAN bridge teardown complete event")
		}
	}

	log.Info().Str("instance_id", instanceID).Msg("Dual-VLAN bridge teardown complete")

	return nil
}

// setupGatewayIfNeeded starts gateway if required, or logs if not needed.
func (b *BridgeOrchestrator) setupGatewayIfNeeded(
	ctx context.Context,
	instance *ent.ServiceInstance,
	manifest *features.Manifest,
	mode string,
) error {

	if b.gatewayManager.NeedsGateway(manifest, mode) {
		log.Info().Str("instance_id", instance.ID).Msg("Gateway required for this service")
		if gwErr := b.gatewayManager.StartGateway(ctx, instance, manifest); gwErr != nil {
			return fmt.Errorf("start gateway: %w", gwErr)
		}
	} else {
		log.Info().Str("instance_id", instance.ID).Msg("No gateway needed for this service")
	}
	return nil
}

// cleanupOnGatewayFailure removes the interface and ingress VLAN after a gateway setup failure.
func (b *BridgeOrchestrator) cleanupOnGatewayFailure(ctx context.Context, instanceID string, vlanID int) {
	if cleanupErr := b.interfaceFactory.RemoveInterface(ctx, instanceID); cleanupErr != nil {
		log.Error().Err(cleanupErr).Msg("Failed to cleanup interface after gateway failure")
	}
	if b.ingressService != nil {
		if cleanupErr := b.ingressService.RemoveVLAN(ctx, vlanID); cleanupErr != nil {
			log.Error().Err(cleanupErr).Msg("Failed to cleanup ingress VLAN after gateway failure")
		}
	}
}
