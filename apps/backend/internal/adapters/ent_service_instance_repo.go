package adapters

import (
	"context"

	"backend/internal/network"

	"backend/generated/ent"
	"backend/generated/ent/predicate"
)

// entServiceInstanceRepo implements network.ServiceInstanceRepo using ent.
type entServiceInstanceRepo struct {
	client *ent.Client
}

func (r *entServiceInstanceRepo) Query() network.ServiceInstanceQuery {
	return &entServiceInstanceQuery{
		query: r.client.ServiceInstance.Query(),
	}
}

// entServiceInstanceQuery wraps ent.ServiceInstanceQuery.
type entServiceInstanceQuery struct {
	query *ent.ServiceInstanceQuery
}

func (q *entServiceInstanceQuery) Where(predicates ...interface{}) network.ServiceInstanceQuery {
	entPredicates := make([]predicate.ServiceInstance, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(predicate.ServiceInstance); ok {
			entPredicates = append(entPredicates, pred)
		}
	}
	q.query = q.query.Where(entPredicates...)
	return q
}

func (q *entServiceInstanceQuery) Only(ctx context.Context) (network.ServiceInstanceEntity, error) {
	instance, err := q.query.Only(ctx)
	if err != nil {
		return nil, err
	}
	return &entServiceInstanceEntity{instance: instance}, nil
}

// entServiceInstanceEntity wraps ent.ServiceInstance.
type entServiceInstanceEntity struct {
	instance *ent.ServiceInstance
}

func (e *entServiceInstanceEntity) GetID() string {
	return e.instance.ID
}

func (e *entServiceInstanceEntity) GetStatus() string {
	return string(e.instance.Status)
}
