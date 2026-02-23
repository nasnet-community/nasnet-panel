/**
 * PortRegistryViewMobile Component
 *
 * Mobile presenter for port registry (<640px viewports).
 * Implements touch-optimized card layout with collapsible groups.
 *
 * Features:
 * - Card-based layout grouped by service type
 * - Collapsible sections with Radix Collapsible
 * - 44px minimum touch targets (WCAG AAA)
 * - Badge components for port and protocol
 * - Bottom padding for mobile navigation
 * - Pull-to-refresh support
 *
 * @see NAS-8.16: Port Conflict Detection
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */
import React from 'react';
/**
 * PortRegistryViewMobile props
 */
export interface PortRegistryViewMobileProps {
    /** Router ID to display allocations for */
    routerId: string;
    /** Optional className for styling */
    className?: string;
}
/**
 * PortRegistryViewMobile component
 *
 * Mobile-optimized presenter with touch-friendly cards and collapsible groups.
 * Implements 44px minimum touch targets and progressive disclosure via collapsibles.
 */
export declare const PortRegistryViewMobile: React.NamedExoticComponent<PortRegistryViewMobileProps>;
//# sourceMappingURL=PortRegistryViewMobile.d.ts.map