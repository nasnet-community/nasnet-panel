# Getting Started

> Everything you need to set up a local development environment, understand the project layout, and run the NasNet backend.

**Packages:** `cmd/nnc/`, `internal/server/`, `internal/bootstrap/`
**Key Files:** `cmd/nnc/main.go`, `cmd/nnc/main_dev.go`, `cmd/nnc/main_prod.go`, `go.mod`
**Prerequisites:** None — this is the starting point.

---

## Overview

The NasNet backend is a single Go binary that:
- Serves a GraphQL API (via gqlgen + Echo v4)
- Embeds the compiled React frontend (production builds only)
- Manages MikroTik router connections via SSH/REST/RouterOS API
- Orchestrates downloadable network features (Tor, Xray, sing-box, etc.)
- Runs inside a Docker container on the MikroTik router itself

---

## Development Environment Setup

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Go | 1.26+ | Backend language |
| Node.js | 20+ | Frontend tooling, Nx |
| npm | 10+ | Package manager |
| air | latest | Hot-reload dev server |
| golangci-lint | 1.60+ | Linter (optional for CI) |
| SQLite libs | system | CGo SQLite driver |

### Install Go

```bash
# Download from https://go.dev/dl/
# Verify installation
go version  # should show go1.26.x
```

### Install air (hot-reload)

```bash
go install github.com/cosmtrek/air@latest
```

### Install Node.js dependencies

```bash
cd /path/to/NasNet
npm install
```

### Set up environment variables

Create `apps/backend/.env.development` (optional, values shown are defaults):

```env
# Data directory for SQLite databases
NASNET_DATA_DIR=./data

# Server port (dev: 8080, prod: 80)
PORT=8080

# Encryption key for credential storage (32 bytes, base64)
# Leave unset in dev — a dummy key is used automatically
DB_ENCRYPTION_KEY=

# GitHub token for binary downloads (optional, avoids rate limits)
GITHUB_TOKEN=
```

---

## Build Tags

The backend uses Go build tags to separate development and production builds:

| Tag | Description |
|-----|-------------|
| `dev` | Development mode: CORS enabled, GraphQL Playground, larger buffers, debug logging, Vite dev server for frontend |
| `!dev` (default) | Production mode: frontend embedded via `//go:embed dist/**`, tighter resource limits, info-level logging |

```go
// main_dev.go — only compiled with: go build -tags=dev
//go:build dev

// main_prod.go — compiled by default (no tags)
//go:build !dev
```

Key differences between modes:

| Aspect | Development | Production |
|--------|-------------|-----------|
| Port | 8080 | 80 |
| Frontend | Served by Vite (separate) | Embedded in binary |
| CORS | All origins allowed | Restricted |
| GraphQL Playground | `/playground` enabled | Disabled |
| Logger | Debug level, development format | Info level, JSON |
| GC Percent | 100 (default) | 10 (aggressive) |
| Memory Limit | 128 MB | 32 MB |
| GOMAXPROCS | 2 | 1 |
| EventBus buffer | 1024 | 256 |
| Scanner workers | 4 | 2 |

---

## Project Layout

```
apps/backend/
├── cmd/
│   └── nnc/                    # Application entry point
│       ├── main.go             # Entry point: flag parsing → run()
│       ├── main_dev.go         # Development run() function (build tag: dev)
│       ├── main_prod.go        # Production run() function (build tag: !dev)
│       ├── routes_prod.go      # Production route registration
│       ├── handlers.go         # HTTP handlers (health, scan, proxy, OUI)
│       ├── services_prod.go    # Top-level service initialization
│       ├── services_core.go    # Core services (auth, scanner, capability)
│       ├── services_network.go # Network services (IP, WAN, bridge, VLAN)
│       ├── services_storage.go # Storage + VIF initialization
│       ├── services_orchestrator.go  # Orchestrator initialization
│       ├── services_templates.go    # Template + update initialization
│       ├── services_monitoring.go   # Monitoring + traffic + scheduling
│       ├── services_integration.go  # Integration services (webhook, config, sharing)
│       └── dist/               # Embedded frontend (production only)
│
├── graph/
│   ├── generated.go            # gqlgen-generated GraphQL server (DO NOT EDIT)
│   ├── model/models_gen.go     # gqlgen-generated Go types (DO NOT EDIT)
│   └── resolver/               # Hand-written GraphQL resolver functions
│       ├── resolver.go         # Resolver struct + Config
│       ├── auth.resolvers.go
│       ├── core-queries.resolvers.go
│       ├── alerts-*.resolvers.go
│       └── ...                 # One file per domain
│
├── generated/
│   └── ent/                    # ent ORM generated code (DO NOT EDIT)
│       ├── client.go           # ent.Client (main entry point)
│       ├── schema.go           # Schema definitions
│       └── ...
│
├── internal/                   # Core domain logic
│   ├── bootstrap/              # Service wiring and initialization
│   ├── server/                 # HTTP server (Echo v4)
│   ├── database/               # SQLite manager (system.db + router-{id}.db)
│   ├── events/                 # Watermill event bus
│   ├── auth/                   # JWT authentication
│   ├── alerts/                 # Alert engine, escalation, digest
│   ├── vif/                    # Virtual Interface Factory
│   ├── orchestrator/           # Feature lifecycle management
│   │   ├── boot/               # Boot sequence manager
│   │   ├── dependencies/       # Dependency graph
│   │   ├── isolation/          # Config validation, isolation verification
│   │   ├── lifecycle/          # Instance manager
│   │   ├── resources/          # Resource limiter + poller
│   │   ├── scheduling/         # Schedule evaluator
│   │   └── supervisor/         # Process supervisor
│   ├── router/                 # MikroTik adapters (SSH, REST, API, Telnet)
│   ├── provisioning/           # Network provisioning engine
│   ├── features/               # Feature registry, download, verification
│   ├── notifications/          # Notification channels (email, telegram, etc.)
│   ├── services/               # Domain service layer (alert, router, VPN, etc.)
│   ├── firewall/               # Firewall rules (address lists, NAT)
│   ├── network/                # Port registry, VLAN allocator
│   ├── dns/                    # DNS lookup and resolver
│   ├── scanner/                # Network scanner (ARP/subnet discovery)
│   ├── storage/                # Storage detector, path resolver
│   ├── encryption/             # AES-256-GCM credential encryption
│   ├── credentials/            # Router credential management
│   ├── capability/             # Router capability detection + caching
│   ├── templates/              # Service template management
│   ├── traceroute/             # Traceroute implementation
│   ├── troubleshoot/           # Troubleshooting wizard
│   ├── graphql/                # DataLoaders, directives
│   ├── middleware/             # Auth middleware, request ID
│   └── ...
│
├── internal/ent-schema/
│   └── schema/                 # ent schema definitions (source of truth)
│
├── go.mod                      # Module: backend (Go 1.26)
├── go.sum
├── Dockerfile                  # Multi-stage build (<10MB)
└── project.json                # Nx project config
```

---

## Common Development Commands

### Run the backend (with hot reload)

```bash
# Hot-reload via air (recommended)
npm run dev:backend

# Or directly with go run
cd apps/backend
go run -tags=dev ./cmd/nnc/
```

### Run the frontend + backend together

```bash
npm run dev:all
```

### Build for production

```bash
# Build frontend first (required — gets embedded)
npm run build:frontend

# Then build Go binary with embedded frontend
npx nx build backend
```

### Run Go tests

```bash
# All backend tests
npx nx run backend:test

# Or directly
cd apps/backend
go test -tags=dev ./...

# Specific package
go test -tags=dev ./internal/alerts/...

# With verbose output
go test -tags=dev -v ./internal/vif/...
```

### Linting (use small scopes to avoid parallel lint errors)

```bash
# Single package
cd apps/backend
golangci-lint run ./internal/specific_package/

# Build + vet check (faster than full lint)
go build ./...
go vet ./...
```

### GraphQL code generation

```bash
# After changing schema/*.graphql files
npm run codegen:gqlgen    # Regenerates graph/generated.go and models_gen.go
npm run codegen:ent       # Regenerates generated/ent/
npm run codegen           # Both TypeScript + Go
```

### Health check

```bash
# While server is running on port 8080 (dev)
curl http://localhost:8080/health

# Using the built-in health check flag
./nnc --healthcheck
```

---

## Step-by-Step Startup Sequence

When the application starts in **production** (`main_prod.go`), it follows this sequence:

```
1. init() — Apply runtime config (GOMAXPROCS=1, GC=10%, MEM=32MB)
           — Initialize scanner pool

2. run()  — Load server config (Port from $PORT, default :80)
           — Load runtime config (from DefaultProdRuntimeConfig)
           — Initialize EventBus (Watermill, buffer=256)
           — Initialize Database (SQLite, $NASNET_DATA_DIR or /var/nasnet)
           — Initialize Logger (zap production config)
           — Initialize MockRouterAdapter (placeholder)
           — Initialize core services (troubleshoot, interface)
           — Initialize Alert System (engine, dispatcher, escalation, digest)
           — Initialize All Production Services (13 service groups)
           — Create HTTP server (Echo v4)
           — Apply production middleware
           — Serve embedded frontend (from dist/)
           — Create ShutdownCoordinator
           — Register all routes (/graphql, /api/*, /*)
           — Start Boot Sequence (goroutine: auto-start services)
           — Print startup banner
           — Start HTTP server (blocking)
           — On SIGINT/SIGTERM: graceful shutdown via ShutdownCoordinator
```

In **development** (`main_dev.go`), the sequence is simpler (no bootstrap abstraction, fewer services).

[See: application-bootstrap.md §Service Initialization Order]

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `80` (prod) / `8080` (dev) | HTTP listen port |
| `NASNET_DATA_DIR` | `/var/nasnet` (prod) / `./data` (dev) | SQLite database directory |
| `DB_ENCRYPTION_KEY` | *(auto-generated dummy)* | AES-256 key for credential encryption (base64, 32 bytes) |
| `GITHUB_TOKEN` | *(empty)* | GitHub token for feature binary downloads |

---

## Running Tests

### Unit tests

```bash
cd apps/backend
go test -tags=dev ./...
```

### Tests with CHR (RouterOS simulator)

For integration tests that require a real RouterOS instance, the project uses CHR (Cloud Hosted Router) in Docker. See `Docs/architecture/implementation-patterns/testing-strategy-patterns.md`.

### Test coverage

```bash
go test -tags=dev -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

---

## Debugging Tips

### Enable debug logging

Set `loggerConfig.Level = zap.NewAtomicLevelAt(zap.DebugLevel)` in `main_dev.go` (already done in dev mode).

### Inspect the GraphQL schema

Navigate to `http://localhost:8080/playground` in dev mode for the interactive GraphQL playground (GraphiQL).

### SQLite inspection

```bash
# Open the system database
sqlite3 ./data/system.db

# List tables
.tables

# Query service instances
SELECT id, name, status FROM service_instances;
```

### Check goroutine leaks

```bash
curl http://localhost:8080/debug/pprof/goroutine?debug=2
```
(Only if pprof is enabled in dev mode)

### Common startup failures

| Error | Cause | Fix |
|-------|-------|-----|
| `failed to create data directory` | Insufficient permissions | `mkdir -p ./data && chmod 755 ./data` |
| `integrity check failed` | Corrupted SQLite DB | Delete `./data/system.db` and restart |
| `failed to create event bus` | Invalid buffer size | Check `RuntimeConfig.EventBusBufferSize > 0` |
| `dist/**` embed fails | Frontend not built | Run `npm run build:frontend` first |

---

## Cross-References

- [See: index.md §Package Dependency Diagram] — How packages relate to each other
- [See: application-bootstrap.md §Service Initialization Order] — Detailed bootstrap sequence
- [See: graphql-api.md §Overview] — GraphQL schema and resolver patterns
- [See: data-layer.md §Database Manager] — SQLite and ent ORM details
