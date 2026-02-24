package firewall

import (
	"fmt"
	"sync"
	"time"
)

// RollbackStore manages rollback states with TTL
type RollbackStore struct {
	mu       sync.RWMutex
	states   map[string]*RollbackState
	maxSize  int // Maximum number of rollback states to keep
	done     chan struct{}
	stopOnce sync.Once
}

// MaxRollbackStates is the maximum number of concurrent rollback operations
const MaxRollbackStates = 100

// NewRollbackStore creates a new rollback store with bounded size
func NewRollbackStore() *RollbackStore {
	store := &RollbackStore{
		states:  make(map[string]*RollbackState),
		maxSize: MaxRollbackStates,
		done:    make(chan struct{}),
	}

	// Start cleanup goroutine
	go store.cleanupExpired()

	return store
}

// Save stores a rollback state, enforcing maximum size limit
func (s *RollbackStore) Save(id string, state *RollbackState) error {
	if state == nil {
		return fmt.Errorf("rollback state cannot be nil")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Check size limit before adding new state
	if len(s.states) >= s.maxSize && s.states[id] == nil {
		return fmt.Errorf("rollback store is full (max %d states)", s.maxSize)
	}

	s.states[id] = state
	return nil
}

// Get retrieves a rollback state
// Returns error if state not found or expired
func (s *RollbackStore) Get(id string) (*RollbackState, error) {
	s.mu.RLock()
	state, exists := s.states[id]
	s.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("rollback state not found")
	}

	// Check expiration without holding lock
	// Use a separate lock scope to minimize lock contention
	if time.Now().After(state.ExpiresAt) {
		// Remove expired state atomically
		s.mu.Lock()
		delete(s.states, id)
		s.mu.Unlock()
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

// cleanupExpired removes expired rollback states periodically
// Can be stopped by closing the store's done channel
func (s *RollbackStore) cleanupExpired() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-s.done:
			// Graceful shutdown signal received
			return
		case <-ticker.C:
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
}

// Close gracefully shuts down the store and stops cleanup goroutine
func (s *RollbackStore) Close() {
	s.stopOnce.Do(func() {
		close(s.done)
	})
}
