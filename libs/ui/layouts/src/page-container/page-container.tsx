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

import { cn } from '@nasnet/ui/primitives';

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

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

const variantClasses = {
  default: '',
  elevated: 'bg-surfaceElevated1 rounded-lg',
  flat: 'bg-background',
};

/**
 * PageContainer - Main content wrapper for page layouts
 * Provides semantic HTML with responsive spacing and optional header section.
 */
const PageContainerImpl = React.forwardRef<HTMLElement, PageContainerProps>(
  (
    {
      children,
      title,
      description,
      actions,
      breadcrumbs,
      className,
      maxWidth = '2xl',
      variant = 'default',
    },
    ref
  ) => {
    return (
      <main
        ref={ref}
        className={cn(
          'px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-lg mx-auto w-full',
          maxWidthClasses[maxWidth],
          variantClasses[variant],
          className
        )}
      >
        {breadcrumbs && <nav className="text-muted-foreground mb-6 text-sm">{breadcrumbs}</nav>}
        {(title || actions) && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && <h1 className="text-foreground text-2xl font-semibold">{title}</h1>}
              {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    );
  }
);

PageContainerImpl.displayName = 'PageContainer';

/**
 * PageContainer - Responsive main content wrapper
 */
export const PageContainer = React.memo(PageContainerImpl);
