import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@nasnet/ui/primitives';

const statusIndicatorVariants = cva(
  'inline-flex items-center gap-2 text-sm font-medium transition-colors',
  {
    variants: {
      status: {
        online: 'text-success',
        offline: 'text-error',
        warning: 'text-warning',
        info: 'text-info',
        pending: 'text-muted-foreground',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      status: 'info',
      size: 'md',
    },
  }
);

const dotVariants = cva('rounded-full transition-all', {
  variants: {
    status: {
      online: 'bg-success',
      offline: 'bg-error',
      warning: 'bg-warning',
      info: 'bg-info',
      pending: 'bg-muted-foreground',
    },
    size: {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-3 w-3',
    },
    pulse: {
      true: 'animate-pulse-glow',
      false: '',
    },
  },
  defaultVariants: {
    status: 'info',
    size: 'md',
    pulse: false,
  },
});

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label?: string;
  showDot?: boolean;
  pulse?: boolean;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, size, label, showDot = true, pulse = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        className={cn(statusIndicatorVariants({ status, size }), className)}
        {...props}
      >
        {showDot && (
          <span className={cn(dotVariants({ status, size, pulse }))} aria-hidden="true" />
        )}
        {label && <span>{label}</span>}
      </div>
    );
  }
);

StatusIndicator.displayName = 'StatusIndicator';

export { StatusIndicator, statusIndicatorVariants };
