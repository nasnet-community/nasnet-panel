/**
 * Breadcrumb Component
 * Auto-switching wrapper that selects the appropriate presenter based on platform
 *
 * Features:
 * - Desktop: Full path display
 * - Mobile: Collapsed with ellipsis
 * - Platform detection via usePlatform() hook
 *
 * @see NAS-4.10: Implement Navigation & Command Palette
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { BreadcrumbDesktop } from './BreadcrumbDesktop';
import { BreadcrumbMobile } from './BreadcrumbMobile';

/**
 * Props for Breadcrumb
 */
export interface BreadcrumbProps {
  /** Show home icon for first segment */
  showHomeIcon?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * Breadcrumb component
 * Automatically switches between desktop and mobile presenters
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
 */
export function Breadcrumb({ showHomeIcon, className }: BreadcrumbProps) {
  const platform = usePlatform();

  if (platform === 'mobile') {
    return (
      <BreadcrumbMobile
        showHomeIcon={showHomeIcon}
        className={className}
      />
    );
  }

  return (
    <BreadcrumbDesktop
      showHomeIcon={showHomeIcon}
      className={className}
    />
  );
}
