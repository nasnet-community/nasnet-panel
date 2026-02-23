/**
 * Network-Specific Zod Validators
 *
 * Custom Zod validators for network-specific types that go beyond simple regex.
 * These are used by codegen and can be imported directly in form schemas.
 *
 * @module @nasnet/core/forms/network-validators
 */
import { z } from 'zod';
/**
 * IPv4 address validator with proper octet range checking.
 * Validates format and ensures each octet is 0-255.
 * Rejects leading zeros in octets (e.g., "192.168.001.1" is invalid).
 *
 * @example
 * ```typescript
 * ipv4.parse('192.168.1.1');   // Valid
 * ipv4.parse('10.0.0.1');      // Valid
 * ipv4.parse('192.168.1');     // Invalid - missing octet
 * ipv4.parse('256.1.1.1');     // Invalid - octet > 255
 * ipv4.parse('192.168.001.1'); // Invalid - leading zero
 * ```
 */
export declare const ipv4: z.ZodEffects<z.ZodString, string, string>;
/**
 * IPv6 address validator using Zod's built-in IP validation.
 *
 * @example
 * ```typescript
 * ipv6.parse('2001:db8::1');          // Valid
 * ipv6.parse('::1');                  // Valid (loopback)
 * ipv6.parse('2001:0db8:0000:0000:0000:ff00:0042:8329'); // Valid (expanded)
 * ipv6.parse('192.168.1.1');          // Invalid - IPv4 address
 * ```
 */
export declare const ipv6: z.ZodString;
/**
 * IP address validator that accepts both IPv4 and IPv6.
 */
export declare const ipAddress: z.ZodUnion<[z.ZodEffects<z.ZodString, string, string>, z.ZodString]>;
/**
 * MAC address validator.
 * Supports both colon (:) and hyphen (-) separators.
 * Format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
 *
 * @example
 * ```typescript
 * mac.parse('00:1A:2B:3C:4D:5E');  // Valid (colon)
 * mac.parse('00-1A-2B-3C-4D-5E');  // Valid (hyphen)
 * mac.parse('001A2B3C4D5E');       // Invalid - no separators
 * mac.parse('00:1A:2B:3C:4D');     // Invalid - only 5 octets
 * ```
 */
export declare const mac: z.ZodEffects<z.ZodString, string, string>;
/**
 * CIDR notation validator with proper network validation.
 * Format: 192.168.1.0/24
 * Validates both the IPv4 address and prefix length (0-32).
 *
 * @example
 * ```typescript
 * cidr.parse('192.168.1.0/24');      // Valid
 * cidr.parse('10.0.0.0/8');          // Valid
 * cidr.parse('192.168.1.1/32');      // Valid
 * cidr.parse('192.168.1.0');         // Invalid - missing prefix
 * cidr.parse('192.168.1.0/33');      // Invalid - prefix > 32
 * cidr.parse('256.1.1.1/24');        // Invalid - octet out of range
 * ```
 */
export declare const cidr: z.ZodEffects<z.ZodString, string, string>;
/**
 * IPv6 CIDR notation validator.
 * Format: 2001:db8::/32
 * Validates both the IPv6 address and prefix length (0-128).
 *
 * @example
 * ```typescript
 * cidr6.parse('2001:db8::/32');      // Valid
 * cidr6.parse('::1/128');            // Valid
 * cidr6.parse('fe80::/10');          // Valid
 * cidr6.parse('2001:db8::');         // Invalid - missing prefix
 * cidr6.parse('2001:db8::/129');     // Invalid - prefix > 128
 * cidr6.parse('192.168.1.0/24');     // Invalid - IPv4, not IPv6
 * ```
 */
export declare const cidr6: z.ZodEffects<z.ZodString, string, string>;
/**
 * Port number validator (1-65535).
 *
 * @example
 * ```typescript
 * port.parse(8080);      // Valid
 * port.parse(443);       // Valid
 * port.parse(0);         // Invalid - port < 1
 * port.parse(65536);     // Invalid - port > 65535
 * port.parse(8080.5);    // Invalid - must be integer
 * ```
 */
export declare const port: z.ZodNumber;
/**
 * Port number as string validator.
 * Accepts string input and validates it as a valid port number.
 *
 * @example
 * ```typescript
 * portString.parse('8080');    // Valid
 * portString.parse('443');     // Valid
 * portString.parse('0');       // Invalid - port < 1
 * portString.parse('65536');   // Invalid - port > 65535
 * portString.parse('abc');     // Invalid - not a number
 * ```
 */
export declare const portString: z.ZodEffects<z.ZodString, string, string>;
/**
 * Port range validator.
 * Accepts single port ("8080") or range ("80-443").
 * Validates that start port <= end port and both are in valid range (1-65535).
 *
 * @example
 * ```typescript
 * portRange.parse('8080');     // Valid - single port
 * portRange.parse('80-443');   // Valid - port range
 * portRange.parse('443-80');   // Invalid - start > end
 * portRange.parse('0-100');    // Invalid - port < 1
 * portRange.parse('65535-65536'); // Invalid - port > 65535
 * ```
 */
export declare const portRange: z.ZodEffects<z.ZodString, string, string>;
/**
 * VLAN ID validator (1-4094).
 * Valid VLAN IDs per IEEE 802.1Q standard (excluding reserved 0 and 4095).
 *
 * @example
 * ```typescript
 * vlanId.parse(100);     // Valid
 * vlanId.parse(4094);    // Valid (highest VLAN ID)
 * vlanId.parse(0);       // Invalid - reserved
 * vlanId.parse(4095);    // Invalid - reserved
 * vlanId.parse(4096);    // Invalid - out of range
 * ```
 */
export declare const vlanId: z.ZodNumber;
/**
 * VLAN ID as string validator.
 * Accepts string input and validates it as a valid VLAN ID (1-4094).
 *
 * @example
 * ```typescript
 * vlanIdString.parse('100');    // Valid
 * vlanIdString.parse('4094');   // Valid
 * vlanIdString.parse('0');      // Invalid - reserved
 * vlanIdString.parse('4095');   // Invalid - reserved
 * vlanIdString.parse('abc');    // Invalid - not a number
 * ```
 */
export declare const vlanIdString: z.ZodEffects<z.ZodString, string, string>;
/**
 * WireGuard public/private key validator.
 * Base64 encoded, exactly 44 characters ending in '='.
 *
 * @example
 * ```typescript
 * wgKey.parse('jI6DYlg34+z6Q+q6d8YB5ibQwQAawamJBcht5xF24mE='); // Valid
 * wgKey.parse('AAAA');                                         // Invalid - too short
 * wgKey.parse('jI6DYlg34+z6Q+q6d8YB5ibQwQAawamJBcht5xF24mE');  // Invalid - missing =
 * ```
 */
export declare const wgKey: z.ZodEffects<z.ZodString, string, string>;
/**
 * Hostname validator (RFC 1123).
 * Allows letters, digits, hyphens, and dots. Each label must start and end with alphanumeric.
 * Max length: 253 characters.
 *
 * @example
 * ```typescript
 * hostname.parse('router');              // Valid
 * hostname.parse('my-router.local');     // Valid
 * hostname.parse('router-01');           // Valid
 * hostname.parse('-invalid');            // Invalid - starts with hyphen
 * hostname.parse('invalid-');            // Invalid - ends with hyphen
 * hostname.parse('a'.repeat(254));       // Invalid - too long (>253)
 * ```
 */
export declare const hostname: z.ZodEffects<z.ZodString, string, string>;
/**
 * Domain name validator.
 * Requires at least one dot and a TLD of 2+ alphabetic characters.
 * Max length: 253 characters.
 *
 * @example
 * ```typescript
 * domain.parse('example.com');           // Valid
 * domain.parse('sub.example.co.uk');     // Valid
 * domain.parse('my-domain.org');         // Valid
 * domain.parse('localhost');             // Invalid - no TLD
 * domain.parse('example.c');             // Invalid - TLD too short
 * domain.parse('192.168.1.1');           // Invalid - numeric TLD
 * ```
 */
export declare const domain: z.ZodEffects<z.ZodString, string, string>;
/**
 * MikroTik interface name validator.
 * Valid characters: a-z, A-Z, 0-9, -, _, .
 * Must start with alphanumeric. Max length: 64 characters.
 *
 * @example
 * ```typescript
 * interfaceName.parse('ether1');         // Valid
 * interfaceName.parse('vlan.100');       // Valid
 * interfaceName.parse('bridge-1');       // Valid
 * interfaceName.parse('_invalid');       // Invalid - starts with underscore
 * interfaceName.parse('-invalid');       // Invalid - starts with hyphen
 * interfaceName.parse('a'.repeat(65));   // Invalid - too long (>64)
 * ```
 */
export declare const interfaceName: z.ZodEffects<z.ZodString, string, string>;
/**
 * MikroTik comment validator.
 * Max 255 characters, no control characters (ASCII 0-31 and 127).
 *
 * @example
 * ```typescript
 * comment.parse('This is a valid comment');      // Valid
 * comment.parse('Comment with émoji 🚀');       // Valid (UTF-8)
 * comment.parse('a'.repeat(255));                // Valid
 * comment.parse('a'.repeat(256));                // Invalid - too long
 * comment.parse('Comment\nwith newline');       // Invalid - contains control char
 * ```
 */
export declare const comment: z.ZodEffects<z.ZodString, string, string>;
/**
 * Duration string validator.
 * Supports: seconds (s), minutes (m), hours (h), days (d).
 *
 * @example
 * ```typescript
 * duration.parse('30s');     // Valid - 30 seconds
 * duration.parse('5m');      // Valid - 5 minutes
 * duration.parse('2h');      // Valid - 2 hours
 * duration.parse('7d');      // Valid - 7 days
 * duration.parse('30');      // Invalid - missing unit
 * duration.parse('30x');     // Invalid - unknown unit
 * ```
 */
export declare const duration: z.ZodEffects<z.ZodString, string, string>;
/**
 * Bandwidth string validator.
 * Supports optional unit suffixes: k (kilobits), m (megabits), g (gigabits).
 *
 * @example
 * ```typescript
 * bandwidth.parse('100');        // Valid - 100 bps
 * bandwidth.parse('100k');       // Valid - 100 Kbps
 * bandwidth.parse('1.5m');       // Valid - 1.5 Mbps
 * bandwidth.parse('1G');         // Valid - 1 Gbps
 * bandwidth.parse('100x');       // Invalid - unknown unit
 * bandwidth.parse('k100');       // Invalid - unit after number
 * ```
 */
export declare const bandwidth: z.ZodEffects<z.ZodString, string, string>;
/**
 * Subnet mask validator in dotted decimal format (e.g., 255.255.255.0).
 * Validates that the mask has contiguous 1s followed by contiguous 0s.
 *
 * @example
 * subnetMask.parse('255.255.255.0'); // Valid
 * subnetMask.parse('255.255.0.0');   // Valid
 * subnetMask.parse('255.255.128.0'); // Valid (/17)
 * subnetMask.parse('255.0.255.0');   // Invalid - non-contiguous
 */
export declare const subnetMask: z.ZodEffects<z.ZodString, string, string>;
/**
 * IP address with port validator (e.g., 192.168.1.1:8080).
 *
 * @example
 * ipWithPort.parse('192.168.1.1:8080'); // Valid
 * ipWithPort.parse('10.0.0.1:443');     // Valid
 * ipWithPort.parse('192.168.1.1');      // Invalid - missing port
 */
export declare const ipWithPort: z.ZodEffects<z.ZodString, string, string>;
/**
 * IP range validator (e.g., 192.168.1.1-192.168.1.100).
 * Validates that start IP is less than or equal to end IP.
 *
 * @example
 * ipRange.parse('192.168.1.1-192.168.1.100'); // Valid
 * ipRange.parse('10.0.0.1-10.0.0.254');       // Valid
 * ipRange.parse('192.168.1.100-192.168.1.1'); // Invalid - start > end
 */
export declare const ipRange: z.ZodEffects<z.ZodString, string, string>;
/**
 * Private IP address validator (RFC 1918).
 * Validates that the IP is in one of the private ranges:
 * - 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
 * - 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
 * - 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
 *
 * @example
 * privateIp.parse('192.168.1.1'); // Valid
 * privateIp.parse('10.0.0.1');    // Valid
 * privateIp.parse('172.16.0.1');  // Valid
 * privateIp.parse('8.8.8.8');     // Invalid - public IP
 */
export declare const privateIp: z.ZodEffects<z.ZodString, string, string>;
/**
 * Public IP address validator.
 * Validates that the IP is NOT in private, loopback, link-local, or reserved ranges.
 *
 * @example
 * publicIp.parse('8.8.8.8');      // Valid
 * publicIp.parse('1.1.1.1');      // Valid
 * publicIp.parse('192.168.1.1');  // Invalid - private
 * publicIp.parse('127.0.0.1');    // Invalid - loopback
 */
export declare const publicIp: z.ZodEffects<z.ZodString, string, string>;
/**
 * Multicast IP address validator (224.0.0.0/4).
 * Validates that the IP is in the multicast range: 224.0.0.0 - 239.255.255.255
 *
 * @example
 * multicastIp.parse('224.0.0.1');   // Valid
 * multicastIp.parse('239.255.255.255'); // Valid
 * multicastIp.parse('192.168.1.1'); // Invalid - not multicast
 */
export declare const multicastIp: z.ZodEffects<z.ZodString, string, string>;
/**
 * Loopback IP address validator (127.0.0.0/8).
 * Validates that the IP is in the loopback range: 127.0.0.0 - 127.255.255.255
 *
 * @example
 * loopbackIp.parse('127.0.0.1');     // Valid
 * loopbackIp.parse('127.255.255.255'); // Valid
 * loopbackIp.parse('192.168.1.1');  // Invalid - not loopback
 */
export declare const loopbackIp: z.ZodEffects<z.ZodString, string, string>;
/**
 * Multiple ports validator (comma-separated list of ports).
 * Accepts formats like "80,443,8080" or "22, 80, 443".
 *
 * @example
 * multiPort.parse('80,443');       // Valid
 * multiPort.parse('22, 80, 443');  // Valid
 * multiPort.parse('80');           // Valid (single port)
 * multiPort.parse('80,65536');     // Invalid - port out of range
 */
export declare const multiPort: z.ZodEffects<z.ZodString, string, string>;
/**
 * Collection of all network validators for convenient bulk import.
 *
 * @example
 * ```typescript
 * import { networkValidators } from '@nasnet/core/forms/network-validators';
 *
 * const schema = z.object({
 *   ipAddress: networkValidators.ipv4,
 *   port: networkValidators.port,
 *   vlan: networkValidators.vlanId
 * });
 * ```
 */
export declare const networkValidators: {
    ipv4: z.ZodEffects<z.ZodString, string, string>;
    ipv6: z.ZodString;
    ipAddress: z.ZodUnion<[z.ZodEffects<z.ZodString, string, string>, z.ZodString]>;
    mac: z.ZodEffects<z.ZodString, string, string>;
    cidr: z.ZodEffects<z.ZodString, string, string>;
    cidr6: z.ZodEffects<z.ZodString, string, string>;
    port: z.ZodNumber;
    portString: z.ZodEffects<z.ZodString, string, string>;
    portRange: z.ZodEffects<z.ZodString, string, string>;
    multiPort: z.ZodEffects<z.ZodString, string, string>;
    vlanId: z.ZodNumber;
    vlanIdString: z.ZodEffects<z.ZodString, string, string>;
    wgKey: z.ZodEffects<z.ZodString, string, string>;
    hostname: z.ZodEffects<z.ZodString, string, string>;
    domain: z.ZodEffects<z.ZodString, string, string>;
    interfaceName: z.ZodEffects<z.ZodString, string, string>;
    comment: z.ZodEffects<z.ZodString, string, string>;
    duration: z.ZodEffects<z.ZodString, string, string>;
    bandwidth: z.ZodEffects<z.ZodString, string, string>;
    subnetMask: z.ZodEffects<z.ZodString, string, string>;
    ipWithPort: z.ZodEffects<z.ZodString, string, string>;
    ipRange: z.ZodEffects<z.ZodString, string, string>;
    privateIp: z.ZodEffects<z.ZodString, string, string>;
    publicIp: z.ZodEffects<z.ZodString, string, string>;
    multicastIp: z.ZodEffects<z.ZodString, string, string>;
    loopbackIp: z.ZodEffects<z.ZodString, string, string>;
};
export default networkValidators;
//# sourceMappingURL=network-validators.d.ts.map