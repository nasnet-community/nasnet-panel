/**
 * Query keys for system-related queries
 * Follows TanStack Query best practices for hierarchical keys
 */
import type { LogTopic } from '@nasnet/core/types';
export declare const systemKeys: {
    all: readonly ["system"];
    logs: (routerIp: string, options?: {
        topics?: LogTopic[];
        limit?: number;
    }) => readonly ["system", "logs", string, {
        topics?: LogTopic[];
        limit?: number;
    } | undefined];
    note: (routerIp: string) => readonly ["system", "note", string];
};
/**
 * Query keys for IP-related queries
 */
export declare const ipKeys: {
    all: readonly ["ip"];
    services: (routerIp: string) => readonly ["ip", "services", string];
};
/**
 * Query keys for batch job operations
 */
export declare const batchKeys: {
    all: readonly ["batch"];
    job: (jobId: string) => readonly ["batch", "job", string];
};
//# sourceMappingURL=queryKeys.d.ts.map