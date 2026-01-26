# Naming Conventions

| Entity | Pattern | Examples |
|--------|---------|----------|
| **Libraries** | `@nasnet/{scope}/{name}` | `@nasnet/ui/primitives`, `@nasnet/config-gen/mikrotik` |
| **Components** | PascalCase | `StatusCard`, `VPNCard`, `FileUploadZone` |
| **Hooks** | camelCase with `use` prefix | `useRouterStatus`, `useVPNMutations` |
| **Stores (Zustand)** | camelCase with `Store` suffix | `themeStore`, `wizardStore` |
| **Machines (XState)** | camelCase with `Machine` suffix | `vpnConnectionMachine`, `safetyPipelineMachine` |
| **API Endpoints** | `/api/v1/{resource}` | `/api/v1/router/status` (REST Fallback) |
| **GraphQL Operations** | camelCase | `installFeature`, `saveVpnConnection` |
| **Go Packages** | lowercase single word | `mikrotik`, `router`, `features` |
| **Go Files** | lowercase with underscores | `vpn_handler.go`, `config_service.go` |

---
