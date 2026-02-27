# Network Validators

File: `libs/core/forms/src/network-validators.ts`

All network-specific Zod schemas live in one file and are available under
`@nasnet/core/forms/network-validators`. They are used directly in form schemas and by GraphQL
codegen for input type validation.

## Import

```typescript
// Import individual validators
import { ipv4, cidr, port, mac, wgKey } from '@nasnet/core/forms/network-validators';

// Or import the collection object
import { networkValidators } from '@nasnet/core/forms/network-validators';

const schema = z.object({
  address: networkValidators.ipv4,
  subnet: networkValidators.cidr,
  port: networkValidators.port,
});
```

## IP Address Validators

### `ipv4`

IPv4 address with octet range checking. Rejects leading zeros.

```typescript
export const ipv4 = z.string().refine(...)
  // message: 'Invalid IPv4 address (format: 192.168.1.1)'

ipv4.parse('192.168.1.1');    // Valid
ipv4.parse('10.0.0.1');       // Valid
ipv4.parse('256.1.1.1');      // Invalid - octet > 255
ipv4.parse('192.168.001.1');  // Invalid - leading zero
ipv4.parse('192.168.1');      // Invalid - missing octet
```

### `ipv6`

IPv6 address using Zod's built-in IP validation.

```typescript
export const ipv6 = z.string().ip({ version: 'v6' });

ipv6.parse('2001:db8::1'); // Valid
ipv6.parse('::1'); // Valid (loopback)
ipv6.parse('192.168.1.1'); // Invalid - IPv4
```

### `ipAddress`

Accepts either IPv4 or IPv6.

```typescript
export const ipAddress = z.union([ipv4, ipv6]);
```

### `privateIp`

Validates RFC 1918 private ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.

```typescript
privateIp.parse('192.168.1.1'); // Valid
privateIp.parse('10.0.0.1'); // Valid
privateIp.parse('8.8.8.8'); // Invalid - public IP
```

### `publicIp`

Validates that the IP is NOT private, loopback, link-local, multicast, or reserved.

```typescript
publicIp.parse('8.8.8.8'); // Valid
publicIp.parse('1.1.1.1'); // Valid
publicIp.parse('192.168.1.1'); // Invalid - private
publicIp.parse('127.0.0.1'); // Invalid - loopback
```

### `multicastIp`

Multicast range: `224.0.0.0 – 239.255.255.255`.

### `loopbackIp`

Loopback range: `127.0.0.0/8`.

## CIDR / Subnet Validators

### `cidr`

IPv4 CIDR notation. Validates both the IP address and the prefix length (0–32).

```typescript
cidr.parse('192.168.1.0/24'); // Valid
cidr.parse('10.0.0.0/8'); // Valid
cidr.parse('192.168.1.0'); // Invalid - no prefix
cidr.parse('192.168.1.0/33'); // Invalid - prefix > 32
cidr.parse('256.1.1.1/24'); // Invalid - octet out of range
```

### `cidr6`

IPv6 CIDR notation. Prefix length 0–128.

```typescript
cidr6.parse('2001:db8::/32'); // Valid
cidr6.parse('::1/128'); // Valid
cidr6.parse('2001:db8::/129'); // Invalid - prefix > 128
```

### `subnetMask`

Dotted decimal subnet mask. Validates that the binary representation has contiguous 1-bits followed
by contiguous 0-bits.

```typescript
subnetMask.parse('255.255.255.0'); // Valid (/24)
subnetMask.parse('255.255.128.0'); // Valid (/17)
subnetMask.parse('255.0.255.0'); // Invalid - non-contiguous
```

## IP Range and Port Validators

### `ipRange`

Two IPv4 addresses separated by `-`. Validates that start ≤ end.

```typescript
ipRange.parse('192.168.1.1-192.168.1.100'); // Valid
ipRange.parse('10.0.0.1-10.0.0.254'); // Valid
ipRange.parse('192.168.1.100-192.168.1.1'); // Invalid - start > end
```

### `ipWithPort`

`<IPv4>:<port>` format.

```typescript
ipWithPort.parse('192.168.1.1:8080'); // Valid
ipWithPort.parse('10.0.0.1:443'); // Valid
ipWithPort.parse('192.168.1.1'); // Invalid - no port
```

### `port`

Integer port number 1–65535.

```typescript
export const port = z.number().int().min(1).max(65535);

port.parse(8080); // Valid
port.parse(0); // Invalid
port.parse(65536); // Invalid
```

### `portString`

Port number as a string (for text input fields).

```typescript
portString.parse('8080'); // Valid
portString.parse('443'); // Valid
portString.parse('abc'); // Invalid
```

### `portRange`

Single port or range (`80-443`). Validates both bounds are 1–65535 and start ≤ end.

```typescript
portRange.parse('8080'); // Valid - single port
portRange.parse('80-443'); // Valid - range
portRange.parse('443-80'); // Invalid - start > end
```

### `multiPort`

Comma-separated list of port numbers.

```typescript
multiPort.parse('80,443,8080'); // Valid
multiPort.parse('22, 80, 443'); // Valid (spaces allowed)
multiPort.parse('80,65536'); // Invalid
```

## Network Identifier Validators

### `mac`

MAC address with `:` or `-` separators.

```typescript
mac.parse('00:1A:2B:3C:4D:5E'); // Valid (colon)
mac.parse('00-1A-2B-3C-4D-5E'); // Valid (hyphen)
mac.parse('001A2B3C4D5E'); // Invalid - no separators
```

### `hostname`

RFC 1123 hostname. Letters, digits, hyphens, dots. Must start and end with alphanumeric. Max 253
characters.

```typescript
hostname.parse('router'); // Valid
hostname.parse('my-router.local'); // Valid
hostname.parse('-invalid'); // Invalid - starts with hyphen
```

### `domain`

Domain name with at least one dot and a TLD of 2+ alphabetic characters.

```typescript
domain.parse('example.com'); // Valid
domain.parse('sub.example.co.uk'); // Valid
domain.parse('localhost'); // Invalid - no TLD
```

### `vlanId`

VLAN ID per IEEE 802.1Q: 1–4094 (excludes reserved 0 and 4095).

```typescript
vlanId.parse(100); // Valid
vlanId.parse(4094); // Valid (maximum)
vlanId.parse(0); // Invalid - reserved
vlanId.parse(4095); // Invalid - reserved
```

### `vlanIdString`

VLAN ID as string input.

## MikroTik-Specific Validators

### `interfaceName`

MikroTik interface name. Characters: `[a-zA-Z0-9._-]`. Must start with alphanumeric. Max 64
characters.

```typescript
interfaceName.parse('ether1'); // Valid
interfaceName.parse('vlan.100'); // Valid
interfaceName.parse('bridge-1'); // Valid
interfaceName.parse('_invalid'); // Invalid - starts with underscore
```

### `comment`

MikroTik comment field. Max 255 characters. No control characters (ASCII 0–31 and 127).

```typescript
comment.parse('This is a valid comment'); // Valid
comment.parse('a'.repeat(256)); // Invalid - too long
comment.parse('has\nnewline'); // Invalid - control char
```

### `duration`

RouterOS duration string. Numeric value followed by `s`, `m`, `h`, or `d`.

```typescript
duration.parse('30s'); // Valid - 30 seconds
duration.parse('5m'); // Valid - 5 minutes
duration.parse('2h'); // Valid - 2 hours
duration.parse('7d'); // Valid - 7 days
duration.parse('30'); // Invalid - missing unit
```

### `bandwidth`

RouterOS bandwidth string. Numeric with optional unit `k`, `m`, `g` (case-insensitive).

```typescript
bandwidth.parse('100'); // Valid - 100 bps
bandwidth.parse('100k'); // Valid - 100 Kbps
bandwidth.parse('1.5m'); // Valid - 1.5 Mbps
bandwidth.parse('1G'); // Valid - 1 Gbps
bandwidth.parse('100x'); // Invalid - unknown unit
```

### `wgKey`

WireGuard public/private key. Base64 encoded, exactly 44 characters ending with `=`.

```typescript
wgKey.parse('jI6DYlg34+z6Q+q6d8YB5ibQwQAawamJBcht5xF24mE='); // Valid
wgKey.parse('AAAA'); // Invalid - too short
wgKey.parse('jI6DYlg34+z6Q+q6d8YB5ibQwQAawamJBcht5xF24mE'); // Invalid - missing =
```

## Complete Validator Collection

The `networkValidators` object exports all validators for convenient bulk import:

```typescript
import { networkValidators } from '@nasnet/core/forms/network-validators';

const {
  ipv4,
  ipv6,
  ipAddress,
  mac,
  cidr,
  cidr6,
  port,
  portString,
  portRange,
  multiPort,
  vlanId,
  vlanIdString,
  wgKey,
  hostname,
  domain,
  interfaceName,
  comment,
  duration,
  bandwidth,
  subnetMask,
  ipWithPort,
  ipRange,
  privateIp,
  publicIp,
  multicastIp,
  loopbackIp,
} = networkValidators;
```
