---
sidebar_position: 0
title: Documentation Index
---

# NasNetConnect Frontend Documentation

This is the master index for all developer documentation for the `apps/connect` frontend
application.

**NasNetConnect** is an enterprise-grade MikroTik router management platform with a dual nature:

1. **Router Management** — Configuration, monitoring, backup/restore, fleet management
2. **Network Services Marketplace** — Downloadable features (Tor, sing-box, Xray-core, MTProxy,
   Psiphon, AdGuard Home)

It runs as a single Docker container embedded on the MikroTik router itself (`<10MB`, `<50MB RAM`).

---

## Where to Start

| Role                 | Start Here                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| New to the project   | [Overview](./getting-started/overview.md) → [Environment Setup](./getting-started/environment-setup.md)  |
| Want to run the app  | [Key Commands](./getting-started/key-commands.md)                                                        |
| Building a feature   | [Architecture Overview](./architecture/overview.md) → [State Management](./state-management/overview.md) |
| Working on UI        | [UI System Overview](./ui-system/overview.md) → [Design Tokens](./ui-system/design-tokens.md)            |
| Writing data queries | [Data Fetching](./data-fetching/graphql-hooks.md)                                                        |
| Writing forms        | [Forms & Validation](./forms-validation/overview.md)                                                     |
| Adding i18n/a11y     | [i18n Setup](./i18n-accessibility/i18n.md)                                                               |
| Writing tests        | [Testing Strategy](./testing/overview.md)                                                                |
| Deploying            | [Docker Build](./operations/development-workflow.md)                                                     |

---

## Table of Contents

### [01 — Getting Started](./getting-started/overview.md)

- [Overview](./getting-started/overview.md) — What NasNetConnect is, key constraints, target
  personas
- [Environment Setup](./getting-started/environment-setup.md) — Prerequisites, env vars, dev server
- [Project Structure](./getting-started/project-structure.md) — Directory tree, import aliases,
  dependency rules
- [Key Commands](./getting-started/key-commands.md) — All npm/nx/docker/codegen commands

### [02 — Architecture](./architecture/overview.md)

- [Overview](./architecture/overview.md) — Monorepo layout, library layers, core design decisions
- [Routing](./architecture/routing.md) — TanStack Router file-based routing, route tree
- [Provider Stack](./architecture/provider-stack.md) — Context providers and initialization order
- [Component Architecture](./architecture/overview.md) — 3-layer system (Primitives → Patterns →
  Domain)
- [Platform Presenters](./ui-system/platform-presenters.md) — Headless + Mobile/Tablet/Desktop
  presenters

### [03 — State Management](./state-management/overview.md)

- [Overview](./state-management/overview.md) — State layers, decision tree
- [Apollo Client](./state-management/apollo-client.md) — GraphQL server state, cache configuration
- [Zustand Stores](./state-management/zustand-stores.md) — UI state, sidebar, notifications
- [XState Machines](./state-management/xstate-machines.md) — Complex flows (VPN, config pipeline,
  wizard)
- [Apollo Client](./state-management/apollo-client.md) — REST endpoint coexistence during migration

### [04 — UI System](./ui-system/overview.md)

- [Overview](./ui-system/overview.md) — Design system introduction, brand colors, typography
- [Design Tokens](./ui-system/design-tokens.md) — 200+ tokens, semantic vs primitive, Tailwind 4
  integration
- [Primitives Library](./ui-system/primitives-catalog.md) — shadcn/ui + Radix (~40 components)
- [Patterns Library](./ui-system/patterns-catalog.md) — Composite components catalog (~56
  components)
- [Design Tokens](./ui-system/design-tokens.md) — Framer Motion, animation tokens, reduced motion
- [Accessibility](./i18n-accessibility/accessibility.md) — WCAG AAA, 44px touch targets, keyboard
  nav

### [05 — Data Fetching](./data-fetching/overview.md)

- [GraphQL & Apollo](./data-fetching/graphql-hooks.md) — Hooks, cache policies, subscriptions
- [Data Fetching](./data-fetching/overview.md) — `libs/api-client/` organization
- [Code Generation](./data-fetching/codegen.md) — `npm run codegen`, generated types and hooks
- [Offline Support](./data-fetching/offline-support.md) — WebSocket subscriptions with graphql-ws

### [06 — Forms & Validation](./forms-validation/overview.md)

- [Forms Overview](./forms-validation/overview.md) — Form setup, field registration, error display
- [Validation Pipeline](./forms-validation/validation-pipeline.md) — Schema design, custom
  validators, network types
- [Validation Pipeline](./forms-validation/validation-pipeline.md) — Multi-stage validation, async
  validation
- [Validation Pipeline](./forms-validation/validation-pipeline.md) — Draft → Validate → Preview →
  Apply → Rollback
- [Wizard Forms](./forms-validation/wizard-forms.md) — Wizards, inline editing, confirmation dialogs

### [07 — Cross-Cutting Features](./cross-cutting-features/router-connection.md)

- [Router Connection](./cross-cutting-features/router-connection.md) — JWT auth, protected routes
- [Alerts System](./cross-cutting-features/alerts-system.md) — Alert rules, channels, in-app toasts
- [Change Set System](./cross-cutting-features/change-set-system.md) — Cmd+K, global shortcuts
- [Router Connection](./cross-cutting-features/router-connection.md) — Heartbeat, banners, reconnect
- [Drift Detection Feature](./cross-cutting-features/drift-detection-feature.md) — Error boundaries,
  toast errors, fallbacks
- [Design Tokens](./ui-system/design-tokens.md) — Theme provider, CSS variables, token switching
- [Mocking](./testing/mocking.md) — MSW setup for development and testing

### [08 — Feature Modules](./feature-modules/dashboard.md)

- [Dashboard](./feature-modules/dashboard.md) — Home dashboard, DNS lookup, network overview, routes
- [Firewall](./feature-modules/firewall.md) — Address lists, NAT, mangle, port knocking, rate
  limiting
- [Network](./feature-modules/network.md) — Interfaces, VLANs, DHCP, bridges, tunnels
- [VPN](./feature-modules/vpn.md) — VPN clients, VPN servers, WireGuard, OpenVPN, IKEv2
- [Wireless (Wi-Fi)](./feature-modules/wireless.md) — Wi-Fi interfaces, clients, security config
- [Diagnostics](./feature-modules/diagnostics.md) — Traceroute, DNS lookup, port scanner, circuit
  breaker
- [Logs](./feature-modules/logs.md) — Router logs, firewall logs, service logs
- [Services / Plugins](./feature-modules/services.md) — Feature marketplace, install/manage Tor,
  sing-box, etc.

### [09 — i18n & Accessibility](./i18n-accessibility/i18n.md)

- [i18n](./i18n-accessibility/i18n.md) — i18next, language detection, lazy loading
- [i18n](./i18n-accessibility/i18n.md) — DirectionProvider, RTL layout, Tailwind RTL
- [Accessibility](./i18n-accessibility/accessibility.md) — WCAG AAA checklist, axe-core integration

### [10 — Testing](./testing/overview.md)

- [Testing Overview](./testing/overview.md) — Testing trophy, Vitest, RTL, Playwright
- [Unit Testing](./testing/unit-testing.md) — Vitest setup, RTL patterns
- [Storybook](./operations/storybook.md) — Story writing, Storybook 10, a11y addon
- [E2E Testing](./testing/e2e-testing.md) — Playwright, multi-browser, CHR Docker router simulation

### [11 — Operations](./operations/development-workflow.md)

- [Development Workflow](./operations/development-workflow.md) — Multi-arch image, size constraints,
  RouterOS deploy
- [Development Workflow](./operations/development-workflow.md) — GitHub Actions, quality gates,
  codegen check
- [Performance](./operations/performance.md) — `<3MB` target, chunk splitting, analysis

---

## Quick Reference

| Need                          | Location                                       |
| ----------------------------- | ---------------------------------------------- |
| Brand colors + tokens         | `Docs/design/DESIGN_TOKENS.md`                 |
| Component catalog             | `Docs/design/ux-design/6-component-library.md` |
| Platform presenter guide      | `Docs/design/PLATFORM_PRESENTER_GUIDE.md`      |
| Backend architecture          | `Docs/architecture/backend-architecture.md`    |
| GraphQL schema conventions    | `Docs/architecture/api-contracts.md`           |
| Architecture decision records | `Docs/architecture/adrs/`                      |
| All design docs               | `Docs/design/README.md`                        |
| All architecture docs         | `Docs/architecture/index.md`                   |
