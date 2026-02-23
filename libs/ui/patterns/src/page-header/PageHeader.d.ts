/**
 * PageHeader Component
 *
 * Simple page header with title and optional description.
 * Used at the top of feature pages for consistent layout.
 */
import * as React from 'react';
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
export declare const PageHeader: React.NamedExoticComponent<PageHeaderProps>;
//# sourceMappingURL=PageHeader.d.ts.map