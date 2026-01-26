# Security Architecture

**Last Updated:** 2026-01-20  
**Version:** 3.0  
**Status:** Comprehensive - Multi-Layer Defense in Depth

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
  - [Multi-Method Auth](#multi-method-auth)
  - [JWT with Sliding Sessions](#jwt-with-sliding-sessions)
  - [Password Security](#password-security)
  - [API Key Management](#api-key-management)
- [Data Protection](#data-protection)
  - [Encryption at Rest](#encryption-at-rest)
  - [Credential Storage](#credential-storage)
  - [Sensitive Data Handling](#sensitive-data-handling)
- [Access Control](#access-control)
  - [RBAC Model](#rbac-model)
  - [GraphQL Authorization](#graphql-authorization)
  - [Dangerous Operation Gates](#dangerous-operation-gates)
- [API Security](#api-security)
  - [Rate Limiting](#rate-limiting)
  - [Query Complexity Limits](#query-complexity-limits)
  - [Error Masking](#error-masking)
- [Audit & Compliance](#audit--compliance)
- [Update System Security](#update-system-security)
- [Security Testing](#security-testing)

---

## Overview

NasNetConnect implements **defense in depth** across multiple security layers:

1. **Authentication:** Multi-method auth (JWT + API Key + Session) with sliding sessions
2. **Authorization:** RBAC with GraphQL field-level permissions
3. **Encryption:** AES-256-GCM at rest, HTTPS in transit
4. **API Security:** Rate limiting, complexity limits, depth limits
5. **Audit:** Complete audit trail via event sourcing
6. **Update Security:** Package signing, CRL verification, transactional rollback
7. **Dangerous Operations:** Multi-step gates, re-authentication, countdown confirms

---

## Authentication

### Multi-Method Auth

**Three Authentication Methods (Priority Order):**

```go
// Auth middleware checks all three methods
func authMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        // 1. JWT Bearer Token (Authorization: Bearer xxx)
        if token := extractBearer(c); token != "" {
            if user, err := validateJWT(token); err == nil {
                c.Set("user", user)
                c.Set("auth_method", "jwt")
                return next(c)
            }
        }
        
        // 2. API Key (X-API-Key: nas_abc123...)
        if apiKey := c.Request().Header.Get("X-API-Key"); apiKey != "" {
            if user, err := validateAPIKey(apiKey); err == nil {
                c.Set("user", user)
                c.Set("auth_method", "api_key")
                return next(c)
            }
        }
        
        // 3. Session Cookie (HttpOnly, Secure, SameSite: Strict)
        if cookie, err := c.Cookie("session"); err == nil {
            if user, err := validateSession(cookie.Value); err == nil {
                c.Set("user", user)
                c.Set("auth_method", "session")
                return next(c)
            }
        }
        
        return echo.NewHTTPError(401, "Unauthorized")
    }
}
```

**Use Cases by Method:**

| Method | Use Case | Expiry | Revocation |
|--------|----------|--------|------------|
| **JWT** | Web app primary auth | 1 hour (sliding to 7 days) | Session invalidation |
| **API Key** | Automation, CI/CD, mobile apps | Never (until revoked) | Immediate via bcrypt invalidation |
| **Session** | Web app fallback | 7 days fixed | Database + blacklist |

---

### JWT with Sliding Sessions

**Configuration:**

```go
type JWTConfig struct {
    Algorithm       string           // "RS256" (asymmetric)
    PrivateKey      *rsa.PrivateKey  // Signs tokens (server only)
    PublicKey       *rsa.PublicKey   // Verifies tokens (can be shared)
    
    TokenDuration   time.Duration    // 1 hour
    SessionDuration time.Duration    // 7 days max absolute
    SlideThreshold  time.Duration    // 30 minutes
}
```

**Token Structure:**

```json
{
  "sub": "user-uuid",
  "exp": 1705752000,
  "iat": 1705748400,
  "uid": "01HN8Z4G9XKQR3P7YMW6VZTN2C",
  "username": "admin",
  "role": "admin",
  "perms": ["router:read", "router:write", "user:manage"],
  "sid": "session-uuid"
}
```

**Sliding Session Flow:**

```
Initial Login:
├─ JWT issued: expires in 1 hour
├─ Session created: expires in 7 days
└─ HttpOnly cookie set

Request at 45 minutes:
├─ JWT expires in 15 minutes (< 30 min threshold)
├─ Middleware issues new JWT: expires in 1 hour
├─ New cookie set (transparent to user)
└─ Session max expires in 6 days, 23 hours (countdown continues)

After 7 days total:
├─ Session expires (absolute limit)
└─ User must log in again
```

**Session Storage:**

```go
// HttpOnly cookies (XSS protection)
http.SetCookie(w, &http.Cookie{
    Name:     "access_token",
    Value:    token,
    Path:     "/",
    HttpOnly: true,     // No JavaScript access
    Secure:   true,     // HTTPS only
    SameSite: http.SameSiteStrictMode,
    MaxAge:   int(7 * 24 * time.Hour / time.Second),
})
```

---

### Password Security

**NIST Modern Password Policy:**

```go
type PasswordPolicy struct {
    MinLength       int   // 8 characters minimum
    MaxLength       int   // 128 characters maximum
    RequireComplex  bool  // FALSE - no forced uppercase/symbols/numbers
    CheckCommonList bool  // TRUE - check against common password list
}

var DefaultPolicy = PasswordPolicy{
    MinLength:       8,
    MaxLength:       128,
    RequireComplex:  false,  // NIST no longer recommends complexity rules
    CheckCommonList: true,
}

func ValidatePassword(password string) error {
    if len(password) < 8 {
        return errors.New("password must be at least 8 characters")
    }
    
    if len(password) > 128 {
        return errors.New("password must not exceed 128 characters")
    }
    
    if isCommonPassword(password) {
        return errors.New("password is too common, please choose a stronger one")
    }
    
    return nil
}
```

**Hashing with bcrypt:**

```go
const bcryptCost = 10  // ~100ms per hash (acceptable for login)

func HashPassword(password string) (string, error) {
    hash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
    return string(hash), err
}

func VerifyPassword(hash, password string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}
```

---

### API Key Management

**Generation (Show Only Once):**

```go
// Generate API key
func (s *AuthService) CreateAPIKey(ctx context.Context, userID, name string, scopes []string) (*APIKeyResponse, error) {
    // Generate cryptographically secure key
    key := fmt.Sprintf("nas_%s", randomString(32))  // "nas_a1b2c3d4e5f6g7h8..."
    prefix := key[:12]  // "nas_a1b2c3d4" for identification
    
    // Hash with bcrypt (same as passwords)
    hash, err := bcrypt.GenerateFromPassword([]byte(key), 10)
    if err != nil {
        return nil, err
    }
    
    // Store in database
    apiKey := s.db.APIKey.Create().
        SetUserID(userID).
        SetName(name).
        SetKeyPrefix(prefix).
        SetKeyHash(string(hash)).
        SetScopes(scopes).
        SetCreatedAt(time.Now()).
        SaveX(ctx)
    
    // Return full key ONLY ONCE
    return &APIKeyResponse{
        Key:    key,        // Show to user once
        Prefix: prefix,     // For identification later
        ID:     apiKey.ID,
    }, nil
}
```

**Validation (O(n) scan with prefix optimization):**

```go
func (s *AuthService) ValidateAPIKey(ctx context.Context, key string) (*User, error) {
    if !strings.HasPrefix(key, "nas_") || len(key) != 36 {
        return nil, ErrInvalidAPIKey
    }
    
    prefix := key[:12]  // "nas_a1b2c3d4"
    
    // Find candidates by prefix (typically 1-5 matches)
    candidates, err := s.db.APIKey.Query().
        Where(apikey.KeyPrefix(prefix)).
        All(ctx)
    
    if err != nil || len(candidates) == 0 {
        return nil, ErrInvalidAPIKey
    }
    
    // Check bcrypt hash (constant-time comparison)
    for _, candidate := range candidates {
        if bcrypt.CompareHashAndPassword([]byte(candidate.KeyHash), []byte(key)) == nil {
            // Update last used timestamp
            candidate.Update().
                SetLastUsedAt(time.Now()).
                SaveX(ctx)
            
            // Get user
            user, err := candidate.QueryUser().Only(ctx)
            if err != nil {
                return nil, err
            }
            
            return user, nil
        }
    }
    
    return nil, ErrInvalidAPIKey
}
```

**API Key Format:**
```
nas_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5
│   │           │                  │
│   │           │                  └─ Random suffix (24 chars)
│   │           └──────────────────── Random component (32 chars total)
│   └──────────────────────────────── Prefix for lookup (12 chars)
└──────────────────────────────────── Identifier prefix
```

---

## Data Protection

### Encryption at Rest

**AES-256-GCM for Sensitive Fields:**

```go
type EncryptionService struct {
    key []byte  // 32-byte encryption key from env
}

// Encrypt router credentials
func (e *EncryptionService) EncryptCredential(plaintext string) (string, error) {
    block, err := aes.NewCipher(e.key)
    if err != nil {
        return "", err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }
    
    // Generate random nonce
    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }
    
    // Encrypt and prepend nonce
    ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
    
    // Encode as base64
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (e *EncryptionService) DecryptCredential(ciphertext string) (string, error) {
    // Decode from base64
    data, err := base64.StdEncoding.DecodeString(ciphertext)
    if err != nil {
        return "", err
    }
    
    block, err := aes.NewCipher(e.key)
    if err != nil {
        return "", err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", err
    }
    
    nonceSize := gcm.NonceSize()
    nonce, ciphertext := data[:nonceSize], data[nonceSize:]
    
    plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
    if err != nil {
        return "", err
    }
    
    return string(plaintext), nil
}
```

**Key Management:**

```bash
# Encryption key from environment (32 bytes = 256 bits)
export DB_ENCRYPTION_KEY="$(openssl rand -base64 32)"

# Separate key for JWT signing
export JWT_PRIVATE_KEY="$(cat private.pem)"
export JWT_PUBLIC_KEY="$(cat public.pem)"
```

---

### Credential Storage

**Separate Table with Field-Level Encryption:**

```go
// ent/schema/router_secret.go
type RouterSecret struct {
    ent.Schema
}

func (RouterSecret) Fields() []ent.Field {
    return []ent.Field{
        field.String("id").GoType(ulid.ULID{}).Unique(),
        field.String("router_id").GoType(ulid.ULID{}),
        
        // All sensitive fields encrypted
        field.String("username_enc").Sensitive(),     // AES-256-GCM
        field.String("password_enc").Sensitive(),
        field.String("api_port"),
        field.String("ssh_port"),
        field.Bytes("ssh_key_enc").Optional().Sensitive(),
        
        field.Bool("prefer_ssl"),  // API-SSL vs API preference
    }
}

// .Sensitive() marks for automatic encryption via ent hooks
func (rs *RouterSecret) Hooks() []ent.Hook {
    return []ent.Hook{
        hook.On(
            func(next ent.Mutator) ent.Mutator {
                return hook.RouterSecretFunc(func(ctx context.Context, m *ent.RouterSecretMutation) (ent.Value, error) {
                    // Auto-encrypt sensitive fields on create/update
                    if username, ok := m.Username(); ok {
                        encrypted, _ := encryptionService.Encrypt(username)
                        m.SetUsernameEnc(encrypted)
                    }
                    if password, ok := m.Password(); ok {
                        encrypted, _ := encryptionService.Encrypt(password)
                        m.SetPasswordEnc(encrypted)
                    }
                    return next.Mutate(ctx, m)
                })
            },
            ent.OpCreate|ent.OpUpdate|ent.OpUpdateOne,
        ),
    }
}
```

---

### Sensitive Data Handling

**Automatic Redaction:**

```go
// Pattern matching for sensitive field names
var sensitivePatterns = []string{
    "password", "passwd", "secret", "token", "key", "credential",
    "private", "api_key", "apikey", "authorization", "bearer",
    "passphrase", "pin", "totp", "otp",
}

// Sanitize before logging
func SanitizeForLog(data map[string]interface{}) map[string]interface{} {
    sanitized := make(map[string]interface{})
    
    for k, v := range data {
        if containsSensitivePattern(k) {
            sanitized[k] = "[REDACTED]"
        } else if nestedMap, ok := v.(map[string]interface{}); ok {
            sanitized[k] = SanitizeForLog(nestedMap)  // Recursive
        } else {
            sanitized[k] = v
        }
    }
    
    return sanitized
}

// Logging example
logger.Info("router credentials updated",
    zap.String("router_id", routerID),
    zap.Any("fields", SanitizeForLog(updates)),  // Passwords auto-redacted
)
```

**GraphQL @sensitive Directive:**

```graphql
directive @sensitive on FIELD_DEFINITION

type User {
  username: String!
  password: String! @sensitive     # Never in logs
  email: String
}

type RouterSecret {
  username: String! @sensitive     # Redacted in errors
  password: String! @sensitive
  sshKey: String @sensitive
}
```

**Error Response Sanitization:**

```json
{
  "errors": [{
    "message": "Failed to connect to router",
    "extensions": {
      "code": "ROUTER.CONNECTION.AUTH_FAILED",
      "routerId": "router-main",
      "protocol": "SSH",
      "username": "[REDACTED]",       // Sensitive field auto-redacted
      "suggestedFix": "Check router credentials in Settings"
    }
  }]
}
```

---

## Access Control

### RBAC Model

**Two Roles:**

| Role | Permissions | Use Case |
|------|-------------|----------|
| **admin** | Full access (read + write + delete + user management) | Primary administrator |
| **viewer** | Read-only access (dashboard, logs, no mutations) | View-only monitoring |

**Future Expansion (v2.0):**
- **operator** - Can edit configs but not delete routers or manage users
- **auditor** - View logs and audit trail only
- Custom permissions per resource type

**Implementation:**

```go
type User struct {
    ID       ulid.ULID
    Username string
    Role     Role  // admin, viewer
}

type Role string

const (
    RoleAdmin  Role = "admin"
    RoleViewer Role = "viewer"
)

// Middleware for role-based access
func adminOnly(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
        user := c.Get("user").(*User)
        if user.Role != RoleAdmin {
            return echo.NewHTTPError(403, "Admin access required")
        }
        return next(c)
    }
}
```

---

### GraphQL Authorization

**Field-Level Authorization:**

```graphql
directive @auth(requires: String!) on FIELD_DEFINITION | OBJECT

type Query {
  # Public (no auth)
  health: HealthStatus!
  systemStatus: SystemStatus!
  
  # Authenticated users only
  resources: [Resource!]! @auth(requires: "authenticated")
  devices: [Device!]! @auth(requires: "authenticated")
  
  # Admin only
  users: [User!]! @auth(requires: "admin")
  auditLog: [AuditEvent!]! @auth(requires: "admin")
  
  # Multiple permissions (OR logic)
  dangerousOperation: Boolean! @auth(requires: "admin,superuser")
}

type Mutation {
  # Authenticated
  updateResource(input: UpdateInput!): ResourcePayload! 
    @auth(requires: "authenticated")
  
  # Admin only
  deleteRouter(id: ID!): DeletePayload! 
    @auth(requires: "admin")
  
  createUser(input: CreateUserInput!): UserPayload! 
    @auth(requires: "admin")
}
```

**Resolver Implementation:**

```go
// GraphQL directive generates middleware
func (r *Resolver) Resources(ctx context.Context) ([]*Resource, error) {
    // Auto-generated auth check from @auth directive
    user := auth.UserFromContext(ctx)
    if user == nil {
        return nil, errors.New("unauthenticated")
    }
    
    // Business logic
    return r.resourceService.GetAll(ctx)
}
```

---

### Dangerous Operation Gates

**Multi-Step Safety for Critical Operations:**

```
┌─────────────────────────────────────────────────────────────┐
│            DANGEROUS OPERATION GATES                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GATE 1: Explicit Confirmation                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Modal: "Are you sure you want to delete WAN Link?"    ││
│  │  [ Cancel ]  [ Continue ]                               ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼                                   │
│  GATE 2: Impact Analysis Review                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  "This will affect:                                     ││
│  │   • 3 VPN clients (will lose connection)               ││
│  │   • 5 firewall rules (will become inactive)            ││
│  │  [ Cancel ]  [ I Understand, Continue ]                ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼                                   │
│  GATE 3: Re-Authentication (Sudo Mode)                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  "Enter your password to confirm:"                      ││
│  │  [_______________]                                       ││
│  │  [ Cancel ]  [ Verify ]                                 ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼                                   │
│  GATE 4: Countdown Confirmation                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  "Deleting WAN Link in 5 seconds..."                   ││
│  │  [████████████░░░░░░░░] 5s                              ││
│  │  [ Abort ]                                               ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│                          ▼                                   │
│  EXECUTION: Delete operation proceeds                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Dangerous Operations:**
- Delete WAN Link (breaks internet)
- Delete Router (loses all config)
- Factory Reset
- Disable All Firewall Rules
- Change Admin Password
- Revoke All Sessions

---

## API Security

### Rate Limiting

**Token Bucket Algorithm:**

```go
type RateLimitConfig struct {
    Rate       float64  // Tokens per second
    Burst      int      // Max tokens (burst capacity)
    KeyFunc    func(c echo.Context) string
}

// Per-route limits
var limits = map[string]RateLimitConfig{
    "login":     {Rate: 0.1, Burst: 5},     // 5 attempts, 1 per 10s refill
    "graphql":   {Rate: 10, Burst: 100},    // 100 burst, 10/s refill
    "api_key":   {Rate: 20, Burst: 200},    // Higher limit for automation
    "discovery": {Rate: 0.03, Burst: 1},    // 1 per 30s
}

// Per-user limits (authenticated)
func (r *RateLimiter) UserKey(c echo.Context) string {
    user := c.Get("user").(*User)
    return fmt.Sprintf("user:%s", user.ID)
}

// Per-IP limits (unauthenticated)
func (r *RateLimiter) IPKey(c echo.Context) string {
    return fmt.Sprintf("ip:%s", c.RealIP())
}
```

---

### Query Complexity Limits

**Multi-Factor Complexity Scoring:**

```go
func calculateQueryComplexity(query *ast.Query) int {
    complexity := 0
    
    // Base costs
    complexity += fieldCount * 1
    complexity += listFieldCount * 10           // Lists multiply cost
    complexity += relationshipDepth * 50        // Deep nesting expensive
    
    // Expensive operations
    complexity += requiresRouterPoll * 100      // Runtime data = router API call!
    complexity += databaseJoinCount * 20        // Joins expensive
    complexity += subscriptionCount * 30        // Real-time overhead
    
    // Relationship traversal
    complexity += dependencyTraversalDepth * 40 // Graph walking
    
    return complexity
}

// Thresholds
const (
    ComplexityWarn    = 750   // Log warning
    ComplexityMaxSync = 1000  // Max for synchronous execution
)

// Enforcement
func complexityMiddleware(next graphql.Handler) graphql.Handler {
    return func(ctx context.Context) (interface{}, error) {
        complexity := calculateQueryComplexity(ctx.Query)
        
        if complexity > ComplexityMaxSync {
            // Convert to async job
            return &AsyncJobError{
                JobID:   createAsyncJob(ctx.Query),
                Message: "Query complexity exceeds 1000. Use queryJob or subscribe to queryComplete.",
            }, nil
        }
        
        if complexity > ComplexityWarn {
            logger.Warn("expensive query",
                zap.Int("complexity", complexity),
                zap.String("query", ctx.Query),
            )
        }
        
        return next(ctx)
    }
}
```

**Depth Limits:**

```go
const MaxQueryDepth = 5  // Maximum nesting levels

// Enforced by gqlgen
func main() {
    srv := handler.NewDefaultServer(generated.NewExecutableSchema(config))
    
    srv.Use(extension.FixedComplexityLimit(1000))
    srv.Use(extension.DepthLimit(5))
}
```

---

### Error Masking

**Production vs Development:**

```go
func ErrorResponse(ctx context.Context, err error, code string) *GraphQLError {
    resp := &GraphQLError{
        Message: err.Error(),
        Extensions: map[string]interface{}{
            "code": code,
        },
    }
    
    // Only include stack traces in development
    if config.IsDev() {
        resp.Extensions["stack"] = string(debug.Stack())
        resp.Extensions["details"] = err
    }
    
    // Never include sensitive data
    resp.Extensions = SanitizeForLog(resp.Extensions)
    
    return resp
}
```

**Error Code Hierarchy (Non-Leaky):**

```
AUTH.INVALID_CREDENTIALS          ← Generic (no user enumeration)
AUTH.SESSION_EXPIRED              ← Clear reason
ROUTER.CONNECTION.TIMEOUT         ← Helpful but not leaky
ROUTER.CONNECTION.AUTH_FAILED     ← Generic (no username/password in message)
RESOURCE.VALIDATION_FAILED        ← Includes field errors (safe)
SYSTEM.INTERNAL_ERROR             ← Generic (details only in logs)
```

---

## Audit & Compliance

### Security Audit Events

```go
type AuditEventType string

const (
    // Authentication
    AuditLoginSuccess     AuditEventType = "auth.login.success"
    AuditLoginFailure     AuditEventType = "auth.login.failure"
    AuditLogout           AuditEventType = "auth.logout"
    AuditPasswordChange   AuditEventType = "auth.password.change"
    AuditSessionRevoked   AuditEventType = "auth.session.revoked"
    
    // Authorization
    AuditPermissionDenied AuditEventType = "auth.permission.denied"
    AuditRateLimited      AuditEventType = "auth.rate.limited"
    
    // API Keys
    AuditAPIKeyCreated    AuditEventType = "apikey.created"
    AuditAPIKeyRevoked    AuditEventType = "apikey.revoked"
    AuditAPIKeyUsed       AuditEventType = "apikey.used"
    
    // Router Security
    AuditRouterCredsChange AuditEventType = "router.credentials.change"
    AuditRouterDeleted     AuditEventType = "router.deleted"
    
    // Dangerous Operations
    AuditFactoryReset      AuditEventType = "system.factory_reset"
    AuditFirewallDisabled  AuditEventType = "firewall.disabled"
)

// All security events logged with full context
type AuditEvent struct {
    Type          AuditEventType
    UserID        *string
    Username      *string
    IP            string
    UserAgent     string
    CorrelationID string
    Details       map[string]interface{}
    Timestamp     time.Time
}

// Immutable audit log (append-only)
func (s *AuditService) Log(ctx context.Context, event AuditEvent) error {
    return s.db.AuditLog.Create().
        SetEventType(string(event.Type)).
        SetUserID(event.UserID).
        SetIP(event.IP).
        SetUserAgent(event.UserAgent).
        SetCorrelationID(event.CorrelationID).
        SetChanges(event.Details).
        SetCreatedAt(event.Timestamp).
        Save(ctx)
    // No update or delete allowed - append-only
}
```

**Audit Log Retention:**
- **Duration:** 30 days (configurable)
- **Max Events:** 10,000 per category
- **Max Size:** 2MB per category
- **Cleanup:** Daily background job

---

## Update System Security

### Package Signing & Verification

**Key Hierarchy:**

```
Root Key (offline, air-gapped)
     ↓
Release Signing Key (GitHub Secrets / AWS KMS)
     ↓
Feature Signing Key (separate, lower privilege)
```

**Signature Verification Flow:**

```go
func (v *PackageVerifier) VerifyPackage(pkg *Package) error {
    // 1. Extract signature and key ID
    signature, keyID := pkg.ExtractSignature()
    
    // 2. Check Certificate Revocation List (hybrid: cached + online)
    if revoked, _ := v.crl.IsKeyRevoked(keyID); revoked {
        return ErrKeyRevoked
    }
    
    // 3. Verify signature
    if !v.verifySignature(pkg.Bytes(), signature, keyID) {
        // Log for security monitoring
        logger.Error("package signature verification failed",
            zap.String("package", pkg.Name),
            zap.String("key_id", keyID),
        )
        
        // Report to telemetry (if opted in)
        telemetry.ReportSecurityEvent("signature_verification_failed", pkg.Name)
        
        return ErrInvalidSignature
    }
    
    // 4. Verify package hash (SHA256)
    if !v.verifyHash(pkg.Bytes(), pkg.ExpectedHash) {
        return ErrHashMismatch
    }
    
    return nil
}
```

**Certificate Revocation List (CRL) - Hybrid:**

```go
type CRLChecker struct {
    CachedCRL      []RevokedKey  // Embedded in binary, updated each release
    LastOnlineCheck time.Time
    OnlineCRLURL   string        // https://nasnet.io/crl.json
}

func (c *CRLChecker) IsKeyRevoked(keyID string) (bool, error) {
    // Always check cached CRL first (works offline)
    if c.inCachedCRL(keyID) {
        return true, nil
    }
    
    // Try online check if connected and cache stale (>24h)
    if time.Since(c.LastOnlineCheck) > 24*time.Hour {
        if online, err := c.checkOnlineCRL(keyID); err == nil {
            c.LastOnlineCheck = time.Now()
            return online, nil
        }
    }
    
    // Cached check passed, online check failed/stale
    return false, nil
}
```

**Key Rotation Schedule:**
- **Release Signing Key:** Rotate every 6 months
- **Feature Signing Key:** Rotate yearly
- **Overlap Period:** 3 months (old key valid during transition)
- **Emergency Rotation:** Immediate on suspected compromise

---

## Security Testing

### OWASP Top 10 Coverage

| OWASP Category | Mitigation | Testing |
|----------------|------------|---------|
| **A01: Broken Access Control** | RBAC + GraphQL @auth directives | OWASP ZAP + manual testing |
| **A02: Cryptographic Failures** | AES-256-GCM + RS256 JWT + HTTPS | Snyk Code + manual review |
| **A03: Injection** | Parameterized queries + input validation | OWASP ZAP + SQLMap |
| **A04: Insecure Design** | Threat modeling + peer review | Architecture review |
| **A05: Security Misconfiguration** | Secure defaults + config validation | OWASP ZAP baseline scan |
| **A06: Vulnerable Components** | Snyk dependency scanning | Every PR |
| **A07: Auth Failures** | Multi-factor auth + rate limiting | OWASP ZAP auth tests |
| **A08: Data Integrity Failures** | Package signing + CRL | Manual verification |
| **A09: Logging Failures** | Comprehensive audit log | Manual review |
| **A10: SSRF** | No user-controlled URLs | N/A (not applicable) |

### Security Testing Pipeline

```yaml
# CI Security Stage
security:
  stage: security
  script:
    # Dependency scanning (SCA)
    - snyk test --severity-threshold=high
    
    # Static code analysis (SAST)
    - snyk code test
    
    # Dynamic testing (DAST)
    - docker run -t owasp/zap2docker-stable \
        zap-baseline.py -t http://app:8080
    
    # Container scanning
    - trivy image nasnetconnect:latest
  
  allow_failure:
    exit_codes:
      - 1  # Low/Medium findings don't block
```

**Security Scan Handling:**

| Severity | Action | Rationale |
|----------|--------|-----------|
| **Critical** | Hard block (requires fix or approval) | Immediate security risk |
| **High** | Soft block (requires security champion review) | Significant risk, needs assessment |
| **Medium** | Warning (report in PR, no block) | Track and prioritize |
| **Low** | Warning (report, no block) | Informational |

---

## Related Documents

- [Backend Architecture](./backend-architecture.md) - Overall backend design
- [API Contracts](./api-contracts.md) - GraphQL authorization patterns
- [Data Architecture](./data-architecture.md) - Encryption and audit events
- [Deployment Architecture](./deployment-architecture.md) - Update security

---
