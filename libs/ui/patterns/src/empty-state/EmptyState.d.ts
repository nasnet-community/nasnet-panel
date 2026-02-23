/**
 * Empty State Component
 * Consistent empty state pattern across all pages
 * Based on UX Design Specification - Design Direction 1: Clean Minimal
 */
import * as React from 'react';
import { type LucideIcon } from 'lucide-react';
/**
 * EmptyState Props
 */
export interface EmptyStateProps {
    /** Icon component */
    icon: LucideIcon;
    /** Main heading */
    title: string;
    /** Description text */
    description: string;
    /** Optional CTA button */
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'action' | 'default' | 'outline';
    };
    /** Custom className */
    className?: string;
}
/**
 * EmptyState Component
 *
 * Displays a consistent empty state with:
 * - Large icon in rounded square background
 * - Clear heading and description
 * - Optional CTA button
 * - Proper spacing and alignment
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Shield}
 *   title="No WireGuard interfaces configured"
 *   description="Your router doesn't have any WireGuard VPN interfaces set up yet."
 *   action={{
 *     label: 'Add VPN',
 *     onClick: () => navigate('/vpn/add'),
 *     variant: 'action'
 *   }}
 * />
 * ```
 */
export declare const EmptyState: React.NamedExoticComponent<EmptyStateProps>;
//# sourceMappingURL=EmptyState.d.ts.map