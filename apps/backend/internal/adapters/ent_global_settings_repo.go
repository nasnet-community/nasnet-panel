package adapters

import (
	"context"

	"backend/internal/network"

	"backend/generated/ent"
	"backend/generated/ent/globalsettings"
	"backend/generated/ent/predicate"
)

// entGlobalSettingsRepo implements network.GlobalSettingsRepo using ent.
type entGlobalSettingsRepo struct {
	client *ent.Client
}

func (r *entGlobalSettingsRepo) Query() network.GlobalSettingsQuery {
	return &entGlobalSettingsQuery{
		query: r.client.GlobalSettings.Query(),
	}
}

func (r *entGlobalSettingsRepo) Create() network.GlobalSettingsCreate {
	return &entGlobalSettingsCreate{
		create: r.client.GlobalSettings.Create(),
	}
}

func (r *entGlobalSettingsRepo) Update() network.GlobalSettingsUpdate {
	return &entGlobalSettingsUpdate{
		update: r.client.GlobalSettings.Update(),
	}
}

// entGlobalSettingsQuery wraps ent.GlobalSettingsQuery.
type entGlobalSettingsQuery struct {
	query *ent.GlobalSettingsQuery
}

func (q *entGlobalSettingsQuery) Where(predicates ...interface{}) network.GlobalSettingsQuery {
	entPredicates := make([]predicate.GlobalSettings, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(predicate.GlobalSettings); ok {
			entPredicates = append(entPredicates, pred)
		}
	}
	q.query = q.query.Where(entPredicates...)
	return q
}

func (q *entGlobalSettingsQuery) Only(ctx context.Context) (network.GlobalSettingsEntity, error) {
	setting, err := q.query.Only(ctx)
	if err != nil {
		return nil, err
	}
	return &entGlobalSettingsEntity{setting: setting}, nil
}

// entGlobalSettingsCreate wraps ent.GlobalSettingsCreate.
type entGlobalSettingsCreate struct {
	create *ent.GlobalSettingsCreate
}

func (c *entGlobalSettingsCreate) SetID(id string) network.GlobalSettingsCreate {
	c.create = c.create.SetID(id)
	return c
}

func (c *entGlobalSettingsCreate) SetNamespace(namespace string) network.GlobalSettingsCreate {
	c.create = c.create.SetNamespace(namespace)
	return c
}

func (c *entGlobalSettingsCreate) SetKey(key string) network.GlobalSettingsCreate {
	c.create = c.create.SetKey(key)
	return c
}

func (c *entGlobalSettingsCreate) SetValue(value map[string]interface{}) network.GlobalSettingsCreate {
	c.create = c.create.SetValue(value)
	return c
}

func (c *entGlobalSettingsCreate) SetValueType(valueType string) network.GlobalSettingsCreate {
	c.create = c.create.SetValueType(globalsettings.ValueType(valueType))
	return c
}

func (c *entGlobalSettingsCreate) SetDescription(description string) network.GlobalSettingsCreate {
	c.create = c.create.SetDescription(description)
	return c
}

func (c *entGlobalSettingsCreate) SetEditable(editable bool) network.GlobalSettingsCreate {
	c.create = c.create.SetEditable(editable)
	return c
}

func (c *entGlobalSettingsCreate) SetRequiresRestart(requiresRestart bool) network.GlobalSettingsCreate {
	c.create = c.create.SetRequiresRestart(requiresRestart)
	return c
}

func (c *entGlobalSettingsCreate) Save(ctx context.Context) (network.GlobalSettingsEntity, error) {
	setting, err := c.create.Save(ctx)
	if err != nil {
		return nil, err
	}
	return &entGlobalSettingsEntity{setting: setting}, nil
}

// entGlobalSettingsUpdate wraps ent.GlobalSettingsUpdate.
type entGlobalSettingsUpdate struct {
	update *ent.GlobalSettingsUpdate
}

func (u *entGlobalSettingsUpdate) Where(predicates ...interface{}) network.GlobalSettingsUpdate {
	entPredicates := make([]predicate.GlobalSettings, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(predicate.GlobalSettings); ok {
			entPredicates = append(entPredicates, pred)
		}
	}
	u.update = u.update.Where(entPredicates...)
	return u
}

func (u *entGlobalSettingsUpdate) SetValue(value map[string]interface{}) network.GlobalSettingsUpdate {
	u.update = u.update.SetValue(value)
	return u
}

func (u *entGlobalSettingsUpdate) Save(ctx context.Context) (int, error) {
	return u.update.Save(ctx)
}

// entGlobalSettingsEntity wraps ent.GlobalSettings.
type entGlobalSettingsEntity struct {
	setting *ent.GlobalSettings
}

func (e *entGlobalSettingsEntity) GetValue() map[string]interface{} {
	return e.setting.Value
}
