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
export declare const KnockProtocolSchema: z.ZodEnum<["tcp", "udp", "both"]>;
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
export declare const KnockStatusSchema: z.ZodEnum<["success", "failed", "partial", "timeout"]>;
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
export declare const KnockPortSchema: z.ZodObject<{
    port: z.ZodNumber;
    protocol: z.ZodEnum<["tcp", "udp", "both"]>;
    order: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    order: number;
    protocol: "both" | "tcp" | "udp";
    port: number;
}, {
    order: number;
    protocol: "both" | "tcp" | "udp";
    port: number;
}>;
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
export declare const PortKnockSequenceSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    knockPorts: z.ZodEffects<z.ZodArray<z.ZodObject<{
        port: z.ZodNumber;
        protocol: z.ZodEnum<["tcp", "udp", "both"]>;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        order: number;
        protocol: "both" | "tcp" | "udp";
        port: number;
    }, {
        order: number;
        protocol: "both" | "tcp" | "udp";
        port: number;
    }>, "many">, {
        order: number;
        protocol: "both" | "tcp" | "udp";
        port: number;
    }[], {
        order: number;
        protocol: "both" | "tcp" | "udp";
        port: number;
    }[]>;
    protectedPort: z.ZodNumber;
    protectedProtocol: z.ZodEnum<["tcp", "udp"]>;
    accessTimeout: z.ZodString;
    knockTimeout: z.ZodString;
    isEnabled: z.ZodDefault<z.ZodBoolean>;
    routerId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
    recentAccessCount: z.ZodOptional<z.ZodNumber>;
    generatedRuleIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    knockPorts: {
        order: number;
        protocol: "both" | "tcp" | "udp";
        port: number;
    }[];
    protectedPort: number;
    protectedProtocol: "tcp" | "udp";
    accessTimeout: string;
    knockTimeout: string;
    isEnabled: boolean;
    id?: string | undefined;
    updatedAt?: string | undefined;
    createdAt?: string | undefined;
    routerId?: string | undefined;
    recentAccessCount?: number | undefined;
    generatedRuleIds?: string[] | undefined;
}, {
    name: string;
    knockPorts: {
        order: number;
        protocol: "both" | "tcp" | "udp";
        port: number;
    }[];
    protectedPort: number;
    protectedProtocol: "tcp" | "udp";
    accessTimeout: string;
    knockTimeout: string;
    id?: string | undefined;
    updatedAt?: string | undefined;
    createdAt?: string | undefined;
    routerId?: string | undefined;
    isEnabled?: boolean | undefined;
    recentAccessCount?: number | undefined;
    generatedRuleIds?: string[] | undefined;
}>;
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
export declare const PortKnockAttemptSchema: z.ZodObject<{
    id: z.ZodString;
    sequenceId: z.ZodString;
    sequenceName: z.ZodString;
    sourceIP: z.ZodString;
    timestamp: z.ZodString;
    status: z.ZodEnum<["success", "failed", "partial", "timeout"]>;
    portsHit: z.ZodArray<z.ZodNumber, "many">;
    protectedPort: z.ZodNumber;
    progress: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "partial" | "success" | "failed" | "timeout";
    progress: string;
    timestamp: string;
    protectedPort: number;
    sequenceId: string;
    sequenceName: string;
    sourceIP: string;
    portsHit: number[];
}, {
    id: string;
    status: "partial" | "success" | "failed" | "timeout";
    progress: string;
    timestamp: string;
    protectedPort: number;
    sequenceId: string;
    sequenceName: string;
    sourceIP: string;
    portsHit: number[];
}>;
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
export declare const COMMON_SERVICE_PORTS: readonly [{
    readonly port: 22;
    readonly name: "SSH";
    readonly protocol: "tcp";
}, {
    readonly port: 80;
    readonly name: "HTTP";
    readonly protocol: "tcp";
}, {
    readonly port: 443;
    readonly name: "HTTPS";
    readonly protocol: "tcp";
}, {
    readonly port: 3389;
    readonly name: "RDP";
    readonly protocol: "tcp";
}, {
    readonly port: 8291;
    readonly name: "MikroTik WinBox";
    readonly protocol: "tcp";
}, {
    readonly port: 8728;
    readonly name: "MikroTik API";
    readonly protocol: "tcp";
}, {
    readonly port: 21;
    readonly name: "FTP";
    readonly protocol: "tcp";
}, {
    readonly port: 3306;
    readonly name: "MySQL";
    readonly protocol: "tcp";
}, {
    readonly port: 5432;
    readonly name: "PostgreSQL";
    readonly protocol: "tcp";
}];
/**
 * Default duration values for port knock configuration
 * Immutable defaults used for timeout initialization in forms
 *
 * @example
 * const { accessTimeout, knockTimeout } = DEFAULT_DURATIONS;
 */
export declare const DEFAULT_DURATIONS: {
    readonly accessTimeout: "5m";
    readonly knockTimeout: "15s";
};
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
export declare function isSSHProtected(sequence: PortKnockSequence | PortKnockSequenceInput): boolean;
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
export declare function getServiceName(port: number, protocol: 'tcp' | 'udp'): string | undefined;
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
export declare function parseDuration(duration: string): number;
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
export declare function formatDuration(ms: number): string;
//# sourceMappingURL=port-knock.types.d.ts.map