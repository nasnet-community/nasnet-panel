# ADR-010: Proxy-to-Interface Gateway

**Date:** 2025-12-12
**Status:** Accepted
**Deciders:** Technical Architect, BMad
**Category:** Networking

---

## Context

Many network services only provide SOCKS5 or HTTP proxy ports, not network interfaces:

| Service | Provides | Routeable? |
|---------|----------|-----------|
| Tor | SOCKS5 on port 9050 | ❌ No |
| sing-box (client mode) | SOCKS5/HTTP proxy | ❌ No |
| Xray-core (client mode) | SOCKS5/HTTP proxy | ❌ No |
| sing-box (TUN mode) | TUN interface | ✅ Yes |

For the **Virtual Interface Factory** pattern to work, we need to bridge proxy ports to routeable interfaces that can be used in MikroTik's Policy-Based Routing.

## Decision

Bundle **hev-socks5-tunnel** in the base image as the default proxy-to-TUN gateway.

### Evaluated Options

| Tool | Language | Size | UDP Support | TUN Interface |
|------|----------|------|-------------|---------------|
| **hev-socks5-tunnel** | C | ~150KB | ✅ Yes | ✅ Yes |
| xjasonlyu/tun2socks | Go | ~15MB | ✅ Yes | ✅ Yes |
| tun2proxy | Rust | ~5MB | ✅ Yes | ✅ Yes |
| redsocks | C | ~100KB | ❌ No | ❌ No |

### Selection: hev-socks5-tunnel

**Chosen for:**
1. **Tiny size** - ~150KB vs 15MB for Go-based tun2socks
2. **UDP support** - Essential for DNS, VoIP, gaming
3. **Active development** - Well maintained
4. **Proven** - Used in Android VPN apps

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    GATEWAY FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Traffic from VLAN 101 (IoT devices)                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ hev-socks5-tunnel│  Creates TUN interface: tun-tor-usa       │
│  │    10.99.101.2   │  Routes traffic to SOCKS5 proxy           │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │    Tor Process  │  SOCKS5 at 10.99.101.1:9050                │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│       Tor Network → Internet                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Configuration

hev-socks5-tunnel uses YAML configuration:

```yaml
# /features/tor/instances/usa/gateway.yml
tunnel:
  name: tun-tor-usa
  mtu: 8500

socks5:
  address: 10.99.101.1
  port: 9050
  # udp: 'udp'  # Enable UDP if service supports it

misc:
  log-level: warn
```

### Integration with Manifests

```json
{
  "networkModes": [
    {
      "id": "client",
      "type": "outbound",
      "gateway": {
        "type": "hev-socks5-tunnel",
        "proxyProtocol": "socks5",
        "proxyPortIndex": 0,
        "udpSupport": false
      }
    }
  ]
}
```

### Gateway Manager

```go
// internal/network/gateway_manager.go

type GatewayManager struct {
    processes map[string]*exec.Cmd  // instanceID → gateway process
}

func (m *GatewayManager) StartGateway(instance *Instance, gwConfig GatewayConfig) error {
    // 1. Generate gateway config YAML
    // 2. Start hev-socks5-tunnel with config
    // 3. Wait for TUN interface creation
    // 4. Return when ready for routing
}

func (m *GatewayManager) StopGateway(instanceID string) error {
    // Graceful shutdown of gateway process
}
```

## Base Image Composition

```
/app/
├── nnc                   (~4MB with UPX)
├── hev-socks5-tunnel     (~150KB)
├── static/               (~1.5MB gzipped)

Total: ~6MB compressed ✅ Under 10MB target
```

## Consequences

### Positive

- **Tiny footprint** - Only 150KB addition to base image
- **UDP support** - Critical for DNS and real-time traffic
- **Universal** - Works with any SOCKS5 service
- **Proven** - Battle-tested in production apps

### Negative

- **C binary** - Must cross-compile for ARM64/ARM7
- **External dependency** - Not pure Go
- **Per-instance overhead** - One gateway process per proxy instance

### Neutral

- **Config generation** - Must generate YAML config per instance
- **TUN interface naming** - Must manage unique interface names

## When Gateway Is NOT Needed

| Service Mode | Gateway Needed? |
|--------------|-----------------|
| Tor Client | ✅ Yes (SOCKS5 only) |
| sing-box Client (SOCKS5 mode) | ✅ Yes |
| sing-box Client (TUN mode) | ❌ No (native TUN) |
| sing-box Server | ❌ No (inbound traffic) |
| MTProxy | ❌ No (inbound Telegram) |
| AdGuard Home | ❌ No (DNS server) |

## Alternatives Considered

### 1. tun2socks (Go)

Full-featured proxy-to-TUN solution.

**Rejected because:**
- 15MB binary (100× larger than hev-socks5-tunnel)
- Feature-equivalent for our use case

### 2. redsocks (iptables-based)

Redirects traffic using iptables REDIRECT.

**Rejected because:**
- No UDP support
- Requires iptables availability (uncertain in RouterOS container)
- No TUN interface creation

### 3. Embedded gVisor Netstack

Use Go's gVisor netstack for in-process tunneling.

**Rejected because:**
- Significant complexity
- Binary size increase
- Memory overhead

### 4. Require TUN Mode in All Services

Only support services that natively create TUN interfaces.

**Rejected because:**
- Excludes Tor (SOCKS5 only)
- Limits flexibility
- Not all service modes support TUN

## Build Process

hev-socks5-tunnel requires cross-compilation:

```bash
git clone --recursive https://github.com/heiher/hev-socks5-tunnel
cd hev-socks5-tunnel

# For ARM64
make CROSS_PREFIX=aarch64-linux-gnu-

# For x86_64
make

# Produces: bin/hev-socks5-tunnel (~150KB)
```

## Related Decisions

- [ADR-006: Virtual Interface Factory Pattern](./006-virtual-interface-factory.md)
- [ADR-007: IP-Binding Isolation Strategy](./007-ip-binding-isolation.md)

---

**Source:** [hev-socks5-tunnel GitHub](https://github.com/heiher/hev-socks5-tunnel) [Verified 2025-12-12]

