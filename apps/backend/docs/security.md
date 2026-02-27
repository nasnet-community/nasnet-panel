# Security
> Multi-layer security model: JWT RS256 authentication, bcrypt+NIST password policy, AES-256-GCM credential encryption, GraphQL directive-based authorization, and sensitive field redaction throughout.

**Packages:** `internal/auth/`, `internal/credentials/`, `internal/middleware/`, `internal/graphql/directives/`
**Key Files:** `auth/jwt.go`, `auth/password.go`, `auth/service.go`, `credentials/service.go`, `credentials/hooks.go`, `middleware/auth.go`, `internal/graphql/directives/directives.go`
**Prerequisites:** [See: 02-application-bootstrap.md §Auth Bootstrap], [See: 03-graphql-api.md §Directives]

---

## Overview

NasNet uses a defense-in-depth security model with four distinct layers:

```
Layer 1: HTTP Middleware (auth.go)
         Extracts and validates JWT → populates context
              |
Layer 2: GraphQL Directives (directives.go)
         @auth, @validate, @capability, @sensitive
              |
Layer 3: Service Layer (auth/service.go)
         Login, session management, password policy, audit logging
              |
Layer 4: Storage Layer (credentials/service.go + hooks.go)
         AES-256-GCM encryption at rest for router credentials
```

---

## Architecture

```
Client → Echo HTTP Server
             |
        [RequestIDMiddleware]   ← Adds ULID request ID to context
             |
        [ProductionModeMiddleware] ← Sets production mode flag
             |
        [AuthMiddleware]       ← Extracts JWT from Bearer / Cookie / API Key
             |                     Validates token + session
             |                     Populates context: AuthUser, Claims, SessionInfo
             v
        GraphQL Handler
             |
        [@auth directive]      ← Blocks unauthenticated or unauthorized fields
        [@validate directive]  ← Validates field values
        [@capability directive]← Checks router capabilities
        [@sensitive directive] ← Marks fields for redaction
             |
             v
        Resolver Methods
             |
        Auth Service           ← Login, logout, session validation
        Credential Service     ← Encrypt/decrypt router credentials
```

---

## Package Reference

### internal/auth

**Package:** `internal/auth/`

#### jwt.go - JWT Token Management

**Algorithm:** RS256 (RSA + SHA256) - asymmetric key signing. Private key signs tokens; public key validates them. The private key is never exposed to clients.

**Key Types:**

```go
// Roles (hierarchical)
type Role string
const (
    RoleAdmin    Role = "admin"    // All permissions
    RoleOperator Role = "operator" // All except admin-only operations
    RoleViewer   Role = "viewer"   // Read-only
)

func (r Role) HasPermission(required Role) bool
func (r Role) IsValid() bool
```

**Claims:**
```go
type Claims struct {
    jwt.RegisteredClaims              // id, iss, sub, iat, exp, nbf
    UserID    string `json:"uid"`     // User ULID
    Username  string `json:"username"`
    Role      string `json:"role"`    // "admin" | "operator" | "viewer"
    SessionID string `json:"sid"`     // Session ULID (for server-side revocation)
}
```

**JWTConfig:**
```go
type JWTConfig struct {
    PrivateKey       *rsa.PrivateKey
    PublicKey        *rsa.PublicKey
    TokenDuration    time.Duration  // Default: 1 hour
    SessionDuration  time.Duration  // Default: 7 days (maximum session age)
    SlideThreshold   time.Duration  // Default: 30 minutes (refresh window)
    Issuer           string         // Default: "nasnetconnect"
}
```

**JWTService:**
```go
type JWTService struct { config JWTConfig }

func NewJWTService(config JWTConfig) (*JWTService, error)
func NewJWTServiceFromEnv() (*JWTService, error)

func (s *JWTService) GenerateToken(input TokenInput) (string, time.Time, error)
func (s *JWTService) ValidateToken(tokenString string) (*Claims, error)
func (s *JWTService) ShouldRefresh(claims *Claims) bool
func (s *JWTService) RefreshToken(claims *Claims, sessionCreatedAt time.Time) (string, time.Time, error)
```

**Sliding Sessions:** If fewer than `SlideThreshold` remain until token expiry, the middleware automatically issues a new token. If the new token would exceed `SessionDuration`, it is capped at the session maximum. After `SessionDuration` total, the user must log in again.

**Key Loading from Environment:**
```
JWT_PRIVATE_KEY      or  JWT_PRIVATE_KEY_PATH
JWT_PUBLIC_KEY       or  JWT_PUBLIC_KEY_PATH
JWT_TOKEN_DURATION   (optional, e.g., "1h")
JWT_SESSION_DURATION (optional, e.g., "168h")
JWT_SLIDE_THRESHOLD  (optional, e.g., "30m")
```

Both PKCS#8 and PKCS#1 formats are accepted. Escaped newlines (`\n`) in env var values are handled automatically.

For development only:
```go
func GenerateKeyPair() (*rsa.PrivateKey, *rsa.PublicKey, error) // 2048-bit RSA
```

**Error Codes:**
```go
ErrCodeInvalidCredentials = "AUTH.INVALID_CREDENTIALS"
ErrCodeSessionExpired     = "AUTH.SESSION_EXPIRED"
ErrCodeTokenInvalid       = "AUTH.TOKEN_INVALID"
ErrCodeTokenExpired       = "AUTH.TOKEN_EXPIRED"
ErrCodeInsufficientRole   = "AUTH.INSUFFICIENT_ROLE"
ErrCodeRateLimited        = "AUTH.RATE_LIMITED"
```

---

#### password.go - Password Hashing and Policy

Implements [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) password guidelines:
- Minimum 8 characters, maximum 128 characters
- No mandatory complexity rules (no forced uppercase/symbols)
- Check against common/breached password list

```go
type PasswordPolicy struct {
    MinLength       int  // Default: 8
    MaxLength       int  // Default: 128
    CheckCommonList bool // Default: true
}

type PasswordService struct {
    policy          PasswordPolicy
    bcryptCost      int             // Default: 10 (~100ms per hash)
    commonPasswords map[string]struct{}
}

func NewPasswordService(policy PasswordPolicy) *PasswordService
func NewDefaultPasswordService() *PasswordService

func (ps *PasswordService) ValidatePassword(password string) error
func (ps *PasswordService) HashPassword(password string) (string, error)
func (ps *PasswordService) VerifyPassword(hash, password string) bool
func (ps *PasswordService) ChangePassword(currentHash, currentPassword, newPassword string) (string, error)
```

**bcrypt:** Cost factor 10, equivalent to ~100ms per hash. Includes automatic salt. `VerifyPassword` uses `bcrypt.CompareHashAndPassword` which is timing-safe by design.

**Common password list:** Loaded from embedded `common_passwords.txt`. Falls back to a built-in list of ~40 passwords including domain-specific entries (`nasnet`, `mikrotik`, `router`). Comparison is case-insensitive.

**Password error codes:**
```go
ErrCodePasswordTooShort = "AUTH.PASSWORD_TOO_SHORT"
ErrCodePasswordTooLong  = "AUTH.PASSWORD_TOO_LONG"
ErrCodePasswordCommon   = "AUTH.PASSWORD_COMMON"
ErrCodePasswordMismatch = "AUTH.PASSWORD_MISMATCH"
```

---

#### service.go - Auth Service Orchestration

`Service` coordinates login, session management, password changes, and audit logging.

```go
type Service struct {
    jwt      *JWTService
    password *PasswordService
    users    UserRepository
    sessions SessionRepository
    audit    AuditLogger
    logger   *zap.Logger
}

func NewService(config Config) (*Service, error)
```

**UserRepository interface:**
```go
type UserRepository interface {
    GetByID(ctx context.Context, id string) (*User, error)
    GetByUsername(ctx context.Context, username string) (*User, error)
    Create(ctx context.Context, user *User) error
    Update(ctx context.Context, user *User) error
    UpdateLastLogin(ctx context.Context, userID string, loginTime time.Time) error
    UpdatePassword(ctx context.Context, userID string, passwordHash string) error
}
```

**SessionRepository interface:**
```go
type SessionRepository interface {
    GetByID(ctx context.Context, id string) (*Session, error)
    GetByTokenID(ctx context.Context, tokenID string) (*Session, error)
    Create(ctx context.Context, session *Session) error
    UpdateLastActivity(ctx context.Context, sessionID string, activityTime time.Time) error
    Revoke(ctx context.Context, sessionID string, reason string) error
    RevokeAllForUser(ctx context.Context, userID string, reason string) error
    RevokeAllForUserExcept(ctx context.Context, userID string, exceptSessionID string, reason string) error
    GetActiveForUser(ctx context.Context, userID string) ([]*Session, error)
    CleanExpired(ctx context.Context) (int, error)
}
```

**AuditLogger interface:**
```go
type AuditLogger interface {
    Log(ctx context.Context, event AuditEvent) error
}
```

**Key Service Methods:**

```go
// Login authenticates user, creates session, returns JWT
func (s *Service) Login(ctx context.Context, input LoginInput) (*LoginResult, error)

// Logout revokes a session
func (s *Service) Logout(ctx context.Context, sessionID, ip, userAgent string) error

// ValidateSession checks session is active (not revoked/expired)
func (s *Service) ValidateSession(ctx context.Context, sessionID string) (*Session, error)

// ChangePassword validates current password, hashes new password, revokes other sessions
func (s *Service) ChangePassword(ctx context.Context, input ChangePasswordInput) error

// RevokeAllSessions admin operation to revoke all sessions for a user
func (s *Service) RevokeAllSessions(ctx context.Context, targetUserID, adminID, ip, userAgent string) error

// GetUserSessions returns all active sessions for a user
func (s *Service) GetUserSessions(ctx context.Context, userID string) ([]*Session, error)
```

**Login Security Properties:**
- User existence is never revealed (same error for "user not found" and "wrong password")
- Inactive accounts are rejected with the same generic error
- Audit events are logged for all attempts (success and failure) with specific reason codes
- Failed audit: `reason: "user_not_found" | "user_inactive" | "invalid_password"`

**Password Change:** When a user changes their password, all other active sessions are revoked automatically (`RevokeAllForUserExcept`). This prevents session hijacking after credential compromise.

**Sensitive field redaction:** The `logAuditEvent` method always calls `redactSensitiveFields()` before logging. Keys like `password`, `token`, `secret`, `api_key`, `bearer`, `key` are replaced with `"[REDACTED]"`.

---

#### repository.go - Auth Repository

Provides `EntUserRepository` and `EntSessionRepository` backed by the ent ORM. See [See: 11-data-layer.md §Auth Tables].

---

### internal/credentials

**Package:** `internal/credentials/`

Router credentials (username + password for MikroTik API access) are stored AES-256-GCM encrypted. The plaintext password is never stored and never logged.

#### service.go - Credential Management

```go
// Credentials contains decrypted values - handle with extreme care
type Credentials struct {
    Username    string
    Password    string  // NEVER log or serialize
    KeyVersion  int
    LastUpdated time.Time
}

// CredentialInfo is safe for API responses - no plaintext password
type CredentialInfo struct {
    RouterID         string    `json:"routerId"`
    Username         string    `json:"username"`
    HasPassword      bool      `json:"hasPassword"`
    EncryptionStatus string    `json:"encryptionStatus"` // "AES-256-GCM"
    KeyVersion       int       `json:"keyVersion"`
    LastUpdated      time.Time `json:"lastUpdated"`
    CreatedAt        time.Time `json:"createdAt"`
}

type Service struct {
    encService *encryption.Service
}

func NewService(encService *encryption.Service) (*Service, error)
func NewServiceFromEnv() (*Service, error)  // reads DB_ENCRYPTION_KEY env var
```

**Key Methods:**
```go
// Create encrypts and stores new credentials for a router
func (s *Service) Create(ctx context.Context, client *ent.Client, routerID string, input UpdateInput) (*ent.RouterSecret, error)

// Update re-encrypts and updates existing credentials
func (s *Service) Update(ctx context.Context, client *ent.Client, routerID string, input UpdateInput) (*ent.RouterSecret, error)

// Get decrypts and returns credentials (use immediately, do not cache)
func (s *Service) Get(ctx context.Context, client *ent.Client, routerID string) (*Credentials, error)

// GetInfo returns metadata only - safe for API responses and logs
func (s *Service) GetInfo(ctx context.Context, client *ent.Client, routerID string) (*CredentialInfo, error)

// Delete removes credentials for a router
func (s *Service) Delete(ctx context.Context, client *ent.Client, routerID string) error

// Exists checks if credentials exist without decrypting
func (s *Service) Exists(ctx context.Context, client *ent.Client, routerID string) (bool, error)
```

**Safe Handling Helpers:**
```go
// Returns map with password replaced by "[REDACTED]" - for logging
func SanitizeForLog(creds *Credentials) map[string]interface{}

// Overwrites password field in memory with empty string
func ZeroCredentials(creds *Credentials)
```

**Usage pattern:**
```go
creds, err := credSvc.Get(ctx, db, routerID)
if err != nil { return err }
defer credentials.ZeroCredentials(creds) // Always clear when done

// Use creds.Username and creds.Password immediately
conn, err := connectToRouter(creds.Username, creds.Password)
```

---

#### hooks.go - ent Mutation Hooks

Automatically encrypts credentials on every `RouterSecret` mutation (Create, Update):

```go
func RegisterHooks(client *ent.Client, encService *encryption.Service) error
```

Called once during bootstrap. The hook:
1. Intercepts `EncryptedUsername` and `EncryptedPassword` fields on `RouterSecretMutation`
2. Checks `isEncrypted()` (heuristic: base64 check, length ≥ 40) to prevent double-encryption
3. Calls `encService.Encrypt()` and sets the encrypted value back on the mutation
4. Sets `KeyVersion` for future key rotation support
5. Calls `next.Mutate()` to continue the chain

**Environment:**
```
DB_ENCRYPTION_KEY  - AES-256-GCM encryption key (32 bytes, base64 encoded)
```

---

### internal/middleware

**Package:** `internal/middleware/`

#### auth.go - Auth Middleware Chain

The auth middleware supports three authentication methods tried in order:

```
1. JWT Bearer Token  (Authorization: Bearer <token>)
2. Session Cookie    (HttpOnly cookie: access_token=<token>)
3. API Key           (X-API-Key: <key>)
```

```go
type AuthMiddlewareConfig struct {
    JWTService       *auth.JWTService
    SessionValidator func(ctx context.Context, sessionID string) (*SessionInfo, error)
    APIKeyValidator  func(ctx context.Context, apiKey string) (*AuthUser, error)
    OnTokenRefresh   func(ctx context.Context, claims *auth.Claims, newToken string, expiresAt time.Time)
    Skipper          func(c echo.Context) bool
    CookieSecure     bool            // Default: true
    CookieSameSite   http.SameSite   // Default: SameSiteStrictMode
}
```

**Skipped routes** (no auth required): `/health`, `/ready`, `/playground`

**Context keys** set after successful authentication:
```go
const (
    UserContextKey       contextKey = "auth_user"    // *AuthUser
    ClaimsContextKey     contextKey = "auth_claims"  // *auth.Claims
    AuthMethodContextKey contextKey = "auth_method"  // AuthMethod
    SessionContextKey    contextKey = "auth_session" // *SessionInfo
)
```

**Context extraction helpers:**
```go
func UserFromContext(ctx context.Context) *AuthUser
func ClaimsFromContext(ctx context.Context) *auth.Claims
func AuthMethodFromContext(ctx context.Context) AuthMethod
func SessionFromContext(ctx context.Context) *SessionInfo
func IsAuthenticated(ctx context.Context) bool
func HasRole(ctx context.Context, required auth.Role) bool
```

**Role enforcement middleware:**
```go
func AuthRequiredMiddleware() echo.MiddlewareFunc
func RoleRequiredMiddleware(requiredRole auth.Role) echo.MiddlewareFunc
```

**Cookie security:** All auth cookies are set with:
- `HttpOnly: true` - prevents JavaScript access (XSS protection)
- `Secure: true` (production) - HTTPS only
- `SameSite: Strict` - CSRF protection
- Cookie names: `access_token`, `refresh_token`

**Sliding session refresh:** After successful JWT validation, if `JWTService.ShouldRefresh()` returns true, a new token is issued and set as the cookie automatically. The `OnTokenRefresh` callback is invoked if configured.

---

#### request_id.go - Request Correlation

```go
const RequestIDHeader = "X-Request-ID"

func GenerateRequestID() string  // ULID-based, time-sortable
func RequestIDMiddleware(next http.Handler) http.Handler
func RequestIDFromContext(ctx context.Context) string
func WithRequestID(ctx context.Context, requestID string) context.Context
```

The middleware:
1. Checks for an existing `X-Request-ID` header (from upstream proxies/clients)
2. Generates a new ULID-based ID if not present
3. Sets `X-Request-ID` in the response header
4. Adds the ID to the request context

Request IDs appear in:
- All GraphQL error `extensions.requestId`
- All audit log entries
- All structured log output

**ProductionModeMiddleware:** Sets a production mode flag in context, used by error presenters to suppress verbose error details:
```go
func ProductionModeMiddleware(production bool) func(http.Handler) http.Handler
```

---

### internal/graphql/directives

Directive-based security at the GraphQL field level. See [See: 03-graphql-api.md §Directives] for full details.

**Security-relevant directives:**

| Directive | Security function |
|-----------|------------------|
| `@auth(requires: "role")` | Blocks unauthenticated requests; enforces RBAC |
| `@sensitive` | Marks fields for log redaction; errors redact values |
| `@capability` | Blocks operations the router hardware cannot support |
| `@validate` | Prevents injection via invalid format inputs |

**Error codes returned by directives:**

| Code | Directive | Meaning |
|------|-----------|---------|
| `V400` | `@validate` | Field value failed validation |
| `A401` | `@auth` | Not authenticated or insufficient role |
| `C403` | `@capability` | Router lacks required capability |

All errors include `requestId` from context for correlation with server logs.

---

## Data Flow

### Login Flow

```
Client POST /login { username, password }
    |
    v
AuthMiddleware skips (login endpoint is public)
    |
    v
Login resolver → auth.Service.Login()
    |
    +-- users.GetByUsername()
    |        If not found: logAuditEvent(reason: "user_not_found")
    |        Returns: ErrInvalidCredentials (same error, user existence not revealed)
    |
    +-- Check user.Active
    |        If false: logAuditEvent(reason: "user_inactive")
    |        Returns: ErrInvalidCredentials
    |
    +-- password.VerifyPassword(hash, input.Password)
    |        If wrong: logAuditEvent(reason: "invalid_password")
    |        Returns: ErrInvalidCredentials
    |
    +-- sessions.Create(session)     ← new session with ULID
    |
    +-- jwt.GenerateToken(TokenInput) ← RS256 signed JWT
    |
    +-- users.UpdateLastLogin()      ← best-effort
    |
    +-- logAuditEvent("auth.login.success")
    |
    v
LoginResult { Token, User, Session, ExpiresAt }
    |
    v
Middleware sets HttpOnly SameSite=Strict Secure cookie: access_token=<jwt>
```

### Authenticated Request Flow

```
Client sends request with Authorization: Bearer <jwt>
    |
    v
RequestIDMiddleware adds ULID to context
    |
    v
AuthMiddleware:
    extractBearerToken() → jwt string
    jwtService.ValidateToken(token) → *Claims
    sessionValidator(claims.SessionID) → *SessionInfo (checks not revoked)
    Populates context: AuthUser, Claims, SessionInfo
    If ShouldRefresh() → issues new token + sets cookie
    |
    v
GraphQL handler invoked
    |
    v
For each field with @auth directive:
    GetAuthInfo(ctx) → AuthInfo
    Check Authenticated = true
    If requires != nil: check role in authInfo.Roles
    If fails: return gqlerror with code "A401"
    |
    v
Resolver method called, accesses r.authService etc.
```

### Credential Encryption Flow

```
User submits router credentials { username, password }
    |
    v
credentials.Service.Create(ctx, db, routerID, {username, password})
    |
    v
encService.Encrypt(username) → AES-256-GCM ciphertext (base64)
encService.Encrypt(password) → AES-256-GCM ciphertext (base64)
    |
    v
db.RouterSecret.Create().
    SetEncryptedUsername(encUsername).
    SetEncryptedPassword(encPassword).
    SetKeyVersion(version).
    Save(ctx)

[ent hook runs on every mutation - double-encryption prevented by isEncrypted() check]
    |
    v
Stored in DB: only encrypted bytes, never plaintext
```

---

## Configuration

| Environment Variable | Purpose | Required |
|---------------------|---------|----------|
| `JWT_PRIVATE_KEY` or `JWT_PRIVATE_KEY_PATH` | RSA private key for token signing | Yes |
| `JWT_PUBLIC_KEY` or `JWT_PUBLIC_KEY_PATH` | RSA public key for token validation | Yes |
| `JWT_TOKEN_DURATION` | Token lifetime (default: `1h`) | No |
| `JWT_SESSION_DURATION` | Max session age (default: `168h`) | No |
| `JWT_SLIDE_THRESHOLD` | Refresh window (default: `30m`) | No |
| `DB_ENCRYPTION_KEY` | AES-256-GCM key for credential encryption (32 bytes, base64) | Yes |

---

## Error Handling

All auth errors use structured error codes to allow client-side handling without message parsing:

| Error var | Code | HTTP Status |
|-----------|------|-------------|
| `ErrInvalidCredentials` | `AUTH.INVALID_CREDENTIALS` | 401 |
| `ErrSessionExpired` | `AUTH.SESSION_EXPIRED` | 401 |
| `ErrTokenInvalid` | `AUTH.TOKEN_INVALID` | 401 |
| `ErrTokenExpired` | `AUTH.TOKEN_EXPIRED` | 401 |
| `ErrInsufficientRole` | `AUTH.INSUFFICIENT_ROLE` | 403 |

GraphQL directive errors include a `docsUrl` field pointing to the API error documentation.

In production mode (set by `ProductionModeMiddleware`), error details are suppressed and long string values in validation errors are truncated to 50 characters.

---

## Testing

**Auth service tests:** `internal/auth/` - test login, logout, session validation, password change, role hierarchy.

**Directive tests:** `internal/graphql/directives/directives_test.go` - validate each directive with enabled and disabled config.

**Middleware tests:** `internal/middleware/request_id_test.go` - ULID generation, header propagation.

**Pattern for auth testing:**
```go
func TestLoginSuccess(t *testing.T) {
    jwtSvc, _ := auth.NewJWTService(auth.JWTConfig{
        PrivateKey: testPrivateKey,
        PublicKey:  testPublicKey,
    })
    svc, _ := auth.NewService(auth.Config{
        JWTService:        jwtSvc,
        PasswordService:   auth.NewDefaultPasswordService(),
        UserRepository:    &mockUserRepo{},
        SessionRepository: &mockSessionRepo{},
    })
    result, err := svc.Login(ctx, auth.LoginInput{
        Username: "admin",
        Password: "correctpassword",
        IP: "127.0.0.1",
    })
    require.NoError(t, err)
    require.NotEmpty(t, result.Token)
}
```

**Credential encryption tests:** Create credentials, retrieve them, verify decrypted values match.

---

## Security Invariants

These invariants must never be violated:

1. **Passwords are never stored plaintext** - always bcrypt hashed before storage
2. **Router credentials are never stored plaintext** - always AES-256-GCM encrypted
3. **JWT tokens use RS256** - asymmetric, private key never leaves the server
4. **Session IDs are in JWT claims** - enables server-side revocation
5. **Login failures don't reveal user existence** - same error for all failure modes
6. **Sensitive field values are never logged** - `redactSensitiveFields()` on all audit events
7. **Password change revokes all other sessions** - prevents post-compromise access
8. **Request IDs are in all errors** - for correlation without exposing internal details
9. **Credentials in memory are cleared after use** - `ZeroCredentials()` called with `defer`
10. **`CredentialInfo` (not `Credentials`) is used in API responses** - password never serialized

---

## Cross-References

- Event publishing for auth actions: [See: 05-event-system.md §Publisher] (`PublishAuthLogin`, `PublishAuthPasswordChanged`, `PublishCredentialChanged`)
- How auth service is wired at startup: [See: 02-application-bootstrap.md §Auth Bootstrap]
- GraphQL @auth directive details: [See: 03-graphql-api.md §Directives]
- ent schema for users/sessions: [See: 11-data-layer.md §Auth Entities]
- Encryption service (AES-256-GCM): `internal/encryption/service.go`
