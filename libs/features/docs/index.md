# Feature Library Documentation

This directory contains the technical reference documentation for `libs/features/`, the Layer 3
domain layer in NasNetConnect's three-tier component architecture.

## What Is the Feature Layer?

The feature layer sits at the top of the component hierarchy:

```
Layer 1: libs/ui/primitives    — shadcn/ui + Radix base components (~40 components)
Layer 2: libs/ui/patterns      — Composite reusable components with Platform Presenters (~56 components)
Layer 3: libs/features/*/      — Domain-specific business logic, pages, and feature modules (this layer)
```

Each feature module in `libs/features/` is a self-contained library that encapsulates everything
needed for one product domain: components, hooks, XState machines, Zod schemas, services, and
utility functions. Modules are consumed exclusively by the `apps/` layer and never by other feature
modules.

---

## Document Index

| File                        | Title                         | Description                                                                                                                                                                              |
| --------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.md`                  | Feature Library Documentation | This file. Master navigation index, glossary, and dependency rules.                                                                                                                      |
| `architecture-overview.md`  | Architecture Overview         | Feature module anatomy, Platform Presenter pattern, dependency rules, naming conventions, and module inventory with real source examples.                                                |
| `state-management.md`       | State Management              | Apollo Client, Zustand stores, React Hook Form + Zod, change-set store, drift detection, history/undo patterns.                                                                          |
| `xstate-machines.md`        | XState Machines               | All 9 XState machines: configPipeline, changeSet, templateApply, resourceLifecycle, wizard, update, ping, troubleshoot, VPN connection — with ASCII state diagrams.                      |
| `feature-firewall.md`       | Firewall Feature Module       | 43 components, 8 pages, template safety pipeline, address list import/export, port knocking, Zustand stores, schemas.                                                                    |
| `feature-services.md`       | Services Feature Module       | Feature Marketplace (Tor, sing-box, Xray, MTProxy, Psiphon, AdGuard Home), install flow, config forms, updates, VLAN pool, kill switch, device routing, traffic/quota, storage, sharing. |
| `feature-network.md`        | Network Feature Module        | 10 sub-modules: interfaces, IP address, routes, bridges, VLANs, DHCP, DNS, WAN, interface-stats, DNS diagnostics.                                                                        |
| `feature-diagnostics.md`    | Diagnostics Feature Module    | 5 diagnostic tools (ping, traceroute, DNS lookup, device scan, troubleshoot wizard), fix registry, diagnostic executor.                                                                  |
| `feature-alerts.md`         | Alerts Feature Module         | Alert rules, 6 notification channels, quiet hours, alert templates, dispatch chain.                                                                                                      |
| `feature-dashboard.md`      | Dashboard Feature Module      | Bandwidth chart, interface grid, resource gauges, recent logs, router health summary, cached data badge.                                                                                 |
| `feature-logs.md`           | Logs Feature Module           | IndexedDB cache, log correlation, action registry, bookmarks, alert integration, log settings.                                                                                           |
| `feature-minor.md`          | Minor Feature Modules         | Wireless (9 components), Router Discovery (scanner + credential services), Configuration Import (wizard + protocol selector).                                                            |
| `api-client-and-graphql.md` | API Client and GraphQL        | 21 query modules, Apollo Client link chain, 15 schema domains, custom scalars/directives, subscriptions, codegen workflow.                                                               |
| `cross-cutting-flows.md`    | Cross-Cutting Flows           | 6 end-to-end multi-package flows: Apply-Confirm-Merge, firewall template safety, service install, troubleshoot wizard, alert dispatch, VIF isolation.                                    |
| `testing-and-storybook.md`  | Testing and Storybook         | Vitest patterns, Storybook 10.2.7, XState machine testing, accessibility testing, platform presenter testing, CI integration.                                                            |
| `routing-and-navigation.md` | Routing and Navigation        | TanStack Router file-based routing, complete route tree (40+ routes), code splitting with LazyBoundary, route guards, token refresh, root layout, app-level hooks.                       |
| `feature-vpn.md`            | VPN Feature Module            | Multi-protocol VPN management (WireGuard, L2TP, PPTP, SSTP, IKEv2, OpenVPN), 9 pattern components, 20+ API hooks, client/server pages, protocol stats.                                   |
| `error-handling.md`         | Error Handling                | Three-tier error boundary hierarchy (App → Route → Component), withErrorBoundary HOC, TanStack Router error integration, GraphQL error handling, testing patterns.                       |

---

## Glossary of Key Terms

**Platform Presenter** A rendering component that targets a specific device class (Mobile, Tablet,
Desktop). It receives all state and callbacks as props from the headless wrapper and renders the
appropriate UI. File naming convention: `ComponentNameMobile.tsx`, `ComponentNameDesktop.tsx`, or
`ComponentName.Mobile.tsx`, `ComponentName.Desktop.tsx`.

**Headless Hook** A React hook (or the logic section of a wrapper component) that owns all business
logic, data fetching, filtering, and callbacks, but produces no JSX itself. It returns a
`sharedProps` object passed to whichever Platform Presenter is active. Named with the `use` prefix:
`useInterfaceList`, `useChainSummary`, `useAlertRules`.

**Feature Module** A standalone Nx library under `libs/features/<name>/` with its own `src/index.ts`
barrel export. It represents one product domain and contains components, hooks, pages, schemas, and
optional machines or services. Consumed exclusively by `apps/`.

**Domain Component** A component inside `libs/features/<name>/src/components/` that encodes business
logic specific to one feature domain. It composes Layer 2 patterns and Layer 1 primitives. Not
reused across feature modules.

**Apply-Confirm-Merge** The safety-first configuration pipeline used for router mutations: Draft →
Validate → Preview → Apply → Verify → Auto-Rollback. Implemented with XState and surfaced in the
`TemplateApplyFlow` component and related machines. See `Docs/architecture/data-architecture.md`.

**VIF (Virtual Interface)** A software network interface managed by the orchestrator. VIFs provide
isolation and traffic routing for downloadable services (Tor, sing-box, etc.). The `services`
feature module's `GatewayStatusCard` and device routing pages expose VIF state to the UI.

**Kill Switch** A failsafe mechanism that drops all traffic for a service if its VIF loses
connectivity, preventing IP leaks. Exposed in the `services` feature via isolation-related
components and the VIF bootstrap layer.

**Change Set** A set of pending router configuration mutations that can be previewed and atomically
applied or discarded. Change sets are the unit of the Apply-Confirm-Merge pipeline. The `firewall`
module's `TemplateApplyFlow` and `UndoFloatingButton` implement this at the UI layer.

**Universal State** The 8-layer resource model (`Docs/architecture/data-architecture.md`) that
describes how router configuration flows from physical hardware through the provisioning layer up to
the UI. Each feature module reads a slice of this state via Apollo Client GraphQL queries.

**Safety Pipeline** One of the 8 novel architectural patterns (see
`Docs/architecture/novel-pattern-designs.md`). Applies to any UI operation that can break network
connectivity: it enforces a preview step, a confirmation countdown, and a timed rollback window. The
`template-apply.machine.ts` in `libs/features/firewall/` is the reference implementation.

---

## Dependency Rules Summary

```
apps/connect  →  features/*
              →  libs/ui/primitives, libs/ui/patterns, libs/ui/layouts
              →  libs/api-client/queries, libs/api-client/generated
              →  libs/core/types, libs/core/utils, libs/core/constants
              →  libs/state/stores

features/*    →  libs/ui/primitives, libs/ui/patterns, libs/ui/layouts
              →  libs/api-client/queries, libs/api-client/generated
              →  libs/core/types, libs/core/utils, libs/core/constants
              →  libs/state/stores

              NEVER  →  other features/*
```

Features are **consumers** of the shared layer and **providers** to the application layer.
Cross-feature imports are forbidden. If two features need shared logic, that logic belongs in
`libs/core/utils`, `libs/ui/patterns`, or `libs/api-client/queries`.

---

## Quick Links to Related Documentation

| Topic                                       | Document                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| Platform Presenter implementation guide     | `Docs/design/PLATFORM_PRESENTER_GUIDE.md`                                |
| Complete design token reference             | `Docs/design/DESIGN_TOKENS.md`                                           |
| 56-component pattern catalog                | `Docs/design/ux-design/6-component-library.md`                           |
| 3-layer architecture overview               | `Docs/design/ux-design/1-design-system-foundation.md`                    |
| Frontend architecture (20 principles)       | `Docs/architecture/frontend-architecture.md`                             |
| Universal State v2 and Apply-Confirm-Merge  | `Docs/architecture/data-architecture.md`                                 |
| Novel patterns (VIF, Safety Pipeline, etc.) | `Docs/architecture/novel-pattern-designs.md`                             |
| GraphQL schema conventions                  | `Docs/architecture/api-contracts.md`                                     |
| Testing strategy (trophy model)             | `Docs/architecture/implementation-patterns/testing-strategy-patterns.md` |
| WCAG AAA accessibility requirements         | `Docs/design/ux-design/8-responsive-design-accessibility.md`             |
| All architecture docs                       | `Docs/architecture/index.md`                                             |
| All design docs                             | `Docs/design/README.md`                                                  |
