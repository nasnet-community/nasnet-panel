# ADR-006: Virtual Interface Factory Pattern

**Date:** 2025-12-12
**Status:** Accepted
**Deciders:** Technical Architect, BMad
**Category:** Architecture Pattern

---

## Context

NasNetConnect needs to integrate multiple network services (Tor, sing-box, Xray-core, MTProxy, Psiphon, AdGuard Home) in a way that:

1. Makes services **routeable** via MikroTik Policy-Based Routing (PBR)
2. Allows **per-device traffic steering** (e.g., "IoT devices → Tor, Gaming PC → VPN")
3. Supports **multiple instances** of the same service (e.g., 2× Tor = 2 exit IPs)
4. Integrates with MikroTik's native routing concepts

## Decision

Implement the **Virtual Interface Factory** pattern where each service instance becomes a **virtual interface** on the MikroTik router via auto-managed VLANs.

### Pattern Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                 VIRTUAL INTERFACE FACTORY                        │
├─────────────────────────────────────────────────────────────────┤
│  Service Instance ──► VLAN ──► Router Interface ──► PBR Target  │
├─────────────────────────────────────────────────────────────────┤
│  tor-usa      ──► VLAN 101 ──► nnc-vlan101 ──► routing-mark:tor-usa │
│  tor-germany  ──► VLAN 102 ──► nnc-vlan102 ──► routing-mark:tor-de  │
│  singbox-vpn  ──► VLAN 103 ──► nnc-vlan103 ──► routing-mark:vpn1    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **VLAN Allocator** - Assigns VLANs from configurable range (100-200)
2. **Interface Factory** - Creates router-visible interfaces per instance
3. **Gateway Manager** - Bridges proxy ports (SOCKS5) to TUN interfaces
4. **PBR Engine** - Creates mangle rules for traffic steering

### Implementation Flow

```
Instance Created
       │
       ▼
┌─────────────────┐
│ Allocate VLAN   │  ← VLANAllocator.Allocate(instanceID)
│ (e.g., 101)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Router   │  ← RouterPort.CreateVLAN(101, "ether1")
│ VLAN Interface  │  ← RouterPort.AssignIP("10.99.101.1/24")
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Start Service   │  ← Bind to 10.99.101.1:9050
│ with IP Binding │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Start Gateway   │  ← hev-socks5-tunnel creates TUN
│ (if SOCKS5)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create PBR      │  ← RouterPort.AddMangleRule(...)
│ Mangle Rules    │  ← RouterPort.AddRoutingMark(...)
└─────────────────┘
```

## Consequences

### Positive

- **Native Integration** - Services appear as standard router interfaces
- **Full PBR Support** - Route any device/VLAN through any service
- **Multi-Instance** - Run 2× Tor = 2 different exit points
- **Invisible Plumbing** - VLANs auto-managed, users see "interfaces"
- **Consistent Model** - Same pattern for all services

### Negative

- **VLAN Consumption** - Each instance uses one VLAN from router's pool
- **Complexity** - Multiple moving parts (VLAN, IP, gateway, PBR rules)
- **Debugging** - Issues span container and router configuration

### Neutral

- **VLAN Range Configuration** - Users can customize VLAN range
- **Gateway Dependency** - SOCKS5 services need proxy-to-TUN gateway

## Alternatives Considered

### 1. Single Shared Interface

All services share one container IP, differentiated by ports.

**Rejected because:**
- No per-device routing (PBR requires different interfaces/IPs)
- Port conflicts between instances
- No traffic isolation

### 2. Sidecar Container Per Service

Each service runs in its own container.

**Rejected because:**
- Overhead: Each container uses ~10MB+ base
- Coordination complexity between containers
- RouterOS container management limitations

### 3. iptables-Based Routing (Container Internal)

Route traffic inside container using iptables.

**Rejected because:**
- iptables availability uncertain in RouterOS container
- Doesn't integrate with MikroTik's PBR
- Users can't see/configure routing from router UI

## Related Decisions

- [ADR-007: IP-Binding Isolation Strategy](./007-ip-binding-isolation.md)
- [ADR-010: Proxy-to-Interface Gateway](./010-proxy-gateway.md)

---

**Validation:** Multi-VLAN per container confirmed supported in RouterOS 7.x ✅

