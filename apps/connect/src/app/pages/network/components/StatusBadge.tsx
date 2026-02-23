/**
 * Status Badge Component
 * Dashboard Pro style with pulse animation for running state
 */

import { memo } from 'react';

import { useTranslation } from 'react-i18next';

import { type InterfaceStatus } from '@nasnet/core/types';

import { cn } from '@nasnet/ui/utils';

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
  const { t } = useTranslation('network');
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
      aria-label={isRunning ? t('interfaces.running') : t('interfaces.disabled')}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeClasses[size],
        isRunning
          ? 'bg-success/10 text-success'
          : 'bg-muted text-muted-foreground',
        className
      )}
    >
      <span className="relative flex">
        <span
          className={cn(
            'rounded-full',
            dotSizeClasses[size],
            isRunning ? 'bg-success' : 'bg-muted-foreground'
          )}
        />
        {isRunning && (
          <span
            className={cn(
              'absolute inset-0 rounded-full bg-success animate-ping opacity-75',
              dotSizeClasses[size]
            )}
          />
        )}
      </span>
      {showLabel && (isRunning ? t('interfaces.running') : t('interfaces.disabled'))}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
