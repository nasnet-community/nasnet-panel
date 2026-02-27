# VPN Feature

The VPN feature manages all MikroTik VPN tunnels — both outgoing client connections
and incoming server configurations — across six protocols. It consists of three
main pages and a shared quick-view page, all mounted inside the router panel.

## Page Overview

| Page | Route | Component | Source |
|------|-------|-----------|--------|
| VPN Dashboard | `/router/$id/vpn` | `VPNDashboard` | `apps/connect/src/app/pages/vpn/VPNDashboard.tsx` |
| VPN Servers | `/router/$id/vpn/servers` | `VPNServersPage` | `apps/connect/src/app/pages/vpn/servers/VPNServersPage.tsx` |
| VPN Clients | `/router/$id/vpn/clients` | `VPNClientsPage` | `apps/connect/src/app/pages/vpn/clients/VPNClientsPage.tsx` |
| VPN Quick View | `/vpn` (global) | `VPNPage` | `apps/connect/src/app/pages/vpn/VPNPage.tsx` |

## VPN Dashboard

`VPNDashboard` provides a high-level overview of all VPN activity on the router.

```
VPNDashboard
├── Header (title + refresh button, 44px min-height)
├── Loading skeleton (3 skeletons while fetching)
├── Error state (alert role banner with retry)
└── Dashboard content
    ├── VPNStatusHero         # Overall health + connection counts + bandwidth totals
    ├── Navigation Cards (2)
    │   ├── VPNNavigationCard (server)   # Total/active servers → navigates to /servers
    │   └── VPNNavigationCard (client)   # Total/active clients → navigates to /clients
    ├── Protocol Stats Grid (1–3 columns)
    │   └── VPNProtocolStatsCard × 6     # One per protocol (WireGuard → IKEv2)
    └── Issues Section (conditional)
        └── VPNIssuesList (max 5, with "See all" link)
```

### Data Source

`useVPNStats(routerIp)` (TanStack Query) fetches the aggregate VPN statistics
object:

```ts
interface VPNStats {
  overallHealth: 'healthy' | 'degraded' | 'error';
  totalServers: number;
  totalClients: number;
  activeServers: number;
  activeClients: number;
  totalServerConnections: number;
  totalClientConnections: number;
  totalRx: number;
  totalTx: number;
  protocolStats: ProtocolStat[];  // one entry per protocol
  issues: VPNIssue[];
}
```

Protocol display order is fixed: `wireguard → openvpn → l2tp → pptp → sstp → ikev2`.

Navigation from the dashboard:
- "Configure Servers" → `/router/${routerId}/vpn/servers`
- "Configure Clients" → `/router/${routerId}/vpn/clients`
- Clicking a `VPNProtocolStatsCard` → `/router/${routerId}/vpn/servers?protocol=<p>`
  which pre-selects the matching tab on the servers page.

## VPN Servers Page

`VPNServersPage` lists every VPN server configuration, grouped by protocol in
collapsible `VPNTypeSection` accordions. Protocol tabs allow filtering to a
single type.

### Supported Protocol Architecture

| Protocol | Server type | MikroTik model |
|----------|------------|----------------|
| WireGuard | Multiple interface instances | `wg*` interfaces |
| OpenVPN | Multiple server instances | `ovpn-server` |
| L2TP | Single global server | `/interface l2tp-server server` |
| PPTP | Single global server | `/interface pptp-server server` |
| SSTP | Single global server | `/interface sstp-server server` |
| IKEv2/IPsec | Passive IPsec peers | `/ip ipsec peer` with `passive=yes` |

L2TP, PPTP, and SSTP each expose one server object; WireGuard, OpenVPN, and
IKEv2 support multiple instances.

### Data Hooks (all from `@nasnet/api-client/queries`)

| Hook | Returns |
|------|---------|
| `useWireGuardInterfaces(routerIp)` | `WireGuardInterface[]` |
| `useOpenVPNServers(routerIp)` | `OpenVPNServer[]` |
| `useL2TPServer(routerIp)` | `L2TPServer \| undefined` |
| `usePPTPServer(routerIp)` | `PPTPServer \| undefined` |
| `useSSTPServer(routerIp)` | `SSTPServer \| undefined` |
| `useIPsecPeers(routerIp)` | `IPsecPeer[]` — filtered with `isPassive=true` for servers |
| `usePPPActive(routerIp)` | `PPPActiveSession[]` — for connected-client counts |

All queries run in parallel. The combined `isLoading` drives the skeleton and the
combined `isFetching` drives the refresh button spinner.

Connected client counts for L2TP, PPTP, SSTP, and OpenVPN are derived from
`pppActiveQuery.data?.filter(c => c.service === '<service>')`.

### Server Card (`VPNServerCard`)

Each server is rendered as a `VPNServerCard` from `@nasnet/ui/patterns` with:
- Protocol icon badge.
- Enable/disable toggle (calls `useToggleVPNInterface` mutation).
- Edit button → navigates to the server's edit route.
- Delete button (WireGuard, OpenVPN, IKEv2 only; L2TP/PPTP/SSTP are singletons).
- View Details button (WireGuard).
- Connected client count (PPP-based protocols).
- Listen port display.

## VPN Clients Page

`VPNClientsPage` mirrors the servers page structure but for outgoing client
connections.

### Protocol to Data Hook Mapping

| Protocol | Hook | Filtering |
|----------|------|-----------|
| WireGuard | `useWireGuardPeers(routerIp)` | `filter(p => p.endpoint)` — peers with endpoint = clients |
| OpenVPN | `useOpenVPNClients(routerIp)` | All returned records |
| L2TP | `useL2TPClients(routerIp)` | All |
| PPTP | `usePPTPClients(routerIp)` | All |
| SSTP | `useSSTPClients(routerIp)` | All |
| IKEv2/IPsec | `useIPsecPeers(routerIp)` | `filter(p => !p.isPassive)` — non-passive = clients |

IPsec active connections are fetched in parallel via `useIPsecActive(routerIp)`
and joined by `peer` ID to display runtime metrics (uptime, RX/TX, local/remote
address).

### Client Card (`VPNClientCard`)

Each client is rendered as a `VPNClientCard` from `@nasnet/ui/patterns` with:
- Protocol icon badge.
- Enable/disable toggle.
- Connection target (`connectTo` / endpoint).
- Port, user, uptime, RX/TX (where applicable).
- Local / remote address for tunnelled protocols.
- Last handshake for WireGuard peers.

### Protocol Tab Navigation

A URL search parameter `?protocol=<protocol>` pre-selects the tab on load:

```ts
const initialProtocol = (search as { protocol?: VPNProtocol }).protocol || null;
const [activeTab, setActiveTab] = useState<VPNProtocol | 'all'>(initialProtocol || 'all');
```

The `VPNDashboard` uses this when the user clicks a protocol stats card.

## VPN Quick View Page (`VPNPage`)

`VPNPage` is the lightweight, always-visible `/vpn` route. It shows:

1. **WireGuard interfaces** — rendered as `WireGuardCard` components with
   status, listening port, public key (copyable), and peer count.
2. **Other VPN types** — L2TP, PPTP, SSTP rendered as collapsed `VPNTypeSection`
   accordions containing `GenericVPNCard` items.

It uses 5-second auto-refresh via TanStack Query's `refetchInterval` on
`useWireGuardInterfaces`. The manual refresh button updates the WireGuard data
immediately; PPP protocols are refreshed passively.

## Enable/Disable Mutation

`useToggleVPNInterface()` (from `@nasnet/api-client/queries`) is shared across
all three pages. It accepts:

```ts
{
  routerIp: string;
  id: string;
  name: string;
  protocol: VPNProtocol;
  disabled: boolean;  // true = disable, false = enable
}
```

`toggleMutation.isPending` drives a loading indicator on the card's toggle
control.

## Protocol Constants

```ts
const ALL_PROTOCOLS: VPNProtocol[] = [
  'wireguard', 'openvpn', 'l2tp', 'pptp', 'sstp', 'ikev2'
];
```

`getProtocolLabel(protocol)` from `@nasnet/ui/patterns` returns the human-readable
label (e.g. `'IKEv2/IPsec'` for `'ikev2'`).

`ProtocolIconBadge` renders the protocol-specific icon at `sm` or `lg` size.

## Kill Switch

The kill switch feature is managed at the service/network layer
(`apps/backend/internal/vif/isolation/kill_switch_coordinator_test.go`,
`kill_switch_listener.go`). On the frontend it surfaces as:

- The VPN routing configuration page under the router panel.
- Kill switch state is part of the service isolation query.

See the architecture doc for kill-switch coordinator details.

## Accessibility

All interactive controls in the VPN pages meet WCAG AAA requirements:
- `min-h-[44px]` on all buttons.
- `focus-visible:ring-2` on all focusable elements.
- `aria-label` on icon-only buttons.
- `role="status"` on loading containers.
- `role="alert"` on error banners.

## Related

- `../data-fetching/graphql-hooks.md` — `useVPNStats`, `useWireGuardInterfaces`,
  `useWireGuardPeers`, `useToggleVPNInterface`, and all VPN protocol hooks.
- `../ui-system/patterns-catalog.md` — `VPNStatusHero`, `VPNProtocolStatsCard`,
  `VPNNavigationCard`, `VPNIssuesList`, `VPNClientCard`, `VPNServerCard`,
  `VPNTypeSection`, `WireGuardCard`, `GenericVPNCard`.
