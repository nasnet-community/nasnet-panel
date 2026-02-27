# Diagnostics Feature Module

**Source:** `libs/features/diagnostics/src/`

The diagnostics feature provides a set of network troubleshooting tools: DNS lookup, Ping,
Traceroute, Route lookup, Device scan, and a guided Troubleshooting Wizard. Every tool follows the
Headless + Platform Presenters pattern — a platform-agnostic hook contains the business logic while
separate Mobile and Desktop presenter components handle rendering.

## Public API

**File:** `libs/features/diagnostics/src/index.ts`

```typescript
// Components
export { DnsLookupTool, PingTool, TracerouteTool, TroubleshootWizard, DeviceScanTool } from '...';

// Hooks
export { useTraceroute, useTroubleshootWizard } from '...';

// Types
export type { DiagnosticStep, DiagnosticResult, FixSuggestion, ISPInfo, TroubleshootContext } from '...';

// Utilities
export { detectWanInterface, detectGateway, detectISP, getWanIpForISPDetection } from '...';

// GraphQL operations
export { RUN_TRACEROUTE, TRACEROUTE_PROGRESS_SUBSCRIPTION, ... } from '...';
```

## DNS Lookup Tool

**Entry point:** `libs/features/diagnostics/src/components/DnsLookupTool/DnsLookupTool.tsx`

**Route:** `apps/connect/src/routes/dashboard.dns-lookup.tsx` → `/dashboard/dns-lookup`

### How It Works

1. User opens `/dashboard/dns-lookup` — the route reads `activeRouterId` from `useConnectionStore`;
   if no router is selected, shows an error state with a "Return to Dashboard" button.
2. `DnsLookupTool` renders the platform-appropriate presenter via `usePlatform()`:
   - Mobile presenter: stacked single-column layout
   - Desktop presenter: side-by-side layout with comparison panel
3. The `useDnsLookup` hook manages query state, request submission, and result parsing.

### Query Options

Supported DNS record types: `A`, `AAAA`, `MX`, `TXT`, `CNAME`, `NS`, `PTR`, `SOA`, `SRV`

Multiple DNS servers can be queried simultaneously for comparison. Results show query time per
server.

### Validation Schema

**File:** `libs/features/diagnostics/src/components/DnsLookupTool/dnsLookup.schema.ts`

Zod schema validates:

- `hostname` — non-empty domain name string
- `recordType` — one of the supported record types
- `servers` — optional array of DNS server IP addresses

### Components

| Component              | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `DnsLookupTool`        | Platform router (Mobile/Desktop)            |
| `DnsLookupToolDesktop` | Side-by-side input + results layout         |
| `DnsLookupToolMobile`  | Stacked layout with expandable results      |
| `DnsResults`           | Tabular display of DNS records              |
| `DnsServerComparison`  | Side-by-side comparison of multiple servers |
| `DnsError`             | Error state display                         |

### GraphQL Operation

**File:** `libs/features/diagnostics/src/components/DnsLookupTool/dnsLookup.graphql.ts`

Executes a DNS lookup query against the router's DNS infrastructure. The `deviceId` identifies which
router to use as the DNS resolver.

---

## Ping Tool

**Entry point:** `libs/features/diagnostics/src/components/PingTool/PingTool.tsx`

### How It Works

1. User enters a target hostname or IP address.
2. The `usePing` hook manages an XState machine (`ping-machine.ts`) that sequences ping packets.
3. Results stream in real time with virtualization support for 100+ results.
4. On completion, statistics (min/avg/max latency, packet loss) are calculated.

### Platform Behavior

| Platform            | Layout                | Notes                                        |
| ------------------- | --------------------- | -------------------------------------------- |
| Mobile (`<640px`)   | Stacked single column | Bottom sheet for results, 44px touch targets |
| Desktop (`>=640px`) | Side-by-side          | Dense data display with latency graph        |

### Latency Color Coding

```
< 100ms  → green (success)
< 200ms  → amber (warning)
>= 200ms → red (error)
```

### Configuration Options

From `libs/features/diagnostics/src/components/PingTool/ping.schema.ts`:

- `target` — hostname or IP
- `count` — number of packets (default: 4)
- `size` — packet size in bytes
- `timeout` — per-packet timeout

### XState Machine

**File:** `libs/features/diagnostics/src/machines/ping-machine.ts`

States: `idle` → `running` → `completed` | `error`

Supports cancellation from the `running` state via a `CANCEL` event.

### Components

| Component         | Purpose                              |
| ----------------- | ------------------------------------ |
| `PingTool`        | Platform router                      |
| `PingToolDesktop` | Dense side-by-side layout            |
| `PingToolMobile`  | Touch-first stacked layout           |
| `PingResults`     | Live result list with virtualization |
| `PingStatistics`  | Min/avg/max/loss summary             |
| `LatencyGraph`    | Bar/line chart of per-packet latency |

### GraphQL Operation

**File:** `libs/features/diagnostics/src/components/PingTool/ping.graphql.ts`

Mutation to initiate ping and subscription to stream results incrementally.

---

## Traceroute Tool

**Entry point:** `libs/features/diagnostics/src/components/TracerouteTool/TracerouteTool.tsx`

### How It Works

1. User submits a target host.
2. `useTraceroute` hook sends `RUN_TRACEROUTE` mutation and subscribes to
   `TRACEROUTE_PROGRESS_SUBSCRIPTION`.
3. Hops are discovered progressively and rendered as they arrive.
4. On completion (or max TTL reached), the route shows total hops and round-trip summary.

### Subscription Flow

```
User submits target
      ↓
RUN_TRACEROUTE mutation (returns traceId)
      ↓
Subscribe to TRACEROUTE_PROGRESS_SUBSCRIPTION(traceId)
      ↓
Hops arrive incrementally → rendered in TracerouteHopsList
      ↓
Subscription completes → final summary displayed
```

### Latency Color Coding

```
< 50ms   → green
50-150ms → yellow
> 150ms  → red
```

### Components

| Component               | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `TracerouteTool`        | Platform router (Mobile/Desktop)         |
| `TracerouteToolDesktop` | Real-time hop visualization side-by-side |
| `TracerouteToolMobile`  | Progressive stacked hop list             |
| `TracerouteHopsList`    | Renders each TTL hop row with latency    |

### Types

**File:** `libs/features/diagnostics/src/components/TracerouteTool/TracerouteTool.types.ts`

```typescript
interface TracerouteToolProps {
  routerId: string;
  onComplete?: (result: TracerouteResult) => void;
  onError?: (err: Error) => void;
  onHopDiscovered?: (hop: TracerouteHop) => void;
}
```

### GraphQL

**File:** `libs/features/diagnostics/src/graphql/traceroute.graphql.ts`

Exported: `RUN_TRACEROUTE`, `CANCEL_TRACEROUTE`, `TRACEROUTE_PROGRESS_SUBSCRIPTION`,
`HOP_PROBE_FRAGMENT`, `TRACEROUTE_HOP_FRAGMENT`, `TRACEROUTE_RESULT_FRAGMENT`

---

## Troubleshooting Wizard

**Entry point:**
`libs/features/diagnostics/src/components/TroubleshootWizard/TroubleshootWizard.tsx`

The wizard automates a five-step connectivity diagnostic sequence and offers targeted fix
suggestions for each failing step.

### Five Diagnostic Steps

| Step ID    | Name          | What it checks                               |
| ---------- | ------------- | -------------------------------------------- |
| `wan`      | WAN Interface | Physical connection on WAN port              |
| `gateway`  | Gateway       | ICMP ping to default gateway                 |
| `internet` | Internet      | ICMP ping to external server (e.g., 8.8.8.8) |
| `dns`      | DNS           | Name resolution test                         |
| `nat`      | NAT           | Masquerade rule presence                     |

### XState Machine

**File:** `libs/features/diagnostics/src/machines/troubleshoot-machine.ts`

Created via `createTroubleshootMachine(routerId)`. Each wizard instance gets its own isolated
machine.

**State flow:**

```
idle
  → initializing         (detect WAN interface + gateway)
  → runningDiagnostic
      ├── executingStep  (runs diagnostic via backend mutation)
      ├── stepComplete   (evaluates pass/fail)
      ├── awaitingFixDecision  (if failed and fix available)
      ├── applyingFix    (sends fix mutation)
      ├── verifyingFix   (re-runs the same step)
      └── nextStep       (advances currentStepIndex)
  → completed
```

**Events:**

| Event       | Valid from            | Effect                       |
| ----------- | --------------------- | ---------------------------- |
| `START`     | `idle`                | Begin initialization         |
| `APPLY_FIX` | `awaitingFixDecision` | Execute the suggested fix    |
| `SKIP_FIX`  | `awaitingFixDecision` | Advance to next step         |
| `RESTART`   | `completed`           | Reset all steps to `pending` |
| `CANCEL`    | any                   | Return to `idle`             |

### Fix Registry

**File:** `libs/features/diagnostics/src/constants/fix-registry.ts`

Maps step IDs to `FixSuggestion` objects. `getFix(stepId, result)` returns the appropriate fix for a
failed step, or `undefined` if no fix is known. Each fix includes an `issueCode` tracked in
`context.appliedFixes`.

### Component Props

```typescript
interface TroubleshootWizardProps {
  routerId: string; // Router UUID to diagnose
  autoStart?: boolean; // Start on mount (default: false)
  onClose?: () => void; // Called when wizard is dismissed
  ispInfo?: ISPInfo; // ISP contact info for suggestions
  className?: string;
}
```

### Platform Presenters

`TroubleshootWizard` renders CSS-hidden presenters for both platforms simultaneously (using
`hidden lg:block` / `lg:hidden`), avoiding a runtime check on every render:

```tsx
<div className="hidden lg:block">
  <TroubleshootWizardDesktop {...} />
</div>
<div className="lg:hidden">
  <TroubleshootWizardMobile {...} />
</div>
```

### Sub-Components

| Component        | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| `DiagnosticStep` | Renders a single step row (pending/running/passed/failed) |
| `FixSuggestion`  | Shows actionable fix card with apply/skip buttons         |
| `WizardSummary`  | Final results card after all steps complete               |
| `StepAnnouncer`  | ARIA live region for screen-reader step announcements     |

---

## Route Lookup Tool

**Entry point:** `libs/features/diagnostics/src/components/RouteLookupTool/`

Status: Schema and test utilities are present but the component itself is not yet exported
(commented out in `index.ts`). Validates a destination IP or network against the router's routing
table.

---

## Device Scan Tool

**Entry point:** `libs/features/diagnostics/src/components/DeviceScan/DeviceScanTool.tsx`

Discovers devices on the local network via ARP scan. Features:

- `DeviceDiscoveryTable` — tabular display of discovered hosts with MAC vendor lookup
- `DeviceDetailPanel` — side panel with device details
- `ScanSummary` — scan completion stats
- `DeviceScanDesktop` / `DeviceScanMobile` — platform presenters
- `useDeviceScan` hook — manages scan lifecycle, progress, and result state

---

## Utility Functions

### Network Detection

**File:** `libs/features/diagnostics/src/utils/network-detection.ts`

```typescript
detectWanInterface(routerId: string): Promise<string>
// Identifies the WAN interface name from the router's routing table

detectGateway(routerId: string, wanInterface: string): Promise<string | null>
// Finds the default gateway IP for a given WAN interface
```

Used by `troubleshoot-machine.ts` during the `initializing` state.

### ISP Detection

**File:** `libs/features/diagnostics/src/utils/isp-detection.ts`

```typescript
detectISP(ipAddress: string): Promise<ISPInfo | null>
getWanIpForISPDetection(routerId: string): Promise<string | null>
```

Used to populate `ispInfo` in the `TroubleshootWizard` with contact details.

---

## Internationalization

**File:** `libs/features/diagnostics/src/i18n/troubleshoot-messages.ts`

Exports `TROUBLESHOOT_MESSAGES` — a typed map of step IDs and fix codes to user-readable strings.
Used by the wizard presenters to display step descriptions, fix suggestions, and ISP contact
prompts.

---

## See Also

- `../data-fetching/graphql-hooks.md` — GraphQL operations for each tool
- `../ui-system/platform-presenters.md` — Headless + Platform Presenters pattern (ADR-018)
- `../cross-cutting-features/service-marketplace.md` — Service-level diagnostics in
  `DiagnosticsPanel`
