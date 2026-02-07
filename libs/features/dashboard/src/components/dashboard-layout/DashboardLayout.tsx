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

import { type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@nasnet/ui/primitives';
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
export function DashboardLayout({
  children,
  onRefresh,
  showRefresh = true,
  className,
}: DashboardLayoutProps) {
  const platform = usePlatform();

  // Calculate grid columns based on platform
  const gridColumns = getGridColumns(platform);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Page Header */}
      <header className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Router health and network status at a glance
          </p>
        </div>

        {/* Refresh Button */}
        {showRefresh && onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            aria-label="Refresh router data"
            title="Refresh"
            className="h-12 w-12" // 48px for WCAG AAA touch target
          >
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}
      </header>

      {/* Dashboard Grid */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div
          className={cn(
            'grid gap-4 sm:gap-6 lg:gap-8',
            gridColumns,
            // Ensure proper grid layout
            'auto-rows-max'
          )}
          role="main"
          aria-label="Dashboard widgets"
        >
          {children}
        </div>
      </main>
    </div>
  );
}

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
