package adapters

import (
	"context"
	"fmt"

	"backend/internal/network"
	"backend/internal/repository"

	"backend/generated/ent"
	"backend/generated/ent/predicate"
	"backend/generated/ent/vlanallocation"
)

// entVLANAllocationRepo implements network.VLANAllocationRepo using ent.
type entVLANAllocationRepo struct {
	client *ent.Client
}

func (r *entVLANAllocationRepo) Query() network.VLANAllocationQuery {
	return &entVLANAllocationQuery{
		query: r.client.VLANAllocation.Query(),
	}
}

func (r *entVLANAllocationRepo) Create() network.VLANAllocationCreate {
	return &entVLANAllocationCreate{
		create: r.client.VLANAllocation.Create(),
	}
}

func (r *entVLANAllocationRepo) Update() network.VLANAllocationUpdate {
	return &entVLANAllocationUpdate{
		update: r.client.VLANAllocation.Update(),
	}
}

func (r *entVLANAllocationRepo) Delete() network.VLANAllocationDelete {
	return &entVLANAllocationDelete{
		delete: r.client.VLANAllocation.Delete(),
	}
}

func (r *entVLANAllocationRepo) DeleteOne(allocation network.VLANAllocationEntity) network.VLANAllocationDelete {
	entAlloc, _ := allocation.(*entVLANAllocationEntity) //nolint:errcheck // type assertion to internal concrete type is guaranteed by interface contract
	deleteOne := r.client.VLANAllocation.DeleteOne(entAlloc.allocation)
	return &entVLANAllocationDeleteOne{
		deleteOne: deleteOne,
	}
}

// entVLANAllocationQuery wraps ent.VLANAllocationQuery.
type entVLANAllocationQuery struct {
	query *ent.VLANAllocationQuery
}

func (q *entVLANAllocationQuery) Where(predicates ...interface{}) network.VLANAllocationQuery {
	// Convert interface{} predicates to ent predicates
	entPredicates := make([]predicate.VLANAllocation, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(predicate.VLANAllocation); ok {
			entPredicates = append(entPredicates, pred)
		}
	}
	q.query = q.query.Where(entPredicates...)
	return q
}

func (q *entVLANAllocationQuery) All(ctx context.Context) ([]network.VLANAllocationEntity, error) {
	allocations, err := q.query.All(ctx)
	if err != nil {
		return nil, fmt.Errorf("query vlan allocations: %w", err)
	}

	result := make([]network.VLANAllocationEntity, 0, len(allocations))
	for _, alloc := range allocations {
		if alloc == nil {
			continue
		}
		result = append(result, &entVLANAllocationEntity{allocation: alloc})
	}
	return result, nil
}

func (q *entVLANAllocationQuery) Only(ctx context.Context) (network.VLANAllocationEntity, error) {
	alloc, err := q.query.Only(ctx)
	if err != nil {
		return nil, fmt.Errorf("query vlan allocation: %w", err)
	}
	return &entVLANAllocationEntity{allocation: alloc}, nil
}

func (q *entVLANAllocationQuery) Exist(ctx context.Context) (bool, error) {
	exists, err := q.query.Exist(ctx)
	if err != nil {
		return false, fmt.Errorf("check vlan allocation existence: %w", err)
	}
	return exists, nil
}

func (q *entVLANAllocationQuery) Count(ctx context.Context) (int, error) {
	count, err := q.query.Count(ctx)
	if err != nil {
		return 0, fmt.Errorf("count vlan allocations: %w", err)
	}
	return count, nil
}

// entVLANAllocationCreate wraps ent.VLANAllocationCreate.
type entVLANAllocationCreate struct {
	create *ent.VLANAllocationCreate
}

func (c *entVLANAllocationCreate) SetID(id string) network.VLANAllocationCreate {
	c.create = c.create.SetID(id)
	return c
}

func (c *entVLANAllocationCreate) SetRouterID(routerID string) network.VLANAllocationCreate {
	c.create = c.create.SetRouterID(routerID)
	return c
}

func (c *entVLANAllocationCreate) SetVlanID(vlanID int) network.VLANAllocationCreate {
	c.create = c.create.SetVlanID(vlanID)
	return c
}

func (c *entVLANAllocationCreate) SetInstanceID(instanceID string) network.VLANAllocationCreate {
	c.create = c.create.SetInstanceID(instanceID)
	return c
}

func (c *entVLANAllocationCreate) SetServiceType(serviceType string) network.VLANAllocationCreate {
	c.create = c.create.SetServiceType(serviceType)
	return c
}

func (c *entVLANAllocationCreate) SetSubnet(subnet string) network.VLANAllocationCreate {
	c.create = c.create.SetSubnet(subnet)
	return c
}

func (c *entVLANAllocationCreate) SetStatus(status string) network.VLANAllocationCreate {
	c.create = c.create.SetStatus(vlanallocation.Status(status))
	return c
}

func (c *entVLANAllocationCreate) Save(ctx context.Context) (network.VLANAllocationEntity, error) {
	// VLAN ID range validation (valid VLAN IDs: 1-4094)
	vlanID, ok := c.create.Mutation().VlanID()
	if ok && (vlanID < 1 || vlanID > 4094) {
		return nil, fmt.Errorf("validate vlan id: %w", repository.InvalidInputWithValue("VLANAllocation", "vlanID", vlanID, "must be between 1 and 4094"))
	}

	alloc, err := c.create.Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("save vlan allocation: %w", err)
	}
	return &entVLANAllocationEntity{allocation: alloc}, nil
}

// entVLANAllocationUpdate wraps ent.VLANAllocationUpdate.
type entVLANAllocationUpdate struct {
	update *ent.VLANAllocationUpdate
}

func (u *entVLANAllocationUpdate) Where(predicates ...interface{}) network.VLANAllocationUpdate {
	entPredicates := make([]predicate.VLANAllocation, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(predicate.VLANAllocation); ok {
			entPredicates = append(entPredicates, pred)
		}
	}
	u.update = u.update.Where(entPredicates...)
	return u
}

func (u *entVLANAllocationUpdate) SetStatus(status string) network.VLANAllocationUpdate {
	u.update = u.update.SetStatus(vlanallocation.Status(status))
	return u
}

func (u *entVLANAllocationUpdate) SetValue(values map[string]interface{}) network.VLANAllocationUpdate {
	// Field-by-field update based on provided map values
	if routerID, ok := values["router_id"].(string); ok {
		u.update = u.update.SetRouterID(routerID)
	}
	if vlanID, ok := values["vlan_id"].(int); ok {
		u.update = u.update.SetVlanID(vlanID)
	}
	if instanceID, ok := values["instance_id"].(string); ok {
		u.update = u.update.SetInstanceID(instanceID)
	}
	if serviceType, ok := values["service_type"].(string); ok {
		u.update = u.update.SetServiceType(serviceType)
	}
	if subnet, ok := values["subnet"].(string); ok {
		u.update = u.update.SetSubnet(subnet)
	}
	if status, ok := values["status"].(string); ok {
		u.update = u.update.SetStatus(vlanallocation.Status(status))
	}
	return u
}

func (u *entVLANAllocationUpdate) Save(ctx context.Context) (int, error) {
	count, err := u.update.Save(ctx)
	if err != nil {
		return 0, fmt.Errorf("save vlan allocation: %w", err)
	}
	return count, nil
}

// entVLANAllocationDelete wraps ent.VLANAllocationDelete.
type entVLANAllocationDelete struct {
	delete *ent.VLANAllocationDelete
}

func (d *entVLANAllocationDelete) Where(predicates ...interface{}) network.VLANAllocationDelete {
	entPredicates := make([]predicate.VLANAllocation, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(predicate.VLANAllocation); ok {
			entPredicates = append(entPredicates, pred)
		}
	}
	d.delete = d.delete.Where(entPredicates...)
	return d
}

func (d *entVLANAllocationDelete) Exec(ctx context.Context) (int, error) {
	count, err := d.delete.Exec(ctx)
	if err != nil {
		return 0, fmt.Errorf("delete vlan allocations: %w", err)
	}
	return count, nil
}

// entVLANAllocationDeleteOne wraps ent.VLANAllocationDeleteOne.
type entVLANAllocationDeleteOne struct {
	deleteOne *ent.VLANAllocationDeleteOne
}

func (d *entVLANAllocationDeleteOne) Where(predicates ...interface{}) network.VLANAllocationDelete {
	// DeleteOne doesn't support Where, so return self
	return d
}

func (d *entVLANAllocationDeleteOne) Exec(ctx context.Context) (int, error) {
	err := d.deleteOne.Exec(ctx)
	if err != nil {
		return 0, fmt.Errorf("delete vlan allocation: %w", err)
	}
	return 1, nil
}

// entVLANAllocationEntity wraps ent.VLANAllocation.
type entVLANAllocationEntity struct {
	allocation *ent.VLANAllocation
}

func (e *entVLANAllocationEntity) GetID() string {
	return e.allocation.ID
}

func (e *entVLANAllocationEntity) GetRouterID() string {
	return e.allocation.RouterID
}

func (e *entVLANAllocationEntity) GetVlanID() int {
	return e.allocation.VlanID
}

func (e *entVLANAllocationEntity) GetInstanceID() string {
	return e.allocation.InstanceID
}

func (e *entVLANAllocationEntity) GetServiceType() string {
	return e.allocation.ServiceType
}

func (e *entVLANAllocationEntity) GetSubnet() string {
	return e.allocation.Subnet
}

func (e *entVLANAllocationEntity) GetStatus() string {
	return string(e.allocation.Status)
}

func (e *entVLANAllocationEntity) Update() network.VLANAllocationUpdateOne {
	return &entVLANAllocationUpdateOne{
		update: e.allocation.Update(),
	}
}

// entVLANAllocationUpdateOne wraps ent.VLANAllocationUpdateOne.
type entVLANAllocationUpdateOne struct {
	update *ent.VLANAllocationUpdateOne
}

func (u *entVLANAllocationUpdateOne) SetStatus(status string) network.VLANAllocationUpdateOne {
	u.update = u.update.SetStatus(vlanallocation.Status(status))
	return u
}

func (u *entVLANAllocationUpdateOne) Save(ctx context.Context) (network.VLANAllocationEntity, error) {
	alloc, err := u.update.Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("save vlan allocation: %w", err)
	}
	return &entVLANAllocationEntity{allocation: alloc}, nil
}
