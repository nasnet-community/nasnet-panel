/**
 * TanStack Query hooks for RouterOS logging configuration
 * Provides CRUD operations for log rules and actions
 * Epic 0.8: System Logs - RouterOS Log Settings
 */
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
/**
 * RouterOS logging rule
 */
export interface LoggingRule {
    '.id': string;
    topics: string;
    action: string;
    prefix?: string;
    disabled: boolean;
}
/**
 * RouterOS logging action (destination)
 */
export interface LoggingAction {
    '.id': string;
    name: string;
    target: 'memory' | 'disk' | 'echo' | 'remote';
    'memory-lines'?: number;
    'memory-stop-on-full'?: boolean;
    'disk-file-name'?: string;
    'disk-file-count'?: number;
    'disk-lines-per-file'?: number;
    'disk-stop-on-full'?: boolean;
    remote?: string;
    'remote-port'?: number;
}
/**
 * Extended query keys for logging
 */
export declare const loggingKeys: {
    all: readonly ["system", "logging"];
    rules: (routerIp: string) => readonly ["system", "logging", "rules", string];
    actions: (routerIp: string) => readonly ["system", "logging", "actions", string];
};
/**
 * Hook for fetching logging rules
 */
export declare function useLoggingRules(routerIp: string): UseQueryResult<LoggingRule[], Error>;
/**
 * Hook for fetching logging actions
 */
export declare function useLoggingActions(routerIp: string): UseQueryResult<LoggingAction[], Error>;
/**
 * Input for creating a logging rule
 */
export interface CreateLoggingRuleInput {
    topics: string;
    action: string;
    prefix?: string;
    disabled?: boolean;
}
/**
 * Input for updating a logging rule
 */
export interface UpdateLoggingRuleInput {
    id: string;
    topics?: string;
    action?: string;
    prefix?: string;
    disabled?: boolean;
}
/**
 * Input for updating a logging action
 */
export interface UpdateLoggingActionInput {
    id: string;
    'memory-lines'?: number;
    'memory-stop-on-full'?: boolean;
    'disk-file-name'?: string;
    'disk-file-count'?: number;
    'disk-lines-per-file'?: number;
    'disk-stop-on-full'?: boolean;
    remote?: string;
    'remote-port'?: number;
}
/**
 * Hook for creating a logging rule
 */
export declare function useCreateLoggingRule(routerIp: string): UseMutationResult<LoggingRule, Error, CreateLoggingRuleInput>;
/**
 * Hook for updating a logging rule
 */
export declare function useUpdateLoggingRule(routerIp: string): UseMutationResult<void, Error, UpdateLoggingRuleInput>;
/**
 * Hook for deleting a logging rule
 */
export declare function useDeleteLoggingRule(routerIp: string): UseMutationResult<void, Error, string>;
/**
 * Hook for toggling a logging rule enabled/disabled
 */
export declare function useToggleLoggingRule(routerIp: string): UseMutationResult<void, Error, {
    id: string;
    disabled: boolean;
}>;
/**
 * Hook for updating a logging action (destination)
 */
export declare function useUpdateLoggingAction(routerIp: string): UseMutationResult<void, Error, UpdateLoggingActionInput>;
//# sourceMappingURL=useLoggingSettings.d.ts.map