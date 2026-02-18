// Package network provides network resource management including VLAN allocation.
package network

import (
	"context"
	"errors"
	"log/slog"

	"backend/internal/events"
)

// TODO: Remove these stubs once GraphQL schema includes Vlan types (NAS-8.10)
type VlanFilter struct{}
type Vlan struct {
	VlanID int
	Name   string
}

// VlanServicePort defines the interface for VLAN service operations.
// This interface is used to avoid import cycles with the services package.
type VlanServicePort interface {
	// ListVlans fetches all VLAN interfaces from the router with optional filtering.
	ListVlans(ctx context.Context, routerID string, filter *VlanFilter) ([]*Vlan, error)
}

// VLANAllocatorConfig holds configuration for the VLAN allocator.
type VLANAllocatorConfig struct {
	// Store is the database port interface for database operations.
	Store StorePort

	// VlanService is used for router conflict detection (compose existing service).
	// Uses VlanServicePort interface to avoid import cycles.
	VlanService VlanServicePort

	// EventBus is used for emitting VLAN pool warning events.
	EventBus events.EventBus

	// Logger for structured logging.
	Logger *slog.Logger

	// PoolStart is the first VLAN ID in the allocation pool (default: 100).
	PoolStart int

	// PoolEnd is the last VLAN ID in the allocation pool (default: 199).
	PoolEnd int
}

// AllocateVLANRequest contains parameters for VLAN allocation.
type AllocateVLANRequest struct {
	RouterID    string
	InstanceID  string
	ServiceType string
}

// AllocateVLANResponse contains the result of VLAN allocation.
type AllocateVLANResponse struct {
	AllocationID string
	VlanID       int
	Subnet       string
}

// VLANPoolStatus represents the current state of the VLAN pool for a router.
type VLANPoolStatus struct {
	RouterID       string
	TotalVLANs     int
	AllocatedVLANs int
	AvailableVLANs int
	Utilization    float64
	ShouldWarn     bool // True if utilization > 80%
}

// Constants for GlobalSettings namespace and keys.
const (
	SettingsNamespace = "network"
	PoolStartKey      = "vlan_pool_start"
	PoolEndKey        = "vlan_pool_end"
	DefaultPoolStart  = 100
	DefaultPoolEnd    = 199
)

// Sentinel errors for VLAN allocation.
var (
	ErrPoolExhausted     = errors.New("VLAN pool exhausted (100-199). Release unused instances or expand pool")
	ErrInvalidRequest    = errors.New("invalid VLAN allocation request")
	ErrVLANNotFound      = errors.New("VLAN allocation not found")
	ErrInvalidPoolConfig = errors.New("invalid pool configuration")
)
