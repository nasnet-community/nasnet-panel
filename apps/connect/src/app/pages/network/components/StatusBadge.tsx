/**
 * Status Badge Component
 * Dashboard Pro style with pulse animation for running state
 */

import { memo } from 'react';

import { type InterfaceStatus } from '@nasnet/core/types';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: InterfaceStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const StatusBadge = memo(function StatusBadge({
  status,
  size = 'md',
  showLabel = true,
  className,
}: StatusBadgeProps) {
  const isRunning = status === 'running';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  return (
    <span
      role="status"
      aria-label={isRunning ? 'Running' : 'Disabled'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeClasses[size],
        isRunning
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground',
        className
      )}
    >
      <span className="relative flex">
        <span
          className={cn(
            'rounded-full',
            dotSizeClasses[size],
            isRunning ? 'bg-emerald-500' : 'bg-muted-foreground'
          )}
        />
        {isRunning && (
          <span
            className={cn(
              'absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75',
              dotSizeClasses[size]
            )}
          />
        )}
      </span>
      {showLabel && (isRunning ? 'Running' : 'Disabled')}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
