/**
 * LeaseCard Mobile Component
 *
 * Mobile-optimized card for displaying DHCP lease information.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 * Part of NAS-6.11: DHCP Lease Management
 *
 * Features:
 * - 44px minimum touch targets (WCAG AAA)
 * - Tap-to-expand for full details
 * - Swipe actions: Make Static (right), Delete (left)
 * - New lease badge with pulse animation
 * - Bottom sheet for expanded details
 *
 * @module @nasnet/features/network/dhcp/lease-card
 */
import * as React from 'react';
import type { DHCPLease } from '@nasnet/core/types';
export interface LeaseCardProps {
    /** DHCP lease data */
    lease: DHCPLease;
    /** Whether this is a newly detected lease (shows "New" badge) */
    isNew?: boolean;
    /** Called when Make Static is triggered */
    onMakeStatic?: (lease: DHCPLease) => void;
    /** Called when Delete is triggered */
    onDelete?: (lease: DHCPLease) => void;
    /** Called when card is tapped */
    onClick?: (lease: DHCPLease) => void;
    /** Additional CSS classes */
    className?: string;
    /** Unique ID for accessibility */
    id?: string;
}
/**
 * LeaseCard Mobile Component
 *
 * Displays DHCP lease information in a mobile-optimized card format.
 * Includes swipe gestures and expandable detail view.
 *
 * @param props - Component props
 */
export declare const LeaseCard: React.NamedExoticComponent<LeaseCardProps>;
//# sourceMappingURL=LeaseCard.d.ts.map