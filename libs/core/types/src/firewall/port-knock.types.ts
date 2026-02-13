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
 * Protocol for knock port
 */
export const KnockProtocolSchema = z.enum(['tcp', 'udp', 'both']);
export type KnockProtocol = z.infer<typeof KnockProtocolSchema>;

/**
 * Status of knock attempt
 */
export const KnockStatusSchema = z.enum(['success', 'failed', 'partial', 'timeout']);
export type KnockStatus = z.infer<typeof KnockStatusSchema>;

/**
 * Single knock port in sequence
 */
export const KnockPortSchema = z.object({
  port: z.number().int().min(1, 'Port must be between 1 and 65535').max(65535, 'Port must be between 1 and 65535'),
  protocol: KnockProtocolSchema,
  order: z.number().int().min(1, 'Order must be at least 1'), // Position in sequence (1-based)
});
export type KnockPort = z.infer<typeof KnockPortSchema>;

/**
 * Port knock sequence configuration
 */
export const PortKnockSequenceSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(1, 'Name is required')
    .max(32, 'Name must be 32 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Name can only contain letters, numbers, underscores, and hyphens'),
  knockPorts: z.array(KnockPortSchema)
    .min(2, 'At least 2 knock ports are required')
    .max(8, 'Maximum 8 knock ports allowed')
    .refine(
      (ports) => {
        const portNumbers = ports.map((p) => p.port);
        return new Set(portNumbers).size === portNumbers.length;
      },
      { message: 'Knock ports must be unique' }
    ),
  protectedPort: z.number().int().min(1, 'Port must be between 1 and 65535').max(65535, 'Port must be between 1 and 65535'),
  protectedProtocol: z.enum(['tcp', 'udp']),
  accessTimeout: z.string()
    .regex(/^\d+[smhd]$/, 'Access timeout must be a valid duration (e.g., "5m", "1h", "1d")'),
  knockTimeout: z.string()
    .regex(/^\d+[smhd]$/, 'Knock timeout must be a valid duration (e.g., "15s", "30s")'),
  enabled: z.boolean().default(true),
  routerId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // Computed fields (read-only from API)
  recentAccessCount: z.number().optional(), // Last 24h successful knocks
  generatedRuleIds: z.array(z.string()).optional(), // IDs of rules on router
});

export type PortKnockSequence = z.infer<typeof PortKnockSequenceSchema>;
export type PortKnockSequenceInput = z.input<typeof PortKnockSequenceSchema>;

/**
 * Port knock attempt log entry
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

export type PortKnockAttempt = z.infer<typeof PortKnockAttemptSchema>;

/**
 * Common service ports for suggestions
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
] as const;

/**
 * Default duration values
 */
export const DEFAULT_DURATIONS = {
  accessTimeout: '5m',
  knockTimeout: '15s',
} as const;

/**
 * Check if a port knock sequence protects SSH (lockout risk)
 */
export function isSSHProtected(sequence: PortKnockSequence | PortKnockSequenceInput): boolean {
  return sequence.protectedPort === 22 && sequence.protectedProtocol === 'tcp';
}

/**
 * Get service name for common ports
 */
export function getServiceName(port: number, protocol: 'tcp' | 'udp'): string | undefined {
  const service = COMMON_SERVICE_PORTS.find((s) => s.port === port && s.protocol === protocol);
  return service?.name;
}

/**
 * Parse duration string to milliseconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || 0);
}

/**
 * Format duration from milliseconds to string
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
