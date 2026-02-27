# Feature Module: Firewall (`libs/features/firewall`)

## 1. Overview

The `@nasnet/features/firewall` library is a Layer 3 domain feature module (Epic 0.6: Firewall & Routing Viewer) that provides the complete UI surface for MikroTik firewall management. It covers viewing and editing filter rules, NAT rules, mangle rules, RAW rules, address lists, port knocking sequences, service ports, rate limiting, firewall templates, connection tracking, and firewall logs.

The module is architected around three concerns:

1. **Read-only viewing** of existing firewall rules via live GraphQL queries (Phase 0 behaviour, gated by `ReadOnlyNotice`).
2. **Interactive editing** introduced progressively through the Safety Pipeline — a multi-step XState machine that enforces preview, conflict detection, optional high-risk acknowledgment, apply, and a 5-minute rollback window before changes are committed.
3. **Template management** — a reusable template gallery that lets admins package, import, export, apply, and roll back firewall rule sets as named templates.

### Key architectural traits

- All data comes from Apollo Client GraphQL queries/mutations; no REST calls.
- XState v5 (`xstate`) governs the template apply workflow.
- React Hook Form + Zod validate all forms; Zod schemas are exported and reused by the backend codegen pipeline.
- Platform presenters (Desktop / Mobile) separate rendering logic from business logic throughout; the headless pattern from `PLATFORM_PRESENTER_GUIDE.md` is applied consistently.
- Custom templates are persisted to the browser's IndexedDB via a `useCustomTemplates` hook.

### Public import path

```ts
import { FilterRulesTableDesktop, TemplateApplyFlow, AddressListView, ... } from '@nasnet/features/firewall';
```

---

## 2. Directory Tree

```
libs/features/firewall/
├── src/
│   ├── index.ts                         # Public barrel export
│   ├── components/                      # Layer 3 domain components (~43 exports)
│   │   ├── index.ts
│   │   ├── FilterRulesTable.tsx
│   │   ├── FilterRulesTableDesktop.tsx
│   │   ├── FilterRulesTableMobile.tsx
│   │   ├── NATRulesTable.tsx
│   │   ├── NATRulesTableMobile.tsx
│   │   ├── RoutingTable.tsx
│   │   ├── ReadOnlyNotice.tsx
│   │   ├── ServicesStatus.tsx
│   │   ├── ChainSummaryCards.tsx
│   │   ├── TrafficFlowDiagram.tsx
│   │   ├── RuleSearchFilters.tsx
│   │   ├── MangleRulesTable.tsx
│   │   ├── MangleRulesTableDesktop.tsx
│   │   ├── MangleRulesTableMobile.tsx
│   │   ├── RawRulesTable.tsx
│   │   ├── RawRulesTableDesktop.tsx
│   │   ├── RawRulesTableMobile.tsx
│   │   ├── AddressListEntryForm.tsx
│   │   ├── AddressListImportDialog.tsx
│   │   ├── AddressListExportDialog.tsx
│   │   ├── IPAddressDisplay.tsx
│   │   ├── AddToAddressListContextMenu.tsx
│   │   ├── FirewallStatusHero.tsx
│   │   ├── FirewallQuickStats.tsx
│   │   ├── RecentFirewallActivity.tsx
│   │   ├── FirewallDetailTabs.tsx
│   │   ├── ConnectionsPage.tsx
│   │   ├── PortForwardWizardDialog.tsx
│   │   ├── MasqueradeQuickDialog.tsx
│   │   ├── PortKnockingPage.tsx
│   │   ├── PortKnockSequenceManager.tsx
│   │   ├── PortKnockSequenceManagerDesktop.tsx
│   │   ├── PortKnockSequenceManagerMobile.tsx
│   │   ├── PortKnockLogViewer.tsx
│   │   ├── ServicePortsTable.tsx
│   │   ├── ServicePortsTableDesktop.tsx
│   │   ├── ServicePortsTableMobile.tsx
│   │   ├── AddServiceDialog.tsx
│   │   ├── ServiceGroupDialog.tsx
│   │   ├── SaveTemplateDialog.tsx
│   │   ├── ImportTemplateDialog.tsx
│   │   ├── TemplateApplyFlow.tsx
│   │   └── UndoFloatingButton.tsx
│   ├── pages/                           # Layer 3 page components (8 pages)
│   │   ├── index.ts
│   │   ├── AddressListView.tsx
│   │   ├── FirewallLogsPage.tsx
│   │   ├── ManglePage.tsx
│   │   ├── NATRulesPage.tsx
│   │   ├── RateLimitingPage.tsx
│   │   ├── RawPage.tsx
│   │   ├── ServicePortsPage.tsx
│   │   └── TemplatesPage.tsx
│   ├── machines/
│   │   └── template-apply.machine.ts    # XState v5 machine for Safety Pipeline
│   ├── hooks/
│   │   ├── useCustomTemplates.ts        # IndexedDB persistence for custom templates
│   │   └── ...
│   ├── schemas/
│   │   ├── templateSchemas.ts           # Zod schemas + validation helpers
│   │   └── addressListSchemas.ts
│   ├── services/
│   │   └── ...
│   └── utils/
│       ├── addressListParsers.ts        # CSV/JSON/TXT parser + batch validator
│       └── template-export.ts
├── __test-utils__/
│   └── firewall-templates/
│       └── template-fixtures.ts
├── package.json
└── project.json
```

---

## 3. Component Catalogue

### 3.1 Filter Rule Components

| Component | File | Platform | Purpose |
|---|---|---|---|
| `FilterRulesTable` | `components/FilterRulesTable.tsx` | Shared (dispatcher) | Auto-selects Desktop or Mobile presenter via `usePlatform()` |
| `FilterRulesTableDesktop` | `components/FilterRulesTableDesktop.tsx` | Desktop | Dense data table with sortable columns, inline enable/disable toggle, row actions |
| `FilterRulesTableMobile` | `components/FilterRulesTableMobile.tsx` | Mobile | Card-list view with 44px touch targets, swipe-to-reveal actions |

### 3.2 Mangle Rule Components

| Component | File | Platform | Purpose |
|---|---|---|---|
| `MangleRulesTable` | `components/MangleRulesTable.tsx` | Shared | Dispatcher for mangle table |
| `MangleRulesTableDesktop` | `components/MangleRulesTableDesktop.tsx` | Desktop | Table view with packet/byte counters, DSCP marks |
| `MangleRulesTableMobile` | `components/MangleRulesTableMobile.tsx` | Mobile | Card layout for mangle rules |

### 3.3 RAW Rule Components

| Component | File | Platform | Purpose |
|---|---|---|---|
| `RawRulesTable` | `components/RawRulesTable.tsx` | Shared | Dispatcher for RAW table (NAS-7.X) |
| `RawRulesTableDesktop` | `components/RawRulesTableDesktop.tsx` | Desktop | Dense desktop table for pre-connection-tracking rules |
| `RawRulesTableMobile` | `components/RawRulesTableMobile.tsx` | Mobile | Mobile card view for RAW rules |

### 3.4 NAT Components

| Component | File | Platform | Purpose |
|---|---|---|---|
| `NATRulesTable` | `components/NATRulesTable.tsx` | Desktop | Full NAT table with srcnat/dstnat chain tabs |
| `NATRulesTableMobile` | `components/NATRulesTableMobile.tsx` | Mobile | Mobile NAT card list |
| `PortForwardWizardDialog` | `components/PortForwardWizardDialog.tsx` | Shared | Step-by-step wizard for creating port-forward NAT rules |
| `MasqueradeQuickDialog` | `components/MasqueradeQuickDialog.tsx` | Shared | One-click masquerade rule creation dialog |

### 3.5 Address List Components

| Component | File | Platform | Purpose |
|---|---|---|---|
| `AddressListEntryForm` | `components/AddressListEntryForm.tsx` | Shared | RHF+Zod form for single address list entry (IP, comment, timeout) |
| `AddressListImportDialog` | `components/AddressListImportDialog.tsx` | Shared | Multi-step bulk import (CSV/JSON/TXT) with drag-and-drop and batch validation |
| `AddressListExportDialog` | `components/AddressListExportDialog.tsx` | Shared | Export address lists to CSV/JSON/TXT with download |
| `IPAddressDisplay` | `components/IPAddressDisplay.tsx` | Shared | Formatted display of IP/CIDR with copy-to-clipboard |
| `AddToAddressListContextMenu` | `components/AddToAddressListContextMenu.tsx` | Shared | Right-click context menu to add an IP to any address list |

### 3.6 Dashboard / Status Components

| Component | File | Platform | Purpose |
|---|---|---|---|
| `FirewallStatusHero` | `components/FirewallStatusHero.tsx` | Shared | Hero banner showing overall firewall status, rule counts, and last-modified time |
| `FirewallQuickStats` | `components/FirewallQuickStats.tsx` | Shared | KPI cards: total rules, active rules, dropped packets (last 5 min), connections |
| `RecentFirewallActivity` | `components/RecentFirewallActivity.tsx` | Shared | Mini log feed of recent drops, accepts, and security events |
| `FirewallDetailTabs` | `components/FirewallDetailTabs.tsx` | Shared | Tabbed navigation across all firewall sub-pages |
| `ChainSummaryCards` | `components/ChainSummaryCards.tsx` | Shared | Per-chain rule count cards (input / forward / output / prerouting / postrouting) |
| `ServicesStatus` | `components/ServicesStatus.tsx` | Shared | Connection-tracking and firewall service health indicators |

### 3.7 Port Knocking Components (NAS-7.12)

| Component | File | Platform | Purpose |
|---|---|---|---|
| `PortKnockingPage` | `components/PortKnockingPage.tsx` | Shared | Main port-knocking container; composes sequence manager and log viewer |
| `PortKnockSequenceManager` | `components/PortKnockSequenceManager.tsx` | Shared | Dispatcher that selects Desktop or Mobile presenter |
| `PortKnockSequenceManagerDesktop` | `components/PortKnockSequenceManagerDesktop.tsx` | Desktop | Table view with inline enable/disable switch, knock-port badges, timeout columns, edit/delete actions |
| `PortKnockSequenceManagerMobile` | `components/PortKnockSequenceManagerMobile.tsx` | Mobile | Card list with 44px touch targets, sequence detail accordion |
| `PortKnockLogViewer` | `components/PortKnockLogViewer.tsx` | Shared | Real-time log stream showing knock attempts, successes, and failures |

### 3.8 Service Ports Components (NAS-7.8)

| Component | File | Platform | Purpose |
|---|---|---|---|
| `ServicePortsTable` | `components/ServicePortsTable.tsx` | Shared | Dispatcher for service port table |
| `ServicePortsTableDesktop` | `components/ServicePortsTableDesktop.tsx` | Desktop | Full table of RouterOS service ports (api, ftp, ssh, telnet, winbox, etc.) with enable/disable |
| `ServicePortsTableMobile` | `components/ServicePortsTableMobile.tsx` | Mobile | Compact card list of service ports |
| `AddServiceDialog` | `components/AddServiceDialog.tsx` | Shared | Dialog form to add a custom service port mapping |
| `ServiceGroupDialog` | `components/ServiceGroupDialog.tsx` | Shared | Dialog to manage named service port groups |

### 3.9 Template Management Components (NAS-7.6)

| Component | File | Platform | Purpose |
|---|---|---|---|
| `SaveTemplateDialog` | `components/SaveTemplateDialog.tsx` | Shared | Dialog to snapshot current filter rules as a named custom template (persisted to IndexedDB) |
| `ImportTemplateDialog` | `components/ImportTemplateDialog.tsx` | Shared | Dialog to import a template from JSON file or paste; validates against `FirewallTemplateSchema` |
| `TemplateApplyFlow` | `components/TemplateApplyFlow.tsx` | Shared | XState-driven multi-step flow (configure → preview → confirm → apply → success/rollback) |
| `UndoFloatingButton` | `components/UndoFloatingButton.tsx` | Shared | Floating bottom-right button with 5-minute countdown for post-apply rollback |

### 3.10 Utility / Filter Components

| Component | File | Platform | Purpose |
|---|---|---|---|
| `RuleSearchFilters` | `components/RuleSearchFilters.tsx` | Shared | Filter panel with 300ms debounced text search, chain/action/protocol/status dropdowns, active-filter badges, mobile collapse |
| `ReadOnlyNotice` | `components/ReadOnlyNotice.tsx` | Shared | Dismissible info banner explaining Phase 0 read-only mode; state persisted to localStorage |
| `RoutingTable` | `components/RoutingTable.tsx` | Shared | Static routing table viewer (destination, gateway, interface, distance) |
| `TrafficFlowDiagram` | `components/TrafficFlowDiagram.tsx` | Shared | Visual diagram of packet traversal through firewall chains |
| `ConnectionsPage` | `components/ConnectionsPage.tsx` | Shared | Connection tracking table showing active TCP/UDP/ICMP state entries |

---

## 4. Page Catalogue

| Page | File | Description |
|---|---|---|
| `AddressListView` | `pages/AddressListView.tsx` | Full CRUD for all firewall address lists. Orchestrates `AddressListManager` (Layer 2 pattern), `AddressListEntryForm`, `AddressListImportDialog`, and `AddressListExportDialog`. Uses `Sheet` for add-entry on mobile and `Dialog` for desktop. |
| `FirewallLogsPage` | `pages/FirewallLogsPage.tsx` | Streams live firewall log events. Integrates `RuleSearchFilters` for chain/action/IP filtering and a virtualized log list with time, source, destination, and action columns. |
| `ManglePage` | `pages/ManglePage.tsx` | Displays all mangle rules grouped by chain. Includes `MangleRulesTable` and `RuleSearchFilters`. |
| `NATRulesPage` | `pages/NATRulesPage.tsx` | NAT management with chain tabs (All / srcnat / dstnat), `NATRulesTable`, `MasqueradeQuickDialog`, and `PortForwardWizardDialog`. |
| `RateLimitingPage` | `pages/RateLimitingPage.tsx` | View and configure connection-rate and burst limits via queue trees and simple queues. |
| `RawPage` | `pages/RawPage.tsx` | Displays RAW chain rules (pre-connection-tracking) with `RawRulesTable` and `RuleSearchFilters`. |
| `ServicePortsPage` | `pages/ServicePortsPage.tsx` | Service port table with enable/disable toggles for all RouterOS services (api, ftp, ssh, telnet, www, winbox, api-ssl). |
| `TemplatesPage` | `pages/TemplatesPage.tsx` | Template gallery with Browse and Apply tabs. Composes `TemplateGallery` (Layer 2), `TemplateApplyFlow`, `SaveTemplateDialog`, and `ImportTemplateDialog`. |

---

## 5. Firewall Template Safety Pipeline

The template application flow is the canonical example of NasNetConnect's **Safety Pipeline** architectural pattern. The entry point is `TemplatesPage`, which mounts `TemplateApplyFlow` after the user selects a template from the gallery. `TemplateApplyFlow` instantiates the XState machine via `createTemplateApplyMachine` and renders different UI for each state.

### 5.1 State Machine

File: `libs/features/firewall/src/machines/template-apply.machine.ts`

```
idle → configuring → previewing → reviewing → [confirming] → applying → success
                                                ↓                           ↓
                                            error ←────────────────────────→ error
                                                                        ↓
                                                              rollingBack → rolledBack
```

| State | Description |
|---|---|
| `idle` | Waiting for `SELECT_TEMPLATE` event |
| `configuring` | User fills in template variables via `TemplatePreview` form |
| `previewing` | Async: calls `previewTemplate` service; shows spinner |
| `reviewing` | User reviews impact analysis (rule count, chains, conflicts, warnings) |
| `confirming` | High-risk gate: shown when rules > 10, chains > 3, or conflicts exist |
| `applying` | Async: calls `applyTemplate` service; shows spinner with rule count |
| `success` | Apply completed; rollback ID captured; `UndoFloatingButton` rendered |
| `rollingBack` | Async: calls `executeRollback` service |
| `rolledBack` | Rollback confirmed; `notifyRolledBack` callback fired |
| `error` | Caught error; offers Retry, Rollback (if rollback ID exists), and Reset |

**High-risk thresholds** (constants in the machine file):

```ts
const HIGH_RISK_THRESHOLDS = {
  MAX_LOW_RISK_RULES: 10,   // >10 new rules → confirming state
  MAX_LOW_RISK_CHAINS: 3,   // >3 affected chains → confirming state
} as const;
// Plus: any conflicts or any warnings also trigger confirming
```

**Events accepted:**

```ts
type TemplateApplyEvent =
  | { type: 'SELECT_TEMPLATE'; template: FirewallTemplate; routerId: string }
  | { type: 'UPDATE_VARIABLES'; variables: Record<string, string> }
  | { type: 'PREVIEW' }
  | { type: 'CONFIRM' }
  | { type: 'APPLY' }
  | { type: 'ACKNOWLEDGED' }   // user checked the acknowledgment checkbox
  | { type: 'ROLLBACK' }
  | { type: 'RETRY' }
  | { type: 'CANCEL' }
  | { type: 'RESET' };
```

**Context shape:**

```ts
interface TemplateApplyContext {
  routerId: string | null;
  template: FirewallTemplate | null;
  variables: Record<string, string>;
  validationErrors: Array<{ field: string; message: string }>;
  previewResult: TemplatePreviewResult | null;
  applyResult: FirewallTemplateResult | null;
  applyStartedAt: number | null;   // timestamp for rollback timer
  errorMessage: string | null;
}
```

### 5.2 UndoFloatingButton

After a successful apply, `TemplateApplyFlow` renders `UndoFloatingButton` fixed to the bottom-right corner. This component:

- Starts a **5-minute (300-second) countdown** on mount.
- Displays time remaining with `formatTime()` in MM:SS.
- Changes urgency styling: `normal` (> 60s), `warning` (31-60s), `critical` (≤ 30s).
- Shows a confirmation dialog before executing rollback.
- Calls `onRollback()` then hides on success, or auto-hides via `onExpire()` when the countdown reaches zero.

```ts
const TOTAL_SECONDS = 300;  // 5 minutes
```

### 5.3 Full Pipeline Flow (TemplatesPage → API)

```
User clicks "Apply Template"
  └─> TemplatesPage.handleApplyTemplate()
        └─> setSelectedTemplate(template)
              └─> setActiveTab('apply')
                    └─> <TemplateApplyFlow
                              routerId={routerId}
                              template={selectedTemplate}
                              onPreview={handlePreviewTemplate}
                              onApply={handleApply}
                              onRollback={handleRollback} />
                          └─> createTemplateApplyMachine({ previewTemplate, applyTemplate, executeRollback })
                                └─> useMachine(machine)
                                      │
                                      ├─> configuring state (user configures variables)
                                      │     └─> PREVIEW event
                                      │
                                      ├─> previewing state (async)
                                      │     └─> previewTemplate(routerId, template, variables)
                                      │           └─> usePreviewTemplate() Apollo mutation
                                      │
                                      ├─> reviewing state (impact analysis shown)
                                      │     └─> CONFIRM event
                                      │
                                      ├─> confirming state [only if high-risk]
                                      │     └─> user checks acknowledgment checkbox
                                      │           └─> ACKNOWLEDGED event
                                      │
                                      ├─> applying state (async)
                                      │     └─> applyTemplate(routerId, template, variables)
                                      │           └─> useApplyTemplate() Apollo mutation
                                      │
                                      └─> success state
                                            └─> <UndoFloatingButton countdown=5min />
                                                  └─> ROLLBACK event → rollingBack → rolledBack
```

---

## 6. Address List Import/Export Flow

### Import

`AddressListImportDialog` implements a 4-step wizard:

1. **select** — User selects target list name, format (auto-detect / CSV / JSON / TXT), and provides content via drag-and-drop file upload or text paste.
2. **preview** — `parseAddressList()` and `validateInBatches()` are called. For >100 entries, validation runs in batches with a progress indicator. Valid entries and errors are shown in a scrollable preview. The user can import only the valid entries.
3. **importing** — Progress bar updated as entries are written to the GraphQL mutation `useBulkCreateAddressListEntries`.
4. **complete** — Success confirmation with "Import More" or "Close" options.

Supported input formats:
- **CSV**: `IP, comment, timeout` per line
- **JSON**: Array of `{ address, comment?, timeout? }` objects
- **TXT**: One IP per line

### Export

`AddressListExportDialog` downloads the current address list in the user's chosen format (CSV / JSON / TXT) via the browser's download API.

---

## 7. Port Knocking Sequence Management

Port knocking is managed by `PortKnockSequenceManagerDesktop` (and its mobile counterpart). Each sequence stores:

- **Name** — human label
- **Protected service** — `protectedProtocol:protectedPort` (e.g., `tcp:22` for SSH)
- **Knock ports** — ordered list of ports that must be sequentially knocked; displayed as `Badge` chips in the table
- **Status** — `isEnabled` boolean with an inline `Switch` toggle; changing it calls `useTogglePortKnockSequence`
- **Recent access count** — live counter of successful knock-and-opens
- **Timeouts** — knock timeout (K) and access timeout (A) in seconds; displayed side by side with a Clock icon

The delete flow uses a confirmation `Dialog` that includes an SSH-specific warning when `protectedPort === 22`.

---

## 8. Zustand Stores Used

| Store | Import | Usage in Firewall |
|---|---|---|
| `useConnectionStore` | `@nasnet/state/stores` | Read `activeRouterId` and `currentRouterIp` for query scoping |
| `useNATUIStore` | `@nasnet/state/stores` | Track active NAT chain tab selection in `NATRulesPage` |

---

## 9. Schemas and Validation

### 9.1 Template Schemas (`schemas/templateSchemas.ts`)

Re-exports the canonical types from `@nasnet/core/types` and adds application-level validation utilities:

| Export | Type | Description |
|---|---|---|
| `FirewallTemplateSchema` | Zod | Full template object (id, name, description, category, complexity, variables, rules) |
| `TemplateVariableSchema` | Zod | Variable definition (name, type, label, options, isRequired, defaultValue) |
| `TemplateRuleSchema` | Zod | Individual rule within a template |
| `TemplatePreviewResultSchema` | Zod | Preview response (resolvedRules, conflicts, impactAnalysis) |
| `FirewallTemplateResultSchema` | Zod | Apply response (isSuccessful, appliedRulesCount, rollbackId) |
| `createVariableValueSchema(variable)` | Function | Generates a Zod schema for a variable value based on its `VariableType` |
| `createTemplateVariablesSchema(template)` | Function | Builds a `z.object({...})` for all variables in a template |
| `validateTemplateVariables(template, values)` | Function | Returns `{ success, errors }` without throwing |

**Variable type to Zod mapping:**

| `VariableType` | Zod Rule |
|---|---|
| `INTERFACE` | `z.string().refine(validateInterface)` or `z.enum(options)` |
| `SUBNET` | `z.string().refine(validateCIDR)` — expects `x.x.x.x/n` |
| `IP` | `z.string().refine(validateIPv4)` |
| `PORT` | `z.string().refine(validatePort)` — 1–65535 |
| `PORT_RANGE` | `z.string().refine(validatePortRange)` — `start-end` |
| `VLAN_ID` | `z.string().refine(validateVlanId)` — 1–4094 |
| `STRING` | `z.string().min(1).max(255)` |
| `NUMBER` | `z.number().int()` |
| `BOOLEAN` | `z.boolean()` |

### 9.2 Core Type Definitions (`libs/core/types/src/firewall/`)

These `.d.ts` files are generated (do not edit manually) and provide the TypeScript types consumed throughout the feature:

| File | Key Types |
|---|---|
| `filter-rule.types.d.ts` | `FilterRule`, `FilterChain` (`input|forward|output`), `FilterAction` (`accept|drop|reject|log|jump|tarpit|passthrough`), `FilterProtocol`, `FilterRuleSchema` |
| `nat-rule.types.d.ts` | `NATRule`, `NatChain` (`srcnat|dstnat`), `NATAction` |
| `mangle-rule.types.d.ts` | `MangleRule`, `MangleChain`, `MangleAction` |
| `raw-rule.types.d.ts` | `RawRule`, `RawChain` |
| `firewall-log.types.d.ts` | `FirewallLogEntry`, `LogAction`, `LogChain` |
| `port-knock.types.d.ts` | `PortKnockSequence`, `KnockPort` |
| `service-port.types.d.ts` | `ServicePort`, `ServiceName` |
| `rate-limit.types.d.ts` | `RateLimit`, `QueueType` |
| `template.types.d.ts` | `FirewallTemplate`, `TemplateVariable`, `TemplateRule`, `ImpactAnalysis`, `TemplateConflict` |

---

## 10. Key Pattern Details

### `ReadOnlyNotice`

Displayed at the top of the firewall tab in Phase 0. Explains that editing is disabled and previews the Safety Pipeline coming in Phase 1. Dismissed state is persisted to `localStorage` under the key `nasnet:firewall:notice-dismissed`. The component renders `null` once dismissed.

```tsx
<ReadOnlyNotice className="mb-4" />
```

### `RuleSearchFilters`

Universal filter panel used on Filter, Mangle, RAW, and Logs pages. Features:

- **Debounced text search** (300ms) across comment, IPs, and ports
- **Dropdown filters**: chain, action, protocol, status — each with an `'all'` option
- **Active filter badges** with individual `×` remove buttons
- **Clear all** button
- **Mobile collapse**: hidden by default on `<md` breakpoints; toggled via a "Show Filters" button

```tsx
<RuleSearchFilters
  filters={filters}
  onChange={handleFilterChange}
  onClearAll={handleClearAll}
  activeFilterCount={2}
/>
```

### `UndoFloatingButton`

The UndoFloatingButton uses urgency-based styling driven by remaining seconds:

```ts
function getUrgencyLevel(seconds: number): 'normal' | 'warning' | 'critical' {
  if (seconds <= 30) return 'critical';  // bg-error
  if (seconds <= 60) return 'warning';   // bg-warning
  return 'normal';                       // bg-card border
}
```

---

## 11. Hooks

| Hook | File | Description |
|---|---|---|
| `useCustomTemplates` | `hooks/useCustomTemplates.ts` | Provides CRUD (save, remove, exportTemplates, importTemplates) against IndexedDB for user-created firewall templates |

---

## 12. Cross-References

- **XState machine** — `createTemplateApplyMachine` is the canonical Safety Pipeline implementation. See `Docs/architecture/novel-pattern-designs.md` for the general pattern. The machine file is also referenced in `xstate-machines.md`.
- **Headless + Platform Presenters** — `FilterRulesTable`, `MangleRulesTable`, `RawRulesTable`, `PortKnockSequenceManager`, and `ServicePortsTable` all follow the dispatcher + presenter pattern described in `Docs/design/PLATFORM_PRESENTER_GUIDE.md`.
- **TemplateGallery (Layer 2 pattern)** — `TemplatesPage` composes the `TemplateGallery` component from `@nasnet/ui/patterns/template-gallery`. The firewall feature only provides the data and handlers.
- **AddressListManager (Layer 2 pattern)** — `AddressListView` composes `AddressListManager` from `@nasnet/ui/patterns/address-list-manager`.
- **GraphQL queries** — All data-fetching hooks (`useAddressLists`, `useNATRules`, `usePortKnockSequences`, `useApplyTemplate`, `useRollbackTemplate`, etc.) live in `@nasnet/api-client/queries/firewall`.
- **Design tokens** — Semantic tokens are used throughout (`bg-error`, `bg-warning`, `bg-success`, `text-info`, `border-border`). See `Docs/design/DESIGN_TOKENS.md`.
