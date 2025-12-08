/**
 * Zod Validation Schemas
 * Provides runtime validation schemas for API contracts and configuration
 */

import { z } from 'zod';

/**
 * IP Address validation schema
 */
export const ipAddressSchema = z.string()
  .ip({ version: 'v4' })
  .describe('Valid IPv4 address');

/**
 * CIDR notation validation schema
 */
export const cidrSchema = z.string()
  .regex(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$/)
  .describe('CIDR subnet notation (e.g., 192.168.1.0/24)');

/**
 * Port number validation schema
 */
export const portSchema = z.number()
  .int()
  .min(1)
  .max(65535)
  .describe('Valid port number (1-65535)');

/**
 * MAC address validation schema
 */
export const macAddressSchema = z.string()
  .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)
  .describe('MAC address in XX:XX:XX:XX:XX:XX format');

/**
 * Router connection configuration schema
 */
export const routerConnectionConfigSchema = z.object({
  address: ipAddressSchema,
  port: portSchema.default(80),
  username: z.string().min(1),
  password: z.string().min(1),
  useTLS: z.boolean().default(false),
  timeout: z.number().int().min(1000).max(60000).default(5000),
  retries: z.number().int().min(0).max(5).default(2)
}).describe('Router connection configuration');

/**
 * WAN configuration schema
 */
export const wanConfigSchema = z.object({
  type: z.enum(['pppoe', 'dhcp', 'static', 'lte']),
  enabled: z.boolean().default(true),
  mtu: z.number().int().min(576).max(9000).optional(),
  vlan: z.number().int().min(1).max(4094).optional()
}).describe('WAN interface configuration');

/**
 * LAN configuration schema
 */
export const lanConfigSchema = z.object({
  interface: z.string(),
  ip: ipAddressSchema,
  subnet: cidrSchema,
  bridge: z.boolean().default(false),
  enabled: z.boolean().default(true)
}).describe('LAN interface configuration');

/**
 * VPN configuration schema
 */
export const vpnConfigSchema = z.object({
  protocol: z.enum(['wireguard', 'openvpn', 'l2tp', 'pptp', 'sstp', 'ikev2']),
  enabled: z.boolean().default(false),
  server: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  certificate: z.string().optional()
}).describe('VPN configuration');

/**
 * Firewall rule schema
 */
export const firewallRuleSchema = z.object({
  name: z.string().min(1),
  protocol: z.enum(['tcp', 'udp', 'both', 'icmp']),
  sourceIP: ipAddressSchema.optional(),
  sourcePort: portSchema.optional(),
  destIP: ipAddressSchema.optional(),
  destPort: portSchema.optional(),
  action: z.enum(['accept', 'drop', 'reject']),
  enabled: z.boolean().default(true)
}).describe('Firewall rule');

/**
 * API request/response schema for router status
 */
export const routerStatusRequestSchema = z.object({
  timeout: z.number().int().min(1000).optional()
}).describe('Router status request');

export const routerStatusResponseSchema = z.object({
  uptime: z.number(),
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  disk: z.number().min(0).max(100),
  temperature: z.number().optional(),
  timestamp: z.string().datetime()
}).describe('Router status response');

/**
 * Application configuration schema
 */
export const appConfigSchema = z.object({
  api: z.object({
    baseUrl: z.string().url(),
    timeout: z.number().int().min(1000),
    retries: z.number().int().min(0)
  }),
  ui: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    language: z.enum(['en', 'fa', 'de']).default('en')
  }),
  router: z.object({
    defaultPort: portSchema.default(80),
    defaultTimeout: z.number().int().min(1000),
    maxRetries: z.number().int().min(0)
  })
}).describe('Application configuration');

/**
 * User preferences schema
 */
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  language: z.enum(['en', 'fa', 'de']).optional(),
  autoConnect: z.boolean().optional(),
  notifications: z.object({
    enabled: z.boolean(),
    showWarnings: z.boolean(),
    showErrors: z.boolean()
  }).optional()
}).describe('User preferences');
