# VPN Feature Module Documentation

## Overview

The VPN feature in NasNetConnect provides comprehensive multi-protocol VPN management for MikroTik
routers. It supports six major VPN protocols (WireGuard, OpenVPN, L2TP, PPTP, SSTP, and IKEv2/IPsec)
with both client and server configurations.

This module implements:

- Real-time VPN infrastructure monitoring via a dashboard
- Protocol-specific client and server management pages
- Multi-protocol status and statistics aggregation
- Support for active connection tracking and traffic statistics
- Responsive design across mobile, tablet, and desktop platforms

## Module Architecture

### Page Hierarchy

```
VPNDashboard (overview)
├── VPNStatusHero (health indicator)
├── VPNNavigationCard (server/client navigation)
├── VPNProtocolStatsCard (6 cards, one per protocol)
└── VPNIssuesList (warnings/errors)

VPNPage (protocol viewer)
├── WireGuardCard (primary protocol)
└── VPNTypeSection (L2TP, PPTP, SSTP - read-only)

VPNClientsPage (client management)
├── VPNTypeSection × 6 (one per protocol)
│   └── VPNClientCard[] (individual clients)
└── Tab navigation by protocol

VPNServersPage (server management)
├── VPNTypeSection × 6 (one per protocol)
│   └── VPNServerCard[] (individual servers)
└── Tab navigation by protocol
```

### Component Composition

Each page combines:

1. **Layout**: Header with refresh button, loading skeletons, error states
2. **Pattern Components**: Reusable UI patterns from Layer 2
3. **State Management**: Apollo Client queries via TanStack Query hooks
4. **Mutations**: Toggle, create, update, delete operations

## Supported VPN Protocols

| Protocol        | Client           | Server           | Notes                                |
| --------------- | ---------------- | ---------------- | ------------------------------------ |
| **WireGuard**   | ✓ Peers          | ✓ Interfaces     | Modern, encrypted peer-to-peer       |
| **OpenVPN**     | ✓ Clients        | ✓ Servers        | Industry standard, TLS/SSL           |
| **L2TP/IPsec**  | ✓ Clients        | ✓ Single Server  | PPP-based, uses IPsec for encryption |
| **PPTP**        | ✓ Clients        | ✓ Single Server  | Legacy, PPP tunneling                |
| **SSTP**        | ✓ Clients        | ✓ Single Server  | HTTPS-based tunneling                |
| **IKEv2/IPsec** | ✓ Peers (Client) | ✓ Peers (Server) | Modern, passive/non-passive mode     |

### Protocol Implementation Details

**WireGuard**

- Interfaces have multiple peers (bidirectional)
- Stores public keys, endpoints, and allowed IPs
- Per-peer traffic stats via `rx`/`tx` counters
- Query hooks: `useWireGuardInterfaces`, `useWireGuardPeers`

**OpenVPN**

- Separate server and client configurations
- PPP-based user authentication
- Real-time connection tracking
- Query hooks: `useOpenVPNServers`, `useOpenVPNClients`

**L2TP/PPTP/SSTP**

- Single server instance per protocol
- PPP-based authentication (shared PPP secrets)
- Multiple active connections tracked via `usePPPActive`
- Query hooks: `useL2TPServer`/`useL2TPClients`, etc.

**IKEv2/IPsec**

- Peers marked as `isPassive` (server) or active (client)
- Detailed identity and policy configuration
- Active connections tracked separately from policies
- Query hooks: `useIPsecPeers`, `useIPsecActive`, `useIPsecPolicies`

## Route Structure

Routes defined under `/router/$id/vpn/`:

```
/router/[routerId]/vpn/                    → VPNDashboard (default)
/router/[routerId]/vpn/clients             → VPNClientsPage
/router/[routerId]/vpn/servers             → VPNServersPage
```

**Dynamic Routing**: Pages support `?protocol=wireguard` query parameter to auto-select tab.

## Page Components

### VPNDashboard

**File**: `apps/connect/src/app/pages/vpn/VPNDashboard.tsx`

**Purpose**: Main overview page showing aggregate VPN infrastructure health.

**Key Features**:

- Uses `useVPNStats()` to fetch aggregated data from all protocols
- Displays health status (healthy/warning/critical)
- Shows server/client count and active connections
- Renders 6 protocol stat cards in grid
- Navigation cards link to servers/clients pages
- Issues section shows up to 5 alerts

**Hooks Used**:

```typescript
const { data: stats } = useVPNStats(routerIp);
// Returns VPNDashboardStats with:
// - totalServers, totalClients, activeServers, activeClients
// - protocolStats array (6 items, one per protocol)
// - overallHealth ('healthy' | 'warning' | 'critical')
// - issues: VPNIssue[] (warnings and errors)
```

**Responsive Design**:

- Mobile: Single column layout, bottom navigation
- Tablet: 2-column grid for nav cards
- Desktop: 3-column grid for protocol stats

### VPNPage

**File**: `apps/connect/src/app/pages/vpn/VPNPage.tsx`

**Purpose**: Display WireGuard interfaces (primary protocol) plus read-only view of other protocols.

**Key Features**:

- Parallel queries for WireGuard, L2TP, PPTP, SSTP
- Manual refresh button (only refreshes WireGuard)
- Auto-refreshes every 5 seconds
- WireGuard cards fully editable (future: peer management)
- Other VPN types in collapsible sections (read-only)
- Empty state with helpful messaging

**Hooks Used**:

```typescript
const { data: wireguardInterfaces } = useWireGuardInterfaces(routerIp);
const { data: l2tpInterfaces } = useL2TPInterfaces(routerIp);
const { data: pptpInterfaces } = usePPTPInterfaces(routerIp);
const { data: sstpInterfaces } = useSSTPInterfaces(routerIp);
```

### VPNClientsPage

**File**: `apps/connect/src/app/pages/vpn/clients/VPNClientsPage.tsx`

**Purpose**: Manage all VPN client configurations across protocols.

**Key Features**:

- Protocol-based tab navigation (All, WireGuard, OpenVPN, L2TP, PPTP, SSTP, IKEv2)
- Toggle client enabled/disabled
- View connection status and traffic stats
- Edit/delete handlers (wired but not fully implemented)
- Empty states with "Add Client" CTA per protocol
- 2-column grid layout for client cards

**Client Types**:

- **WireGuard Peers**: Filter interfaces with `endpoint` defined
- **OpenVPN Clients**: All configured OpenVPN clients
- **L2TP Clients**: All configured L2TP clients
- **PPTP Clients**: All configured PPTP clients
- **SSTP Clients**: All configured SSTP clients
- **IKEv2 Peers**: Filter peers with `isPassive === false` (client mode)

**Hooks Used**:

```typescript
const wireguardPeers = useWireGuardPeers(routerIp);
const openvpnClients = useOpenVPNClients(routerIp);
const ipsecPeers = useIPsecPeers(routerIp);
const ipsecActive = useIPsecActive(routerIp);
const toggleMutation = useToggleVPNInterface();
```

### VPNServersPage

**File**: `apps/connect/src/app/pages/vpn/servers/VPNServersPage.tsx`

**Purpose**: Manage all VPN server configurations across protocols.

**Key Features**:

- Protocol-based tab navigation (All, WireGuard, OpenVPN, L2TP, PPTP, SSTP, IKEv2)
- Toggle server enabled/disabled
- View port, connected client count
- Connected clients pulled from `usePPPActive` for PPP-based protocols
- Single server instances for L2TP/PPTP/SSTP (singleton pattern)
- 2-column grid layout for server cards

**Server Types**:

- **WireGuard Interfaces**: Multiple servers, each with `listenPort`
- **OpenVPN Servers**: Multiple servers with port configuration
- **L2TP Server**: Single instance, client count from PPP active
- **PPTP Server**: Single instance, client count from PPP active
- **SSTP Server**: Single instance, client count from PPP active
- **IKEv2 Peers**: Filter peers with `isPassive === true` (server mode)

**Hooks Used**:

```typescript
const wireguardServers = useWireGuardInterfaces(routerIp);
const openvpnServers = useOpenVPNServers(routerIp);
const l2tpServer = useL2TPServer(routerIp);
const pppActive = usePPPActive(routerIp);
const toggleMutation = useToggleVPNInterface();
```

## Pattern Components (Layer 2)

### VPNClientCard

**File**: `libs/ui/patterns/src/vpn-client-card/VPNClientCard.tsx`

**Purpose**: Display a single VPN client with connection status and stats.

**Props**:

```typescript
interface VPNClientCardProps {
  id: string;
  name: string;
  protocol: VPNProtocol;
  isDisabled: boolean;
  isRunning: boolean;
  connectTo: string; // Remote server address
  port?: number;
  user?: string;
  uptime?: string;
  rx?: number; // Bytes received
  tx?: number; // Bytes transmitted
  localAddress?: string;
  remoteAddress?: string;
  comment?: string;
  onToggle?: (id: string, enabled: boolean) => void;
  onConnect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isToggling?: boolean;
}
```

**Rendering**:

- Protocol icon badge + status indicator
- Remote server address display
- Connection info section (when connected): uptime, IP addresses, traffic stats
- Dropdown menu for edit/delete/connect actions
- Green left border (`border-l-4 border-l-category-vpn`)

**Responsive Design**:

- Unified component (no separate mobile/desktop presenters)
- Touch-friendly: 44px minimum touch targets

### VPNServerCard

**File**: `libs/ui/patterns/src/vpn-server-card/VPNServerCard.tsx`

**Purpose**: Display a single VPN server with active connections and stats.

**Props**:

```typescript
interface VPNServerCardProps {
  id: string;
  name: string;
  protocol: VPNProtocol;
  isDisabled: boolean;
  isRunning: boolean;
  port?: number;
  connectedClients?: number; // Active client count
  rx?: number; // Bytes received
  tx?: number; // Bytes transmitted
  comment?: string;
  onToggle?: (id: string, enabled: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  isToggling?: boolean;
}
```

**Rendering**:

- Protocol icon badge + status indicator
- Port display + connected clients count
- Traffic stats (rx/tx)
- Dropdown menu for view/edit/delete actions
- Green left border (`border-l-4 border-l-category-vpn`)

### VPNStatusHero

**File**: `libs/ui/patterns/src/vpn-status-hero/VPNStatusHero.tsx`

**Purpose**: Large health indicator card for VPN infrastructure.

**Props**:

```typescript
type VPNHealthStatus = 'healthy' | 'warning' | 'critical' | 'loading';

interface VPNStatusHeroProps {
  status: VPNHealthStatus;
  totalServers: number;
  totalClients: number;
  activeServerConnections: number;
  activeClientConnections: number;
  totalRx: number;
  totalTx: number;
  issueCount?: number;
}
```

**Rendering**:

- Large status icon (Shield/ShieldAlert/ShieldX/Loader2)
- Title and subtitle based on health status
- Stats bar (4 columns): Servers, Clients, Active, Traffic
- Color coding per status:
  - `healthy`: Green (success)
  - `warning`: Amber (warning)
  - `critical`: Red (error)
  - `loading`: Gray with spinner

### VPNTypeSection

**File**: `libs/ui/patterns/src/vpn-type-section/VPNTypeSection.tsx`

**Purpose**: Collapsible section grouping VPN interfaces by protocol type.

**Props**:

```typescript
interface VPNTypeSectionProps {
  type: string; // "L2TP", "PPTP", etc.
  count: number; // Interface count
  defaultExpanded?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
  showReadOnlyNotice?: boolean; // Shows "Read-only" notice
}
```

**Rendering**:

- Collapsible header with chevron icon
- Count badge
- "Read-only" notice (for non-WireGuard protocols)
- Animated expand/collapse with Framer Motion
- Children rendered in background color with padding

### VPNProtocolStatsCard

**File**: `libs/ui/patterns/src/vpn-protocol-stats-card/VPNProtocolStatsCard.tsx`

**Purpose**: Display protocol-level statistics in grid format.

**Rendering**:

- Protocol icon with name
- Server/client count
- Active connections
- Total traffic (rx+tx)
- Clickable to navigate to servers page with protocol filter

### VPNNavigationCard

**File**: `libs/ui/patterns/src/vpn-navigation-card/VPNNavigationCard.tsx`

**Purpose**: Navigation card to servers or clients page.

**Props**:

```typescript
interface VPNNavigationCardProps {
  type: 'server' | 'client';
  count: number;
  activeCount: number;
  onClick: () => void;
}
```

**Rendering**:

- Icon + "VPN Servers" or "VPN Clients"
- Count display with active/total formatting
- Click handler for navigation

### VPNIssuesList

**File**: `libs/ui/patterns/src/vpn-issue-alert/VPNIssueAlert.tsx`

**Purpose**: Display list of VPN warnings/errors.

**Rendering**:

- Each issue as red/amber alert
- Issue type, protocol, entity name
- Severity indicator
- Limit to 5 items with "See all" link

## API Layer

### Query Hooks (Data Fetching)

All hooks follow TanStack Query patterns with auto-refetch enabled.

#### Dashboard Stats

```typescript
// Aggregate stats from all protocols
useVPNStats(routerIp: string) → Promise<VPNDashboardStats>
```

**Behavior**:

- Fetches individual hooks for all protocols
- Aggregates into single stats object
- Calculates `overallHealth` based on issues
- Auto-refetches every 5 seconds
- Used by: VPNDashboard

#### WireGuard Queries

```typescript
useWireGuardInterfaces(routerIp: string)
  → Promise<WireGuardInterface[]>
  // Endpoint: GET /rest/interface/wireguard
  // Cache key: ['vpn', 'wireguard', routerIp, 'interfaces']

useWireGuardPeers(routerIp: string, interfaceName?: string)
  → Promise<WireGuardPeer[]>
  // Endpoint: GET /rest/interface/wireguard/[id]/peers
  // Cache key: ['vpn', 'wireguard', routerIp, 'peers', interfaceName]
```

#### OpenVPN Queries

```typescript
useOpenVPNServers(routerIp: string) → Promise<OpenVPNServer[]>
  // Endpoint: GET /rest/interface/ovpn-server

useOpenVPNClients(routerIp: string) → Promise<OpenVPNClient[]>
  // Endpoint: GET /rest/interface/ovpn-client
```

#### L2TP Queries

```typescript
useL2TPServer(routerIp: string) → Promise<L2TPServer | null>
  // Endpoint: GET /rest/interface/l2tp-server
  // Returns single instance

useL2TPClients(routerIp: string) → Promise<L2TPClient[]>
  // Endpoint: GET /rest/interface/l2tp-client

useL2TPInterfaces(routerIp: string) → Promise<L2TPInterface[]>
  // Endpoint: GET /rest/interface/l2tp
```

#### PPTP Queries

```typescript
usePPTPServer(routerIp: string) → Promise<PPTPServer | null>
usePPTPClients(routerIp: string) → Promise<PPTPClient[]>
usePPTPInterfaces(routerIp: string) → Promise<PPTPInterface[]>
```

#### SSTP Queries

```typescript
useSSTPServer(routerIp: string) → Promise<SSTPServer | null>
useSSTPClients(routerIp: string) → Promise<SSTPClient[]>
useSSTPInterfaces(routerIp: string) → Promise<SSTPInterface[]>
```

#### IKEv2/IPsec Queries

```typescript
useIPsecPeers(routerIp: string) → Promise<IPsecPeer[]>
  // Peers marked with isPassive (server) or not (client)
  // Endpoint: GET /rest/ip/ipsec/peer

useIPsecActive(routerIp: string) → Promise<IPsecActive[]>
  // Active connections (status tracking)
  // Endpoint: GET /rest/ip/ipsec/active

useIPsecPolicies(routerIp: string) → Promise<IPsecPolicy[]>
useIPsecIdentities(routerIp: string) → Promise<IPsecIdentity[]>
```

#### PPP Queries (Shared by L2TP, PPTP, SSTP)

```typescript
usePPPActive(routerIp: string) → Promise<PPPActive[]>
  // Active PPP sessions across all PPP-based servers
  // Filter by service: 'l2tp' | 'pptp' | 'sstp' | 'ovpn'
  // Endpoint: GET /rest/ppp/active

usePPPSecrets(routerIp: string) → Promise<PPPSecret[]>
  // User credentials for PPP authentication
  // Endpoint: GET /rest/ppp/secret
```

### Mutation Hooks (Write Operations)

#### useToggleVPNInterface

```typescript
useToggleVPNInterface() → UseMutationResult<void, Error, {
  routerIp: string;
  id: string;
  name: string;
  protocol: VPNProtocol;
  disabled: boolean;
}>
```

**Behavior**:

- Sets `disabled` flag on VPN interface
- Invalidates relevant query cache after mutation
- Used by: VPNClientCard, VPNServerCard toggle buttons

#### useCreateVPNInterface

```typescript
useCreateVPNInterface() → UseMutationResult<VPNInterface, Error, {
  routerIp: string;
  protocol: VPNProtocol;
  config: ProtocolConfig;
}>
```

#### useUpdateVPNInterface

```typescript
useUpdateVPNInterface() → UseMutationResult<VPNInterface, Error, {
  routerIp: string;
  id: string;
  config: Partial<ProtocolConfig>;
}>
```

#### useDeleteVPNInterface

```typescript
useDeleteVPNInterface() → UseMutationResult<void, Error, {
  routerIp: string;
  id: string;
  protocol: VPNProtocol;
}>
```

### Query Keys

**File**: `libs/api-client/queries/src/vpn/queryKeys.ts`

Hierarchical query key structure for TanStack Query cache management:

```typescript
vpnKeys = {
  all: ['vpn'],

  stats: (routerIp) => ['vpn', 'stats', routerIp],

  wireguard: (routerIp) => ['vpn', 'wireguard', routerIp],
  wireguardInterfaces: (routerIp) => [...wireguard, 'interfaces'],
  wireguardPeers: (routerIp, interfaceName) => [...wireguard, 'peers', interfaceName],

  openvpn: (routerIp) => ['vpn', 'openvpn', routerIp],
  openvpnServers: (routerIp) => [...openvpn, 'servers'],
  openvpnClients: (routerIp) => [...openvpn, 'clients'],

  l2tp: (routerIp) => ['vpn', 'l2tp', routerIp],
  l2tpServer: (routerIp) => [...l2tp, 'server'],
  l2tpClients: (routerIp) => [...l2tp, 'clients'],

  pptp: (routerIp) => ['vpn', 'pptp', routerIp],
  pptpServer: (routerIp) => [...pptp, 'server'],
  pptpClients: (routerIp) => [...pptp, 'clients'],

  sstp: (routerIp) => ['vpn', 'sstp', routerIp],
  sstpServer: (routerIp) => [...sstp, 'server'],
  sstpClients: (routerIp) => [...sstp, 'clients'],

  ipsec: (routerIp) => ['vpn', 'ipsec', routerIp],
  ipsecPeers: (routerIp) => [...ipsec, 'peers'],
  ipsecActive: (routerIp) => [...ipsec, 'active'],

  ppp: (routerIp) => ['vpn', 'ppp', routerIp],
  pppActive: (routerIp) => [...ppp, 'active'],
};
```

## State Management

### Apollo Client / TanStack Query

All VPN data flows through TanStack Query (React Query):

**Caching Strategy**:

- `staleTime: 5000-10000ms` - Config data cached briefly
- `refetchInterval: 5000ms` - Auto-refresh for real-time status
- `refetchOnWindowFocus: true` - Update when tab regains focus
- `refetchIntervalInBackground: false` - Pause when tab hidden

**Examples**:

```typescript
// Page component fetching WireGuard and stats
const { data: stats, isLoading } = useVPNStats(routerIp);
const { data: wireguardInterfaces } = useWireGuardInterfaces(routerIp);

// VPNClientsPage combining multiple protocols
const { data: wgPeers } = useWireGuardPeers(routerIp);
const { data: ovpnClients } = useOpenVPNClients(routerIp);
const { data: ipsecActive } = useIPsecActive(routerIp);
```

### Zustand (UI State)

Connection state managed via `useConnectionStore`:

```typescript
const routerIp = useConnectionStore((state) => state.currentRouterIp);
```

VPN-specific UI state (selected protocol tab, filters) managed locally in components.

### Future: XState Integration

Multi-step VPN connection flows (e.g., WireGuard peer configuration) will use XState machines
(reference: doc 03).

## Backend Integration

### REST Endpoints (rosproxy)

VPN hooks communicate with RouterOS REST API via rosproxy backend:

```
GET  /rest/interface/wireguard              → WireGuardInterface[]
GET  /rest/interface/wireguard/[id]/peers   → WireGuardPeer[]
GET  /rest/interface/ovpn-server            → OpenVPNServer[]
GET  /rest/interface/ovpn-client            → OpenVPNClient[]
GET  /rest/interface/l2tp-server            → L2TPServer
GET  /rest/interface/l2tp-client            → L2TPClient[]
GET  /rest/interface/pptp-server            → PPTPServer
GET  /rest/interface/pptp-client            → PPTPClient[]
GET  /rest/interface/sstp-server            → SSTPServer
GET  /rest/interface/sstp-client            → SSTPClient[]
GET  /rest/ip/ipsec/peer                    → IPsecPeer[]
GET  /rest/ip/ipsec/active                  → IPsecActive[]
GET  /rest/ppp/active                       → PPPActive[]
GET  /rest/ppp/secret                       → PPPSecret[]
```

### Backend Provisioning

VPN server provisioning implemented in `apps/backend/internal/provisioning/vpnserver/`:

**Files**:

- `ikev2_server.go` - IKEv2/IPsec server setup
- `ppp_servers.go` - L2TP/PPTP/SSTP PPP server setup

**Provisioning Flow**:

1. User configures VPN server via UI form
2. Apply mutation sent to backend GraphQL
3. Backend validates and applies via RouterOS API
4. Frontend refetches query to reflect changes

## Cross-References

- **Doc 01 (Architecture)**: Overall frontend/backend architecture
- **Doc 03 (XState Machines)**: For future multi-step VPN setup flows
- **Doc 12 (API Client)**: Apollo Client setup and query patterns
- **Design System Docs**: Theme tokens, responsive design patterns

## Implementation Checklist

When extending VPN features:

- [ ] Add new protocol queries following existing hook patterns
- [ ] Create pattern component with mobile/desktop presenters if needed
- [ ] Update `vpnKeys` query key hierarchy
- [ ] Add mutation for create/update/delete operations
- [ ] Update `useVPNStats` to aggregate new protocol stats
- [ ] Add protocol to `VPNProtocol` type in `@nasnet/core/types`
- [ ] Implement responsive design (mobile/tablet/desktop)
- [ ] Test with WCAG AAA accessibility standards
- [ ] Document in this file
