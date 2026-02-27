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
import { ChevronLeft } from 'lucide-react';

import { cn, Icon } from '@nasnet/ui/primitives';

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
export const ResponsiveShell = React.memo(
  React.forwardRef<HTMLDivElement, ResponsiveShellProps>(
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
      const enhancedSidebar =
        sidebar ?
          <div
            className={cn(
              'flex h-full flex-col',
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
                  'absolute -right-3 top-1/2 z-10 -translate-y-1/2',
                  'h-6 w-6 rounded-full',
                  'bg-muted',
                  'border-border border',
                  'flex items-center justify-center',
                  'hover:bg-accent',
                  'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  !prefersReducedMotion && 'transition-colors duration-150'
                )}
                aria-expanded={!effectiveCollapsed}
                aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={`${effectiveCollapsed ? 'Expand' : 'Collapse'} sidebar (${
                  navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'
                }+B)`}
              >
                <Icon
                  icon={ChevronLeft}
                  className={cn(
                    'text-muted-foreground h-4 w-4',
                    !prefersReducedMotion && 'transition-transform duration-200',
                    effectiveCollapsed && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        : undefined;

      // Render tablet/desktop layout
      return (
        <div className="bg-background min-h-screen">
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
        </div>
      );
    }
  )
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
