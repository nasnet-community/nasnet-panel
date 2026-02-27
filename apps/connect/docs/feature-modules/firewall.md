# Firewall Feature

The firewall feature (`libs/features/firewall/`) provides comprehensive MikroTik firewall management
across nine sub-pages, with platform-adaptive tables, rule filtering, address list management, and a
template system backed by an XState safety pipeline.

## Route Structure

All routes are nested under `/router/$id/firewall/`. Each route lazy-loads its page component
wrapped in `LazyBoundary` with a skeleton fallback for optimal bundle size.

| Route path                   | Component                  | Source                                                          |
| ---------------------------- | -------------------------- | --------------------------------------------------------------- |
| `/router/$id/firewall`       | `LazyFirewallTab`          | `apps/connect/src/routes/router/$id/firewall.tsx`               |
| `.../firewall/address-lists` | `AddressListView`          | `apps/connect/src/routes/router/$id/firewall/address-lists.tsx` |
| `.../firewall/mangle`        | `ManglePage`               | `apps/connect/src/routes/router/$id/firewall/mangle.tsx`        |
| `.../firewall/raw`           | `RawPage`                  | `apps/connect/src/routes/router/$id/firewall/raw.tsx`           |
| `.../firewall/port-knocking` | `PortKnockingPage`         | `apps/connect/src/routes/router/$id/firewall/port-knocking.tsx` |
| `.../firewall/rate-limiting` | `RateLimitingPage`         | `apps/connect/src/routes/router/$id/firewall/rate-limiting.tsx` |
| `.../firewall/service-ports` | `ServicePortsPage`         | `apps/connect/src/routes/router/$id/firewall/service-ports.tsx` |
| `.../firewall/templates`     | `TemplatesPage`            | `apps/connect/src/routes/router/$id/firewall/templates.tsx`     |
| `.../firewall/connections`   | `ConnectionsPage` (inline) | `apps/connect/src/routes/router/$id/firewall/connections.tsx`   |
| `.../firewall/logs`          | `FirewallLogsPage`         | `apps/connect/src/routes/router/$id/firewall/logs.tsx`          |

## Sub-Page Overview

### Filter Rules (main `FirewallTab`)

The primary firewall view. Rendered via `LazyFirewallTab` → `FirewallTab`.

Components used:

- `FilterRulesTable` — platform wrapper that renders `FilterRulesTableDesktop` (dense virtualized
  table with drag-drop reordering) or `FilterRulesTableMobile` (card list with touch-friendly
  controls).
- `ChainSummaryCards` — summary chips for input / output / forward chains.
- `FirewallStatusHero` — top-of-page status banner.
- `FirewallQuickStats` — counts of enabled / disabled / matched rules.
- `RuleSearchFilters` — search + chain + action + protocol + status dropdowns.
- `ReadOnlyNotice` — shown when the connected router returns read-only mode.

### NAT Rules

`NATRulesPage` — manages source-NAT, destination-NAT, masquerade, and port-forward rules.

Components used:

- `NATRulesTable` — platform-adaptive table of NAT rules.
- `PortForwardWizardDialog` — multi-step wizard for adding port-forward rules (protocol, external
  port, internal IP, internal port).
- `MasqueradeQuickDialog` — one-click masquerade enable for a given interface.
- `TrafficFlowDiagram` — SVG diagram visualising the NAT traffic path.

### Mangle Rules

`ManglePage` — packet-marking rules for QoS and routing policy.

Components used:

- `MangleRulesTable` — platform wrapper.
- `MangleRulesTableMobile` — card layout for mobile.

### Raw Rules

`RawPage` — raw/prerouting rules that run before connection tracking.

Components used:

- `RawRulesTable` — platform-adaptive raw rules table.

### Address Lists

`AddressListView` — manages named IP address lists used as `src-address-list` / `dst-address-list`
targets in firewall rules.

Components used:

- `AddressListEntryForm` — add/edit a single entry (IP, subnet, or range).
- `AddressListImportDialog` — bulk-import from a text file or clipboard.
- `AddressListExportDialog` — export list to CSV / plain text.
- `AddToAddressListContextMenu` — right-click context menu on rule table rows to directly add the
  rule's source/destination to a list.
- `IPAddressDisplay` — formatted display of IP / CIDR / range values.

Parsers live in `utils/addressListParsers.ts`; formatters in `utils/addressListFormatters.ts`.

### Port Knocking

`PortKnockingPage` — configures port-knock sequences that temporarily open ports on a successful
knock sequence.

Components used:

- `PortKnockSequenceManager` — platform wrapper.
- `PortKnockSequenceManagerDesktop` — reorderable sequence editor.
- `PortKnockSequenceManagerMobile` — swipe-action mobile card list.
- `PortKnockLogViewer` — real-time log of knock attempts.

### Rate Limiting

`RateLimitingPage` — per-connection and per-address bandwidth limits.

### Service Ports

`ServicePortsPage` — enable/disable and reconfigure MikroTik service ports (SSH, Telnet, HTTP,
HTTPS, Winbox, API, API-SSL, FTP).

Components used:

- `ServicePortsTable` — platform-adaptive table.
- `AddServiceDialog` — add a custom service port entry.
- `ServiceGroupDialog` — group multiple ports under a label.
- `ServicesStatus` — summary card showing how many services are exposed.

### Templates

`TemplatesPage` — browse, configure, and apply pre-built firewall rule templates.

Components used:

- `ImportTemplateDialog` — import a custom template from JSON / URL.
- `SaveTemplateDialog` — export the current ruleset as a reusable template.
- `TemplateApplyFlow` — full XState-driven apply wizard (see below).

### Firewall Logs

`FirewallLogsPage` — paginated, searchable firewall log viewer.

Components used:

- `RecentFirewallActivity` — last-N log entries widget.
- `RoutingTable` — routing decision log view.

## Rule Filtering

`useRuleFilters` (`libs/features/firewall/src/hooks/useRuleFilters.ts`) manages multi-dimensional
filter state via `useReducer`:

```ts
interface FirewallFilters {
  search: string; // matches comment, srcAddress, dstAddress, srcPort, dstPort
  chain: FirewallChain | 'all';
  action: FirewallAction | 'all';
  protocol: FirewallProtocol | 'all';
  status: 'enabled' | 'disabled' | 'all';
}
```

All setter functions are stable `useCallback` references. `activeFilterCount` and `hasActiveFilters`
are memoised. `filterRules(rules)` is also memoised and accepts the full rule array, returning the
filtered subset.

## Platform-Adaptive Tables

Every rules table follows the headless + presenter pattern:

```tsx
// FilterRulesTable.tsx — platform detection
const isMobile = useMediaQuery('(max-width: 640px)');
return isMobile ?
    <FilterRulesTableMobile chain={chain} />
  : <FilterRulesTableDesktop chain={chain} />;
```

Desktop presenters add:

- Dense data table with virtual scrolling for large rule sets.
- Drag-to-reorder via `@dnd-kit` (desktop only).
- Keyboard shortcut support (e, d for enable/disable, Del for delete).

Mobile presenters use:

- Card-based layout, one card per rule.
- Swipe-left for delete / swipe-right for enable toggle.
- 44 px minimum touch targets on all interactive elements.

See `../ui-system/patterns-catalog.md` for the platform presenter implementation guide.

## Template System

### XState Machine

`createTemplateApplyMachine` (`libs/features/firewall/src/machines/template-apply.machine.ts`)
implements the Safety Pipeline architectural pattern using XState v5:

```
idle → configuring → previewing → reviewing → [confirming] → applying → success
                                                                          ↓
                                                                    rollingBack → rolledBack
```

State descriptions:

| State         | Description                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `idle`        | Waiting for template selection                                                                             |
| `configuring` | User fills template variables                                                                              |
| `previewing`  | API resolves variables, detects conflicts                                                                  |
| `reviewing`   | User reviews resolved rules and conflicts                                                                  |
| `confirming`  | High-risk acknowledgement dialog (triggered when >10 rules or >3 chains affected, or any conflict/warning) |
| `applying`    | API applies template to router                                                                             |
| `success`     | 10-second undo window with rollback button                                                                 |
| `rollingBack` | Executing rollback via `rollbackId`                                                                        |
| `rolledBack`  | Rollback complete                                                                                          |
| `error`       | Error with retry / rollback options                                                                        |

High-risk thresholds:

- `MAX_LOW_RISK_RULES = 10` — more than 10 new rules triggers confirmation.
- `MAX_LOW_RISK_CHAINS = 3` — affecting more than 3 chains triggers confirmation.
- Any conflict or warning in the preview also triggers confirmation.

The machine is instantiated with injectable async handlers, making it fully testable without mocking
the module.

### Template Schemas

`libs/features/firewall/src/schemas/templateSchemas.ts` defines:

- `FirewallTemplate` — rule set with variable placeholder syntax.
- `TemplatePreviewResult` — resolved rules, conflicts, impact analysis.
- `FirewallTemplateResult` — apply outcome with `rollbackId`.

`utils/template-validator.ts` validates template JSON at import time. `utils/template-export.ts`
serialises a rule set to the template format.

## Custom Services and Templates

`useCustomServices` (`hooks/useCustomServices.ts`) stores user-defined service group definitions in
`localStorage`.

`useCustomTemplates` (`hooks/useCustomTemplates.ts`) stores user-defined templates locally so they
can be reused without re-importing.

`useCounterSettingsStore` (`hooks/useCounterSettingsStore.ts`) persists the user's preference for
how rule hit counters are displayed (absolute, per-second, per-minute).

`counterHistoryStorage` (`services/counterHistoryStorage.ts`) maintains a rolling window of counter
values to derive per-second rates.

## Chain Summary

`useChainSummary` (`hooks/useChainSummary.ts`) computes per-chain statistics (enabled, disabled,
accepting, dropping, logging) from the full rule list. Used by `ChainSummaryCards`.

## Related

- `../data-fetching/graphql-hooks.md` — firewall GraphQL hooks.
- `../ui-system/patterns-catalog.md` — shared UI patterns used in tables.
