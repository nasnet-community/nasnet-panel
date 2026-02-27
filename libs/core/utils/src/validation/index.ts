/**
 * @fileoverview Zod validation schemas
 *
 * Provides runtime validation schemas for:
 * - Network configuration (IP addresses, CIDR, ports, MACs)
 * - Router connection settings
 * - WAN/LAN interface configuration
 * - VPN and firewall rules
 * - Application and user configuration
 * - API request/response contracts
 *
 * All schemas are reusable, composable, and provide helpful error messages.
 *
 * @example
 * ```typescript
 * import { ipAddressSchema, routerConnectionConfigSchema } from '@nasnet/core/utils';
 *
 * const config = routerConnectionConfigSchema.parse({
 *   address: '192.168.1.1',
 *   port: 80,
 *   username: 'admin',
 *   password: 'admin',
 * });
 * ```
 */

import { z } from 'zod';

/**
 * IP Address validation schema
 *
 * Validates IPv4 addresses (0.0.0.0 - 255.255.255.255).
 *
 * @example
 * ipAddressSchema.parse('192.168.1.1') // OK
 * ipAddressSchema.parse('999.999.999.999') // throws ZodError
 */
export const ipAddressSchema = z.string().ip({ version: 'v4' }).describe('Valid IPv4 address');

/**
 * CIDR notation validation schema
 *
 * Validates CIDR subnet notation with prefix length (0-32).
 *
 * @example
 * cidrSchema.parse('192.168.1.0/24') // OK
 * cidrSchema.parse('10.0.0.0/8') // OK
 * cidrSchema.parse('192.168.1.1') // throws ZodError (missing prefix)
 */
export const cidrSchema = z
  .string()
  .regex(
    /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$/
  )
  .describe('CIDR subnet notation (e.g., 192.168.1.0/24)');

/**
 * Port number validation schema
 *
 * Validates TCP/UDP port numbers (1-65535).
 *
 * @example
 * portSchema.parse(80) // OK
 * portSchema.parse(65535) // OK
 * portSchema.parse(0) // throws ZodError (min: 1)
 * portSchema.parse(70000) // throws ZodError (max: 65535)
 */
export const portSchema = z
  .number()
  .int()
  .min(1)
  .max(65535)
  .describe('Valid port number (1-65535)');

/**
 * MAC address validation schema
 *
 * Validates MAC addresses in XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX format.
 *
 * @example
 * macAddressSchema.parse('AA:BB:CC:DD:EE:00') // OK
 * macAddressSchema.parse('aa-bb-cc-dd-ee-00') // OK
 * macAddressSchema.parse('aabbccddee00') // throws ZodError (missing separators)
 */
export const macAddressSchema = z
  .string()
  .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
  .describe('MAC address in XX:XX:XX:XX:XX:XX format');

/**
 * Router connection configuration schema
 *
 * Validates router connection settings including credentials and timeout.
 *
 * @example
 * routerConnectionConfigSchema.parse({
 *   address: '192.168.1.1',
 *   username: 'admin',
 *   password: 'secret',
 * }) // OK (uses defaults for port, useTLS, etc.)
 */
export const routerConnectionConfigSchema = z
  .object({
    address: ipAddressSchema,
    port: portSchema.default(80),
    username: z.string().min(1),
    password: z.string().min(1),
    useTLS: z.boolean().default(false),
    timeout: z.number().int().min(1000).max(60000).default(5000),
    retries: z.number().int().min(0).max(5).default(2),
  })
  .describe('Router connection configuration');

/**
 * WAN configuration schema
 *
 * Validates WAN interface configuration with type, MTU, and VLAN settings.
 *
 * @example
 * wanConfigSchema.parse({ type: 'dhcp', enabled: true }) // OK
 */
export const wanConfigSchema = z
  .object({
    type: z.enum(['pppoe', 'dhcp', 'static', 'lte']),
    enabled: z.boolean().default(true),
    mtu: z.number().int().min(576).max(9000).optional(),
    vlan: z.number().int().min(1).max(4094).optional(),
  })
  .describe('WAN interface configuration');

/**
 * LAN configuration schema
 *
 * Validates LAN interface configuration with IP, subnet, and bridge settings.
 *
 * @example
 * lanConfigSchema.parse({
 *   interface: 'eth0',
 *   ip: '192.168.1.1',
 *   subnet: '192.168.1.0/24',
 * }) // OK
 */
export const lanConfigSchema = z
  .object({
    interface: z.string(),
    ip: ipAddressSchema,
    subnet: cidrSchema,
    bridge: z.boolean().default(false),
    enabled: z.boolean().default(true),
  })
  .describe('LAN interface configuration');

/**
 * VPN configuration schema
 *
 * Validates VPN configuration with protocol, credentials, and certificates.
 *
 * @example
 * vpnConfigSchema.parse({
 *   protocol: 'wireguard',
 *   enabled: true,
 *   server: 'vpn.example.com',
 * }) // OK
 */
export const vpnConfigSchema = z
  .object({
    protocol: z.enum(['wireguard', 'openvpn', 'l2tp', 'pptp', 'sstp', 'ikev2']),
    enabled: z.boolean().default(false),
    server: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    certificate: z.string().optional(),
  })
  .describe('VPN configuration');

/**
 * Firewall rule schema
 *
 * Validates firewall rule configuration with source/destination IP and ports.
 *
 * @example
 * firewallRuleSchema.parse({
 *   name: 'Allow SSH',
 *   protocol: 'tcp',
 *   destPort: 22,
 *   action: 'accept',
 * }) // OK
 */
export const firewallRuleSchema = z
  .object({
    name: z.string().min(1),
    protocol: z.enum(['tcp', 'udp', 'both', 'icmp']),
    sourceIP: ipAddressSchema.optional(),
    sourcePort: portSchema.optional(),
    destIP: ipAddressSchema.optional(),
    destPort: portSchema.optional(),
    action: z.enum(['accept', 'drop', 'reject']),
    enabled: z.boolean().default(true),
  })
  .describe('Firewall rule');

/**
 * Router status request schema
 *
 * Validates router status request parameters (optional timeout override).
 *
 * @example
 * routerStatusRequestSchema.parse({ timeout: 10000 }) // OK
 * routerStatusRequestSchema.parse({}) // OK (all fields optional)
 */
export const routerStatusRequestSchema = z
  .object({
    timeout: z.number().int().min(1000).optional(),
  })
  .describe('Router status request');

/**
 * Router status response schema
 *
 * Validates router status response with CPU, memory, and disk metrics.
 *
 * @example
 * routerStatusResponseSchema.parse({
 *   uptime: 1000000,
 *   cpu: 45.5,
 *   memory: 67.2,
 *   disk: 82.1,
 *   timestamp: new Date().toISOString(),
 * }) // OK
 */
export const routerStatusResponseSchema = z
  .object({
    uptime: z.number(),
    cpu: z.number().min(0).max(100),
    memory: z.number().min(0).max(100),
    disk: z.number().min(0).max(100),
    temperature: z.number().optional(),
    timestamp: z.string().datetime(),
  })
  .describe('Router status response');

/**
 * Application configuration schema
 *
 * Validates application settings including API, UI, and router defaults.
 *
 * @example
 * appConfigSchema.parse({
 *   api: {
 *     baseUrl: 'http://localhost:8080',
 *     timeout: 5000,
 *     retries: 2,
 *   },
 *   ui: { theme: 'dark', language: 'en' },
 *   router: { defaultPort: 80, defaultTimeout: 5000, maxRetries: 2 },
 * }) // OK
 */
export const appConfigSchema = z
  .object({
    api: z.object({
      baseUrl: z.string().url(),
      timeout: z.number().int().min(1000),
      retries: z.number().int().min(0),
    }),
    ui: z.object({
      theme: z.enum(['light', 'dark']).default('light'),
      language: z.enum(['en', 'fa', 'de']).default('en'),
    }),
    router: z.object({
      defaultPort: portSchema.default(80),
      defaultTimeout: z.number().int().min(1000),
      maxRetries: z.number().int().min(0),
    }),
  })
  .describe('Application configuration');

/**
 * User preferences schema
 *
 * Validates user preferences including theme, language, and notification settings.
 *
 * @example
 * userPreferencesSchema.parse({
 *   theme: 'dark',
 *   language: 'en',
 *   notifications: {
 *     enabled: true,
 *     showWarnings: true,
 *     showErrors: true,
 *   },
 * }) // OK
 */
export const userPreferencesSchema = z
  .object({
    theme: z.enum(['light', 'dark']).optional(),
    language: z.enum(['en', 'fa', 'de']).optional(),
    autoConnect: z.boolean().optional(),
    notifications: z
      .object({
        enabled: z.boolean(),
        showWarnings: z.boolean(),
        showErrors: z.boolean(),
      })
      .optional(),
  })
  .describe('User preferences');
