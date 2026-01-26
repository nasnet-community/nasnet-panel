# Router Module Architecture

## 33 Fundamental Truths

The Router Module is built on these foundational principles:

1. **Module Structure**: Router Module = Dispatcher + Common Layer
2. **Adapter Pattern**: Each platform (MikroTik, OpenWRT, VyOS) has dedicated adapter
3. **Command Abstraction**: GraphQL → Canonical Commands → Protocol-Specific Format
4. **Protocol Fallback**: REST → API-SSL → SSH → Telnet with circuit breaker
5. **Capability Detection**: Query version + packages + hardware for feature matrix
6. **Connection Pooling**: Shared pool per device with health monitoring
7. **Error Hierarchy**: Platform → Protocol → Network → Validation errors
8. **State Synchronization**: Manual sync + automatic drift detection
9. **Fleet Operations**: Batch commands with rollback on failure
10. **Transaction Support**: Atomic operations where platform supports

## Dispatcher Pattern

The dispatcher routes commands to appropriate adapters:

```go
type RouterDispatcher struct {
    adapters    map[PlatformType]Adapter
    connections *ConnectionPool
    metrics     *MetricsCollector
}

func (d *RouterDispatcher) Execute(ctx context.Context, cmd Command) (Result, error) {
    // 1. Identify platform from device registration
    platform := d.identifyPlatform(cmd.DeviceID)

    // 2. Get or create connection
    conn, err := d.connections.Acquire(cmd.DeviceID, platform)
    if err != nil {
        return nil, fmt.Errorf("connection failed: %w", err)
    }
    defer d.connections.Release(conn)

    // 3. Translate command to platform-specific format
    adapter := d.adapters[platform]
    platformCmd := adapter.Translate(cmd)

    // 4. Execute with retry logic
    return d.executeWithRetry(ctx, conn, platformCmd)
}
```

## Platform Adapter Interface

```go
type Adapter interface {
    // Platform identification
    Platform() PlatformType
    Detect(banner string) bool

    // Command translation
    Translate(cmd Command) PlatformCommand
    ParseResponse(raw []byte) (Result, error)

    // Capability queries
    QueryCapabilities(conn Connection) (*Capabilities, error)
    SupportsFeature(feature Feature) bool

    // Platform-specific operations
    StartTransaction(conn Connection) (Transaction, error)
    ValidateSyntax(cmd PlatformCommand) error
}
```

## MikroTik Adapter Specifics

```go
type MikroTikAdapter struct {
    versionParser *VersionParser
    cmdBuilder    *RouterOSCommandBuilder
}

func (m *MikroTikAdapter) Translate(cmd Command) PlatformCommand {
    switch cmd.Type {
    case CommandGet:
        return m.buildPrintCommand(cmd)
    case CommandSet:
        return m.buildSetCommand(cmd)
    case CommandAdd:
        return m.buildAddCommand(cmd)
    case CommandRemove:
        return m.buildRemoveCommand(cmd)
    }
}

// RouterOS command building
func (m *MikroTikAdapter) buildPrintCommand(cmd Command) PlatformCommand {
    // /interface/print where=name=ether1
    path := m.translatePath(cmd.Resource)
    filters := m.buildFilters(cmd.Filters)
    return PlatformCommand{
        Text: fmt.Sprintf("%s/print%s", path, filters),
        Type: "query",
    }
}
```

## Two-Layer Command Translation

```
Layer 1: GraphQL → Canonical Command
┌─────────────────────────────────────────────────────────────┐
│  GraphQL Query                    Canonical Command         │
│  ─────────────                    ─────────────────         │
│  query {                    →     Command {                 │
│    interfaces(name: "eth0")         Type: GET               │
│    { name, status }                 Resource: "interface"   │
│  }                                  Filter: {name: "eth0"}  │
│                                     Fields: [name, status]  │
│                                   }                         │
└─────────────────────────────────────────────────────────────┘

Layer 2: Canonical Command → Protocol Format
┌─────────────────────────────────────────────────────────────┐
│  Canonical Command                Platform Command          │
│  ─────────────────                ────────────────          │
│  Command {                  →     MikroTik:                 │
│    Type: GET                        /interface/print        │
│    Resource: "interface"            where=name=eth0         │
│    Filter: {name: "eth0"}                                   │
│  }                           →     OpenWRT:                 │
│                                     ubus call network.      │
│                                     interface status        │
│                                     '{"interface":"eth0"}'  │
└─────────────────────────────────────────────────────────────┘
```

## Auto Scanner Architecture

```go
type AutoScanner struct {
    priorityQueue *PriorityIPQueue
    workers       *AdaptiveWorkerPool
    bannerParser  *BannerParser
    results       chan ScanResult
}

type PriorityIPQueue struct {
    // Priority 1: Last-known router IPs
    knownRouters []net.IP
    // Priority 2: Gateway IPs (.1, .254)
    gateways []net.IP
    // Priority 3: DHCP range sequential
    dhcpRange []net.IP
}

func (s *AutoScanner) Scan(ctx context.Context, network string) <-chan ScanResult {
    s.priorityQueue.Initialize(network)

    // Adaptive worker count based on network size
    workerCount := s.calculateWorkers(s.priorityQueue.Size())
    s.workers.Start(workerCount)

    go func() {
        for ip := range s.priorityQueue.Stream() {
            s.workers.Submit(func() {
                result := s.probeDevice(ctx, ip)
                if result.IsRouter {
                    s.results <- result
                }
            })
        }
        s.workers.Wait()
        close(s.results)
    }()

    return s.results
}

func (s *AutoScanner) probeDevice(ctx context.Context, ip net.IP) ScanResult {
    // Banner grabbing for platform identification
    banner := s.grabBanner(ip, []int{22, 8728, 80, 443, 23})
    platform := s.bannerParser.Identify(banner)

    return ScanResult{
        IP:       ip,
        Platform: platform,
        IsRouter: platform != PlatformUnknown,
        Banner:   banner,
    }
}
```

## Protocol Fallback Chain

```go
type ProtocolFallback struct {
    protocols     []Protocol
    circuitBreaker map[Protocol]*CircuitBreaker
}

type CircuitBreaker struct {
    failures    int
    threshold   int           // Default: 3
    cooldown    time.Duration // Default: 5 minutes
    lastFailure time.Time
    state       CircuitState  // Closed, Open, HalfOpen
}

func (p *ProtocolFallback) Execute(ctx context.Context, cmd Command) (Result, error) {
    var lastErr error

    for _, protocol := range p.protocols {
        cb := p.circuitBreaker[protocol]

        // Skip if circuit is open
        if cb.state == CircuitOpen && time.Since(cb.lastFailure) < cb.cooldown {
            continue
        }

        result, err := protocol.Execute(ctx, cmd)
        if err == nil {
            cb.RecordSuccess()
            return result, nil
        }

        lastErr = err
        cb.RecordFailure()
    }

    return nil, fmt.Errorf("all protocols failed: %w", lastErr)
}

// Protocol priority order
var DefaultProtocols = []Protocol{
    ProtocolREST,    // Fastest, modern routers only
    ProtocolAPISSL,  // MikroTik API over SSL
    ProtocolSSH,     // Universal, reliable
    ProtocolTelnet,  // Last resort, legacy devices
}
```

---
