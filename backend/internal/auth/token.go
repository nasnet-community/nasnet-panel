package auth

import (
	"crypto/rand"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// TokenClaims are the JWT claims: the router username is the subject and RouterOSHost is the rip claim.
type TokenClaims struct {
	RouterOSHost string `json:"rip"`
	jwt.RegisteredClaims
}

type session struct {
	password  string
	expiresAt time.Time
}

type sessionStore struct {
	mu       sync.Mutex
	sessions map[string]session
}

var (
	signingKey = newSigningKey()
	sessions   = &sessionStore{sessions: make(map[string]session)}
)

func newSigningKey() []byte {
	key := make([]byte, SigningKeyBytes)
	if _, err := rand.Read(key); err != nil {
		panic(err)
	}
	return key
}

// ExtractBearerToken returns the token of an Authorization header, with or without the "Bearer " prefix.
func ExtractBearerToken(authHeader string) (string, error) {
	token := strings.TrimSpace(authHeader)
	if token == "" {
		return "", ErrMissingAuth
	}

	if prefix := BearerScheme + " "; strings.HasPrefix(token, prefix) {
		token = strings.TrimSpace(strings.TrimPrefix(token, prefix))
	}
	if token == "" || strings.ContainsAny(token, " \t") {
		return "", ErrInvalidBearerFormat
	}

	return token, nil
}

// IssueToken signs a token for the router session and keeps the router password on the server.
func IssueToken(creds *Credentials) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(SessionTTL)
	id := uuid.NewString()

	claims := TokenClaims{
		RouterOSHost: creds.RouterOSHost,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   creds.Username,
			ID:        id,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(signingKey)
	if err != nil {
		return "", time.Time{}, err
	}

	sessions.mu.Lock()
	defer sessions.mu.Unlock()
	sessions.purgeExpiredLocked(now)
	sessions.sessions[id] = session{password: creds.Password, expiresAt: expiresAt}

	return signed, expiresAt, nil
}

// CredentialsFromToken verifies the token and returns the credentials of its session.
func CredentialsFromToken(tokenString string) (*Credentials, error) {
	claims := &TokenClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(*jwt.Token) (any, error) {
		return signingKey, nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithExpirationRequired())
	if err != nil || !token.Valid {
		return nil, ErrInvalidToken
	}

	if claims.ID == "" || claims.Subject == "" || claims.RouterOSHost == "" {
		return nil, ErrInvalidToken
	}

	sessions.mu.Lock()
	defer sessions.mu.Unlock()
	stored, ok := sessions.sessions[claims.ID]
	if !ok || time.Now().After(stored.expiresAt) {
		delete(sessions.sessions, claims.ID)
		return nil, ErrSessionNotFound
	}

	return &Credentials{
		Username:     claims.Subject,
		Password:     stored.password,
		RouterOSHost: claims.RouterOSHost,
		SessionID:    claims.ID,
	}, nil
}

// RevokeSession drops the stored session so its token stops working.
func RevokeSession(id string) {
	sessions.mu.Lock()
	defer sessions.mu.Unlock()
	delete(sessions.sessions, id)
}

// UpdateSessionPassword replaces the router password kept for the session after it was changed on the router.
func UpdateSessionPassword(id, password string) {
	sessions.mu.Lock()
	defer sessions.mu.Unlock()
	if stored, ok := sessions.sessions[id]; ok {
		stored.password = password
		sessions.sessions[id] = stored
	}
}

func (s *sessionStore) purgeExpiredLocked(now time.Time) {
	for id, stored := range s.sessions {
		if now.After(stored.expiresAt) {
			delete(s.sessions, id)
		}
	}
}
