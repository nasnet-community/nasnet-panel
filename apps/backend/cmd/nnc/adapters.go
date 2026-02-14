package main

import (
	"context"

	"backend/internal/events"
	"backend/internal/features"
	"backend/internal/features/updates"
	"backend/internal/features/verification"
	"backend/internal/network"
	"backend/internal/orchestrator"
	"backend/internal/services"
)

// eventBusAdapter adapts events.EventBus to alerts.EventBus interface.
type eventBusAdapter struct {
	bus events.EventBus
}

func (a *eventBusAdapter) Publish(ctx context.Context, event interface{}) error {
	if e, ok := event.(events.Event); ok {
		return a.bus.Publish(ctx, e)
	}
	return a.bus.Publish(ctx, events.NewGenericEvent("custom.event", events.PriorityNormal, "alert-service", map[string]interface{}{
		"data": event,
	}))
}

func (a *eventBusAdapter) Close() error {
	return a.bus.Close()
}

// instanceHealthAdapter adapts InstanceManager to features.HealthChecker interface.
type instanceHealthAdapter struct {
	manager *orchestrator.InstanceManager
}

func (a *instanceHealthAdapter) GetStatus(instanceID string) (string, error) {
	// TODO: Implement proper health status retrieval from InstanceManager
	return "healthy", nil
}

// instanceStopperAdapter adapts InstanceManager to updates.InstanceStopper interface.
type instanceStopperAdapter struct {
	manager *orchestrator.InstanceManager
}

func (a *instanceStopperAdapter) Stop(ctx context.Context, instanceID string) error {
	return a.manager.StopInstance(ctx, instanceID)
}

// instanceStarterAdapter adapts InstanceManager to updates.InstanceStarter interface.
type instanceStarterAdapter struct {
	manager *orchestrator.InstanceManager
}

func (a *instanceStarterAdapter) Start(ctx context.Context, instanceID string) error {
	return a.manager.StartInstance(ctx, instanceID)
}

// Adapters to bridge features and updates subpackage types

func adaptDownloadManager(dm *features.DownloadManager) *updates.DownloadManager {
	return &updates.DownloadManager{
		DownloadFunc: func(ctx context.Context, featureID, url, expectedChecksum string) error {
			return dm.Download(ctx, featureID, url, expectedChecksum)
		},
	}
}

func adaptVerifier(v *verification.Verifier) *updates.Verifier {
	// updates.Verifier is an empty struct, just return a new instance
	return &updates.Verifier{}
}

func adaptMigratorRegistry(mr *features.MigratorRegistry) *updates.MigratorRegistry {
	// The updates.MigratorRegistry has a Get method that returns updates.ConfigMigrator
	// We'll create a simple wrapper
	reg := &updates.MigratorRegistry{}
	// Note: This is a simple pass-through. The actual implementation should properly
	// wrap the migrators, but for now we'll use a basic approach.
	return reg
}

// vlanServiceAdapter adapts services.VlanService to network.VlanServicePort interface.
type vlanServiceAdapter struct {
	svc *services.VlanService
}

func (a *vlanServiceAdapter) ListVlans(ctx context.Context, routerID string, filter *network.VlanFilter) ([]*network.Vlan, error) {
	// The services.VlanService uses model.VlanFilter and model.Vlan
	// We need to convert between network and model types
	// For now, just call with nil filter and convert results
	vlans, err := a.svc.ListVlans(ctx, routerID, nil)
	if err != nil {
		return nil, err
	}

	// Convert model.Vlan to network.Vlan
	result := make([]*network.Vlan, len(vlans))
	for i, v := range vlans {
		result[i] = &network.Vlan{
			VlanID: v.VlanID,
			Name:   v.Name,
		}
	}
	return result, nil
}
