package vif

import (
	"context"
	"fmt"
	"time"

	"backend/generated/ent"
	"backend/generated/ent/virtualinterface"

	"backend/internal/events"
	"backend/internal/router"

	"go.uber.org/zap"
)

// InterfaceFactory creates and manages VLAN interfaces on MikroTik routers.
type InterfaceFactory struct {
	logger      *zap.Logger
	router      router.RouterPort
	store       *ent.Client
	eventBus    events.EventBus
	publisher   *events.Publisher
	parentIface string // Parent interface for VLAN (e.g., "ether1")
}

// InterfaceFactoryConfig holds configuration for InterfaceFactory.
type InterfaceFactoryConfig struct {
	Logger      *zap.Logger
	RouterPort  router.RouterPort
	Store       *ent.Client
	EventBus    events.EventBus
	ParentIface string // defaults to "ether1"
}

// NewInterfaceFactory creates a new interface factory.
func NewInterfaceFactory(cfg InterfaceFactoryConfig) *InterfaceFactory {
	f := &InterfaceFactory{
		logger:      cfg.Logger,
		router:      cfg.RouterPort,
		store:       cfg.Store,
		eventBus:    cfg.EventBus,
		parentIface: cfg.ParentIface,
	}
	if cfg.EventBus != nil {
		f.publisher = events.NewPublisher(cfg.EventBus, "interface-factory")
	}
	if f.parentIface == "" {
		f.parentIface = "ether1"
	}
	return f
}

// cleanupFunc represents a function to be called on rollback.
type cleanupFunc func() error

// CreateInterface creates a VLAN interface with IP address and routing table on the router.
// It executes commands transactionally with cleanup on failure.
func (f *InterfaceFactory) CreateInterface(
	ctx context.Context,
	instanceID string,
	featureID string,
	instanceName string,
	vlanID int,
) (*ent.VirtualInterface, error) {
	// Generate names
	interfaceName := fmt.Sprintf("nnc-%s-%s", featureID, instanceName)
	ipAddress := fmt.Sprintf("10.99.%d.1/24", vlanID)
	routingMark := fmt.Sprintf("%s-%s", featureID, instanceName)
	routingTableName := routingMark

	f.logger.Info("Creating virtual interface",
		zap.String("interface", interfaceName),
		zap.Int("vlan_id", vlanID),
		zap.String("ip", ipAddress),
	)

	// Create database record first with CREATING status
	vif, err := f.store.VirtualInterface.
		Create().
		SetInstanceID(instanceID).
		SetInterfaceName(interfaceName).
		SetVlanID(vlanID).
		SetIPAddress(ipAddress).
		SetGatewayType(virtualinterface.GatewayTypeNone).
		SetGatewayStatus(virtualinterface.GatewayStatusStopped).
		SetRoutingMark(routingMark).
		SetStatus(virtualinterface.StatusCreating).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create VirtualInterface record: %w", err)
	}

	// Track cleanup functions in LIFO order
	var cleanups []cleanupFunc
	defer func() {
		if len(cleanups) > 0 {
			// Rollback in reverse order
			f.logger.Warn("Rolling back interface creation")
			for i := len(cleanups) - 1; i >= 0; i-- {
				if cleanupErr := cleanups[i](); cleanupErr != nil {
					f.logger.Error("Cleanup failed", zap.Error(cleanupErr))
				}
			}
		}
	}()

	// Step 1: Create VLAN interface
	vlanCmd := router.Command{
		Path:   "/interface/vlan",
		Action: "add",
		Args: map[string]string{
			"name":      interfaceName,
			"vlan-id":   fmt.Sprintf("%d", vlanID),
			"interface": f.parentIface,
		},
	}
	if _, vlanErr := f.router.ExecuteCommand(ctx, vlanCmd); vlanErr != nil {
		// Update status to ERROR
		vif.Update().SetStatus(virtualinterface.StatusError).SaveX(ctx)
		return nil, fmt.Errorf("failed to create VLAN interface: %w", vlanErr)
	}
	cleanups = append(cleanups, func() error {
		removeVlanCmd := router.Command{
			Path:   "/interface/vlan",
			Action: "remove",
			Args: map[string]string{
				"numbers": interfaceName,
			},
		}
		_, rmErr := f.router.ExecuteCommand(ctx, removeVlanCmd)
		return rmErr
	})

	// Step 2: Assign IP address
	ipCmd := router.Command{
		Path:   "/ip/address",
		Action: "add",
		Args: map[string]string{
			"address":   ipAddress,
			"interface": interfaceName,
		},
	}
	if _, ipErr := f.router.ExecuteCommand(ctx, ipCmd); ipErr != nil {
		vif.Update().SetStatus(virtualinterface.StatusError).SaveX(ctx)
		return nil, fmt.Errorf("failed to assign IP address: %w", ipErr)
	}
	cleanups = append(cleanups, func() error {
		removeIpCmd := router.Command{
			Path:   "/ip/address",
			Action: "remove",
			Args: map[string]string{
				"numbers": ipAddress,
			},
		}
		_, rmErr := f.router.ExecuteCommand(ctx, removeIpCmd)
		return rmErr
	})

	// Step 3: Create routing table
	tableCmd := router.Command{
		Path:   "/routing/table",
		Action: "add",
		Args: map[string]string{
			"name": routingTableName,
		},
	}
	if _, tblErr := f.router.ExecuteCommand(ctx, tableCmd); tblErr != nil {
		vif.Update().SetStatus(virtualinterface.StatusError).SaveX(ctx)
		return nil, fmt.Errorf("failed to create routing table: %w", tblErr)
	}
	cleanups = append(cleanups, func() error {
		removeTableCmd := router.Command{
			Path:   "/routing/table",
			Action: "remove",
			Args: map[string]string{
				"numbers": routingTableName,
			},
		}
		_, rmErr := f.router.ExecuteCommand(ctx, removeTableCmd)
		return rmErr
	})

	// Step 4: Add default route to gateway
	gatewayIP := fmt.Sprintf("10.99.%d.2", vlanID)
	routeCmd := router.Command{
		Path:   "/ip/route",
		Action: "add",
		Args: map[string]string{
			"dst-address":   "0.0.0.0/0",
			"gateway":       gatewayIP,
			"routing-table": routingTableName,
		},
	}
	if _, rtErr := f.router.ExecuteCommand(ctx, routeCmd); rtErr != nil {
		vif.Update().SetStatus(virtualinterface.StatusError).SaveX(ctx)
		return nil, fmt.Errorf("failed to create default route: %w", rtErr)
	}
	cleanups = append(cleanups, func() error {
		removeRouteCmd := router.Command{
			Path:   "/ip/route",
			Action: "remove",
			Args: map[string]string{
				"routing-table": routingTableName,
				"dst-address":   "0.0.0.0/0",
			},
		}
		_, rmErr := f.router.ExecuteCommand(ctx, removeRouteCmd)
		return rmErr
	})

	// All steps succeeded - update status to ACTIVE and clear cleanup
	vif, err = vif.Update().
		SetStatus(virtualinterface.StatusActive).
		SetUpdatedAt(time.Now()).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to update VirtualInterface status: %w", err)
	}
	cleanups = nil // Clear cleanups to prevent rollback

	// Emit event
	if f.publisher != nil {
		event := events.NewGenericEvent("interface.created", events.PriorityNormal, "interface-factory", map[string]interface{}{
			"interface_id":   vif.ID,
			"instance_id":    instanceID,
			"interface_name": interfaceName,
			"vlan_id":        vlanID,
			"ip_address":     ipAddress,
		})
		if err := f.publisher.Publish(ctx, event); err != nil {
			f.logger.Warn("Failed to publish InterfaceCreated event", zap.Error(err))
		}
	}

	f.logger.Info("Virtual interface created successfully",
		zap.String("interface", interfaceName),
		zap.String("vif_id", vif.ID),
	)

	return vif, nil
}

// RemoveInterface removes a virtual interface and cleans up all associated resources.
func (f *InterfaceFactory) RemoveInterface(
	ctx context.Context,
	instanceID string,
) error {
	// Load VirtualInterface record
	vif, err := f.store.VirtualInterface.
		Query().
		Where(virtualinterface.InstanceIDEQ(instanceID)).
		Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			f.logger.Warn("VirtualInterface not found", zap.String("instance_id", instanceID))
			return nil
		}
		return fmt.Errorf("failed to load VirtualInterface: %w", err)
	}

	f.logger.Info("Removing virtual interface",
		zap.String("interface", vif.InterfaceName),
		zap.String("vif_id", vif.ID),
	)

	// Update status to REMOVING
	vif.Update().SetStatus(virtualinterface.StatusRemoving).SaveX(ctx)

	// Remove in reverse order of creation
	routingTableName := vif.RoutingMark

	// Step 1: Remove default route
	removeRouteCmd := router.Command{
		Path:   "/ip/route",
		Action: "remove",
		Args: map[string]string{
			"routing-table": routingTableName,
			"dst-address":   "0.0.0.0/0",
		},
	}
	if _, err := f.router.ExecuteCommand(ctx, removeRouteCmd); err != nil {
		f.logger.Warn("Failed to remove route (may not exist)", zap.Error(err))
	}

	// Step 2: Remove routing table
	removeTableCmd := router.Command{
		Path:   "/routing/table",
		Action: "remove",
		Args: map[string]string{
			"numbers": routingTableName,
		},
	}
	if _, err := f.router.ExecuteCommand(ctx, removeTableCmd); err != nil {
		f.logger.Warn("Failed to remove routing table (may not exist)", zap.Error(err))
	}

	// Step 3: Remove IP address
	removeIpCmd := router.Command{
		Path:   "/ip/address",
		Action: "remove",
		Args: map[string]string{
			"numbers": vif.IPAddress,
		},
	}
	if _, err := f.router.ExecuteCommand(ctx, removeIpCmd); err != nil {
		f.logger.Warn("Failed to remove IP address (may not exist)", zap.Error(err))
	}

	// Step 4: Remove VLAN interface
	removeVlanCmd := router.Command{
		Path:   "/interface/vlan",
		Action: "remove",
		Args: map[string]string{
			"numbers": vif.InterfaceName,
		},
	}
	if _, err := f.router.ExecuteCommand(ctx, removeVlanCmd); err != nil {
		f.logger.Warn("Failed to remove VLAN interface (may not exist)", zap.Error(err))
	}

	// Delete VirtualInterface record
	if err := f.store.VirtualInterface.DeleteOne(vif).Exec(ctx); err != nil {
		return fmt.Errorf("failed to delete VirtualInterface record: %w", err)
	}

	// Emit event
	if f.publisher != nil {
		event := events.NewGenericEvent("interface.removed", events.PriorityNormal, "interface-factory", map[string]interface{}{
			"interface_id":   vif.ID,
			"instance_id":    instanceID,
			"interface_name": vif.InterfaceName,
			"vlan_id":        vif.VlanID,
		})
		if err := f.publisher.Publish(ctx, event); err != nil {
			f.logger.Warn("Failed to publish InterfaceRemoved event", zap.Error(err))
		}
	}

	f.logger.Info("Virtual interface removed successfully",
		zap.String("interface", vif.InterfaceName),
	)

	return nil
}
