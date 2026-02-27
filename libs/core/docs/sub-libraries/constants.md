---
sidebar_position: 3
title: Constants Reference
---

# Constants Library Reference

The **`@nasnet/core/constants`** library provides static application constants organized by domain.
These are used throughout the frontend for type-safe navigation, API calls, and real-time
communication.

**File Location:** `libs/core/constants/src/`

**Main Exports:**

- `ROUTES` - Navigation route constants
- `API_ENDPOINTS` - Backend API endpoint definitions
- `SOCKET_EVENTS_EMIT` - Client → Server WebSocket events
- `SOCKET_EVENTS_ON` - Server → Client WebSocket events
- `WELL_KNOWN_PORTS` - Database of well-known service ports

---

## Routes (ROUTES)

**File:** `libs/core/constants/src/routes.ts`

The `ROUTES` object defines all application navigation routes. These are used with the TanStack
Router for type-safe navigation.

**Type:**

```typescript
export const ROUTES: {
  [key: string]: string | ((params: string) => string);
};
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
```

### Main Navigation

| Constant    | Route        | Purpose               |
| ----------- | ------------ | --------------------- |
| `HOME`      | `/`          | Application home page |
| `DASHBOARD` | `/dashboard` | Main dashboard view   |

**Usage:**

```typescript
import { ROUTES } from '@nasnet/core/constants';
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();
navigate({ to: ROUTES.DASHBOARD });
```

### Router Management

| Constant          | Route                   | Purpose                    |
| ----------------- | ----------------------- | -------------------------- |
| `ROUTER_LIST`     | `/routers`              | List all connected routers |
| `ROUTER_DETAIL`   | `/routers/:id`          | Router detail view         |
| `ROUTER_SETTINGS` | `/routers/:id/settings` | Router settings page       |

### Router Panel Routes (Epic 0.9)

The router panel provides tab-based access to router functions:

| Constant          | Route                  | Tab Purpose                  |
| ----------------- | ---------------------- | ---------------------------- |
| `ROUTER_PANEL`    | `/router/:id`          | Router panel entry point     |
| `ROUTER_OVERVIEW` | `/router/:id`          | System overview & status     |
| `ROUTER_WIFI`     | `/router/:id/wifi`     | Wireless configuration       |
| `ROUTER_VPN`      | `/router/:id/vpn`      | VPN client/server management |
| `ROUTER_FIREWALL` | `/router/:id/firewall` | Firewall rules & policies    |
| `ROUTER_DHCP`     | `/router/:id/dhcp`     | DHCP configuration           |
| `ROUTER_NETWORK`  | `/router/:id/network`  | Network interfaces           |
| `ROUTER_LOGS`     | `/router/:id/logs`     | System logs                  |

### Network Configuration

| Constant   | Route               | Purpose                     |
| ---------- | ------------------- | --------------------------- |
| `WAN`      | `/network/wan`      | WAN interface configuration |
| `LAN`      | `/network/lan`      | LAN interface configuration |
| `FIREWALL` | `/network/firewall` | Firewall policy management  |
| `ROUTING`  | `/network/routing`  | Routing table management    |
| `NAT`      | `/network/nat`      | NAT rule configuration      |
| `QOS`      | `/network/qos`      | Quality of Service settings |

### Wireless Management

| Constant      | Route                  | Purpose               |
| ------------- | ---------------------- | --------------------- |
| `WIFI`        | `/wifi`                | WiFi overview         |
| `WIFI_DETAIL` | `/wifi/:interfaceName` | WiFi interface detail |

### VPN Management (Dashboard Redesign)

| Constant            | Route                             | Purpose            |
| ------------------- | --------------------------------- | ------------------ |
| `VPN`               | `/vpn`                            | Main VPN dashboard |
| `VPN_SERVERS`       | `/vpn/servers`                    | VPN server list    |
| `VPN_CLIENTS`       | `/vpn/clients`                    | VPN client list    |
| `VPN_SERVER_DETAIL` | `/vpn/servers/:protocol/:id`      | Server detail view |
| `VPN_CLIENT_DETAIL` | `/vpn/clients/:protocol/:id`      | Client detail view |
| `VPN_SERVER_ADD`    | `/vpn/servers/:protocol/add`      | Add new server     |
| `VPN_CLIENT_ADD`    | `/vpn/clients/:protocol/add`      | Add new client     |
| `VPN_SERVER_EDIT`   | `/vpn/servers/:protocol/:id/edit` | Edit server        |
| `VPN_CLIENT_EDIT`   | `/vpn/clients/:protocol/:id/edit` | Edit client        |

### DHCP Management

| Constant       | Route                   | Purpose                   |
| -------------- | ----------------------- | ------------------------- |
| `DHCP`         | `/network/dhcp`         | DHCP overview             |
| `DHCP_SERVER`  | `/network/dhcp/server`  | DHCP server configuration |
| `DHCP_CLIENTS` | `/network/dhcp/clients` | Active DHCP leases        |

### Monitoring & Logs

| Constant  | Route      | Purpose              |
| --------- | ---------- | -------------------- |
| `STATUS`  | `/status`  | System status        |
| `MONITOR` | `/monitor` | Real-time monitoring |
| `NETWORK` | `/network` | Network dashboard    |
| `LOGS`    | `/logs`    | Log viewer           |
| `METRICS` | `/metrics` | Performance metrics  |

### System Settings

| Constant            | Route                | Purpose              |
| ------------------- | -------------------- | -------------------- |
| `SETTINGS`          | `/settings`          | Settings home        |
| `SYSTEM_SETTINGS`   | `/settings/system`   | System configuration |
| `NETWORK_SETTINGS`  | `/settings/network`  | Network settings     |
| `SECURITY_SETTINGS` | `/settings/security` | Security settings    |
| `BACKUP`            | `/settings/backup`   | Backup management    |
| `RESTORE`           | `/settings/restore`  | Restore from backup  |

### User Management

| Constant  | Route      | Purpose          |
| --------- | ---------- | ---------------- |
| `PROFILE` | `/profile` | User profile     |
| `ACCOUNT` | `/account` | Account settings |
| `LOGOUT`  | `/logout`  | Logout page      |

### Error Pages

| Constant       | Route  | Purpose                     |
| -------------- | ------ | --------------------------- |
| `NOT_FOUND`    | `/404` | 404 page                    |
| `UNAUTHORIZED` | `/401` | 401 authentication required |
| `FORBIDDEN`    | `/403` | 403 access denied           |
| `SERVER_ERROR` | `/500` | 500 server error            |

---

## API Endpoints (API_ENDPOINTS)

**File:** `libs/core/constants/src/api-endpoints.ts`

The `API_ENDPOINTS` object defines all backend API endpoint paths. Endpoints can be:

- **Static strings** - Fixed endpoints (e.g., `/api/v1/routers`)
- **Factory functions** - Parameters (e.g., `ROUTER_DETAIL(id)` → `/api/v1/routers/{id}`)

**Type:**

```typescript
export const API_ENDPOINTS: {
  [key: string]: string | ((...args: string[]) => string);
};
```

### Router Management Endpoints

| Constant            | Path                              | Type     | Parameters   |
| ------------------- | --------------------------------- | -------- | ------------ |
| `ROUTER_LIST`       | `/api/v1/routers`                 | string   | —            |
| `ROUTER_DETAIL`     | `/api/v1/routers/{id}`            | function | `id: string` |
| `ROUTER_ADD`        | `/api/v1/routers`                 | string   | —            |
| `ROUTER_UPDATE`     | `/api/v1/routers/{id}`            | function | `id: string` |
| `ROUTER_DELETE`     | `/api/v1/routers/{id}`            | function | `id: string` |
| `ROUTER_CONNECT`    | `/api/v1/routers/{id}/connect`    | function | `id: string` |
| `ROUTER_DISCONNECT` | `/api/v1/routers/{id}/disconnect` | function | `id: string` |

**Usage:**

```typescript
import { API_ENDPOINTS } from '@nasnet/core/constants';

const listUrl = API_ENDPOINTS.ROUTER_LIST; // '/api/v1/routers'
const detailUrl = API_ENDPOINTS.ROUTER_DETAIL('router-123'); // '/api/v1/routers/router-123'
```

### Router Info & Status Endpoints

| Constant               | Path                           | Type   |
| ---------------------- | ------------------------------ | ------ |
| `ROUTER_STATUS`        | `/api/v1/router/status`        | string |
| `ROUTER_INFO`          | `/api/v1/router/info`          | string |
| `ROUTER_UPTIME`        | `/api/v1/router/uptime`        | string |
| `ROUTER_REBOOT`        | `/api/v1/router/reboot`        | string |
| `ROUTER_FACTORY_RESET` | `/api/v1/router/factory-reset` | string |

### Network Configuration Endpoints

| Constant          | Path                                  | Type     | Parameters   |
| ----------------- | ------------------------------------- | -------- | ------------ |
| `WAN_CONFIG`      | `/api/v1/network/wan`                 | string   | —            |
| `WAN_DETAIL`      | `/api/v1/network/wan/{id}`            | function | `id: string` |
| `LAN_CONFIG`      | `/api/v1/network/lan`                 | string   | —            |
| `LAN_INTERFACE`   | `/api/v1/network/lan/{id}`            | function | `id: string` |
| `FIREWALL_RULES`  | `/api/v1/network/firewall/rules`      | string   | —            |
| `FIREWALL_RULE`   | `/api/v1/network/firewall/rules/{id}` | function | `id: string` |
| `FIREWALL_NAT`    | `/api/v1/network/firewall/nat`        | string   | —            |
| `FIREWALL_MANGLE` | `/api/v1/network/firewall/mangle`     | string   | —            |
| `ROUTING_TABLE`   | `/api/v1/network/routing/table`       | string   | —            |
| `ROUTING_ROUTE`   | `/api/v1/network/routing/routes/{id}` | function | `id: string` |
| `QOS_CONFIG`      | `/api/v1/network/qos`                 | string   | —            |

### DHCP Endpoints

| Constant      | Path                                | Type     | Parameters    |
| ------------- | ----------------------------------- | -------- | ------------- |
| `DHCP_CONFIG` | `/api/v1/network/dhcp`              | string   | —             |
| `DHCP_LEASES` | `/api/v1/network/dhcp/leases`       | string   | —             |
| `DHCP_LEASE`  | `/api/v1/network/dhcp/leases/{mac}` | function | `mac: string` |

### VPN Endpoints

| Constant            | Path                                      | Type     | Parameters   |
| ------------------- | ----------------------------------------- | -------- | ------------ |
| `VPN_CONNECTIONS`   | `/api/v1/vpn/connections`                 | string   | —            |
| `VPN_CONNECTION`    | `/api/v1/vpn/connections/{id}`            | function | `id: string` |
| `VPN_CONNECT`       | `/api/v1/vpn/connections/{id}/connect`    | function | `id: string` |
| `VPN_DISCONNECT`    | `/api/v1/vpn/connections/{id}/disconnect` | function | `id: string` |
| `VPN_CREATE`        | `/api/v1/vpn/connections`                 | string   | —            |
| `VPN_UPDATE`        | `/api/v1/vpn/connections/{id}`            | function | `id: string` |
| `VPN_DELETE`        | `/api/v1/vpn/connections/{id}`            | function | `id: string` |
| `VPN_SERVER_CONFIG` | `/api/v1/vpn/server`                      | string   | —            |
| `VPN_CLIENT_CONFIG` | `/api/v1/vpn/client`                      | string   | —            |
| `VPN_CERTIFICATE`   | `/api/v1/vpn/certificate`                 | string   | —            |
| `VPN_KEY`           | `/api/v1/vpn/key`                         | string   | —            |

### Configuration Endpoints

| Constant          | Path                      | Type   |
| ----------------- | ------------------------- | ------ |
| `CONFIG_GET`      | `/api/v1/config`          | string |
| `CONFIG_SET`      | `/api/v1/config`          | string |
| `CONFIG_APPLY`    | `/api/v1/config/apply`    | string |
| `CONFIG_ROLLBACK` | `/api/v1/config/rollback` | string |
| `CONFIG_BACKUP`   | `/api/v1/config/backup`   | string |
| `CONFIG_RESTORE`  | `/api/v1/config/restore`  | string |
| `CONFIG_HISTORY`  | `/api/v1/config/history`  | string |
| `CONFIG_EXPORT`   | `/api/v1/config/export`   | string |
| `CONFIG_IMPORT`   | `/api/v1/config/import`   | string |

### Monitoring & Logs Endpoints

| Constant            | Path                        | Type   |
| ------------------- | --------------------------- | ------ |
| `LOGS_LIST`         | `/api/v1/logs`              | string |
| `LOGS_SYSTEM`       | `/api/v1/logs/system`       | string |
| `LOGS_FIREWALL`     | `/api/v1/logs/firewall`     | string |
| `LOGS_VPN`          | `/api/v1/logs/vpn`          | string |
| `LOGS_SEARCH`       | `/api/v1/logs/search`       | string |
| `METRICS`           | `/api/v1/metrics`           | string |
| `METRICS_CPU`       | `/api/v1/metrics/cpu`       | string |
| `METRICS_MEMORY`    | `/api/v1/metrics/memory`    | string |
| `METRICS_DISK`      | `/api/v1/metrics/disk`      | string |
| `METRICS_NETWORK`   | `/api/v1/metrics/network`   | string |
| `METRICS_BANDWIDTH` | `/api/v1/metrics/bandwidth` | string |

### System Management Endpoints

| Constant          | Path                      | Type   |
| ----------------- | ------------------------- | ------ |
| `SYSTEM_INFO`     | `/api/v1/system/info`     | string |
| `SYSTEM_STATS`    | `/api/v1/system/stats`    | string |
| `SYSTEM_TIME`     | `/api/v1/system/time`     | string |
| `SYSTEM_NTP`      | `/api/v1/system/ntp`      | string |
| `SYSTEM_DNS`      | `/api/v1/system/dns`      | string |
| `SYSTEM_HOSTNAME` | `/api/v1/system/hostname` | string |

### Authentication Endpoints

| Constant       | Path                   | Type   |
| -------------- | ---------------------- | ------ |
| `AUTH_LOGIN`   | `/api/v1/auth/login`   | string |
| `AUTH_LOGOUT`  | `/api/v1/auth/logout`  | string |
| `AUTH_REFRESH` | `/api/v1/auth/refresh` | string |
| `AUTH_VERIFY`  | `/api/v1/auth/verify`  | string |

### User Endpoints

| Constant               | Path                           | Type   |
| ---------------------- | ------------------------------ | ------ |
| `USER_PROFILE`         | `/api/v1/user/profile`         | string |
| `USER_CHANGE_PASSWORD` | `/api/v1/user/change-password` | string |
| `USER_PREFERENCES`     | `/api/v1/user/preferences`     | string |

### Health Check Endpoints

| Constant       | Path                   | Type   |
| -------------- | ---------------------- | ------ |
| `HEALTH`       | `/api/v1/health`       | string |
| `HEALTH_PING`  | `/api/v1/health/ping`  | string |
| `HEALTH_READY` | `/api/v1/health/ready` | string |
| `HEALTH_LIVE`  | `/api/v1/health/live`  | string |

---

## Socket Events

**File:** `libs/core/constants/src/socket-events.ts`

WebSocket events for real-time communication are organized into two directions:

### Client → Server Events (SOCKET_EVENTS_EMIT)

These are events the client sends to the server.

**Connection Events:** | Event | Name | Payload | |-------|------|---------| | `CONNECT` | `connect`
| — | | `DISCONNECT` | `disconnect` | — |

**Router Events:** | Event | Name | Purpose | |-------|------|---------| | `ROUTER_SUBSCRIBE` |
`router:subscribe` | Subscribe to router updates | | `ROUTER_UNSUBSCRIBE` | `router:unsubscribe` |
Stop router updates | | `ROUTER_REQUEST_STATUS` | `router:request-status` | Request immediate status
| | `ROUTER_REQUEST_CONFIG` | `router:request-config` | Request configuration |

**VPN Events:** | Event | Name | Purpose | |-------|------|---------| | `VPN_SUBSCRIBE` |
`vpn:subscribe` | Subscribe to VPN updates | | `VPN_UNSUBSCRIBE` | `vpn:unsubscribe` | Stop VPN
updates | | `VPN_REQUEST_STATUS` | `vpn:request-status` | Request VPN status | | `VPN_CONNECT` |
`vpn:connect` | Connect to VPN | | `VPN_DISCONNECT` | `vpn:disconnect` | Disconnect VPN |

**Firewall Events:** | Event | Name | Purpose | |-------|------|---------| | `FIREWALL_SUBSCRIBE` |
`firewall:subscribe` | Subscribe to firewall updates | | `FIREWALL_UNSUBSCRIBE` |
`firewall:unsubscribe` | Stop firewall updates | | `FIREWALL_RULE_UPDATE` | `firewall:rule-update` |
Update firewall rule |

**Network Events:** | Event | Name | Purpose | |-------|------|---------| | `NETWORK_SUBSCRIBE` |
`network:subscribe` | Subscribe to network updates | | `NETWORK_UNSUBSCRIBE` | `network:unsubscribe`
| Stop network updates | | `NETWORK_INTERFACE_UPDATE` | `network:interface-update` | Update
interface |

**Monitoring Events:** | Event | Name | Purpose | |-------|------|---------| | `METRICS_SUBSCRIBE` |
`metrics:subscribe` | Subscribe to metrics | | `METRICS_UNSUBSCRIBE` | `metrics:unsubscribe` | Stop
metrics | | `LOGS_SUBSCRIBE` | `logs:subscribe` | Subscribe to logs | | `LOGS_UNSUBSCRIBE` |
`logs:unsubscribe` | Stop logs |

**Configuration Events:** | Event | Name | Purpose | |-------|------|---------| | `CONFIG_APPLY` |
`config:apply` | Apply configuration | | `CONFIG_ROLLBACK` | `config:rollback` | Rollback
configuration |

**System Events:** | Event | Name | Purpose | |-------|------|---------| | `SYSTEM_REBOOT` |
`system:reboot` | Request reboot | | `SYSTEM_SHUTDOWN` | `system:shutdown` | Request shutdown |

**Usage Example:**

```typescript
import { SOCKET_EVENTS_EMIT } from '@nasnet/core/constants';
import { io } from 'socket.io-client';

const socket = io('http://localhost:8080');

socket.emit(SOCKET_EVENTS_EMIT.ROUTER_SUBSCRIBE, {
  routerId: 'router-123',
});
```

### Server → Client Events (SOCKET_EVENTS_ON)

These are events the server sends to the client.

**Connection Events:** | Event | Name | Meaning | |-------|------|---------| | `CONNECTED` |
`connected` | Connection established | | `DISCONNECTED` | `disconnected` | Connection closed | |
`ERROR` | `error` | Connection error | | `RECONNECT` | `reconnect` | Reconnected successfully | |
`RECONNECT_ATTEMPT` | `reconnect_attempt` | Attempting to reconnect |

**Router Events:** | Event | Name | Meaning | |-------|------|---------| | `ROUTER_STATUS_UPDATE` |
`router:status-update` | Router status changed | | `ROUTER_CONFIG_UPDATE` | `router:config-update` |
Router config changed | | `ROUTER_CONNECTED` | `router:connected` | Router connected | |
`ROUTER_DISCONNECTED` | `router:disconnected` | Router disconnected | | `ROUTER_ERROR` |
`router:error` | Router error occurred |

**VPN Events:** | Event | Name | Meaning | |-------|------|---------| | `VPN_STATUS_UPDATE` |
`vpn:status-update` | VPN status changed | | `VPN_CONNECTION_UPDATED` | `vpn:connection-updated` |
VPN connection updated | | `VPN_CONNECTED` | `vpn:connected` | VPN connected | | `VPN_DISCONNECTED`
| `vpn:disconnected` | VPN disconnected | | `VPN_ERROR` | `vpn:error` | VPN error |

**Firewall Events:** | Event | Name | Meaning | |-------|------|---------| | `FIREWALL_RULE_UPDATED`
| `firewall:rule-updated` | Rule updated | | `FIREWALL_RULE_ADDED` | `firewall:rule-added` | Rule
added | | `FIREWALL_RULE_DELETED` | `firewall:rule-deleted` | Rule deleted | |
`FIREWALL_RULES_RELOADED` | `firewall:rules-reloaded` | All rules reloaded | | `FIREWALL_ERROR` |
`firewall:error` | Firewall error |

**Network Events:** | Event | Name | Meaning | |-------|------|---------| |
`NETWORK_INTERFACE_UPDATED` | `network:interface-updated` | Interface updated | |
`NETWORK_INTERFACE_UP` | `network:interface-up` | Interface came online | | `NETWORK_INTERFACE_DOWN`
| `network:interface-down` | Interface went offline | | `NETWORK_IP_CHANGED` | `network:ip-changed`
| IP address changed | | `NETWORK_ERROR` | `network:error` | Network error |

**Metrics Events:** | Event | Name | Meaning | |-------|------|---------| | `METRICS_UPDATE` |
`metrics:update` | General metrics updated | | `METRICS_CPU_UPDATE` | `metrics:cpu-update` | CPU
metrics updated | | `METRICS_MEMORY_UPDATE` | `metrics:memory-update` | Memory metrics updated | |
`METRICS_DISK_UPDATE` | `metrics:disk-update` | Disk metrics updated | | `METRICS_NETWORK_UPDATE` |
`metrics:network-update` | Network metrics updated |

**Log Events:** | Event | Name | Meaning | |-------|------|---------| | `LOG_ENTRY` | `log:entry` |
Single log entry | | `LOG_ENTRIES` | `log:entries` | Multiple log entries |

**Configuration Events:** | Event | Name | Meaning | |-------|------|---------| | `CONFIG_APPLIED` |
`config:applied` | Config applied successfully | | `CONFIG_APPLY_FAILED` | `config:apply-failed` |
Config apply failed | | `CONFIG_ROLLED_BACK` | `config:rolled-back` | Config rolled back | |
`CONFIG_ROLLBACK_FAILED` | `config:rollback-failed` | Config rollback failed |

**System Events:** | Event | Name | Meaning | |-------|------|---------| | `SYSTEM_REBOOTING` |
`system:rebooting` | System rebooting | | `SYSTEM_SHUTTING_DOWN` | `system:shutting-down` | System
shutting down | | `SYSTEM_TEMPERATURE_WARNING` | `system:temperature-warning` | Temperature warning
| | `SYSTEM_TEMPERATURE_CRITICAL` | `system:temperature-critical` | Temperature critical |

**Alert Events:** | Event | Name | Meaning | |-------|------|---------| | `ALERT` | `alert` | Alert
notification | | `WARNING` | `warning` | Warning notification | | `INFO` | `info` | Info
notification | | `SUCCESS` | `success` | Success notification |

**Usage Example:**

```typescript
import { SOCKET_EVENTS_ON } from '@nasnet/core/constants';

socket.on(SOCKET_EVENTS_ON.ROUTER_STATUS_UPDATE, (data) => {
  console.log('Router status:', data);
  updateUI(data);
});
```

### Type Exports

```typescript
// Union of all socket events
export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

// Union of client → server events
export type SocketEmitEvent = (typeof SOCKET_EVENTS_EMIT)[keyof typeof SOCKET_EVENTS_EMIT];

// Union of server → client events
export type SocketOnEvent = (typeof SOCKET_EVENTS_ON)[keyof typeof SOCKET_EVENTS_ON];
```

---

## Well-Known Ports

**File:** `libs/core/constants/src/well-known-ports.ts`

Comprehensive database of ~100 well-known TCP/UDP service ports for quick lookup and UI suggestions.

### Port Entry Structure

```typescript
export interface WellKnownPort {
  port: number; // Port number (1-65535)
  service: string; // Service name (e.g., "HTTP")
  protocol: PortProtocol; // 'tcp' | 'udp' | 'both'
  category: PortCategory; // Service category
  description?: string; // Human-readable description
  builtIn: boolean; // true = read-only, false = user-editable
}
```

### Port Categories

| Category     | Name              | Examples                                         |
| ------------ | ----------------- | ------------------------------------------------ |
| `web`        | Web Services      | HTTP (80), HTTPS (443), Vite (5173)              |
| `secure`     | Secure Access     | SSH (22), RDP (3389), VNC (5900)                 |
| `database`   | Database          | MySQL (3306), PostgreSQL (5432), MongoDB (27017) |
| `messaging`  | Messaging         | RabbitMQ (5672), MQTT (1883), Kafka (9092)       |
| `mail`       | Email             | SMTP (25), IMAP (143), POP3 (110)                |
| `network`    | Network/VPN       | DNS (53), DHCP (67), OpenVPN (1194)              |
| `system`     | System            | Syslog (514), SNMP (161), NTP (123)              |
| `containers` | Containers/DevOps | Docker (2375), Kubernetes (6443), Consul (8500)  |
| `mikrotik`   | MikroTik          | Winbox (8291), RouterOS API (8728)               |

### Database Overview

**~100 Ports** covering all major categories:

- **15 Web** - HTTP variants, dev servers (Vite, Angular, etc.)
- **12 Secure** - SSH, RDP, VNC, Telnet, FTP
- **16 Database** - SQL, NoSQL, time-series databases
- **10 Mail** - SMTP, IMAP, POP3, variants
- **11 Messaging** - RabbitMQ, Kafka, MQTT, XMPP
- **20 Network** - DNS, DHCP, VPN (OpenVPN, WireGuard), IPsec
- **10 Containers** - Docker, Kubernetes, etcd, Consul
- **5 MikroTik** - Winbox, RouterOS API, MAC Winbox

### Lookup Functions

**`getServiceByPort(port, protocol?)`**

Look up service name by port number.

```typescript
export function getServiceByPort(port: number, protocol?: PortProtocol): string | null;

// Examples:
getServiceByPort(80); // 'HTTP'
getServiceByPort(443, 'tcp'); // 'HTTPS'
getServiceByPort(12345); // null (unknown port)
```

**`getPortEntry(port, protocol?)`**

Get complete port entry with all metadata.

```typescript
export function getPortEntry(port: number, protocol?: PortProtocol): WellKnownPort | null;

// Example:
const entry = getPortEntry(22);
// {
//   port: 22,
//   service: 'SSH',
//   protocol: 'tcp',
//   category: 'secure',
//   description: 'Secure Shell',
//   builtIn: true
// }
```

**`getPortsByCategory(category)`**

Get all ports in a specific category.

```typescript
export function getPortsByCategory(category: PortCategory): WellKnownPort[];

// Example:
const webPorts = getPortsByCategory('web');
// Returns: [HTTP, HTTPS, HTTP-Alt, Vite, Angular, etc.]
```

**`searchPorts(query, limit = 10)`**

Search ports by service name or port number with intelligent matching.

```typescript
export function searchPorts(query: string, limit?: number): WellKnownPort[];

// Examples:
searchPorts('http'); // HTTP, HTTPS, HTTP-Alt, Vite, etc.
searchPorts('22'); // SSH
searchPorts('sql'); // MySQL, MSSQL, PostgreSQL
searchPorts('3'); // All ports containing '3' (MySQL, HTTPS-Alt, etc.)
```

**`getSuggestionsByCategory(categories?)`**

Get suggested ports grouped by category for dropdown display.

```typescript
export function getSuggestionsByCategory(
  categories?: PortCategory[]
): Record<PortCategory, WellKnownPort[]>;

// Example:
const suggestions = getSuggestionsByCategory(['web', 'secure', 'mikrotik']);
// {
//   web: [HTTP, HTTPS, HTTP-Alt, Vite, Angular],
//   secure: [SSH, RDP, VNC, Telnet, FTP],
//   mikrotik: [Winbox, RouterOS-API, RouterOS-API-SSL]
// }
```

### Category Labels

```typescript
export const PORT_CATEGORY_LABELS: Record<PortCategory, string> = {
  web: 'Web Services',
  secure: 'Secure Access',
  database: 'Database',
  messaging: 'Messaging',
  mail: 'Email',
  network: 'Network/VPN',
  system: 'System',
  containers: 'Containers',
  mikrotik: 'MikroTik',
};
```

### Port Presets

Pre-configured port groups for common use cases:

```typescript
export const PORT_PRESETS = {
  webServer: [80, 443], // HTTP, HTTPS
  mailServer: [25, 465, 587, 993, 995], // SMTP, Submission, IMAPS, POP3S
  sshAccess: [22], // SSH
  mikrotikManagement: [8291, 8728, 8729], // Winbox, RouterOS API
  databaseCommon: [3306, 5432, 27017, 6379], // MySQL, PostgreSQL, MongoDB, Redis
  vpnPorts: [1194, 51820, 500, 4500, 1701, 1723], // OpenVPN, WireGuard, IPsec, L2TP, PPTP
};
```

**Usage:**

```typescript
import { PORT_PRESETS } from '@nasnet/core/constants';

const webServerPorts = PORT_PRESETS.webServer; // [80, 443]
const vpnPorts = PORT_PRESETS.vpnPorts; // [1194, 51820, 500, 4500, 1701, 1723]
```

### MikroTik-Specific Ports

Special MikroTik RouterOS ports included in the database:

| Port  | Service          | Purpose                      |
| ----- | ---------------- | ---------------------------- |
| 8291  | Winbox           | MikroTik GUI management tool |
| 8728  | RouterOS API     | API (unencrypted)            |
| 8729  | RouterOS API SSL | API over TLS                 |
| 2000  | Bandwidth Test   | MikroTik bandwidth testing   |
| 20561 | MAC Winbox       | MAC-based Winbox (UDP)       |

---

## Usage Examples

### Complete Example: Port Input Component

```typescript
import {
  WELL_KNOWN_PORTS,
  getServiceByPort,
  searchPorts,
  PORT_CATEGORY_LABELS,
  PORT_PRESETS
} from '@nasnet/core/constants';

function PortInput() {
  const [query, setQuery] = useState('');

  // Search as user types
  const suggestions = searchPorts(query, 10);

  // Handle port selection
  const handleSelectPort = (port: number) => {
    const service = getServiceByPort(port);
    console.log(`Selected port ${port}: ${service}`);
  };

  // Show category groups
  const renderSuggestions = () => {
    return (
      <div>
        <h3>Quick Presets</h3>
        {Object.entries(PORT_PRESETS).map(([name, ports]) => (
          <button key={name} onClick={() => setQuery(ports[0].toString())}>
            {name}: {ports.join(', ')}
          </button>
        ))}

        <h3>Search Results</h3>
        {suggestions.map((port) => (
          <div
            key={`${port.port}-${port.protocol}`}
            onClick={() => handleSelectPort(port.port)}
          >
            {port.port} - {port.service} ({PORT_CATEGORY_LABELS[port.category]})
          </div>
        ))}
      </div>
    );
  };

  return (
    <input
      placeholder="Port number or service name"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onBlur={renderSuggestions}
    />
  );
}
```

### Complete Example: Navigation

```typescript
import { ROUTES } from '@nasnet/core/constants';
import { useNavigate } from '@tanstack/react-router';

function RouterPanel({ routerId }: { routerId: string }) {
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate({ to: ROUTES.ROUTER_LIST })}>
        Back to List
      </button>
      <button onClick={() => navigate({ to: ROUTES.ROUTER_OVERVIEW })}>
        Overview
      </button>
      <button onClick={() => navigate({ to: ROUTES.ROUTER_WIFI })}>
        WiFi
      </button>
      <button onClick={() => navigate({ to: ROUTES.ROUTER_FIREWALL })}>
        Firewall
      </button>
    </div>
  );
}
```

### Complete Example: Socket Events

```typescript
import {
  SOCKET_EVENTS_EMIT,
  SOCKET_EVENTS_ON,
  type SocketEmitEvent,
  type SocketOnEvent,
} from '@nasnet/core/constants';
import { io } from 'socket.io-client';

const socket = io('http://localhost:8080');

// Subscribe to router updates
socket.emit(SOCKET_EVENTS_EMIT.ROUTER_SUBSCRIBE, { routerId: 'router-123' });

// Listen for updates
socket.on(SOCKET_EVENTS_ON.ROUTER_STATUS_UPDATE, (status) => {
  console.log('Router status:', status);
});

// Listen for disconnection
socket.on(SOCKET_EVENTS_ON.ROUTER_DISCONNECTED, () => {
  console.log('Router disconnected');
});
```

---

## See Also

- [README.md](../README.md) - Core library overview
- [intro.md](../intro.md) - Architecture and structure
- [utils.md](./utils.md) - Utility functions (Wave 1C)
- [types.md](./types.md) - Type definitions (Wave 1B)
