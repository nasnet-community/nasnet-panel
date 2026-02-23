import { z } from 'zod';
/**
 * NAT Rule Types and Schemas
 *
 * NAT (Network Address Translation) rules control how traffic is translated
 * between internal and external networks in MikroTik RouterOS.
 *
 * NAT Types:
 * - srcnat: Source NAT (outgoing traffic) - includes masquerade
 * - dstnat: Destination NAT (incoming traffic) - includes port forwarding
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-2-implement-nat-configuration.md
 */
/**
 * NAT Chain - srcnat or dstnat
 */
export declare const NatChainSchema: z.ZodEnum<["srcnat", "dstnat"]>;
export type NatChain = z.infer<typeof NatChainSchema>;
/**
 * NAT Action - What transformation to apply
 */
export declare const NatActionSchema: z.ZodEnum<["masquerade", "dst-nat", "src-nat", "redirect", "netmap", "same", "accept", "drop", "jump", "return", "log", "passthrough"]>;
export type NatAction = z.infer<typeof NatActionSchema>;
/**
 * Protocol type for NAT rules
 */
export declare const ProtocolSchema: z.ZodEnum<["tcp", "udp", "icmp", "gre", "esp", "ah", "ipip", "sctp", "all"]>;
export type Protocol = z.infer<typeof ProtocolSchema>;
/**
 * NAT Rule Input Schema
 *
 * Complete schema for NAT rule configuration.
 * Includes all matchers and action parameters.
 */
export declare const NATRuleInputSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    chain: z.ZodEnum<["srcnat", "dstnat"]>;
    action: z.ZodEnum<["masquerade", "dst-nat", "src-nat", "redirect", "netmap", "same", "accept", "drop", "jump", "return", "log", "passthrough"]>;
    position: z.ZodOptional<z.ZodNumber>;
    protocol: z.ZodOptional<z.ZodEnum<["tcp", "udp", "icmp", "gre", "esp", "ah", "ipip", "sctp", "all"]>>;
    srcAddress: z.ZodOptional<z.ZodString>;
    dstAddress: z.ZodOptional<z.ZodString>;
    srcPort: z.ZodOptional<z.ZodString>;
    dstPort: z.ZodOptional<z.ZodString>;
    inInterface: z.ZodOptional<z.ZodString>;
    outInterface: z.ZodOptional<z.ZodString>;
    inInterfaceList: z.ZodOptional<z.ZodString>;
    outInterfaceList: z.ZodOptional<z.ZodString>;
    toAddresses: z.ZodOptional<z.ZodString>;
    toPorts: z.ZodOptional<z.ZodString>;
    comment: z.ZodOptional<z.ZodString>;
    disabled: z.ZodDefault<z.ZodBoolean>;
    log: z.ZodDefault<z.ZodBoolean>;
    logPrefix: z.ZodOptional<z.ZodString>;
    packets: z.ZodOptional<z.ZodNumber>;
    bytes: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    log: boolean;
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "masquerade" | "dst-nat" | "src-nat" | "redirect" | "netmap" | "same" | "return";
    disabled: boolean;
    chain: "srcnat" | "dstnat";
    id?: string | undefined;
    position?: number | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "gre" | "esp" | "ah" | "ipip" | "sctp" | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    inInterfaceList?: string | undefined;
    outInterfaceList?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
    toAddresses?: string | undefined;
    toPorts?: string | undefined;
}, {
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "masquerade" | "dst-nat" | "src-nat" | "redirect" | "netmap" | "same" | "return";
    chain: "srcnat" | "dstnat";
    id?: string | undefined;
    log?: boolean | undefined;
    disabled?: boolean | undefined;
    position?: number | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "gre" | "esp" | "ah" | "ipip" | "sctp" | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    inInterfaceList?: string | undefined;
    outInterfaceList?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
    toAddresses?: string | undefined;
    toPorts?: string | undefined;
}>, {
    log: boolean;
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "masquerade" | "dst-nat" | "src-nat" | "redirect" | "netmap" | "same" | "return";
    disabled: boolean;
    chain: "srcnat" | "dstnat";
    id?: string | undefined;
    position?: number | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "gre" | "esp" | "ah" | "ipip" | "sctp" | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    inInterfaceList?: string | undefined;
    outInterfaceList?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
    toAddresses?: string | undefined;
    toPorts?: string | undefined;
}, {
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "masquerade" | "dst-nat" | "src-nat" | "redirect" | "netmap" | "same" | "return";
    chain: "srcnat" | "dstnat";
    id?: string | undefined;
    log?: boolean | undefined;
    disabled?: boolean | undefined;
    position?: number | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "gre" | "esp" | "ah" | "ipip" | "sctp" | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    inInterfaceList?: string | undefined;
    outInterfaceList?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
    toAddresses?: string | undefined;
    toPorts?: string | undefined;
}>, {
    log: boolean;
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "masquerade" | "dst-nat" | "src-nat" | "redirect" | "netmap" | "same" | "return";
    disabled: boolean;
    chain: "srcnat" | "dstnat";
    id?: string | undefined;
    position?: number | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "gre" | "esp" | "ah" | "ipip" | "sctp" | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    inInterfaceList?: string | undefined;
    outInterfaceList?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
    toAddresses?: string | undefined;
    toPorts?: string | undefined;
}, {
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "masquerade" | "dst-nat" | "src-nat" | "redirect" | "netmap" | "same" | "return";
    chain: "srcnat" | "dstnat";
    id?: string | undefined;
    log?: boolean | undefined;
    disabled?: boolean | undefined;
    position?: number | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "gre" | "esp" | "ah" | "ipip" | "sctp" | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    inInterfaceList?: string | undefined;
    outInterfaceList?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
    toAddresses?: string | undefined;
    toPorts?: string | undefined;
}>;
export type NATRuleInput = z.infer<typeof NATRuleInputSchema>;
/**
 * Port Forward Input Schema
 *
 * Simplified schema for the Port Forward Wizard.
 * Creates both a dst-nat rule and a filter accept rule.
 */
export declare const PortForwardSchema: z.ZodObject<{
    protocol: z.ZodDefault<z.ZodEnum<["tcp", "udp", "icmp", "gre", "esp", "ah", "ipip", "sctp", "all"]>>;
    externalPort: z.ZodNumber;
    internalIP: z.ZodString;
    internalPort: z.ZodOptional<z.ZodNumber>;
    name: z.ZodOptional<z.ZodString>;
    wanInterface: z.ZodOptional<z.ZodString>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    protocol: "all" | "tcp" | "udp" | "icmp" | "gre" | "esp" | "ah" | "ipip" | "sctp";
    externalPort: number;
    internalIP: string;
    name?: string | undefined;
    comment?: string | undefined;
    internalPort?: number | undefined;
    wanInterface?: string | undefined;
}, {
    externalPort: number;
    internalIP: string;
    name?: string | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "gre" | "esp" | "ah" | "ipip" | "sctp" | undefined;
    comment?: string | undefined;
    internalPort?: number | undefined;
    wanInterface?: string | undefined;
}>;
export type PortForward = z.infer<typeof PortForwardSchema>;
/**
 * Port Forward Result - Represents created port forward configuration
 *
 * Contains the IDs and configuration of both the NAT rule (dst-nat)
 * and optional filter rule (accept) that were created for a port forward.
 *
 * @example
 * ```ts
 * const result: PortForwardResult = {
 *   id: 'pf-1',
 *   name: 'Web Server',
 *   protocol: 'tcp',
 *   externalPort: 80,
 *   internalIP: '192.168.1.100',
 *   internalPort: 8080,
 *   status: 'active',
 *   natRuleId: 'nat-rule-123',
 *   filterRuleId: 'filter-rule-456',
 *   createdAt: new Date(),
 * };
 * ```
 */
export interface PortForwardResult {
    /** Unique identifier for the port forward */
    readonly id: string;
    /** Optional friendly name for the port forward */
    readonly name?: string;
    /** Protocol type (tcp, udp, etc.) */
    readonly protocol: Protocol;
    /** External port number (1-65535) */
    readonly externalPort: number;
    /** Internal IP address to forward to */
    readonly internalIP: string;
    /** Internal port number (1-65535), defaults to externalPort */
    readonly internalPort: number;
    /** Status of the port forward (active, disabled, or error) */
    readonly status: 'active' | 'disabled' | 'error';
    /** ID of the dst-nat rule that performs the translation */
    readonly natRuleId: string;
    /** ID of the filter accept rule (optional) */
    readonly filterRuleId?: string;
    /** Creation timestamp */
    readonly createdAt?: Date;
}
/**
 * Get visible fields for a specific NAT action
 *
 * Different NAT actions require different fields. This helper returns
 * the list of field names that should be visible in the UI for a given action.
 *
 * @param action - The NAT action type
 * @returns Array of field names to show in the UI
 *
 * @example
 * ```ts
 * const fields = getVisibleFieldsForNATAction('masquerade');
 * // ['chain', 'srcAddress', 'outInterface', 'disabled', 'comment']
 * ```
 */
export declare function getVisibleFieldsForNATAction(action: NatAction): string[];
/**
 * Generate a human-readable preview of a NAT rule
 *
 * Creates a CLI-style command preview for a NAT rule configuration.
 * Useful for displaying in the wizard review step.
 *
 * @param rule - The NAT rule input to preview
 * @returns Human-readable command string
 *
 * @example
 * ```ts
 * const preview = generateNATRulePreview({
 *   chain: 'dstnat',
 *   action: 'dst-nat',
 *   protocol: 'tcp',
 *   dstPort: '80',
 *   toAddresses: '192.168.1.100',
 *   toPorts: '8080',
 * });
 * // "/ip firewall nat add chain=dstnat action=dst-nat protocol=tcp dst-port=80 to-addresses=192.168.1.100 to-ports=8080"
 * ```
 */
export declare function generateNATRulePreview(rule: Partial<NATRuleInput>): string;
/**
 * Generate a human-readable summary for a port forward
 *
 * Creates a simplified description of what a port forward does.
 *
 * @param portForward - The port forward configuration
 * @returns Human-readable summary
 *
 * @example
 * ```ts
 * const summary = generatePortForwardSummary({
 *   protocol: 'tcp',
 *   externalPort: 80,
 *   internalIP: '192.168.1.100',
 *   internalPort: 8080,
 * });
 * // "Forward TCP port 80 to 192.168.1.100:8080"
 * ```
 */
export declare function generatePortForwardSummary(portForward: PortForward): string;
/**
 * Validate port conflict
 *
 * Checks if a port forward conflicts with existing forwards.
 *
 * @param newForward - The new port forward to validate
 * @param existingForwards - List of existing port forwards
 * @returns true if conflict exists, false otherwise
 */
export declare function hasPortForwardConflict(newForward: PortForward, existingForwards: PortForwardResult[]): boolean;
/**
 * Default NAT rule for masquerade (most common use case)
 */
export declare const DEFAULT_MASQUERADE_RULE: Partial<NATRuleInput>;
/**
 * Default port forward configuration
 */
export declare const DEFAULT_PORT_FORWARD: Partial<PortForward>;
/**
 * Common service ports for port forwarding
 */
export declare const COMMON_SERVICE_PORTS: {
    readonly HTTP: 80;
    readonly HTTPS: 443;
    readonly SSH: 22;
    readonly FTP: 21;
    readonly SMTP: 25;
    readonly DNS: 53;
    readonly RDP: 3389;
    readonly 'Minecraft (Java)': 25565;
    readonly 'Minecraft (Bedrock)': 19132;
    readonly 'Plex Media Server': 32400;
    readonly 'Game Server (Various)': 27015;
};
//# sourceMappingURL=nat-rule.types.d.ts.map