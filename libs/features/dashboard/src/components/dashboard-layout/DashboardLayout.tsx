/**
 * DashboardLayout Component
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Responsive CSS Grid layout that adapts to mobile, tablet, and desktop viewports.
 * Implements platform-specific layouts per UX Design Section 2.3.
 *
 * Platform Layouts:
 * - Mobile (<640px): Single column, full-width cards
 * - Tablet (640-1024px): 2-column grid, collapsible sidebar
 * - Desktop (>1024px): 3-column grid, fixed sidebar (240px)
 *
 * @see ADR-017: Three-Layer Component Architecture
 * @see Docs/design/ux-design/2-core-user-experience.md#Adaptive Layouts
 */

import { memo, useCallback, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button, Icon } from '@nasnet/ui/primitives';
import { usePlatform } from '@nasnet/ui/layouts';
import { cn } from '@nasnet/ui/utils';

export interface DashboardLayoutProps {
  /** Child widgets/cards to render in grid */
  children: ReactNode;
  /** Callback when refresh button is clicked */
  onRefresh?: () => void;
  /** Show refresh button (default: true) */
  showRefresh?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DashboardLayout - Responsive grid layout for dashboard widgets
 * @description Responsive CSS Grid layout that adapts to mobile, tablet, and desktop viewports
 *
 * Automatically adjusts grid columns based on viewport:
 * - Mobile: 1 column
 * - Tablet: 2 columns
 * - Desktop: 3 columns
 *
 * @example
 * ```tsx
 * <DashboardLayout onRefresh={handleRefresh}>
 *   <RouterHealthSummaryCard routerId="router-1" />
 *   <NetworkStatusCard routerId="router-1" />
 *   <AlertsCard routerId="router-1" />
 * </DashboardLayout>
 * ```
 */
export const DashboardLayout = memo(function DashboardLayout({
  children,
  onRefresh,
  showRefresh = true,
  className,
}: DashboardLayoutProps) {
  const platform = usePlatform();

  // Calculate grid columns based on platform
  const gridColumns = getGridColumns(platform);

  // Memoize refresh handler to prevent re-renders
  const handleRefreshClick = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Page Header */}
      <header className="p-component-md sm:p-component-lg border-border flex items-center justify-between border-b">
        <div>
          <h1 className="font-display text-foreground text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-component-xs text-sm">
            Router health and network status at a glance
          </p>
        </div>

        {/* Refresh Button */}
        {showRefresh && onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshClick}
            aria-label="Refresh router data"
            title="Refresh"
            className="h-12 w-12" // 48px for WCAG AAA touch target
          >
            <Icon
              icon={RefreshCw}
              className="h-5 w-5"
              aria-hidden="true"
            />
          </Button>
        )}
      </header>

      {/* Dashboard Grid */}
      <main className="p-component-md sm:p-component-lg lg:p-component-xl flex-1 overflow-auto">
        <div
          className={cn(
            'gap-component-md sm:gap-component-lg lg:gap-component-xl grid',
            gridColumns,
            // Ensure proper grid layout
            'auto-rows-max'
          )}
          role="region"
          aria-label="Dashboard widgets"
        >
          {children}
        </div>
      </main>
    </div>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

/**
 * Calculate grid column classes based on platform
 *
 * @param platform - Current platform: 'mobile' | 'tablet' | 'desktop'
 * @returns Tailwind grid column class
 */
function getGridColumns(platform: 'mobile' | 'tablet' | 'desktop'): string {
  switch (platform) {
    case 'mobile':
      return 'grid-cols-1';
    case 'tablet':
      return 'grid-cols-2';
    case 'desktop':
      return 'grid-cols-3';
    default:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }
}

/**
 * Type export for external consumption
 */
export type { DashboardLayoutProps as DashboardLayoutPropsType };
