# Core Architecture Philosophy

## Fundamental Principles

1. **Hexagonal Architecture (Ports & Adapters)** - Core business logic isolated from external concerns
2. **Capability-Based Design** - Features enabled based on platform/device capabilities
3. **Schema-First Development** - Zod schemas as single source of truth
4. **Event Sourcing** - Complete audit trail for all state changes
5. **Progressive Enhancement** - Graceful degradation when features unavailable

## Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Vue)                      │
├─────────────────────────────────────────────────────────────┤
│                    GraphQL Gateway                           │
├─────────────────────────────────────────────────────────────┤
│                    Router Module                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Dispatcher │  │   Common    │  │    Fleet    │         │
│  │             │  │  Utilities  │  │Orchestration│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                  Platform Adapters                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  MikroTik   │  │   OpenWRT   │  │    VyOS     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                  Protocol Clients                            │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ REST │  │API-SS│  │ SSH  │  │Telnet│  │  FTP │         │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘         │
└─────────────────────────────────────────────────────────────┘
```

---
