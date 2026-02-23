/**
 * Page Container Component
 *
 * Responsive content wrapper for page layouts with optional breadcrumbs,
 * title, description, and action buttons. Uses semantic HTML <main> element
 * and responsive spacing for mobile, tablet, and desktop.
 *
 * Features:
 * - Semantic HTML <main> element for accessibility
 * - Configurable max-width (sm/md/lg/xl/2xl/full)
 * - Optional breadcrumb navigation
 * - Title with optional description
 * - Action buttons (top-right)
 * - Responsive padding (mobile/tablet/desktop)
 * - Optional card variants (elevated/flat)
 *
 * @example
 * ```tsx
 * <PageContainer
 *   title="Firewall Rules"
 *   description="Manage network firewall rules"
 *   breadcrumbs={<Breadcrumb items={[...]} />}
 *   actions={<Button>Add Rule</Button>}
 * >
 *   <RulesList />
 * </PageContainer>
 * ```
 *
 * @see {@link PageContainerProps} for prop interface
 */
import * as React from 'react';
/**
 * PageContainer component props
 * @interface PageContainerProps
 */
export interface PageContainerProps {
    /** Main content to render inside container */
    children: React.ReactNode;
    /** Optional page title (typically h1) */
    title?: string;
    /** Optional description text below title */
    description?: string;
    /** Optional action buttons/controls (rendered top-right) */
    actions?: React.ReactNode;
    /** Optional breadcrumb navigation component */
    breadcrumbs?: React.ReactNode;
    /** Optional custom className for root element */
    className?: string;
    /** Maximum content width breakpoint */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    /** Visual variant for container background */
    variant?: 'default' | 'elevated' | 'flat';
}
/**
 * PageContainer - Responsive main content wrapper
 */
export declare const PageContainer: React.MemoExoticComponent<React.ForwardRefExoticComponent<PageContainerProps & React.RefAttributes<HTMLElement>>>;
//# sourceMappingURL=page-container.d.ts.map