# ROSProxy

A high-performance Go service that acts as a gateway between web frontends and MikroTik RouterOS
devices. It provides a unified REST API for device discovery, configuration management, and bulk
command execution.

## Features

- **Router Proxy** — HTTP/HTTPS proxy to RouterOS REST API with automatic protocol fallback and
  self-signed certificate support
- **Network Scanner** — Discover MikroTik devices via port scanning with RouterOS API validation
- **Batch Executor** — Execute bulk commands with progress tracking, dry-run mode, and automatic
  rollback
- **Multi-Protocol Support** — Connect via RouterOS API (8728/8729), SSH (22), or Telnet (23)
- **CLI Parser** — Translate RouterOS CLI syntax to API commands with `[find]` query support
- **Embedded Frontend** — Production builds embed the frontend for single-binary deployment
- **Container Optimized** — Minimal scratch-based Docker image (~5MB) with multi-arch support

## Architecture

ROSProxy has two build modes controlled by Go build tags:

| Mode        | Build Tag | Port | Frontend                 | Use Case                 |
| ----------- | --------- | ---- | ------------------------ | ------------------------ |
| Development | `dev`     | 8080 | Served separately (Vite) | Hot-reload, CORS enabled |
| Production  | (default) | 80   | Embedded via `go:embed`  | Container deployment     |

**Memory Profile (Production)**:

- Memory limit: 32MB
- GC: Aggressive (10%)
- Worker pool: 2 scanners
- GOMAXPROCS: 1

## API Reference

### Health Check

```
GET /health
```

Returns server health status, memory usage, uptime, and version.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": 1701878400,
  "memory_mb": 12,
  "version": "production-v2.0",
  "uptime": "2h30m15s"
}
```

---

### Router Proxy

```
POST /api/router/proxy
```

Proxies requests to RouterOS REST API. Automatically tries HTTP first, then falls back to HTTPS.

**Request:**

```json
{
  "router_ip": "192.168.88.1",
  "endpoint": "/system/resource",
  "method": "GET",
  "headers": {
    "Authorization": "Basic YWRtaW46cGFzc3dvcmQ="
  },
  "body": null
}
```

**Response:**

```json
{
  "status": 200,
  "status_text": "200 OK",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "uptime": "1d2h30m",
    "version": "7.12",
    "board-name": "RB4011iGS+",
    "architecture-name": "arm"
  }
}
```

---

### Network Scanner

#### Start Subnet Scan

```
POST /api/scan
```

Scans a subnet for MikroTik devices by checking common ports (80, 443, 8728, 8729, 8291) and
validating RouterOS API responses.

**Request:**

```json
{
  "subnet": "192.168.88.0/24"
}
```

**Response:**

```json
{
  "task_id": "scan_1701878400000000000",
  "status": "started",
  "message": "Scan started successfully"
}
```

#### Auto-Scan Gateways

```
POST /api/scan/auto
```

Automatically scans all common gateway addresses (192.168.0.1 through 192.168.255.1) for MikroTik
devices.

#### Get Scan Status

```
GET /api/scan/status?task_id=scan_1701878400000000000
```

**Response:**

```json
{
  "task_id": "scan_1701878400000000000",
  "subnet": "192.168.88.0/24",
  "start_time": 1701878400,
  "status": "completed",
  "progress": 100,
  "results": [
    {
      "ip": "192.168.88.1",
      "hostname": "MikroTik",
      "ports": [80, 8728, 8291],
      "type": "router",
      "vendor": "MikroTik",
      "services": ["mikrotik-rest", "mikrotik-api", "mikrotik-winbox"]
    }
  ]
}
```

#### Stop Scan

```
POST /api/scan/stop
```

**Request:**

```json
{
  "task_id": "scan_1701878400000000000"
}
```

---

### Batch Jobs

Execute multiple RouterOS commands with progress tracking, dry-run support, and automatic rollback
on failure.

#### Create Batch Job

```
POST /api/batch/jobs
```

**Request (Commands Array):**

```json
{
  "router_ip": "192.168.88.1",
  "username": "admin",
  "password": "secret",
  "protocol": "api",
  "use_tls": false,
  "commands": [
    "/interface bridge add name=bridge1",
    "/interface bridge port add bridge=bridge1 interface=ether2"
  ],
  "dry_run": false,
  "rollback_enabled": true
}
```

**Request (Script):**

```json
{
  "router_ip": "192.168.88.1",
  "username": "admin",
  "password": "secret",
  "protocol": "ssh",
  "script": "/interface bridge\nadd name=bridge1\n/interface bridge port\nadd bridge=bridge1 interface=ether2",
  "dry_run": true
}
```

**Protocol Options:** | Protocol | Port | Description | |----------|------|-------------| | `api` |
8728 (8729 TLS) | RouterOS API protocol (default) | | `ssh` | 22 | SSH with raw CLI commands | |
`telnet` | 23 | Telnet with raw CLI commands |

**Response:**

```json
{
  "job_id": "batch_1701878400000000000",
  "total_commands": 2,
  "status": "pending"
}
```

#### Get Job Status

```
GET /api/batch/jobs/{job_id}
```

**Response:**

```json
{
  "id": "batch_1701878400000000000",
  "router_ip": "192.168.88.1",
  "protocol": "api",
  "status": "running",
  "progress": {
    "total": 10,
    "current": 5,
    "percent": 50.0,
    "succeeded": 4,
    "failed": 1,
    "skipped": 0
  },
  "current_command": "/interface bridge port add bridge=bridge1...",
  "errors": [
    {
      "line_number": 3,
      "command": "/interface bridge port add bridge=invalid",
      "error": "no such item",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ],
  "created_at": "2024-01-01T11:55:00Z",
  "started_at": "2024-01-01T11:55:01Z",
  "dry_run": false,
  "rollback_enabled": true,
  "rollback_count": 4
}
```

**Job Statuses:**

- `pending` — Job created, waiting to start
- `running` — Currently executing commands
- `completed` — All commands executed successfully
- `failed` — Execution stopped due to error
- `cancelled` — Job was manually cancelled
- `rolled_back` — Failed and rollback was executed

#### Cancel Job

```
DELETE /api/batch/jobs/{job_id}
```

---

## CLI Parser

ROSProxy includes a CLI parser that translates RouterOS CLI syntax to API commands. This enables
batch jobs to accept familiar CLI scripts.

**Supported Syntax:**

```routeros
# Full path commands
/interface bridge add name=bridge1 comment="Main bridge"

# Context-based commands
/ip firewall filter
add chain=input action=accept protocol=tcp dst-port=22
add chain=input action=drop

# Find queries for set/remove operations
/interface ethernet set [find default-name=ether1] name=WAN

# Line continuation
/ip firewall filter add chain=forward \
    action=accept protocol=tcp \
    dst-port=80,443

# Script commands
:delay 1s
:log info "Configuration complete"
```

**Actions:** `add`, `set`, `remove`, `print`, `enable`, `disable`, `move`, `comment`, `export`,
`import`, `reset`, `find`

---

## Development

### Requirements

- Go 1.24+
- [Air](https://github.com/air-verse/air) for hot-reload:
  `go install github.com/air-verse/air@latest`
- [golangci-lint](https://golangci-lint.run/):
  `go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest`

**Windows:** Ensure `%USERPROFILE%\go\bin` is in your PATH.

### Nx Commands

```bash
# Development server (hot-reload via Air)
nx serve backend

# Build production binary (includes frontend)
nx build backend

# Run tests
nx test backend

# Lint
nx lint backend

# Type check (go vet)
nx typecheck backend
```

### Configuration Files

| File            | Purpose                                |
| --------------- | -------------------------------------- |
| `.air.toml`     | Air hot-reload configuration           |
| `.golangci.yml` | Linter configuration (moderate preset) |
| `go.mod`        | Go module dependencies                 |

### Dependencies

```
github.com/go-routeros/routeros/v3  # RouterOS API client
golang.org/x/crypto                 # SSH client
```

---

## Docker Deployment

### Multi-Stage Build

The Dockerfile uses a 3-stage build:

1. **Frontend Build** — Node.js Alpine builds the React frontend via Nx
2. **Go Build** — Golang Alpine compiles the binary with embedded frontend, compressed with UPX
3. **Runtime** — Scratch image with only the binary and CA certificates

### Build Commands

```bash
# Build multi-arch and push to registries
nx run backend:docker:build

# Build local image (amd64 only)
nx run backend:docker:build-local

# Build and export as tarball
nx run backend:docker:build-export
```

### Supported Architectures

- `linux/amd64`
- `linux/arm64`
- `linux/arm/v7`

### Environment Variables

| Variable     | Default      | Description      |
| ------------ | ------------ | ---------------- |
| `PORT`       | `80`         | HTTP server port |
| `GOMAXPROCS` | `1`          | Max OS threads   |
| `GO_ENV`     | `production` | Environment mode |

### Container Networking

For the container to communicate with RouterOS devices on the local network, use host networking:

```bash
docker run --network=host ghcr.io/your-repo/backend:latest
```

Alternatively, if using bridge networking, ensure the container can route to the router's IP
address.

### Health Check

The container includes a built-in health check:

```bash
# Manual health check
docker exec <container> /app -healthcheck
```

Health check configuration:

- Interval: 30s
- Timeout: 5s
- Start period: 5s
- Retries: 3

---

## Production Deployment

### Standalone Binary

```bash
# Build
nx build backend

# Run
PORT=8080 ./dist/apps/backend/backend
```

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    image: ghcr.io/your-repo/backend:latest
    network_mode: host
    environment:
      - PORT=80
    restart: unless-stopped
```

### Behind Reverse Proxy

When deploying behind nginx/traefik, configure proxy headers:

```nginx
location /api/ {
    proxy_pass http://localhost:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 300s;  # Long timeout for batch jobs
}
```

---

## Security Considerations

- **Authentication**: ROSProxy implements JWT-based authentication with RS256 signing and session
  management.
- **TLS Verification**: Self-signed certificates on RouterOS devices are accepted by default
  (`InsecureSkipVerify: true`).
- **Credentials**: All router credentials are encrypted at rest using AES-256-GCM. Passwords are
  never logged or returned in API responses.
- **Container Self-Connection**: The proxy detects and prevents the container from connecting to its
  own IP address.

### Credential Encryption

Router credentials are stored in a separate `router_secrets` table with AES-256-GCM encryption at
rest.

**Required Environment Variable:**

```bash
# Generate a secure 32-byte encryption key (base64 encoded)
openssl rand -base64 32

# Set the environment variable
export DB_ENCRYPTION_KEY="your-base64-encoded-32-byte-key"
```

**Security Notes:**

- The encryption key MUST be exactly 32 bytes (256 bits) when decoded
- Keep the key secure and backed up - losing it means losing access to all stored credentials
- Key rotation requires re-encrypting all credentials (use the `RotateKey` API)
- Credentials are encrypted per-field (username and password separately)
- Each encryption uses a unique nonce to prevent pattern analysis

**Key Generation Options:**

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Go tool
go run -tags=dev apps/backend/. -generate-key

# Option 3: Python
python3 -c "import base64, os; print(base64.b64encode(os.urandom(32)).decode())"
```

See `.env.example` for the complete configuration template.

---

## Troubleshooting

### Container Cannot Reach Router

1. Verify the container is using `--network=host` mode
2. Check that the router IP is correct and not the container's own IP
3. Ensure RouterOS has HTTP/API services enabled

### Authentication Failures

1. Verify username and password
2. Check that the user has API access permissions in RouterOS
3. For API protocol, ensure port 8728 (or 8729 for TLS) is not blocked

### Batch Job Failures

1. Use `dry_run: true` to validate commands before execution
2. Check the `errors` array in job status for specific failures
3. Enable `rollback_enabled: true` to automatically undo changes on failure

### Scanner Not Finding Devices

1. Ensure RouterOS devices have REST API enabled (www service)
2. Check firewall rules allow connections to ports 80, 443, 8728, 8729, 8291
3. Verify the subnet range is correct

---

## License

See repository root for license information.
