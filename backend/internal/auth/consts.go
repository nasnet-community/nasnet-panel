package auth

import (
	"errors"
	"time"
)

// Token settings.
const (
	BearerScheme    = "Bearer"
	SessionTTL      = 8 * time.Hour
	SigningKeyBytes = 32
)

var (
	// ErrInvalidBearerFormat indicates invalid Authorization header format for a token.
	ErrInvalidBearerFormat = errors.New("invalid Authorization header format, expected 'Bearer <token>'")
	// ErrInvalidToken indicates a token that is malformed, expired or not signed by this server.
	ErrInvalidToken = errors.New("invalid or expired token")
	// ErrSessionNotFound indicates a valid token whose session was revoked or lost on restart.
	ErrSessionNotFound = errors.New("session not found, log in again")
	// ErrMissingAuth indicates missing Authorization header.
	ErrMissingAuth = errors.New("missing Authorization header")
)
