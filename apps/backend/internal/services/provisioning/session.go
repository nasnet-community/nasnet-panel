package provisioning

import (
	"context"
	"fmt"
	"time"

	"backend/internal/common/ulid"
	"backend/internal/provisioning/types"
)

// SessionStatus represents the lifecycle status of a provisioning session.
type SessionStatus string

const (
	SessionStatusDraft     SessionStatus = "draft"
	SessionStatusValidated SessionStatus = "validated"
	SessionStatusApplying  SessionStatus = "applying"
	SessionStatusApplied   SessionStatus = "applied"
	SessionStatusFailed    SessionStatus = "failed"
	SessionStatusDiscarded SessionStatus = "discarded"
)

// Session is a transient (in-memory) provisioning context for a single router.
type Session struct {
	ID             string
	RouterID       string
	Mode           types.Mode
	Resources      []SessionResource
	NetworksConfig map[string]interface{}
	CurrentStep    int
	Status         SessionStatus
	ErrorMessage   string
	CreatedAt      time.Time
	ExpiresAt      time.Time
}

// SessionResource holds a single decomposed resource and its typed configuration.
type SessionResource struct {
	ID            string
	ResourceType  string
	Configuration map[string]interface{}
	Relationships map[string]interface{}
}

// CreateSession creates a new provisioning session for the given router and StarState.
// The session starts in Draft status and expires after 1 hour.
func (s *Service) CreateSession(ctx context.Context, routerID string, input types.StarState) (*Session, error) {
	now := time.Now()
	session := &Session{
		ID:             ulid.NewString(),
		RouterID:       routerID,
		Mode:           input.Choose.Mode,
		Resources:      []SessionResource{},
		NetworksConfig: make(map[string]interface{}),
		Status:         SessionStatusDraft,
		CreatedAt:      now,
		ExpiresAt:      now.Add(time.Hour),
	}

	s.mu.Lock()
	s.sessions[session.ID] = session
	s.mu.Unlock()

	return session, nil
}

// GetSession retrieves a session by ID.
func (s *Service) GetSession(_ context.Context, sessionID string) (*Session, error) {
	s.mu.RLock()
	session, ok := s.sessions[sessionID]
	s.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("session %q not found", sessionID)
	}
	return session, nil
}

// DiscardSession marks a session as discarded, preventing further use.
func (s *Service) DiscardSession(_ context.Context, sessionID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, ok := s.sessions[sessionID]
	if !ok {
		return fmt.Errorf("session %q not found", sessionID)
	}
	session.Status = SessionStatusDiscarded
	return nil
}

// addResource is an internal helper to append a resource to a session.
// Callers must not hold s.mu when calling this.
func (s *Service) addResource(sessionID string, resource SessionResource) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, ok := s.sessions[sessionID]
	if !ok {
		return fmt.Errorf("session %q not found", sessionID)
	}
	session.Resources = append(session.Resources, resource)
	return nil
}

// AddResource is the public API for adding a resource to an existing session.
func (s *Service) AddResource(_ context.Context, sessionID string, resource SessionResource) error {
	return s.addResource(sessionID, resource)
}

// UpdateNetworksConfig sets the networks configuration map on an existing session.
func (s *Service) UpdateNetworksConfig(_ context.Context, sessionID string, networksConfig map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, ok := s.sessions[sessionID]
	if !ok {
		return fmt.Errorf("session %q not found", sessionID)
	}
	session.NetworksConfig = networksConfig
	return nil
}

// AdvanceStep increments the wizard step counter for the session.
func (s *Service) AdvanceStep(_ context.Context, sessionID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, ok := s.sessions[sessionID]
	if !ok {
		return fmt.Errorf("session %q not found", sessionID)
	}
	session.CurrentStep++
	return nil
}

// RetreatStep decrements the wizard step counter for the session (minimum 0).
func (s *Service) RetreatStep(_ context.Context, sessionID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, ok := s.sessions[sessionID]
	if !ok {
		return fmt.Errorf("session %q not found", sessionID)
	}
	if session.CurrentStep > 0 {
		session.CurrentStep--
	}
	return nil
}

// RemoveResource removes a resource by ID from an existing session.
func (s *Service) RemoveResource(_ context.Context, sessionID, resourceID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, ok := s.sessions[sessionID]
	if !ok {
		return fmt.Errorf("session %q not found", sessionID)
	}

	filtered := session.Resources[:0]
	for _, r := range session.Resources {
		if r.ID != resourceID {
			filtered = append(filtered, r)
		}
	}
	session.Resources = filtered
	return nil
}
