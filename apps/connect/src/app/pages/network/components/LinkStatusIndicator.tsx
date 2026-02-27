/**
 * Link Status Indicator Component
 * Displays link status (up/down/unknown) with icons
 */

import React from 'react';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type LinkStatus } from '@nasnet/core/types';

import { cn } from '@nasnet/ui/utils';

interface LinkStatusIndicatorProps {
  linkStatus: LinkStatus;
  className?: string;
}

export const LinkStatusIndicator = React.memo(function LinkStatusIndicator({
  linkStatus,
  className,
}: LinkStatusIndicatorProps) {
  const { t } = useTranslation('network');
  const Icon =
    linkStatus === 'up' ? ArrowUp
    : linkStatus === 'down' ? ArrowDown
    : Minus;

  const colorClass =
    linkStatus === 'up' ? 'text-success'
    : linkStatus === 'down' ? 'text-error'
    : 'text-muted-foreground';

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs font-medium', colorClass, className)}
      role="status"
      aria-live="polite"
    >
      <Icon
        className="h-3.5 w-3.5 flex-shrink-0"
        aria-hidden="true"
      />
      <span className="font-mono">
        {linkStatus === 'up' ?
          t('interfaces.linkUp')
        : linkStatus === 'down' ?
          t('interfaces.linkDown')
        : t('status.unknown', { ns: 'common' })}
      </span>
    </span>
  );
});

LinkStatusIndicator.displayName = 'LinkStatusIndicator';
