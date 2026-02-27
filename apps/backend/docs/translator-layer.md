# Translator Layer

> Bidirectional translation between GraphQL field names and RouterOS property names, with type
> conversion, SSH response parsing, and protocol-specific command formatting.

**Packages:** `internal/translator/`, `internal/translator/formatters/`, `internal/router/ssh/`,
`internal/router/ssh/parser/` **Key Files:** `translator/formatters/formatter.go`,
`translator/formatters/api_formatter.go`, `router/ssh/translator.go`,
`router/ssh/parser/table_parser.go`, `router/ssh/parser/terse_parser.go`,
`router/ssh/parser/detail_parser.go`, `router/ssh/parser/keyvalue_parser.go`,
`router/ssh/parser/errors.go` **Prerequisites:** [See: 04-router-communication.md §Package Reference]

---

## Overview

The translator layer sits between the GraphQL API and the RouterOS protocol adapters. Its purpose is
to convert between two incompatible naming and type systems:

- **GraphQL** uses camelCase field names and Go-native types (`bool`, `int`, `time.Duration`)
- **RouterOS** uses kebab-case property names and string-encoded values (`"yes"`/`"no"`,
  `"1d2h30m"`, `"1500"`)

The layer has two major sub-systems:

1. **Field mapping and type conversion** (`internal/translator/`) — Translates field names and value
   types bidirectionally using a registry of explicit mappings with automatic camelCase↔kebab-case
   fallback.
2. **SSH response parsing** (`internal/router/ssh/parser/`) — Parses the four RouterOS CLI output
   formats (terse, table, detail, key-value) into structured records.

---

## Architecture

```
GraphQL Resolver
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              ResponseTranslator / BatchTranslator        │
│  ┌──────────────────────────────────────────────────┐   │
│  │           FieldMappingRegistry                   │   │
│  │  ┌────────────────┐   ┌────────────────────────┐ │   │
│  │  │ Explicit maps  │   │ Auto camelCase↔kebab  │ │   │
│  │  │ (macAddress →  │   │ (txBytes → tx-bytes)  │ │   │
│  │  │  mac-address)  │   │                        │ │   │
│  │  └────────────────┘   └────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Type Converters                        │   │
│  │  Bool │ Int │ Duration │ List │ Size │ MAC │ IP  │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ CanonicalResponse
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Protocol Formatters (FormatterRegistry)     │
│   ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│   │REST Format │  │ API Format │  │   SSH Format     │  │
│   │JSON payload│  │=key=value  │  │ CLI commands     │  │
│   └────────────┘  └────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │ raw bytes
                        ▼
┌─────────────────────────────────────────────────────────┐
│              SSH Parser (SSHParserService)               │
│   ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐   │
│   │  Terse  │ │  Table  │ │  Detail  │ │KeyValue  │   │
│   │priority1│ │priority2│ │priority3 │ │priority5 │   │
│   └─────────┘ └─────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Package Reference

### `internal/translator`

The core package for field name and type translation.

#### Field Mapping Registry

```go
// FieldMapping maps a single GraphQL field to its RouterOS equivalent.
type FieldMapping struct {
    GraphQLField  string    // camelCase name used in GraphQL schema
    MikroTikField string    // kebab-case name used by RouterOS
    Path          string    // RouterOS resource path (e.g., "/interface")
    Type          FieldType // Controls type conversion behavior
}

// FieldType determines how values are converted.
type FieldType string

const (
    FieldTypeString   FieldType = "string"   // No conversion
    FieldTypeInt      FieldType = "int"       // "1500" → int(1500)
    FieldTypeBool     FieldType = "bool"      // "yes"/"no" → bool
    FieldTypeDuration FieldType = "duration"  // "1d2h30m" → time.Duration
    FieldTypeList     FieldType = "list"      // "a,b,c" → []string
    FieldTypeMAC      FieldType = "mac"       // MAC address string (no conversion)
    FieldTypeIP       FieldType = "ip"        // IP address string (no conversion)
    FieldTypeSize     FieldType = "size"      // "1M" → int64(1048576)
)

// FieldMappingRegistry is the bidirectional field translation registry.
type FieldMappingRegistry struct { /* ... */ }

func NewFieldMappingRegistry() *FieldMappingRegistry
func (r *FieldMappingRegistry) Register(m *FieldMapping)

// GraphQL → MikroTik lookup (global, not path-scoped)
func (r *FieldMappingRegistry) GetMikroTikField(graphqlField string) (string, bool)

// MikroTik → GraphQL lookup (path-scoped)
func (r *FieldMappingRegistry) GetGraphQLField(path, mikrotikField string) (string, bool)

// Full mapping lookup (path-scoped)
func (r *FieldMappingRegistry) GetMapping(path, graphqlField string) (*FieldMapping, bool)
func (r *FieldMappingRegistry) GetMappingsForPath(path string) map[string]*FieldMapping

// TranslateFieldName converts a GraphQL field to RouterOS with fallback.
// Falls back to automatic CamelToKebab() if no explicit mapping exists.
func (r *FieldMappingRegistry) TranslateFieldName(graphqlField string) string
```

The registry is populated via `BuildDefaultRegistry()`, which registers mappings for all known
RouterOS paths including `/interface`, `/ip/address`, `/system/resource`, and others.

#### Automatic Name Conversion

For fields without explicit mappings, the translator applies automatic conversion:

```go
// CamelToKebab converts camelCase to kebab-case.
// "macAddress" → "mac-address"
// "txBytes"    → "tx-bytes"
// "freeMemory" → "free-memory"
func CamelToKebab(s string) string

// KebabToCamel converts kebab-case to camelCase.
// "mac-address" → "macAddress"
// "tx-byte"     → "txByte"
// ".id"         → "id"    (MikroTik internal field)
// ".nextid"     → "nextid"
func KebabToCamel(s string) string
```

Note: MikroTik internal fields prefixed with `.` (`.id`, `.nextid`) have the dot stripped during
conversion.

#### Type Parsers (RouterOS → Go)

```go
// ParseMikroTikBool parses RouterOS boolean strings.
// Input: "yes"/"no", "true"/"false", "YES"/"NO", "1"/"0"
// Output: bool
func ParseMikroTikBool(s string) bool

// ParseMikroTikDuration parses RouterOS duration strings.
// Input: "1d", "1h", "30m", "45s", "1d2h3m4s", "1w", "1w2d", "3600" (plain seconds)
// Output: time.Duration
func ParseMikroTikDuration(s string) (time.Duration, error)

// ParseMikroTikList parses comma-separated lists.
// Input: "a,b,c", " a , b , c " (whitespace trimmed)
// Output: []string (nil for empty input)
func ParseMikroTikList(s string) []string

// ParseMikroTikSize parses size strings with K/M/G suffixes.
// Input: "1024", "1K", "1M", "1G"
// Output: int64 in bytes
func ParseMikroTikSize(s string) (int64, error)
```

#### Type Formatters (Go → RouterOS)

```go
// FormatBool converts Go/string booleans to RouterOS format.
// Input: true/"true"/"yes"/"1" → "yes"
// Input: false/"false"/"no"/"0" → "no"
func FormatBool(v interface{}) string

// FormatDuration converts time.Duration or int (seconds) to RouterOS format.
// Input: 25*time.Hour + 30*time.Minute → "1d1h30m"
// Input: int(3600) → "1h"
func FormatDuration(v interface{}) string

// FormatList converts []string to comma-separated string.
// Input: []string{"a","b","c"} → "a,b,c"
func FormatList(v interface{}) string

// FormatMikroTikValue formats any value according to its FieldType.
func FormatMikroTikValue(v interface{}, ft FieldType) string
```

#### Response Translator

The `ResponseTranslator` takes a `CanonicalResponse` from a protocol adapter and produces a
GraphQL-ready response:

```go
// ResponseTranslator converts RouterOS protocol responses to GraphQL format.
type ResponseTranslator struct { /* ... */ }

func NewResponseTranslator(registry *FieldMappingRegistry) *ResponseTranslator

// TranslateResponse converts a single response.
// - Checks context for cancellation
// - Passes error responses through unchanged
// - For data responses: translates field names and converts value types
func (t *ResponseTranslator) TranslateResponse(
    ctx context.Context,
    path string,
    response *CanonicalResponse,
) (*CanonicalResponse, error)

// NormalizeRecord applies universal transformations to any record:
// - ".id" field is renamed to "id"
// - "disabled" bool/string is inverted and renamed to "enabled"
func (t *ResponseTranslator) NormalizeRecord(record map[string]interface{}) map[string]interface{}

// translateRecord translates a single RouterOS record.
// Uses registry mappings first; falls back to auto-conversion.
// Auto-detection attempts int, then bool conversion for unmapped fields.
func (t *ResponseTranslator) translateRecord(path string, record map[string]interface{}) map[string]interface{}
```

**Key invariants:**

- `disabled=yes` → `enabled=false` (field renamed and value inverted)
- `.id=*1` → `id=*1` (dot prefix stripped)
- Nil registry falls back gracefully to auto-conversion
- Context cancellation returns an error immediately

#### Batch and Streaming Translators

```go
// BatchTranslator translates multiple responses in a single call.
type BatchTranslator struct { /* ... */ }

func NewBatchTranslator(registry *FieldMappingRegistry) *BatchTranslator

// TranslateBatch requires len(paths) == len(responses).
// Respects context cancellation.
func (bt *BatchTranslator) TranslateBatch(
    ctx context.Context,
    paths []string,
    responses []*CanonicalResponse,
) ([]*CanonicalResponse, error)

// StreamingResponseTranslator translates a channel of responses.
type StreamingResponseTranslator struct { /* ... */ }

func NewStreamingResponseTranslator(path string, registry *FieldMappingRegistry) *StreamingResponseTranslator

// Translate translates a single response (for one-shot streaming events).
func (srt *StreamingResponseTranslator) Translate(ctx context.Context, response *CanonicalResponse) (*CanonicalResponse, error)

// TranslateChannel returns a new channel of translated responses.
// Closes output channel when input closes or context is cancelled.
// Nil responses from input produce error responses on output.
func (srt *StreamingResponseTranslator) TranslateChannel(ctx context.Context, input <-chan *CanonicalResponse) <-chan *CanonicalResponse
```

---

### `internal/translator/formatters`

Protocol-specific command formatting. Converts `CanonicalCommand` to protocol bytes and parses
responses back.

#### ProtocolFormatter Interface

```go
// ProtocolFormatter converts canonical commands to/from protocol-specific bytes.
type ProtocolFormatter interface {
    Format(cmd *translator.CanonicalCommand) ([]byte, error)
    Parse(response []byte) (*translator.CanonicalResponse, error)
    Protocol() translator.Protocol
}

// FormatterRegistry holds all protocol formatters.
type FormatterRegistry struct { /* ... */ }

func NewFormatterRegistry() *FormatterRegistry // Registers REST, API, SSH formatters
func (r *FormatterRegistry) Register(f ProtocolFormatter)
func (r *FormatterRegistry) Get(protocol translator.Protocol) (ProtocolFormatter, bool)
func (r *FormatterRegistry) Format(protocol translator.Protocol, cmd *translator.CanonicalCommand) ([]byte, error)
func (r *FormatterRegistry) Parse(protocol translator.Protocol, response []byte) (*translator.CanonicalResponse, error)
```

#### APIFormatter

Handles the RouterOS Binary API protocol (port 8728/8729).

**Format output:** A JSON-encoded `APICommand` struct:

```go
type APICommand struct {
    Command string   `json:"command"` // e.g., "/interface/ethernet/print"
    Args    []string `json:"args"`    // e.g., ["=name=ether1", "?.id=*1"]
}
```

**Action-to-verb mapping:** | Canonical Action | API Verb | |-----------------|----------| |
`print`, `get` | `print` | | `add` | `add` | | `set`, `enable`, `disable` | `set` | | `remove` |
`remove` | | `move` | `move` |

**Enable/Disable encoding:**

- `ActionEnable` → `=disabled=no`
- `ActionDisable` → `=disabled=yes`

**Filter operators:** | Operator | API Syntax | |----------|-----------| | Equals | `?field=value` |
| Greater | `?field>value` | | Less | `?field<value` | | Contains | `?field~value` (regex) |

**Parse behavior:**

1. First attempts JSON unmarshalling as `APIResponse` (preferred path)
2. Falls back to parsing raw `!re`/`!done`/`!trap` protocol lines
3. Errors are categorized by RouterOS category code (0–5) and message content

**Error categorization:** | Category/Message Pattern | ErrorCategory |
|--------------------------|---------------| | "not found", "no such item" | `NotFound` | |
"already", "duplicate" | `Conflict` | | "invalid", "bad" | `Validation` | | Category 4 (login
failure) | `Permission` | | All others | `Internal` |

---

### `internal/router/ssh`

SSH-specific translator that bridges between the `router.RouterPort` command interface and the SSH
parser.

```go
// Translator wraps the SSH parser service and normalizer.
type Translator struct {
    parserService parser.SSHParserService
    normalizer    *parser.Normalizer
    converter     *parser.TypeConverter
}

func NewTranslator() *Translator
func NewTranslatorWithConfig(config parser.ParserConfig) *Translator

// ParseResponse parses raw SSH CLI output into router.CommandResult.
func (t *Translator) ParseResponse(ctx context.Context, raw string, hints parser.ParseHints) (*router.CommandResult, error)

// GetParseHintsFromCommand maps router.Command.Action to parser.CommandType.
func GetParseHintsFromCommand(cmd router.Command) parser.ParseHints
```

**Action-to-CommandType mapping:**

| router.Command.Action | parser.CommandType     |
| --------------------- | ---------------------- |
| `"print"`             | `CommandPrint`         |
| `"print detail"`      | `CommandPrintDetail`   |
| `"print terse"`       | `CommandPrintTerse`    |
| `"export"`            | `CommandExport`        |
| `"export verbose"`    | `CommandExportVerbose` |
| `"get"`               | `CommandGet`           |
| (any other)           | `CommandPrint`         |

---

### `internal/router/ssh/parser`

The SSH parser sub-system detects the CLI output format automatically and dispatches to the
appropriate strategy.

#### Parser Strategies and Priority

Four strategies compete to parse each response. The `SSHParserService` tries them in priority order:

| Strategy | Priority | Trigger                                                                                         |
| -------- | -------- | ----------------------------------------------------------------------------------------------- |
| Terse    | 1        | `CommandPrintTerse` hint OR semicolon-separated `key=value` pairs                               |
| Table    | 2        | Flag definition line (`Flags: X - disabled`) OR `#` header OR multiple uppercase column headers |
| Detail   | 3        | `CommandPrintDetail` hint OR indented `key=value` rows with continuation lines                  |
| KeyValue | 5        | `CommandSystemResource`/`CommandGet` hint OR ≥3 `key: value` colon-separated lines              |

All strategies implement `ParserStrategy`:

```go
type ParserStrategy interface {
    Name() string
    Priority() int
    CanParse(raw string, hints ParseHints) bool
    Parse(ctx context.Context, raw string, hints ParseHints) (*ParseResult, error)
}
```

All strategies respect context cancellation and pass the `Normalizer` to normalize field names
before returning resources.

#### Terse Parser (`terse_parser.go`)

RouterOS 6.43+ preferred format. Most reliable.

**Input format:**

```
.id=*1;name=vpn-usa;listen-port=51820;mtu=1420;running=true
.id=*2;name=vpn-eu;listen-port=51821;mtu=1420;running=true
```

Each line is a single resource. Pairs are semicolon-separated `key=value`. Quoted values (single or
double) are supported and unquoted.

#### Table Parser (`table_parser.go`)

Fixed-width column format for list output.

**Input format:**

```
Flags: X - disabled, R - running
 #   NAME      LISTEN-PORT   MTU    RUNNING
 0 R vpn-usa   51820         1420   true
 1 R vpn-eu    51821         1420   true
```

Row extraction steps:

1. Parse `Flags:` line for flag character definitions
2. Locate header line (by uppercase words or `#` prefix)
3. Extract column positions using regex on header
4. For each data row: extract row number, flag characters, then column values by position
5. Fall back to whitespace splitting if position-based extraction yields no data

**Flag characters:** `X` (disabled), `R` (running), `D` (dynamic), `I` (inactive), `A` (active), `C`
(complete), `S` (static), `H` (hw-offload), `P` (passive), `B` (backup), `M` (master), `L` (log),
`E` (established)

#### Detail Parser (`detail_parser.go`)

Multi-line records for `print detail` output.

**Input format:**

```
0 R name="vpn-usa" listen-port=51820 mtu=1420 private-key="xxx"
    running=true disabled=false

1 R name="vpn-eu" listen-port=51821 mtu=1420 private-key="yyy"
    running=true disabled=false
```

Row boundaries: Row start lines have ≤5 leading spaces and begin with a digit optionally followed by
flag characters. Continuation lines have ≥4 leading spaces. A state machine handles quoted values
(including `=` inside quotes).

#### Key-Value Parser (`keyvalue_parser.go`)

Single-resource colon-separated format for system info commands.

**Input format:**

```
uptime: 2w3d12h30m45s
version: 7.13.2 (stable)
board-name: RB4011iGS+5HacQ2HnD-IN
cpu-load: 5
free-memory: 512.0MiB
```

Produces a single resource from all `key: value` pairs. Requires ≥3 valid key-value lines for format
detection.

#### ParseResult and ParseWarning

```go
type ParseResult struct {
    Resources []Resource         // []map[string]any, one per router item
    Metadata  ParseMetadata
    Warnings  []ParseWarning
}

type ParseMetadata struct {
    Format   OutputFormat // "terse", "table", "detail", "keyvalue"
    RowCount int
}

type ParseWarning struct {
    Line    int
    Message string
    Code    WarnCode // WarnMalformedLine
}
```

#### ParseError (`errors.go`)

Rich parse errors with diagnostic context:

```go
type ParseError struct {
    Code        ErrorCode
    Message     string
    Command     string     // SSH command that produced the output
    LineNumber  int        // 1-indexed
    RawSnippet  string     // up to 500 chars of raw output
    Cause       error
    Suggestions []string   // troubleshooting hints
}
```

**Error codes:**

| Code                 | Meaning                          | Retryable |
| -------------------- | -------------------------------- | --------- |
| `PARSE_TIMEOUT`      | Parsing timed out                | Yes       |
| `INVALID_FORMAT`     | Could not detect format          | No        |
| `UNKNOWN_COMMAND`    | Command type not supported       | No        |
| `PARTIAL_PARSE`      | Some rows failed                 | No        |
| `OUTPUT_TOO_LARGE`   | Output exceeds size limit        | No        |
| `MALFORMED_TABLE`    | Table header/column issue        | No        |
| `MALFORMED_DETAIL`   | Detail format quote/indent issue | No        |
| `MALFORMED_EXPORT`   | Export format truncated          | No        |
| `NO_MATCHING_PARSER` | No strategy matched              | No        |
| `EMPTY_OUTPUT`       | Router returned nothing          | No        |

Constructor functions include `WithSuggestions()` and `WithRawSnippet()` for building contextual
errors.

---

## Data Flow Examples

### RouterOS → GraphQL (Read Path)

```
RouterOS output:  {"mac-address": "AA:BB:CC:DD:EE:FF", "mtu": "1500", "disabled": "no"}
                                    ↓ KebabToCamel + FieldMapping
GraphQL response: {"macAddress": "AA:BB:CC:DD:EE:FF", "mtu": 1500, "enabled": true}
```

### GraphQL → RouterOS (Write Path)

```
GraphQL input:    {"macAddress": "AA:BB:CC:DD:EE:FF", "mtu": 1500, "enabled": true}
                                    ↓ CamelToKebab + FormatMikroTikValue
RouterOS command: {"mac-address": "AA:BB:CC:DD:EE:FF", "mtu": "1500", "disabled": "no"}
```

---

## Cross-References

- [See: 04-router-communication.md §Package Reference] — Router adapters that consume formatted commands
  and produce CanonicalResponse
- [See: 03-graphql-api.md] — GraphQL resolvers that call ResponseTranslator
- [See: 08-provisioning-engine.md] — Provisioning uses FieldMappingRegistry for config generation
