import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

export interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
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
  elevated: 'card-elevated',
  flat: 'card-flat',
};

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
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
      <div
        ref={ref}
        className={cn(
          'mx-auto w-full px-6 py-4',
          maxWidthClasses[maxWidth],
          variantClasses[variant],
          className
        )}
      >
        {breadcrumbs && (
          <nav className="mb-4 text-sm text-slate-500 dark:text-slate-400">{breadcrumbs}</nav>
        )}
        {(title || actions) && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && (
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

PageContainer.displayName = 'PageContainer';

export { PageContainer };
