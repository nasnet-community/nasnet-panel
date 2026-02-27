// Package middleware provides HTTP middleware for the NasNetConnect backend.
package middleware

import (
	"context"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/oklog/ulid/v2"

	internalerrors "backend/internal/apperrors"
)

const (
	// RequestIDHeader is the HTTP header for request correlation ID.
	RequestIDHeader = "X-Request-ID"
	// RequestIDLogKey is the log field key for request ID.
	RequestIDLogKey = "request_id"
)

// entropy and entropyMu provide thread-safe ULID generation.
//
//nolint:gosec // request ID does not need cryptographically random entropy
var (
	entropyMu sync.Mutex
	entropy   = ulid.Monotonic(rand.New(rand.NewSource(time.Now().UnixNano())), 0)
)

// GenerateRequestID creates a new ULID-based request ID.
// ULIDs are time-sortable and globally unique.
func GenerateRequestID() string {
	entropyMu.Lock()
	defer entropyMu.Unlock()
	return ulid.MustNew(ulid.Timestamp(time.Now()), entropy).String()
}

// RequestIDMiddleware returns an HTTP middleware that adds request correlation IDs.
// It extracts an existing request ID from the X-Request-ID header or generates a new one.
func RequestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Recover from panics to prevent crashes
		defer func() {
			if rec := recover(); rec != nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				// Log panic but don't expose details
				_ = rec
			}
		}()

		// Check for existing request ID in header
		requestID := r.Header.Get(RequestIDHeader)
		if requestID == "" {
			requestID = GenerateRequestID()
		}

		// Add request ID to response header
		w.Header().Set(RequestIDHeader, requestID)

		// Add request ID to context
		ctx := internalerrors.WithRequestID(r.Context(), requestID)

		// Continue with updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequestIDFromContext extracts the request ID from context.
func RequestIDFromContext(ctx context.Context) string {
	return internalerrors.GetRequestID(ctx)
}

// WithRequestID adds a request ID to the context.
// This is useful for propagating request IDs to background operations.
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return internalerrors.WithRequestID(ctx, requestID)
}

// ProductionModeMiddleware returns an HTTP middleware that sets production mode in context.
func ProductionModeMiddleware(production bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Recover from panics to prevent crashes
			defer func() {
				if rec := recover(); rec != nil {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusInternalServerError)
					_ = rec
				}
			}()

			ctx := internalerrors.WithProductionMode(r.Context(), production)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// ChainMiddleware chains multiple HTTP middlewares together.
func ChainMiddleware(middlewares ...func(http.Handler) http.Handler) func(http.Handler) http.Handler {
	return func(final http.Handler) http.Handler {
		for i := len(middlewares) - 1; i >= 0; i-- {
			final = middlewares[i](final)
		}
		return final
	}
}
