# Firewall System Guide

Cross-cutting guide for firewall rule types, configuration, log parsing, and port reference integration.

## Table of Contents

1. [Firewall Type Hierarchy](#firewall-type-hierarchy)
2. [Type Definitions Summary](#type-definitions-summary)
3. [Firewall Log Parsing](#firewall-log-parsing)
4. [Action Inference from Log Prefixes](#action-inference-from-log-prefixes)
5. [Port Reference Integration](#port-reference-integration)
6. [Template System](#template-system)
7. [Usage Examples](#usage-examples)

---

## Firewall Type Hierarchy

RouterOS firewall is organized into 8 rule types spanning the packet processing pipeline:

```
┌──────────────────────────────────────────────────────────┐
│         PACKET ARRIVES AT ROUTER                         │
└────────────────────┬─────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │ FILTER Chain (1)    │
          │ input/forward       │
          │ output/custom       │
          └──────────┬──────────┘
                     │ (Allow/Drop/Reject)
          ┌──────────▼──────────┐
          │ NAT Chain (2, 3)    │
          │ srcnat/dstnat       │
          │ (Masquerade, DNAT)  │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │ MANGLE Chain (4)    │
          │ Mark & modify       │
          │ (ToS, TTL, Mark)    │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │ RAW Chain (5)       │
          │ Connection state    │
          │ (Before Conntrack)  │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │ Additional Rules:   │
          │ • Port Knock (6)    │
          │ • Rate Limit (7)    │
          │ • Templates (8)     │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │ LOG & METRICS       │
          │ Firewall Logs       │
          └─────────────────────┘
```

### 8 Firewall Rule Types

1. **Filter Rules** — Accept/Drop/Reject packets
2. **NAT Rules (srcnat)** — Source NAT / Masquerade outgoing
3. **NAT Rules (dstnat)** — Destination NAT / Port forward incoming
4. **Mangle Rules** — Mark packets, modify headers (ToS, TTL)
5. **Raw Rules** — Bypass connection tracking
6. **Port Knocking** — Sequence-based port access
7. **Rate Limiting** — QoS rules, bandwidth control
8. **Service Ports** — Well-known port definitions
9. **Templates** — Reusable rule templates
10. **Firewall Logs** — Parsed log entries

---

## Type Definitions Summary

Located in `types/firewall/`:

### 1. Filter Rules - `filter-rule.types.ts`

Packet filtering at network boundary.

```typescript
export type FilterChain = 'input' | 'forward' | 'output';
export type FilterAction = 'accept' | 'drop' | 'reject' | 'log' | 'jump' | 'tarpit' | 'passthrough';
export type FilterProtocol = 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | 'all';

export interface FilterRule {
  // Identity
  id: string;
  chain: FilterChain;
  action: FilterAction;
  order?: number;

  // Matchers
  protocol?: FilterProtocol;
  srcAddress?: string;       // IP or CIDR
  dstAddress?: string;
  srcPort?: string;          // Port or range
  dstPort?: string;
  srcAddressList?: string;   // Address list reference
  dstAddressList?: string;
  inInterface?: string;
  outInterface?: string;
  connectionState?: string[]; // 'established', 'related', 'new', 'invalid'

  // Logging
  log?: boolean;
  logPrefix?: string;        // Required if log=true

  // Jump action
  jumpTarget?: string;       // Chain to jump to

  // Meta
  comment?: string;
  disabled?: boolean;

  // Read-only counters
  packets?: number;
  bytes?: number;
}

// Helper functions
export function getActionColor(action: FilterAction): string;      // 'success', 'error', 'warning'
export function getActionDescription(action: FilterAction): string; // Tooltip text
export function generateRulePreview(rule: Partial<FilterRule>): string;
```

**Chain Behavior:**

| Chain | Packets | Examples |
|-------|---------|----------|
| **input** | Destined for router | SSH login, DNS queries to router DNS |
| **forward** | Passing through router | LAN to WAN traffic, guest network access |
| **output** | Originating from router | Router itself making requests |

**Action Behavior:**

| Action | Effect | Use Case |
|--------|--------|----------|
| **accept** | Allow packet through | Web traffic, email |
| **drop** | Silently discard | Block without feedback |
| **reject** | Discard + send ICMP error | "Connection refused" response |
| **log** | Log and continue | Audit suspicious traffic |
| **jump** | Jump to custom chain | Reusable rule groups |
| **tarpit** | Hold connection open | Anti-DDoS (slow down attackers) |

### 2. NAT Rules - `nat-rule.types.ts`

Address and port translation.

```typescript
export type NatChain = 'srcnat' | 'dstnat';
export type NatAction =
  | 'masquerade'   // Hide behind router IP
  | 'dst-nat'      // Port forward incoming
  | 'src-nat'      // Translate source
  | 'redirect'     // Redirect to router itself
  | 'netmap'       // 1:1 address mapping
  | 'same'         // Use same address as source
  | 'accept'       // No translation
  | 'drop' | 'jump' | 'return' | 'log' | 'passthrough';

export interface NATRuleInput {
  // Identity
  id?: string;
  chain: NatChain;
  action: NatAction;
  position?: number;

  // Matchers
  protocol?: Protocol;
  srcAddress?: string;       // CIDR
  dstAddress?: string;
  srcPort?: string;
  dstPort?: string;
  inInterface?: string;
  outInterface?: string;

  // Action parameters
  toAddresses?: string;      // Target IP
  toPorts?: string;          // Target port(s)

  // Meta
  comment?: string;
  disabled?: boolean;
  log?: boolean;
  logPrefix?: string;

  // Counters
  packets?: number;
  bytes?: number;
}

// Port Forward Wizard (simplified)
export interface PortForward {
  protocol: Protocol;
  externalPort: number;      // WAN port
  internalIP: string;        // LAN IP
  internalPort?: number;     // LAN port (defaults to external)
  name?: string;
  wanInterface?: string;
  comment?: string;
}

export interface PortForwardResult {
  id: string;
  protocol: Protocol;
  externalPort: number;
  internalIP: string;
  internalPort: number;
  status: 'active' | 'disabled' | 'error';
  natRuleId: string;
  filterRuleId?: string;
}

// Helper functions
export function getVisibleFieldsForNATAction(action: NatAction): string[];
export function generateNATRulePreview(rule: Partial<NATRuleInput>): string;
export function generatePortForwardSummary(portForward: PortForward): string;
export function hasPortForwardConflict(newForward: PortForward, existing: PortForwardResult[]): boolean;
```

**Common NAT Patterns:**

```typescript
// Pattern 1: Masquerade (most common)
// Hide LAN behind router's WAN IP
const masquerade: NATRuleInput = {
  chain: 'srcnat',
  action: 'masquerade',
  outInterface: 'ether1',     // WAN interface
  srcAddress: '192.168.1.0/24',
};

// Pattern 2: Port Forward
// Forward WAN:80 → LAN:192.168.1.100:8080
const portForward: PortForward = {
  protocol: 'tcp',
  externalPort: 80,
  internalIP: '192.168.1.100',
  internalPort: 8080,
  name: 'Web Server',
};

// Pattern 3: 1:1 NAT
// Map entire subnet: 203.0.113.0/24 ↔ 192.168.1.0/24
const oneToOne: NATRuleInput = {
  chain: 'dstnat',
  action: 'netmap',
  toAddresses: '203.0.113.1',
};
```

### 3. Mangle Rules - `mangle-rule.types.ts`

Packet marking and header modification.

```typescript
export type MangleChain = 'input' | 'forward' | 'output' | 'prerouting' | 'postrouting';
export type MangleAction =
  | 'mark-packet'    // Mark for policy routing
  | 'mark-connection'
  | 'change-tos'     // Modify ToS (DiffServ)
  | 'change-ttl'     // Modify TTL
  | 'add-dst-to-address-list'
  | 'add-src-to-address-list'
  | 'log' | 'passthrough';

export interface MangleRule {
  // Identity
  id: string;
  chain: MangleChain;
  action: MangleAction;

  // Matchers
  protocol?: FilterProtocol;
  srcAddress?: string;
  dstAddress?: string;
  srcPort?: string;
  dstPort?: string;
  inInterface?: string;
  outInterface?: string;
  connectionMark?: string;
  connectionState?: ConnectionState[];

  // Action parameters
  newPacketMark?: string;
  newConnectionMark?: string;
  passthrough?: boolean;
  newTos?: number;            // ToS value (0-255)
  newTtl?: 'increment' | 'decrement' | number;

  // Meta
  comment?: string;
  disabled?: boolean;
}
```

### 4. Raw Rules - `raw-rule.types.ts`

Connection tracking bypass.

```typescript
export type RawChain = 'prerouting' | 'output';

export interface RawRule {
  id: string;
  chain: RawChain;
  action: 'accept' | 'drop' | 'log' | 'passthrough';

  // Matchers
  protocol?: Protocol;
  srcAddress?: string;
  dstAddress?: string;
  srcPort?: string;
  dstPort?: string;
  inInterface?: string;
  outInterface?: string;

  // Meta
  comment?: string;
  disabled?: boolean;
}
```

### 5. Port Knock Rules - `port-knock.types.ts`

Sequence-based port access.

```typescript
export interface PortKnockSequence {
  id: string;
  name: string;
  sequence: number[];        // Port sequence: [1234, 5678, 9012]
  protocol: 'tcp' | 'udp' | 'both';
  timeout: number;           // Milliseconds to remember ports
  action: 'add-src-to-address-list' | 'drop';
  addressList?: string;      // List to add to on success
  comment?: string;
  disabled?: boolean;
}

// Port knock log entry
export interface PortKnockLog {
  id: string;
  timestamp: Date;
  srcIP: string;
  ports: number[];
  recognized: boolean;       // Matched known sequence?
}
```

**Use Case:** Port knocking allows hidden SSH access
```
Client knock sequence: port 1234 → 5678 → 9012
Router: If sequence matches, add client IP to "ssh-access" whitelist
Result: SSH becomes accessible only after knocking correct sequence
```

### 6. Rate Limiting - `rate-limit.types.ts`

QoS and bandwidth control.

```typescript
export interface RateLimitRule {
  id: string;
  name: string;

  // Matching
  protocol?: Protocol;
  srcAddress?: string;
  dstAddress?: string;
  srcPort?: string;
  dstPort?: string;
  inInterface?: string;

  // Rate limiting
  limitBitsPerSecond?: number;
  limitPacketsPerSecond?: number;
  burstLimit?: number;       // Allow short bursts

  // Priority (lower = higher priority)
  priority?: number;

  comment?: string;
  disabled?: boolean;
}

// Presets for common scenarios
export const RATE_LIMIT_PRESETS = {
  slow: 512000,              // 512 Kbps
  moderate: 2000000,         // 2 Mbps
  fast: 10000000,            // 10 Mbps
  gigabit: 1000000000,       // 1 Gbps
};
```

### 7. Service Ports - `service-port.types.ts`

Well-known port definitions.

```typescript
export interface ServicePort {
  id: string;
  name: string;
  protocol: Protocol;
  ports: number[];           // Multiple ports allowed
  comment?: string;
}

// Used in firewall rules to reference services by name
// Rather than hardcoding port numbers
```

### 8. Firewall Templates - `template.types.ts`

Reusable rule templates.

```typescript
export interface FirewallTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'security' | 'productivity' | 'entertainment' | 'custom';

  // Rules included
  filterRules?: Partial<FilterRule>[];
  natRules?: Partial<NATRuleInput>[];
  mangleRules?: Partial<MangleRule>[];

  // Parameters that can be customized
  parameters?: Record<string, any>;

  // Import/export metadata
  version?: string;
  author?: string;
  tags?: string[];
}

// Example templates
export const TEMPLATE_EXAMPLES = {
  BLOCK_TORRENT: {
    name: 'Block Torrent',
    category: 'productivity',
    filterRules: [
      // BitTorrent port ranges
      { chain: 'forward', action: 'drop', dstPort: '6881-6889' },
    ],
  },
  GUEST_NETWORK: {
    name: 'Guest Network Isolation',
    category: 'security',
    filterRules: [
      // Guest can't access LAN
      { chain: 'forward', action: 'drop', srcAddressList: 'guest', dstAddress: '192.168.1.0/24' },
    ],
  },
};
```

### 9. Firewall Logs - `firewall-log.types.ts`

Parsed log entries.

```typescript
export type FirewallLogChain = 'input' | 'forward' | 'output';
export type FirewallLogProtocol = 'TCP' | 'UDP' | 'ICMP' | 'IPv6-ICMP' | 'GRE' | 'ESP' | 'AH' | 'IGMP' | 'unknown';
export type InferredAction = 'drop' | 'reject' | 'accept' | 'unknown';

export interface ParsedFirewallLog {
  // Identity
  chain: FirewallLogChain;
  action: InferredAction;       // Inferred from prefix
  prefix?: string;              // Log prefix from rule
  protocol: FirewallLogProtocol;

  // Interfaces
  interfaceIn?: string;
  interfaceOut?: string;

  // Connection details
  srcIp?: string;
  srcPort?: number;
  dstIp?: string;
  dstPort?: number;

  // Packet info
  length?: number;              // Packet size in bytes
}
```

---

## Firewall Log Parsing

Located in `utils/firewall/parse-firewall-log.ts`:

### Log Message Formats

RouterOS produces logs in multiple formats:

```
// Format 1: No prefix, explicit chain
forward: in:ether1 out:bridge1, proto TCP, 192.168.1.100:54321->10.0.0.1:443, len 52

// Format 2: With action prefix
DROPPED-WAN forward: in:ether1 out:bridge1, proto TCP (SYN), len 60

// Format 3: ICMP without ports
input: in:ether1, proto ICMP (type 8, code 0), 8.8.8.8->192.168.1.1

// Format 4: Unknown interface
input: in:ether1 out:(unknown 0), proto ICMP, 192.168.1.1->10.0.0.1

// Format 5: Multiple fields
REJECTED forward: in:ether1 out:ether2, proto TCP (FIN), 172.16.0.50:22->203.0.113.1:54321, len 40
```

### Parsing Functions

```typescript
import {
  parseFirewallLogMessage,
  inferActionFromPrefix,
  isValidParsedLog,
} from '@nasnet/core/utils/firewall';

// Main parsing function
const parsed = parseFirewallLogMessage(
  "DROPPED-WAN forward: in:ether1 out:bridge1, proto TCP, 192.168.1.100:54321->10.0.0.1:443, len 52"
);
// Result:
// {
//   chain: 'forward',
//   action: 'drop',               // Inferred from "DROPPED-WAN"
//   prefix: 'DROPPED-WAN',
//   protocol: 'TCP',
//   interfaceIn: 'ether1',
//   interfaceOut: 'bridge1',
//   srcIp: '192.168.1.100',
//   srcPort: 54321,
//   dstIp: '10.0.0.1',
//   dstPort: 443,
//   length: 52,
// }

// Infer action from log prefix
inferActionFromPrefix('DROPPED-WAN')    // 'drop'
inferActionFromPrefix('ACCEPTED')       // 'accept'
inferActionFromPrefix('REJECTED')       // 'reject'
inferActionFromPrefix('custom-log')     // 'unknown'

// Validate parsed result
isValidParsedLog(parsed)  // true
```

### Action Inference Patterns

```typescript
// Patterns used for action inference:
const ACTION_PATTERNS = {
  drop: /^(DROPPED?[-_]?|DROP[-_]?|BLOCKED?[-_]?|BLOCK[-_]?|DENY[-_]?)/i,
  reject: /^(REJECTED?[-_]?|REJECT[-_]?)/i,
  accept: /^(ACCEPTED?[-_]?|ACCEPT[-_]?|ALLOWED?[-_]?|ALLOW[-_]?|PERMIT[-_]?)/i,
};

// Matches:
// "DROPPED-WAN"    → drop
// "DROP_LAN"       → drop
// "BLOCK-INPUT"    → drop
// "REJECTED"       → reject
// "ACCEPT-FWD"     → accept
// "PERMITTED"      → accept
// "custom-log"     → unknown (no match)
```

### Protocol Extraction

```typescript
// Extracts from "proto TCP", "proto UDP", "proto ICMP", etc.
// Normalizes to uppercase: TCP, UDP, ICMP, IPv6-ICMP, GRE, ESP, AH, IGMP

// Examples:
"proto tcp"           → 'TCP'
"proto TCP (SYN)"     → 'TCP' (ignores flags)
"proto ICMP (type 8)" → 'ICMP'
"proto ipv6-icmp"     → 'IPv6-ICMP'
"proto unknown"       → 'unknown'
```

---

## Action Inference from Log Prefixes

Firewall rules can log with custom prefixes to identify rule actions:

```typescript
// In filter rule form, you might set:
const rule = {
  action: 'drop',
  log: true,
  logPrefix: 'DROPPED-WAN',    // Custom prefix
};

// When triggered, logs appear as:
// "DROPPED-WAN forward: in:ether1 out:ether2, ..."

// Parser infers action:
// DROPPED-WAN → "drop" action
```

### Recommended Log Prefix Conventions

```typescript
export const SUGGESTED_LOG_PREFIXES = [
  { value: 'DROPPED-', label: 'DROPPED- (packets dropped by firewall)' },
  { value: 'ACCEPTED-', label: 'ACCEPTED- (packets accepted)' },
  { value: 'REJECTED-', label: 'REJECTED- (packets rejected with ICMP)' },
  { value: 'FIREWALL-', label: 'FIREWALL- (general firewall log)' },
];
```

**Benefits of Prefixes:**
- Quickly identify which rule blocked traffic
- Distinguish intentional drops from rejects
- Audit logging and compliance tracking
- Troubleshooting traffic issues

---

## Port Reference Integration

### Using Well-Known Ports in Firewall Rules

```typescript
import { getServiceByPort, searchPorts } from '@nasnet/core/constants/well-known-ports';

// Example 1: Auto-label rule ports
const rule = {
  protocol: 'tcp',
  dstPort: '443',
};

const service = getServiceByPort(443, 'tcp');
// Display as "HTTPS" instead of "443"

// Example 2: Port range suggestions
const commonWebPorts = searchPorts('http');
// Shows: HTTP (80), HTTPS (443), HTTP-Alt (8080, 8443), etc.

// Example 3: Category-based suggestions
const webServices = getPortsByCategory('web');
// Shows: HTTP, HTTPS, dev servers, etc.
```

### Firewall Rule with Port Labeling

```typescript
interface FirewallRuleDisplay {
  srcPort?: {
    raw: string;
    label?: string;           // Service name
  };
  dstPort?: {
    raw: string;
    label?: string;
  };
}

// Create displayable rule
function enhanceRuleDisplay(rule: FilterRule): FirewallRuleDisplay {
  return {
    srcPort: rule.srcPort ? {
      raw: rule.srcPort,
      label: getServiceByPort(parseInt(rule.srcPort), rule.protocol),
    } : undefined,
    dstPort: rule.dstPort ? {
      raw: rule.dstPort,
      label: getServiceByPort(parseInt(rule.dstPort), rule.protocol),
    } : undefined,
  };
}

// Result shows:
// Destination Port: 443 (HTTPS)
// Destination Port: 22 (SSH)
// Source Port: 12345 (unknown)
```

---

## Template System

### Creating Firewall Templates

```typescript
import { FirewallTemplate } from '@nasnet/core/types/firewall';

// Template: Block adult content
const blockAdultTemplate: FirewallTemplate = {
  id: 'tpl-block-adult',
  name: 'Block Adult Content',
  description: 'Blocks access to known adult/NSFW websites',
  category: 'productivity',

  filterRules: [
    {
      chain: 'forward',
      action: 'drop',
      dstAddressList: 'adult-sites',
      comment: 'Block adult sites',
    },
  ],

  parameters: {
    addressList: 'adult-sites',  // User can customize list name
  },

  tags: ['content-filtering', 'parental-control'],
};

// Template: QoS for video streaming
const videoQoSTemplate: FirewallTemplate = {
  id: 'tpl-video-qos',
  name: 'Video Streaming QoS',
  category: 'custom',

  mangleRules: [
    {
      chain: 'forward',
      action: 'mark-packet',
      dstPort: '443',           // HTTPS
      protocol: 'tcp',
      newPacketMark: 'video-stream',
    },
  ],

  parameters: {
    rateLimit: 5000000,         // 5 Mbps
    priority: 1,
  },
};
```

### Applying Templates

```typescript
function applyTemplate(template: FirewallTemplate, router: RouterConnection) {
  // Apply each rule category
  if (template.filterRules) {
    template.filterRules.forEach(rule => {
      router.addFilterRule(rule);
    });
  }

  if (template.natRules) {
    template.natRules.forEach(rule => {
      router.addNATRule(rule);
    });
  }

  if (template.mangleRules) {
    template.mangleRules.forEach(rule => {
      router.addMangleRule(rule);
    });
  }
}
```

---

## Usage Examples

### Example 1: Simple Web Server Access

**Requirement:** Allow HTTP/HTTPS to internal web server

```typescript
import { PortForward, PORT_PRESETS } from '@nasnet/core/types/firewall';

// Simplified approach: Use port forward wizard
const webServerForward: PortForward = {
  protocol: 'tcp',
  externalPort: 80,
  internalIP: '192.168.1.100',
  internalPort: 8080,
  name: 'Web Server',
};

// Creates:
// 1. NAT rule: dstnat chain, forward WAN:80 to 192.168.1.100:8080
// 2. Filter rule: forward chain, accept TCP to port 8080

// Advanced approach: Manual rules
const manualNAT: NATRuleInput = {
  chain: 'dstnat',
  action: 'dst-nat',
  protocol: 'tcp',
  dstPort: '80',
  toAddresses: '192.168.1.100',
  toPorts: '8080',
  comment: 'Web Server HTTP',
};

const manualFilter: FilterRule = {
  chain: 'forward',
  action: 'accept',
  protocol: 'tcp',
  dstAddress: '192.168.1.100',
  dstPort: '8080',
  comment: 'Allow HTTP to Web Server',
};
```

### Example 2: Blocking Specific Traffic

**Requirement:** Block P2P and torrents

```typescript
const blockP2P: FilterRule = {
  chain: 'forward',
  action: 'drop',
  protocol: 'tcp',
  dstPort: '6881-6889',    // BitTorrent port range
  log: true,
  logPrefix: 'BLOCKED-P2P',
  comment: 'Block BitTorrent',
};

// Later, logs show:
// "BLOCKED-P2P forward: ... proto TCP, 192.168.1.50:12345->10.0.0.1:6881"
```

### Example 3: Parsing and Acting on Logs

```typescript
import { parseFirewallLogMessage } from '@nasnet/core/utils/firewall';

function processFirewallLog(rawLog: string) {
  const parsed = parseFirewallLogMessage(rawLog);

  // Log structure reveals the attack
  if (parsed.action === 'drop' && parsed.srcIp) {
    console.log(`Blocked traffic from ${parsed.srcIp}:${parsed.srcPort}`);

    // Could add to blacklist
    if (isLikelyAttack(parsed)) {
      addToAddressList('threat-ips', parsed.srcIp);
    }
  }
}

function isLikelyAttack(log: ParsedFirewallLog): boolean {
  // Port scan: multiple different ports from same IP
  // Port: 22, 23, 53, 80, 443, etc.
  // This is a heuristic
  return log.dstPort && [22, 23, 80, 443].includes(log.dstPort);
}
```

### Example 4: Rate Limiting by Protocol

**Requirement:** Limit UDP to prevent DNS amplification attacks

```typescript
const limitDNS: RateLimitRule = {
  id: 'rl-dns',
  name: 'Limit DNS Queries',
  protocol: 'udp',
  dstPort: '53',
  limitPacketsPerSecond: 100,   // Max 100 DNS queries/sec per IP
  burstLimit: 150,              // Allow short bursts
  priority: 1,
};

const limitUDP: RateLimitRule = {
  id: 'rl-udp',
  name: 'General UDP Limit',
  protocol: 'udp',
  limitBitsPerSecond: 1000000,  // Max 1 Mbps UDP
  priority: 2,
};
```

### Example 5: Connection State Filtering

**Requirement:** Only allow established connections on input chain

```typescript
const allowEstablished: FilterRule = {
  chain: 'input',
  action: 'accept',
  connectionState: ['established', 'related'],
  comment: 'Allow established connections',
};

const dropInvalid: FilterRule = {
  chain: 'input',
  action: 'drop',
  connectionState: ['invalid'],
  logPrefix: 'INVALID-CONN',
  log: true,
  comment: 'Drop invalid state packets',
};

// Result: Only traffic part of existing connections is allowed
```

---

## Related Documentation

- **Well-Known Ports:** `libs/core/constants/well-known-ports.ts`
- **Network Configuration:** `libs/core/docs/guides/network-configuration.md`
- **Type Reference:** `libs/core/docs/types.md`
- **Architecture:** `Docs/architecture/api-contracts.md`
