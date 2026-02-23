/**
 * Query keys for firewall-related queries
 * Follows TanStack Query best practices for hierarchical keys
 */
import type { ConnectionFilters } from '@nasnet/core/types';
export declare const firewallConnectionKeys: {
    all: (routerId: string) => readonly ["firewall", "connections", string];
    list: (routerId: string, filters?: ConnectionFilters) => readonly ["firewall", "connections", string, "list", ConnectionFilters | undefined];
    byId: (routerId: string, connectionId: string) => readonly ["firewall", "connections", string, string];
    tracking: (routerId: string) => readonly ["firewall", "tracking", string];
};
/**
 * Query keys for firewall template operations
 */
export declare const firewallTemplateKeys: {
    all: readonly ["firewall", "templates"];
    lists: () => readonly ["firewall", "templates", "list"];
    list: (filters?: {
        category?: string;
        complexity?: string;
    }) => readonly ["firewall", "templates", "list", {
        category?: string;
        complexity?: string;
    } | undefined];
    details: () => readonly ["firewall", "templates", "detail"];
    detail: (templateId: string) => readonly ["firewall", "templates", "detail", string];
    preview: (routerId: string, templateId: string, variables: Record<string, string>) => readonly ["firewall", "templates", "preview", string, string, Record<string, string>];
    custom: () => readonly ["firewall", "templates", "custom"];
};
//# sourceMappingURL=queryKeys.d.ts.map