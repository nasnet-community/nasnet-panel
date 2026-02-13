package firewall

import (
	"fmt"
	"sync"
	"time"
)

// RollbackStore manages rollback states with TTL
type RollbackStore struct {
	mu     sync.RWMutex
	states map[string]*RollbackState
}

// NewRollbackStore creates a new rollback store
func NewRollbackStore() *RollbackStore {
	store := &RollbackStore{
		states: make(map[string]*RollbackState),
	}

	// Start cleanup goroutine
	go store.cleanupExpired()

	return store
}

// Save stores a rollback state
func (s *RollbackStore) Save(id string, state *RollbackState) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.states[id] = state
}

// Get retrieves a rollback state
func (s *RollbackStore) Get(id string) (*RollbackState, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	state, exists := s.states[id]
	if !exists {
		return nil, fmt.Errorf("rollback state not found")
	}

	// Check expiration
	if time.Now().After(state.ExpiresAt) {
		return nil, fmt.Errorf("rollback state expired")
	}

	return state, nil
}

// Delete removes a rollback state
func (s *RollbackStore) Delete(id string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.states, id)
}

// cleanupExpired removes expired rollback states every minute
func (s *RollbackStore) cleanupExpired() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.mu.Lock()
		now := time.Now()

		for id, state := range s.states {
			if now.After(state.ExpiresAt) {
				delete(s.states, id)
			}
		}

		s.mu.Unlock()
	}
}
