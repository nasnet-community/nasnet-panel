# Process Isolation

## Overview

Process isolation ensures that each service instance (Tor, sing-box, Xray, etc.) operates within a strictly bounded environment: a specific VLAN IP address, a sandboxed directory with correct permissions, and non-conflicting ports. The system enforces these constraints through a **four-layer pre-start verification pipeline** (`IsolationVerifier`) that runs before any process is started or restarted.

In addition, this document covers the HTTP server that hosts the frontend and API (`server.go`/`static.go`), health probe types used by the orchestrator and container healthcheck, and the authentication + request-ID middleware applied to every API request.

## Architecture

```
                ┌──────────────────────────────────────────────────┐
                │              IsolationVerifier                   │
                │  PortRegistryPort (interface)                    │
                │  ConfigBindingValidatorPort (interface, optional)│
                │  EventBus                                        │
                │  allowedBaseDir ("/data/services")               │
                └──────────────┬───────────────────────────────────┘
                               │ VerifyPreStart(ctx, instanceID, ...)
                               ▼
          ┌────────────────────────────────────────────────┐
          │            4-Layer Verification Pipeline        │
          │                                                │
          │  Layer 1: verifyIPBinding                      │
          │    ├─ ConfigBindingValidatorPort.Validate()    │
          │    └─ or: direct ValidateBindIP(bindIP)        │
          │                                                │
          │  Layer 2: verifyDirectory                      │
          │    ├─ os.Stat (must exist)                     │
          │    ├─ perm & 0777 == 0750 (no group/other w)   │
          │    ├─ filepath.EvalSymlinks (no escape)        │
          │    └─ strings.HasPrefix(allowedBaseDir)        │
          │                                                │
          │  Layer 3: verifyPorts                          │
          │    └─ PortRegistryPort.IsPortAllocated()       │
          │       (each allocatedPort must be registered)  │
          │                                                │
          │  Layer 4: verifyProcessBinding (warning only)  │
          │    └─ /proc/net/tcp check (Linux)              │
          │       no hard failure — informational only     │
          └───────────────────┬────────────────────────────┘
                              │ returns *IsolationReport
                              ▼
          ┌──────────────────────────────────────┐
          │           IsolationReport            │
          │  Violations []IsolationViolation     │
          │  BindIP      string                  │
          │  AllocatedPorts []int                │
          │  HasViolations() bool                │
          └──────────────────────────────────────┘
                              │ on violations
                              ▼
                    emitIsolationViolationEvent → EventBus
```

```
HTTP Server (Echo v4)
┌────────────────────────────────────────┐
│  Server.Start(e *echo.Echo, cfg Config)│
│    ├─ goroutine: wait SIGINT/SIGTERM   │
│    ├─ shutdownFn() (app cleanup)       │
│    └─ e.Shutdown(ctx, 15s timeout)    │
│                                        │
│  PerformHealthCheck()                  │
│    └─ GET /health, 10s timeout        │
│       exit(0) on 200, exit(1) else    │
└────────────────────────────────────────┘

Static File Handler (SPA)
┌──────────────────────────────────────────┐
│  NewFrontendHandler(fs embed.FS)         │
│    ├─ Skip: /api/*, /graphql, /health    │
│    ├─ Path normalization + traversal guard│
│    ├─ .gz pre-compressed serving         │
│    │    (JS/CSS + Accept-Encoding: gzip) │
│    ├─ SPA fallback → index.html          │
│    └─ Cache headers:                     │
│         assets/ → immutable (1yr)        │
│         index.html → no-cache            │
│         others  → 1h                     │
└──────────────────────────────────────────┘
```

```
Middleware Stack (per request)
  RequestIDMiddleware → AuthMiddleware → ProductionModeMiddleware → handler

RequestIDMiddleware:
  Read X-Request-ID header | generate ULID (monotonic, mutex-protected)
  Set on response header + context (internalerrors.WithRequestID)

AuthMiddleware:
  Skipper: /health, /ready, /playground
  Try: JWT Bearer → JWT Cookie → API Key
  On success: set context keys (User, Claims, AuthMethod, Session)
  JWT: sliding session refresh (ShouldRefresh → RefreshToken → set cookie)

ProductionModeMiddleware:
  Adds production flag to context (controls error detail in responses)
```

## Package Reference

### `internal/orchestrator/isolation` — Pre-Start Verification

**`isolation_verifier.go`**

```go
// IsolationVerifier runs 4-layer pre-start checks.
type IsolationVerifier struct {
    portRegistry      PortRegistryPort
    configValidator   ConfigBindingValidatorPort  // optional, nil-safe
    eventBus          events.EventBus
    log               *zap.SugaredLogger
    allowedBaseDir    string  // default: "/data/services"
}

// VerifyPreStart runs all layers and returns an IsolationReport.
// Non-nil report is always returned; check report.HasViolations() for failures.
func (v *IsolationVerifier) VerifyPreStart(
    ctx context.Context,
    instanceID string,
    bindIP string,
    workDir string,
    allocatedPorts []int,
) (*IsolationReport, error)

// IsolationReport summarises results of all verification layers.
type IsolationReport struct {
    Violations     []IsolationViolation
    BindIP         string
    AllocatedPorts []int
}
func (r *IsolationReport) HasViolations() bool

// IsolationViolation describes a single failed check.
type IsolationViolation struct {
    Layer   int     // 1–4
    Code    string  // e.g. "IP_BINDING_INVALID", "DIRECTORY_PERM_INSECURE"
    Message string
}
```

**Layer 1 — IP Binding (`verifyIPBinding`)**

Calls `ConfigBindingValidatorPort.ValidateBinding(instanceID, bindIP)` if the port is configured. Falls back to calling `cfglib.ValidateBindIP(bindIP)` directly. Rejects `""`, `0.0.0.0`, `::`, and all loopback addresses.

**Layer 2 — Directory (`verifyDirectory`)**

Sequence of checks applied to `workDir`:
1. `os.Stat(workDir)` — directory must exist
2. `stat.Mode() & 0777 != 0750` — must be exactly `0750`; `0755`/`0777`/`0700` are violations
3. `filepath.EvalSymlinks(workDir)` — resolves any symlinks
4. `strings.HasPrefix(resolved, allowedBaseDir)` — must be under `/data/services` (or configured base); symlink escapes are caught here

**Layer 3 — Ports (`verifyPorts`)**

For each port in `allocatedPorts`:
```go
allocated, err := v.portRegistry.IsPortAllocated(ctx, instanceID, port)
// allocated == false → violation: port not in registry
```
Ensures all ports the instance expects to use were legitimately allocated via the PortRegistry before the process starts. Ports that aren't registered are flagged as `PORT_NOT_ALLOCATED`.

**Layer 4 — Process Binding (`verifyProcessBinding`)**

Checks `/proc/net/tcp` on Linux to detect if another process is already listening on the same port. This layer emits **warnings only** — it never causes a hard violation. This is intentional: on some platforms (Windows), the check is a no-op, and race conditions between check and bind are acceptable given the port-registry lock provides the primary guard.

**Event emission:**

When `HasViolations()` is true after all layers, `emitIsolationViolationEvent` publishes a structured event to the `EventBus` containing the instance ID, bind IP, and violation details.

**Test coverage highlights:**

- Layer 1: empty bind IP → violation; valid VLAN IP → passes; `ConfigBindingValidator` called when configured
- Layer 2: missing binary dir → violation; workDir outside allowedBaseDir → violation; `0755` permissions → violation (`DIRECTORY_PERM_INSECURE`); `0750` → passes
- Layer 2: symlink pointing outside allowedBaseDir → violation (symlink escape)
- Layer 3: port not in registry → violation; port properly allocated → passes
- Layer 4: warning only, no blocking failure regardless of binding state
- Cross-instance access: known limitation (one instance cannot be isolated from another instance's dir — controlled by OS user/group, not this verifier)

### `internal/server` — HTTP Server

**`server.go`**

```go
// Config holds HTTP server tuning parameters.
type Config struct {
    Port         int
    ReadTimeout  time.Duration  // prod: 30s, dev: 60s
    WriteTimeout time.Duration  // prod: 30s, dev: 60s
    IdleTimeout  time.Duration  // prod: 60s, dev: 120s
}

// Start starts the Echo server and blocks until shutdown signal.
// On SIGINT or SIGTERM: calls shutdownFn, then e.Shutdown(15s ctx).
func Start(e *echo.Echo, cfg Config, shutdownFn func()) error

// PerformHealthCheck performs a container health check.
// GET /health with 10s timeout. Exits 0 on HTTP 200, exits 1 otherwise.
// Called by Dockerfile HEALTHCHECK instruction.
func PerformHealthCheck(port int)
```

The graceful shutdown sequence:
```
SIGINT/SIGTERM received
    │
    ├─ shutdownFn()          // app-level cleanup (close DB, stop services)
    └─ e.Shutdown(ctx)       // 15s drain window for in-flight requests
```

**`static.go`**

```go
// NewFrontendHandler returns an Echo handler serving the embedded SPA.
func NewFrontendHandler(fs embed.FS) echo.HandlerFunc
```

Request processing:
1. **Route skipping:** If path starts with `/api/`, `/graphql`, or `/health` — return `next(c)` (let Echo route it).
2. **Path normalization:** `path.Clean(urlPath)`, strip leading `/`, reject `..` components.
3. **Traversal guard:** Constructed file path must stay within the FS root.
4. **Pre-compressed serving:** For `.js` and `.css` files, if `Accept-Encoding` contains `gzip` and a `.gz` sibling exists in the FS, serve the `.gz` file with `Content-Encoding: gzip` and correct MIME type.
5. **SPA fallback:** If the requested file doesn't exist → serve `index.html` with `Content-Type: text/html`.
6. **Cache headers:**
   - Path contains `assets/` → `Cache-Control: public, max-age=31536000, immutable`
   - File is `index.html` → `Cache-Control: no-cache`
   - Otherwise → `Cache-Control: public, max-age=3600`

MIME type mapping (subset):

| Extension | MIME |
|---|---|
| `.js` | `application/javascript` |
| `.css` | `text/css` |
| `.json` | `application/json` |
| `.png` | `image/png` |
| `.svg` | `image/svg+xml` |
| `.woff2` | `font/woff2` |
| (default) | `text/html` |

### `internal/common/health` — Health Probes

```go
// Probe is implemented by all health check types.
type Probe interface {
    Check(ctx context.Context) error
    Name() string
}
```

**`TCPProbe`**

```go
type TCPProbe struct {
    Address string        // "host:port"
    Timeout time.Duration // default 5s
}
func (p *TCPProbe) Check(ctx context.Context) error  // net.Dialer.DialContext
func (p *TCPProbe) Name() string
```

Dials the target address. Returns nil on successful TCP connection. Used by the orchestrator to verify a service's listener is up before marking it healthy.

**`HTTPProbe`**

```go
type HTTPProbe struct {
    URL            string
    ExpectedStatus int           // 0 = any 2xx
    Timeout        time.Duration
}
func (p *HTTPProbe) Check(ctx context.Context) error
func (p *HTTPProbe) Name() string
```

Issues an HTTP GET and checks the response status. Returns an error if the status doesn't match `ExpectedStatus` (or is non-2xx when `ExpectedStatus == 0`).

**`ProcessProbe`**

```go
type ProcessProbe struct {
    Name string
    mu   sync.RWMutex
    pid  int
}
func (p *ProcessProbe) Check(ctx context.Context) error  // os.FindProcess + signal(0)
func (p *ProcessProbe) UpdatePID(pid int)
func (p *ProcessProbe) GetPID() int
func (p *ProcessProbe) Name() string
```

On Linux/macOS: sends `signal(0)` to the PID — succeeds if process is alive, returns error otherwise. On Windows: `os.FindProcess` is trusted directly (Windows always returns non-nil). `UpdatePID` is called by the supervisor when a process is (re)started.

**`CompositeProbe`**

```go
type CompositeProbe struct {
    Probes []Probe
    name   string
}
func (p *CompositeProbe) Check(ctx context.Context) error  // all probes must pass
func (p *CompositeProbe) Name() string
```

Runs all constituent probes. Returns the first error encountered. Used for services that have both a TCP listener and an HTTP health endpoint.

### `internal/middleware` — Request Processing

**`auth.go`**

```go
// Context key types (unexported, prevent collisions)
type contextKey string
const (
    UserContextKey       contextKey = "user"
    ClaimsContextKey     contextKey = "claims"
    AuthMethodContextKey contextKey = "auth_method"
    SessionContextKey    contextKey = "session"
)

// Cookie names
const (
    AccessTokenCookie  = "access_token"
    RefreshTokenCookie = "refresh_token"
)

// AuthMiddleware returns an Echo middleware function.
// Skipper: /health, /ready, /playground (always pass through unauthenticated).
func AuthMiddleware(jwtSvc JWTService, apiKeySvc APIKeyService) echo.MiddlewareFunc
```

Authentication attempt order (first success wins):

1. **JWT Bearer:** `Authorization: Bearer <token>` header → `JWTService.ValidateToken`
2. **JWT Cookie:** `access_token` cookie → `JWTService.ValidateToken`
3. **API Key:** `X-API-Key` header → `APIKeyService.ValidateKey`

On successful JWT authentication, `handleTokenRefresh` checks `JWTService.ShouldRefresh(claims)`. If true: calls `RefreshToken` and sets the new `access_token` cookie on the response, then invokes a configured refresh callback (for event publishing).

**Context helper functions (for downstream handlers):**

```go
func UserFromContext(ctx context.Context) (*ent.User, bool)
func ClaimsFromContext(ctx context.Context) (*jwt.Claims, bool)
func AuthMethodFromContext(ctx context.Context) (string, bool)
func SessionFromContext(ctx context.Context) (*ent.Session, bool)
func IsAuthenticated(ctx context.Context) bool
func HasRole(ctx context.Context, role string) bool
```

**Role middleware:**

```go
// AuthRequiredMiddleware rejects unauthenticated requests with 401.
func AuthRequiredMiddleware() echo.MiddlewareFunc

// RoleRequiredMiddleware rejects requests without the specified role with 403.
func RoleRequiredMiddleware(role string) echo.MiddlewareFunc
```

**`request_id.go`**

```go
// RequestIDMiddleware generates or propagates X-Request-ID using ULID.
// ULID properties: time-sortable, globally unique, URL-safe, monotonic entropy.
// Mutex protects the monotonic counter across concurrent requests.
func RequestIDMiddleware() echo.MiddlewareFunc

// ProductionModeMiddleware adds a production flag to the context.
// Used downstream to suppress stack traces and internal error details.
func ProductionModeMiddleware() echo.MiddlewareFunc

// ChainMiddleware chains middlewares in reverse order (first applied = outermost).
func ChainMiddleware(middlewares ...echo.MiddlewareFunc) echo.MiddlewareFunc
```

Request ID logic:
1. Read `X-Request-ID` from incoming request headers
2. If absent or empty: generate new ULID (`ulid.NewString()` with monotonic entropy under mutex)
3. Set `X-Request-ID` on response
4. Store in context via `internalerrors.WithRequestID(ctx, id)`

## Cross-References

- [See: 18-config-generation.md §ValidateBindIP] — validator called in Layer 1 IP binding check
- [See: 10-port-registry.md §AllocatePort] — ports verified in Layer 3 against PortRegistry
- [See: 13-network-services.md §Lifecycle Installer] — IsolationVerifier called before process start
- [See: 05-auth-jwt.md §JWT Service] — JWTService interface used by AuthMiddleware
- [See: 20-router-services.md §Port Registry] — PortRegistryPort implementation details
