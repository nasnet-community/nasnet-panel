import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm',
        success:
          'bg-success-light text-success-dark border border-success/20',
        connected:
          'bg-success-light text-success-dark border border-success/20',
        warning:
          'bg-warning-light text-warning-dark border border-warning/20',
        error:
          'bg-error-light text-error-dark border border-error/20',
        info:
          'bg-info-light text-info-dark border border-info/20',
        offline:
          'bg-muted text-muted-foreground border border-border',
        outline:
          'border border-border bg-transparent text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

function Badge({ className, variant, pulse, ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        badgeVariants({ variant }), 
        pulse && 'animate-pulse-glow',
        className
      )} 
      {...props} 
    />
  );
}

export { Badge, badgeVariants };

