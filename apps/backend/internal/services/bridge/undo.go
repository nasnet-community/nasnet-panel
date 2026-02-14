package bridge

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// UndoStore manages operation undo state with 10-second TTL.
type UndoStore struct {
	mu          sync.RWMutex
	operations  map[string]*UndoOperation
	stopCleanup chan struct{}
}

// NewUndoStore creates a new undo store with automatic cleanup.
func NewUndoStore() *UndoStore {
	store := &UndoStore{
		operations:  make(map[string]*UndoOperation),
		stopCleanup: make(chan struct{}),
	}

	go store.cleanupExpired()

	return store
}

// Add stores an operation for undo with 10-second TTL.
func (s *UndoStore) Add(operationType, resourceType string, previousState interface{}) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	operationID := uuid.New().String()

	previousStateJSON, err := json.Marshal(previousState)
	if err != nil {
		return "", fmt.Errorf("failed to marshal previous state: %w", err)
	}

	s.operations[operationID] = &UndoOperation{
		ID:            operationID,
		Type:          operationType,
		ResourceType:  resourceType,
		PreviousState: previousStateJSON,
		ExpiresAt:     time.Now().Add(10 * time.Second),
	}

	return operationID, nil
}

// Get retrieves an operation by ID.
func (s *UndoStore) Get(operationID string) (*UndoOperation, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	op, ok := s.operations[operationID]
	if !ok {
		return nil, fmt.Errorf("operation not found or expired")
	}

	if time.Now().After(op.ExpiresAt) {
		return nil, fmt.Errorf("operation expired")
	}

	return op, nil
}

// Delete removes an operation from the store.
func (s *UndoStore) Delete(operationID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.operations, operationID)
}

// cleanupExpired runs periodically to remove expired operations.
func (s *UndoStore) cleanupExpired() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.mu.Lock()
			now := time.Now()
			for id, op := range s.operations {
				if now.After(op.ExpiresAt) {
					delete(s.operations, id)
				}
			}
			s.mu.Unlock()
		case <-s.stopCleanup:
			return
		}
	}
}

// Stop stops the cleanup goroutine.
func (s *UndoStore) Stop() {
	close(s.stopCleanup)
}
