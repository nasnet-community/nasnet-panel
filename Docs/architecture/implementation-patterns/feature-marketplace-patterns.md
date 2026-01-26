# Feature Marketplace Patterns

## Process Supervisor Pattern

The process supervisor manages feature instances with graceful shutdown and restart policies:

```go
// internal/orchestrator/supervisor.go
package orchestrator

import (
    "context"
    "os/exec"
    "sync"
    "syscall"
    "time"

    "github.com/cenkalti/backoff/v4"
)

// RestartPolicy defines how a process should be restarted
type RestartPolicy struct {
    MaxRetries      int           // 0 = infinite
    InitialInterval time.Duration // e.g., 1s
    MaxInterval     time.Duration // e.g., 30s
    Multiplier      float64       // e.g., 2.0
}

// ManagedProcess represents a supervised process
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
    lastError     error
    restartCount  int
    startedAt     time.Time

    mu            sync.RWMutex
    cancel        context.CancelFunc
}

type ProcessState int

const (
    StateStopped ProcessState = iota
    StateStarting
    StateRunning
    StateStopping
    StateFailed
)

// Supervisor manages multiple processes with health checking
type Supervisor struct {
    processes     map[string]*ManagedProcess
    healthChecker *HealthChecker
    portRegistry  *PortRegistry
    events        chan ProcessEvent

    mu            sync.RWMutex
    ctx           context.Context
    cancel        context.CancelFunc
}

// supervise runs the main supervision loop for a process
func (s *Supervisor) supervise(ctx context.Context, proc *ManagedProcess) {
    backoffPolicy := backoff.NewExponentialBackOff()
    backoffPolicy.InitialInterval = proc.RestartPolicy.InitialInterval
    backoffPolicy.MaxInterval = proc.RestartPolicy.MaxInterval
    backoffPolicy.Multiplier = proc.RestartPolicy.Multiplier
    backoffPolicy.MaxElapsedTime = 0 // Never stop retrying

    for {
        select {
        case <-ctx.Done():
            s.stopProcess(proc)
            return
        default:
        }

        if err := s.startProcess(ctx, proc); err != nil {
            // Check retry policy
            if proc.RestartPolicy.MaxRetries > 0 &&
               proc.restartCount >= proc.RestartPolicy.MaxRetries {
                return
            }

            // Wait with exponential backoff
            wait := backoffPolicy.NextBackOff()
            select {
            case <-ctx.Done():
                return
            case <-time.After(wait):
                proc.restartCount++
                continue
            }
        }

        backoffPolicy.Reset()
        proc.restartCount = 0
        s.waitForExit(ctx, proc)
    }
}

// GracefulStop stops a process with graceful shutdown
func (s *Supervisor) GracefulStop(id string, timeout time.Duration) error {
    proc, exists := s.processes[id]
    if !exists {
        return fmt.Errorf("process %s not found", id)
    }

    // Cancel the supervision context
    if proc.cancel != nil {
        proc.cancel()
    }

    // Send SIGTERM first
    if proc.cmd != nil && proc.cmd.Process != nil {
        proc.cmd.Process.Signal(syscall.SIGTERM)

        done := make(chan struct{})
        go func() {
            proc.cmd.Wait()
            close(done)
        }()

        select {
        case <-done:
            // Graceful shutdown succeeded
        case <-time.After(timeout):
            // Force kill
            syscall.Kill(-proc.pid, syscall.SIGKILL)
        }
    }

    // Release ports
    for _, port := range proc.Ports {
        s.portRegistry.Release(port)
    }

    return nil
}
```

## Health Check Pattern

Composite health checker supporting TCP, HTTP, and process probes:

```go
// internal/orchestrator/health.go
package orchestrator

// HealthProbe defines how to check if a service is healthy
type HealthProbe interface {
    Check(ctx context.Context) error
    Name() string
}

// TCPProbe checks if a TCP port is open
type TCPProbe struct {
    Host    string
    Port    int
    Timeout time.Duration
}

func (p *TCPProbe) Check(ctx context.Context) error {
    d := net.Dialer{Timeout: p.Timeout}
    conn, err := d.DialContext(ctx, "tcp", fmt.Sprintf("%s:%d", p.Host, p.Port))
    if err != nil {
        return err
    }
    conn.Close()
    return nil
}

// HTTPProbe checks an HTTP endpoint
type HTTPProbe struct {
    URL            string
    Timeout        time.Duration
    ExpectedStatus int // 0 means any 2xx
}

func (p *HTTPProbe) Check(ctx context.Context) error {
    client := &http.Client{Timeout: p.Timeout}
    req, _ := http.NewRequestWithContext(ctx, "GET", p.URL, nil)
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if p.ExpectedStatus > 0 {
        if resp.StatusCode != p.ExpectedStatus {
            return fmt.Errorf("expected status %d, got %d", p.ExpectedStatus, resp.StatusCode)
        }
    } else if resp.StatusCode < 200 || resp.StatusCode >= 300 {
        return fmt.Errorf("unhealthy status: %d", resp.StatusCode)
    }
    return nil
}

// ProcessProbe checks if a process is still running
type ProcessProbe struct {
    PID int
}

func (p *ProcessProbe) Check(ctx context.Context) error {
    process, err := os.FindProcess(p.PID)
    if err != nil {
        return err
    }
    if err := process.Signal(syscall.Signal(0)); err != nil {
        return fmt.Errorf("process not running: %w", err)
    }
    return nil
}

// CompositeProbe combines multiple probes
type CompositeProbe struct {
    Probes   []HealthProbe
    Strategy CompositeStrategy // All or Any
}

type CompositeStrategy int

const (
    StrategyAll CompositeStrategy = iota // All probes must pass
    StrategyAny                          // Any probe passing is success
)

// HealthChecker manages health checks for multiple instances
type HealthChecker struct {
    checks   map[string]*InstanceHealth
    interval time.Duration
    mu       sync.RWMutex
}

type InstanceHealth struct {
    InstanceID    string
    Probe         HealthProbe
    LastCheck     time.Time
    LastStatus    HealthStatus
    ConsecFails   int
    FailThreshold int
}
```

## Port Registry Pattern

Thread-safe port allocation to prevent conflicts:

```go
// internal/network/port_registry.go
package network

// PortRegistry manages port allocation to prevent conflicts
type PortRegistry struct {
    allocated map[int]string // port -> owner ID
    ranges    []PortRange
    mu        sync.RWMutex
}

type PortRange struct {
    Start   int
    End     int
    Purpose string // e.g., "feature-instances", "health-checks"
}

func NewPortRegistry(ranges []PortRange) *PortRegistry {
    return &PortRegistry{
        allocated: make(map[int]string),
        ranges:    ranges,
    }
}

func (r *PortRegistry) IsAvailable(port int) bool {
    r.mu.RLock()
    defer r.mu.RUnlock()
    _, exists := r.allocated[port]
    return !exists
}

func (r *PortRegistry) Reserve(port int, ownerID string) error {
    r.mu.Lock()
    defer r.mu.Unlock()
    if existing, exists := r.allocated[port]; exists {
        return fmt.Errorf("port %d already allocated to %s", port, existing)
    }
    r.allocated[port] = ownerID
    return nil
}

func (r *PortRegistry) AllocateFromRange(rangeName, ownerID string) (int, error) {
    r.mu.Lock()
    defer r.mu.Unlock()

    for _, rng := range r.ranges {
        if rng.Purpose != rangeName {
            continue
        }
        for port := rng.Start; port <= rng.End; port++ {
            if _, exists := r.allocated[port]; !exists {
                r.allocated[port] = ownerID
                return port, nil
            }
        }
        return 0, fmt.Errorf("no available ports in range %s (%d-%d)",
            rangeName, rng.Start, rng.End)
    }
    return 0, fmt.Errorf("range %s not found", rangeName)
}

func (r *PortRegistry) Release(port int) {
    r.mu.Lock()
    defer r.mu.Unlock()
    delete(r.allocated, port)
}
```

## Config Generator Pattern

Type-safe config generators for feature services:

```go
// internal/config/generator.go
package config

// ConfigGenerator generates native config files for features
type ConfigGenerator interface {
    FeatureID() string
    Generate(instance *Instance, options map[string]interface{}) ([]byte, error)
    Validate(config []byte) error
    ConfigFormat() string
}

// Instance represents a running feature instance
type Instance struct {
    ID          string
    FeatureID   string
    BindIP      string
    Ports       []int
    DataDir     string
    ConfigDir   string
    UserConfig  map[string]interface{}
}

// GeneratorRegistry manages config generators
type GeneratorRegistry struct {
    generators map[string]ConfigGenerator
}

func (r *GeneratorRegistry) Register(g ConfigGenerator) {
    r.generators[g.FeatureID()] = g
}

func (r *GeneratorRegistry) Get(featureID string) (ConfigGenerator, error) {
    g, exists := r.generators[featureID]
    if !exists {
        return nil, fmt.Errorf("no generator for feature: %s", featureID)
    }
    return g, nil
}
```

## Feature Manifest Schema

```go
// pkg/manifest/manifest.go
package manifest

// Manifest describes a downloadable feature
type Manifest struct {
    ID          string            `json:"id"`
    Name        string            `json:"name"`
    Version     string            `json:"version"`
    Description string            `json:"description"`
    License     string            `json:"license"`
    Source      Source            `json:"source"`
    Binary      BinarySpec        `json:"binary"`
    Health      HealthSpec        `json:"health"`
    Config      ConfigSpec        `json:"config"`
    Network     NetworkSpec       `json:"network"`
    Resources   ResourceSpec      `json:"resources"`
    Modes       []OperationMode   `json:"modes,omitempty"`
}

type Source struct {
    Type         string            `json:"type"` // github-release, url
    Owner        string            `json:"owner,omitempty"`
    Repo         string            `json:"repo,omitempty"`
    AssetPattern string            `json:"asset_pattern"`
    Verification VerificationSpec  `json:"verification"`
}

type NetworkSpec struct {
    RequiresVLAN   bool     `json:"requires_vlan"`
    DefaultPorts   []int    `json:"default_ports"`
    Protocols      []string `json:"protocols"`
    SupportsServer bool     `json:"supports_server"`
    SupportsClient bool     `json:"supports_client"`
}

type OperationMode struct {
    ID          string                 `json:"id"`
    Name        string                 `json:"name"`
    Description string                 `json:"description"`
    Defaults    map[string]interface{} `json:"defaults"`
}
```

Example manifest for sing-box:

```json
{
  "id": "sing-box",
  "name": "sing-box",
  "version": "1.12.8",
  "description": "Universal proxy platform",
  "license": "GPL-3.0",
  "source": {
    "type": "github-release",
    "owner": "SagerNet",
    "repo": "sing-box",
    "asset_pattern": "sing-box-{{version}}-linux-{{arch}}.tar.gz",
    "verification": {
      "type": "sha256",
      "checksums_asset": "checksums.txt"
    }
  },
  "binary": {
    "path": "sing-box",
    "architectures": ["amd64", "arm64", "armv7"]
  },
  "health": {
    "type": "http",
    "port_index": 1,
    "path": "/",
    "timeout_seconds": 5,
    "interval_seconds": 30
  },
  "network": {
    "requires_vlan": true,
    "default_ports": [1080, 9090],
    "protocols": ["socks5", "http", "vmess", "vless", "trojan"],
    "supports_server": true,
    "supports_client": true
  },
  "modes": [
    {
      "id": "socks-proxy",
      "name": "SOCKS5 Proxy",
      "description": "Simple SOCKS5 proxy client",
      "defaults": { "enable_http": true, "log_level": "info" }
    },
    {
      "id": "tun-vpn",
      "name": "TUN VPN Client",
      "description": "Full VPN with TUN interface",
      "defaults": { "enable_tun": true, "auto_route": true }
    }
  ]
}
```

## Instance Lifecycle Pattern

```go
// internal/orchestrator/instance_manager.go
package orchestrator

// InstanceManager handles the lifecycle of feature instances
type InstanceManager struct {
    supervisor      *Supervisor
    configRegistry  *GeneratorRegistry
    portRegistry    *PortRegistry
    vlanAllocator   *VLANAllocator
    router          RouterPort
    store           InstanceStore
    featuresDir     string
}

// CreateInstance creates a new instance of a feature
func (m *InstanceManager) CreateInstance(ctx context.Context, req CreateInstanceRequest) (*Instance, error) {
    // 1. Load feature manifest
    manifest, err := ParseManifest(filepath.Join(m.featuresDir, req.FeatureID, "manifest.json"))
    if err != nil {
        return nil, fmt.Errorf("failed to load manifest: %w", err)
    }

    // 2. Allocate VLAN if required
    var vlanID int
    if manifest.Network.RequiresVLAN {
        vlanID, err = m.vlanAllocator.Allocate(req.InstanceID)
        if err != nil {
            return nil, fmt.Errorf("failed to allocate VLAN: %w", err)
        }
    }

    // 3. Allocate ports
    ports := make([]int, len(manifest.Network.DefaultPorts))
    for i := range manifest.Network.DefaultPorts {
        port, err := m.portRegistry.AllocateFromRange("instances", req.InstanceID)
        if err != nil {
            if vlanID > 0 {
                m.vlanAllocator.Release(vlanID)
            }
            return nil, fmt.Errorf("failed to allocate port: %w", err)
        }
        ports[i] = port
    }

    // 4. Calculate bind IP from VLAN
    bindIP := fmt.Sprintf("10.99.%d.1", vlanID)

    // 5. Create instance
    instance := &Instance{
        ID:         req.InstanceID,
        FeatureID:  req.FeatureID,
        VLANID:     vlanID,
        BindIP:     bindIP,
        Ports:      ports,
        UserConfig: req.Config,
        State:      StateCreated,
    }

    // 6. Generate config
    generator, _ := m.configRegistry.Get(req.FeatureID)
    configData, _ := generator.Generate(instance, req.Config)

    // 7. Configure router (VLAN + IP + firewall)
    if manifest.Network.RequiresVLAN {
        m.configureRouterForInstance(ctx, instance, manifest)
    }

    return instance, m.store.Save(instance)
}

// StartInstance starts a created instance
func (m *InstanceManager) StartInstance(ctx context.Context, instanceID string) error {
    instance, _ := m.store.Get(instanceID)
    manifest, _ := ParseManifest(filepath.Join(m.featuresDir, instance.FeatureID, "manifest.json"))

    proc := &ManagedProcess{
        ID:         instanceID,
        FeatureID:  instance.FeatureID,
        Command:    filepath.Join(m.featuresDir, instance.FeatureID, "bin", manifest.Binary.Path),
        BindIP:     instance.BindIP,
        Ports:      instance.Ports,
        RestartPolicy: RestartPolicy{
            MaxRetries:      5,
            InitialInterval: time.Second,
            MaxInterval:     30 * time.Second,
            Multiplier:      2.0,
        },
    }

    return m.supervisor.Start(ctx, proc)
}

// DeleteInstance removes an instance completely
func (m *InstanceManager) DeleteInstance(ctx context.Context, instanceID string) error {
    instance, _ := m.store.Get(instanceID)

    // 1. Stop if running
    m.StopInstance(ctx, instanceID, true)

    // 2. Remove router configuration
    m.removeRouterConfig(ctx, instance)

    // 3. Release resources
    m.portRegistry.ReleaseAll(instanceID)
    if instance.VLANID > 0 {
        m.vlanAllocator.Release(instance.VLANID)
    }

    return m.store.Delete(instanceID)
}
```

## Key Libraries for Feature Marketplace

| Pattern | Library | Source |
|---------|---------|--------|
| Exponential Backoff | cenkalti/backoff/v4 | https://pkg.go.dev/github.com/cenkalti/backoff/v4 |
| Health Checks | heptiolabs/healthcheck | https://pkg.go.dev/github.com/heptiolabs/healthcheck |
| JSON Schema Validation | xeipuuv/gojsonschema | https://github.com/xeipuuv/gojsonschema |
| RouterOS API | go-routeros/routeros | https://github.com/go-routeros/routeros |

---
