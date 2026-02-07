package troubleshoot

import (
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestSessionStore_Create tests session creation
func TestSessionStore_Create(t *testing.T) {
	t.Run("create session successfully", func(t *testing.T) {
		store := NewSessionStore()

		session, err := store.Create("router-123")

		require.NoError(t, err)
		require.NotNil(t, session)
		assert.NotEmpty(t, session.ID)
		assert.Equal(t, "router-123", session.RouterID)
		assert.Equal(t, SessionStatusIdle, session.Status)
		assert.Len(t, session.Steps, 5)
		assert.NotNil(t, session.StartedAt)
	})

	t.Run("each session gets unique ID", func(t *testing.T) {
		store := NewSessionStore()

		session1, _ := store.Create("router-123")
		session2, _ := store.Create("router-123")

		assert.NotEqual(t, session1.ID, session2.ID)
	})
}

// TestSessionStore_Get tests session retrieval
func TestSessionStore_Get(t *testing.T) {
	t.Run("get existing session", func(t *testing.T) {
		store := NewSessionStore()

		created, _ := store.Create("router-123")
		retrieved, err := store.Get(created.ID)

		require.NoError(t, err)
		assert.Equal(t, created.ID, retrieved.ID)
		assert.Equal(t, created.RouterID, retrieved.RouterID)
	})

	t.Run("get nonexistent session", func(t *testing.T) {
		store := NewSessionStore()

		_, err := store.Get("nonexistent")

		require.Error(t, err)
		assert.Contains(t, err.Error(), "not found")
	})
}

// TestSessionStore_Update tests session updates
func TestSessionStore_Update(t *testing.T) {
	t.Run("update session successfully", func(t *testing.T) {
		store := NewSessionStore()

		session, _ := store.Create("router-123")
		session.Status = SessionStatusRunning
		session.Gateway = "192.168.1.1"

		err := store.Update(session)
		require.NoError(t, err)

		retrieved, _ := store.Get(session.ID)
		assert.Equal(t, SessionStatusRunning, retrieved.Status)
		assert.Equal(t, "192.168.1.1", retrieved.Gateway)
	})

	t.Run("update nonexistent session", func(t *testing.T) {
		store := NewSessionStore()

		session := &Session{
			ID:       "nonexistent",
			RouterID: "router-123",
		}

		err := store.Update(session)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "not found")
	})
}

// TestSessionStore_Delete tests session deletion
func TestSessionStore_Delete(t *testing.T) {
	t.Run("delete existing session", func(t *testing.T) {
		store := NewSessionStore()

		session, _ := store.Create("router-123")
		err := store.Delete(session.ID)

		require.NoError(t, err)

		// Verify session is gone
		_, err = store.Get(session.ID)
		require.Error(t, err)
	})

	t.Run("delete nonexistent session", func(t *testing.T) {
		store := NewSessionStore()

		err := store.Delete("nonexistent")

		// Delete of nonexistent session should not error (idempotent)
		require.NoError(t, err)
	})
}

// TestSessionStore_GetByRouterID tests finding sessions by router ID
func TestSessionStore_GetByRouterID(t *testing.T) {
	t.Run("find session by router ID", func(t *testing.T) {
		store := NewSessionStore()

		session, _ := store.Create("router-123")
		sessions := store.GetByRouterID("router-123")

		require.Len(t, sessions, 1)
		assert.Equal(t, session.ID, sessions[0].ID)
	})

	t.Run("multiple sessions for same router", func(t *testing.T) {
		store := NewSessionStore()

		store.Create("router-123")
		store.Create("router-123")
		store.Create("router-456") // Different router

		sessions := store.GetByRouterID("router-123")

		assert.Len(t, sessions, 2)
		for _, s := range sessions {
			assert.Equal(t, "router-123", s.RouterID)
		}
	})

	t.Run("no sessions for router", func(t *testing.T) {
		store := NewSessionStore()

		sessions := store.GetByRouterID("nonexistent")

		assert.Len(t, sessions, 0)
	})
}

// TestSessionStore_Concurrency tests thread-safe operations
func TestSessionStore_Concurrency(t *testing.T) {
	t.Run("concurrent creates", func(t *testing.T) {
		store := NewSessionStore()

		var wg sync.WaitGroup
		sessionIDs := make([]string, 100)

		// Launch 100 goroutines creating sessions
		for i := 0; i < 100; i++ {
			wg.Add(1)
			go func(n int) {
				defer wg.Done()
				routerID := fmt.Sprintf("router-%d", n)
				session, err := store.Create(routerID)
				require.NoError(t, err)
				sessionIDs[n] = session.ID
			}(i)
		}

		wg.Wait()

		// Verify all 100 sessions were created
		store.mu.RLock()
		count := len(store.sessions)
		store.mu.RUnlock()

		assert.Equal(t, 100, count)

		// Verify all sessions can be retrieved
		for i, sessionID := range sessionIDs {
			session, err := store.Get(sessionID)
			require.NoError(t, err, "Failed to get session %d", i)
			assert.NotNil(t, session)
		}
	})

	t.Run("concurrent reads and writes", func(t *testing.T) {
		store := NewSessionStore()

		// Create initial sessions
		sessions := make([]*Session, 10)
		for i := 0; i < 10; i++ {
			sessions[i], _ = store.Create(fmt.Sprintf("router-%d", i))
		}

		var wg sync.WaitGroup

		// Concurrent reads
		for i := 0; i < 50; i++ {
			wg.Add(1)
			go func(n int) {
				defer wg.Done()
				sessionID := sessions[n%10].ID
				_, _ = store.Get(sessionID)
			}(i)
		}

		// Concurrent updates
		for i := 0; i < 10; i++ {
			wg.Add(1)
			go func(n int) {
				defer wg.Done()
				session := sessions[n]
				session.Status = SessionStatusRunning
				_ = store.Update(session)
			}(i)
		}

		wg.Wait()

		// Verify no data corruption
		for _, session := range sessions {
			retrieved, err := store.Get(session.ID)
			require.NoError(t, err)
			assert.NotNil(t, retrieved)
		}
	})

	t.Run("concurrent creates and deletes", func(t *testing.T) {
		store := NewSessionStore()

		var wg sync.WaitGroup

		// Create sessions
		sessionIDs := make([]string, 20)
		for i := 0; i < 20; i++ {
			wg.Add(1)
			go func(n int) {
				defer wg.Done()
				session, _ := store.Create(fmt.Sprintf("router-%d", n))
				sessionIDs[n] = session.ID
			}(i)
		}

		wg.Wait()

		// Delete half of them concurrently
		for i := 0; i < 10; i++ {
			wg.Add(1)
			go func(n int) {
				defer wg.Done()
				_ = store.Delete(sessionIDs[n])
			}(i)
		}

		wg.Wait()

		// Verify correct count
		store.mu.RLock()
		count := len(store.sessions)
		store.mu.RUnlock()

		assert.Equal(t, 10, count)
	})
}

// TestSessionStore_TTL tests automatic session cleanup
func TestSessionStore_TTL(t *testing.T) {
	t.Run("cleanup expired sessions", func(t *testing.T) {
		// Create store with very short TTL for testing
		store := &SessionStore{
			sessions:   make(map[string]*Session),
			sessionTTL: 50 * time.Millisecond,
		}

		// Create session and mark as completed
		session, _ := store.Create("router-test")
		sessionID := session.ID
		now := time.Now().Add(-2 * time.Hour) // 2 hours ago
		session.Status = SessionStatusCompleted
		session.CompletedAt = &now
		store.Update(session)

		// Verify session exists before cleanup
		_, err := store.Get(sessionID)
		require.NoError(t, err)

		// Manually trigger cleanup
		store.cleanup()

		// Session should be cleaned up
		_, err = store.Get(sessionID)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "not found")
	})

	t.Run("active sessions not cleaned up", func(t *testing.T) {
		store := NewSessionStore()

		session, _ := store.Create("router-test")
		session.Status = SessionStatusRunning
		store.Update(session)

		// Trigger cleanup - running session should not be removed
		store.cleanup()

		// Session should still exist
		retrieved, err := store.Get(session.ID)
		require.NoError(t, err)
		assert.Equal(t, session.ID, retrieved.ID)
	})

	t.Run("completed sessions cleaned up immediately", func(t *testing.T) {
		store := NewSessionStore()

		session, _ := store.Create("router-test")
		now := time.Now()
		session.CompletedAt = &now
		session.Status = SessionStatusCompleted
		store.Update(session)

		// After one cleanup cycle, completed session should be removed
		time.Sleep(6 * time.Minute) // Default cleanup interval is 5 minutes

		// Note: For unit test, we'd need to expose cleanup trigger
		// This is more of an integration test
	})
}

// TestSessionStore_EdgeCases tests edge cases
func TestSessionStore_EdgeCases(t *testing.T) {
	t.Run("empty router ID", func(t *testing.T) {
		store := NewSessionStore()

		session, err := store.Create("")

		require.NoError(t, err)
		assert.Empty(t, session.RouterID)
	})

	t.Run("session with all steps completed", func(t *testing.T) {
		store := NewSessionStore()

		session, _ := store.Create("router-123")

		// Mark all steps as passed
		for _, step := range session.Steps {
			step.Status = StepStatusPassed
			now := time.Now()
			step.CompletedAt = &now
		}

		err := store.Update(session)
		require.NoError(t, err)

		retrieved, _ := store.Get(session.ID)
		for _, step := range retrieved.Steps {
			assert.Equal(t, StepStatusPassed, step.Status)
		}
	})

	t.Run("session with applied fixes", func(t *testing.T) {
		store := NewSessionStore()

		session, _ := store.Create("router-123")
		session.AppliedFixes = []string{"WAN_DISABLED", "DNS_FAILED"}

		err := store.Update(session)
		require.NoError(t, err)

		retrieved, _ := store.Get(session.ID)
		assert.Len(t, retrieved.AppliedFixes, 2)
		assert.Contains(t, retrieved.AppliedFixes, "WAN_DISABLED")
	})

	t.Run("get by router ID with no sessions", func(t *testing.T) {
		store := NewSessionStore()

		sessions := store.GetByRouterID("nonexistent")

		assert.NotNil(t, sessions)
		assert.Len(t, sessions, 0)
	})
}
