# ADR 005: Docker Deployment Architecture - On-Router Container

**Status:** Accepted  
**Date:** 2025-12-03  
**Deciders:** Architecture Team  
**Epic Context:** Epic 0.10 - Build & Deployment  
**Related Stories:** 0-10-3 (Docker Container Build), 0-10-4 (Docker Image Size Constraint)

## Context

NasNetConnect needs a deployment model that:
- Runs on MikroTik routers (limited CPU/RAM/storage)
- Works offline without cloud dependencies
- Serves both frontend and API from a single container
- Stays within severe resource constraints (<10MB image, <50MB RAM)
- Integrates with RouterOS REST API for router management

Multiple deployment architectures were considered during product brief and architecture phases.

## Decision

Deploy NasNetConnect as a **single Docker container running directly ON the MikroTik router**, containing:
- Go backend (rosproxy) serving REST API
- Static React frontend served by the Go backend
- All assets bundled in the container image

**No external servers, no cloud dependencies, no client-side installation required.**

## Architecture

```
┌─────────────────────────────────────────┐
│  MikroTik Router (RouterOS v7+)         │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Docker Container (<10MB)      │    │
│  │                                 │    │
│  │  ┌──────────────┐              │    │
│  │  │  Go Backend  │              │    │
│  │  │  (rosproxy)  │              │    │
│  │  │              │              │    │
│  │  │  - REST API  │              │    │
│  │  │  - Serves    │              │    │
│  │  │    Frontend  │              │    │
│  │  └──────┬───────┘              │    │
│  │         │                       │    │
│  │  ┌──────▼───────┐              │    │
│  │  │  Static      │              │    │
│  │  │  React App   │              │    │
│  │  │  (~400KB)    │              │    │
│  │  └──────────────┘              │    │
│  └─────────┬───────────────────────┘    │
│            │                             │
│  ┌─────────▼──────────────────────┐    │
│  │  RouterOS REST API             │    │
│  │  (127.0.0.1:80/rest)           │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
         ▲
         │ User accesses via
         │ http://192.168.88.1:3000
         │
    ┌────┴────┐
    │ Browser │
    └─────────┘
```

## Rationale

### Why On-Router Deployment?

**Single Point of Truth:**
- Configuration lives on the router where it belongs
- No sync issues between cloud and router state
- Direct RouterOS REST API access (no network latency)

**Offline Operation:**
- Works without internet connectivity
- Critical for users in areas with unreliable internet
- Router management shouldn't depend on external services

**Security:**
- No router credentials sent to cloud servers
- All communication stays on local network
- User controls their data completely

**Simplicity:**
- One container deployment via RouterOS container CLI
- No separate server infrastructure to manage
- No cloud account signup required

### Why Docker Container?

**RouterOS Container Support:**
- RouterOS v7+ has native container support
- Uses `envoy` container runtime
- Proven deployment model for router add-ons

**Isolation:**
- Container crash doesn't affect router
- Easy to update/rollback via container swap
- Resource limits enforceable

**Portability:**
- Same container image works on all MikroTik routers
- Can test locally with docker-compose
- Can deploy to external server if needed (fallback)

### Why Single Container (Frontend + Backend)?

**Simplicity:**
- One image to build, deploy, update
- No orchestration needed (no docker-compose on router)
- Fewer moving parts to troubleshoot

**Size Optimization:**
- Single Alpine base image
- Shared layers for both frontend and backend
- No duplicate dependencies

**Performance:**
- Frontend served from same container (no extra network hop)
- Go static file serving is extremely fast
- No CORS issues (same origin)

## Implementation

### Docker Image Structure

```dockerfile
FROM golang:1.22-alpine AS builder
# Build Go backend
RUN go build -ldflags="-s -w" -o rosproxy

FROM node:20-alpine AS frontend-builder
# Build React frontend
RUN npm run build

FROM alpine:latest
# Copy Go binary
COPY --from=builder /app/rosproxy /app/
# Copy React static files
COPY --from=frontend-builder /app/dist /app/static
CMD ["/app/rosproxy"]
```

### Size Optimization Techniques

**Backend:**
- Go binary with stripped symbols (`-ldflags="-s -w"`)
- Alpine base image (~5MB)
- Static compilation (no dynamic libs)

**Frontend:**
- Vite production build with tree-shaking
- Tailwind CSS purging unused styles
- Component-level code splitting
- Gzip compression

**Result:**
- Go binary: ~8MB → ~4MB (stripped)
- React bundle: ~366KB (uncompressed)
- Alpine base: ~5MB
- **Total image: ~9.5MB compressed** ✓

### Deployment Process

```bash
# On MikroTik router
/container/add remote-image=ghcr.io/nasnet/connect:latest \
    interface=veth1 root-dir=disk1/containers/nasnet

/container/start 0

# Access at http://192.168.88.1:3000
```

### Resource Constraints

**MikroTik Router Limits:**
- CPU: 1-2 cores (ARM or MIPS)
- RAM: 256MB - 2GB total (50MB for our container)
- Storage: 16MB - 512MB total (10MB for our image)

**Our Container:**
- Image: <10MB compressed ✓
- Runtime RAM: ~30-40MB ✓
- CPU: Minimal (Go is efficient, React is static) ✓

## Consequences

### Positive

- **No Cloud Costs:** Zero recurring infrastructure costs
- **Offline Works:** No internet dependency
- **Fast Performance:** Local network only, no WAN latency
- **Privacy:** User data stays on their router
- **Simple Deploy:** Single docker command
- **Easy Updates:** Pull new image, restart container

### Negative

- **Router Resource Limits:** Must stay within 10MB/50MB constraints
- **Single Point of Failure:** Router down = app down (acceptable)
- **Limited Scalability:** Can't scale horizontally (not needed)
- **RouterOS Dependency:** Requires RouterOS v7+ with container support
- **No Multi-Router Management:** Each router runs its own instance

### Mitigations

- **Size Constraint:** Aggressive optimization, regular size audits
- **Failure:** Container restart on failure, logs for debugging
- **Scalability:** Not needed - each router manages itself
- **RouterOS Version:** Document minimum version requirement
- **Multi-Router:** Phase 2+ feature (router discovery across network)

## Alternatives Considered

### Cloud-Hosted SaaS
- **Rejected:** Requires internet, ongoing costs, privacy concerns
- Users don't want credentials in the cloud
- Latency on every router operation
- Monthly hosting costs

### Electron Desktop App
- **Rejected:** Larger bundle size (100MB+)
- Requires installation on user's computer
- Per-OS builds (Windows, Mac, Linux)
- More complex updates

### Separate Frontend Server
- **Rejected:** Requires user to run separate server
- CORS configuration complexity
- Two things to deploy and maintain
- Doesn't work on router natively

### Go Backend + Browser Extension
- **Rejected:** Browser store approval process
- Extension API limits
- Per-browser development
- Can't access local network easily

### RouterOS Package (Native)
- **Rejected:** RouterOS package development very complex
- Requires RouterOS rebuild for updates
- Limited to MikroTik ecosystem permanently
- No React/modern frontend possible

## Risk Assessment

**Medium-Low Risk:**
- Docker on RouterOS proven (used by other router apps)
- Size constraints challenging but achievable
- Single container simpler than alternatives

**Mitigation:**
- Regular size monitoring in CI/CD
- Fallback to external server deployment possible
- Docker Compose for local development/testing

## Success Metrics (Epic 0.10)

After implementation:
- ✅ Docker image <10MB compressed
- ✅ Container runtime RAM <50MB
- ✅ Cold start <5 seconds
- ✅ Works offline without internet
- ✅ Survives container restart
- ✅ Tested on RB5009, hEX, CCR series routers

## Review Date

After Phase 0 deployment to production routers:
- Measure actual resource usage on various router models
- Assess update process ease
- Evaluate if size constraints too limiting
- Consider multi-router management architecture for Phase 2

## References

- [MikroTik Container Documentation](https://help.mikrotik.com/docs/display/ROS/Container)
- [RouterOS REST API](https://help.mikrotik.com/docs/display/ROS/REST+API)
- Product Brief: `planning/phase-0/product-brief-NasNetConnect-2025-12-02.md`
- Architecture: `architecture/deployment-architecture.md`
- Docker Build: `.github/workflows/docker.yml`

