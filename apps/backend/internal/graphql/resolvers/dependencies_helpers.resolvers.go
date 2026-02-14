package resolver

// This file contains helper/conversion functions for dependency resolvers.
// Query and mutation resolvers are in dependencies.resolvers.go.

import (
	"backend/generated/ent"
	"backend/generated/graphql"
	
)

// convertServiceInstanceToModel converts an ent ServiceInstance to a GraphQL model ServiceInstance
func convertServiceInstanceToModel(inst *ent.ServiceInstance) *model.ServiceInstance {
	if inst == nil {
		return nil
	}

	return &model.ServiceInstance{
		ID:             inst.ID,
		FeatureID:      inst.FeatureID,
		InstanceName:   inst.InstanceName,
		RouterID:       inst.RouterID,
		Status:         model.ServiceInstanceStatus(inst.Status),
		VlanID:         inst.VlanID,
		Config:         inst.Config,
		BinaryPath:     &inst.BinaryPath,
		BinaryChecksum: &inst.BinaryChecksum,
		Verification:   nil, // TODO: Add binary verification support
		CreatedAt:      inst.CreatedAt,
		UpdatedAt:      inst.UpdatedAt,
	}
}
