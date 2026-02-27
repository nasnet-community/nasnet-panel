import { z } from 'zod';
/**
 * RAW Rule Types and Schemas
 *
 * RAW firewall rules operate BEFORE connection tracking (pre-conntrack).
 * They are primarily used for:
 * - Disabling connection tracking (notrack) for performance
 * - Early packet dropping (DDoS mitigation, bogon filtering)
 * - Pre-routing decisions
 *
 * Chains:
 * - prerouting: Before routing decision (only chain with inInterface)
 * - output: Packets originating from router (only chain with outInterface)
 *
 * Key Differences from Filter Rules:
 * - Only 2 chains (prerouting, output) vs 5 in mangle or 3 in filter
 * - No connection state matching (executes before conntrack)
 * - Actions: drop, accept, notrack, jump, log
 * - Rate limiting still available
 *
 * @see https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/Filter#RAW
 */
/**
 * RAW Chain - 2 chain points (pre-conntrack)
 */
export declare const RawChainSchema: z.ZodEnum<['prerouting', 'output']>;
export type RawChain = z.infer<typeof RawChainSchema>;
/**
 * RAW Action - What to do with matched packets
 */
export declare const RawActionSchema: z.ZodEnum<['drop', 'accept', 'notrack', 'jump', 'log']>;
export type RawAction = z.infer<typeof RawActionSchema>;
/**
 * Protocol types for RAW filtering
 */
export declare const RawProtocolSchema: z.ZodEnum<['tcp', 'udp', 'icmp', 'ipv6-icmp', 'all']>;
export type RawProtocol = z.infer<typeof RawProtocolSchema>;
/**
 * Rate Limit configuration for RAW rules
 * Used for DDoS protection and connection rate limiting
 */
export declare const RateLimitSchema: z.ZodObject<
  {
    rate: z.ZodString;
    burst: z.ZodOptional<z.ZodNumber>;
  },
  'strip',
  z.ZodTypeAny,
  {
    rate: string;
    burst?: number | undefined;
  },
  {
    rate: string;
    burst?: number | undefined;
  }
>;
export type RateLimit = z.infer<typeof RateLimitSchema>;
/**
 * RAW Rule Schema
 *
 * Complete schema for RAW rule configuration with all matchers and actions.
 */
export declare const RawRuleSchema: z.ZodEffects<
  z.ZodEffects<
    z.ZodEffects<
      z.ZodEffects<
        z.ZodObject<
          {
            id: z.ZodOptional<z.ZodString>;
            chain: z.ZodEnum<['prerouting', 'output']>;
            action: z.ZodEnum<['drop', 'accept', 'notrack', 'jump', 'log']>;
            order: z.ZodOptional<z.ZodNumber>;
            protocol: z.ZodOptional<z.ZodEnum<['tcp', 'udp', 'icmp', 'ipv6-icmp', 'all']>>;
            srcAddress: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
            dstAddress: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
            srcPort: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
            dstPort: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
            inInterface: z.ZodOptional<z.ZodString>;
            outInterface: z.ZodOptional<z.ZodString>;
            limit: z.ZodOptional<
              z.ZodObject<
                {
                  rate: z.ZodString;
                  burst: z.ZodOptional<z.ZodNumber>;
                },
                'strip',
                z.ZodTypeAny,
                {
                  rate: string;
                  burst?: number | undefined;
                },
                {
                  rate: string;
                  burst?: number | undefined;
                }
              >
            >;
            jumpTarget: z.ZodOptional<z.ZodString>;
            logPrefix: z.ZodOptional<z.ZodString>;
            comment: z.ZodOptional<z.ZodString>;
            disabled: z.ZodDefault<z.ZodBoolean>;
            packets: z.ZodOptional<z.ZodNumber>;
            bytes: z.ZodOptional<z.ZodNumber>;
          },
          'strip',
          z.ZodTypeAny,
          {
            action: 'log' | 'accept' | 'drop' | 'jump' | 'notrack';
            disabled: boolean;
            chain: 'output' | 'prerouting';
            id?: string | undefined;
            order?: number | undefined;
            bytes?: number | undefined;
            protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | undefined;
            srcAddress?: string | undefined;
            dstAddress?: string | undefined;
            srcPort?: string | undefined;
            dstPort?: string | undefined;
            inInterface?: string | undefined;
            outInterface?: string | undefined;
            jumpTarget?: string | undefined;
            comment?: string | undefined;
            logPrefix?: string | undefined;
            packets?: number | undefined;
            limit?:
              | {
                  rate: string;
                  burst?: number | undefined;
                }
              | undefined;
          },
          {
            action: 'log' | 'accept' | 'drop' | 'jump' | 'notrack';
            chain: 'output' | 'prerouting';
            id?: string | undefined;
            order?: number | undefined;
            disabled?: boolean | undefined;
            bytes?: number | undefined;
            protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | undefined;
            srcAddress?: string | undefined;
            dstAddress?: string | undefined;
            srcPort?: string | undefined;
            dstPort?: string | undefined;
            inInterface?: string | undefined;
            outInterface?: string | undefined;
            jumpTarget?: string | undefined;
            comment?: string | undefined;
            logPrefix?: string | undefined;
            packets?: number | undefined;
            limit?:
              | {
                  rate: string;
                  burst?: number | undefined;
                }
              | undefined;
          }
        >,
        {
          action: 'log' | 'accept' | 'drop' | 'jump' | 'notrack';
          disabled: boolean;
          chain: 'output' | 'prerouting';
          id?: string | undefined;
          order?: number | undefined;
          bytes?: number | undefined;
          protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | undefined;
          srcAddress?: string | undefined;
          dstAddress?: string | undefined;
          srcPort?: string | undefined;
          dstPort?: string | undefined;
          inInterface?: string | undefined;
          outInterface?: string | undefined;
          jumpTarget?: string | undefined;
          comment?: string | undefined;
          logPrefix?: string | undefined;
          packets?: number | undefined;
          limit?:
            | {
                rate: string;
                burst?: number | undefined;
              }
            | undefined;
        },
        {
          action: 'log' | 'accept' | 'drop' | 'jump' | 'notrack';
          chain: 'output' | 'prerouting';
          id?: string | undefined;
          order?: number | undefined;
          disabled?: boolean | undefined;
          bytes?: number | undefined;
          protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | undefined;
          srcAddress?: string | undefined;
          dstAddress?: string | undefined;
          srcPort?: string | undefined;
          dstPort?: string | undefined;
          inInterface?: string | undefined;
          outInterface?: string | undefined;
          jumpTarget?: string | undefined;
          comment?: string | undefined;
          logPrefix?: string | undefined;
          packets?: number | undefined;
          limit?:
            | {
                rate: string;
                burst?: number | undefined;
              }
            | undefined;
        }
      >,
      {
        action: 'log' | 'accept' | 'drop' | 'jump' | 'notrack';
        disabled: boolean;
        chain: 'output' | 'prerouting';
        id?: string | undefined;
        order?: number | undefined;
        bytes?: number | undefined;
        protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | undefined;
        srcAddress?: string | undefined;
        dstAddress?: string | undefined;
        srcPort?: string | undefined;
        dstPort?: string | undefined;
        inInterface?: string | undefined;
        outInterface?: string | undefined;
        jumpTarget?: string | undefined;
        comment?: string | undefined;
        logPrefix?: string | undefined;
        packets?: number | undefined;
        limit?:
          | {
              rate: string;
              burst?: number | undefined;
            }
          | undefined;
      },
      {
        action: 'log' | 'accept' | 'drop' | 'jump' | 'notrack';
        chain: 'output' | 'prerouting';
        id?: string | undefined;
        order?: number | undefined;
        disabled?: boolean | undefined;
        bytes?: number | undefined;
        protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | undefined;
        srcAddress?: string | undefined;
        dstAddress?: string | undefined;
        srcPort?: string | undefined;
        dstPort?: string | undefined;
        inInterface?: string | undefined;
        outInterface?: string | undefined;
        jumpTarget?: string | undefined;
        comment?: string | undefined;
        logPrefix?: string | undefined;
        packets?: number | undefined;
        limit?:
          | {
              rate: string;
              burst?: number | undefined;
            }
          | undefined;
      }
    >,
    {
      action: 'log' | 'accept' | 'drop' | 'jump' | 'notrack';
      disabled: boolean;
      chain: 'output' | 'prerouting';
      id?: string | undefined;
      order?: number | undefined;
      bytes?: number | undefined;
      protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | undefined;
      srcAddress?: string | undefined;
      dstAddress?: string | undefined;
      srcPort?: string | undefined;
      dstPort?: string | undefined;
      inInterface?: string | undefined;
      outInterface?: string | undefined;
      jumpTarget?: string | undefined;
      comment?: string | undefined;
      logPrefix?: string | undefined;
      packets?: number | undefined;
      limit?:
        | {
            rate: string;
            burst?: number | undefined;
          }
        | undefined;
    },
    {
      action: 'log' | 'accept' | 'drop' | 'jump' | 'notrack';
      chain: 'output' | 'prerouting';
      id?: string | undefined;
      order?: number | undefined;
      disabled?: boolean | undefined;
      bytes?: number | undefined;
      protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | undefined;
      srcAddress?: string | undefined;
      dstAddress?: string | undefined;
      srcPort?: string | undefined;
      dstPort?: string | undefined;
      inInterface?: string | undefined;
      outInterface?: string | undefined;
      jumpTarget?: string | undefined;
      comment?: string | undefined;
      logPrefix?: string | undefined;
      packets?: number | undefined;
      limit?:
        | {
            rate: string;
            burst?: number | undefined;
          }
        | undefined;
    }
  >,
  {
    action: 'log' | 'accept' | 'drop' | 'jump' | 'notrack';
    disabled: boolean;
    chain: 'output' | 'prerouting';
    id?: string | undefined;
    order?: number | undefined;
    bytes?: number | undefined;
    protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
    limit?:
      | {
          rate: string;
          burst?: number | undefined;
        }
      | undefined;
  },
  {
    action: 'log' | 'accept' | 'drop' | 'jump' | 'notrack';
    chain: 'output' | 'prerouting';
    id?: string | undefined;
    order?: number | undefined;
    disabled?: boolean | undefined;
    bytes?: number | undefined;
    protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
    limit?:
      | {
          rate: string;
          burst?: number | undefined;
        }
      | undefined;
  }
>;
export type RawRule = z.infer<typeof RawRuleSchema>;
export type RawRuleInput = z.input<typeof RawRuleSchema>;
/**
 * Default RAW rule for form initialization
 */
export declare const DEFAULT_RAW_RULE: Partial<RawRule>;
/**
 * Suggested log prefix patterns for RAW rules
 */
export declare const SUGGESTED_LOG_PREFIXES: readonly [
  {
    readonly value: 'RAW-DROP-';
    readonly label: 'RAW-DROP- (packets dropped before conntrack)';
  },
  {
    readonly value: 'RAW-BOGON-';
    readonly label: 'RAW-BOGON- (bogon address filtered)';
  },
  {
    readonly value: 'RAW-DDOS-';
    readonly label: 'RAW-DDOS- (DDoS protection triggered)';
  },
  {
    readonly value: 'RAW-';
    readonly label: 'RAW- (general RAW rule log)';
  },
];
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
export declare function getRequiredFieldsForRawAction(action: RawAction): string[];
/**
 * Get visible fields for action (for conditional form rendering)
 */
export declare function getVisibleFieldsForRawAction(action: RawAction): string[];
/**
 * Check if chain allows outInterface
 */
export declare function chainAllowsOutInterface(chain: RawChain): boolean;
/**
 * Check if chain allows inInterface
 */
export declare function chainAllowsInInterface(chain: RawChain): boolean;
/**
 * Get semantic color for action (for badges and status indicators)
 */
export declare function getActionColor(action: RawAction): string;
/**
 * Get action description for tooltips
 */
export declare function getActionDescription(action: RawAction): string;
/**
 * Generate human-readable rule preview
 */
export declare function generateRulePreview(rule: Partial<RawRule>): string;
/**
 * Check if rule is for DDoS protection
 * (has rate limiting and drops packets)
 */
export declare function isDDoSProtectionRule(rule: Partial<RawRule>): boolean;
/**
 * Check if rule is for performance optimization
 * (notrack action to bypass connection tracking)
 */
export declare function isPerformanceRule(rule: Partial<RawRule>): boolean;
//# sourceMappingURL=raw-rule.types.d.ts.map
