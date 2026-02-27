# Validation Pipeline

> Multi-domain input validation across router connection parameters, service configuration, network scanning targets, manifest metadata, and ARP subnet constraints.

**Packages:** `internal/config/`, `internal/router/`, `internal/scanner/`, `internal/scanner/arp/`, `internal/common/manifest/`
**Key Files:** `config/validators.go`, `config/integration_test.go`, `router/validation.go`, `scanner/validation.go`, `scanner/ordering.go`, `scanner/arp/validation.go`, `common/manifest/validate.go`
**Prerequisites:** [See: 08-provisioning-engine.md §Config Pipeline], [See: 10-feature-marketplace.md §Manifest]

---

## Overview

NasNetConnect does not have a single monolithic validation pipeline. Instead, validation is applied at system boundaries in discrete, domain-focused packages:

| Domain | Package | What Is Validated |
|--------|---------|------------------|
| Service config | `internal/config/` | IP binding, ports, DNS names, URLs, emails, CIDR, ranges |
| Router input | `internal/router/` | AddRouter form fields: host, port, username, password, protocol |
| RouterOS response | `internal/scanner/` | REST API response body confidence scoring |
| Scan target | `internal/scanner/` | Subnet or IP range scope, privacy, size |
| ARP scan | `internal/scanner/arp/` | CIDR format, max subnet size |
| Manifest | `internal/common/manifest/` | Feature marketplace manifest structural rules |

Each domain validates at the moment of ingestion: GraphQL mutations validate router inputs before any connection is attempted; config generators validate before file generation; manifest validation runs at download time.

---

## Architecture

```
GraphQL Mutation (AddRouter)
        │
        ▼
┌───────────────────────────┐
│  AddRouterInputValidator  │  internal/router/validation.go
│  - host (IP or hostname)  │
│  - port (1–65535)         │
│  - username (alphanum)    │
│  - password (non-empty)   │
│  - protocolPreference     │
│  - name (length)          │
└───────────────────────────┘

Feature Marketplace → Generator.Validate()
        │
        ▼
┌───────────────────────────┐
│  config.ValidateBindIP()  │  internal/config/validators.go
│  config.ValidatePort()    │
│  config.ValidateDNSName() │
│  config.ValidateURL()     │
│  ... etc.                 │
└───────────────────────────┘

Network Scanner (ScanSubnet)
        │
        ▼
┌───────────────────────────┐
│  scanner.ValidateSubnet() │  internal/scanner/ordering.go
│  - CIDR or range format   │
│  - private IP ranges only │
│  - max /16 (65536 IPs)    │
└───────────────────────────┘

ARP Scan
        │
        ▼
┌───────────────────────────┐
│  arp.validateSubnet()     │  internal/scanner/arp/validation.go
│  - CIDR format only       │
│  - max /16                │
│  - max 2000 IPs returned  │
└───────────────────────────┘

RouterOS REST API Response
        │
        ▼
┌───────────────────────────┐
│ scanner.ValidateRouterOS  │  internal/scanner/validation.go
│   Response()              │
│  - JSON parsing           │
│  - field presence scoring │
│  - confidence threshold   │
└───────────────────────────┘

Manifest Download
        │
        ▼
┌───────────────────────────┐
│  manifest.Validate()      │  internal/common/manifest/validate.go
│  - ID format              │
│  - semantic version       │
│  - architectures          │
│  - port mappings          │
│  - resource budget        │
└───────────────────────────┘
```

---

## Package Reference

### `internal/config` — Service Config Validators

Primitive validation functions used by all six feature config generators (Tor, sing-box, Xray, MTProxy, AdGuard Home, Psiphon). These are composable building blocks, not a structured pipeline.

#### IP Binding Validation

Every config generator calls `ValidateBindIP` before producing any output. This enforces the VIF isolation invariant: services must bind to a specific VLAN IP, never to the wildcard.

```go
// ValidateBindIP validates that a bind IP is not wildcard (0.0.0.0 or ::).
// Returns error for: empty string, invalid IP, unspecified (wildcard), loopback.
func ValidateBindIP(ip string) error
```

**Rejection criteria:**
- Empty string → `"bind IP is required"`
- Unparseable IP → `"invalid IP address: %s"`
- `0.0.0.0` or `::` (IsUnspecified) → `"wildcard IP addresses (...) are not allowed"`
- `127.0.0.1` or `::1` (IsLoopback) → `"loopback IP addresses (...) are not allowed"`

This check is enforced in the integration test suite `TestAllGenerators_IPBinding`, which verifies that all six generators reject `"0.0.0.0"` and `"::"` in both `Validate()` and `Generate()`.

#### Port Validation

```go
// ValidatePort validates that a port number is in range 1–65535.
func ValidatePort(port int) error

// ValidatePortString parses a string port and delegates to ValidatePort.
func ValidatePortString(portStr string) error
```

#### String and Scalar Validators

```go
// ValidateNonEmpty checks that a string is not blank (after TrimSpace).
func ValidateNonEmpty(fieldName, value string) error

// ValidateEnum checks that value is one of allowedValues.
func ValidateEnum(fieldName, value string, allowedValues []string) error

// ValidateRange checks minVal <= value <= maxVal.
func ValidateRange(fieldName string, value, minVal, maxVal int) error

// ValidatePositive checks value > 0.
func ValidatePositive(fieldName string, value int) error

// ValidateStringLength checks minLen <= len(value) <= maxLen.
func ValidateStringLength(fieldName, value string, minLen, maxLen int) error
```

#### Network Address Validators

```go
// ValidateDNSName validates a DNS hostname.
// Rules: non-empty, max 253 chars, only [a-zA-Z0-9-.].
func ValidateDNSName(hostname string) error

// ValidateURL validates HTTP/HTTPS URL prefix.
func ValidateURL(url string) error

// ValidateEmail validates basic email format (contains @, two non-empty parts).
func ValidateEmail(email string) error

// ValidateIPCIDR validates CIDR notation using net.ParseCIDR.
func ValidateIPCIDR(cidr string) error

// ValidateIPRange validates that startIP <= endIP and both are valid IPs.
func ValidateIPRange(startIP, endIP string) error
```

#### Generator Interface

The `config.Generator` interface defines validation as a first-class method:

```go
type Generator interface {
    GetServiceType() string
    GetConfigFormat() string    // "json", "yaml", "text"
    GetConfigFileName() string  // "config.json", "torrc", "AdGuardHome.yaml"
    GetSchema() *Schema
    Validate(config map[string]interface{}, bindIP string) error
    Generate(instanceID string, config map[string]interface{}, bindIP string) ([]byte, error)
}
```

**Pipeline within a generator:**
1. `Validate(config, bindIP)` is called first:
   - Always calls `ValidateBindIP(bindIP)` first
   - Validates required service-specific fields (e.g., port, secret, protocol)
   - Returns on first error
2. `Generate(instanceID, config, bindIP)` repeats validation (defensive) before templating

**Integration tests** (`config/integration_test.go`) verify:
- All 6 generators register without conflict
- `Validate()` accepts valid configs
- `Validate()` rejects wildcard IPs (`0.0.0.0`, `::`)
- `Validate()` rejects invalid IP formats (5 cases: out-of-range, incomplete, extra octets, non-IP, non-numeric)
- `Validate()` rejects empty configs
- `GetConfigFormat()` and `GetConfigFileName()` match expected values
- `GetSchema()` returns consistent, self-validating schema

---

### `internal/router` — Router Input Validator

Validates the `AddRouter` GraphQL mutation input before any connection attempt.

#### ValidationError and ValidationErrors

```go
// ValidationError is a single field-level error.
type ValidationError struct {
    Field         string // e.g., "input.host"
    Code          string // e.g., "REQUIRED", "INVALID_FORMAT", "OUT_OF_RANGE"
    Message       string // human-readable
    Suggestion    string // guidance for fixing
    ProvidedValue string // the invalid value (truncated for display)
}

func (e *ValidationError) Error() string // returns "field: message"

// ValidationErrors is a slice of ValidationError, implements error.
type ValidationErrors []*ValidationError

func (e ValidationErrors) Error() string   // returns first error string
func (e ValidationErrors) HasErrors() bool // true if len > 0
```

#### AddRouterInputValidator

```go
type AddRouterInputData struct {
    Host               string
    Port               *int    // optional
    Username           string
    Password           string
    ProtocolPreference *string // optional
    Name               *string // optional
}

type AddRouterInputValidator struct{}

func NewAddRouterInputValidator() *AddRouterInputValidator

// Validate runs all field validators and aggregates errors.
// All fields are validated independently — multiple errors can be returned.
func (v *AddRouterInputValidator) Validate(input AddRouterInputData) ValidationErrors
```

**Field validation rules:**

| Field | Code | Rule |
|-------|------|------|
| `host` | `REQUIRED` | Must not be empty |
| `host` | `MAX_LENGTH` | Max 253 characters |
| `host` | `INVALID_FORMAT` | Must be valid IP (`network.IsValidIP`) or hostname (`network.IsValidHostname`) |
| `port` | `OUT_OF_RANGE` | Must be 1–65535 (if provided) |
| `username` | `REQUIRED` | Must not be empty |
| `username` | `MAX_LENGTH` | Max 64 characters |
| `username` | `INVALID_CHARS` | Only `[a-zA-Z0-9_\-.@]` allowed |
| `password` | `REQUIRED` | Must not be empty |
| `protocolPreference` | `INVALID_VALUE` | Must be one of: `AUTO`, `REST`, `API`, `API_SSL`, `SSH`, `TELNET` |
| `name` | `MAX_LENGTH` | Max 128 characters (if provided) |

**Design notes:**
- All validators run even if an earlier one fails (collect-all-errors pattern)
- `ProvidedValue` is truncated to 50 chars for sensitive fields to avoid logging credentials
- Helper functions `ValidateHostFormat(host)` and `ValidatePortRange(port)` wrap individual field checks for standalone use

---

### `internal/scanner` — RouterOS Response Validator

Validates whether a REST API response body comes from a RouterOS device.

#### ValidateRouterOSResponse

```go
// RouterOSInfo contains extracted device information and confidence score.
type RouterOSInfo struct {
    Version      string
    Architecture string
    BoardName    string
    Platform     string
    IsValid      bool
    Confidence   int // 0–100+; >=40 with >=3 fields = valid
}

// ValidateRouterOSResponse scores a REST API JSON response body.
// Returns IsValid=false for non-JSON or low-confidence responses.
func ValidateRouterOSResponse(body []byte) RouterOSInfo
```

**Scoring algorithm:**

1. Parse JSON body — failure returns `IsValid=false, Confidence=0`
2. Check for presence of 14 RouterOS-specific fields:
   - `version`, `version-string`, `architecture`, `architecture-name`, `board-name`, `cpu`, `cpu-count`, `cpu-frequency`, `total-memory`, `free-memory`, `platform`, `factory-software`, `uptime`
   - Each present field: `+10 points`
3. Version extraction and scoring:
   - Valid version format (`N.N` or `N.N.N`): `+20`
   - Contains "routers" in version string: `+30`
4. Architecture scoring:
   - Contains `arm`/`x86`/`mips`/`tile` (case-insensitive): `+15`
5. Board name presence: `+15`
6. Platform field contains "mikrotik": `+25`

**Validity threshold:** `presentFields >= 3 AND confidence >= 40`

**HTTP 401 handling** (`handleUnauthorizedResponse`):
- JSON content-type with "unauthorized" or "error" in body → Confidence=35
- `WWW-Authenticate: Basic` header → Confidence=30
- Any 401 on `/rest/system/resource` → Confidence=25 (path itself is strong signal)

#### ValidateSubnet (Scan Target)

```go
// ValidateSubnet validates a network scan target.
// Accepts three formats: CIDR ("192.168.1.0/24"), range ("192.168.1.1-192.168.1.100"),
// or single IP ("192.168.88.1").
func ValidateSubnet(subnet string) error
```

**Format detection:**
- Contains `/` → `validateCIDRSubnet`
- Contains `-` → `validateIPRange`
- Otherwise → `validateSingleIP`

**CIDR validation rules:**
- Must parse with `net.ParseCIDR`
- Must be IPv4 (rejects IPv6 CIDR blocks)
- Must be in private range (`IsPrivateIP`)
- `hostBits <= 16` — max /16 (65,536 IPs). Rejects /15 and larger.

**Range validation rules:**
- Format: `startIP-endIP`
- Both IPs must be valid IPv4
- Both must be in private range
- `startIP <= endIP`
- Range size `<= 65,536`

**Private range check** (`IsPrivateIP`):
- `10.0.0.0/8`
- `172.16.0.0/12` through `172.31.0.0`
- `192.168.0.0/16`

Loopback (`127.x.x.x`), link-local (`169.254.x.x`), and all public IPs are rejected.

---

### `internal/scanner/arp` — ARP Scan Constraints

```go
const (
    MaxSubnetSize = 16   // Maximum CIDR prefix (/16 minimum)
    MaxDevices    = 2000 // Maximum IPs returned from generateIPList
)

// validateSubnet (unexported) validates CIDR for ARP scanning.
// Stricter than scanner.ValidateSubnet: CIDR format only (no range/single-IP).
func validateSubnet(subnet string) error
```

**Rules:**
- Must be valid CIDR (`net.ParseCIDR`)
- `ones >= MaxSubnetSize (16)` — rejects `/15` and larger

**IP list generation:** `generateIPList` iterates the CIDR block up to `MaxDevices=2000` addresses. The `incIP` helper increments byte arrays in-place for efficient traversal.

---

### `internal/common/manifest` — Feature Manifest Validator

Validates feature marketplace manifests at download and import time.

```go
// Validate checks manifest structural correctness.
// Called after JSON unmarshal during feature download.
func (m *Manifest) Validate() error
```

**Validation checks (in order):**

1. **ID** — Required, matches `^[a-z0-9-_]+$` (`idRegexp`)
2. **Name** — Required
3. **Version** — Required, matches semantic version pattern (`^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$`, via `versionRegexp`)
4. **DockerImage** — Required
5. **DockerTag** — Required
6. **Architectures** — At least one; each must be `amd64`, `arm64`, `arm`, or `armv7`
7. **DockerPullPolicy** — If set, must be `always`, `if-not-present`, or `never`
8. **NetworkMode** — If set, must be `bridge`, `host`, or `none`
9. **Port mappings** — For each port: container_port and host_port in 1–65535, protocol is `tcp` or `udp`
10. **Source** — If present: github_owner, github_repo, binary_name are required; archive_format must be `none`/`tar.gz`/`zip`; extract_path required when archive_format is set and not `none`
11. **Resource budget** — min_ram ≥ 0, recommended_ram ≥ 0, recommended_ram ≥ min_ram (when both > 0), cpu_weight 0–100

The `Schema.Validate()` method (called by `GetSchema()` integration tests) performs analogous structural validation on the service config schema definition.

---

## Error Formats

Each domain uses a distinct error style suited to its context:

| Domain | Error Style | Example |
|--------|------------|---------|
| `config/validators.go` | Plain `error` string | `"port must be between 1 and 65535, got 99999"` |
| `router/validation.go` | `ValidationError` struct | `{Field: "input.host", Code: "REQUIRED", Message: "Host is required", Suggestion: "..."}` |
| `scanner/validation.go` | `RouterOSInfo.IsValid=false` | Confidence-scored result, not a Go error |
| `scanner/ordering.go` | Plain `error` string | `"subnet too large: /15 would require scanning..."` |
| `manifest/validate.go` | Plain `error` string | `"manifest ID must contain only lowercase letters..."` |

The `ValidationErrors` type in `internal/router/` is the only aggregating error — it collects all field errors in a single pass. All other validators return on first error.

---

## Integration with Config Generation

The config package validation functions are the primary defense layer before config file generation [See: 08-provisioning-engine.md §Config Pipeline]. The lifecycle is:

```
GraphQL Mutation: CreateServiceInstance
        │
        ▼
1. Generator.Validate(userConfig, bindIP)
   ├── ValidateBindIP(bindIP)           ← Rejects wildcard/loopback
   ├── ValidatePort(port)               ← Rejects out-of-range
   ├── ValidateNonEmpty(...)            ← Rejects missing required fields
   └── Service-specific rules           ← e.g., UUID format for Xray
        │ if error → return GraphQL validation error
        ▼
2. Generator.Generate(instanceID, config, bindIP)
   ├── (repeats Validate defensively)
   └── Template rendering → config bytes
        │
        ▼
3. Write config file to service working directory
4. Start service process [See: 06-service-orchestrator.md]
```

The binding IP (`bindIP`) always comes from the VIF allocation for the service's VLAN, ensuring config validation and VIF isolation operate consistently [See: 07-virtual-interface-factory.md].

---

## Cross-References

- [See: 03-graphql-api.md §Directives] — `@validate` directive for GraphQL-layer input coercion
- [See: 04-router-communication.md §AddRouter] — Router validator used before connection creation
- [See: 08-provisioning-engine.md §Config Pipeline] — Config validators in the provisioning flow
- [See: 10-feature-marketplace.md §Manifest Download] — Manifest validator at download time
- [See: 07-virtual-interface-factory.md] — VIF IP allocation feeds `bindIP` into config validators
