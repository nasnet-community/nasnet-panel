# Wireless Feature Module

The wireless feature spans two locations:

- **`apps/connect/src/app/pages/wifi/`** — The WiFi dashboard page and its sub-components
- **`libs/features/wireless/src/`** — Reusable wireless components, forms, validation, and settings
  modal

## Component Hierarchy

```
WifiPage                             (apps/connect/.../wifi/WifiPage.tsx)
├── WifiQuickActions                 (components/WifiQuickActions.tsx)
├── WifiStatusHero                   (components/WifiStatusHero.tsx)
├── WifiInterfaceList                (components/WifiInterfaceList.tsx)
│   └── WirelessInterfaceCard        (libs/features/wireless/...)
├── ConnectedClientsTable            (components/ConnectedClientsTable.tsx)
└── WifiSecuritySummary              (components/WifiSecuritySummary.tsx)

WifiDetailPage                       (apps/connect/.../wifi/detail/WifiDetailPage.tsx)
└── WirelessInterfaceDetail          (libs/features/wireless/components/WirelessInterfaceDetail.tsx)
    ├── InterfaceToggle              (libs/features/wireless/components/InterfaceToggle.tsx)
    ├── SecurityProfileSection       (libs/features/wireless/components/SecurityProfileSection.tsx)
    └── WirelessSettingsModal        (libs/features/wireless/components/WirelessSettingsModal.tsx)
        └── WirelessSettingsForm     (libs/features/wireless/components/WirelessSettingsForm.tsx)
```

## WiFi Dashboard Page

**File:** `apps/connect/src/app/pages/wifi/WifiPage.tsx`

`WifiPage` is the top-level WiFi management dashboard. It fetches wireless data using two queries
from `@nasnet/api-client/queries`:

- `useWirelessInterfaces(routerIp)` — List of wireless interfaces with status
- `useWirelessClients(routerIp)` — List of currently connected clients

Router identity comes from `useConnectionStore` (Zustand). The page handles three states: loading
skeleton, error with retry, and the full dashboard layout.

```tsx
const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';
const { data: interfaces, isLoading: isLoadingInterfaces } = useWirelessInterfaces(routerIp);
const { data: clients, isLoading: isLoadingClients } = useWirelessClients(routerIp);
```

Cache invalidation is triggered via `queryClient.invalidateQueries({ queryKey: ['wireless'] })` when
the refresh button is pressed.

**Layout sections (top to bottom):**

1. Page header with title and `WifiQuickActions`
2. `WifiStatusHero` — stats grid
3. `WifiInterfaceList` — all interfaces with controls
4. `ConnectedClientsTable` — client list sorted by signal
5. `WifiSecuritySummary` — security profile per interface

## WifiStatusHero

**File:** `apps/connect/src/app/pages/wifi/components/WifiStatusHero.tsx`

A 2×2 (mobile) / 4-column (tablet+) stats grid displaying four metrics:

| Card              | Icon   | Metric                           | Color              |
| ----------------- | ------ | -------------------------------- | ------------------ |
| Clients           | Users  | Total connected clients          | info               |
| Active Interfaces | Wifi   | Active / Total with progress bar | success            |
| Signal Quality    | Signal | Average client signal in dBm     | dynamic            |
| Frequency Bands   | Radio  | Badges for 2.4G / 5G / 6G        | info/warning/error |

**Signal quality thresholds** (used for color and label):

```
>= -50 dBm  → Excellent (success)
>= -60 dBm  → Good      (success)
>= -70 dBm  → Fair      (warning)
<  -70 dBm  → Weak      (error)
```

Signal percent uses linear interpolation across the -100 dBm to -30 dBm range. All four stat cards
include ARIA `progressbar` roles where applicable.

**Props:**

```tsx
interface WifiStatusHeroProps {
  interfaces: WirelessInterface[];
  clients: WirelessClient[];
  isLoading?: boolean;
}
```

The loading state renders an `animate-pulse` skeleton with the same 4-column grid structure.

## ConnectedClientsTable

**File:** `apps/connect/src/app/pages/wifi/components/ConnectedClientsTable.tsx`

Displays WiFi clients sorted by signal strength (strongest first). Uses a `SectionHeader` with
client count badge.

**Columns (desktop):** MAC Address, Interface, Signal, Rate (rx/tx Mbps), Traffic (rx/tx bytes),
Uptime

**Mobile cards** render the same data in a stacked format with `ArrowDown`/`ArrowUp` icons for
directional traffic.

The `SignalBars` sub-component renders 1-4 animated bars color-coded by signal quality:

```
bars=4 (>= -50 dBm) → success
bars=3 (>= -60 dBm) → success
bars=2 (>= -70 dBm) → warning
bars=1 (<  -70 dBm) → error
```

Traffic bytes are formatted via `formatBytes` from `@nasnet/core/utils`.

**Empty state:** Full-width card with centered `Signal` icon and "no clients connected" message.

## WifiSecuritySummary

**File:** `apps/connect/src/app/pages/wifi/components/WifiSecuritySummary.tsx`

A responsive grid (1 col mobile / 2 col tablet / 3 col desktop) showing one card per wireless
interface with its security level.

**Security levels** detected from `securityProfile` string:

| Profile contains            | Level   | Icon        | Color   |
| --------------------------- | ------- | ----------- | ------- |
| `wpa3`                      | strong  | ShieldCheck | success |
| `wpa2`                      | good    | Shield      | success |
| `wpa` or `wep`              | weak    | ShieldAlert | warning |
| `default`, `none`, or empty | none    | ShieldX     | error   |
| anything else               | unknown | Shield      | muted   |

Each card shows the interface name, SSID, and a colored badge with the security label. Hidden when
`interfaces.length === 0`.

## WifiQuickActions

**File:** `apps/connect/src/app/pages/wifi/components/WifiQuickActions.tsx`

Two action buttons in the page header:

- **Refresh** — calls `handleRefresh` (passed as prop), shows spinning icon while `isRefreshing` is
  true
- **Restart WiFi** — opens a confirmation dialog before executing (handler is a TODO stub)

Both buttons enforce minimum 44px touch target height for WCAG AAA compliance. The restart dialog
blocks behind a full-screen overlay with keyboard `Escape` dismiss support.

**Props:**

```tsx
interface WifiQuickActionsProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}
```

## LoadingSkeleton

**File:** `apps/connect/src/app/pages/wifi/components/LoadingSkeleton.tsx`

Full-page skeleton with `animate-pulse` covering:

- Header row with title and two action button placeholders
- 4-column stats grid (2 cols on mobile)
- Section header placeholder
- 2-column interface card grid
- Clients table header and 3 rows

Used while both `isLoadingInterfaces` and `isLoadingClients` are true.

## WiFi Detail Page

**File:** `apps/connect/src/app/pages/wifi/detail/WifiDetailPage.tsx`

**Route:** `/router/$id/wifi/$interfaceName`

Fetches a single interface via `useWirelessInterfaceDetail(routerIp, interfaceName)`. Provides:

- Back button to `/router/:id/wifi`
- Loading: skeleton cards for header + three detail cards
- Error: error banner with the error message
- Success: renders `WirelessInterfaceDetail` from `@nasnet/features/wireless`

## WirelessInterfaceDetail

**File:** `libs/features/wireless/src/components/WirelessInterfaceDetail.tsx`

Implements FR0-15 and FR0-16. Renders a set of `Card` sections:

| Section                        | Fields                               | Notes                                     |
| ------------------------------ | ------------------------------------ | ----------------------------------------- |
| Header                         | SSID, name, hidden badge             | Edit Settings button + InterfaceToggle    |
| Radio Settings                 | Frequency, Channel, Width, TX Power  | Monospace font                            |
| Security                       | Security Profile, SSID visibility    |                                           |
| Connection (station mode only) | Signal strength, Connected To        | Only shown for `mode === 'station'`       |
| Regional                       | Country/Region name                  | Only when `countryCode` is set            |
| Security Profile Details       | Detailed profile info                | Only when `securityProfileDetails` is set |
| Hardware                       | MAC Address (copyable), Client Count | Copy button with 2-second confirmation    |

Clicking "Edit Settings" opens `WirelessSettingsModal`.

## WirelessSettingsModal and Form

**File:** `libs/features/wireless/src/components/WirelessSettingsModal.tsx`

A responsive dialog (`sm:max-w-[600px]`, 90vh max-height with scroll) that wraps
`WirelessSettingsForm`.

**Unsaved changes detection:** `isDirty` flag tracked on the form. Canceling a dirty form opens a
`ConfirmationDialog` asking to discard or keep editing.

**Submit behavior:** Only sends changed fields to `useUpdateWirelessSettings` mutation. On success,
closes the modal and resets `isDirty`.

```tsx
updateMutation.mutate({
  routerIp,
  interfaceId: iface.id,
  ssid: data.ssid !== iface.ssid ? data.ssid : undefined,
  channel: data.channel !== iface.channel ? data.channel : undefined,
  // ... other changed fields only
});
```

## Wireless Settings Validation Schema

**File:** `libs/features/wireless/src/validation/wirelessSettings.schema.ts`

Zod schema exported as `wirelessSettingsSchema` with the following fields:

| Field          | Type     | Constraint                                              |
| -------------- | -------- | ------------------------------------------------------- |
| `ssid`         | string   | 1-32 chars, printable ASCII only                        |
| `password`     | string?  | 8-63 chars when provided                                |
| `hideSsid`     | boolean? |                                                         |
| `channel`      | string?  | `"auto"` or numeric string                              |
| `channelWidth` | enum?    | `"20MHz"`, `"40MHz"`, `"80MHz"`, `"160MHz"`             |
| `txPower`      | number?  | 1-30 dBm                                                |
| `securityMode` | enum?    | `"none"`, `"wpa2-psk"`, `"wpa3-psk"`, `"wpa2-wpa3-psk"` |
| `countryCode`  | string?  | Exactly 2 uppercase letters (ISO 3166-1 alpha-2)        |

Default values: `channel: "auto"`, `channelWidth: "20MHz"`, `txPower: 17`,
`securityMode: "wpa2-psk"`.

A partial variant (`wirelessSettingsPartialSchema`) is exported for PATCH-style updates.

## Data Types

From `@nasnet/core/types`:

```typescript
interface WirelessInterface {
  id: string;
  name: string;
  ssid?: string;
  band: '2.4GHz' | '5GHz' | '6GHz' | 'Unknown';
  disabled: boolean;
  running: boolean;
  securityProfile: string;
  hideSsid?: boolean;
  mode: 'ap-bridge' | 'station' | 'station-bridge' | string;
  frequency: number;
  channel?: string;
  channelWidth: string;
  txPower: number;
  countryCode?: string;
  macAddress: string;
  connectedClients: number;
  signalStrength?: number;
  connectedTo?: string;
  securityProfileDetails?: SecurityProfileDetails;
}

interface WirelessClient {
  id: string;
  macAddress: string;
  interface: string;
  signalStrength: number;
  rxRate: number;
  txRate: number;
  rxBytes: number;
  txBytes: number;
  uptime: string;
}
```

## See Also

- `../data-fetching/graphql-hooks.md` — `useWirelessInterfaces`, `useWirelessClients`,
  `useWirelessInterfaceDetail`, `useUpdateWirelessSettings`
- `../ui-system/platform-presenters.md` — Headless + Platform Presenters pattern
