/**
 * ResponsiveShell Component
 * Automatically switches between MobileAppShell and AppShell based on platform
 *
 * Implements ADR-018: Headless + Platform Presenters pattern
 * - Mobile (<640px): Uses MobileAppShell with BottomNavigation
 * - Tablet (640-1024px): Uses AppShell with CollapsibleSidebar (always visible)
 * - Desktop (>1024px): Uses AppShell with CollapsibleSidebar (collapse state persisted)
 *
 * @see Docs/design/ux-design/2-core-user-experience.md Section 2.3
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

import { AppShell } from '../app-shell';
import { MobileAppShell, type MobileAppShellProps } from '../mobile-app-shell';
import { usePlatform, type Platform } from './usePlatform';
import { useReducedMotion, useMotionClasses } from './useReducedMotion';

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
export const ResponsiveShell = React.forwardRef<
  HTMLDivElement,
  ResponsiveShellProps
>(
  (
    {
      children,
      sidebar,
      header,
      footer,
      banner,
      mobileHeaderProps,
      mobileNavigationProps,
      statusBannerProps,
      forcePlatform,
      sidebarCollapsed = false,
      onSidebarToggle,
      className,
    },
    ref
  ) => {
    const detectedPlatform = usePlatform();
    const platform = forcePlatform ?? detectedPlatform;
    const prefersReducedMotion = useReducedMotion();
    const { motionClass } = useMotionClasses();

    // Keyboard shortcut for sidebar toggle (Cmd+B / Ctrl+B)
    React.useEffect(() => {
      if (platform === 'mobile' || !onSidebarToggle) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        // Cmd+B (Mac) or Ctrl+B (Windows/Linux)
        if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
          event.preventDefault();
          onSidebarToggle();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [platform, onSidebarToggle]);

    // Render mobile layout
    if (platform === 'mobile') {
      return (
        <MobileAppShell
          ref={ref}
          header={mobileHeaderProps}
          navigation={mobileNavigationProps}
          statusBanner={statusBannerProps}
          className={cn(motionClass, className)}
        >
          {children}
        </MobileAppShell>
      );
    }

    // Determine sidebar collapse state based on platform rules:
    // - Tablet: Always expanded (collapsible but starts expanded)
    // - Desktop: Respects persisted preference
    const effectiveCollapsed = platform === 'tablet' ? false : sidebarCollapsed;

    // Create enhanced sidebar with collapse behavior
    const enhancedSidebar = sidebar ? (
      <div
        className={cn(
          'h-full flex flex-col',
          !prefersReducedMotion && 'transition-all duration-200 ease-out'
        )}
      >
        {sidebar}
        {/* Collapse toggle button (tablet/desktop) */}
        {onSidebarToggle && (
          <button
            type="button"
            onClick={onSidebarToggle}
            className={cn(
              'absolute -right-3 top-1/2 -translate-y-1/2 z-10',
              'w-6 h-6 rounded-full',
              'bg-slate-200 dark:bg-slate-700',
              'border border-slate-300 dark:border-slate-600',
              'flex items-center justify-center',
              'hover:bg-slate-300 dark:hover:bg-slate-600',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              !prefersReducedMotion && 'transition-colors duration-150'
            )}
            aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={`${effectiveCollapsed ? 'Expand' : 'Collapse'} sidebar (${
              navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'
            }+B)`}
          >
            <svg
              className={cn(
                'w-4 h-4 text-slate-600 dark:text-slate-300',
                !prefersReducedMotion && 'transition-transform duration-200',
                effectiveCollapsed && 'rotate-180'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </div>
    ) : undefined;

    // Render tablet/desktop layout
    return (
      <AppShell
        ref={ref}
        header={header}
        footer={footer}
        banner={banner}
        sidebar={enhancedSidebar}
        sidebarCollapsed={effectiveCollapsed}
        className={cn(motionClass, className)}
      >
        {children}
      </AppShell>
    );
  }
);

ResponsiveShell.displayName = 'ResponsiveShell';

/**
 * Get display name for current platform (for debugging/logging)
 */
export function getPlatformDisplayName(platform: Platform): string {
  switch (platform) {
    case 'mobile':
      return 'Mobile (<640px)';
    case 'tablet':
      return 'Tablet (640-1024px)';
    case 'desktop':
      return 'Desktop (>1024px)';
    default:
      return 'Unknown';
  }
}
