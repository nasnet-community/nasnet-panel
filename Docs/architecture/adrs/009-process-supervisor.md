# ADR-009: Process Supervisor Design

**Date:** 2025-12-12
**Status:** Accepted
**Deciders:** Technical Architect, BMad
**Category:** Orchestration

---

## Context

NasNetConnect must manage multiple network service processes (Tor, sing-box, Xray-core, etc.) within a single container. We need:

1. **Lifecycle Management** - Start, stop, restart services
2. **Health Monitoring** - Detect failures, unhealthy states
3. **Automatic Recovery** - Restart failed processes
4. **Graceful Shutdown** - Clean termination ordering
5. **Resource Integration** - Work with port registry, VLAN allocator

### Evaluated Options

| Option | Type | Size | Features |
|--------|------|------|----------|
| **ochinchina/supervisord** | Go reimpl of supervisord | Large | Full supervisord compat, XML-RPC |
| **immortal/immortal** | Go supervisor | Medium | Per-service, control socket |
| **Custom Go Supervisor** | Custom | Minimal | Tailored to NNC needs |
| **systemd inside container** | System init | Very Large | Full init system |

## Decision

Implement a **Custom Go Process Supervisor** integrated with NasNetConnect's orchestration layer.

### Rationale

1. **Size** - No external binary, integrated into NNC (~500 lines of Go)
2. **Integration** - Direct access to port registry, VLAN allocator, health checker
3. **Tailored** - Exactly the features we need, nothing more
4. **Control** - Full control over restart policies, health checks, shutdown ordering

### Core Design

```go
// internal/orchestrator/supervisor.go

type Supervisor struct {
    processes     map[string]*ManagedProcess
    healthChecker *HealthChecker
    portRegistry  *PortRegistry
    events        chan ProcessEvent
    
    ctx           context.Context
    cancel        context.CancelFunc
}

type ManagedProcess struct {
    ID            string
    FeatureID     string
    InstanceID    string
    Command       string
    Args          []string
    WorkDir       string
    Env           []string
    BindIP        string
    Ports         []int
    RestartPolicy RestartPolicy
    
    // Runtime state
    cmd           *exec.Cmd
    pid           int
    state         ProcessState
    restartCount  int
}

type RestartPolicy struct {
    MaxRetries      int           // 0 = infinite
    InitialInterval time.Duration // e.g., 1s
    MaxInterval     time.Duration // e.g., 30s
    Multiplier      float64       // e.g., 2.0
}
```

### Restart Behavior

Uses exponential backoff from `cenkalti/backoff/v4`:

```
Attempt 1: Wait 1s  → Restart
Attempt 2: Wait 2s  → Restart
Attempt 3: Wait 4s  → Restart
Attempt 4: Wait 8s  → Restart
Attempt 5: Wait 16s → Restart
Attempt 6: Wait 30s → Restart (capped at MaxInterval)
...
```

Reset backoff after successful start and 30s+ stable uptime.

### Graceful Shutdown

```go
func (s *Supervisor) GracefulStop(id string, timeout time.Duration) error {
    // 1. Send SIGTERM
    proc.cmd.Process.Signal(syscall.SIGTERM)
    
    // 2. Wait for graceful exit or timeout
    select {
    case <-done:
        return nil  // Graceful shutdown
    case <-time.After(timeout):
        // 3. Force kill with SIGKILL
        syscall.Kill(-proc.pid, syscall.SIGKILL)
    }
}
```

### Process Group Management

Use `Setpgid: true` to create process groups for clean termination:

```go
cmd.SysProcAttr = &syscall.SysProcAttr{
    Setpgid: true,
}

// Kill entire process group
syscall.Kill(-pid, syscall.SIGKILL)
```

## Health Checking Integration

### Composite Health Probes

```go
type HealthProbe interface {
    Check(ctx context.Context) error
    Name() string
}

// Available probes
type TCPProbe struct { Host string; Port int }
type HTTPProbe struct { URL string; ExpectedStatus int }
type ProcessProbe struct { PID int }
type CompositeProbe struct { Probes []HealthProbe; Strategy CompositeStrategy }
```

### Health Check Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    HEALTH CHECK LOOP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Every 30 seconds:                                              │
│                                                                  │
│  1. For each registered instance:                               │
│     ├─ Run composite probe (PID + TCP/HTTP)                     │
│     ├─ If healthy: Reset consecutive fail counter               │
│     └─ If unhealthy: Increment consecutive fail counter         │
│                                                                  │
│  2. If consecutive fails >= threshold (default: 3):             │
│     ├─ Mark instance as UNHEALTHY                               │
│     ├─ Emit ProcessEvent{Type: EventUnhealthy}                  │
│     └─ Supervisor triggers restart                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Consequences

### Positive

- **Minimal Size** - No external binaries
- **Full Integration** - Works with NNC's resource management
- **Tailored** - Exactly what we need
- **Debuggable** - All code is visible and testable

### Negative

- **Development Cost** - Must build and maintain
- **No XML-RPC** - Can't use standard supervisord tools
- **Feature Scope** - Must implement features as needed

### Neutral

- **Go-specific** - Leverages Go's excellent process management
- **Platform-specific** - syscall usage is Linux-specific (fine for our target)

## Event System

```go
type ProcessEvent struct {
    Type      ProcessEventType
    ProcessID string
    PID       int
    Error     error
    Timestamp time.Time
}

type ProcessEventType int

const (
    EventStarted ProcessEventType = iota
    EventStopped
    EventRestarting
    EventFailed
    EventUnhealthy
)
```

Events feed into:
1. **WebSocket Hub** - Real-time UI updates
2. **Alert Engine** - Notification triggers
3. **Logging** - Audit trail

## Related Decisions

- [ADR-007: IP-Binding Isolation Strategy](./007-ip-binding-isolation.md)
- [ADR-006: Virtual Interface Factory Pattern](./006-virtual-interface-factory.md)

---

**Reference Library:** [cenkalti/backoff/v4](https://pkg.go.dev/github.com/cenkalti/backoff/v4) for exponential backoff

