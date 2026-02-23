/**
 * VPN Issue Alert Component
 * Displays VPN warnings and errors
 * Based on NasNetConnect Design System
 *
 * @example
 * ```tsx
 * <VPNIssueAlert
 *   issue={vpnIssue}
 *   onDismiss={() => handleDismiss()}
 * />
 * ```
 */
import React from 'react';
import type { VPNIssue } from '@nasnet/core/types';
export interface VPNIssueAlertProps {
    /** The issue to display */
    issue: VPNIssue;
    /** Optional dismiss handler */
    onDismiss?: () => void;
    /** Custom className */
    className?: string;
}
/**
 * VPNIssueAlert Component
 * Shows a single VPN issue/warning
 */
declare function VPNIssueAlertComponent({ issue, onDismiss, className, }: VPNIssueAlertProps): import("react/jsx-runtime").JSX.Element;
export declare const VPNIssueAlert: React.MemoExoticComponent<typeof VPNIssueAlertComponent>;
/**
 * VPN Issues List Component
 */
export interface VPNIssuesListProps {
    /** List of issues */
    issues: VPNIssue[];
    /** Maximum issues to show */
    maxItems?: number;
    /** Show "see all" link */
    showSeeAll?: boolean;
    /** Handler for "see all" click */
    onSeeAll?: () => void;
    /** Custom className */
    className?: string;
}
declare function VPNIssuesListComponent({ issues, maxItems, showSeeAll, onSeeAll, className, }: VPNIssuesListProps): import("react/jsx-runtime").JSX.Element;
export declare const VPNIssuesList: React.MemoExoticComponent<typeof VPNIssuesListComponent>;
export {};
//# sourceMappingURL=VPNIssueAlert.d.ts.map