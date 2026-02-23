/**
 * Rate Limit Rules Table - Headless Hook
 * Business logic for rate limit rules table pattern
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */
import type { RateLimitRule } from '@nasnet/core/types';
import type { RateLimitRulesTableProps } from './types';
/**
 * Headless hook for rate limit rules table logic
 *
 * Separates business logic from presentation following the
 * Headless + Platform Presenters pattern (ADR-018).
 *
 * @param props - Component props
 * @returns State and handlers for rate limit rules table
 */
export declare function useRateLimitRulesTable(props: RateLimitRulesTableProps): {
    rules: {
        action: "drop" | "tarpit" | "add-to-list";
        connectionLimit: number;
        timeWindow: "per-second" | "per-minute" | "per-hour";
        isDisabled: boolean;
        id?: string | undefined;
        bytes?: number | undefined;
        srcAddress?: string | undefined;
        srcAddressList?: string | undefined;
        comment?: string | undefined;
        packets?: number | undefined;
        addressList?: string | undefined;
        addressListTimeout?: string | undefined;
    }[];
    isLoading: boolean;
    error: Error | null;
    maxBytes: number;
    editingRule: {
        action: "drop" | "tarpit" | "add-to-list";
        connectionLimit: number;
        timeWindow: "per-second" | "per-minute" | "per-hour";
        isDisabled: boolean;
        id?: string | undefined;
        bytes?: number | undefined;
        srcAddress?: string | undefined;
        srcAddressList?: string | undefined;
        comment?: string | undefined;
        packets?: number | undefined;
        addressList?: string | undefined;
        addressListTimeout?: string | undefined;
    } | null;
    deleteConfirmRule: {
        action: "drop" | "tarpit" | "add-to-list";
        connectionLimit: number;
        timeWindow: "per-second" | "per-minute" | "per-hour";
        isDisabled: boolean;
        id?: string | undefined;
        bytes?: number | undefined;
        srcAddress?: string | undefined;
        srcAddressList?: string | undefined;
        comment?: string | undefined;
        packets?: number | undefined;
        addressList?: string | undefined;
        addressListTimeout?: string | undefined;
    } | null;
    statsRule: {
        action: "drop" | "tarpit" | "add-to-list";
        connectionLimit: number;
        timeWindow: "per-second" | "per-minute" | "per-hour";
        isDisabled: boolean;
        id?: string | undefined;
        bytes?: number | undefined;
        srcAddress?: string | undefined;
        srcAddressList?: string | undefined;
        comment?: string | undefined;
        packets?: number | undefined;
        addressList?: string | undefined;
        addressListTimeout?: string | undefined;
    } | null;
    handleEdit: (rule: RateLimitRule) => void;
    handleDuplicate: (rule: RateLimitRule) => void;
    handleDelete: (rule: RateLimitRule) => void;
    handleToggle: (rule: RateLimitRule) => void;
    handleShowStats: (rule: RateLimitRule) => void;
    confirmDelete: () => void;
    closeEdit: () => void;
    closeDelete: () => void;
    closeStats: () => void;
};
//# sourceMappingURL=use-rate-limit-rules-table.d.ts.map