/**
 * Change Set Summary Component
 * Displays a summary of a change set with operation counts
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import type { ChangeSetSummary as ChangeSetSummaryData } from '@nasnet/core/types';
declare const summaryVariants: (props?: ({
    status?: "DRAFT" | "VALIDATING" | "APPLYING" | "FAILED" | "READY" | "COMPLETED" | "ROLLING_BACK" | "ROLLED_BACK" | "PARTIAL_FAILURE" | "CANCELLED" | null | undefined;
    interactive?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
declare const operationBadgeVariants: (props?: ({
    operation?: "delete" | "create" | "update" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface ChangeSetSummaryProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof summaryVariants> {
    /** Change set summary data */
    summary: ChangeSetSummaryData;
    /** Whether the summary is clickable/interactive */
    interactive?: boolean;
    /** Optional click handler */
    onClick?: () => void;
    /** Show status badge */
    showStatus?: boolean;
    /** Show timestamp */
    showTimestamp?: boolean;
    /** Compact mode for list views */
    compact?: boolean;
    /** Manual platform presenter override: 'mobile' | 'tablet' | 'desktop' */
    presenter?: 'mobile' | 'tablet' | 'desktop';
}
/**
 * Headless hook: handles all business logic for ChangeSetSummary
 */
export declare function useChangeSetSummary(summary: ChangeSetSummaryData, { interactive, onClick, }: Pick<ChangeSetSummaryProps, 'interactive' | 'onClick'>): {
    handleClick: () => void;
    handleKeyDown: (event: React.KeyboardEvent) => void;
    formattedDate: string;
    summary: ChangeSetSummaryData;
    interactive: boolean;
};
export declare const ChangeSetSummary: React.MemoExoticComponent<React.ForwardRefExoticComponent<ChangeSetSummaryProps & React.RefAttributes<HTMLDivElement>>>;
export { summaryVariants, operationBadgeVariants };
//# sourceMappingURL=ChangeSetSummary.d.ts.map