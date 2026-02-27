# Network Configuration Guide

Cross-cutting guide for network types, IP validation, subnet calculation, port lookup, and VPN
protocols.

## Table of Contents

1. [Network Type Hierarchy](#network-type-hierarchy)
2. [IP Address Validation Chain](#ip-address-validation-chain)
3. [Subnet Calculation Examples](#subnet-calculation-examples)
4. [Port Lookup and Categorization](#port-lookup-and-categorization)
5. [VPN Protocol Type Differences](#vpn-protocol-type-differences)
6. [Type Flow: Forms → GraphQL → Backend](#type-flow-forms--graphql--backend)

---

## Network Type Hierarchy

NasNetConnect organizes network configuration into a clear hierarchy: **WAN → LAN → VPN →
Interfaces**.

### WAN (Wide Area Network) - `types/router/wan.ts`

WAN connections provide external internet connectivity. Supports 4 connection types:

```typescript
// WAN link summary
export interface WANLinkConfig {
  id: string;
  name: string;
  type: 'pppoe' | 'dhcp' | 'static' | 'lte';
  isEnabled: boolean;
}

// Active WAN link with full configuration
export interface WANLink {
  id: string;
  name: string;
  isEnabled: boolean;
  config: WANPPPoEConfig | WANDHCPConfig | WANStaticConfig | WANLTEConfig;
}
```

**WAN Types:**

| Type       | Purpose                 | Key Fields                                     |
| ---------- | ----------------------- | ---------------------------------------------- |
| **PPPoE**  | DSL/dial-up connections | interface, username, password, profile         |
| **DHCP**   | ISP-assigned dynamic IP | interface, usePeerDNS, hasDefaultRoute         |
| **Static** | Manual static IP config | interface, address (CIDR), gateway, dnsServers |
| **LTE**    | Mobile/cellular backup  | interface, apn, networkNameLabel               |

**Example - Static WAN:**

```typescript
const staticWAN: WANStaticConfig = {
  interface: 'ether1',
  address: '203.0.113.50/24', // CIDR format required
  gateway: '203.0.113.1',
  dnsServers: ['8.8.8.8', '8.8.4.4'],
};
```

---

### LAN (Local Area Network) - `types/router/lan.ts`

LAN handles internal network infrastructure with 3 key abstractions:

```typescript
// Physical/logical interface
export interface LANInterface {
  id: string;
  name: string;
  type: 'ethernet' | 'bridge' | 'vlan';
  isEnabled: boolean;
  mtu?: number; // Defaults to 1500
}

// Bridge connecting multiple interfaces
export interface LANBridge {
  id: string;
  name: string;
  isEnabled: boolean;
  ports: readonly string[]; // ether1, ether2, etc.
  hasAdministrativePathCost: boolean;
  vlanMode?: 'on' | 'off';
}

// IP network assignment
export interface LANNetwork {
  id: string;
  name: string;
  address: string; // CIDR: "192.168.88.0/24"
  interface: string; // Which interface
  isDisabled: boolean;
}
```

**Example - Bridge Setup:**

```typescript
const bridge: LANBridge = {
  id: 'br0',
  name: 'Bridge 1',
  isEnabled: true,
  ports: ['ether2', 'ether3', 'ether4'],
  hasAdministrativePathCost: false,
  vlanMode: 'off',
};

// Assign IP to bridge
const network: LANNetwork = {
  id: 'net-br0',
  name: 'LAN Network',
  address: '192.168.88.0/24',
  interface: 'bridge1',
  isDisabled: false,
};
```

---

### Network Interfaces - `types/router/network.ts`

Low-level interface abstractions with status tracking:

```typescript
export type InterfaceType =
  | 'ether' // Ethernet port
  | 'bridge' // Bridge interface
  | 'vlan' // VLAN subinterface
  | 'wireless' // Wireless interface
  | 'wlan' // WiFi SSID
  | 'pppoe' // PPP over Ethernet
  | 'vpn' // VPN tunnel
  | 'wireguard' // WireGuard tunnel
  | 'vrrp' // Virtual Router Redundancy
  | 'bond' // Bond/link aggregation
  | 'loopback' // Loopback interface
  | 'lte' // Cellular modem
  | 'other';

export interface NetworkInterface {
  id: string;
  name: string;
  type: InterfaceType;
  status: 'running' | 'disabled';
  linkStatus: 'up' | 'down' | 'unknown';
  macAddress: string;
  mtu?: number;
  comment?: string;
}

// Traffic statistics
export interface TrafficStatistics {
  interfaceId: string;
  txBytes: number; // Transmitted
  rxBytes: number; // Received
  txPackets: number;
  rxPackets: number;
  txErrors: number;
  rxErrors: number;
  txDrops: number;
  rxDrops: number;
}
```

---

### VPN Configuration - `types/router/vpn.ts`

Comprehensive VPN support with protocol-specific configurations:

```typescript
export type VPNProtocol = 'wireguard' | 'openvpn' | 'l2tp' | 'pptp' | 'sstp' | 'ikev2';
export type VPNConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
export type VPNMode = 'server' | 'client';

// Generic VPN connection
export interface VPNConnection {
  id: string;
  name: string;
  protocol: VPNProtocol;
  status: VPNConnectionStatus;
}
```

**VPN Protocol Differences:**

| Protocol      | Mode          | Key Strength         | Config Complexity |
| ------------- | ------------- | -------------------- | ----------------- |
| **WireGuard** | Client/Server | Modern, fast, simple | ⭐ Very simple    |
| **OpenVPN**   | Client/Server | Wide compatibility   | ⭐⭐ Moderate     |
| **L2TP**      | Client/Server | Layer 2 tunneling    | ⭐⭐⭐ Complex    |
| **PPTP**      | Client/Server | Legacy, fast         | ⭐ Very simple    |
| **SSTP**      | Client/Server | Windows support      | ⭐⭐ Moderate     |
| **IKEv2**     | Client/Server | Mobile-friendly      | ⭐⭐⭐ Complex    |

---

## IP Address Validation Chain

IP validation flows through 3 layers: **utilities → Zod validators → form integration**.

### Layer 1: Basic Utilities - `utils/network/ip.ts`

Provides low-level IPv4 operations:

```typescript
// Validate single IPv4 address
export const isValidIPv4 = (ip: string): boolean;
// Example: "192.168.1.1" → true

// Validate CIDR notation
export const isValidSubnet = (cidr: string): boolean;
// Example: "192.168.1.0/24" → true

// Convert IP to number (for comparisons)
export const ipToNumber = (ip: string): number;
// "192.168.1.1" → 3232235777

// Reverse: number to IP
export const numberToIP = (num: number): string;
// 3232235777 → "192.168.1.1"

// Parse CIDR and extract components
export const parseCIDR = (cidr: string) => {
  network: string;      // "192.168.1.0"
  netmask: string;      // "255.255.255.0"
  broadcast: string;    // "192.168.1.255"
  prefix: number;       // 24
}

// Check if IP is in subnet
export const isIPInSubnet = (ip: string, cidr: string): boolean;
// "192.168.1.100" in "192.168.1.0/24" → true

// MAC address validation & formatting
export const isValidMACAddress = (mac: string): boolean;
export const formatMACAddress = (mac: string): string;
// "aabbccddeeff" → "AA:BB:CC:DD:EE:FF"
```

### Layer 2: Subnet Utilities - `utils/network/subnet.ts`

High-level subnet calculations:

```typescript
// Get host count in subnet
export const getHostCount = (prefix: number): number;
// 24 → 254 (256 - network - broadcast)
// 31 → 2 (RFC 3021 point-to-point)
// 32 → 1 (single host)

// Get first/last usable host
export const getFirstHost = (cidr: string): string | null;
export const getLastHost = (cidr: string): string | null;
// "192.168.1.0/24" → "192.168.1.1" / "192.168.1.254"

// Convert prefix to netmask
export const getPrefixMask = (prefix: number): string;
// 24 → "255.255.255.0"
// 16 → "255.255.0.0"

// Convert netmask to prefix
export const getMaskPrefix = (mask: string): number;
// "255.255.255.0" → 24
// "255.255.128.0" → 17 (even non-standard masks)

// Validate netmask
export const isValidMask = (mask: string): boolean;
// Must have contiguous 1s followed by 0s

// Comprehensive subnet info
export const getSubnetInfo = (cidr: string) => {
  network: string;
  firstHost: string | null;
  lastHost: string | null;
  broadcast: string;
  hostCount: number;
  prefix: number;
}
```

### Layer 3: Zod Validators - Form Integration

Integration with form validation in `forms/network-validators.ts`:

```typescript
// IP address validation (supports CIDR)
const IPAddressSchema = z
  .string()
  .refine(isValidIPv4, {
    message: 'Invalid IP address or CIDR notation (e.g., 192.168.1.1 or 10.0.0.0/8)',
  })
  .optional();

// Port validation (single port or range)
const PortSchema = z
  .string()
  .refine(isValidPort, {
    message: 'Invalid port or port range (1-65535, e.g., 80 or 8000-9000)',
  })
  .optional();

// Example: WAN Static Config Form
const WANStaticConfigSchema = z.object({
  interface: z.string().min(1),
  address: IPAddressSchema, // Must be CIDR format
  gateway: IPAddressSchema, // Just the IP (no CIDR)
  dnsServers: z.array(z.string()),
});
```

**Validation Error Messages:**

```
Invalid IP: "256.0.0.1"
→ "Invalid IP address or CIDR notation (e.g., 192.168.1.1 or 10.0.0.0/8)"

Invalid CIDR: "192.168.1.0/33"
→ "Invalid IP address or CIDR notation (e.g., 192.168.1.1 or 10.0.0.0/8)"

Invalid port: "99999"
→ "Invalid port or port range (1-65535, e.g., 80 or 8000-9000)"
```

---

## Subnet Calculation Examples

### Example 1: Planning a /24 Network

**Requirement:** Design a DHCP network for office devices

```typescript
import { getSubnetInfo } from '@nasnet/core/utils/network';

const info = getSubnetInfo('192.168.1.0/24');
// {
//   network: '192.168.1.0',
//   firstHost: '192.168.1.1',
//   lastHost: '192.168.1.254',
//   broadcast: '192.168.1.255',
//   hostCount: 254,
//   prefix: 24
// }

// In your DHCP configuration:
// - Gateway: 192.168.1.1
// - Pool start: 192.168.1.2
// - Pool end: 192.168.1.254
// - Netmask: 255.255.255.0
```

### Example 2: Comparing Subnet Sizes

```typescript
import { getHostCount, getPrefixMask } from '@nasnet/core/utils/network';

// Small office
getHostCount(25); // 126 hosts, netmask: 255.255.255.128
// - 1 gateway + 1 broadcast = 126 usable

// Medium office
getHostCount(24); // 254 hosts, netmask: 255.255.255.0

// Large network
getHostCount(22); // 1022 hosts, netmask: 255.255.252.0

// Point-to-point VPN (RFC 3021)
getHostCount(31); // 2 hosts, netmask: 255.255.255.254
// - No network/broadcast addresses needed
// - Used for router-to-router links
```

### Example 3: Checking IP Membership

```typescript
import { isIPInSubnet } from '@nasnet/core/utils/network';

// Verify client is in pool
isIPInSubnet('192.168.1.100', '192.168.1.0/24'); // true
isIPInSubnet('192.168.2.100', '192.168.1.0/24'); // false

// Guest network verification
isIPInSubnet('10.0.0.50', '10.0.0.0/25'); // true (first half)
isIPInSubnet('10.0.0.150', '10.0.0.0/25'); // false (second half, different subnet)
```

### Example 4: CIDR to Netmask Conversion

```typescript
import { getPrefixMask, getMaskPrefix } from '@nasnet/core/utils/network';

// CIDR notation → netmask
getPrefixMask(8); // "255.0.0.0"
getPrefixMask(16); // "255.255.0.0"
getPrefixMask(24); // "255.255.255.0"
getPrefixMask(25); // "255.255.255.128"

// Legacy netmask → CIDR prefix
getMaskPrefix('255.255.255.0'); // 24
getMaskPrefix('255.255.0.0'); // 16
getMaskPrefix('255.255.255.128'); // 25

// Validation: non-contiguous mask is invalid
getMaskPrefix('255.255.255.1'); // -1 (invalid)
```

---

## Port Lookup and Categorization

### Well-Known Ports Database - `constants/well-known-ports.ts`

Comprehensive port database (~100 common ports) organized by category:

```typescript
export interface WellKnownPort {
  port: number;
  service: string;
  protocol: 'tcp' | 'udp' | 'both';
  category: PortCategory; // 'web', 'secure', 'database', etc.
  description?: string;
  builtIn: boolean; // true = read-only
}

export type PortCategory =
  | 'web' // HTTP, HTTPS, dev servers
  | 'secure' // SSH, RDP, VNC, FTP
  | 'database' // MySQL, PostgreSQL, MongoDB, Redis
  | 'messaging' // AMQP, MQTT, Kafka, XMPP, IRC
  | 'mail' // SMTP, POP3, IMAP
  | 'network' // DNS, DHCP, NTP, SNMP, VPN, Syslog
  | 'system' // System services
  | 'containers' // Docker, Kubernetes, etcd, Consul
  | 'mikrotik'; // Winbox, RouterOS API, bandwidth test
```

**Port Database Sample:**

| Port  | Service      | Protocol | Category | Description                 |
| ----- | ------------ | -------- | -------- | --------------------------- |
| 22    | SSH          | TCP      | secure   | Secure Shell                |
| 53    | DNS          | both     | network  | Domain Name System          |
| 80    | HTTP         | TCP      | web      | Hypertext Transfer Protocol |
| 443   | HTTPS        | TCP      | web      | HTTP over TLS/SSL           |
| 3306  | MySQL        | TCP      | database | MySQL/MariaDB               |
| 5432  | PostgreSQL   | TCP      | database | PostgreSQL                  |
| 8291  | Winbox       | TCP      | mikrotik | MikroTik Winbox             |
| 8728  | RouterOS-API | TCP      | mikrotik | RouterOS API                |
| 51820 | WireGuard    | UDP      | network  | WireGuard VPN               |

### Port Lookup Functions

```typescript
// Look up service by port
export function getServiceByPort(port: number, protocol?: PortProtocol): string | null;
getServiceByPort(80); // "HTTP"
getServiceByPort(443, 'tcp'); // "HTTPS"
getServiceByPort(12345); // null

// Get full port entry
export function getPortEntry(port: number, protocol?: PortProtocol): WellKnownPort | null;
getPortEntry(443);
// => { port: 443, service: 'HTTPS', protocol: 'tcp', category: 'web', ... }

// Get all ports in category
export function getPortsByCategory(category: PortCategory): WellKnownPort[];
getPortsByCategory('web');
// => [HTTP, HTTPS, HTTP-Alt, 8080, 8443, 3000, ...]

// Search ports (for autocomplete)
export function searchPorts(query: string, limit?: number): WellKnownPort[];
searchPorts('http'); // [HTTP, HTTPS, HTTP-Alt, ...]
searchPorts('22'); // [SSH]
searchPorts('sql'); // [MySQL, MSSQL, PostgreSQL, ...]

// Get suggestions grouped by category
export function getSuggestionsByCategory(
  categories?: PortCategory[]
): Record<PortCategory, WellKnownPort[]>;
getSuggestionsByCategory(['web', 'secure', 'database']);
// => { web: [...], secure: [...], database: [...] }
```

### Port Presets for Common Use Cases

```typescript
export const PORT_PRESETS = {
  webServer: [80, 443],
  mailServer: [25, 465, 587, 993, 995],
  sshAccess: [22],
  mikrotikManagement: [8291, 8728, 8729],
  databaseCommon: [3306, 5432, 27017, 6379],
  vpnPorts: [1194, 51820, 500, 4500, 1701, 1723],
};

// Usage in firewall rules
const natRule = {
  chain: 'dstnat',
  action: 'dst-nat',
  dstPort: PORT_PRESETS.webServer[0], // 80
  toAddresses: '192.168.1.100',
  toPorts: '8080',
};
```

### Category Display Names

```typescript
export const PORT_CATEGORY_LABELS = {
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

---

## VPN Protocol Type Differences

### Protocol Selection Matrix

| Feature            | WireGuard         | OpenVPN      | L2TP     | PPTP     | SSTP     | IKEv2       |
| ------------------ | ----------------- | ------------ | -------- | -------- | -------- | ----------- |
| **Port**           | 51820 UDP         | 1194 UDP/TCP | 1701 UDP | 1723 TCP | 443 TCP  | 500 UDP     |
| **Speed**          | ⭐⭐⭐⭐⭐        | ⭐⭐⭐⭐     | ⭐⭐⭐   | ⭐⭐⭐⭐ | ⭐⭐⭐   | ⭐⭐⭐      |
| **Security**       | Modern            | Excellent    | Good     | Weak     | Good     | Excellent   |
| **Setup Ease**     | Very Easy         | Complex      | Complex  | Easy     | Moderate | Moderate    |
| **Compatibility**  | Newer             | Universal    | Old      | Old      | Windows  | Mobile      |
| **Encryption**     | ChaCha20-Poly1305 | AES-256      | IPsec    | MPPE     | TLS 1.2  | IKEv2 Suite |
| **Mobile Roaming** | Excellent         | Fair         | Good     | Good     | Good     | ⭐⭐⭐⭐⭐  |

### WireGuard (Recommended Modern Choice)

```typescript
// Minimal, clean configuration
// Key management is straightforward
// ~15 lines of code vs 150 for OpenVPN
// Performance: 10x faster than OpenVPN in benchmarks
```

**Use Case:** New deployments, mobile apps, site-to-site links

### OpenVPN (Wide Compatibility)

```typescript
// Mature, battle-tested since 2002
// Works on all platforms
// Configuration is detailed and flexible
// Can tunnel over TCP (good for restrictive networks)
```

**Use Case:** Legacy systems, maximum compatibility, corporate deployments

### L2TP/IPsec (Enterprise Standard)

```typescript
// L2TP = Layer 2 Tunneling Protocol
// IPsec = Encryption layer
// Combo is widely supported in corporate environments
// Requires IPsec configuration (complex)
```

**Use Case:** Enterprise VPN integration, legacy infrastructure

### PPTP (Legacy Only)

```typescript
// Point-to-Point Tunneling Protocol
// Very weak encryption (discouraged)
// Fast setup but security issues
// Should NOT be used for sensitive data
```

**Use Case:** Backward compatibility only, non-sensitive networks

### SSTP (Windows Native)

```typescript
// Secure Socket Tunneling Protocol
// Runs over HTTPS (port 443)
// Native Windows support
// Good fallback when other protocols blocked
```

**Use Case:** Windows environments, networks blocking other VPNs

### IKEv2 (Mobile Optimized)

```typescript
// Internet Key Exchange version 2
// Built-in mobile platform support
// Excellent for roaming (handoff between WiFi/LTE)
// More complex than WireGuard but proven
```

**Use Case:** Mobile apps, devices that frequently change networks

---

## Type Flow: Forms → GraphQL → Backend

Complete data flow through the system:

### 1. Form Layer (React Hook Form + Zod)

```typescript
// File: libs/features/network/components/wan-config-form.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WANStaticConfigSchema } from '@nasnet/core/types';

export function WANConfigForm() {
  const form = useForm({
    resolver: zodResolver(WANStaticConfigSchema),
    defaultValues: {
      interface: 'ether1',
      address: '192.168.1.1/24',
      gateway: '192.168.1.254',
      dnsServers: ['8.8.8.8', '8.8.4.4'],
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields with validation errors */}
    </form>
  );
}
```

**Validation at this layer:**

- IP format validation
- CIDR notation enforcement
- Port range validation
- Mutual field requirements (e.g., logPrefix when logging enabled)

### 2. GraphQL Layer

```graphql
# Schema: schema/core/wan.graphql

input WANStaticConfigInput {
  interface: String!
  address: String! # CIDR format: "192.168.1.0/24"
  gateway: String! # Plain IP
  dnsServers: [String!]!
}

extend type Mutation {
  updateWANConfig(config: WANStaticConfigInput!): WANLink!
}
```

**Codegen produces:**

```typescript
// libs/api-client/generated/hooks.ts

export function useUpdateWANConfigMutation() {
  return useMutation(UPDATE_WAN_CONFIG_MUTATION);
}
```

### 3. Backend Resolver

```go
// apps/backend/graph/resolver/wan-operations.resolvers.go

func (r *mutationResolver) UpdateWANConfig(
  ctx context.Context,
  config *model.WANStaticConfigInput,
) (*model.WANLink, error) {
  // 1. Validation (redundant but safe)
  if err := validateIPAddress(config.Address); err != nil {
    return nil, err
  }

  // 2. Business logic
  link, err := r.wanService.UpdateStaticConfig(ctx, config)
  if err != nil {
    return nil, err
  }

  // 3. Return result
  return link, nil
}
```

### 4. Backend Service Layer

```go
// apps/backend/internal/services/wan_service.go

func (s *WANService) UpdateStaticConfig(
  ctx context.Context,
  config *model.WANStaticConfigInput,
) (*model.WANLink, error) {
  // 1. Connect to router
  conn, err := s.routerPool.Get(ctx)
  if err != nil {
    return nil, err
  }

  // 2. Parse CIDR for netmask extraction
  parsed := s.ipUtils.ParseCIDR(config.Address)

  // 3. Build RouterOS API call
  cmd := &routeros.Command{
    Path: "/ip/address",
    Arguments: map[string]string{
      "address": config.Address,
      "interface": config.Interface,
    },
  }

  // 4. Execute and return
  return conn.Execute(cmd)
}
```

---

## Related Documentation

- **Type Reference:** `libs/core/docs/types.md`
- **Utils Reference:** `libs/core/docs/utils.md`
- **Form Validators:** `libs/core/docs/forms.md`
- **Design System:** `Docs/design/DESIGN_TOKENS.md`
- **Architecture:** `Docs/architecture/api-contracts.md`

## Migration Guide

### From Manual IP Parsing to Utilities

```typescript
// ❌ Before: Manual string manipulation
function isValidNetwork(address: string): boolean {
  const parts = address.split('/');
  return parts.length === 2 && parts[0].includes('.');
}

// ✅ After: Use utilities
import { isValidSubnet, getSubnetInfo } from '@nasnet/core/utils/network';

if (!isValidSubnet(address)) {
  throw new Error('Invalid CIDR notation');
}

const info = getSubnetInfo(address);
console.log(`Network: ${info.network}, First host: ${info.firstHost}`);
```

### Port Configuration

```typescript
// ❌ Before: Hardcoded port numbers scattered everywhere
if (port === 443) {
  /* handle HTTPS */
}
if (port === 22) {
  /* handle SSH */
}

// ✅ After: Use well-known ports database
import { getServiceByPort, searchPorts } from '@nasnet/core/constants/well-known-ports';

const service = getServiceByPort(port);
if (service === 'HTTPS') {
  /* handle HTTPS */
}

// For autocomplete
const suggestions = searchPorts(userInput);
```
