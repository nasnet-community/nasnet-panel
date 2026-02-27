package resolver

import (
	"time"

	graphql1 "backend/graph/model"
	"backend/internal/network"
)

// portEntityExtended is an extended interface for port allocation entities.
// It extends the base PortAllocationEntity with additional optional fields.
type portEntityExtended interface {
	network.PortAllocationEntity
	GetNotes() string
	GetAllocatedAt() time.Time
}

// entityToPortAllocation converts a network.PortAllocationEntity to a GraphQL PortAllocation.
// It handles both base entities and extended entities with additional fields.
func entityToPortAllocation(entity network.PortAllocationEntity) *graphql1.PortAllocation {
	allocatedAt := time.Now()

	alloc := &graphql1.PortAllocation{
		ID:          entity.GetID(),
		RouterID:    entity.GetRouterID(),
		Port:        entity.GetPort(),
		Protocol:    graphql1.PortProtocol(entity.GetProtocol()),
		InstanceID:  entity.GetInstanceID(),
		ServiceType: entity.GetServiceType(),
		AllocatedAt: allocatedAt,
	}

	// Check for extended interface with optional fields
	if ext, ok := entity.(portEntityExtended); ok {
		// Use the actual allocation time from the entity if available
		if actualTime := ext.GetAllocatedAt(); !actualTime.IsZero() {
			alloc.AllocatedAt = actualTime
		}
		// Only set notes if they are provided
		if notes := ext.GetNotes(); notes != "" {
			n := notes
			alloc.Notes = &n
		}
	}

	return alloc
}
