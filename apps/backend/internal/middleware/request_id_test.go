package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	internalerrors "backend/internal/errors"
)

// =============================================================================
// GenerateRequestID Tests
// =============================================================================

func TestGenerateRequestID_ReturnsULID(t *testing.T) {
	id := GenerateRequestID()

	// ULID is 26 characters
	assert.Len(t, id, 26)
	// ULID uses base32 encoding (uppercase letters and digits 0-9, excluding I, L, O, U)
	for _, c := range id {
		assert.True(t, isValidULIDChar(c), "Invalid ULID character: %c", c)
	}
}

func TestGenerateRequestID_IsUnique(t *testing.T) {
	ids := make(map[string]bool)

	// Generate 1000 IDs and ensure uniqueness
	for i := 0; i < 1000; i++ {
		id := GenerateRequestID()
		assert.False(t, ids[id], "Duplicate request ID generated: %s", id)
		ids[id] = true
	}
}

func isValidULIDChar(c rune) bool {
	// ULID uses Crockford's Base32: 0123456789ABCDEFGHJKMNPQRSTVWXYZ
	valid := "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
	for _, v := range valid {
		if c == v {
			return true
		}
	}
	return false
}

// =============================================================================
// RequestIDMiddleware Tests
// =============================================================================

func TestRequestIDMiddleware_GeneratesID(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request ID is in context
		requestID := RequestIDFromContext(r.Context())
		assert.NotEmpty(t, requestID)
		assert.Len(t, requestID, 26)
		w.WriteHeader(http.StatusOK)
	})

	middleware := RequestIDMiddleware(handler)
	req := httptest.NewRequest("GET", "/test", nil)
	rec := httptest.NewRecorder()

	middleware.ServeHTTP(rec, req)

	// Verify request ID is in response header
	respID := rec.Header().Get(RequestIDHeader)
	assert.NotEmpty(t, respID)
	assert.Len(t, respID, 26)
}

func TestRequestIDMiddleware_PreservesExistingID(t *testing.T) {
	existingID := "01ARZ3NDEKTSV4RRFFQ69G5FAV" // Valid ULID

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify the existing ID was preserved
		requestID := RequestIDFromContext(r.Context())
		assert.Equal(t, existingID, requestID)
		w.WriteHeader(http.StatusOK)
	})

	middleware := RequestIDMiddleware(handler)
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set(RequestIDHeader, existingID)
	rec := httptest.NewRecorder()

	middleware.ServeHTTP(rec, req)

	// Verify same ID is in response
	respID := rec.Header().Get(RequestIDHeader)
	assert.Equal(t, existingID, respID)
}

func TestRequestIDMiddleware_PropagatesContext(t *testing.T) {
	var capturedID string

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedID = RequestIDFromContext(r.Context())
		w.WriteHeader(http.StatusOK)
	})

	middleware := RequestIDMiddleware(handler)
	req := httptest.NewRequest("GET", "/test", nil)
	rec := httptest.NewRecorder()

	middleware.ServeHTTP(rec, req)

	// Response header should match captured context ID
	assert.Equal(t, rec.Header().Get(RequestIDHeader), capturedID)
}

// =============================================================================
// RequestIDFromContext Tests
// =============================================================================

func TestRequestIDFromContext_WithID(t *testing.T) {
	ctx := internalerrors.WithRequestID(context.Background(), "test-id-123")
	id := RequestIDFromContext(ctx)
	assert.Equal(t, "test-id-123", id)
}

func TestRequestIDFromContext_WithoutID(t *testing.T) {
	ctx := context.Background()
	id := RequestIDFromContext(ctx)
	assert.Empty(t, id)
}

// =============================================================================
// WithRequestID Tests
// =============================================================================

func TestWithRequestID(t *testing.T) {
	ctx := WithRequestID(context.Background(), "custom-id-456")
	id := RequestIDFromContext(ctx)
	assert.Equal(t, "custom-id-456", id)
}

// =============================================================================
// ProductionModeMiddleware Tests
// =============================================================================

func TestProductionModeMiddleware_SetsTrue(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		isProd := internalerrors.IsProductionMode(r.Context())
		assert.True(t, isProd)
		w.WriteHeader(http.StatusOK)
	})

	middleware := ProductionModeMiddleware(true)(handler)
	req := httptest.NewRequest("GET", "/test", nil)
	rec := httptest.NewRecorder()

	middleware.ServeHTTP(rec, req)
}

func TestProductionModeMiddleware_SetsFalse(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		isProd := internalerrors.IsProductionMode(r.Context())
		assert.False(t, isProd)
		w.WriteHeader(http.StatusOK)
	})

	middleware := ProductionModeMiddleware(false)(handler)
	req := httptest.NewRequest("GET", "/test", nil)
	rec := httptest.NewRecorder()

	middleware.ServeHTTP(rec, req)
}

// =============================================================================
// ChainMiddleware Tests
// =============================================================================

func TestChainMiddleware_OrderOfExecution(t *testing.T) {
	var order []int

	middleware1 := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			order = append(order, 1)
			next.ServeHTTP(w, r)
		})
	}

	middleware2 := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			order = append(order, 2)
			next.ServeHTTP(w, r)
		})
	}

	middleware3 := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			order = append(order, 3)
			next.ServeHTTP(w, r)
		})
	}

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		order = append(order, 4) // Final handler
		w.WriteHeader(http.StatusOK)
	})

	chained := ChainMiddleware(middleware1, middleware2, middleware3)(handler)
	req := httptest.NewRequest("GET", "/test", nil)
	rec := httptest.NewRecorder()

	chained.ServeHTTP(rec, req)

	// Middlewares should execute in order: 1, 2, 3, 4
	require.Len(t, order, 4)
	assert.Equal(t, []int{1, 2, 3, 4}, order)
}

func TestChainMiddleware_EmptyChain(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	chained := ChainMiddleware()(handler)
	req := httptest.NewRequest("GET", "/test", nil)
	rec := httptest.NewRecorder()

	chained.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestChainMiddleware_CombinesRequestIDAndProductionMode(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		requestID := RequestIDFromContext(ctx)
		isProd := internalerrors.IsProductionMode(ctx)

		assert.NotEmpty(t, requestID)
		assert.True(t, isProd)
		w.WriteHeader(http.StatusOK)
	})

	chained := ChainMiddleware(
		RequestIDMiddleware,
		ProductionModeMiddleware(true),
	)(handler)

	req := httptest.NewRequest("GET", "/test", nil)
	rec := httptest.NewRecorder()

	chained.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	assert.NotEmpty(t, rec.Header().Get(RequestIDHeader))
}

// =============================================================================
// Integration Tests
// =============================================================================

func TestRequestID_EndToEndFlow(t *testing.T) {
	// Simulate a full request flow
	var capturedRequestID string

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedRequestID = RequestIDFromContext(r.Context())

		// Simulate error logging with request ID
		ctx := r.Context()
		err := internalerrors.NewValidationError("field", "value", "constraint")

		// Verify we can extract request ID for error context
		loggedRequestID := internalerrors.GetRequestID(ctx)
		assert.Equal(t, capturedRequestID, loggedRequestID)

		w.WriteHeader(http.StatusBadRequest)
		_ = err // Error would be logged here
	})

	chained := ChainMiddleware(
		RequestIDMiddleware,
		ProductionModeMiddleware(false),
	)(handler)

	req := httptest.NewRequest("POST", "/api/resource", nil)
	rec := httptest.NewRecorder()

	chained.ServeHTTP(rec, req)

	// Verify response has request ID
	responseRequestID := rec.Header().Get(RequestIDHeader)
	assert.NotEmpty(t, responseRequestID)
	assert.Equal(t, capturedRequestID, responseRequestID)
}

// =============================================================================
// Concurrency Tests
// =============================================================================

func TestGenerateRequestID_ConcurrentGeneration(t *testing.T) {
	const numGoroutines = 100
	const idsPerGoroutine = 10

	idsChan := make(chan string, numGoroutines*idsPerGoroutine)
	done := make(chan struct{})

	// Generate IDs concurrently
	for i := 0; i < numGoroutines; i++ {
		go func() {
			for j := 0; j < idsPerGoroutine; j++ {
				idsChan <- GenerateRequestID()
			}
			done <- struct{}{}
		}()
	}

	// Wait for all goroutines to finish
	for i := 0; i < numGoroutines; i++ {
		<-done
	}
	close(idsChan)

	// Verify all IDs are unique
	ids := make(map[string]bool)
	count := 0
	for id := range idsChan {
		assert.False(t, ids[id], "Duplicate ID generated under concurrency: %s", id)
		ids[id] = true
		count++
	}
	assert.Equal(t, numGoroutines*idsPerGoroutine, count)
}

func TestRequestIDMiddleware_ConcurrentRequests(t *testing.T) {
	const numRequests = 50

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := RequestIDFromContext(r.Context())
		assert.NotEmpty(t, requestID)
		w.WriteHeader(http.StatusOK)
	})

	middleware := RequestIDMiddleware(handler)

	// Simulate concurrent requests
	done := make(chan struct{}, numRequests)
	for i := 0; i < numRequests; i++ {
		go func() {
			req := httptest.NewRequest("GET", "/test", nil)
			rec := httptest.NewRecorder()
			middleware.ServeHTTP(rec, req)
			assert.Equal(t, http.StatusOK, rec.Code)
			done <- struct{}{}
		}()
	}

	// Wait for all requests to complete
	for i := 0; i < numRequests; i++ {
		<-done
	}
}
