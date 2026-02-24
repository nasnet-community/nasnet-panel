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
export declare const ipAddressSchema: z.ZodString;
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
export declare const cidrSchema: z.ZodString;
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
export declare const portSchema: z.ZodNumber;
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
export declare const macAddressSchema: z.ZodString;
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
export declare const routerConnectionConfigSchema: z.ZodObject<{
    address: z.ZodString;
    port: z.ZodDefault<z.ZodNumber>;
    username: z.ZodString;
    password: z.ZodString;
    useTLS: z.ZodDefault<z.ZodBoolean>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retries: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeout: number;
    port: number;
    address: string;
    password: string;
    username: string;
    useTLS: boolean;
    retries: number;
}, {
    address: string;
    password: string;
    username: string;
    timeout?: number | undefined;
    port?: number | undefined;
    useTLS?: boolean | undefined;
    retries?: number | undefined;
}>;
/**
 * WAN configuration schema
 *
 * Validates WAN interface configuration with type, MTU, and VLAN settings.
 *
 * @example
 * wanConfigSchema.parse({ type: 'dhcp', enabled: true }) // OK
 */
export declare const wanConfigSchema: z.ZodObject<{
    type: z.ZodEnum<["pppoe", "dhcp", "static", "lte"]>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    mtu: z.ZodOptional<z.ZodNumber>;
    vlan: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "dhcp" | "pppoe" | "static" | "lte";
    enabled: boolean;
    vlan?: number | undefined;
    mtu?: number | undefined;
}, {
    type: "dhcp" | "pppoe" | "static" | "lte";
    enabled?: boolean | undefined;
    vlan?: number | undefined;
    mtu?: number | undefined;
}>;
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
export declare const lanConfigSchema: z.ZodObject<{
    interface: z.ZodString;
    ip: z.ZodString;
    subnet: z.ZodString;
    bridge: z.ZodDefault<z.ZodBoolean>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    ip: string;
    interface: string;
    bridge: boolean;
    subnet: string;
}, {
    ip: string;
    interface: string;
    subnet: string;
    enabled?: boolean | undefined;
    bridge?: boolean | undefined;
}>;
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
export declare const vpnConfigSchema: z.ZodObject<{
    protocol: z.ZodEnum<["wireguard", "openvpn", "l2tp", "pptp", "sstp", "ikev2"]>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    server: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    certificate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    protocol: "wireguard" | "openvpn" | "l2tp" | "pptp" | "sstp" | "ikev2";
    server?: string | undefined;
    certificate?: string | undefined;
    password?: string | undefined;
    username?: string | undefined;
}, {
    protocol: "wireguard" | "openvpn" | "l2tp" | "pptp" | "sstp" | "ikev2";
    enabled?: boolean | undefined;
    server?: string | undefined;
    certificate?: string | undefined;
    password?: string | undefined;
    username?: string | undefined;
}>;
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
export declare const firewallRuleSchema: z.ZodObject<{
    name: z.ZodString;
    protocol: z.ZodEnum<["tcp", "udp", "both", "icmp"]>;
    sourceIP: z.ZodOptional<z.ZodString>;
    sourcePort: z.ZodOptional<z.ZodNumber>;
    destIP: z.ZodOptional<z.ZodString>;
    destPort: z.ZodOptional<z.ZodNumber>;
    action: z.ZodEnum<["accept", "drop", "reject"]>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    enabled: boolean;
    action: "accept" | "drop" | "reject";
    protocol: "tcp" | "udp" | "icmp" | "both";
    sourceIP?: string | undefined;
    sourcePort?: number | undefined;
    destIP?: string | undefined;
    destPort?: number | undefined;
}, {
    name: string;
    action: "accept" | "drop" | "reject";
    protocol: "tcp" | "udp" | "icmp" | "both";
    enabled?: boolean | undefined;
    sourceIP?: string | undefined;
    sourcePort?: number | undefined;
    destIP?: string | undefined;
    destPort?: number | undefined;
}>;
/**
 * Router status request schema
 *
 * Validates router status request parameters (optional timeout override).
 *
 * @example
 * routerStatusRequestSchema.parse({ timeout: 10000 }) // OK
 * routerStatusRequestSchema.parse({}) // OK (all fields optional)
 */
export declare const routerStatusRequestSchema: z.ZodObject<{
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeout?: number | undefined;
}, {
    timeout?: number | undefined;
}>;
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
export declare const routerStatusResponseSchema: z.ZodObject<{
    uptime: z.ZodNumber;
    cpu: z.ZodNumber;
    memory: z.ZodNumber;
    disk: z.ZodNumber;
    temperature: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    uptime: number;
    timestamp: string;
    cpu: number;
    memory: number;
    disk: number;
    temperature?: number | undefined;
}, {
    uptime: number;
    timestamp: string;
    cpu: number;
    memory: number;
    disk: number;
    temperature?: number | undefined;
}>;
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
export declare const appConfigSchema: z.ZodObject<{
    api: z.ZodObject<{
        baseUrl: z.ZodString;
        timeout: z.ZodNumber;
        retries: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timeout: number;
        retries: number;
        baseUrl: string;
    }, {
        timeout: number;
        retries: number;
        baseUrl: string;
    }>;
    ui: z.ZodObject<{
        theme: z.ZodDefault<z.ZodEnum<["light", "dark"]>>;
        language: z.ZodDefault<z.ZodEnum<["en", "fa", "de"]>>;
    }, "strip", z.ZodTypeAny, {
        theme: "light" | "dark";
        language: "en" | "fa" | "de";
    }, {
        theme?: "light" | "dark" | undefined;
        language?: "en" | "fa" | "de" | undefined;
    }>;
    router: z.ZodObject<{
        defaultPort: z.ZodDefault<z.ZodNumber>;
        defaultTimeout: z.ZodNumber;
        maxRetries: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        maxRetries: number;
        defaultPort: number;
        defaultTimeout: number;
    }, {
        maxRetries: number;
        defaultTimeout: number;
        defaultPort?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    router: {
        maxRetries: number;
        defaultPort: number;
        defaultTimeout: number;
    };
    api: {
        timeout: number;
        retries: number;
        baseUrl: string;
    };
    ui: {
        theme: "light" | "dark";
        language: "en" | "fa" | "de";
    };
}, {
    router: {
        maxRetries: number;
        defaultTimeout: number;
        defaultPort?: number | undefined;
    };
    api: {
        timeout: number;
        retries: number;
        baseUrl: string;
    };
    ui: {
        theme?: "light" | "dark" | undefined;
        language?: "en" | "fa" | "de" | undefined;
    };
}>;
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
export declare const userPreferencesSchema: z.ZodObject<{
    theme: z.ZodOptional<z.ZodEnum<["light", "dark"]>>;
    language: z.ZodOptional<z.ZodEnum<["en", "fa", "de"]>>;
    autoConnect: z.ZodOptional<z.ZodBoolean>;
    notifications: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        showWarnings: z.ZodBoolean;
        showErrors: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        showWarnings: boolean;
        showErrors: boolean;
    }, {
        enabled: boolean;
        showWarnings: boolean;
        showErrors: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    theme?: "light" | "dark" | undefined;
    notifications?: {
        enabled: boolean;
        showWarnings: boolean;
        showErrors: boolean;
    } | undefined;
    language?: "en" | "fa" | "de" | undefined;
    autoConnect?: boolean | undefined;
}, {
    theme?: "light" | "dark" | undefined;
    notifications?: {
        enabled: boolean;
        showWarnings: boolean;
        showErrors: boolean;
    } | undefined;
    language?: "en" | "fa" | "de" | undefined;
    autoConnect?: boolean | undefined;
}>;
//# sourceMappingURL=index.d.ts.map