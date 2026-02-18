/**
 * Link Status Indicator Component
 * Displays link status (up/down/unknown) with icons
 */

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

import { type LinkStatus } from '@nasnet/core/types';

import { cn } from '@/lib/utils';

interface LinkStatusIndicatorProps {
  linkStatus: LinkStatus;
  className?: string;
}

export function LinkStatusIndicator({
  linkStatus,
  className,
}: LinkStatusIndicatorProps) {
  const Icon =
    linkStatus === 'up' ? ArrowUp : linkStatus === 'down' ? ArrowDown : Minus;

  const colorClass =
    linkStatus === 'up'
      ? 'text-green-600 dark:text-green-400'
      : linkStatus === 'down'
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-500';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        colorClass,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {linkStatus === 'up' ? 'Link Up' : linkStatus === 'down' ? 'Link Down' : 'Unknown'}
    </span>
  );
}
