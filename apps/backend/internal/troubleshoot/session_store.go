package troubleshoot

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"time"
)

// SessionStore manages troubleshooting sessions in memory.
// Thread-safe for concurrent access.
type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*Session
	// TTL for completed sessions before cleanup
	sessionTTL time.Duration
}

// NewSessionStore creates a new session store.
func NewSessionStore() *SessionStore {
	store := &SessionStore{
		sessions:   make(map[string]*Session),
		sessionTTL: 1 * time.Hour, // Keep completed sessions for 1 hour
	}

	// Start background cleanup goroutine
	go store.cleanupLoop()

	return store
}

// Create creates a new troubleshooting session.
func (s *SessionStore) Create(routerID string) (*Session, error) {
	sessionID, err := generateSessionID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate session ID: %w", err)
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
		return nil, fmt.Errorf("session not found: %s", sessionID)
	}

	return session, nil
}

// Update updates a session (replaces the entire session object).
func (s *SessionStore) Update(session *Session) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.sessions[session.ID]; !exists {
		return fmt.Errorf("session not found: %s", session.ID)
	}

	s.sessions[session.ID] = session
	return nil
}

// Delete removes a session from the store.
func (s *SessionStore) Delete(sessionID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.sessions[sessionID]; !exists {
		return fmt.Errorf("session not found: %s", sessionID)
	}

	delete(s.sessions, sessionID)
	return nil
}

// GetByRouterID retrieves all active sessions for a router.
func (s *SessionStore) GetByRouterID(routerID string) []*Session {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var sessions []*Session
	for _, session := range s.sessions {
		if session.RouterID == routerID && session.Status != SessionStatusCompleted && session.Status != SessionStatusCancelled {
			sessions = append(sessions, session)
		}
	}

	return sessions
}

// cleanupLoop periodically removes expired completed sessions.
func (s *SessionStore) cleanupLoop() {
	ticker := time.NewTicker(15 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.cleanup()
	}
}

// cleanup removes sessions that have been completed/cancelled for longer than TTL.
func (s *SessionStore) cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for id, session := range s.sessions {
		if session.Status == SessionStatusCompleted || session.Status == SessionStatusCancelled {
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
		return "", err
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
