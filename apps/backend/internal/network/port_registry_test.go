package network

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"sync"
	"testing"

	"backend/generated/ent"
	"backend/generated/ent/portallocation"
	entpredicate "backend/generated/ent/predicate"
	"backend/generated/ent/router"
	"backend/generated/ent/serviceinstance"
	"backend/generated/ent/vlanallocation"
	"backend/internal/common/ulid"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	_ "modernc.org/sqlite"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// =============================================================================
// StorePort adapter for *ent.Client
// =============================================================================

// entStoreAdapter wraps *ent.Client to satisfy the StorePort interface.
type entStoreAdapter struct {
	client *ent.Client
}

func (a *entStoreAdapter) VLANAllocation() VLANAllocationRepo {
	return &entVLANAllocationRepo{client: a.client.VLANAllocation}
}

func (a *entStoreAdapter) PortAllocation() PortAllocationRepo {
	return &entPortAllocationRepo{client: a.client.PortAllocation}
}

func (a *entStoreAdapter) GlobalSettings() GlobalSettingsRepo {
	return &entGlobalSettingsRepo{client: a.client.GlobalSettings}
}

func (a *entStoreAdapter) ServiceInstance() ServiceInstanceRepo {
	return &entServiceInstanceRepo{client: a.client.ServiceInstance}
}

// --- PortAllocationRepo ---

type entPortAllocationRepo struct {
	client *ent.PortAllocationClient
}

func (r *entPortAllocationRepo) Query() PortAllocationQuery {
	return &entPortAllocationQuery{q: r.client.Query()}
}

func (r *entPortAllocationRepo) Create() PortAllocationCreate {
	return &entPortAllocationCreate{c: r.client.Create()}
}

func (r *entPortAllocationRepo) Delete() PortAllocationDelete {
	return &entPortAllocationDelete{d: r.client.Delete()}
}

func (r *entPortAllocationRepo) DeleteOne(allocation PortAllocationEntity) PortAllocationDelete {
	// Use ID-based delete since we can't recover the raw *ent.PortAllocation.
	return &entPortAllocationDelete{d: r.client.Delete().Where(portallocation.IDEQ(allocation.GetID()))}
}

// --- PortAllocationQuery ---

type entPortAllocationQuery struct {
	q *ent.PortAllocationQuery
}

func (q *entPortAllocationQuery) Where(predicates ...interface{}) PortAllocationQuery {
	ps := make([]entpredicate.PortAllocation, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(entpredicate.PortAllocation); ok {
			ps = append(ps, pred)
		}
	}
	return &entPortAllocationQuery{q: q.q.Where(ps...)}
}

func (q *entPortAllocationQuery) All(ctx context.Context) ([]PortAllocationEntity, error) {
	allocs, err := q.q.All(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]PortAllocationEntity, len(allocs))
	for i, a := range allocs {
		result[i] = &portAllocEntityWrapper{raw: a}
	}
	return result, nil
}

// portAllocEntityWrapper wraps *ent.PortAllocation to satisfy PortAllocationEntity.
type portAllocEntityWrapper struct {
	raw *ent.PortAllocation
}

func (w *portAllocEntityWrapper) GetID() string          { return w.raw.ID }
func (w *portAllocEntityWrapper) GetRouterID() string    { return w.raw.RouterID }
func (w *portAllocEntityWrapper) GetPort() int           { return w.raw.Port }
func (w *portAllocEntityWrapper) GetProtocol() string    { return string(w.raw.Protocol) }
func (w *portAllocEntityWrapper) GetInstanceID() string  { return w.raw.InstanceID }
func (w *portAllocEntityWrapper) GetServiceType() string { return w.raw.ServiceType }

func (q *entPortAllocationQuery) Exist(ctx context.Context) (bool, error) {
	return q.q.Exist(ctx)
}

func (q *entPortAllocationQuery) Aggregate(aggFunc interface{}) PortAllocationAggregate {
	fn, ok := aggFunc.(ent.AggregateFunc)
	if !ok {
		return &entPortAllocationAggregate{invalid: true}
	}
	return &entPortAllocationAggregate{q: q.q.Aggregate(fn)}
}

// --- PortAllocationAggregate ---

type entPortAllocationAggregate struct {
	q       *ent.PortAllocationSelect
	invalid bool
}

func (a *entPortAllocationAggregate) Int(ctx context.Context) (int, error) {
	if a.invalid {
		return 0, fmt.Errorf("invalid aggregate function")
	}
	return a.q.Int(ctx)
}

// --- PortAllocationCreate ---

type entPortAllocationCreate struct {
	c *ent.PortAllocationCreate
}

func (c *entPortAllocationCreate) SetID(id string) PortAllocationCreate {
	return &entPortAllocationCreate{c: c.c.SetID(id)}
}

func (c *entPortAllocationCreate) SetRouterID(routerID string) PortAllocationCreate {
	return &entPortAllocationCreate{c: c.c.SetRouterID(routerID)}
}

func (c *entPortAllocationCreate) SetPort(port int) PortAllocationCreate {
	return &entPortAllocationCreate{c: c.c.SetPort(port)}
}

func (c *entPortAllocationCreate) SetProtocol(protocol string) PortAllocationCreate {
	return &entPortAllocationCreate{c: c.c.SetProtocol(portallocation.Protocol(protocol))}
}

func (c *entPortAllocationCreate) SetInstanceID(instanceID string) PortAllocationCreate {
	return &entPortAllocationCreate{c: c.c.SetInstanceID(instanceID)}
}

func (c *entPortAllocationCreate) SetServiceType(serviceType string) PortAllocationCreate {
	return &entPortAllocationCreate{c: c.c.SetServiceType(serviceType)}
}

func (c *entPortAllocationCreate) SetNillableNotes(notes *string) PortAllocationCreate {
	return &entPortAllocationCreate{c: c.c.SetNillableNotes(notes)}
}

func (c *entPortAllocationCreate) Save(ctx context.Context) (PortAllocationEntity, error) {
	raw, err := c.c.Save(ctx)
	if err != nil {
		return nil, err
	}
	return &portAllocEntityWrapper{raw: raw}, nil
}

// --- PortAllocationDelete ---

type entPortAllocationDelete struct {
	d *ent.PortAllocationDelete
}

func (d *entPortAllocationDelete) Where(predicates ...interface{}) PortAllocationDelete {
	ps := make([]entpredicate.PortAllocation, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(entpredicate.PortAllocation); ok {
			ps = append(ps, pred)
		}
	}
	return &entPortAllocationDelete{d: d.d.Where(ps...)}
}

func (d *entPortAllocationDelete) Exec(ctx context.Context) (int, error) {
	return d.d.Exec(ctx)
}

// --- PortAllocationDeleteOne (wraps *ent.PortAllocationDeleteOne) ---

type entPortAllocationDeleteOne struct {
	d *ent.PortAllocationDeleteOne
}

func (d *entPortAllocationDeleteOne) Where(predicates ...interface{}) PortAllocationDelete {
	// DeleteOne does not support Where; return self unchanged.
	return d
}

func (d *entPortAllocationDeleteOne) Exec(ctx context.Context) (int, error) {
	if err := d.d.Exec(ctx); err != nil {
		return 0, err
	}
	return 1, nil
}

// --- ServiceInstanceRepo ---

type entServiceInstanceRepo struct {
	client *ent.ServiceInstanceClient
}

func (r *entServiceInstanceRepo) Query() ServiceInstanceQuery {
	return &entServiceInstanceQuery{q: r.client.Query()}
}

// --- ServiceInstanceQuery ---

type entServiceInstanceQuery struct {
	q *ent.ServiceInstanceQuery
}

func (q *entServiceInstanceQuery) Where(predicates ...interface{}) ServiceInstanceQuery {
	ps := make([]entpredicate.ServiceInstance, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(entpredicate.ServiceInstance); ok {
			ps = append(ps, pred)
		}
	}
	return &entServiceInstanceQuery{q: q.q.Where(ps...)}
}

func (q *entServiceInstanceQuery) Only(ctx context.Context) (ServiceInstanceEntity, error) {
	raw, err := q.q.Only(ctx)
	if err != nil {
		return nil, err
	}
	return &serviceInstanceEntityWrapper{raw: raw}, nil
}

// serviceInstanceEntityWrapper wraps *ent.ServiceInstance to satisfy ServiceInstanceEntity.
type serviceInstanceEntityWrapper struct {
	raw *ent.ServiceInstance
}

func (w *serviceInstanceEntityWrapper) GetID() string     { return w.raw.ID }
func (w *serviceInstanceEntityWrapper) GetStatus() string { return string(w.raw.Status) }

// --- VLANAllocationRepo ---

type entVLANAllocationRepo struct {
	client *ent.VLANAllocationClient
}

func (r *entVLANAllocationRepo) Query() VLANAllocationQuery {
	return &entVLANAllocationQuery{q: r.client.Query()}
}

func (r *entVLANAllocationRepo) Create() VLANAllocationCreate {
	return &entVLANAllocationCreate{c: r.client.Create()}
}

func (r *entVLANAllocationRepo) Update() VLANAllocationUpdate {
	return &entVLANAllocationUpdate{u: r.client.Update()}
}

func (r *entVLANAllocationRepo) Delete() VLANAllocationDelete {
	return &entVLANAllocationDeleteAdapter{d: r.client.Delete()}
}

func (r *entVLANAllocationRepo) DeleteOne(allocation VLANAllocationEntity) VLANAllocationDelete {
	return &entVLANAllocationDeleteAdapter{d: r.client.Delete().Where(vlanallocation.IDEQ(allocation.GetID()))}
}

// --- VLANAllocationQuery ---

type entVLANAllocationQuery struct {
	q *ent.VLANAllocationQuery
}

func (q *entVLANAllocationQuery) Where(predicates ...interface{}) VLANAllocationQuery {
	ps := make([]entpredicate.VLANAllocation, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(entpredicate.VLANAllocation); ok {
			ps = append(ps, pred)
		}
	}
	return &entVLANAllocationQuery{q: q.q.Where(ps...)}
}

func (q *entVLANAllocationQuery) All(ctx context.Context) ([]VLANAllocationEntity, error) {
	allocs, err := q.q.All(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]VLANAllocationEntity, len(allocs))
	for i, a := range allocs {
		result[i] = &vlanAllocEntityWrapper{raw: a}
	}
	return result, nil
}

func (q *entVLANAllocationQuery) Only(ctx context.Context) (VLANAllocationEntity, error) {
	raw, err := q.q.Only(ctx)
	if err != nil {
		return nil, err
	}
	return &vlanAllocEntityWrapper{raw: raw}, nil
}

func (q *entVLANAllocationQuery) Exist(ctx context.Context) (bool, error) {
	return q.q.Exist(ctx)
}

func (q *entVLANAllocationQuery) Count(ctx context.Context) (int, error) {
	return q.q.Count(ctx)
}

// --- VLANAllocationCreate ---

type entVLANAllocationCreate struct {
	c *ent.VLANAllocationCreate
}

func (c *entVLANAllocationCreate) SetID(id string) VLANAllocationCreate {
	return &entVLANAllocationCreate{c: c.c.SetID(id)}
}

func (c *entVLANAllocationCreate) SetRouterID(routerID string) VLANAllocationCreate {
	return &entVLANAllocationCreate{c: c.c.SetRouterID(routerID)}
}

func (c *entVLANAllocationCreate) SetVlanID(vlanID int) VLANAllocationCreate {
	return &entVLANAllocationCreate{c: c.c.SetVlanID(vlanID)}
}

func (c *entVLANAllocationCreate) SetInstanceID(instanceID string) VLANAllocationCreate {
	return &entVLANAllocationCreate{c: c.c.SetInstanceID(instanceID)}
}

func (c *entVLANAllocationCreate) SetServiceType(serviceType string) VLANAllocationCreate {
	return &entVLANAllocationCreate{c: c.c.SetServiceType(serviceType)}
}

func (c *entVLANAllocationCreate) SetSubnet(subnet string) VLANAllocationCreate {
	return &entVLANAllocationCreate{c: c.c.SetSubnet(subnet)}
}

func (c *entVLANAllocationCreate) SetStatus(status string) VLANAllocationCreate {
	return &entVLANAllocationCreate{c: c.c.SetStatus(vlanallocation.Status(status))}
}

func (c *entVLANAllocationCreate) Save(ctx context.Context) (VLANAllocationEntity, error) {
	raw, err := c.c.Save(ctx)
	if err != nil {
		return nil, err
	}
	return &vlanAllocEntityWrapper{raw: raw}, nil
}

// --- VLANAllocationUpdate ---

type entVLANAllocationUpdate struct {
	u *ent.VLANAllocationUpdate
}

func (u *entVLANAllocationUpdate) Where(predicates ...interface{}) VLANAllocationUpdate {
	ps := make([]entpredicate.VLANAllocation, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(entpredicate.VLANAllocation); ok {
			ps = append(ps, pred)
		}
	}
	return &entVLANAllocationUpdate{u: u.u.Where(ps...)}
}

func (u *entVLANAllocationUpdate) SetStatus(status string) VLANAllocationUpdate {
	return &entVLANAllocationUpdate{u: u.u.SetStatus(vlanallocation.Status(status))}
}

func (u *entVLANAllocationUpdate) SetValue(values map[string]interface{}) VLANAllocationUpdate {
	return u
}

func (u *entVLANAllocationUpdate) Save(ctx context.Context) (int, error) {
	return u.u.Save(ctx)
}

// --- VLANAllocationDelete ---

type entVLANAllocationDeleteAdapter struct {
	d *ent.VLANAllocationDelete
}

func (d *entVLANAllocationDeleteAdapter) Where(predicates ...interface{}) VLANAllocationDelete {
	ps := make([]entpredicate.VLANAllocation, 0, len(predicates))
	for _, p := range predicates {
		if pred, ok := p.(entpredicate.VLANAllocation); ok {
			ps = append(ps, pred)
		}
	}
	return &entVLANAllocationDeleteAdapter{d: d.d.Where(ps...)}
}

func (d *entVLANAllocationDeleteAdapter) Exec(ctx context.Context) (int, error) {
	return d.d.Exec(ctx)
}

// --- VLANAllocationEntity wrapper ---

type vlanAllocEntityWrapper struct {
	raw *ent.VLANAllocation
}

func (w *vlanAllocEntityWrapper) GetID() string          { return w.raw.ID }
func (w *vlanAllocEntityWrapper) GetRouterID() string    { return w.raw.RouterID }
func (w *vlanAllocEntityWrapper) GetVlanID() int         { return w.raw.VlanID }
func (w *vlanAllocEntityWrapper) GetInstanceID() string  { return w.raw.InstanceID }
func (w *vlanAllocEntityWrapper) GetServiceType() string { return w.raw.ServiceType }
func (w *vlanAllocEntityWrapper) GetSubnet() string      { return w.raw.Subnet }
func (w *vlanAllocEntityWrapper) GetStatus() string      { return string(w.raw.Status) }

func (w *vlanAllocEntityWrapper) Update() VLANAllocationUpdateOne {
	return &entVLANAllocationUpdateOneWrapper{u: w.raw.Update()}
}

// --- VLANAllocationUpdateOne wrapper ---

type entVLANAllocationUpdateOneWrapper struct {
	u *ent.VLANAllocationUpdateOne
}

func (u *entVLANAllocationUpdateOneWrapper) SetStatus(status string) VLANAllocationUpdateOne {
	return &entVLANAllocationUpdateOneWrapper{u: u.u.SetStatus(vlanallocation.Status(status))}
}

func (u *entVLANAllocationUpdateOneWrapper) Save(ctx context.Context) (VLANAllocationEntity, error) {
	raw, err := u.u.Save(ctx)
	if err != nil {
		return nil, err
	}
	return &vlanAllocEntityWrapper{raw: raw}, nil
}

// --- GlobalSettingsRepo (minimal stub - not used by port registry tests) ---

type entGlobalSettingsRepo struct {
	client *ent.GlobalSettingsClient
}

func (r *entGlobalSettingsRepo) Query() GlobalSettingsQuery {
	panic("GlobalSettings.Query not used in port registry tests")
}

func (r *entGlobalSettingsRepo) Create() GlobalSettingsCreate {
	panic("GlobalSettings.Create not used in port registry tests")
}

func (r *entGlobalSettingsRepo) Update() GlobalSettingsUpdate {
	panic("GlobalSettings.Update not used in port registry tests")
}

// openTestClient creates an ent client for testing with in-memory SQLite.
func openTestClient(t *testing.T) *ent.Client {
	t.Helper()

	// Open database with modernc.org/sqlite driver
	db, err := sql.Open("sqlite", "file::memory:?cache=shared&_time_format=sqlite")
	require.NoError(t, err)

	// Enable foreign keys
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	require.NoError(t, err)

	// Create ent driver
	drv := entsql.OpenDB(dialect.SQLite, db)

	// Create ent client
	client := ent.NewClient(ent.Driver(drv))

	return client
}

// setupTestData creates a test router and service instance.
func setupTestData(t *testing.T, ctx context.Context, client *ent.Client) (routerID, instanceID string) {
	t.Helper()

	// Create test router
	routerID = ulid.NewString()
	_, err := client.Router.Create().
		SetID(routerID).
		SetName("Test Router").
		SetHost("192.168.1.1").
		SetPort(8728).
		SetPlatform(router.PlatformMikrotik).
		SetStatus(router.StatusOnline).
		Save(ctx)
	require.NoError(t, err)

	// Create test service instance
	instanceID = ulid.NewString()
	_, err = client.ServiceInstance.Create().
		SetID(instanceID).
		SetFeatureID("tor").
		SetInstanceName("tor-instance-1").
		SetRouterID(routerID).
		SetStatus(serviceinstance.StatusInstalled).
		Save(ctx)
	require.NoError(t, err)

	return routerID, instanceID
}

// TestNewPortRegistry tests the constructor with various configurations.
func TestNewPortRegistry(t *testing.T) {
	ctx := context.Background()

	t.Run("default configuration", func(t *testing.T) {
		client := openTestClient(t)
		defer client.Close()

		err := client.Schema.Create(ctx)
		require.NoError(t, err)

		registry, err := NewPortRegistry(PortRegistryConfig{
			Store: &entStoreAdapter{client: client},
		})

		require.NoError(t, err)
		assert.NotNil(t, registry)
		assert.NotNil(t, registry.store)
		assert.NotNil(t, registry.cache)
		assert.NotNil(t, registry.reservedPorts)

		// Verify default reserved ports
		assert.True(t, registry.isReserved(22))  // SSH
		assert.True(t, registry.isReserved(80))  // HTTP
		assert.True(t, registry.isReserved(443)) // HTTPS
	})

	t.Run("custom reserved ports", func(t *testing.T) {
		client := openTestClient(t)
		defer client.Close()

		err := client.Schema.Create(ctx)
		require.NoError(t, err)

		customReserved := []int{5000, 6000, 7000}
		registry, err := NewPortRegistry(PortRegistryConfig{
			Store:         &entStoreAdapter{client: client},
			ReservedPorts: customReserved,
		})

		require.NoError(t, err)
		assert.True(t, registry.isReserved(5000))
		assert.True(t, registry.isReserved(6000))
		assert.True(t, registry.isReserved(7000))
		assert.False(t, registry.isReserved(22)) // Default reserved port should not be present
	})

	t.Run("nil store returns error", func(t *testing.T) {
		_, err := NewPortRegistry(PortRegistryConfig{
			Store: nil,
		})

		require.Error(t, err)
		assert.Contains(t, err.Error(), "store is required")
	})
}

// TestPortRegistry_AllocatePort tests basic port allocation.
func TestPortRegistry_AllocatePort(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	routerID, instanceID := setupTestData(t, ctx, client)

	registry, err := NewPortRegistry(PortRegistryConfig{
		Store:  &entStoreAdapter{client: client},
		Logger: slog.Default(),
	})
	require.NoError(t, err)

	// Allocate port for Tor service (should get base port 9050)
	resp, err := registry.AllocatePort(ctx, AllocatePortRequest{
		RouterID:    routerID,
		InstanceID:  instanceID,
		ServiceType: "tor",
		Protocol:    "TCP",
		Notes:       "SOCKS5 proxy",
	})

	require.NoError(t, err)
	assert.NotEmpty(t, resp.AllocationID)
	assert.Equal(t, 9050, resp.Port)
	assert.Equal(t, "TCP", resp.Protocol)

	// Verify allocation exists in database
	alloc, err := client.PortAllocation.Get(ctx, resp.AllocationID)
	require.NoError(t, err)
	assert.Equal(t, routerID, alloc.RouterID)
	assert.Equal(t, instanceID, alloc.InstanceID)
	assert.Equal(t, 9050, alloc.Port)
	assert.Equal(t, portallocation.ProtocolTCP, alloc.Protocol)
	assert.Equal(t, "tor", alloc.ServiceType)

	// Verify allocation exists in cache
	cacheKey := registry.cacheKey(routerID, 9050, "TCP")
	registry.mu.RLock()
	_, exists := registry.cache[cacheKey]
	registry.mu.RUnlock()
	assert.True(t, exists)
}

// TestPortRegistry_AllocatePort_AutoIncrement tests sequential port allocation.
func TestPortRegistry_AllocatePort_AutoIncrement(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	routerID, instanceID := setupTestData(t, ctx, client)

	registry, err := NewPortRegistry(PortRegistryConfig{
		Store: &entStoreAdapter{client: client},
	})
	require.NoError(t, err)

	// Allocate first port (should get 9050)
	resp1, err := registry.AllocatePort(ctx, AllocatePortRequest{
		RouterID:    routerID,
		InstanceID:  instanceID,
		ServiceType: "tor",
		Protocol:    "TCP",
	})
	require.NoError(t, err)
	assert.Equal(t, 9050, resp1.Port)

	// Allocate second port (should get 9151 - second base port)
	resp2, err := registry.AllocatePort(ctx, AllocatePortRequest{
		RouterID:    routerID,
		InstanceID:  instanceID,
		ServiceType: "tor",
		Protocol:    "TCP",
	})
	require.NoError(t, err)
	assert.Equal(t, 9151, resp2.Port)

	// Allocate third port (should get 9152 - auto-incremented)
	resp3, err := registry.AllocatePort(ctx, AllocatePortRequest{
		RouterID:    routerID,
		InstanceID:  instanceID,
		ServiceType: "tor",
		Protocol:    "TCP",
	})
	require.NoError(t, err)
	assert.Equal(t, 9152, resp3.Port)
}

// TestPortRegistry_AllocatePort_DifferentServices tests allocation for different service types.
func TestPortRegistry_AllocatePort_DifferentServices(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	routerID, instanceID := setupTestData(t, ctx, client)

	registry, err := NewPortRegistry(PortRegistryConfig{
		Store: &entStoreAdapter{client: client},
	})
	require.NoError(t, err)

	tests := []struct {
		serviceType  string
		expectedPort int
	}{
		{"tor", 9050},
		{"singbox", 1080},
		{"xray", 1081},
		{"mtproxy", 8888},
		{"psiphon", 4443},
	}

	for _, tt := range tests {
		t.Run(tt.serviceType, func(t *testing.T) {
			resp, err := registry.AllocatePort(ctx, AllocatePortRequest{
				RouterID:    routerID,
				InstanceID:  instanceID,
				ServiceType: tt.serviceType,
				Protocol:    "TCP",
			})

			require.NoError(t, err)
			assert.Equal(t, tt.expectedPort, resp.Port)
		})
	}
}

// TestPortRegistry_AllocatePort_DuplicateError tests unique constraint violation.
func TestPortRegistry_AllocatePort_DuplicateError(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	routerID, instanceID := setupTestData(t, ctx, client)

	registry, err := NewPortRegistry(PortRegistryConfig{
		Store: &entStoreAdapter{client: client},
	})
	require.NoError(t, err)

	// Allocate port 9050
	_, err = registry.AllocatePort(ctx, AllocatePortRequest{
		RouterID:    routerID,
		InstanceID:  instanceID,
		ServiceType: "tor",
		Protocol:    "TCP",
	})
	require.NoError(t, err)

	// Manually try to allocate same port (bypassing auto-increment)
	// This simulates a conflict scenario
	_, err = client.PortAllocation.Create().
		SetRouterID(routerID).
		SetPort(9050).
		SetProtocol(portallocation.ProtocolTCP).
		SetInstanceID(instanceID).
		SetServiceType("tor").
		Save(ctx)

	// Should fail due to unique constraint
	require.Error(t, err)
	assert.Contains(t, err.Error(), "constraint")
}

// TestPortRegistry_IsPortAvailable tests port availability checks.
func TestPortRegistry_IsPortAvailable(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	routerID, instanceID := setupTestData(t, ctx, client)

	registry, err := NewPortRegistry(PortRegistryConfig{
		Store: &entStoreAdapter{client: client},
	})
	require.NoError(t, err)

	t.Run("unallocated port is available", func(t *testing.T) {
		available := registry.IsPortAvailable(ctx, routerID, 9999, "TCP")
		assert.True(t, available)
	})

	t.Run("allocated port is not available", func(t *testing.T) {
		// Allocate port
		_, err := registry.AllocatePort(ctx, AllocatePortRequest{
			RouterID:    routerID,
			InstanceID:  instanceID,
			ServiceType: "tor",
			Protocol:    "TCP",
		})
		require.NoError(t, err)

		// Check availability
		available := registry.IsPortAvailable(ctx, routerID, 9050, "TCP")
		assert.False(t, available)
	})

	t.Run("reserved ports are not available", func(t *testing.T) {
		assert.False(t, registry.IsPortAvailable(ctx, routerID, 22, "TCP"))  // SSH
		assert.False(t, registry.IsPortAvailable(ctx, routerID, 80, "TCP"))  // HTTP
		assert.False(t, registry.IsPortAvailable(ctx, routerID, 443, "TCP")) // HTTPS
	})

	t.Run("same port different protocol is available", func(t *testing.T) {
		// Port 9050 TCP is allocated, but UDP should be available
		available := registry.IsPortAvailable(ctx, routerID, 9050, "UDP")
		assert.True(t, available)
	})

	t.Run("invalid port numbers return false", func(t *testing.T) {
		assert.False(t, registry.IsPortAvailable(ctx, routerID, 0, "TCP"))     // Too low
		assert.False(t, registry.IsPortAvailable(ctx, routerID, -1, "TCP"))    // Negative
		assert.False(t, registry.IsPortAvailable(ctx, routerID, 65536, "TCP")) // Too high
		assert.False(t, registry.IsPortAvailable(ctx, routerID, 99999, "TCP")) // Way too high
	})
}

// TestPortRegistry_ReleasePort tests port release functionality.
func TestPortRegistry_ReleasePort(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	routerID, instanceID := setupTestData(t, ctx, client)

	registry, err := NewPortRegistry(PortRegistryConfig{
		Store: &entStoreAdapter{client: client},
	})
	require.NoError(t, err)

	// Allocate port
	resp, err := registry.AllocatePort(ctx, AllocatePortRequest{
		RouterID:    routerID,
		InstanceID:  instanceID,
		ServiceType: "tor",
		Protocol:    "TCP",
	})
	require.NoError(t, err)

	// Verify port is allocated
	available := registry.IsPortAvailable(ctx, routerID, resp.Port, "TCP")
	assert.False(t, available)

	// Release port
	err = registry.ReleasePort(ctx, routerID, resp.Port, "TCP")
	require.NoError(t, err)

	// Verify port is now available
	available = registry.IsPortAvailable(ctx, routerID, resp.Port, "TCP")
	assert.True(t, available)

	// Verify cache is cleared
	cacheKey := registry.cacheKey(routerID, resp.Port, "TCP")
	registry.mu.RLock()
	_, exists := registry.cache[cacheKey]
	registry.mu.RUnlock()
	assert.False(t, exists)

	// Verify database record is deleted
	count, err := client.PortAllocation.Query().
		Where(portallocation.IDEQ(resp.AllocationID)).
		Count(ctx)
	require.NoError(t, err)
	assert.Equal(t, 0, count)
}

// TestPortRegistry_DetectOrphans tests orphan detection.
func TestPortRegistry_DetectOrphans(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	routerID, instanceID := setupTestData(t, ctx, client)

	registry, err := NewPortRegistry(PortRegistryConfig{
		Store: &entStoreAdapter{client: client},
	})
	require.NoError(t, err)

	// Allocate port
	_, err = registry.AllocatePort(ctx, AllocatePortRequest{
		RouterID:    routerID,
		InstanceID:  instanceID,
		ServiceType: "tor",
		Protocol:    "TCP",
	})
	require.NoError(t, err)

	// No orphans should be detected (instance exists and is not deleting)
	orphans, err := registry.DetectOrphans(ctx, routerID)
	require.NoError(t, err)
	assert.Len(t, orphans, 0)

	// Delete the service instance (need to clear port allocations first due to foreign key)
	// First, delete allocations to avoid FK constraint
	_, err = client.PortAllocation.Delete().
		Where(portallocation.InstanceIDEQ(instanceID)).
		Exec(ctx)
	require.NoError(t, err)

	// Now delete the instance
	err = client.ServiceInstance.DeleteOneID(instanceID).Exec(ctx)
	require.NoError(t, err)

	// Recreate allocation manually as orphan (without valid instance)
	// We need to create a deleted instance first to satisfy FK, then delete it
	deletedInstanceID := ulid.NewString()
	_, err = client.ServiceInstance.Create().
		SetID(deletedInstanceID).
		SetFeatureID("tor").
		SetInstanceName("deleted-instance").
		SetRouterID(routerID).
		SetStatus(serviceinstance.StatusDeleting). // Mark as deleting
		Save(ctx)
	require.NoError(t, err)

	// Create allocation pointing to this deleting instance
	_, err = client.PortAllocation.Create().
		SetID(ulid.NewString()).
		SetRouterID(routerID).
		SetPort(9050).
		SetProtocol(portallocation.ProtocolTCP).
		SetInstanceID(deletedInstanceID).
		SetServiceType("tor").
		Save(ctx)
	require.NoError(t, err)

	// Now orphan should be detected
	orphans, err = registry.DetectOrphans(ctx, routerID)
	require.NoError(t, err)
	assert.Len(t, orphans, 1)
	assert.Equal(t, deletedInstanceID, orphans[0].GetInstanceID())
}

// TestPortRegistry_CleanupOrphans tests orphan cleanup.
func TestPortRegistry_CleanupOrphans(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	routerID, instanceID := setupTestData(t, ctx, client)

	registry, err := NewPortRegistry(PortRegistryConfig{
		Store: &entStoreAdapter{client: client},
	})
	require.NoError(t, err)

	// Allocate two ports
	resp1, err := registry.AllocatePort(ctx, AllocatePortRequest{
		RouterID:    routerID,
		InstanceID:  instanceID,
		ServiceType: "tor",
		Protocol:    "TCP",
	})
	require.NoError(t, err)

	resp2, err := registry.AllocatePort(ctx, AllocatePortRequest{
		RouterID:    routerID,
		InstanceID:  instanceID,
		ServiceType: "tor",
		Protocol:    "UDP",
	})
	require.NoError(t, err)

	// Delete the service instance and recreate as orphans
	// First clear existing allocations due to FK constraint
	_, err = client.PortAllocation.Delete().
		Where(portallocation.InstanceIDEQ(instanceID)).
		Exec(ctx)
	require.NoError(t, err)

	// Delete instance
	err = client.ServiceInstance.DeleteOneID(instanceID).Exec(ctx)
	require.NoError(t, err)

	// Create orphaned allocations pointing to deleting instance
	deletedInstanceID := ulid.NewString()
	_, err = client.ServiceInstance.Create().
		SetID(deletedInstanceID).
		SetFeatureID("tor").
		SetInstanceName("deleted-instance").
		SetRouterID(routerID).
		SetStatus(serviceinstance.StatusDeleting). // Mark as deleting
		Save(ctx)
	require.NoError(t, err)

	// Create orphaned allocations
	_, err = client.PortAllocation.Create().
		SetID(ulid.NewString()).
		SetRouterID(routerID).
		SetPort(resp1.Port).
		SetProtocol(portallocation.ProtocolTCP).
		SetInstanceID(deletedInstanceID).
		SetServiceType("tor").
		Save(ctx)
	require.NoError(t, err)

	_, err = client.PortAllocation.Create().
		SetID(ulid.NewString()).
		SetRouterID(routerID).
		SetPort(resp2.Port).
		SetProtocol(portallocation.ProtocolUDP).
		SetInstanceID(deletedInstanceID).
		SetServiceType("tor").
		Save(ctx)
	require.NoError(t, err)

	// Cleanup orphans
	cleanedCount, err := registry.CleanupOrphans(ctx, routerID)
	require.NoError(t, err)
	assert.Equal(t, 2, cleanedCount)

	// Verify allocations are deleted from database
	count, err := client.PortAllocation.Query().Count(ctx)
	require.NoError(t, err)
	assert.Equal(t, 0, count)

	// Verify cache is cleared
	registry.mu.RLock()
	cacheLen := len(registry.cache)
	registry.mu.RUnlock()
	assert.Equal(t, 0, cacheLen)

	// Verify ports are now available
	assert.True(t, registry.IsPortAvailable(ctx, routerID, resp1.Port, "TCP"))
	assert.True(t, registry.IsPortAvailable(ctx, routerID, resp2.Port, "UDP"))
}

// TestPortRegistry_PortExhaustion tests behavior when available ports are exhausted.
func TestPortRegistry_PortExhaustion(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	routerID, _ := setupTestData(t, ctx, client)

	// Custom registry with very small port range for testing
	customReserved := make([]int, 0)
	for i := 1; i < 1024; i++ {
		customReserved = append(customReserved, i)
	}
	// Only allow ports 10000-10005 (6 ports)
	registry, err := NewPortRegistry(PortRegistryConfig{
		Store:         &entStoreAdapter{client: client},
		ReservedPorts: customReserved,
	})
	require.NoError(t, err)

	// Create 7 service instances for allocation
	var instanceIDs []string
	for i := 0; i < 7; i++ {
		instanceID := ulid.NewString()
		_, err := client.ServiceInstance.Create().
			SetID(instanceID).
			SetFeatureID("tor").
			SetInstanceName(fmt.Sprintf("tor-instance-%d", i)).
			SetRouterID(routerID).
			SetStatus(serviceinstance.StatusInstalled).
			Save(ctx)
		require.NoError(t, err)
		instanceIDs = append(instanceIDs, instanceID)
	}

	// Allocate ports until exhaustion
	allocCount := 0
	for i := 0; i < 7; i++ {
		resp, err := registry.AllocatePort(ctx, AllocatePortRequest{
			RouterID:    routerID,
			InstanceID:  instanceIDs[i],
			ServiceType: "tor",
			Protocol:    "TCP",
		})

		if err == nil {
			allocCount++
			assert.True(t, resp.Port >= 10000 && resp.Port <= 65535, "port %d out of expected range", resp.Port)
		}
	}

	// Should have allocated some ports before exhaustion
	assert.Greater(t, allocCount, 0, "should allocate at least one port")
	assert.Less(t, allocCount, 7, "should eventually exhaust available ports")
}

// TestPortRegistry_ConcurrentAllocations tests thread safety with concurrent allocations.
func TestPortRegistry_ConcurrentAllocations(t *testing.T) {
	ctx := context.Background()

	client := openTestClient(t)
	defer client.Close()

	err := client.Schema.Create(ctx)
	require.NoError(t, err)

	routerID, _ := setupTestData(t, ctx, client)

	registry, err := NewPortRegistry(PortRegistryConfig{
		Store: &entStoreAdapter{client: client},
	})
	require.NoError(t, err)

	// Create 10 service instances for concurrent allocation
	var instanceIDs []string
	for i := 0; i < 10; i++ {
		instanceID := ulid.NewString()
		_, err := client.ServiceInstance.Create().
			SetID(instanceID).
			SetFeatureID("tor").
			SetInstanceName(fmt.Sprintf("tor-instance-%d", i)).
			SetRouterID(routerID).
			SetStatus(serviceinstance.StatusInstalled).
			Save(ctx)
		require.NoError(t, err)
		instanceIDs = append(instanceIDs, instanceID)
	}

	// Allocate ports concurrently
	var wg sync.WaitGroup
	results := make(chan *AllocatePortResponse, 10)
	errors := make(chan error, 10)

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()

			resp, err := registry.AllocatePort(ctx, AllocatePortRequest{
				RouterID:    routerID,
				InstanceID:  instanceIDs[idx],
				ServiceType: "tor",
				Protocol:    "TCP",
			})

			if err != nil {
				errors <- err
				return
			}

			results <- resp
		}(i)
	}

	wg.Wait()
	close(results)
	close(errors)

	// Verify no errors
	var errList []error
	for err := range errors {
		errList = append(errList, err)
	}
	assert.Len(t, errList, 0, "expected no errors, got: %v", errList)

	// Verify all ports are unique
	allocatedPorts := make(map[int]bool)
	for resp := range results {
		assert.False(t, allocatedPorts[resp.Port], "duplicate port allocated: %d", resp.Port)
		allocatedPorts[resp.Port] = true
	}

	assert.Len(t, allocatedPorts, 10, "expected 10 unique ports")

	// Verify all allocations are in database
	count, err := client.PortAllocation.Query().Count(ctx)
	require.NoError(t, err)
	assert.Equal(t, 10, count)
}
