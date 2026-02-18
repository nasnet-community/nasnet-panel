// Package network provides network resource management abstractions.
// This package defines port interfaces for dependency inversion following
// hexagonal architecture principles.
package network

import (
	"context"
)

// StorePort abstracts database operations for the network module.
// It provides access to VLAN allocation and port allocation repositories.
// This interface enables dependency inversion, allowing the network module
// to be independent of specific database implementations (e.g., ent).
type StorePort interface {
	// VLANAllocation returns a repository for VLAN allocation operations.
	VLANAllocation() VLANAllocationRepo

	// PortAllocation returns a repository for port allocation operations.
	PortAllocation() PortAllocationRepo

	// GlobalSettings returns a repository for global settings operations.
	GlobalSettings() GlobalSettingsRepo

	// ServiceInstance returns a repository for service instance operations.
	// Used for orphan detection in PortRegistry and VLANAllocator.
	ServiceInstance() ServiceInstanceRepo
}

// VLANAllocationRepo defines minimal database operations for VLAN allocations.
// This interface abstracts the ent-specific VLANAllocationClient.
type VLANAllocationRepo interface {
	// Query returns a query builder for VLAN allocations.
	Query() VLANAllocationQuery

	// Create returns a create builder for VLAN allocations.
	Create() VLANAllocationCreate

	// Update returns an update builder for VLAN allocations.
	Update() VLANAllocationUpdate

	// Delete returns a delete builder for VLAN allocations.
	Delete() VLANAllocationDelete

	// DeleteOne returns a delete builder for a specific VLAN allocation.
	DeleteOne(allocation VLANAllocationEntity) VLANAllocationDelete
}

// VLANAllocationQuery defines query operations for VLAN allocations.
type VLANAllocationQuery interface {
	// Where adds predicates to filter VLAN allocations.
	Where(predicates ...interface{}) VLANAllocationQuery

	// All executes the query and returns all matching VLAN allocations.
	All(ctx context.Context) ([]VLANAllocationEntity, error)

	// Only executes the query expecting exactly one result.
	Only(ctx context.Context) (VLANAllocationEntity, error)

	// Exist returns true if at least one matching allocation exists.
	Exist(ctx context.Context) (bool, error)

	// Count returns the number of matching allocations.
	Count(ctx context.Context) (int, error)
}

// VLANAllocationCreate defines create operations for VLAN allocations.
type VLANAllocationCreate interface {
	// SetID sets the ID field.
	SetID(id string) VLANAllocationCreate

	// SetRouterID sets the router_id field.
	SetRouterID(routerID string) VLANAllocationCreate

	// SetVlanID sets the vlan_id field.
	SetVlanID(vlanID int) VLANAllocationCreate

	// SetInstanceID sets the instance_id field.
	SetInstanceID(instanceID string) VLANAllocationCreate

	// SetServiceType sets the service_type field.
	SetServiceType(serviceType string) VLANAllocationCreate

	// SetSubnet sets the subnet field.
	SetSubnet(subnet string) VLANAllocationCreate

	// SetStatus sets the status field.
	SetStatus(status string) VLANAllocationCreate

	// Save creates the VLAN allocation in the database.
	Save(ctx context.Context) (VLANAllocationEntity, error)
}

// VLANAllocationUpdate defines update operations for VLAN allocations.
type VLANAllocationUpdate interface {
	// Where adds predicates to filter which allocations to update.
	Where(predicates ...interface{}) VLANAllocationUpdate

	// SetStatus sets the status field.
	SetStatus(status string) VLANAllocationUpdate

	// SetValue sets a field by name using map syntax.
	SetValue(values map[string]interface{}) VLANAllocationUpdate

	// Save executes the update operation.
	Save(ctx context.Context) (int, error)
}

// VLANAllocationDelete defines delete operations for VLAN allocations.
type VLANAllocationDelete interface {
	// Where adds predicates to filter which allocations to delete.
	Where(predicates ...interface{}) VLANAllocationDelete

	// Exec executes the delete operation.
	Exec(ctx context.Context) (int, error)
}

// VLANAllocationEntity represents a VLAN allocation entity.
// This interface abstracts the ent-generated VLANAllocation struct.
type VLANAllocationEntity interface {
	// GetID returns the allocation ID.
	GetID() string

	// GetRouterID returns the router ID.
	GetRouterID() string

	// GetVlanID returns the VLAN ID.
	GetVlanID() int

	// GetInstanceID returns the service instance ID.
	GetInstanceID() string

	// GetServiceType returns the service type.
	GetServiceType() string

	// GetSubnet returns the subnet.
	GetSubnet() string

	// GetStatus returns the allocation status.
	GetStatus() string

	// Update returns an update builder for this entity.
	Update() VLANAllocationUpdateOne
}

// VLANAllocationUpdateOne defines update operations for a single VLAN allocation.
type VLANAllocationUpdateOne interface {
	// SetStatus sets the status field.
	SetStatus(status string) VLANAllocationUpdateOne

	// Save executes the update operation.
	Save(ctx context.Context) (VLANAllocationEntity, error)
}

// PortAllocationRepo defines minimal database operations for port allocations.
// This interface abstracts the ent-specific PortAllocationClient.
type PortAllocationRepo interface {
	// Query returns a query builder for port allocations.
	Query() PortAllocationQuery

	// Create returns a create builder for port allocations.
	Create() PortAllocationCreate

	// Delete returns a delete builder for port allocations.
	Delete() PortAllocationDelete

	// DeleteOne returns a delete builder for a specific port allocation.
	DeleteOne(allocation PortAllocationEntity) PortAllocationDelete
}

// PortAllocationQuery defines query operations for port allocations.
type PortAllocationQuery interface {
	// Where adds predicates to filter port allocations.
	Where(predicates ...interface{}) PortAllocationQuery

	// All executes the query and returns all matching port allocations.
	All(ctx context.Context) ([]PortAllocationEntity, error)

	// Exist returns true if at least one matching allocation exists.
	Exist(ctx context.Context) (bool, error)

	// Aggregate returns an aggregate builder for advanced queries.
	Aggregate(aggFunc interface{}) PortAllocationAggregate
}

// PortAllocationAggregate defines aggregate operations for port allocations.
type PortAllocationAggregate interface {
	// Int executes the aggregate operation and returns an integer result.
	Int(ctx context.Context) (int, error)
}

// PortAllocationCreate defines create operations for port allocations.
type PortAllocationCreate interface {
	// SetID sets the ID field.
	SetID(id string) PortAllocationCreate

	// SetRouterID sets the router_id field.
	SetRouterID(routerID string) PortAllocationCreate

	// SetPort sets the port field.
	SetPort(port int) PortAllocationCreate

	// SetProtocol sets the protocol field.
	SetProtocol(protocol string) PortAllocationCreate

	// SetInstanceID sets the instance_id field.
	SetInstanceID(instanceID string) PortAllocationCreate

	// SetServiceType sets the service_type field.
	SetServiceType(serviceType string) PortAllocationCreate

	// SetNillableNotes sets the notes field (nullable).
	SetNillableNotes(notes *string) PortAllocationCreate

	// Save creates the port allocation in the database.
	Save(ctx context.Context) (PortAllocationEntity, error)
}

// PortAllocationDelete defines delete operations for port allocations.
type PortAllocationDelete interface {
	// Where adds predicates to filter which allocations to delete.
	Where(predicates ...interface{}) PortAllocationDelete

	// Exec executes the delete operation.
	Exec(ctx context.Context) (int, error)
}

// PortAllocationEntity represents a port allocation entity.
// This interface abstracts the ent-generated PortAllocation struct.
type PortAllocationEntity interface {
	// GetID returns the allocation ID.
	GetID() string

	// GetRouterID returns the router ID.
	GetRouterID() string

	// GetPort returns the port number.
	GetPort() int

	// GetProtocol returns the protocol (TCP/UDP).
	GetProtocol() string

	// GetInstanceID returns the service instance ID.
	GetInstanceID() string
}

// GlobalSettingsRepo defines minimal database operations for global settings.
// This interface abstracts the ent-specific GlobalSettingsClient.
type GlobalSettingsRepo interface {
	// Query returns a query builder for global settings.
	Query() GlobalSettingsQuery

	// Create returns a create builder for global settings.
	Create() GlobalSettingsCreate

	// Update returns an update builder for global settings.
	Update() GlobalSettingsUpdate
}

// GlobalSettingsQuery defines query operations for global settings.
type GlobalSettingsQuery interface {
	// Where adds predicates to filter global settings.
	Where(predicates ...interface{}) GlobalSettingsQuery

	// Only executes the query expecting exactly one result.
	Only(ctx context.Context) (GlobalSettingsEntity, error)
}

// GlobalSettingsCreate defines create operations for global settings.
type GlobalSettingsCreate interface {
	// SetID sets the ID field.
	SetID(id string) GlobalSettingsCreate

	// SetNamespace sets the namespace field.
	SetNamespace(namespace string) GlobalSettingsCreate

	// SetKey sets the key field.
	SetKey(key string) GlobalSettingsCreate

	// SetValue sets the value field (JSON map).
	SetValue(value map[string]interface{}) GlobalSettingsCreate

	// SetValueType sets the value_type field.
	SetValueType(valueType string) GlobalSettingsCreate

	// SetDescription sets the description field.
	SetDescription(description string) GlobalSettingsCreate

	// SetEditable sets the editable field.
	SetEditable(editable bool) GlobalSettingsCreate

	// SetRequiresRestart sets the requires_restart field.
	SetRequiresRestart(requiresRestart bool) GlobalSettingsCreate

	// Save creates the global setting in the database.
	Save(ctx context.Context) (GlobalSettingsEntity, error)
}

// GlobalSettingsUpdate defines update operations for global settings.
type GlobalSettingsUpdate interface {
	// Where adds predicates to filter which settings to update.
	Where(predicates ...interface{}) GlobalSettingsUpdate

	// SetValue sets the value field.
	SetValue(value map[string]interface{}) GlobalSettingsUpdate

	// Save executes the update operation.
	Save(ctx context.Context) (int, error)
}

// GlobalSettingsEntity represents a global setting entity.
// This interface abstracts the ent-generated GlobalSettings struct.
type GlobalSettingsEntity interface {
	// GetValue returns the setting value.
	GetValue() map[string]interface{}
}

// ServiceInstanceRepo defines minimal database operations for service instances.
// This interface abstracts the ent-specific ServiceInstanceClient.
// Used for orphan detection in PortRegistry and VLANAllocator.
type ServiceInstanceRepo interface {
	// Query returns a query builder for service instances.
	Query() ServiceInstanceQuery
}

// ServiceInstanceQuery defines query operations for service instances.
type ServiceInstanceQuery interface {
	// Where adds predicates to filter service instances.
	Where(predicates ...interface{}) ServiceInstanceQuery

	// Only executes the query expecting exactly one result.
	Only(ctx context.Context) (ServiceInstanceEntity, error)
}

// ServiceInstanceEntity represents a service instance entity.
// This interface abstracts the ent-generated ServiceInstance struct.
type ServiceInstanceEntity interface {
	// GetID returns the instance ID.
	GetID() string

	// GetStatus returns the instance status.
	GetStatus() string
}
