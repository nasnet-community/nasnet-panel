# Feature: Diagnostics (`libs/features/diagnostics`)

## Overview

The diagnostics feature module provides five complete network diagnostic tools for MikroTik router
administrators. Each tool has platform-specific presenters (Mobile/Desktop), Zod validation schemas,
headless hooks for business logic, and XState machines for complex multi-step workflows. The module
ships with a fix registry mapping known issues to automated RouterOS remediation commands.

**Epic reference:** NAS-5.9 (DNS Lookup Tool), NAS-5.x (Traceroute, Ping, Device Scan, Troubleshoot
Wizard)

**Public import path:** `@nasnet/features/diagnostics`

---

## Directory Tree

```
libs/features/diagnostics/src/
├── index.ts                          # Barrel export (public API)
├── components/
│   ├── DeviceScan/
│   │   ├── DeviceScanTool.tsx        # Headless coordinator (platform auto-detect)
│   │   ├── DeviceScanDesktop.tsx     # Desktop: full table with sort/filter
│   │   ├── DeviceScanMobile.tsx      # Mobile: card list with swipe actions
│   │   ├── DeviceDiscoveryTable.tsx  # Shared table component
│   │   ├── DeviceDetailPanel.tsx     # Slide-over detail panel
│   │   ├── ScanSummary.tsx           # Scan statistics and status header
│   │   ├── useDeviceScan.ts          # Headless hook (scan state, progress)
│   │   ├── types.ts                  # DeviceScan type definitions
│   │   └── index.ts                  # Sub-barrel export
│   ├── DnsLookupTool/
│   │   ├── DnsLookupTool.tsx         # Auto-detect platform wrapper
│   │   ├── DnsLookupToolDesktop.tsx  # Desktop: side-by-side form + results
│   │   ├── DnsLookupToolMobile.tsx   # Mobile: stacked form then results
│   │   ├── DnsResults.tsx            # DNS answer records display
│   │   ├── DnsError.tsx              # Error state with actionable messages
│   │   ├── DnsServerComparison.tsx   # Multi-server result comparison table
│   │   ├── dnsLookup.schema.ts       # Zod form validation schema
│   │   ├── dnsLookup.utils.ts        # Formatting utilities
│   │   ├── dnsLookup.graphql.ts      # GraphQL query document
│   │   ├── DnsLookupTool.types.ts    # Types and DNS_RECORD_TYPES constant
│   │   ├── useDnsLookup.ts           # Headless hook (query, history, comparison)
│   │   └── index.ts
│   ├── PingTool/
│   │   ├── PingTool.tsx              # Auto-detect platform wrapper
│   │   ├── PingToolDesktop.tsx       # Desktop: graph + stats side-by-side
│   │   ├── PingToolMobile.tsx        # Mobile: stacked graph then statistics
│   │   ├── LatencyGraph.tsx          # Recharts real-time latency line chart
│   │   ├── PingResults.tsx           # Per-packet result list
│   │   ├── PingStatistics.tsx        # Min/Max/Avg/StdDev/Loss summary panel
│   │   ├── ping.schema.ts            # Zod form validation schema
│   │   ├── ping.utils.ts             # Statistics calculation utilities
│   │   ├── ping.graphql.ts           # GraphQL subscription document
│   │   ├── PingTool.types.ts         # PingResult, PingStatistics interfaces
│   │   ├── usePing.ts                # Headless hook (wraps pingMachine actor)
│   │   └── index.ts
│   ├── TracerouteTool/
│   │   ├── TracerouteTool.tsx        # Auto-detect platform wrapper
│   │   ├── TracerouteToolDesktop.tsx # Desktop: full hop table + map panel
│   │   ├── TracerouteToolMobile.tsx  # Mobile: hop card list
│   │   ├── TracerouteHopsList.tsx    # Hop-by-hop visualization list
│   │   ├── traceroute.schema.ts      # Zod form validation schema
│   │   ├── TracerouteTool.types.ts   # TracerouteHop, TracerouteResult types
│   │   └── index.ts
│   └── TroubleshootWizard/
│       ├── TroubleshootWizard.tsx         # Auto-detect platform wrapper
│       ├── TroubleshootWizardDesktop.tsx  # Desktop: step list + detail panel
│       ├── TroubleshootWizardMobile.tsx   # Mobile: step-by-step cards
│       ├── TroubleshootWizardSkeleton.tsx # Loading skeleton
│       ├── DiagnosticStep.tsx             # Single step status card
│       ├── FixSuggestion.tsx              # Fix card with apply/skip actions
│       ├── WizardSummary.tsx              # Completion summary with applied fixes
│       ├── StepAnnouncer.tsx              # WCAG live-region accessibility
│       └── index.ts
├── machines/
│   ├── troubleshoot-machine.ts       # XState: 5-step diagnostic flow
│   └── ping-machine.ts               # XState: real-time ping lifecycle
├── hooks/
│   ├── useTraceroute.ts              # Traceroute GraphQL subscription hook
│   ├── useTroubleshootWizard.ts      # Wrapper hook over troubleshootMachine actor
│   └── index.ts
├── services/
│   ├── diagnostic-executor.ts        # Executes individual diagnostic steps via GraphQL
│   └── fix-applicator.ts             # Applies RouterOS fix commands
├── constants/
│   └── fix-registry.ts               # FIX_REGISTRY: issue codes → FixSuggestion
├── types/
│   └── troubleshoot.types.ts         # Shared type definitions
├── utils/
│   ├── network-detection.ts          # WAN interface and gateway detection
│   └── isp-detection.ts              # ISP name/contact detection from router
├── graphql/
│   └── traceroute.graphql.ts         # Traceroute mutation + subscription documents
└── i18n/
    └── troubleshoot-messages.ts      # TROUBLESHOOT_MESSAGES constants
```

---

## Public API

Exported from `libs/features/diagnostics/src/index.ts`:

```typescript
// Components (all five tools + sub-components)
export * from './components/TroubleshootWizard';
export * from './components/TracerouteTool';
export * from './components/DnsLookupTool';
export * from './components/PingTool';
export * from './components/DeviceScan';

// Hooks
export * from './hooks'; // useTraceroute, useTroubleshootWizard

// GraphQL documents
export {
  RUN_TRACEROUTE,
  CANCEL_TRACEROUTE,
  TRACEROUTE_PROGRESS_SUBSCRIPTION,
  HOP_PROBE_FRAGMENT,
  TRACEROUTE_HOP_FRAGMENT,
  TRACEROUTE_RESULT_FRAGMENT,
} from './graphql/traceroute.graphql';

// Types
export type {
  DiagnosticStep,
  DiagnosticResult,
  DiagnosticSummary,
  AppliedFix,
  FixSuggestion,
  ISPInfo,
  TroubleshootContext,
  TroubleshootEvent,
} from './types/troubleshoot.types';

// Constants and utilities
export { FIX_REGISTRY, getFix } from './constants/fix-registry';
export { detectWanInterface, detectGateway } from './utils/network-detection';
export { detectISP, getWanIpForISPDetection } from './utils/isp-detection';
export { TROUBLESHOOT_MESSAGES } from './i18n/troubleshoot-messages';
```

---

## Component Table

| Component                    | File                                                | Platform | Purpose                     |
| ---------------------------- | --------------------------------------------------- | -------- | --------------------------- |
| `DeviceScanTool`             | `DeviceScan/DeviceScanTool.tsx`                     | Both     | Auto-detect coordinator     |
| `DeviceScanDesktop`          | `DeviceScan/DeviceScanDesktop.tsx`                  | Desktop  | Full table with sort/filter |
| `DeviceScanMobile`           | `DeviceScan/DeviceScanMobile.tsx`                   | Mobile   | Card list with actions      |
| `DeviceDiscoveryTable`       | `DeviceScan/DeviceDiscoveryTable.tsx`               | Shared   | ARP table renderer          |
| `DeviceDetailPanel`          | `DeviceScan/DeviceDetailPanel.tsx`                  | Both     | Slide-over device details   |
| `ScanSummary`                | `DeviceScan/ScanSummary.tsx`                        | Both     | Scan stats header           |
| `DnsLookupTool`              | `DnsLookupTool/DnsLookupTool.tsx`                   | Both     | Auto-detect wrapper         |
| `DnsLookupToolDesktop`       | `DnsLookupTool/DnsLookupToolDesktop.tsx`            | Desktop  | Side-by-side layout         |
| `DnsLookupToolMobile`        | `DnsLookupTool/DnsLookupToolMobile.tsx`             | Mobile   | Stacked layout              |
| `DnsResults`                 | `DnsLookupTool/DnsResults.tsx`                      | Both     | DNS record display          |
| `DnsError`                   | `DnsLookupTool/DnsError.tsx`                        | Both     | Error with suggestions      |
| `DnsServerComparison`        | `DnsLookupTool/DnsServerComparison.tsx`             | Both     | Multi-server comparison     |
| `PingTool`                   | `PingTool/PingTool.tsx`                             | Both     | Auto-detect wrapper         |
| `PingToolDesktop`            | `PingTool/PingToolDesktop.tsx`                      | Desktop  | Graph + stats side-by-side  |
| `PingToolMobile`             | `PingTool/PingToolMobile.tsx`                       | Mobile   | Stacked layout              |
| `LatencyGraph`               | `PingTool/LatencyGraph.tsx`                         | Both     | Recharts real-time chart    |
| `PingResults`                | `PingTool/PingResults.tsx`                          | Both     | Per-packet list             |
| `PingStatistics`             | `PingTool/PingStatistics.tsx`                       | Both     | Aggregate stats panel       |
| `TracerouteTool`             | `TracerouteTool/TracerouteTool.tsx`                 | Both     | Auto-detect wrapper         |
| `TracerouteToolDesktop`      | `TracerouteTool/TracerouteToolDesktop.tsx`          | Desktop  | Table + RTT chart           |
| `TracerouteToolMobile`       | `TracerouteTool/TracerouteToolMobile.tsx`           | Mobile   | Card list                   |
| `TracerouteHopsList`         | `TracerouteTool/TracerouteHopsList.tsx`             | Both     | Hop-by-hop list             |
| `TroubleshootWizard`         | `TroubleshootWizard/TroubleshootWizard.tsx`         | Both     | Auto-detect wrapper         |
| `TroubleshootWizardDesktop`  | `TroubleshootWizard/TroubleshootWizardDesktop.tsx`  | Desktop  | Step list + detail panel    |
| `TroubleshootWizardMobile`   | `TroubleshootWizard/TroubleshootWizardMobile.tsx`   | Mobile   | Sequential step cards       |
| `TroubleshootWizardSkeleton` | `TroubleshootWizard/TroubleshootWizardSkeleton.tsx` | Both     | Loading placeholder         |
| `DiagnosticStep`             | `TroubleshootWizard/DiagnosticStep.tsx`             | Both     | Single step status card     |
| `FixSuggestion`              | `TroubleshootWizard/FixSuggestion.tsx`              | Both     | Fix card with actions       |
| `WizardSummary`              | `TroubleshootWizard/WizardSummary.tsx`              | Both     | Completion report           |
| `StepAnnouncer`              | `TroubleshootWizard/StepAnnouncer.tsx`              | Both     | WCAG aria-live region       |

---

## Device Scan Tool

**Files:** `components/DeviceScan/`

The Device Scan tool discovers all active hosts on the local network by querying the router's ARP
table and optionally running an active port scan. Results are displayed with hostname resolution,
MAC vendor lookup (via OUI database), and open port detection.

### Architecture

```typescript
// Headless hook drives both presenters
const { devices, isScanning, startScan, stopScan, progress } = useDeviceScan({
  routerId,
  scanRange: '192.168.1.0/24',
});
```

`useDeviceScan` manages the GraphQL query for ARP entries, optionally triggers port scan mutations,
and tracks scan progress. Both `DeviceScanDesktop` and `DeviceScanMobile` receive the same hook
return value.

### Desktop Presenter

`DeviceScanDesktop` renders a full `DeviceDiscoveryTable` with:

- Sortable columns: IP, hostname, MAC address, vendor, open ports, last seen
- Row click opens `DeviceDetailPanel` as a slide-over sheet
- Toolbar with scan controls and filter input

### Mobile Presenter

`DeviceScanMobile` renders devices as touch-friendly cards with:

- 44px minimum touch targets (WCAG AAA)
- Swipe-to-reveal actions
- Tap opens `DeviceDetailPanel` as a bottom drawer

### DeviceDetailPanel

Full device context in a slide-over panel:

- IP address, MAC address, hostname resolution
- Open port list with service name guesses
- ARP entry age and router interface
- Action buttons: ping this device, traceroute to device

### ScanSummary

Status header rendered at the top of both presenters:

```typescript
interface ScanSummaryProps {
  totalDevices: number;
  onlineDevices: number;
  scanDuration: number | null;
  isScanning: boolean;
  lastScanTime: Date | null;
}
```

### Storybook Stories

Stories defined in `DeviceScan.stories.tsx`, `DeviceDetailPanel.stories.tsx`, and
`ScanSummary.stories.tsx`. Run with:

```bash
npx nx run diagnostics:storybook
```

---

## DNS Lookup Tool

**Files:** `components/DnsLookupTool/`

The DNS Lookup Tool queries the router's DNS resolver for a given hostname and record type. It
supports multi-server comparison (querying multiple DNS servers simultaneously) and displays
structured record results.

### Zod Schema

Defined in `dnsLookup.schema.ts`:

```typescript
export const dnsLookupFormSchema = z.object({
  // RFC 1123 hostname OR IPv4/IPv6 address
  hostname: z
    .string()
    .min(1)
    .max(253)
    .refine(isValidHostname || isValidIPv4 || isValidIPv6),

  // A, AAAA, MX, TXT, CNAME, NS, SOA, PTR, SRV, CAA
  recordType: z.enum(DNS_RECORD_TYPES).default('A'),

  // IPv4 or IPv6 DNS server address, or "all" for comparison mode
  server: z
    .string()
    .optional()
    .refine((val) => !val || val === 'all' || isValidIPv4(val) || isValidIPv6(val)),

  // Query timeout: 100–30000ms (default 2000ms)
  timeout: z.coerce.number().int().min(100).max(30000).default(2000),
});

export type DnsLookupFormValues = z.infer<typeof dnsLookupFormSchema>;
```

Hostname validation enforces RFC 1123 rules:

- Max 253 total characters
- Each label (part between dots) max 63 characters
- Labels contain alphanumeric and hyphens only
- Labels cannot start or end with hyphen

### Platform Presenters

**Desktop (`DnsLookupToolDesktop`):** Two-column layout. Form on the left; results panel on the
right. When `server = "all"` is selected, `DnsServerComparison` replaces the standard `DnsResults`
view.

**Mobile (`DnsLookupToolMobile`):** Single-column stacked layout. Form at top, results below.
Collapsible advanced options panel for server and timeout fields.

### DnsResults Component

Renders DNS answer records in a structured table:

- Record type badge (color-coded per type: A=blue, MX=purple, TXT=gray, etc.)
- TTL display with human-readable format
- Raw value with copy-to-clipboard action
- DNSSEC validation indicator when available

### DnsError Component

Shown when the query fails with actionable guidance:

- NXDOMAIN: "Domain does not exist. Check spelling or try another record type."
- TIMEOUT: "DNS server did not respond. Try a different server or check connectivity."
- REFUSED: "DNS server refused the query. The server may not allow external queries."
- SERVFAIL: "DNS server internal error. Try an alternative DNS server."

### DnsServerComparison Component

When `server = "all"`, compares results from all router-configured DNS servers side by side:

```typescript
interface DnsServerComparisonProps {
  hostname: string;
  recordType: DnsRecordType;
  servers: string[]; // All configured DNS servers
  results: DnsComparisonResult[];
}
```

Renders a table with one column per server showing response time, resolved IPs, and whether
responses agree.

### useDnsLookup Hook

Headless hook wrapping the GraphQL query:

```typescript
const {
  query, // Function to run a lookup
  results, // Latest results array
  isLoading,
  error,
  history, // Recent queries (stored in sessionStorage)
  clearHistory,
  comparisonMode, // true when server === "all"
} = useDnsLookup();
```

---

## Ping Tool

**Files:** `components/PingTool/`

The Ping Tool sends ICMP echo requests through the router and streams results in real time via a
GraphQL subscription. Results are accumulated into a live latency graph and aggregate statistics
panel.

### Zod Schema

Defined in `ping.schema.ts`:

```typescript
export const pingFormSchema = z.object({
  target: z.string().min(1).refine(isValidTarget), // IPv4, IPv6, or hostname
  count: z.number().int().min(1).max(100).default(10),
  size: z.number().int().min(1).max(65507).default(56), // Packet size in bytes
  interval: z.number().min(0.1).max(10).default(1), // Seconds between pings
});
```

### Platform Presenters

**Desktop (`PingToolDesktop`):** Two-panel layout. `LatencyGraph` occupies the left panel at 300px
height with full controls. `PingStatistics` and `PingResults` are in a scrollable right panel.

**Mobile (`PingToolMobile`):** Single-column. Compact `LatencyGraph` at 200px height. Statistics
folded into a collapsible summary. `PingResults` hidden by default behind a "Show packets" toggle.

### LatencyGraph Component

Recharts `LineChart` showing RTT over packet index:

- Real-time updates as packets arrive (no page refresh)
- Color-coded by latency: green (`<50ms`), amber (50–200ms), red (`>200ms`)
- Timeout packets plotted as gaps in the line
- `role="img"` with accessible `aria-label` describing current min/avg/max
- `prefers-reduced-motion`: disables line animation

```typescript
interface LatencyGraphProps {
  results: PingResult[];
  height?: number; // Default: 200 (mobile), 300 (desktop)
  showGrid?: boolean;
  animationsEnabled?: boolean;
}
```

### PingStatistics Component

Aggregate statistics panel calculated from all results received so far:

```typescript
interface PingStatistics {
  sent: number;
  received: number;
  lost: number;
  lossPercent: number;
  minRtt: number | null; // null until first result
  avgRtt: number | null;
  maxRtt: number | null;
  stdDev: number | null;
}
```

Statistics are calculated in `ping.utils.ts` using the `calculateStatistics` function and updated
after each packet arrives via the XState machine's `updateStatistics` action.

### PingResults Component

Per-packet result list:

- Sequence number, TTL, RTT, and status (reply/timeout)
- Color indicator: green (reply received), red (timeout)
- Auto-scrolls to latest entry while running

### usePing Hook

Thin wrapper over `pingMachine` actor:

```typescript
const {
  state, // XState state: 'idle' | 'running' | 'stopped' | 'complete' | 'error'
  send, // Send events to the machine
  results, // context.results
  statistics, // context.statistics
  error, // context.error
  start, // Convenience: sends START event
  stop, // Convenience: sends STOP event
} = usePing({ routerId });
```

---

## Traceroute Tool

**Files:** `components/TracerouteTool/`

The Traceroute Tool probes each hop along the route to a target host, displaying RTT for multiple
probes per hop. Results stream in progressively as hops are discovered via a GraphQL subscription.

### Zod Schema

Defined in `traceroute.schema.ts`:

```typescript
export const tracerouteFormSchema = z.object({
  // IPv4, IPv6, or hostname (validated by regex)
  target: z.string().min(1).max(255).refine(isValidTarget),

  // 1–64 hops, default 30
  maxHops: z.number().int().min(1).max(64).optional().default(30),

  // 100–30000ms per hop, default 3000
  timeout: z.number().int().min(100).max(30000).optional().default(3000),

  // 1–5 probes per hop, default 3
  probeCount: z.number().int().min(1).max(5).optional().default(3),

  // ICMP | UDP | TCP
  protocol: TracerouteProtocolEnum.optional().default('ICMP'),
});

export type TracerouteFormValues = z.infer<typeof tracerouteFormSchema>;
```

The `TracerouteProtocolEnum` is `z.enum(['ICMP', 'UDP', 'TCP'])`.

### Platform Presenters

**Desktop (`TracerouteToolDesktop`):** Two-panel layout. Hop list on the left streams in as probes
complete. A mini RTT bar chart on the right shows comparative hop latencies. Asterisks (`*`)
displayed for unresponsive hops (ICMP filtered).

**Mobile (`TracerouteToolMobile`):** Single-column card list. Each hop is a compact card showing hop
number, IP address, hostname, and RTT. Streaming updates append new cards.

### TracerouteHopsList Component

Core visualization component used by both presenters:

```typescript
interface TracerouteHopsListProps {
  hops: TracerouteHop[];
  isRunning: boolean;
  targetReached: boolean;
}

interface TracerouteHop {
  hopNumber: number;
  probes: HopProbe[]; // Up to 5 probe results per hop
  hostname: string | null;
  ipAddress: string | null;
  isPrivate: boolean; // RFC-1918 address indicator
  ispName: string | null;
}

interface HopProbe {
  rtt: number | null; // null = timeout (*)
  ipAddress: string | null;
}
```

### useTraceroute Hook

Defined in `hooks/useTraceroute.ts`. Manages the GraphQL mutation to start the traceroute and
subscribes to the progress subscription:

```typescript
const {
  hops,
  isRunning,
  targetReached,
  error,
  start, // (values: TracerouteFormValues) => void
  cancel, // () => void
} = useTraceroute({ routerId });
```

GraphQL documents are in `graphql/traceroute.graphql.ts`:

- `RUN_TRACEROUTE` mutation: starts the job, returns job ID
- `CANCEL_TRACEROUTE` mutation
- `TRACEROUTE_PROGRESS_SUBSCRIPTION`: streams `TracerouteHop` as each hop completes

---

## Troubleshoot Wizard

**Files:** `components/TroubleshootWizard/`, `machines/troubleshoot-machine.ts`

The Troubleshoot Wizard is the most complex diagnostic tool. It runs five sequential diagnostic
steps, detects failures, offers automated fixes from the Fix Registry, verifies that fixes worked,
and produces a final summary. State is managed by the XState `troubleshootMachine`.

### Diagnostic Steps

The wizard runs these five steps in order:

| Step ID    | Name          | What it checks                                         |
| ---------- | ------------- | ------------------------------------------------------ |
| `wan`      | WAN Interface | Physical link state and interface enabled status       |
| `gateway`  | Gateway       | ICMP ping to default gateway                           |
| `internet` | Internet      | ICMP ping to `8.8.8.8` (or configurable external host) |
| `dns`      | DNS           | DNS resolution test for a known hostname               |
| `nat`      | NAT           | Presence and enabled status of masquerade rule         |

### XState Machine

**File:** `machines/troubleshoot-machine.ts`

Created via `createTroubleshootMachine(routerId: string)` factory function. The machine is
router-instance-specific so multiple wizard instances can run concurrently.

**State hierarchy:**

```
idle
  ↓ START
initializing  (detects WAN interface and gateway via router API)
  ↓ (success or fallback to defaults)
runningDiagnostic  [compound state]
  ├── executingStep       → invokes diagnosticExecutor service
  │     ↓ onDone
  ├── stepComplete        → always-transition to branch:
  │     ├── → awaitingFixDecision  (if step failed AND fix available)
  │     ├── → nextStep             (if more steps remain)
  │     └── → #troubleshootWizard.completed (if last step)
  │
  ├── awaitingFixDecision → APPLY_FIX → applyingFix
  │                       → SKIP_FIX  → nextStep
  │
  ├── applyingFix         → invokes fixApplicator service
  │     ↓ onDone
  └── verifyingFix        → invokes diagnosticExecutor again
        ├── onDone (success=true)  → nextStep
        └── onDone (success=false) → awaitingFixDecision (with "Fix applied, but issue persists" message)

completed  (entry: records endTime, sets overallStatus='completed')
  ↓ RESTART → idle
```

**Global event:**

```typescript
on: {
  CANCEL: { target: '.idle', actions: assign({ overallStatus: 'idle' }) }
}
```

**Context:**

```typescript
interface TroubleshootContext {
  routerId: string;
  wanInterface: string; // Detected or fallback 'ether1'
  gateway: string | null;
  steps: DiagnosticStep[];
  currentStepIndex: number;
  overallStatus: 'idle' | 'running' | 'completed' | 'fixPending';
  appliedFixes: string[]; // Issue codes of successfully applied fixes
  startTime: Date | null;
  endTime: Date | null;
  error: Error | null;
}
```

**Events:**

```typescript
type TroubleshootEvent =
  | { type: 'START' }
  | { type: 'STEP_COMPLETE'; result: DiagnosticResult }
  | { type: 'APPLY_FIX'; fixId: string }
  | { type: 'FIX_APPLIED'; success: boolean }
  | { type: 'SKIP_FIX' }
  | { type: 'RESTART' }
  | { type: 'CANCEL' };
```

For full XState machine integration details, see [xstate-machines.md](./xstate-machines.md).

### Fix Registry

**File:** `constants/fix-registry.ts`

The `FIX_REGISTRY` maps issue codes to `FixSuggestion` objects. The `getFix(stepId, result)`
function looks up the fix by `result.issueCode`.

**Registered fixes:**

| Issue Code            | Fix Title                      | Type      | Confidence |
| --------------------- | ------------------------------ | --------- | ---------- |
| `WAN_LINK_DOWN`       | Check Physical Connection      | Manual    | —          |
| `WAN_DISABLED`        | Enable WAN Interface           | Automated | High       |
| `GATEWAY_UNREACHABLE` | Renew Internet Connection      | Automated | High       |
| `GATEWAY_TIMEOUT`     | Restart Network Connection     | Automated | Medium     |
| `NO_INTERNET`         | Contact Your Internet Provider | Manual    | —          |
| `INTERNET_TIMEOUT`    | Check for Network Congestion   | Manual    | —          |
| `DNS_FAILED`          | Switch to Cloudflare DNS       | Automated | High       |
| `DNS_TIMEOUT`         | Add Backup DNS Server          | Automated | Medium     |
| `NAT_MISSING`         | Add NAT Rule                   | Automated | High       |
| `NAT_DISABLED`        | Enable NAT Rule                | Automated | High       |

**Automated fix example:**

```typescript
WAN_DISABLED: {
  issueCode: 'WAN_DISABLED',
  title: 'Enable WAN Interface',
  description: 'Your WAN interface is disabled...',
  command: '/interface/enable [find where default-name~"ether1" or comment~"WAN"]',
  confidence: 'high',
  requiresConfirmation: true,
  rollbackCommand: '/interface/disable [find where default-name~"ether1" or comment~"WAN"]',
  isManualFix: false,
}
```

**Manual fix example:**

```typescript
WAN_LINK_DOWN: {
  issueCode: 'WAN_LINK_DOWN',
  title: 'Check Physical Connection',
  description: 'The cable to your internet provider appears disconnected.',
  command: null,
  confidence: null,
  requiresConfirmation: false,
  isManualFix: true,
  manualSteps: [
    'Check that the ethernet cable is securely plugged into the WAN port',
    'Try a different ethernet cable if available',
    'Check if the modem/ONT has power and link lights',
    'Restart your modem/ONT by unplugging for 30 seconds',
  ],
}
```

DNS fixes also support dynamic rollback capture via `storeDnsConfigForRollback()`, which reads the
current DNS configuration before applying changes.

### Wizard Components

**DiagnosticStep:** Renders a single step card with status icon (clock/spinner/check/X), step name,
description, and optionally the result message. Uses semantic color tokens: `stroke-success`
(passed), `stroke-error` (failed), `stroke-warning` (running).

**FixSuggestion:** Shown when `awaitingFixDecision` state is active. Displays:

- Fix title and description
- Confidence badge: High / Medium / Low
- RouterOS command preview (if `isManualFix = false`)
- Manual steps list (if `isManualFix = true`)
- "Apply Fix" button (triggers `APPLY_FIX` event)
- "Skip" button (triggers `SKIP_FIX` event)

**WizardSummary:** Shown in `completed` state. Displays:

- Pass/fail/skip counts
- List of fixes applied during this session
- `finalStatus`: `all_passed` | `issues_resolved` | `issues_remaining` | `contact_isp`
- "Run Again" button (triggers `RESTART` event)
- Session duration

**StepAnnouncer:** Hidden `aria-live="polite"` region that announces state transitions to screen
readers. When a step transitions to `running`, announces "Running [step name] diagnostic". When `passed`,
announces "Passed: [result message]". When `failed`, announces "Failed: [result message]. Fix available."

### Platform Presenters

**Desktop (`TroubleshootWizardDesktop`):** Two-panel layout.

- Left panel: vertical step list with all five `DiagnosticStep` components visible simultaneously.
  Completed steps remain visible above the active step.
- Right panel: active `FixSuggestion` or `WizardSummary` occupies the full right panel.

**Mobile (`TroubleshootWizardMobile`):** Single-column card-by-card flow.

- Only the current active step and its fix (if any) are visible.
- Previous completed steps shown as a compact progress indicator at the top.
- Bottom sheet for `FixSuggestion` with 44px touch targets on all action buttons.

### useTroubleshootWizard Hook

Defined in `hooks/useTroubleshootWizard.ts`. Creates and manages the XState actor:

```typescript
const {
  state, // XState state value
  context, // TroubleshootContext
  steps, // context.steps shorthand
  currentStep, // steps[context.currentStepIndex]
  isRunning, // state matches 'runningDiagnostic'
  isCompleted, // state matches 'completed'
  summary, // DiagnosticSummary (when completed)
  start, // () => void
  applyFix, // () => void
  skipFix, // () => void
  cancel, // () => void
  restart, // () => void
} = useTroubleshootWizard({ routerId });
```

---

## Ping Machine (`machines/ping-machine.ts`)

**File:** `machines/ping-machine.ts`

The ping machine manages the lifecycle of a single ping test session. Created using
`setup({...}).createMachine({...})` (XState v5 typed setup pattern).

**States:**

| State      | Description                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `idle`     | Ready to start. Waiting for `START` event.                                                                                                |
| `running`  | Test in progress. Accumulates results and statistics on `RESULT_RECEIVED`. Auto-transitions to `complete` when `isComplete` guard passes. |
| `stopped`  | User manually stopped. Results and statistics preserved.                                                                                  |
| `complete` | All expected packets sent. Final statistics available.                                                                                    |
| `error`    | Test failed. `context.error` contains error message.                                                                                      |

**Context:**

```typescript
interface PingContext {
  target: string; // Host or IP being pinged
  count: number; // Total packets expected
  jobId: string | null; // Backend job ID for cancellation
  results: PingResult[]; // Accumulated per-packet results
  statistics: PingStatistics; // Running aggregate stats
  error: string | null;
}
```

**Key design:** The `isComplete` guard checks `context.results.length + 1 >= context.count` BEFORE
the `addResult` action runs. This is evaluated on the `RESULT_RECEIVED` event to automatically
transition to `complete` when the final packet arrives:

```typescript
RESULT_RECEIVED: [
  {
    guard: 'isComplete',           // Evaluates before actions
    target: 'complete',
    actions: ['addResult', 'updateStatistics'],
  },
  {
    actions: ['addResult', 'updateStatistics'],  // Stay in running
  },
],
```

Statistics recalculation (`updateStatistics`) uses `calculateStatistics(context.results)` from
`ping.utils.ts` after each `addResult`. Results and statistics are preserved when transitioning to
`stopped` (user can view final stats after manually stopping).

For XState v5 setup pattern details, see [xstate-machines.md](./xstate-machines.md).

---

## Services

### diagnostic-executor (`services/diagnostic-executor.ts`)

Executes individual diagnostic steps by invoking appropriate GraphQL mutations or router queries.
Invoked by the `troubleshootMachine` as the `executeDiagnosticStep` actor service.

Each step maps to a specific diagnostic operation:

- `wan`: Query interface list, check if WAN interface is enabled and has link
- `gateway`: Run ping to `context.gateway` via router API
- `internet`: Run ping to `8.8.8.8` via router API
- `dns`: Run DNS lookup for known hostname (e.g., `google.com`)
- `nat`: Query firewall NAT rules for masquerade entry

Returns `DiagnosticResult` with `success`, `message`, optional `issueCode`, and `executionTimeMs`.

### fix-applicator (`services/fix-applicator.ts`)

Executes RouterOS commands for automated fixes. Invoked by the `troubleshootMachine` as the
`applyFix` actor service. For DNS fixes, calls `storeDnsConfigForRollback()` before applying to
enable rollback.

---

## Utilities

### network-detection (`utils/network-detection.ts`)

- `detectWanInterface(routerId)`: Queries router interfaces to find the WAN interface by convention
  (first Ethernet with a public IP, or interface named `ether1` or tagged with comment containing
  "WAN")
- `detectGateway(routerId)`: Reads the default route (`0.0.0.0/0`) gateway IP

Used by `troubleshootMachine`'s `initializing` state to populate `wanInterface` and `gateway` before
running diagnostics.

### isp-detection (`utils/isp-detection.ts`)

- `getWanIpForISPDetection(routerId)`: Reads the public IP from the WAN interface
- `detectISP(publicIp)`: Performs a reverse RDAP lookup to identify the ISP name and support contact
  information

Returns `ISPInfo` with `name`, `supportPhone`, `supportUrl`, and `detected` flag.

---

## Testing

All tools have unit tests for hooks, schemas, and utilities. XState machines have dedicated machine
test files.

```bash
# Run all diagnostics tests
npx nx test diagnostics

# Specific test files
npx nx test diagnostics --testPathPattern=troubleshoot-machine
npx nx test diagnostics --testPathPattern=ping-machine
npx nx test diagnostics --testPathPattern=dnsLookup.schema
npx nx test diagnostics --testPathPattern=traceroute.schema
```

Test files follow the co-location pattern:

- `troubleshoot-machine.test.ts` - XState state transition tests
- `ping-machine.test.ts` - XState state and guard tests
- `useDeviceScan.test.tsx` - Hook rendering tests
- `useDnsLookup.test.tsx` - Hook with mocked GraphQL
- `usePing.test.ts` - Hook with mocked actor
- `useTraceroute.test.tsx` - Hook with mocked subscription
- `PingStatistics.test.tsx` - Component rendering tests
- `dnsLookup.schema.test.ts` - Zod validation boundary tests
- `traceroute.schema.test.ts` - Zod validation boundary tests
- `fix-registry.test.ts` - Registry lookup tests
- `isp-detection.test.ts` - ISP detection logic tests
- `network-detection.test.ts` - WAN detection logic tests

---

## Storybook

Stories are available for all major components:

```bash
npx nx run diagnostics:storybook
```

Available story files:

- `DeviceScan.stories.tsx` — DeviceScanTool in all states
- `DeviceDetailPanel.stories.tsx` — Detail panel variants
- `ScanSummary.stories.tsx` — Scan status header states
- `DnsLookupTool.stories.tsx` — DNS tool states (loading, results, error)
- `DnsError.stories.tsx` — All error variants
- `DnsResults.stories.tsx` — All record type displays
- `DnsServerComparison.stories.tsx` — Multi-server comparison
- `PingTool.stories.tsx` — Ping tool states
- `LatencyGraph.stories.tsx` — Graph with varied data
- `PingResults.stories.tsx` — Packet list states
- `PingStatistics.stories.tsx` — Statistics panel states
- `TracerouteTool.stories.tsx` — Traceroute states
- `TracerouteHopsList.stories.tsx` — Hop list with timeouts
- `TroubleshootWizard.stories.tsx` — Full wizard flow
- `DiagnosticStep.stories.tsx` — All step status variants
- `FixSuggestion.stories.tsx` — Automated and manual fix variants
- `WizardSummary.stories.tsx` — Summary completion states
- `StepAnnouncer.stories.tsx` — Accessibility region testing

---

## Cross-References

- **XState Machines:** [xstate-machines.md](./xstate-machines.md) — `troubleshootMachine` and
  `pingMachine` full documentation
- **Platform Presenters:** `Docs/design/PLATFORM_PRESENTER_GUIDE.md` — Headless + Presenter
  implementation pattern
- **GraphQL Schema:** `schema/diagnostics/` — Ping, traceroute, DNS, and device scan schema files
- **API Client Hooks:** `libs/api-client/queries/src/diagnostics/` — Generated GraphQL hooks
- **Dashboard Integration:** [feature-dashboard.md](./feature-dashboard.md) — Dashboard widget
  integration
