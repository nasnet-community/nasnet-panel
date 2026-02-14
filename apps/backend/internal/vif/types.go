// Package vif implements the Virtual Interface Factory pattern for transforming
// service instances into routable network interfaces on MikroTik routers.
package vif

import (
	"context"
	"fmt"
	"sync"
)

// VLANAllocator manages allocation and release of VLAN IDs for virtual interfaces.
type VLANAllocator interface {
	Allocate(ctx context.Context) (int, error)
	Release(ctx context.Context, id int) error
}

// SimpleVLANAllocator is a sequential allocator that maintains VLAN ID availability in memory.
// Note: This is a simple implementation for MVP. Story 8.18 will replace this with a
// persistent, database-backed allocator.
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
func (a *SimpleVLANAllocator) Allocate(ctx context.Context) (int, error) {
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
func (a *SimpleVLANAllocator) Release(ctx context.Context, id int) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	delete(a.used, id)
	return nil
}
