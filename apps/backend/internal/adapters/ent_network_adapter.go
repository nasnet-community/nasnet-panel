// Package adapters provides adapter implementations for hexagonal architecture.
// This file implements the network.StorePort interface using ent ORM.
package adapters

import (
	"backend/internal/network"

	"backend/generated/ent"
)

// Compile-time verification that EntNetworkAdapter implements network.StorePort.
var _ network.StorePort = (*EntNetworkAdapter)(nil)

// EntNetworkAdapter adapts ent.Client to the network.StorePort interface.
// This adapter enables the network module to use ent for database operations
// without directly depending on ent types.
type EntNetworkAdapter struct {
	client *ent.Client
}

// NewEntNetworkAdapter creates a new ent-based adapter for network storage.
func NewEntNetworkAdapter(client *ent.Client) *EntNetworkAdapter {
	return &EntNetworkAdapter{
		client: client,
	}
}

// VLANAllocation returns a repository for VLAN allocation operations.
func (a *EntNetworkAdapter) VLANAllocation() network.VLANAllocationRepo {
	return &entVLANAllocationRepo{
		client: a.client,
	}
}

// PortAllocation returns a repository for port allocation operations.
func (a *EntNetworkAdapter) PortAllocation() network.PortAllocationRepo {
	return &entPortAllocationRepo{
		client: a.client,
	}
}

// GlobalSettings returns a repository for global settings operations.
func (a *EntNetworkAdapter) GlobalSettings() network.GlobalSettingsRepo {
	return &entGlobalSettingsRepo{
		client: a.client,
	}
}

// ServiceInstance returns a repository for service instance operations.
func (a *EntNetworkAdapter) ServiceInstance() network.ServiceInstanceRepo {
	return &entServiceInstanceRepo{
		client: a.client,
	}
}
