/**
 * Port Knocking Types - Port knock sequence configuration and logging
 *
 * Port knocking is implemented using address-list stage progression on MikroTik:
 * - Client hits knock ports in sequence within knockTimeout
 * - Each stage adds IP to stage-specific address list
 * - Final stage adds IP to allowed list with accessTimeout
 * - Protected service accepts connections from allowed list only
 */

import { z } from 'zod';

/**
 * Zod schema for knock port protocol validation
 * Defines which protocol(s) the knock port uses
 *
 * @example
 * const protocol = KnockProtocolSchema.parse('tcp');
 */
export const KnockProtocolSchema = z.enum(['tcp', 'udp', 'both']);
/**
 * Type for knock port protocol
 * @example
 * const protocol: KnockProtocol = 'tcp';
 */
export type KnockProtocol = z.infer<typeof KnockProtocolSchema>;

/**
 * Zod schema for knock attempt status validation
 * Indicates the result of a port knock sequence attempt
 *
 * @example
 * const status = KnockStatusSchema.parse('success');
 */
export const KnockStatusSchema = z.enum(['success', 'failed', 'partial', 'timeout']);
/**
 * Type for knock attempt status
 * @example
 * const status: KnockStatus = 'success';
 */
export type KnockStatus = z.infer<typeof KnockStatusSchema>;

/**
 * Zod schema for a single knock port in sequence
 * Represents one port in a multi-port knock sequence
 *
 * @example
 * const port = KnockPortSchema.parse({ port: 2222, protocol: 'tcp', order: 1 });
 */
export const KnockPortSchema = z.object({
  port: z
    .number()
    .int()
    .min(1, 'Port must be between 1 and 65535')
    .max(65535, 'Port must be between 1 and 65535'),
  protocol: KnockProtocolSchema,
  order: z.number().int().min(1, 'Order must be at least 1'), // Position in sequence (1-based)
});
/**
 * Type for a single knock port
 * @example
 * const knockPort: KnockPort = { port: 2222, protocol: 'tcp', order: 1 };
 */
export type KnockPort = z.infer<typeof KnockPortSchema>;

/**
 * Zod schema for complete port knock sequence configuration
 * Validates port knock sequence structure with all required and optional fields
 *
 * @example
 * const sequence = PortKnockSequenceSchema.parse({
 *   name: 'ssh-knock',
 *   knockPorts: [{ port: 2222, protocol: 'tcp', order: 1 }, { port: 3333, protocol: 'tcp', order: 2 }],
 *   protectedPort: 22,
 *   protectedProtocol: 'tcp',
 *   accessTimeout: '5m',
 *   knockTimeout: '15s',
 *   isEnabled: true,
 * });
 */
export const PortKnockSequenceSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(32, 'Name must be 32 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Name can only contain letters, numbers, underscores, and hyphens'),
  knockPorts: z
    .array(KnockPortSchema)
    .min(2, 'At least 2 knock ports are required')
    .max(8, 'Maximum 8 knock ports allowed')
    .refine(
      (ports) => {
        const portNumbers = ports.map((p) => p.port);
        return new Set(portNumbers).size === portNumbers.length;
      },
      { message: 'Knock ports must be unique' }
    ),
  protectedPort: z
    .number()
    .int()
    .min(1, 'Port must be between 1 and 65535')
    .max(65535, 'Port must be between 1 and 65535'),
  protectedProtocol: z.enum(['tcp', 'udp']),
  accessTimeout: z
    .string()
    .regex(/^\d+[smhd]$/, 'Access timeout must be a valid duration (e.g., "5m", "1h", "1d")'),
  knockTimeout: z
    .string()
    .regex(/^\d+[smhd]$/, 'Knock timeout must be a valid duration (e.g., "15s", "30s")'),
  isEnabled: z.boolean().default(true),
  routerId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // Computed fields (read-only from API)
  recentAccessCount: z.number().optional(), // Last 24h successful knocks
  generatedRuleIds: z.array(z.string()).optional(), // IDs of rules on router
});

/**
 * Complete port knock sequence configuration
 * Represents a full port knock sequence with computed read-only fields
 *
 * @example
 * const sequence: PortKnockSequence = { id: '123', name: 'ssh-knock', ... };
 */
export type PortKnockSequence = z.infer<typeof PortKnockSequenceSchema> & {
  readonly recentAccessCount?: number;
  readonly generatedRuleIds?: readonly string[];
};
/**
 * Port knock sequence input type (excludes read-only fields)
 * Used for creating and updating port knock sequences
 *
 * @example
 * const input: PortKnockSequenceInput = { name: 'ssh-knock', knockPorts: [...], ... };
 */
export type PortKnockSequenceInput = z.input<typeof PortKnockSequenceSchema>;

/**
 * Zod schema for port knock attempt log entry
 * Records details of a single port knock attempt with immutable fields
 *
 * @example
 * const attempt = PortKnockAttemptSchema.parse({
 *   id: 'abc123',
 *   sequenceId: '123',
 *   sequenceName: 'ssh-knock',
 *   sourceIP: '192.168.1.100',
 *   timestamp: '2024-01-01T12:00:00Z',
 *   status: 'success',
 *   portsHit: [2222, 3333],
 *   protectedPort: 22,
 *   progress: '2/2',
 * });
 */
export const PortKnockAttemptSchema = z.object({
  id: z.string(),
  sequenceId: z.string(),
  sequenceName: z.string(),
  sourceIP: z.string(),
  timestamp: z.string(),
  status: KnockStatusSchema,
  portsHit: z.array(z.number()), // Ports hit in order
  protectedPort: z.number(),
  progress: z.string(), // e.g., "2/4" = hit 2 of 4 ports
});

/**
 * Port knock attempt log entry
 * Immutable record of a single port knock attempt with read-only array of ports
 *
 * @example
 * const attempt: PortKnockAttempt = { id: 'abc', sequenceId: '123', portsHit: [2222], ... };
 */
export type PortKnockAttempt = z.infer<typeof PortKnockAttemptSchema> & {
  readonly portsHit: readonly number[];
};

/**
 * Common service ports for suggestions in port knock UI
 * Pre-configured immutable list of commonly knocked protected services
 * Used for port selection dropdowns and suggestions
 *
 * @example
 * const sshService = COMMON_SERVICE_PORTS.find(s => s.port === 22);
 */
export const COMMON_SERVICE_PORTS = [
  { port: 22, name: 'SSH', protocol: 'tcp' as const },
  { port: 80, name: 'HTTP', protocol: 'tcp' as const },
  { port: 443, name: 'HTTPS', protocol: 'tcp' as const },
  { port: 3389, name: 'RDP', protocol: 'tcp' as const },
  { port: 8291, name: 'MikroTik WinBox', protocol: 'tcp' as const },
  { port: 8728, name: 'MikroTik API', protocol: 'tcp' as const },
  { port: 21, name: 'FTP', protocol: 'tcp' as const },
  { port: 3306, name: 'MySQL', protocol: 'tcp' as const },
  { port: 5432, name: 'PostgreSQL', protocol: 'tcp' as const },
] as const satisfies readonly { port: number; name: string; protocol: 'tcp' }[];

/**
 * Default duration values for port knock configuration
 * Immutable defaults used for timeout initialization in forms
 *
 * @example
 * const { accessTimeout, knockTimeout } = DEFAULT_DURATIONS;
 */
export const DEFAULT_DURATIONS = {
  accessTimeout: '5m',
  knockTimeout: '15s',
} as const satisfies Readonly<{ accessTimeout: string; knockTimeout: string }>;

/**
 * Check if a port knock sequence protects SSH (lockout risk)
 * SSH port knocking can cause accidental lockout if misconfigured
 *
 * @param sequence - Port knock sequence to check
 * @returns True if the sequence protects SSH port 22/tcp, false otherwise
 *
 * @example
 * if (isSSHProtected(sequence)) {
 *   console.warn('Protecting SSH - risk of lockout');
 * }
 */
export function isSSHProtected(sequence: PortKnockSequence | PortKnockSequenceInput): boolean {
  return sequence.protectedPort === 22 && sequence.protectedProtocol === 'tcp';
}

/**
 * Get service name for common ports
 * Looks up port in the COMMON_SERVICE_PORTS list
 *
 * @param port - Port number to look up
 * @param protocol - Protocol (tcp or udp)
 * @returns Service name if found, undefined otherwise
 *
 * @example
 * getServiceName(22, 'tcp') // Returns 'SSH'
 * getServiceName(99999, 'tcp') // Returns undefined
 */
export function getServiceName(port: number, protocol: 'tcp' | 'udp'): string | undefined {
  const service = COMMON_SERVICE_PORTS.find((s) => s.port === port && s.protocol === protocol);
  return service?.name;
}

/**
 * Parse duration string to milliseconds
 * Converts RouterOS duration format (e.g., "5m", "1h") to milliseconds
 *
 * @param duration - Duration string (e.g., "5m", "1h", "30s", "1d")
 * @returns Duration in milliseconds, or 0 if format is invalid
 *
 * @example
 * parseDuration('5m') // Returns 300000
 * parseDuration('1h') // Returns 3600000
 * parseDuration('invalid') // Returns 0
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const DURATION_MULTIPLIERS: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (DURATION_MULTIPLIERS[unit] || 0);
}

/**
 * Format duration from milliseconds to RouterOS string format
 * Converts milliseconds to the shortest appropriate unit
 *
 * @param ms - Duration in milliseconds
 * @returns Duration string in RouterOS format (e.g., "5m", "1h")
 *
 * @example
 * formatDuration(300000) // Returns "5m"
 * formatDuration(3600000) // Returns "1h"
 * formatDuration(5000) // Returns "5s"
 */
export function formatDuration(ms: number): string {
  if (ms < 60 * 1000) {
    return `${Math.floor(ms / 1000)}s`;
  }
  if (ms < 60 * 60 * 1000) {
    return `${Math.floor(ms / (60 * 1000))}m`;
  }
  if (ms < 24 * 60 * 60 * 1000) {
    return `${Math.floor(ms / (60 * 60 * 1000))}h`;
  }
  return `${Math.floor(ms / (24 * 60 * 60 * 1000))}d`;
}
