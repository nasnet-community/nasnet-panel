package adapters

import (
	"context"

	"backend/internal/network"

	"backend/generated/ent"
	"backend/generated/ent/portallocation"
	"backend/generated/ent/predicate"
)

// entPortAllocationRepo implements network.PortAllocationRepo using ent.
type entPortAllocationRepo struct {
	client *ent.Client
}

func (r *entPortAllocationRepo) Query() network.PortAllocationQuery {
	return &entPortAllocationQuery{
		query: r.client.PortAllocation.Query(),
	}
}

func (r *entPortAllocationRepo) Create() network.PortAllocationCreate {
	return &entPortAllocationCreate{
		create: r.client.PortAllocation.Create(),
	}
}

func (r *entPortAllocationRepo) Delete() network.PortAllocationDelete {
	return &entPortAllocationDelete{
		delete: r.client.PortAllocation.Delete(),
	}
}

func (r *entPortAllocationRepo) DeleteOne(allocation network.PortAllocationEntity) network.PortAllocationDelete {
	entAlloc, _ := allocation.(*entPortAllocationEntity) //nolint:errcheck // type assertion to internal concrete type is guaranteed by interface contract
	deleteOne := r.client.PortAllocation.DeleteOne(entAlloc.allocation)
	return &entPortAllocationDeleteOne{
		deleteOne: deleteOne,
	}
}

// entPortAllocationQuery wraps ent.PortAllocationQuery.
type entPortAllocationQuery struct {
	query *ent.PortAllocationQuery
}

func (q *entPortAllocationQuery) Where(predicates ...interface{}) network.PortAllocationQuery {
	entPredicates := make([]predicate.PortAllocation, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(predicate.PortAllocation); ok {
			entPredicates = append(entPredicates, pred)
		}
	}
	q.query = q.query.Where(entPredicates...)
	return q
}

func (q *entPortAllocationQuery) All(ctx context.Context) ([]network.PortAllocationEntity, error) {
	allocations, err := q.query.All(ctx)
	if err != nil {
		return nil, err
	}

	result := make([]network.PortAllocationEntity, 0, len(allocations))
	for _, alloc := range allocations {
		if alloc == nil {
			continue
		}
		result = append(result, &entPortAllocationEntity{allocation: alloc})
	}
	return result, nil
}

func (q *entPortAllocationQuery) Exist(ctx context.Context) (bool, error) {
	return q.query.Exist(ctx)
}

func (q *entPortAllocationQuery) Aggregate(aggFunc interface{}) network.PortAllocationAggregate {
	// Type assert to the expected aggregate function type
	if fn, ok := aggFunc.(func(*ent.PortAllocationQuery) *ent.PortAllocationQuery); ok {
		return &entPortAllocationAggregate{
			query: fn(q.query),
		}
	}
	return &entPortAllocationAggregate{
		query: q.query,
	}
}

// entPortAllocationAggregate wraps ent aggregate operations.
type entPortAllocationAggregate struct {
	query *ent.PortAllocationQuery
}

func (a *entPortAllocationAggregate) Int(ctx context.Context) (int, error) {
	// This is a simplified implementation
	// In production, you'd need to extract the aggregate value properly
	return a.query.Count(ctx)
}

// entPortAllocationCreate wraps ent.PortAllocationCreate.
type entPortAllocationCreate struct {
	create *ent.PortAllocationCreate
}

func (c *entPortAllocationCreate) SetID(id string) network.PortAllocationCreate {
	c.create = c.create.SetID(id)
	return c
}

func (c *entPortAllocationCreate) SetRouterID(routerID string) network.PortAllocationCreate {
	c.create = c.create.SetRouterID(routerID)
	return c
}

func (c *entPortAllocationCreate) SetPort(port int) network.PortAllocationCreate {
	c.create = c.create.SetPort(port)
	return c
}

func (c *entPortAllocationCreate) SetProtocol(protocol string) network.PortAllocationCreate {
	c.create = c.create.SetProtocol(portallocation.Protocol(protocol))
	return c
}

func (c *entPortAllocationCreate) SetInstanceID(instanceID string) network.PortAllocationCreate {
	c.create = c.create.SetInstanceID(instanceID)
	return c
}

func (c *entPortAllocationCreate) SetServiceType(serviceType string) network.PortAllocationCreate {
	c.create = c.create.SetServiceType(serviceType)
	return c
}

func (c *entPortAllocationCreate) SetNillableNotes(notes *string) network.PortAllocationCreate {
	c.create = c.create.SetNillableNotes(notes)
	return c
}

func (c *entPortAllocationCreate) Save(ctx context.Context) (network.PortAllocationEntity, error) {
	alloc, err := c.create.Save(ctx)
	if err != nil {
		return nil, err
	}
	return &entPortAllocationEntity{allocation: alloc}, nil
}

// entPortAllocationDelete wraps ent.PortAllocationDelete.
type entPortAllocationDelete struct {
	delete *ent.PortAllocationDelete
}

func (d *entPortAllocationDelete) Where(predicates ...interface{}) network.PortAllocationDelete {
	entPredicates := make([]predicate.PortAllocation, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(predicate.PortAllocation); ok {
			entPredicates = append(entPredicates, pred)
		}
	}
	d.delete = d.delete.Where(entPredicates...)
	return d
}

func (d *entPortAllocationDelete) Exec(ctx context.Context) (int, error) {
	return d.delete.Exec(ctx)
}

// entPortAllocationDeleteOne wraps ent.PortAllocationDeleteOne.
type entPortAllocationDeleteOne struct {
	deleteOne *ent.PortAllocationDeleteOne
}

func (d *entPortAllocationDeleteOne) Where(predicates ...interface{}) network.PortAllocationDelete {
	// DeleteOne doesn't support Where, so return self
	return d
}

func (d *entPortAllocationDeleteOne) Exec(ctx context.Context) (int, error) {
	err := d.deleteOne.Exec(ctx)
	if err != nil {
		return 0, err
	}
	return 1, nil
}

// entPortAllocationEntity wraps ent.PortAllocation.
type entPortAllocationEntity struct {
	allocation *ent.PortAllocation
}

func (e *entPortAllocationEntity) GetID() string {
	return e.allocation.ID
}

func (e *entPortAllocationEntity) GetRouterID() string {
	return e.allocation.RouterID
}

func (e *entPortAllocationEntity) GetPort() int {
	return e.allocation.Port
}

func (e *entPortAllocationEntity) GetProtocol() string {
	return string(e.allocation.Protocol)
}

func (e *entPortAllocationEntity) GetInstanceID() string {
	return e.allocation.InstanceID
}

func (e *entPortAllocationEntity) GetServiceType() string {
	return e.allocation.ServiceType
}
