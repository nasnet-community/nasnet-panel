/**
 * PageHeader Component
 *
 * Simple page header with title and optional description.
 * Used at the top of feature pages for consistent layout.
 */

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

export interface PageHeaderProps {
  /**
   * Page title
   */
  title: string;

  /**
   * Optional description text
   */
  description?: string;

  /**
   * Optional action buttons/controls to render on the right
   */
  actions?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * PageHeader - Page-level header component
 *
 * Displays page title with optional description and action buttons.
 * Provides consistent spacing and typography across feature pages.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="DNS Configuration"
 *   description="Manage DNS servers and static entries"
 *   actions={<Button>Add Server</Button>}
 * />
 * ```
 */
export const PageHeader = React.memo(function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
});

PageHeader.displayName = 'PageHeader';
