import * as React from 'react';
import { cn } from '@nasnet/ui/primitives';

export interface StatusLayoutProps {
  children: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'info';
  visible?: boolean;
  sticky?: boolean;
  className?: string;
  onDismiss?: () => void;
}

const statusClasses = {
  success: 'bg-success text-white border-success',
  warning: 'bg-warning text-white border-warning',
  error: 'bg-error text-white border-error',
  info: 'bg-info text-white border-info',
};

const StatusLayout = React.forwardRef<HTMLDivElement, StatusLayoutProps>(
  (
    {
      children,
      status = 'info',
      visible = true,
      sticky = true,
      className,
      onDismiss,
    },
    ref
  ) => {
    if (!visible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'z-30 border-b transition-all duration-200 ease-in-out',
          sticky && 'sticky top-0',
          statusClasses[status],
          className
        )}
      >
        <div className="relative px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">{children}</div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 rounded-full p-1 hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

StatusLayout.displayName = 'StatusLayout';

export { StatusLayout };




























