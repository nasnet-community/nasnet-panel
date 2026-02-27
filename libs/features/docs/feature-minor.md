# Feature: Wireless, Router Discovery, and Configuration Import

This document covers three focused feature modules: the **Wireless** library
(`libs/features/wireless`), the **Router Discovery** library (`libs/features/router-discovery`), and
the **Configuration Import** library (`libs/features/configuration-import`). All three are consumed
primarily by `apps/connect/src/` and follow the same Layer 3 domain component architecture as the
other feature libraries.

---

## Part 1: Wireless Feature (`libs/features/wireless`)

### Overview

The wireless feature library provides components for managing MikroTik wireless interfaces: listing
interfaces, viewing and editing per-interface settings (SSID, security, channel, power), toggling
interfaces on and off, and displaying connected client information. Additional display components
(`WifiStatusHero`, `WifiSecuritySummary`, `WifiQuickActions`) live in
`apps/connect/src/app/pages/wifi/components/` as page-level components that compose the wireless
library.

**Library path:** `libs/features/wireless/src/`

### Directory Structure

```
libs/features/wireless/src/
├── index.ts                          # Public API barrel export
├── components/
│   ├── WirelessInterfaceCard.tsx     # Single interface card
│   ├── WirelessInterfaceList.tsx     # Grid of interface cards
│   ├── WirelessInterfaceDetail.tsx   # Detail view (stories + types)
│   ├── WirelessSettingsForm.tsx      # Full settings edit form
│   ├── WirelessSettingsModal.tsx     # Modal wrapper for settings form
│   ├── SecurityProfileSection.tsx    # Security mode + password section
│   ├── SecurityLevelBadge.tsx        # WPA2/WPA3/Open badge
│   ├── PasswordField.tsx             # Show/hide password input
│   └── InterfaceToggle.tsx           # Enable/disable switch
├── validation/
│   └── wirelessSettings.schema.ts    # Zod schema for settings form
└── data/
    └── wirelessOptions.ts            # Channel, width, country, TX power options
```

### Component Table

| Component                 | File                                     | Purpose                                  |
| ------------------------- | ---------------------------------------- | ---------------------------------------- |
| `WirelessInterfaceCard`   | `components/WirelessInterfaceCard.tsx`   | Status card for a single interface       |
| `WirelessInterfaceList`   | `components/WirelessInterfaceList.tsx`   | Grid/list of all wireless interfaces     |
| `WirelessInterfaceDetail` | `components/WirelessInterfaceDetail.tsx` | Expanded detail view of one interface    |
| `WirelessSettingsForm`    | `components/WirelessSettingsForm.tsx`    | Full edit form (SSID, channel, security) |
| `WirelessSettingsModal`   | `components/WirelessSettingsModal.tsx`   | Dialog wrapper for the settings form     |
| `SecurityProfileSection`  | `components/SecurityProfileSection.tsx`  | Security mode selector + password        |
| `SecurityLevelBadge`      | `components/SecurityLevelBadge.tsx`      | WPA2 / WPA3 / Open / WEP badge           |
| `PasswordField`           | `components/PasswordField.tsx`           | Input with show/hide toggle              |
| `InterfaceToggle`         | `components/InterfaceToggle.tsx`         | Enable/disable switch with mutation      |

**App-level components** (in `apps/connect/src/app/pages/wifi/components/`):

| Component               | File                        | Purpose                                               |
| ----------------------- | --------------------------- | ----------------------------------------------------- |
| `WifiStatusHero`        | `WifiStatusHero.tsx`        | Stats grid: clients, active interfaces, signal, bands |
| `WifiInterfaceList`     | `WifiInterfaceList.tsx`     | Composed list of `WirelessInterfaceCard` items        |
| `ConnectedClientsTable` | `ConnectedClientsTable.tsx` | Table of clients sorted by signal strength            |
| `WifiSecuritySummary`   | `WifiSecuritySummary.tsx`   | Per-interface security mode summary                   |
| `WifiQuickActions`      | `WifiQuickActions.tsx`      | Quick access buttons (scan clients, add network)      |
| `LoadingSkeleton`       | `LoadingSkeleton.tsx`       | Shimmer skeleton for initial WiFi page load           |
| `WifiDetailPage`        | `detail/WifiDetailPage.tsx` | Full per-interface detail page                        |

### Key Components

#### `WirelessInterfaceCard`

File: `libs/features/wireless/src/components/WirelessInterfaceCard.tsx`

A clickable card implementing keyboard accessibility via `role="button"`, `tabIndex={0}`, and
`onKeyDown` handling for Enter and Space. Displays:

- Interface name (Satoshi font, large) and SSID (monospace, smaller)
- Frequency band badge with semantic color coding: `bg-info/10 text-info` for 2.4 GHz,
  `bg-secondary/10 text-secondary` for 5 GHz, `bg-primary/10 text-primary` for 6 GHz
- Connected client count with a `Signal` icon
- Channel and mode (hidden on mobile via `hidden md:flex`)
- Inline `InterfaceToggle` (click propagation stopped to avoid triggering the card's click handler)

```tsx
<Card
  role="button"
  tabIndex={0}
  aria-label={`Wireless interface ${iface.name}${iface.ssid ? `, SSID ${iface.ssid}` : ''}`}
  onClick={handleClick}
  onKeyDown={handleKeyDown}
>
```

#### `WirelessSettingsForm`

File: `libs/features/wireless/src/components/WirelessSettingsForm.tsx`

Comprehensive form for editing a wireless interface. Uses React Hook Form with `zodResolver` against
`wirelessSettingsSchema`. Fields are organized into four sections:

1. **Basic Settings** — SSID (string, 1-32 chars), hidden SSID toggle
2. **Radio Settings** — Channel (dynamic options per band via `getChannelsByBand`), channel width
   (`getChannelWidthsByBand`), TX power (from `TX_POWER_OPTIONS`), country code (from
   `COUNTRY_OPTIONS` — 200+ countries)
3. **Security** — Delegated to `SecurityProfileSection`
4. **Security Profile** (`SecurityProfileSection`) — Security mode dropdown (Open / WPA2 / WPA3 /
   WPA2+WPA3), passphrase via `PasswordField`

The form's Zod schema (`wirelessSettings.schema.ts`) validates:

- SSID length (1-32 characters) and character restrictions
- Passphrase length (8-63 for WPA2/WPA3, empty for Open)
- Channel value must be valid for the selected band
- Country code must be a valid ISO 3166-1 alpha-2 code

#### `InterfaceToggle`

A `Switch` primitive that fires a GraphQL mutation to enable or disable the wireless interface. Uses
optimistic UI: the switch flips immediately, with a toast on failure that reverts the state.

#### `SecurityLevelBadge`

Maps a security mode string to a colored badge:

| Security Mode | Badge Color | Token               |
| ------------- | ----------- | ------------------- |
| WPA3          | Green       | `variant="success"` |
| WPA2+WPA3     | Blue        | `variant="info"`    |
| WPA2          | Yellow      | `variant="warning"` |
| WPA           | Orange      | `variant="warning"` |
| Open / none   | Red         | `variant="error"`   |

#### `WifiStatusHero`

File: `apps/connect/src/app/pages/wifi/components/WifiStatusHero.tsx`

A 2×2 (mobile) / 4-column (desktop) stats grid rendering four metric cards:

1. **Connected Clients** — Total count from `WirelessClient[]`
2. **Active Interfaces** — Active count vs. total with a progress bar (`aria-role="progressbar"`)
3. **Signal Quality** — Average signal across all clients in dBm with color-coded quality label
   (Excellent / Good / Fair / Weak) based on dBm thresholds: `>= -50` excellent, `>= -60` good,
   `>= -70` fair
4. **Frequency Bands** — Badge pills for each band present (2.4G / 5G / 6G)

```tsx
function getSignalQuality(signalDbm: number): { label: string; color: string; bgColor: string } {
  if (signalDbm >= -50) return { label: 'Excellent', color: 'text-success', bgColor: 'bg-success' };
  if (signalDbm >= -60) return { label: 'Good', color: 'text-success', bgColor: 'bg-success' };
  if (signalDbm >= -70) return { label: 'Fair', color: 'text-warning', bgColor: 'bg-warning' };
  return { label: 'Weak', color: 'text-error', bgColor: 'bg-error' };
}
```

The hero applies `category-hero-wifi` to its root, which uses the Cyan category accent from the
design token system.

#### `ConnectedClientsTable`

File: `apps/connect/src/app/pages/wifi/components/ConnectedClientsTable.tsx`

Renders clients sorted by signal strength (strongest first) using `useMemo`. Each row shows:

- MAC address (monospace)
- Hostname (if available)
- Signal strength with a `SignalBars` sub-component (4-bar SVG indicator colored via semantic
  tokens)
- Connection time (formatted duration)
- TX/RX bytes (formatted by `formatBytes` from `@nasnet/core/utils`)

The `SignalBars` component maps dBm to 1-4 bars: above -50 = 4 green, above -60 = 3 green, above -70
= 2 yellow, below = 1 red.

#### `WifiPage`

File: `apps/connect/src/app/pages/wifi/WifiPage.tsx`

The page-level orchestrator. Fetches data with React Query hooks (`useWirelessInterfaces`,
`useWirelessClients` from `@nasnet/api-client/queries`) and composes the section components:

```tsx
<WifiStatusHero interfaces={interfaces} clients={clients} isLoading={isLoadingInterfaces} />
<WifiInterfaceList interfaces={interfaces} routerIp={routerIp} isLoading={isLoadingInterfaces} />
<ConnectedClientsTable clients={clients} isLoading={isLoadingClients} />
<WifiSecuritySummary interfaces={interfaces} />
<WifiQuickActions routerIp={routerIp} routerId={routerId} />
```

A global refresh button triggers a `queryClient.invalidateQueries()` for both wireless query keys.

#### `WifiDetailPage`

File: `apps/connect/src/app/pages/wifi/detail/WifiDetailPage.tsx`

Per-interface detail view showing all configuration fields, a client list filtered to that
interface, and a signal history chart. Contains a "Configure" button that opens
`WirelessSettingsModal`.

### Static Data (`wirelessOptions.ts`)

The `data/wirelessOptions.ts` file provides:

- `CHANNELS_2_4GHZ` — Valid 2.4 GHz channels (1, 2, 3, ..., 14) plus `auto`
- `CHANNELS_5GHZ` — Valid 5 GHz channels (36, 40, 44, 48, ..., 165) plus `auto`
- `CHANNELS_6GHZ` — Valid 6 GHz channels plus `auto`
- `CHANNEL_WIDTH_OPTIONS` — Per-band width options (20MHz, 40MHz, 80MHz, etc.)
- `SECURITY_MODE_OPTIONS` — Label/value pairs for the security dropdown
- `COUNTRY_OPTIONS` — 200+ ISO 3166-1 country codes with display names
- `TX_POWER_OPTIONS` — dBm values from 0 to 30 in steps of 1
- Helper functions: `getChannelsByBand(band)`, `getChannelWidthsByBand(band)`,
  `getCountryName(code)`

### Validation Schema

File: `libs/features/wireless/src/validation/wirelessSettings.schema.ts`

Exports `wirelessSettingsSchema` (full edit form), `wirelessSettingsPartialSchema` (partial update),
and `defaultWirelessSettings` (safe defaults for new form instances). The schema is re-exported via
`index.ts` for use in any consumer.

---

## Part 2: Router Discovery Feature (`libs/features/router-discovery`)

### Overview

The router discovery library handles the initial onboarding flow for adding a MikroTik router to
NasNetConnect. It provides automated subnet scanning to find routers, a manual entry form for known
IPs, credential validation, and a credential storage service. The library is composed into the
router management app layer at `apps/connect/src/app/pages/router-discovery.tsx`.

**Library path:** `libs/features/router-discovery/src/`

### Directory Structure

```
libs/features/router-discovery/src/
├── index.ts                          # Public API barrel export
├── components/
│   ├── NetworkScanner.tsx            # Subnet scan UI with progress
│   ├── ManualRouterEntry.tsx         # Manual IP + port entry form
│   ├── CredentialDialog.tsx          # Username/password dialog
│   ├── RouterCard.tsx                # Discovered router display card
│   └── RouterList.tsx                # List of discovered routers
└── services/
    ├── scanService.ts                # Scan logic + ScanError class
    └── credentialService.ts          # Credential storage + validation
```

### Component Table

| Component           | File                               | Purpose                                  |
| ------------------- | ---------------------------------- | ---------------------------------------- |
| `NetworkScanner`    | `components/NetworkScanner.tsx`    | Subnet scan input, progress, and results |
| `ManualRouterEntry` | `components/ManualRouterEntry.tsx` | Manual IP address and port entry form    |
| `CredentialDialog`  | `components/CredentialDialog.tsx`  | Authentication credential input dialog   |
| `RouterCard`        | `components/RouterCard.tsx`        | Single discovered router info card       |
| `RouterList`        | `components/RouterList.tsx`        | Wrapper composing multiple `RouterCard`s |

### Service Table

| Service             | File                            | Exports                                                                                                                                                                                          |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scanService`       | `services/scanService.ts`       | `startNetworkScan`, `scanResultToRouter`, `validateSubnet`, `getDefaultSubnet`, `ScanError`                                                                                                      |
| `credentialService` | `services/credentialService.ts` | `validateCredentials`, `saveCredentials`, `loadCredentials`, `removeCredentials`, `clearAllCredentials`, `hasCredentials`, `getRoutersWithCredentials`, `DEFAULT_CREDENTIALS`, `CredentialError` |

### Discovery Flow

The router discovery flow is a three-stage process:

```
[Subnet Input] → [Scan Progress] → [Router Results] → [CredentialDialog] → [Connect]
       ↑ (or)
[ManualRouterEntry] → [CredentialDialog] → [Connect]
```

1. **Scan stage**: User inputs a CIDR subnet (defaulting to the detected local subnet via
   `getDefaultSubnet()`). `NetworkScanner` calls `startNetworkScan(subnet, progressCallback)` from
   `scanService.ts`. The backend scans each IP in the subnet for RouterOS API port 8728.

2. **Progress stage**: A real-time progress panel shows `scannedHosts / totalHosts`, current IP
   being checked, and routers found so far. Framer Motion provides animated entry/exit of the
   progress panel.

3. **Results stage**: Discovered routers appear as clickable `RouterCard` items. Each card shows IP,
   model, RouterOS version, MAC address, and response time.

4. **Credential stage**: Selecting a router opens `CredentialDialog` for username/password entry. On
   submit, `validateCredentials(ip, credentials)` from `credentialService.ts` tests authentication
   via the backend proxy.

### `NetworkScanner`

File: `libs/features/router-discovery/src/components/NetworkScanner.tsx`

The core discovery UI component. Internal state manages scan lifecycle:

```tsx
const [subnet, setSubnet] = useState(defaultSubnet || getDefaultSubnet());
const [isScanning, setIsScanning] = useState(false);
const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
const [scanResults, setScanResults] = useState<ScanResult[]>([]);
const [error, setError] = useState<string | null>(null);
```

On scan start, `validateSubnet(subnet)` checks CIDR format before calling the async scan. Progress
is delivered via callback:

```tsx
const results = await startNetworkScan(subnet, (progress) => {
  setScanProgress(progress);
});
```

Error handling uses the typed `ScanError` class with a switch on `error.code` for user-friendly
messages:

| Error Code          | User Message                 |
| ------------------- | ---------------------------- |
| `SCAN_START_FAILED` | Failed to start network scan |
| `NETWORK_ERROR`     | Network error occurred       |
| `TIMEOUT`           | Scan timed out               |
| `SCAN_FAILED`       | Scan failed on the backend   |

Result items render as `motion.button` elements from Framer Motion with
`whileHover={{ scale: 1.02 }}` micro-interactions. Each enforces the 44px touch target minimum.

### `ManualRouterEntry`

A simple form for users who know their router's IP address. Fields: IP address (IPv4 validation),
port (default 8728 for API, 22 for SSH), optional label. On submit, directly opens
`CredentialDialog` with the provided address.

### `CredentialDialog`

A modal dialog with username and password fields (password uses `type="password"` with no show/hide
toggle for security). The "Connect" button triggers `validateCredentials()` and shows a loading
spinner. On success, calls the parent's `onRouterSelect` with the validated `ScanResult`. On
failure, displays an inline error message.

Tests: `CredentialDialog.test.tsx` covers credential submission, error display, and dialog close
behavior.

### `RouterCard`

Displays a single discovered router with structured data:

- IP address in large monospace font
- Model string (e.g., "RB4011iGS+5HacQ2HnD") when available
- RouterOS version
- MAC address (monospace)
- Online status badge (success green) and response time in milliseconds

### `credentialService`

File: `libs/features/router-discovery/src/services/credentialService.ts`

Manages credential persistence in `localStorage` under the key `nasnet.router.credentials`. The
storage format:

```ts
interface StoredCredentials {
  [routerId: string]: {
    username: string;
    password: string; // Plain text — encryption planned for Epic 1.4
    savedAt: string; // ISO date string
  };
}
```

`validateCredentials(ipAddress, credentials)` makes an HTTP call to the backend proxy to test
authentication by fetching `/api/system/identity`. Returns `CredentialValidationResult` with
`isValid`, `error`, and optional `routerInfo` (identity, model, version).

Default credentials (`DEFAULT_CREDENTIALS`) are `{ username: 'admin', password: '' }` — matching
MikroTik factory defaults.

The `CredentialError` class is a typed error subclass for distinguishing credential failures from
network errors.

---

## Part 3: Configuration Import Feature (`libs/features/configuration-import`)

### Overview

The configuration import library provides a 3-step wizard dialog for applying RouterOS configuration
scripts to a router. It supports three connection protocols (API, SSH, Telnet), shows real-time
execution progress via a batch job polling mechanism, and supports cancellation and retry. It also
provides the `useConfigurationCheck` hook for the onboarding flow that automatically prompts the
user to import configuration when a newly-added router has no system note.

**Library path:** `libs/features/configuration-import/src/`

### Directory Structure

```
libs/features/configuration-import/src/
├── index.ts                          # Public API barrel export
├── components/
│   ├── index.ts                      # Component barrel
│   ├── ConfigurationImportWizard.tsx # 3-step wizard dialog orchestrator
│   ├── ConfigurationInput.tsx        # Paste / file-upload input step
│   ├── ProtocolSelector.tsx          # API / SSH / Telnet selection step
│   └── ExecutionProgress.tsx         # Real-time batch job progress step
└── hooks/
    ├── index.ts
    └── useConfigurationCheck.ts      # Onboarding: detect unconfigured routers
```

### Component Table

| Component                   | File                                       | Purpose                                   |
| --------------------------- | ------------------------------------------ | ----------------------------------------- |
| `ConfigurationImportWizard` | `components/ConfigurationImportWizard.tsx` | Dialog orchestrator for all 3 steps       |
| `ConfigurationInput`        | `components/ConfigurationInput.tsx`        | Paste or upload RouterOS script           |
| `ProtocolSelector`          | `components/ProtocolSelector.tsx`          | Select connection method (API/SSH/Telnet) |
| `ExecutionProgress`         | `components/ExecutionProgress.tsx`         | Live batch job progress and status        |

### Hook Table

| Hook                    | File                             | Purpose                                 |
| ----------------------- | -------------------------------- | --------------------------------------- |
| `useConfigurationCheck` | `hooks/useConfigurationCheck.ts` | Detect and surface unconfigured routers |

### Import Flow

The wizard implements a linear 3-step flow with back-navigation:

```
Step 1: Configuration  →  Step 2: Method  →  Step 3: Apply
   [ConfigurationInput]   [ProtocolSelector]  [ExecutionProgress]
         ↑ Back ──────────────────────────────────────────────────
```

Wizard state is managed with four local state variables:

```ts
type WizardStep = 'input' | 'protocol' | 'execute' | 'complete';

const [step, setStep] = useState<WizardStep>('input');
const [configuration, setConfiguration] = useState('');
const [selectedProtocol, setSelectedProtocol] = useState<ExecutionProtocol | null>(null);
const [jobId, setJobId] = useState<string | null>(null);
```

Step transitions are animated with Framer Motion `AnimatePresence` and `motion.div` with
`initial={{ opacity: 0, x: 20 }}` / `exit={{ opacity: 0, x: -20 }}` for left-to-right flow.

A `StepIndicator` sub-component renders numbered circles connected by lines: completed steps show a
green `CheckCircle`, the current step is highlighted with `bg-primary`, and future steps are muted.

### `ConfigurationImportWizard`

File: `libs/features/configuration-import/src/components/ConfigurationImportWizard.tsx`

The dialog orchestrator. Uses these API hooks from `@nasnet/api-client/queries`:

- `useEnabledProtocols(routerIp)` — returns `{ api, ssh, telnet, isLoading }` booleans
- `useCreateBatchJob()` — mutation to create a batch job with rollback enabled
- `useBatchJob(jobId)` — polls for job status updates
- `useCancelBatchJob()` — mutation to cancel a running job

When moving from Step 1 to Step 2, the first available protocol is automatically pre-selected:

```ts
if (api) setSelectedProtocol('api');
else if (ssh) setSelectedProtocol('ssh');
else if (telnet) setSelectedProtocol('telnet');
```

On Step 2 → Step 3, the wizard creates a batch job with rollback enabled:

```ts
const result = await createJob.mutateAsync({
  routerIp,
  username: credentials.username,
  password: credentials.password,
  protocol: selectedProtocol,
  script: configuration,
  rollbackEnabled: true,
});
setJobId(result.jobId);
```

Closing is blocked while a job is actively running
(`step === 'execute' && job?.status === 'running'`). On any other state, closing resets all wizard
state so the dialog is clean for the next open.

Props interface:

```ts
export interface ConfigurationImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  routerIp: string;
  credentials: { username: string; password: string };
  onSuccess?: () => void;
  onSkip?: () => void;
  className?: string;
}
```

### `ConfigurationInput`

Step 1 component providing two input methods:

- **Paste** — Textarea accepting RouterOS export script text
- **Upload** — File input accepting `.rsc` files (RouterOS script extension)

The `canProceed` gate in the wizard checks `configuration.trim().length > 0` before enabling the
Continue button.

### `ProtocolSelector`

File: `libs/features/configuration-import/src/components/ProtocolSelector.tsx`

Renders three protocol options as interactive card buttons with icons:

| Protocol     | Icon         | Recommended   |
| ------------ | ------------ | ------------- |
| RouterOS API | `Plug`       | Yes (fastest) |
| SSH          | `Terminal`   | No            |
| Telnet       | `MonitorDot` | No            |

Each card uses `motion.button` with `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}`.
Cards for unavailable protocols are grayed out (`opacity-50 cursor-not-allowed`). A real-time
availability dot (green/muted) under each card reflects the `isLoading` state (shows "Checking...")
transitioning to "Available" or "Disabled".

The selected card gets `border-primary bg-primary/5 shadow-primary-glow` styling and a checkmark
overlay badge.

When no protocols are available and loading is complete, an `AlertCircle` warning is shown:

```tsx
{
  hasNoEnabledProtocols && (
    <div
      className="bg-warning/10 border-warning/30 p-component-md rounded-lg border"
      role="alert"
    >
      <p>No connection methods available</p>
      <p>Please enable API, SSH, or Telnet service on your router.</p>
    </div>
  );
}
```

The `recommended` badge (shown only on API when enabled) uses
`bg-secondary text-secondary-foreground` — Trust Blue — aligning with the design system's use of
blue for reliability indicators.

### `ExecutionProgress`

File: `libs/features/configuration-import/src/components/ExecutionProgress.tsx`

Displays real-time execution state of a `BatchJob`. Maps `BatchJobStatus` to visual configurations:

| Status        | Icon                 | Color   |
| ------------- | -------------------- | ------- |
| `pending`     | `Circle` (gray)      | Muted   |
| `running`     | `Loader2` (spinning) | Primary |
| `completed`   | `CheckCircle`        | Success |
| `failed`      | `XCircle`            | Error   |
| `rolled_back` | `RotateCcw`          | Warning |
| `cancelled`   | `XCircle`            | Muted   |

Per-command progress is shown as a list where each command line toggles between
pending/running/success/failure states with Framer Motion animated transitions. A Cancel button
(when the job is running) calls the `onCancel` prop. A Retry button (when the job has failed) calls
`onRetry`, which resets `jobId` and returns to Step 2.

### `useConfigurationCheck`

File: `libs/features/configuration-import/src/hooks/useConfigurationCheck.ts`

Enables an onboarding flow that automatically detects unconfigured routers and surfaces the import
wizard. The detection logic uses `useSystemNote(routerIp)` from `@nasnet/api-client/queries`: if the
system note is empty, the router is considered unconfigured.

To avoid showing the wizard repeatedly, visited routers are tracked in the Zustand `useRouterStore`:

```tsx
const alreadyChecked = isConfigurationChecked(routerId);
// Only runs the auto-trigger once per routerId per session
```

Returned interface:

```ts
interface UseConfigurationCheckResult {
  isLoading: boolean;
  needsConfiguration: boolean; // true if system note is empty
  showWizard: boolean; // controls wizard open state
  openWizard: () => void; // manual trigger
  closeWizard: () => void; // closes + marks as checked
  markAsChecked: () => void; // marks without showing wizard
  error: Error | null;
}
```

Usage in a router panel:

```tsx
function RouterPanel({ routerId, routerIp }) {
  const { showWizard, closeWizard } = useConfigurationCheck(routerId, routerIp);
  return (
    <>
      <ConfigurationImportWizard
        isOpen={showWizard}
        onClose={closeWizard}
        routerIp={routerIp}
        credentials={savedCredentials}
        onSuccess={refetchRouterData}
      />
      {/* rest of panel */}
    </>
  );
}
```

---

## Cross-References

- **Platform presenter pattern**: `Docs/design/PLATFORM_PRESENTER_GUIDE.md` — the wireless library
  components are primarily single-platform (no explicit Desktop/Mobile split) since they are
  consumed inside pages that handle the layout split
- **Design tokens**: `Docs/design/DESIGN_TOKENS.md` — `category-hero-wifi` (Cyan),
  `text-success/warning/error` for signal quality coloring
- **Network feature**: `libs/features/docs/feature-network.md` — the Interface management sub-module
  for wired interfaces
- **GraphQL schema**: Wireless types in `schema/core/`, batch job types in `schema/services/`
- **API hooks**: Wireless hooks in `libs/api-client/queries/src/wireless.ts`, batch job hooks in
  `libs/api-client/queries/src/batch.ts`
- **Zustand stores**: `useRouterStore` from `libs/state/stores` for `isConfigurationChecked` /
  `markConfigurationChecked`
- **Router panel integration**: `apps/connect/src/app/routes/router-panel/RouterPanel.tsx` consumes
  `useConfigurationCheck` and renders `ConfigurationImportWizard`
