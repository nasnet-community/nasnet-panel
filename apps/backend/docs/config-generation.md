# Config Generation

## Overview

The config generation subsystem produces service-specific configuration files for each downloadable
feature (Tor, sing-box, Xray-core, MTProxy, Psiphon, AdGuard Home). It follows a **strategy
pattern**: a common `Generator` interface, a shared `BaseGenerator` with template/JSON rendering,
and per-service concrete generators that embed `BaseGenerator` and add service-specific logic.

A thread-safe `Registry` acts as the central lookup table, mapping service type strings to their
generators. The orchestrator's lifecycle installer calls `Registry.Generate` when provisioning a new
service instance.

All generators enforce a critical invariant: every service must bind to a specific VLAN IP address —
`0.0.0.0` and loopback addresses are rejected by the shared `ValidateBindIP` validator.

## Architecture

```
                    ┌──────────────────────────────────┐
                    │          Registry                │
                    │  map[serviceType]Generator       │
                    │  sync.RWMutex (thread-safe)      │
                    └───────────────┬──────────────────┘
                                    │ Get / Generate / Validate
                                    ▼
                    ┌──────────────────────────────────┐
                    │       Generator (interface)       │
                    │  Generate(id, config, bindIP)     │
                    │  Validate(config, bindIP)         │
                    │  GetSchema() *Schema              │
                    │  GetConfigFileName() string       │
                    │  GetConfigFormat() string         │
                    └───────────────┬──────────────────┘
                                    │ embedded by
                    ┌───────────────▼──────────────────┐
                    │         BaseGenerator             │
                    │  serviceType, *Schema, *Template  │
                    │  RenderTemplate(data) []byte      │
                    │  RenderJSON(v) []byte             │
                    │  ValidateConfig(config, bindIP)   │
                    └───┬─────┬──────┬────┬────┬───┬───┘
                        │     │      │    │    │   │
            ┌───────────┘     │      │    │    │   └──────────────┐
            ▼                 ▼      ▼    ▼    ▼                  ▼
     TorGenerator   SingboxGen XrayGen MTProxy Psiphon     AdguardGen
     (torrc/text)  (json)     (json)  (json)  (json)      (yaml/text)
```

```
TemplateData (passed to RenderTemplate)
  .InstanceID   string
  .BindIP       string
  .Config       map[string]interface{}
  .GetString(key)    → string
  .GetInt(key)       → int
  .GetBool(key)      → bool
  .GetStringSlice(key) → []string  (AdGuard extension)
```

```
Schema
  ServiceType  string
  Version      string
  Fields       []Field
    .Name, .Type, .Required, .Default
    .Min, .Max (int pointers)
    .EnumValues []string
    .Sensitive  bool        ← masked in logs/API
    .Placeholder string

Schema methods:
  MergeWithDefaults(config) map[string]interface{}
  Validate(config, bindIP) error
```

## Package Reference

### `internal/config` — Core Types

**`generator.go`**

```go
// Generator is the strategy interface every service generator implements.
type Generator interface {
    Generate(instanceID string, config map[string]interface{}, bindIP string) ([]byte, error)
    Validate(config map[string]interface{}, bindIP string) error
    GetSchema() *Schema
    GetConfigFileName() string
    GetConfigFormat() string  // "text" | "json" | "yaml"
}

// BaseGenerator provides shared rendering and validation.
type BaseGenerator struct {
    serviceType string
    Schema      *Schema
    tmpl        *template.Template  // nil for JSON generators
}

func (g *BaseGenerator) RenderTemplate(data *TemplateData) ([]byte, error)
func (g *BaseGenerator) RenderJSON(v interface{}) ([]byte, error)          // json.MarshalIndent, 2-space
func (g *BaseGenerator) ValidateConfig(config map[string]interface{}, bindIP string) error
func (g *BaseGenerator) GetSchema() *Schema

// TemplateData is passed into text/template execution.
type TemplateData struct {
    InstanceID string
    BindIP     string
    Config     map[string]interface{}
}
func NewTemplateData(instanceID, bindIP string, config map[string]interface{}) *TemplateData
func (d *TemplateData) GetString(key string) string
func (d *TemplateData) GetInt(key string) int
func (d *TemplateData) GetBool(key string) bool
```

**`registry.go`**

```go
// Registry is the central thread-safe store of all registered generators.
type Registry struct {
    mu         sync.RWMutex
    generators map[string]Generator
}

func NewRegistry() *Registry
func (r *Registry) Register(serviceType string, gen Generator)
func (r *Registry) Get(serviceType string) (Generator, bool)
func (r *Registry) Has(serviceType string) bool
func (r *Registry) List() []string
func (r *Registry) Generate(serviceType, instanceID string, config map[string]interface{}, bindIP string) ([]byte, error)
func (r *Registry) Validate(serviceType string, config map[string]interface{}, bindIP string) error
func (r *Registry) GetSchema(serviceType string) (*Schema, error)
```

**`validators.go`** — shared field-level validators

| Function                               | Validates                                          |
| -------------------------------------- | -------------------------------------------------- |
| `ValidateBindIP(ip)`                   | Non-empty, parseable, not 0.0.0.0/::, not loopback |
| `ValidatePort(port)`                   | 1–65535                                            |
| `ValidatePortString(s)`                | String form of port, same range                    |
| `ValidateNonEmpty(name, val)`          | Non-empty string                                   |
| `ValidateEnum(name, val, allowed)`     | Value in allowed list                              |
| `ValidateRange(name, val, min, max)`   | Numeric within bounds                              |
| `ValidatePositive(name, val)`          | val > 0                                            |
| `ValidateDNSName(name)`                | Non-empty, basic DNS rules                         |
| `ValidateURL(url)`                     | Must start with `http://` or `https://`            |
| `ValidateEmail(email)`                 | Must contain `@`                                   |
| `ValidateStringLength(name, val, max)` | len(val) ≤ max                                     |
| `ValidateIPCIDR(cidr)`                 | Parseable CIDR                                     |
| `ValidateIPRange(start, end)`          | Both parseable IPs, start ≤ end                    |

`ValidateBindIP` is the **VLAN isolation enforcement gate** — it prevents services from listening on
the host network (0.0.0.0) or loopback, ensuring each instance is confined to its allocated VLAN
interface.

### `internal/config/services` — Concrete Generators

#### Tor (`tor.go`)

|             |                     |
| ----------- | ------------------- |
| Output file | `torrc`             |
| Format      | text/template       |
| Constructor | `NewTorGenerator()` |

**Config fields:**

| Field             | Type   | Default             | Notes                         |
| ----------------- | ------ | ------------------- | ----------------------------- |
| `nickname`        | string | `MyTorRelay`        | Alphanumeric, ≤19 chars       |
| `contact_info`    | string | `admin@example.com` | Must be valid email           |
| `relay_type`      | enum   | `relay`             | `relay` \| `bridge` \| `exit` |
| `socks_port`      | port   | 9050                | SOCKS proxy                   |
| `control_port`    | port   | 9051                | Controller                    |
| `or_port`         | port   | 9001                | Onion Router port             |
| `dir_port`        | port   | 9030                | Directory (optional)          |
| `bandwidth_rate`  | int    | 1000                | KB/s, 100–102400              |
| `bandwidth_burst` | int    | 2000                | KB/s, 100–204800              |
| `exit_policy`     | string | `reject *:*`        | Required when relay_type=exit |

**Custom validation:**

- `nickname` ≤ 19 characters
- `contact_info` passes `ValidateEmail`
- `exit_policy` field must be present when `relay_type == "exit"`

**Template conditional blocks:** `{{if eq (.GetString "relay_type") "relay"}}` / `"bridge"` /
`"exit"` — controls which ORPort, DirPort, and ExitPolicy directives appear.

#### sing-box (`singbox.go`)

|             |                         |
| ----------- | ----------------------- |
| Output file | `config.json`           |
| Format      | json (programmatic)     |
| Constructor | `NewSingboxGenerator()` |

**Config fields:**

| Field            | Type   | Default   | Notes                                   |
| ---------------- | ------ | --------- | --------------------------------------- |
| `listen_address` | ip     | —         | Defaults to `bindIP` if absent          |
| `socks_port`     | port   | 10808     | SOCKS5 inbound                          |
| `http_port`      | port   | 10809     | HTTP inbound                            |
| `mixed_port`     | port   | —         | Optional mixed SOCKS/HTTP               |
| `log_level`      | enum   | `info`    | trace/debug/info/warn/error/fatal/panic |
| `dns_server`     | string | `1.1.1.1` | DNS resolver                            |
| `sniff_enabled`  | bool   | true      | Traffic sniffing                        |

**JSON structure produced:**

```json
{
  "log": { "level": "info" },
  "dns": { "servers": ["1.1.1.1"] },
  "inbounds": [
    { "type": "socks", "tag": "socks-in", "listen": "<bindIP>", "port": 10808, "sniff": true },
    { "type": "http", "tag": "http-in", "listen": "<bindIP>", "port": 10809, "sniff": true }
    // + optional mixed inbound if mixed_port > 0
  ],
  "outbounds": [{ "type": "direct", "tag": "direct" }]
}
```

`getIntValue` helper handles both `int` and `float64` (JSON unmarshal produces float64).

#### Xray-core (`xray.go`)

|             |                      |
| ----------- | -------------------- |
| Output file | `config.json`        |
| Format      | json (programmatic)  |
| Constructor | `NewXrayGenerator()` |

**Config fields:**

| Field           | Type   | Default   | Notes                          |
| --------------- | ------ | --------- | ------------------------------ |
| `protocol`      | enum   | `vless`   | vless/vmess/trojan/shadowsocks |
| `port`          | port   | 10443     | Inbound listen port            |
| `uuid`          | string | —         | Required, 36-char UUID         |
| `tls_enabled`   | bool   | false     | Enable TLS on inbound          |
| `tls_cert_path` | string | —         | Required when tls_enabled=true |
| `tls_key_path`  | string | —         | Required when tls_enabled=true |
| `fallback_port` | port   | —         | Optional fallback destination  |
| `log_level`     | enum   | `warning` | debug/info/warning/error/none  |

**Custom validation:**

- `uuid` must be exactly 36 characters
- When `tls_enabled=true`: both `tls_cert_path` and `tls_key_path` must be non-empty

#### MTProxy (`mtproxy.go`)

|             |                                |
| ----------- | ------------------------------ |
| Output file | `config.json`                  |
| Format      | json (CLI args representation) |
| Constructor | `NewMTProxyGenerator()`        |

**Config fields:**

| Field             | Type   | Default | Notes                             |
| ----------------- | ------ | ------- | --------------------------------- |
| `port`            | port   | 8443    | Proxy listen port                 |
| `secret`          | string | —       | Required, 32-char hex (Sensitive) |
| `tag`             | string | —       | Optional Telegram proxy tag       |
| `workers`         | int    | 2       | Worker goroutines                 |
| `max_connections` | int    | 60000   | Max concurrent connections        |
| `stats_port`      | port   | —       | Optional stats HTTP port          |

**Custom validation:**

- `secret` must be exactly 32 characters matching `[0-9a-fA-F]`

The JSON output represents CLI arguments (bind_ip, port, secret, workers, etc.) that the MTProxy
process reads on startup.

#### Psiphon (`psiphon.go`)

|             |                         |
| ----------- | ----------------------- |
| Output file | `config.json`           |
| Format      | json (programmatic)     |
| Constructor | `NewPsiphonGenerator()` |

**Config fields:**

| Field                               | Type   | Default       | Notes                    |
| ----------------------------------- | ------ | ------------- | ------------------------ |
| `socks_port`                        | port   | 1080          | SOCKS proxy port         |
| `http_port`                         | port   | 8080          | HTTP proxy port          |
| `server_entry_signature_public_key` | string | —             | Optional, Sensitive      |
| `server_entry_tags`                 | string | `""`          | Comma-separated tags     |
| `sponsor_id`                        | string | `00000000...` | 32-char hex if custom    |
| `propagation_channel_id`            | string | `00000000...` | 32-char hex if custom    |
| `enable_split_tunnel`               | bool   | false         | Split tunneling          |
| `upstream_proxy_url`                | string | —             | Optional upstream proxy  |
| `log_level`                         | enum   | `info`        | debug/info/warning/error |

**Custom validation:**

- Custom `sponsor_id` (non-default): must be exactly 32 chars
- Custom `propagation_channel_id`: must be exactly 32 chars
- `upstream_proxy_url` if set: must pass `ValidateURL`

`splitCommaSeparated` helper converts comma-separated `server_entry_tags` string to `[]string` for
the Psiphon JSON.

#### AdGuard Home (`adguard.go`)

|             |                         |
| ----------- | ----------------------- |
| Output file | `AdGuardHome.yaml`      |
| Format      | YAML (text/template)    |
| Constructor | `NewAdguardGenerator()` |

**Config fields:**

| Field                 | Type   | Default           | Notes                            |
| --------------------- | ------ | ----------------- | -------------------------------- |
| `web_port`            | port   | 3000              | Web UI port                      |
| `dns_port`            | port   | 53                | DNS listen port                  |
| `admin_user`          | string | `admin`           | Admin username                   |
| `admin_password`      | string | —                 | Required, Sensitive              |
| `upstream_dns`        | string | `1.1.1.1,8.8.8.8` | CSV of upstream resolvers        |
| `bootstrap_dns`       | string | `1.1.1.1,8.8.8.8` | CSV for bootstrapping DoH/DoT    |
| `protection_enabled`  | bool   | true              | DNS protection toggle            |
| `blocking_mode`       | enum   | `default`         | default/nxdomain/null_ip/refused |
| `querylog_enabled`    | bool   | true              | Query log toggle                 |
| `querylog_interval`   | string | `24h`             | Retention duration               |
| `statistics_enabled`  | bool   | true              | Stats collection                 |
| `statistics_interval` | string | `24h`             | Stats retention                  |

`AdguardTemplateData` extends `TemplateData` and adds `GetStringSlice(key)` which splits CSV config
values (like `upstream_dns`) into `[]string` for YAML list rendering.

### Generator Lifecycle (Provisioning Flow)

```
LifecycleInstaller.Install()
    │
    ├─ registry.Get(serviceType)          → Generator
    ├─ generator.Validate(config, bindIP) → error (pre-install check)
    ├─ generator.Generate(id, config, ip) → []byte (rendered config)
    ├─ write file to instanceDir/configFileName
    └─ generator.GetConfigFileName()      → used to set file path
```

The orchestrator calls `Validate` before generating to surface config errors early. If `Generate`
succeeds, the output bytes are written directly to the service's working directory. The file name is
determined by `GetConfigFileName()` (e.g., `torrc`, `config.json`, `AdGuardHome.yaml`).

## Cross-References

- [See: network-services.md §Service Lifecycle] — how generators are invoked during install
- [See: process-isolation.md §Layer 1: IP Binding] — ValidateBindIP enforcement at pre-start
- [See: feature-marketplace.md §Manifests] — how schema fields are declared in JSON manifests
- [See: router-services.md §Port Allocation] — port conflict avoidance before generation
