/**
 * Bottom Navigation Component
 * Mobile-first fixed bottom navigation bar for responsive layouts.
 *
 * Features:
 * - Thumb-accessible position at bottom of screen
 * - Fixed positioning with safe-area support for notched devices
 * - Active state indicator with primary color accent
 * - Optional badge support (typically for notification counts)
 * - 44px minimum touch targets for WCAG AAA compliance
 * - Hidden on desktop (md+ screens) via responsive utilities
 *
 * @example
 * ```tsx
 * <BottomNavigation
 *   activeId="home"
 *   items={[
 *     { id: 'home', label: 'Home', icon: Home, onClick: () => navigate('/') },
 *     { id: 'search', label: 'Search', icon: Search, badge: 2 },
 *   ]}
 * />
 * ```
 *
 * @see {@link NavItem} for navigation item configuration
 * @see {@link BottomNavigationProps} for prop interface
 */
import * as React from 'react';
/**
 * Navigation item configuration for BottomNavigation
 * @interface NavItem
 */
export interface NavItem {
    /** Unique identifier for this navigation item */
    id: string;
    /** Display label shown below icon */
    label: string;
    /** Icon name (supports 'lucide:name', 'custom:name', 'category:name' prefixes) */
    icon: string;
    /** Optional navigation path (renders as <a> tag) */
    href?: string;
    /** Optional click handler (renders as <button> tag) */
    onClick?: () => void;
    /** Optional badge count (e.g., notification count) */
    badge?: number;
}
/**
 * BottomNavigation component props
 * @interface BottomNavigationProps
 */
export interface BottomNavigationProps {
    /** ID of currently active navigation item */
    activeId: string;
    /** Array of navigation items (typically 4-5 items) */
    items?: NavItem[];
    /** Optional custom className for root element */
    className?: string;
}
/**
 * BottomNavigation component - Mobile-first bottom navigation bar
 */
export declare const BottomNavigation: React.MemoExoticComponent<React.ForwardRefExoticComponent<BottomNavigationProps & React.RefAttributes<HTMLElement>>>;
//# sourceMappingURL=BottomNavigation.d.ts.map