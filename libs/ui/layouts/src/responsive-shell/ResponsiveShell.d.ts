/**
 * ResponsiveShell Component
 *
 * The top-level layout wrapper that automatically adapts to viewport size,
 * selecting between MobileAppShell and AppShell layouts. Implements the
 * Headless + Platform Presenters architecture pattern.
 *
 * **Platform Behavior:**
 * - Mobile (<640px): MobileAppShell with bottom tab navigation
 * - Tablet (640-1024px): AppShell with expanded sidebar navigation
 * - Desktop (>1024px): AppShell with collapsible sidebar (state persisted)
 *
 * **Features:**
 * - Automatic platform detection via viewport width + user agent
 * - Optional forced platform override for testing/preview
 * - Sidebar collapse toggle (Ctrl+B / Cmd+B keyboard shortcut)
 * - Full keyboard navigation support
 * - Respects `prefers-reduced-motion` for animations
 * - Semantic HTML with proper ARIA labels
 *
 * @example
 * ```tsx
 * // Basic usage (auto-detects platform)
 * <ResponsiveShell
 *   sidebar={<Sidebar />}
 *   header={<Header />}
 *   mobileNavigationProps={{ activeId: 'home', items: [...] }}
 * >
 *   <PageContent />
 * </ResponsiveShell>
 * ```
 *
 * @example
 * ```tsx
 * // With controlled sidebar state (wired to Zustand store)
 * function AppLayout({ children }) {
 *   const { desktopCollapsed, toggle } = useSidebarStore();
 *   return (
 *     <ResponsiveShell
 *       sidebar={<NavigationSidebar />}
 *       sidebarCollapsed={desktopCollapsed}
 *       onSidebarToggle={toggle}
 *     >
 *       {children}
 *     </ResponsiveShell>
 *   );
 * }
 * ```
 *
 * @see {@link ResponsiveShellProps} for prop interface
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md for implementation details
 * @see Docs/architecture/adrs/018-headless-platform-presenters.md
 */
import * as React from 'react';
import { type MobileAppShellProps } from '../mobile-app-shell';
import { type Platform } from './usePlatform';
/**
 * Props for ResponsiveShell component
 *
 * Note: Due to library dependency rules, ResponsiveShell cannot directly import
 * from state/stores. Sidebar state is passed via props (dependency injection).
 * The app layer wires up the Zustand store.
 */
export interface ResponsiveShellProps {
    children: React.ReactNode;
    /**
     * Sidebar content for tablet/desktop layouts
     * Will be wrapped in CollapsibleSidebar behavior
     */
    sidebar?: React.ReactNode;
    /**
     * Header content for desktop/tablet layouts
     * For mobile, use mobileHeaderProps instead
     */
    header?: React.ReactNode;
    /**
     * Footer content (optional)
     */
    footer?: React.ReactNode;
    /**
     * Banner content (e.g., ConnectionBanner) - rendered below header
     */
    banner?: React.ReactNode;
    /**
     * Mobile header props
     * Only used on mobile platform
     */
    mobileHeaderProps?: MobileAppShellProps['header'];
    /**
     * Mobile bottom navigation props
     * Only used on mobile platform
     */
    mobileNavigationProps?: MobileAppShellProps['navigation'];
    /**
     * Status banner (used on mobile)
     */
    statusBannerProps?: MobileAppShellProps['statusBanner'];
    /**
     * Force a specific platform (for testing/preview)
     * Overrides automatic detection
     */
    forcePlatform?: Platform;
    /**
     * Whether the sidebar is collapsed (desktop only)
     * Controlled externally via Zustand store
     * @default false
     */
    sidebarCollapsed?: boolean;
    /**
     * Callback when sidebar collapse state changes
     * Connect to Zustand store: useSidebarStore.getState().toggle()
     */
    onSidebarToggle?: () => void;
    /**
     * Additional class names
     */
    className?: string;
}
/**
 * ResponsiveShell Component
 *
 * The main layout wrapper that automatically adapts to the current platform.
 * Uses the Platform Provider context if available, falls back to direct detection.
 *
 * @example
 * ```tsx
 * // Basic usage (auto-detects platform)
 * <ResponsiveShell
 *   sidebar={<Sidebar />}
 *   header={<Header />}
 *   mobileNavigationProps={{ activeId: 'home' }}
 * >
 *   <PageContent />
 * </ResponsiveShell>
 * ```
 *
 * @example
 * ```tsx
 * // With Zustand sidebar store (in apps/connect)
 * function AppLayout({ children }) {
 *   const { desktopCollapsed, toggle } = useSidebarStore();
 *
 *   return (
 *     <ResponsiveShell
 *       sidebar={<NavigationSidebar />}
 *       sidebarCollapsed={desktopCollapsed}
 *       onSidebarToggle={toggle}
 *     >
 *       {children}
 *     </ResponsiveShell>
 *   );
 * }
 * ```
 */
export declare const ResponsiveShell: React.MemoExoticComponent<React.ForwardRefExoticComponent<ResponsiveShellProps & React.RefAttributes<HTMLDivElement>>>;
/**
 * Get display name for current platform (for debugging/logging)
 */
export declare function getPlatformDisplayName(platform: Platform): string;
//# sourceMappingURL=ResponsiveShell.d.ts.map