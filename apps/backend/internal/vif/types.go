// Package vif implements the Virtual Interface Factory pattern for transforming
// service instances into routable network interfaces on MikroTik routers.
package vif

import (
	"context"
	"fmt"
	"sync"

	"backend/internal/network"
)

// VLANPurpose indicates whether a VLAN is used for ingress or egress traffic.
type VLANPurpose string

const (
	VLANPurposeIngress VLANPurpose = "ingress"
	VLANPurposeEgress  VLANPurpose = "egress"
	VLANPurposeLegacy  VLANPurpose = "" // backward compat, uses full pool
)

// VLANAllocator manages allocation and release of VLAN IDs for virtual interfaces.
// Allocate now accepts router/instance/service context required by the DB-backed allocator.
type VLANAllocator interface {
	Allocate(ctx context.Context, routerID, instanceID, serviceType string) (int, error)
	Release(ctx context.Context, routerID string, id int) error
}

// SimpleVLANAllocator is a sequential allocator that maintains VLAN ID availability in memory.
// Kept for unit testing. Production code uses NetworkVLANAllocatorAdapter.
type SimpleVLANAllocator struct {
	mu      sync.Mutex
	used    map[int]bool
	minID   int
	maxID   int
	current int
}

// NewSimpleVLANAllocator creates a new sequential VLAN allocator.
func NewSimpleVLANAllocator(minID, maxID int) *SimpleVLANAllocator {
	return &SimpleVLANAllocator{
		used:    make(map[int]bool),
		minID:   minID,
		maxID:   maxID,
		current: minID,
	}
}

// Allocate finds and reserves the next available VLAN ID.
// routerID, instanceID, and serviceType are accepted to satisfy the VLANAllocator interface
// but are not used by this in-memory implementation.
func (a *SimpleVLANAllocator) Allocate(ctx context.Context, _, _, _ string) (int, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	// Try each ID in the range once
	for i := 0; i < (a.maxID - a.minID + 1); i++ {
		candidate := a.current
		a.current++
		if a.current > a.maxID {
			a.current = a.minID
		}

		if !a.used[candidate] {
			a.used[candidate] = true
			return candidate, nil
		}
	}

	return 0, fmt.Errorf("no available VLAN IDs in range %d-%d", a.minID, a.maxID)
}

// Release frees a previously allocated VLAN ID.
// routerID is accepted to satisfy the VLANAllocator interface but is not used by this
// in-memory implementation.
func (a *SimpleVLANAllocator) Release(ctx context.Context, _ string, id int) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	delete(a.used, id)
	return nil
}

// NetworkVLANAllocatorAdapter wraps network.VLANAllocator to satisfy vif.VLANAllocator.
// It bridges the DB-backed allocator (which requires router/instance/service context)
// to the vif package interface.
type NetworkVLANAllocatorAdapter struct {
	inner *network.VLANAllocator
}

// NewNetworkVLANAllocatorAdapter creates an adapter wrapping the DB-backed allocator.
func NewNetworkVLANAllocatorAdapter(inner *network.VLANAllocator) *NetworkVLANAllocatorAdapter {
	return &NetworkVLANAllocatorAdapter{inner: inner}
}

// Allocate delegates to the DB-backed allocator with full context.
func (a *NetworkVLANAllocatorAdapter) Allocate(ctx context.Context, routerID, instanceID, serviceType string) (int, error) {
	resp, err := a.inner.AllocateVLAN(ctx, network.AllocateVLANRequest{
		RouterID:    routerID,
		InstanceID:  instanceID,
		ServiceType: serviceType,
	})
	if err != nil {
		return 0, fmt.Errorf("allocate vlan: %w", err)
	}
	return resp.VlanID, nil
}

// Release delegates to the DB-backed allocator.
func (a *NetworkVLANAllocatorAdapter) Release(ctx context.Context, routerID string, id int) error {
	if err := a.inner.ReleaseVLAN(ctx, routerID, id); err != nil {
		return fmt.Errorf("release vlan: %w", err)
	}
	return nil
}
