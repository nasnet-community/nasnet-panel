/**
 * Breadcrumb Component
 * Auto-switching wrapper that selects the appropriate presenter based on platform
 *
 * Features:
 * - Mobile: Collapsed with ellipsis
 * - Tablet: Balanced view with collapsed middle items
 * - Desktop: Full path display
 * - Platform detection via usePlatform() hook
 * - RTL support
 *
 * @example
 * ```tsx
 * // In your page header
 * function PageHeader({ title }) {
 *   return (
 *     <header className="p-4">
 *       <Breadcrumb className="mb-2" />
 *       <h1>{title}</h1>
 *     </header>
 *   );
 * }
 * ```
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { BreadcrumbDesktop } from './BreadcrumbDesktop';
import { BreadcrumbTablet } from './BreadcrumbTablet';
import { BreadcrumbMobile } from './BreadcrumbMobile';

/**
 * Props for Breadcrumb
 */
export interface BreadcrumbProps {
  /** Show home icon for first segment */
  showHomeIcon?: boolean;
  /** Optional className */
  className?: string;
  /** Optional presenter override */
  presenter?: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Breadcrumb component
 * Automatically switches between mobile, tablet, and desktop presenters
 */
const Breadcrumb = React.memo(function Breadcrumb({
  showHomeIcon,
  className,
  presenter,
}: BreadcrumbProps) {
  const platform = usePlatform();
  const effectivePlatform = presenter || platform;

  switch (effectivePlatform) {
    case 'mobile':
      return (
        <BreadcrumbMobile
          showHomeIcon={showHomeIcon}
          className={className}
        />
      );
    case 'tablet':
      return (
        <BreadcrumbTablet
          showHomeIcon={showHomeIcon}
          className={className}
        />
      );
    case 'desktop':
    default:
      return (
        <BreadcrumbDesktop
          showHomeIcon={showHomeIcon}
          className={className}
        />
      );
  }
});

Breadcrumb.displayName = 'Breadcrumb';

export { Breadcrumb };
