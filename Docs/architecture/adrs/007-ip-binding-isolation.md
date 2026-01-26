# ADR-007: IP-Binding Isolation Strategy

**Date:** 2025-12-12
**Status:** Accepted
**Deciders:** Technical Architect, BMad
**Category:** Security / Isolation

---

## Context

The original architecture assumed Linux namespace isolation (`unshare -n`) would be available inside RouterOS containers to isolate service instances.

**Critical Finding:** RouterOS container runner uses namespaces internally but does NOT expose control to users. The container is extremely minimal (0.0626 MiB for container.npk).

### What RouterOS Container Lacks

- Namespace control (PID, network, user)
- Chroot control
- cgroups access (prior to 7.20)
- Capability restrictions
- seccomp profiles
- rlimit controls

### What IS Available

- `ram-high` per container (RouterOS 7.20+)
- Multiple VETH interfaces
- Bind mounts
- Environment variables
- Container shell access (7.20+)

## Decision

Implement **IP-Binding Isolation** with a layered defense approach instead of namespace isolation.

### Layer 1: IP Binding

Each service instance binds ONLY to its assigned VLAN IP address.

```go
// sing-box config
{
  "inbounds": [{
    "listen": "10.99.101.1",  // ← Only this IP
    "listen_port": 1080
  }]
}

// Tor config
SOCKSPort 10.99.102.1:9050   // ← Only this IP
```

**Enforcement:** Configuration generators ensure correct IP binding.

### Layer 2: Directory Separation

Each instance has isolated filesystem directories:

```
/features/tor/
├── bin/tor                  ← Shared binary (read-only)
└── instances/
    ├── usa/
    │   ├── config/          ← Instance config
    │   └── data/            ← Instance data
    └── germany/
        ├── config/          ← Isolated from usa
        └── data/            ← Isolated from usa
```

**Enforcement:** Instance manager creates directories with appropriate permissions.

### Layer 3: Port Registry

Central port allocation prevents conflicts:

```go
type PortRegistry struct {
    allocated map[int]string  // port → owner ID
    ranges    []PortRange
}

func (r *PortRegistry) AllocateFromRange(rangeName, ownerID string) (int, error)
func (r *PortRegistry) IsAvailable(port int) bool
func (r *PortRegistry) Reserve(port int, ownerID string) error
```

**Enforcement:** Process supervisor validates port availability before start.

### Layer 4: Process Supervision

Go supervisor tracks and manages all child processes:

```go
type ProcessSupervisor struct {
    processes map[string]*ManagedProcess
    registry  *PortRegistry
    health    *HealthChecker
}

// Provides:
// - Lifecycle management (start, stop, restart)
// - Health monitoring
// - Automatic restart on failure
// - Graceful shutdown ordering
```

## Consequences

### Positive

- **Works on RouterOS** - No namespace dependency
- **Defense in Depth** - Four isolation layers
- **Transparent** - Each layer is inspectable
- **Deterministic** - Explicit binding, no implicit isolation

### Negative

- **Less Secure than Namespaces** - A misbehaving service could theoretically bind to wrong IP
- **Trust Model** - Must trust service binaries to honor binding configuration
- **No Network Isolation** - Services can technically see each other's traffic

### Mitigations

| Risk | Mitigation |
|------|------------|
| Service ignores bind IP | Use well-known, audited binaries (Tor, sing-box, etc.) |
| Port conflicts | Registry validates before start |
| Cross-instance file access | Directory permissions, non-overlapping paths |
| Resource exhaustion | `ram-high` limit (7.20+), pre-flight checks |

## Alternatives Considered

### 1. Sidecar Container Model

Run each service in its own container for true isolation.

**Rejected because:**
- Each container adds ~10MB+ overhead
- Complex orchestration across containers
- Doesn't solve resource isolation (still share `ram-high`)

### 2. External Namespace Tool

Bundle a namespace-creation tool in the container.

**Rejected because:**
- RouterOS likely blocks syscalls
- Increases attack surface
- Adds maintenance burden

### 3. Accept Single-Instance Only

Limit to one instance per service type.

**Rejected because:**
- Defeats "2× Tor = 2 exit IPs" use case
- Limits flexibility
- Artificial constraint

## Validation Required

Before implementation, validate:

1. ✅ Multiple VLANs per container work
2. ⚠️ Test if iptables works inside container (for additional filtering)
3. ⚠️ Test container behavior when hitting `ram-high` limit

## Related Decisions

- [ADR-006: Virtual Interface Factory Pattern](./006-virtual-interface-factory.md)
- [ADR-009: Process Supervisor Design](./009-process-supervisor.md)

---

**Source:** [MikroTik Solutions: Container Limitations](https://tangentsoft.com/mikrotik/wiki?name=Container+Limitations) [Verified 2025-12-12]

