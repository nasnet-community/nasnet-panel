# Error Handling & Structured Logging

> Hierarchical error types, automatic log-level routing, GraphQL error presentation, and
> sensitive-data redaction across the NasNetConnect backend.

**Packages:** `internal/apperrors/`, `internal/logger/` **Key Files:** `apperrors/errors.go`,
`apperrors/presenter.go`, `apperrors/logging.go`, `apperrors/redactor.go`,
`apperrors/suggestions.go`, `logger/logger.go` **Prerequisites:** [See: 03-graphql-api.md §Error
Handling], [See: 12-security.md §Audit Logging]

---

## Overview

NasNetConnect uses a two-layer approach to error handling:

1. **`internal/apperrors`** — A domain-specific error hierarchy with codes, categories, suggested
   fixes, and documentation URLs. All errors that cross a package boundary should be expressed as a
   `RouterError` or one of its specializations.
2. **`internal/logger`** — A thin wrapper around `go.uber.org/zap` that initializes a global logger,
   attaches request-ID correlation, and exposes convenience helpers for context-aware logging.

The two layers connect through `apperrors.LogLevel()`, which maps each error category to the
appropriate zap level, and `apperrors.ErrorFields()`, which extracts structured zap fields (with
automatic redaction of sensitive keys) for use in `logger.Error(…)` calls.

---

## Architecture

```
GraphQL Resolver
      │
      │  returns error
      ▼
apperrors.ErrorPresenter (gqlgen hook)
      │
      ├─► errors.As(RouterError) ──► presentRouterError()
      │                                    │
      │                                    ├─ RedactErrorForProduction() (isProduction=true)
      │                                    ├─ buildExtensions()           → code, category, requestId
      │                                    ├─ SuggestedFix()              → human-readable hint
      │                                    ├─ DocsURL()                   → https://docs.nasnet.io/errors/…
      │                                    └─ TroubleshootingSteps()      → ordered checklist
      │
      ├─► errors.As(*gqlerror.Error) ──► pass-through + inject requestId
      │
      └─► unknown error ──► presentUnknownError() → generic I500 response (redacted in prod)

internal/logger
      │
      ├─ logger.Init(cfg)  ─ once.Do singleton (JSON prod / console dev)
      ├─ logger.L()        ─ global *zap.Logger
      ├─ logger.WithRequestID(ctx) ─ attaches request_id field from context
      └─ logger.{Debug,Info,Warn,Error}Ctx(ctx, …) ─ shorthand with request correlation

apperrors.LogError(logger, err)
      │
      ├─ GetRouterError(err)        → unwrap to RouterError
      ├─ LogLevel(category)         → map category → zap.Level
      └─ ErrorFields(err)           → []zap.Field with redacted context
```

---

## Package Reference

### `internal/apperrors`

#### Error Categories & Codes

Every error has an `ErrorCategory` string and a short alphanumeric error code.

| Category     | Prefix | Example Code                | Log Level |
| ------------ | ------ | --------------------------- | --------- |
| `platform`   | P1xx   | `P100` PlatformNotSupported | Warn      |
| `protocol`   | R2xx   | `R200` ConnectionFailed     | Warn      |
| `network`    | N3xx   | `N300` HostUnreachable      | Warn      |
| `validation` | V4xx   | `V400` ValidationFailed     | Warn      |
| `auth`       | A5xx   | `A500` AuthFailed           | **Info**  |
| `resource`   | S6xx   | `S600` ResourceNotFound     | Warn      |
| `internal`   | I5xx   | `I500` Internal             | **Error** |

Auth failures are intentionally logged at `Info` because they are expected operational events;
internal errors are `Error` because they require investigation.

#### Base Type: `RouterError`

```go
type RouterError struct {
    Code        string                 // e.g. "V400", "R200"
    Category    ErrorCategory
    Message     string
    Recoverable bool
    Context     map[string]interface{} // additional structured data (redacted before logging)
    Cause       error                  // wrapped underlying error
}

func (e *RouterError) Error() string        // "[V400] Validation failed…: cause"
func (e *RouterError) Unwrap() error        // errors.Is / errors.As chain
func (e *RouterError) Is(target error) bool // match by Code
func (e *RouterError) WithContext(key, value) *RouterError
func (e *RouterError) WithCause(err) *RouterError
```

#### Specialized Error Types

| Type              | Constructor                                    | Extra Fields                                         |
| ----------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `PlatformError`   | `NewPlatformError(code, msg, platform)`        | `Platform`, `Version`, `NativeError`                 |
| `ProtocolError`   | `NewProtocolError(code, msg, protocol)`        | `Protocol`, `RouterID`, `RouterHost`, `ConnectionID` |
| `ValidationError` | `NewValidationError(field, value, constraint)` | `Field`, `Value`, `Constraint`                       |
| `AuthError`       | `NewAuthError(code, msg)`                      | `RequiredPermission`, `CurrentPermission`, `UserID`  |
| `NetworkError`    | `NewNetworkError(code, msg, host)`             | `Host`, `Port`, `Timeout`                            |
| `ResourceError`   | `NewResourceError(code, msg, type, id)`        | `ResourceType`, `ResourceID`, `CurrentState`         |
| `InternalError`   | `NewInternalError(msg, cause)`                 | `StackTrace` (dev only), `Component`                 |

Fluid builder methods attach extra context without mutating the original:

```go
err := NewProtocolError(CodeConnectionFailed, "SSH refused", "SSH").
    WithRouter(routerID, host).
    WithConnectionID(connID)
```

#### Helper Functions

```go
// Inspection
IsRouterError(err error) bool
GetRouterError(err error) *RouterError
IsCategory(err error, category ErrorCategory) bool
IsRecoverable(err error) bool

// Wrapping a raw error into RouterError
Wrap(err error, code string, category ErrorCategory, message string) *RouterError

// Convenience GraphQL error constructors (for resolver use)
NewGraphQLValidationError(ctx, field, message string, value interface{}) *gqlerror.Error
NewGraphQLAuthError(ctx, message, code string) *gqlerror.Error
NewGraphQLProtocolError(ctx, message, protocol, routerID string) *gqlerror.Error
```

---

### Error Presentation for GraphQL (`presenter.go`)

`ErrorPresenter` is registered as the gqlgen error presenter (see `03-graphql-api.md`). It runs on
every error returned from a resolver before it is sent to the client.

```go
func ErrorPresenter(ctx context.Context, err error) *gqlerror.Error
```

**Flow:**

1. Extract `requestID` from context (`apperrors.RequestIDKey`).
2. Check `isProduction` flag from context (`apperrors.ProductionModeKey`).
3. `errors.As(RouterError)` → `presentRouterError()`:
   - Production mode: call `RedactErrorForProduction()` (strips internal details, redacts context).
   - Build `extensions` map: `code`, `category`, `recoverable`, `requestId`.
   - Append `suggestedFix` from `SuggestedFix(err)`.
   - Append `docsUrl` from `DocsURL(code)` → `https://docs.nasnet.io/errors/{category}#{code}`.
   - For `protocol`/`network` categories, append `troubleshootingSteps`.
   - For validation errors, include `field` and `value`.
4. `errors.As(*gqlerror.Error)` → pass through + inject `requestId`.
5. Unknown error → `presentUnknownError()` (generic `I500`, message redacted in production).

**Configuring the presenter:**

```go
presenter := apperrors.NewErrorPresenter(&apperrors.PresenterConfig{
    Production:    true,
    BaseDocsURL:   "https://docs.nasnet.io/errors",
    IncludeStacks: false,
})
// Register with gqlgen server config
srv := handler.New(schema)
srv.SetErrorPresenter(presenter)
```

**Example client response (validation error):**

```json
{
  "errors": [
    {
      "message": "Validation failed for field 'listenPort': must be >= 1024",
      "path": ["createService", "input", "listenPort"],
      "extensions": {
        "code": "V400",
        "category": "validation",
        "field": "input.listenPort",
        "value": 80,
        "recoverable": true,
        "requestId": "01H7XK…",
        "suggestedFix": "The field 'listenPort' is out of range. Use a value >= 1024.",
        "docsUrl": "https://docs.nasnet.io/errors/validation#v400"
      }
    }
  ]
}
```

**Panic recovery:**

```go
func ErrorRecoverer(ctx context.Context, p interface{}) error
```

Registered as gqlgen's `RecoverFunc`. Converts panics to `InternalError` with the request ID and
panic value attached to the context map.

---

### Suggested Fixes & Docs URLs (`suggestions.go`)

`SuggestedFix(err)` inspects the concrete error type and code to produce a human-readable action
item:

- **Validation** — field name + constraint description
- **Protocol** — per-code hint mentioning the protocol and possible causes
- **Auth** — distinguishes expired session, insufficient permissions, invalid credentials
- **Network** — mentions the target host, suggests ping/traceroute
- **Platform** — suggests firmware upgrade or package installation
- **Resource** — mentions the resource type, ID, and current state

`DocsURL(code)` generates the documentation URL:

```
https://docs.nasnet.io/errors/{category_path}#{lowercase_code}
```

`TroubleshootingSteps(err)` returns an ordered `[]string` checklist for `protocol` and `network`
errors (also included in the GraphQL error extension).

`HTTPStatusCode(err)` maps error categories to HTTP status codes for any REST error responses:

| Category                     | Status |
| ---------------------------- | ------ |
| `validation`                 | 400    |
| `auth` (session/credentials) | 401    |
| `auth` (permissions)         | 403    |
| `resource` (not found)       | 404    |
| `resource` (locked/busy)     | 409    |
| `resource` (bad state)       | 422    |
| `network`, `protocol`        | 503    |
| `internal`                   | 500    |

---

### Sensitive Data Redaction (`redactor.go`)

The redactor automatically removes credentials and PII from error context before they appear in logs
or API responses.

**Key-based redaction** — `IsSensitiveKey(key)` matches (case-insensitive):

```
password, passwd, secret, token, api_key, apikey, credential,
authorization, bearer, private_key, ssh_key, access_token,
refresh_token, session_id, cookie, auth_code, auth_header, client_secret
```

**Value-based redaction** — `IsSensitiveValue(value)` detects:

- JWT tokens (`eyJ…`)
- `Bearer …` strings
- Long alphanumeric strings (32–64 chars)
- SHA-256 hashes (64 hex chars)
- Base64-encoded blobs (40+ chars)
- IPv4 addresses (device-identifying)

**Functions:**

```go
// Global helpers
IsSensitiveKey(key string) bool
IsSensitiveValue(value string) bool
RedactString(key, value string) string
RedactMap(data map[string]interface{}) map[string]interface{}
RedactError(err *RouterError) *RouterError

// Production-mode stripping
RedactErrorForProduction(err *RouterError, requestID string) *RouterError
// → Internal errors: replace message with generic "An internal error occurred."
// → Other errors: RedactMap context, strip Cause, ensure requestId present

// Configurable redactor (custom patterns + allowlist)
r := apperrors.NewRedactor()
_ = r.AddPattern(`(?i)my_custom_field`)
r.AllowKey("model_version") // safe even if it looks like a token
redacted := r.Redact(dataMap)
```

---

### Structured Logging (`logger.go`)

`internal/logger` wraps zap in a singleton pattern with two pre-defined configurations:

```go
// Production (default)
logger.DefaultConfig()
// → Level: info, JSONOutput: true, Development: false

// Development
logger.DevelopmentConfig()
// → Level: debug, JSONOutput: false (console with color), Development: true
```

**Initialization** (call once at startup):

```go
logger.Init(logger.DefaultConfig()) // or DevelopmentConfig()
defer logger.Sync()                 // flush buffered entries
```

**Global accessors:**

```go
logger.L() *zap.Logger          // structured logger
logger.S() *zap.SugaredLogger   // printf-style sugared logger
```

**Request-correlated helpers:**

```go
// Attach request_id field from context
logger.WithRequestID(ctx) *zap.Logger

// Convenience shorthand (attaches request_id automatically)
logger.DebugCtx(ctx, "msg", zap.String("key", "value"))
logger.InfoCtx(ctx, "msg", ...)
logger.WarnCtx(ctx, "msg", ...)
logger.ErrorCtx(ctx, "msg", ...)
```

**JSON field names** (production output):

| Key          | Content                             |
| ------------ | ----------------------------------- |
| `timestamp`  | ISO 8601                            |
| `level`      | `debug` / `info` / `warn` / `error` |
| `caller`     | `package/file.go:line`              |
| `message`    | log message                         |
| `request_id` | from context (when set)             |
| `stacktrace` | only in development mode            |

---

### Error Logging Integration (`logging.go`)

`apperrors.LogLevel(category)` maps error category to zap level:

```go
CategoryAuth      → InfoLevel   // expected, not alarming
CategoryValidation → WarnLevel
CategoryProtocol  → WarnLevel
CategoryNetwork   → WarnLevel
CategoryPlatform  → WarnLevel
CategoryResource  → WarnLevel
CategoryInternal  → ErrorLevel  // requires investigation
```

`apperrors.ErrorFields(err)` extracts zap fields with automatic redaction:

```go
[]zap.Field{
    zap.String("error_code", "R200"),
    zap.String("error_category", "protocol"),
    zap.String("error_message", "SSH connection refused"),
    zap.Bool("recoverable", true),
    zap.Any("context", redactedCtxMap),
    zap.Bool("has_cause", true), // true if Cause != nil (cause itself not logged)
}
```

**Convenience functions for resolvers:**

```go
// Log at correct level with structured fields
apperrors.LogError(logger, err)

// Same + request_id from context
apperrors.LogErrorCtx(ctx, logger, err)

// Include operation duration
apperrors.LogErrorWithDuration(logger, err, duration)
apperrors.LogErrorCtxWithDuration(ctx, logger, err, duration)

// OOP-style ErrorLogger
el := apperrors.NewErrorLogger(logger)
el.LogCtx(ctx, err)
el.WithRequestID(ctx).LogWithDuration(err, elapsed)
```

---

## Request ID Correlation

The request ID flows through every layer:

1. **Middleware** (`internal/middleware/request_id.go`) generates a ULID at the HTTP boundary and
   stores it:
   ```go
   ctx = apperrors.WithRequestID(ctx, ulid.New())
   ```
2. **Resolvers** extract it via `apperrors.GetRequestID(ctx)`.
3. **`logger.WithRequestID(ctx)`** attaches it as a `request_id` zap field.
4. **`apperrors.ErrorPresenter`** includes it in every GraphQL error extension.

This allows correlating a client-facing error with the exact server log line using only the
`requestId` value.

---

## GraphQL Directive Error Handling

The `@validate`, `@auth`, `@sensitive`, and `@capability` directives in
`internal/graphql/directives/` each produce structured `*gqlerror.Error` objects with typed error
codes:

| Directive                 | Code   | Category   |
| ------------------------- | ------ | ---------- |
| `@validate`               | `V400` | validation |
| `@auth` (unauthenticated) | `A401` | auth       |
| `@auth` (wrong role)      | `A401` | auth       |
| `@capability` (missing)   | `C403` | capability |

All include `suggestedFix`, `docsUrl`, `requestId`, and `recoverable` in extensions.

The `@sensitive` directive marks fields for log redaction: when `GetSensitiveFields(ctx)` shows a
field is sensitive, `redactIfSensitive()` replaces the value with `[REDACTED]` in error extensions.

---

## Error Handling Patterns

**In resolvers:**

```go
// Prefer typed errors over raw fmt.Errorf
if err := doSomething(); err != nil {
    return nil, apperrors.Wrap(err, apperrors.CodeConnectionFailed,
        apperrors.CategoryProtocol, "failed to execute command")
}

// Use convenience constructors for common cases
if !authenticated {
    return nil, apperrors.NewGraphQLAuthError(ctx, "login required", apperrors.CodeAuthFailed)
}
```

**In services (non-GraphQL):**

```go
// Build rich errors for cross-package boundaries
return nil, apperrors.NewNetworkError(apperrors.CodeHostUnreachable, "router unreachable", host).
    WithPort(8728).
    WithTimeout(int(timeout.Milliseconds()))
```

**In background goroutines:**

```go
if err != nil {
    apperrors.LogErrorCtx(ctx, logger.L(), err)
    // Continue or return depending on severity
    if !apperrors.IsRecoverable(err) {
        return
    }
}
```

---

## Cross-References

- [See: 03-graphql-api.md §Error Handling] — gqlgen presenter/recoverer registration
- [See: 12-security.md §Audit Logging] — auth error audit trail
- [See: 02-application-bootstrap.md §Logger Initialization] — `logger.Init` call site
- [See: 04-router-communication.md §Error Propagation] — ProtocolError usage in adapters
- [See: 15-connection-management.md §Circuit Breaker] — TransitionError from connection state
