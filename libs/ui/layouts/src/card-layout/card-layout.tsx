import * as React from 'react';
import { cn } from '@nasnet/ui/primitives';

export interface CardLayoutProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 'auto';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'elevated' | 'interactive' | 'flat';
  className?: string;
}

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-3 md:gap-4',
  lg: 'gap-4 md:gap-6',
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

const CardLayout = React.forwardRef<HTMLDivElement, CardLayoutProps>(
  ({ children, columns = 'auto', gap = 'md', variant, className }, ref) => {
    // Apply variant class to children if specified
    const childrenWithVariant = variant
      ? React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              className: cn(
                variant === 'elevated' && 'card-elevated',
                variant === 'interactive' && 'card-interactive',
                variant === 'flat' && 'card-flat',
                variant === 'elevated' && 'rounded-card-sm md:rounded-card-lg',
                variant === 'interactive' && 'rounded-card-sm md:rounded-card-lg',
                variant === 'flat' && 'rounded-card-sm md:rounded-card-lg',
                child.props.className
              ),
            } as any);
          }
          return child;
        })
      : children;

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
      >
        {childrenWithVariant}
      </div>
    );
  }
);

CardLayout.displayName = 'CardLayout';

export { CardLayout };







