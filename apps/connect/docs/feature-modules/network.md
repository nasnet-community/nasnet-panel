# Network Feature

The network feature covers the `NetworkDashboard` page and the `libs/features/network/` library,
which together provide interface management, DHCP, DNS, VLAN, WAN, bridge, and IP-address
configuration.

## Network Dashboard

`NetworkDashboard` (`apps/connect/src/app/pages/network/NetworkDashboard.tsx`) renders four
sections:

```
NetworkDashboard
├── DHCPPoolSummary          # Section 1: Pool utilisation overview
├── Interface Grid           # Section 2: InterfaceGridCard × N (max 6 shown)
└── Two-column row
    ├── ConnectedDevicesCard # Section 3: ARP table with device info
    └── QuickIPOverview      # Section 4: Assigned IP addresses
```

### Data Sources

| Section      | Hook                       | GraphQL target      |
| ------------ | -------------------------- | ------------------- |
| Interfaces   | `useInterfaces(routerIp)`  | Router interfaces   |
| ARP table    | `useARPTable(routerIp)`    | ARP entries         |
| IP addresses | `useIPAddresses(routerIp)` | IP address bindings |
| DHCP servers | `useDHCPServers(routerIp)` | DHCP server list    |
| DHCP leases  | `useDHCPLeases(routerIp)`  | Current leases      |
| DHCP pools   | `useDHCPPools(routerIp)`   | Pool definitions    |

All queries are fired in parallel; interfaces are used as the loading gate (the skeleton is shown
until `isLoadingInterfaces` resolves).

## Component Inventory

### Network Dashboard Components

(`apps/connect/src/app/pages/network/components/`)

| Component                  | Purpose                                                                        |
| -------------------------- | ------------------------------------------------------------------------------ |
| `InterfaceGridCard`        | Compact interface card; expands to show type, MAC, MTU, and traffic stats      |
| `InterfaceCard`            | Alternative card layout for list view                                          |
| `InterfaceList`            | Vertical list of interfaces                                                    |
| `InterfaceCompactList`     | Ultra-compact list for sidebar use                                             |
| `InterfaceIPConfig`        | IP address assignment panel for a single interface                             |
| `InterfaceTypeIcon`        | Icon resolved from interface type (ether, wlan, bridge, vlan, …)               |
| `TrafficStats`             | RX/TX bytes + packet counts with `default`, `compact`, and `detailed` variants |
| `TrafficIndicator`         | Mini RX/TX arrows indicator                                                    |
| `TrafficOverviewCard`      | Card wrapping aggregate traffic stats                                          |
| `DHCPPoolSummary`          | DHCP server count, lease utilisation, pool ranges                              |
| `ConnectedDevicesCard`     | ARP table with device names, IPs, MACs, vendor lookup                          |
| `ARPTable`                 | Sortable ARP table with search                                                 |
| `QuickIPOverview`          | Assigned IPs across all interfaces                                             |
| `NetworkStatusHero`        | Full hero banner showing overall network health                                |
| `NetworkStatusHeroDisplay` | Inner display portion of the hero                                              |
| `NetworkStatusHeader`      | Compact header variant                                                         |
| `NetworkQuickStats`        | Up/down counts, IP count, device count mini-stats                              |
| `NetworkStatsGrid`         | Grid layout for multiple stat widgets                                          |
| `NetworkDetailSection`     | Section wrapper with title and "view all" link                                 |
| `NetworkActionButtons`     | Primary action CTA buttons                                                     |
| `NetworkTopBar`            | Page-level top bar with title and search                                       |
| `VPNStatusCard`            | VPN tunnel status mini-card                                                    |
| `StatusBadge`              | Online / offline / degraded / unknown badge                                    |
| `LinkStatusIndicator`      | Green/amber/red link-up indicator with animated ping                           |
| `SectionHeader`            | Consistent section heading with optional count badge                           |
| `LoadingSkeleton`          | Shimmer skeleton for the full network dashboard                                |
| `ErrorDisplay`             | Error boundary display with retry button                                       |

### `InterfaceGridCard` Behaviour

`InterfaceGridCard` (`components/InterfaceGridCard.tsx`) is the core interface widget on the network
dashboard:

- Shows a pulsing green dot when `status === 'running' && linkStatus === 'up'`.
- Shows an amber dot when running but link is down.
- Muted and 60 % opacity when not running.
- Clicking expands an inline detail panel (type, MAC, MTU, packet counts).
- Calls `useInterfaceTraffic(routerIp, iface.id)` to fetch live RX/TX bytes, displayed in compact
  form (arrows + formatted bytes) in the collapsed header.

### `TrafficStats` Variants

`TrafficStats` (`components/TrafficStats.tsx`) accepts a `variant` prop:

| Variant    | Description                                                                       |
| ---------- | --------------------------------------------------------------------------------- |
| `default`  | Two-row progress bars for download/upload with packet counts and error highlights |
| `compact`  | Inline RX/TX + optional warning triangle                                          |
| `detailed` | Full grid of RX/TX bytes, packets, drops, errors                                  |

An alert role banner is rendered when `txErrors + rxErrors > 0` or `txDrops + rxDrops > 0`.

## Feature Library (`libs/features/network/`)

### DHCP (`dhcp/`)

Sub-module structure:

```
dhcp/
├── components/
│   ├── dhcp-wizard/          # Multi-step new server wizard
│   ├── lease-table/          # Paginated, searchable lease table
│   ├── lease-filters/        # Status / hostname / IP filter bar
│   ├── lease-card/           # Mobile card layout for a single lease
│   ├── device-type-icon/     # Icon resolved from DHCP fingerprint type
│   └── fingerprint-detail-panel/  # Expanded device fingerprint info
├── hooks/                    # DHCP-specific hooks
└── pages/
    ├── dhcp-server-list      # DHCP server listing page
    └── dhcp-server-detail    # Single server: pool, leases, options
```

DHCP routes (`apps/connect/src/routes/network/dhcp/`):

| Route                     | Page                                  |
| ------------------------- | ------------------------------------- |
| `/network/dhcp`           | `index.tsx` — server list             |
| `/network/dhcp/new`       | `new.tsx` — add server wizard         |
| `/network/dhcp/$serverId` | `$serverId.tsx` — server detail       |
| `/network/dhcp/leases`    | `leases.tsx` — all-routers lease view |

### DNS (`dns/`)

```
dns/
├── components/
│   ├── dns-server-list/      # Upstream server list with reachability status
│   ├── dns-settings-form/    # Cache size, max TTL, DoH server, etc.
│   ├── dns-static-entry-form/  # A/CNAME/PTR/MX static record form
│   └── dns-static-entries-list/ # Table of static DNS entries
├── hooks/                    # DNS query hooks
├── schemas/                  # Zod schemas for DNS settings + static entry
├── utils/                    # IP validation helpers
└── pages/
    └── DnsPage               # Full DNS management page
```

DNS route: `/network/dns/diagnostics` — DNS Lookup Tool
(`apps/connect/src/routes/network/dns/diagnostics.tsx`).

`DnsSettingsForm` includes fields for:

- Maximum cache size
- Maximum TTL
- DoH (DNS-over-HTTPS) server URL
- Allow remote requests toggle
- MDNS flag

### VLAN (`vlans/`)

```
vlans/
├── components/
│   ├── vlan-list/            # VLAN table with search + filter
│   ├── vlan-form/            # Add/edit VLAN form
│   ├── vlan-port-config/     # Per-port tagged/untagged assignment
│   └── vlan-topology/        # Visual VLAN topology diagram
├── hooks/                    # VLAN query/mutation hooks
└── schemas/                  # Zod schema for VLAN configuration
```

`VlanManagementPage` (`apps/connect/src/app/pages/VlanManagementPage.tsx`) is the dedicated VLAN
management page.

### WAN (`wan/`)

```
wan/
├── components/
│   ├── wan-configuration/
│   │   ├── DhcpClientForm    # DHCP client setup
│   │   ├── PppoeWizard       # PPPoE multi-step wizard
│   │   ├── LteModemForm      # LTE/4G modem APN configuration
│   │   └── HealthCheckForm   # WAN health-check settings
│   ├── wan-card/             # Status card for a single WAN interface
│   ├── wan-history/
│   │   ├── ConnectionEventCard    # Individual up/down event
│   │   └── ConnectionHistoryTable # Event history table
│   └── wan-overview/
│       └── WANOverviewList   # All WAN interfaces summary
└── pages/
    └── WANManagementPage     # Full WAN management page
```

WAN types (`wan/types/wan.types.ts`):

- `DhcpClient` — automatic IP from ISP.
- `Pppoe` — PPPoE credential-based.
- `LteModem` — mobile broadband with APN settings.
- `Static` — fixed IP assignment.

### Bridges (`bridges/`)

```
bridges/
├── components/
│   ├── bridge-list/          # Bridge interface list
│   ├── bridge-detail/        # Single bridge: ports, STP, VLANs
│   ├── bridge-port-diagram/  # Interactive port-membership diagram
│   ├── bridge-port-editor/   # Add/remove bridge ports
│   └── bridge-stp-status/    # STP port state table
└── hooks/                    # Bridge query hooks
```

`BridgePortDiagram` visualises which physical ports belong to each bridge interface, and the
available (unassigned) interfaces.

### IP Addresses (`components/ip-address/`)

Shared across network sub-modules:

| Component               | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `IPAddressList`         | Table of IP addresses with edit/delete per row |
| `IPAddressForm`         | Add/edit form with CIDR validation             |
| `IPAddressDeleteDialog` | Confirmation dialog for IP removal             |

Validation (`validation.test.ts`) covers IPv4, IPv6, and CIDR notation.

### Interface Components (`components/interface-*/`)

| Component                 | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `InterfaceList`           | Full interface list with status, type, and batch actions |
| `InterfaceDetail`         | Platform-adaptive detailed interface view                |
| `InterfaceDetail.Desktop` | Desktop presenter with side-by-side layout               |
| `InterfaceEditForm`       | Edit interface settings (name, MTU, comment, disabled)   |
| `BatchConfirmDialog`      | Bulk enable/disable/rename confirmation                  |

### Interface Statistics (`interface-stats/`)

`use-interface-stats-panel.ts` provides the headless hook that powers:

- `bandwidth-chart.stories.tsx` — bandwidth history chart.
- `error-rate-indicator.stories.tsx` — error/drop rate badges.
- `interface-comparison.stories.tsx` — side-by-side interface comparison.

Panel types are defined in `interface-stats-panel.types.ts`.

### Route Management (`components/routes/`)

| Component                 | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `RouteList`               | Static route table with sorting and filtering            |
| `RouteForm`               | Add/edit a static route (destination, gateway, distance) |
| `RouteDeleteConfirmation` | Delete route confirmation                                |

`useRouteForm.ts` and `useRouteList.ts` are the headless hooks. Route page:
`libs/features/network/src/pages/RoutesPage`.

### DNS Benchmark and Cache

`DnsBenchmark` (`components/DnsBenchmark/`) — tests response time of configured DNS servers.

`DnsCachePanel` (`components/DnsCachePanel/`) — shows cached DNS entries with TTL countdown and a
flush action.

## Status Indicators

`StatusBadge` (`apps/connect/src/app/pages/network/components/StatusBadge.tsx`):

| Status value         | Colour token       | Label    |
| -------------------- | ------------------ | -------- |
| `online` / `running` | `semantic.success` | Online   |
| `degraded`           | `semantic.warning` | Degraded |
| `offline`            | `semantic.error`   | Offline  |
| `unknown`            | `semantic.muted`   | Unknown  |

`LinkStatusIndicator` adds an animated pulsing ring when status is `up`.

`InterfaceTypeIcon` maps MikroTik interface types to Lucide icons:

- `ether` → Plug
- `wlan` → Wifi
- `bridge` → GitMerge
- `vlan` → Layers
- `pppoe` → Cable
- `lte` → Signal
- `wireguard` → Shield
- `ovpn` / `l2tp` / `pptp` / `sstp` → VPN-specific icons.

## Related

- `../data-fetching/graphql-hooks.md` — `useInterfaces`, `useARPTable`, `useIPAddresses`,
  `useDHCPLeases`, `useInterfaceTraffic`, and related hooks.
- `../ui-system/patterns-catalog.md` — shared patterns used in lists, detail panels, and cards.
