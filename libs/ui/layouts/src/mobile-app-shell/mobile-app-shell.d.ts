/**
 * Mobile App Shell Layout Component
 *
 * A responsive app container that combines header, bottom navigation, status banner,
 * and optional desktop sidebar. Auto-detects platform and adjusts layout accordingly.
 *
 * **Three-Platform Support:**
 * - **Mobile (<640px):** Single column, header top, bottom tab navigation
 * - **Tablet/Desktop (640px+):** Optional collapsible sidebar, full-height layout
 *
 * **Features:**
 * - Semantic HTML with `<header>`, `<main>`, `<nav>` landmarks
 * - 44px+ touch targets for mobile navigation
 * - Status banner support for alerts/notifications (top)
 * - Safe-area support for notched devices (iOS)
 * - Flexible layout with optional components
 *
 * @example
 * ```tsx
 * <MobileAppShell
 *   header={{ title: 'Dashboard', greeting: true }}
 *   navigation={{ activeId: 'home', items: [...] }}
 *   statusBanner={{ status: 'warning', content: <span>Connected</span> }}
 *   children={<RouterDashboard />}
 * />
 * ```
 *
 * @see {@link MobileAppShellProps} for prop interface
 * @see {@link MobileHeader} for header configuration
 * @see {@link BottomNavigation} for navigation configuration
 */
import * as React from 'react';
import { type BottomNavigationProps } from '../bottom-navigation';
import { type MobileHeaderProps } from '../mobile-header';
import { type StatusLayoutProps } from '../status-layout';
/**
 * MobileAppShell component props
 * @interface MobileAppShellProps
 */
export interface MobileAppShellProps {
    /** Main page content (children) */
    children: React.ReactNode;
    /** Header configuration (optional title, greeting, subtitle, actions) */
    header?: MobileHeaderProps;
    /** Bottom navigation configuration (optional mobile tab bar) */
    navigation?: BottomNavigationProps;
    /** Status banner configuration (optional top alert/notification) */
    statusBanner?: StatusLayoutProps & {
        content: React.ReactNode;
    };
    /** Optional sidebar content (shown on desktop/tablet only) */
    sidebar?: React.ReactNode;
    /** Whether to show sidebar on desktop breakpoint (default: true) */
    showSidebarOnDesktop?: boolean;
    /** Optional custom className for root element */
    className?: string;
}
declare const MobileAppShell: React.MemoExoticComponent<React.ForwardRefExoticComponent<MobileAppShellProps & React.RefAttributes<HTMLDivElement>>>;
export { MobileAppShell };
//# sourceMappingURL=mobile-app-shell.d.ts.map