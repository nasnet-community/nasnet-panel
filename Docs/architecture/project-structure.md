# Project Structure

```
nasnet/
├── apps/
│   └── connect/                          # Main React application
│       ├── src/
│       │   ├── app/                      # Routes and pages (thin layer)
│       │   │   ├── routes/
│       │   │   │   ├── dashboard/
│       │   │   │   ├── vpn/
│       │   │   │   ├── monitor/
│       │   │   │   └── settings/
│       │   │   └── providers.tsx         # ApolloProvider, etc.
│       │   └── main.tsx
│       ├── index.html
│       └── project.json
│
├── libs/
│   ├── core/                             # ═══ CORE SHARED LIBRARIES ═══
│   │   ├── types/                        # Shared TypeScript types
│   │   │   ├── src/
│   │   │   │   ├── gql/                  # Generated GraphQL types
│   │   │   │   └── index.ts
│   │   │   └── project.json
│   │   │
│   │   ├── utils/                        # Pure utility functions
│   │   │   ├── src/
│   │   │   │   ├── network/              # IP, subnet calculations
│   │   │   │   ├── validation/           # Zod schemas (custom)
│   │   │   │   ├── formatters/           # Date, number formatting
│   │   │   │   └── index.ts
│   │   │   └── project.json
│   │   │
│   │   └── constants/                    # Shared constants
│   │
│   ├── ui/                               # ═══ UI COMPONENT LIBRARIES ═══
│   │   ├── primitives/                   # Base shadcn/Radix components
│   │   │   ├── src/
│   │   │   │   ├── button/
│   │   │   │   ├── card/
│   │   │   │   ├── input/
│   │   │   │   ├── select/
│   │   │   │   ├── switch/
│   │   │   │   ├── dialog/
│   │   │   │   ├── toast/
│   │   │   │   ├── tabs/
│   │   │   │   ├── table/
│   │   │   │   └── index.ts
│   │   │   └── project.json
│   │   │
│   │   ├── patterns/                     # Composed UI patterns
│   │   │   ├── src/
│   │   │   │   ├── status-card/
│   │   │   │   ├── vpn-card/
│   │   │   │   ├── connection-card/
│   │   │   │   ├── file-upload-zone/
│   │   │   │   ├── safety-feedback/
│   │   │   │   ├── quick-action-button/
│   │   │   │   ├── data-table/
│   │   │   │   └── index.ts
│   │   │   └── project.json
│   │   │
│   │   └── layouts/                      # Layout components
│   │       ├── src/
│   │       │   ├── app-shell/
│   │       │   ├── bottom-navigation/
│   │       │   ├── page-container/
│   │       │   ├── sidebar/
│   │       │   └── index.ts
│   │       └── project.json
│   │
│   ├── features/                         # ═══ FEATURE MODULES ═══
│   │   ├── dashboard/
│   │   │   ├── src/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/                # Generated GraphQL Hooks
│   │   │   │   ├── stores/
│   │   │   │   └── index.ts
│   │   │   └── project.json
│   │   │
│   │   ├── wan-config/
│   │   ├── vpn-client/
│   │   ├── vpn-server/
│   │   ├── dns-config/
│   │   ├── lan-config/
│   │   ├── wireless/
│   │   ├── firewall/
│   │   ├── safety-pipeline/
│   │   └── setup-wizard/
│   │
│   ├── config-gen/                       # ═══ ROUTER CONFIG GENERATION ═══
│   │   ├── core/                         # Core generation engine
│   │   ├── mikrotik/                     # MikroTik RouterOS generator
│   │   ├── openwrt/                      # OpenWRT UCI generator (future)
│   │   ├── vyos/                         # VyOS generator (future)
│   │   └── adapter/                      # Unified config adapter
│   │
│   ├── api-client/                       # ═══ API CLIENT LIBRARIES ═══
│   │   ├── core/                         # Apollo Client setup
│   │   │   ├── src/
│   │   │   │   ├── client.ts             # Apollo Client factory
│   │   │   │   ├── links/
│   │   │   │   │   ├── http.ts
│   │   │   │   │   ├── ws.ts
│   │   │   │   │   └── error.ts
│   │   │   │   ├── cache/                # TypePolicies
│   │   │   │   └── index.ts
│   │   │   └── project.json
│   │   │
│   │   ├── operations/                   # GraphQL Documents (*.graphql)
│   │   │   ├── src/
│   │   │   │   ├── router/
│   │   │   │   ├── vpn/
│   │   │   │   ├── system/
│   │   │   │   └── index.ts
│   │   │   └── project.json
│   │   │
│   │   └── generated/                    # CodeGen output
│   │       ├── src/
│   │       │   ├── index.ts              # Hooks, types, Zod schemas
│   │       │   └── fragment-matcher.ts
│   │       └── project.json
│   │
│   └── state/                            # ═══ STATE MANAGEMENT ═══
│       ├── stores/                       # Zustand stores (UI state)
│       └── machines/                     # XState machines (Complex flows)
│
├── backend/                              # ═══ GO BACKEND ═══
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   │
│   ├── ent/                              # ═══ ENT ORM ═══
│   │   ├── schema/                       # Data model definitions
│   │   ├── migrate/                      # SQL migrations
│   │   └── ...                           # Generated ORM code
│   │
│   ├── graph/                            # ═══ GRAPHQL SERVER ═══
│   │   ├── generated/                    # gqlgen internals
│   │   ├── model/                        # Typed models
│   │   ├── resolvers/                    # Resolver implementations
│   │   └── schema/                       # GraphQL Schema definitions
│   │
│   ├── internal/
│   │   ├── api/                          # REST Fallback (Echo)
│   │   │
│   │   ├── orchestrator/                 # Process Management
│   │   │   ├── feature_manager.go
│   │   │   ├── process_supervisor.go
│   │   │   └── ...
│   │   │
│   │   ├── network/                      # Network Orchestration
│   │   │   ├── vlan_allocator.go
│   │   │   ├── interface_factory.go
│   │   │   ├── pbr_engine.go
│   │   │   └── ...
│   │   │
│   │   ├── config/                       # Configuration Logic
│   │   ├── notifications/                # Push Notifications
│   │   └── alerts/                       # Alert Engine
│   │
│   ├── pkg/                              # ═══ REUSABLE GO PACKAGES ═══
│   │   ├── mikrotik/                     # MikroTik Lib (SSH/REST/API)
│   │   ├── router/                       # Router Abstraction
│   │   ├── features/                     # Feature Registry/Downloader
│   │   └── ...
│   │
│   ├── go.mod
│   └── go.sum
│
├── tools/                                # Development tools
├── docs/                                 # Documentation
├── docker/
├── nx.json
├── package.json
└── tsconfig.base.json
```

---
