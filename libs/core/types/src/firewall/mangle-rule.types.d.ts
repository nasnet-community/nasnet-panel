import { z } from 'zod';
/**
 * Mangle Rule Types and Schemas
 *
 * Mangle rules are used for traffic marking and manipulation in MikroTik RouterOS.
 * They enable QoS, policy routing, and advanced traffic control.
 *
 * Packet Flow:
 * PACKET IN → prerouting → [Routing Decision] → input/forward → output → postrouting → PACKET OUT
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-5-implement-mangle-rules.md
 */
/**
 * Mangle Chain - 5 chain points in packet processing
 */
export declare const MangleChainSchema: z.ZodEnum<["prerouting", "input", "forward", "output", "postrouting"]>;
export type MangleChain = z.infer<typeof MangleChainSchema>;
/**
 * Mangle Action - What to do with matched packets
 */
export declare const MangleActionSchema: z.ZodEnum<["mark-connection", "mark-packet", "mark-routing", "change-ttl", "change-dscp", "change-mss", "passthrough", "accept", "drop", "jump", "log"]>;
export type MangleAction = z.infer<typeof MangleActionSchema>;
/**
 * Connection State for matching
 */
export declare const ConnectionStateSchema: z.ZodEnum<["established", "new", "related", "invalid", "untracked"]>;
export type ConnectionState = z.infer<typeof ConnectionStateSchema>;
/**
 * NAT State for matching
 */
export declare const ConnectionNatStateSchema: z.ZodEnum<["srcnat", "dstnat"]>;
export type ConnectionNatState = z.infer<typeof ConnectionNatStateSchema>;
/**
 * Mangle Rule Schema
 *
 * Complete schema for mangle rule configuration with all matchers and actions.
 */
export declare const MangleRuleSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    chain: z.ZodEnum<["prerouting", "input", "forward", "output", "postrouting"]>;
    action: z.ZodEnum<["mark-connection", "mark-packet", "mark-routing", "change-ttl", "change-dscp", "change-mss", "passthrough", "accept", "drop", "jump", "log"]>;
    position: z.ZodOptional<z.ZodNumber>;
    protocol: z.ZodOptional<z.ZodString>;
    srcAddress: z.ZodOptional<z.ZodString>;
    dstAddress: z.ZodOptional<z.ZodString>;
    srcPort: z.ZodOptional<z.ZodString>;
    dstPort: z.ZodOptional<z.ZodString>;
    srcAddressList: z.ZodOptional<z.ZodString>;
    dstAddressList: z.ZodOptional<z.ZodString>;
    inInterface: z.ZodOptional<z.ZodString>;
    outInterface: z.ZodOptional<z.ZodString>;
    inInterfaceList: z.ZodOptional<z.ZodString>;
    outInterfaceList: z.ZodOptional<z.ZodString>;
    connectionState: z.ZodOptional<z.ZodArray<z.ZodEnum<["established", "new", "related", "invalid", "untracked"]>, "many">>;
    connectionNatState: z.ZodOptional<z.ZodArray<z.ZodEnum<["srcnat", "dstnat"]>, "many">>;
    connectionMark: z.ZodOptional<z.ZodString>;
    packetMark: z.ZodOptional<z.ZodString>;
    routingMark: z.ZodOptional<z.ZodString>;
    packetSize: z.ZodOptional<z.ZodString>;
    layer7Protocol: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    tcpFlags: z.ZodOptional<z.ZodString>;
    newConnectionMark: z.ZodOptional<z.ZodString>;
    newPacketMark: z.ZodOptional<z.ZodString>;
    newRoutingMark: z.ZodOptional<z.ZodString>;
    passthrough: z.ZodDefault<z.ZodBoolean>;
    newDscp: z.ZodOptional<z.ZodNumber>;
    newTtl: z.ZodOptional<z.ZodString>;
    newMss: z.ZodOptional<z.ZodNumber>;
    jumpTarget: z.ZodOptional<z.ZodString>;
    comment: z.ZodOptional<z.ZodString>;
    disabled: z.ZodDefault<z.ZodBoolean>;
    log: z.ZodDefault<z.ZodBoolean>;
    logPrefix: z.ZodOptional<z.ZodString>;
    packets: z.ZodOptional<z.ZodNumber>;
    bytes: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    log: boolean;
    action: "log" | "accept" | "passthrough" | "mark-connection" | "mark-packet" | "mark-routing" | "change-ttl" | "change-dscp" | "change-mss" | "drop" | "jump";
    disabled: boolean;
    passthrough: boolean;
    chain: "input" | "output" | "prerouting" | "forward" | "postrouting";
    id?: string | undefined;
    content?: string | undefined;
    position?: number | undefined;
    bytes?: number | undefined;
    protocol?: string | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    srcAddressList?: string | undefined;
    dstAddressList?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    inInterfaceList?: string | undefined;
    outInterfaceList?: string | undefined;
    connectionState?: ("established" | "new" | "related" | "invalid" | "untracked")[] | undefined;
    connectionNatState?: ("srcnat" | "dstnat")[] | undefined;
    connectionMark?: string | undefined;
    packetMark?: string | undefined;
    routingMark?: string | undefined;
    packetSize?: string | undefined;
    layer7Protocol?: string | undefined;
    tcpFlags?: string | undefined;
    newConnectionMark?: string | undefined;
    newPacketMark?: string | undefined;
    newRoutingMark?: string | undefined;
    newDscp?: number | undefined;
    newTtl?: string | undefined;
    newMss?: number | undefined;
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}, {
    action: "log" | "accept" | "passthrough" | "mark-connection" | "mark-packet" | "mark-routing" | "change-ttl" | "change-dscp" | "change-mss" | "drop" | "jump";
    chain: "input" | "output" | "prerouting" | "forward" | "postrouting";
    id?: string | undefined;
    log?: boolean | undefined;
    disabled?: boolean | undefined;
    content?: string | undefined;
    position?: number | undefined;
    bytes?: number | undefined;
    passthrough?: boolean | undefined;
    protocol?: string | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    srcAddressList?: string | undefined;
    dstAddressList?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    inInterfaceList?: string | undefined;
    outInterfaceList?: string | undefined;
    connectionState?: ("established" | "new" | "related" | "invalid" | "untracked")[] | undefined;
    connectionNatState?: ("srcnat" | "dstnat")[] | undefined;
    connectionMark?: string | undefined;
    packetMark?: string | undefined;
    routingMark?: string | undefined;
    packetSize?: string | undefined;
    layer7Protocol?: string | undefined;
    tcpFlags?: string | undefined;
    newConnectionMark?: string | undefined;
    newPacketMark?: string | undefined;
    newRoutingMark?: string | undefined;
    newDscp?: number | undefined;
    newTtl?: string | undefined;
    newMss?: number | undefined;
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}>;
export type MangleRule = z.infer<typeof MangleRuleSchema>;
export type MangleRuleInput = z.input<typeof MangleRuleSchema>;
/**
 * DSCP Class Metadata - Information about a Differentiated Services Code Point
 *
 * Used for QoS configuration, stores both the numeric DSCP value and
 * human-friendly names for different traffic classes (0-63).
 *
 * @example
 * ```ts
 * const ef: DscpClass = {
 *   value: 46,
 *   name: 'EF',
 *   description: 'Expedited Forwarding',
 *   useCase: 'VoIP audio (priority)',
 * };
 * ```
 */
export interface DscpClass {
    /** Numeric DSCP value (0-63) */
    readonly value: number;
    /** DSCP class name (e.g., 'EF', 'AF11', 'CS5') */
    readonly name: string;
    /** Human-readable description of the DSCP class */
    readonly description: string;
    /** Common use cases for this DSCP value */
    readonly useCase: string;
}
/**
 * Standard DSCP Classes
 *
 * Used in DSCP selector dropdown for user-friendly QoS configuration.
 */
export declare const DSCP_CLASSES: DscpClass[];
/**
 * Get DSCP class by value
 */
export declare function getDscpClass(value: number): DscpClass | undefined;
/**
 * Get DSCP class name by value (for display)
 */
export declare function getDscpClassName(value: number): string;
/**
 * Get full DSCP description (for dropdown)
 */
export declare function getDscpDescription(value: number): string;
/**
 * Mark Type Metadata - Information about packet marking strategies
 *
 * Defines different ways to mark packets and connections for routing,
 * QoS, and traffic shaping operations.
 *
 * @example
 * ```ts
 * const connMark: MarkType = {
 *   name: 'Connection Mark',
 *   action: 'mark-connection',
 *   field: 'newConnectionMark',
 *   persistence: 'All packets in connection',
 *   useCase: 'QoS queue trees, routing policies',
 * };
 * ```
 */
export interface MarkType {
    /** Human-readable name of the mark type */
    readonly name: string;
    /** Action used to create this type of mark */
    readonly action: MangleAction;
    /** Field name in MangleRule where this mark is stored */
    readonly field: 'newConnectionMark' | 'newPacketMark' | 'newRoutingMark';
    /** How long the mark persists (connection, packet, or routing decision) */
    readonly persistence: string;
    /** Common use cases for this mark type */
    readonly useCase: string;
}
/**
 * Mark Types for different traffic marking purposes
 */
export declare const MARK_TYPES: MarkType[];
/**
 * Default mangle rule for form initialization
 */
export declare const DEFAULT_MANGLE_RULE: Partial<MangleRule>;
/**
 * Validate mark name
 */
export declare function isValidMarkName(name: string): boolean;
/**
 * Validate DSCP value
 */
export declare function isValidDscp(value: number): boolean;
/**
 * Check if action requires specific fields
 */
export declare function getRequiredFieldsForAction(action: MangleAction): string[];
/**
 * Get visible fields for action (for conditional form rendering)
 */
export declare function getVisibleFieldsForAction(action: MangleAction): string[];
//# sourceMappingURL=mangle-rule.types.d.ts.map