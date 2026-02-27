import { z } from 'zod';
/**
 * Filter Rule Types and Schemas
 *
 * Filter rules control which traffic is allowed or blocked through the router.
 * They are processed in order by chain (input, forward, output).
 *
 * Chains:
 * - input: Packets destined for the router itself
 * - forward: Packets passing through the router
 * - output: Packets originating from the router
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-1-implement-firewall-filter-rules.md
 */
/**
 * Filter Chain - 3 chain points for packet filtering
 */
export declare const FilterChainSchema: z.ZodEnum<["input", "forward", "output"]>;
export type FilterChain = z.infer<typeof FilterChainSchema>;
/**
 * Filter Action - What to do with matched packets
 */
export declare const FilterActionSchema: z.ZodEnum<["accept", "drop", "reject", "log", "jump", "tarpit", "passthrough"]>;
export type FilterAction = z.infer<typeof FilterActionSchema>;
/**
 * Protocol types for filtering
 */
export declare const FilterProtocolSchema: z.ZodEnum<["tcp", "udp", "icmp", "ipv6-icmp", "all"]>;
export type FilterProtocol = z.infer<typeof FilterProtocolSchema>;
/**
 * Filter Rule Schema
 *
 * Complete schema for filter rule configuration with all matchers and actions.
 */
export declare const FilterRuleSchema: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    chain: z.ZodEnum<["input", "forward", "output"]>;
    action: z.ZodEnum<["accept", "drop", "reject", "log", "jump", "tarpit", "passthrough"]>;
    order: z.ZodOptional<z.ZodNumber>;
    protocol: z.ZodOptional<z.ZodEnum<["tcp", "udp", "icmp", "ipv6-icmp", "all"]>>;
    srcAddress: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    dstAddress: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    srcPort: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    dstPort: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    srcAddressList: z.ZodOptional<z.ZodString>;
    dstAddressList: z.ZodOptional<z.ZodString>;
    inInterface: z.ZodOptional<z.ZodString>;
    outInterface: z.ZodOptional<z.ZodString>;
    inInterfaceList: z.ZodOptional<z.ZodString>;
    outInterfaceList: z.ZodOptional<z.ZodString>;
    connectionState: z.ZodOptional<z.ZodArray<z.ZodEnum<["established", "new", "related", "invalid", "untracked"]>, "many">>;
    comment: z.ZodOptional<z.ZodString>;
    disabled: z.ZodDefault<z.ZodBoolean>;
    log: z.ZodDefault<z.ZodBoolean>;
    logPrefix: z.ZodOptional<z.ZodString>;
    jumpTarget: z.ZodOptional<z.ZodString>;
    packets: z.ZodOptional<z.ZodNumber>;
    bytes: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    log: boolean;
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "reject" | "tarpit";
    disabled: boolean;
    chain: "input" | "output" | "forward";
    id?: string | undefined;
    order?: number | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "ipv6-icmp" | undefined;
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
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}, {
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "reject" | "tarpit";
    chain: "input" | "output" | "forward";
    id?: string | undefined;
    order?: number | undefined;
    log?: boolean | undefined;
    disabled?: boolean | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "ipv6-icmp" | undefined;
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
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}>, {
    log: boolean;
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "reject" | "tarpit";
    disabled: boolean;
    chain: "input" | "output" | "forward";
    id?: string | undefined;
    order?: number | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "ipv6-icmp" | undefined;
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
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}, {
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "reject" | "tarpit";
    chain: "input" | "output" | "forward";
    id?: string | undefined;
    order?: number | undefined;
    log?: boolean | undefined;
    disabled?: boolean | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "ipv6-icmp" | undefined;
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
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}>, {
    log: boolean;
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "reject" | "tarpit";
    disabled: boolean;
    chain: "input" | "output" | "forward";
    id?: string | undefined;
    order?: number | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "ipv6-icmp" | undefined;
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
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}, {
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "reject" | "tarpit";
    chain: "input" | "output" | "forward";
    id?: string | undefined;
    order?: number | undefined;
    log?: boolean | undefined;
    disabled?: boolean | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "ipv6-icmp" | undefined;
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
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}>, {
    log: boolean;
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "reject" | "tarpit";
    disabled: boolean;
    chain: "input" | "output" | "forward";
    id?: string | undefined;
    order?: number | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "ipv6-icmp" | undefined;
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
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}, {
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "reject" | "tarpit";
    chain: "input" | "output" | "forward";
    id?: string | undefined;
    order?: number | undefined;
    log?: boolean | undefined;
    disabled?: boolean | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "ipv6-icmp" | undefined;
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
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}>, {
    log: boolean;
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "reject" | "tarpit";
    disabled: boolean;
    chain: "input" | "output" | "forward";
    id?: string | undefined;
    order?: number | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "ipv6-icmp" | undefined;
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
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}, {
    action: "log" | "accept" | "passthrough" | "drop" | "jump" | "reject" | "tarpit";
    chain: "input" | "output" | "forward";
    id?: string | undefined;
    order?: number | undefined;
    log?: boolean | undefined;
    disabled?: boolean | undefined;
    bytes?: number | undefined;
    protocol?: "all" | "tcp" | "udp" | "icmp" | "ipv6-icmp" | undefined;
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
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
}>;
export type FilterRule = z.infer<typeof FilterRuleSchema>;
export type FilterRuleInput = z.input<typeof FilterRuleSchema>;
/**
 * Default filter rule for form initialization
 */
export declare const DEFAULT_FILTER_RULE: Partial<FilterRule>;
/**
 * Suggested log prefix patterns for common use cases
 */
export declare const SUGGESTED_LOG_PREFIXES: readonly [{
    readonly value: "DROPPED-";
    readonly label: "DROPPED- (packets dropped by firewall)";
}, {
    readonly value: "ACCEPTED-";
    readonly label: "ACCEPTED- (packets accepted)";
}, {
    readonly value: "REJECTED-";
    readonly label: "REJECTED- (packets rejected with ICMP)";
}, {
    readonly value: "FIREWALL-";
    readonly label: "FIREWALL- (general firewall log)";
}];
/**
 * Validate IP address or CIDR
 */
export declare function isValidIPAddress(address: string): boolean;
/**
 * Validate port or port range
 */
export declare function isValidPortRange(port: string): boolean;
/**
 * Get required fields for action
 */
export declare function getRequiredFieldsForFilterAction(action: FilterAction): string[];
/**
 * Get visible fields for action (for conditional form rendering)
 */
export declare function getVisibleFieldsForFilterAction(action: FilterAction): string[];
/**
 * Check if chain allows outInterface
 */
export declare function chainAllowsOutInterface(chain: FilterChain): boolean;
/**
 * Check if chain allows inInterface
 */
export declare function chainAllowsInInterface(chain: FilterChain): boolean;
/**
 * Get semantic color for action (for badges and status indicators)
 */
export declare function getActionColor(action: FilterAction): string;
/**
 * Get action description for tooltips
 */
export declare function getActionDescription(action: FilterAction): string;
/**
 * Generate human-readable rule preview
 */
export declare function generateRulePreview(rule: Partial<FilterRule>): string;
//# sourceMappingURL=filter-rule.types.d.ts.map