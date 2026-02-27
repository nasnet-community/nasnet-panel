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
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium text-xs',
        sizeClasses[size],
        isRunning
          ? 'bg-success/15 text-success'
          : 'bg-error/15 text-error',
        className
      )}
    >
      <span className="relative flex flex-shrink-0">
        <span
          className={cn(
            'rounded-full',
            dotSizeClasses[size],
            isRunning ? 'bg-success' : 'bg-error'
          )}
          aria-hidden="true"
        />
        {isRunning && (
          <span
            className={cn(
              'absolute inset-0 rounded-full bg-success animate-pulse opacity-75',
              dotSizeClasses[size]
            )}
            aria-hidden="true"
          />
        )}
      </span>
      {showLabel && <span className="font-medium">{isRunning ? t('interfaces.running') : t('interfaces.disabled')}</span>}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
