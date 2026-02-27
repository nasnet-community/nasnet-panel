package troubleshoot

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"
)

// SessionStore manages troubleshooting sessions in memory.
// Thread-safe for concurrent access.
type SessionStore struct {
	mu         sync.RWMutex
	sessions   map[string]*Session
	sessionTTL time.Duration // TTL for completed sessions before cleanup
	stopChan   chan struct{} // Signal to stop the cleanup goroutine
	logger     *zap.Logger
}

// NewSessionStore creates a new session store.
func NewSessionStore() *SessionStore {
	logger := zap.L().Named("troubleshoot.SessionStore")
	store := &SessionStore{
		sessions:   make(map[string]*Session),
		sessionTTL: 1 * time.Hour, // Keep completed sessions for 1 hour
		stopChan:   make(chan struct{}),
		logger:     logger,
	}

	// Start background cleanup goroutine
	go store.cleanupLoop()

	return store
}

// Create creates a new troubleshooting session.
func (s *SessionStore) Create(routerID string) (*Session, error) {
	sessionID, err := generateSessionID()
	if err != nil {
		s.logger.Error("failed to generate session ID", zap.String("routerID", routerID), zap.Error(err))
		return nil, err
	}

	session := &Session{
		ID:               sessionID,
		RouterID:         routerID,
		Steps:            initializeSteps(),
		CurrentStepIndex: 0,
		Status:           SessionStatusIdle,
		AppliedFixes:     make([]string, 0),
		StartedAt:        time.Now(),
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.sessions[sessionID] = session
	return session, nil
}

// Get retrieves a session by ID.
func (s *SessionStore) Get(sessionID string) (*Session, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	session, exists := s.sessions[sessionID]
	if !exists {
		s.logger.Debug("session not found", zap.String("sessionID", sessionID))
		return nil, errors.New("session not found")
	}

	return session, nil
}

// Update updates a session (replaces the entire session object).
func (s *SessionStore) Update(session *Session) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.sessions[session.ID]; !exists {
		s.logger.Debug("attempted to update non-existent session", zap.String("sessionID", session.ID))
		return errors.New("session not found")
	}

	s.sessions[session.ID] = session
	return nil
}

// Delete removes a session from the store.
// Returns no error if session doesn't exist (idempotent operation).
func (s *SessionStore) Delete(sessionID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.sessions, sessionID)
	return nil
}

// GetByRouterID retrieves all active sessions for a router.
func (s *SessionStore) GetByRouterID(routerID string) []*Session {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var sessions []*Session
	for _, session := range s.sessions {
		if session.RouterID == routerID && session.Status != SessionStatusCompleted && session.Status != SessionStatusCanceled {
			sessions = append(sessions, session)
		}
	}

	return sessions
}

// cleanupLoop periodically removes expired completed sessions.
// Stops when stopChan is closed.
func (s *SessionStore) cleanupLoop() {
	ticker := time.NewTicker(15 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			s.cleanup()
		case <-s.stopChan:
			return
		}
	}
}

// Close stops the cleanup goroutine and releases resources.
func (s *SessionStore) Close() error {
	close(s.stopChan)
	return nil
}

// cleanup removes sessions that have been completed/canceled for longer than TTL.
func (s *SessionStore) cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for id, session := range s.sessions {
		if session.Status == SessionStatusCompleted || session.Status == SessionStatusCanceled {
			if session.CompletedAt != nil && now.Sub(*session.CompletedAt) > s.sessionTTL {
				delete(s.sessions, id)
			}
		}
	}
}

// generateSessionID generates a unique session ID.
func generateSessionID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("generate session id: %w", err)
	}
	return "ts_" + hex.EncodeToString(bytes), nil
}

// initializeSteps creates the initial set of diagnostic steps.
func initializeSteps() []*Step {
	return []*Step{
		{
			ID:          StepTypeWAN,
			Name:        "WAN Interface",
			Description: "Check physical connection",
			Status:      StepStatusPending,
		},
		{
			ID:          StepTypeGateway,
			Name:        "Gateway",
			Description: "Ping default gateway",
			Status:      StepStatusPending,
		},
		{
			ID:          StepTypeInternet,
			Name:        "Internet",
			Description: "Ping external server",
			Status:      StepStatusPending,
		},
		{
			ID:          StepTypeDNS,
			Name:        "DNS",
			Description: "Test name resolution",
			Status:      StepStatusPending,
		},
		{
			ID:          StepTypeNAT,
			Name:        "NAT",
			Description: "Verify masquerade rules",
			Status:      StepStatusPending,
		},
	}
}
