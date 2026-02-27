/**
 * TopologyTooltip
 *
 * Tooltip component for displaying node details in the network topology.
 * Built on Radix Tooltip primitive for accessibility.
 */

import { memo, type ReactNode } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
 cn } from '@nasnet/ui/primitives';

import type { TooltipContent as TooltipData } from './types';

export interface TopologyTooltipProps {
  /** Child element that triggers the tooltip */
  children: ReactNode;
  /** Tooltip content data */
  content: TooltipData | null;
  /** Whether the tooltip is open (controlled) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Side of the trigger to render tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignment of the tooltip */
  align?: 'start' | 'center' | 'end';
  /** Delay before showing tooltip in ms */
  delayDuration?: number;
  /** Additional CSS classes for content */
  className?: string;
}

/**
 * Status indicator component for the tooltip
 */
function StatusIndicator({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    online: { color: 'bg-success', label: 'Online' },
    offline: { color: 'bg-muted-foreground', label: 'Offline' },
    connected: { color: 'bg-success', label: 'Connected' },
    disconnected: { color: 'bg-muted-foreground', label: 'Disconnected' },
    pending: { color: 'bg-warning', label: 'Pending' },
    unknown: { color: 'bg-muted-foreground', label: 'Unknown' },
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn('inline-block h-2 w-2 rounded-full', config.color)}
        aria-hidden="true"
      />
      <span className="text-xs font-medium text-muted-foreground">
        {config.label}
      </span>
    </div>
  );
}

/**
 * TopologyTooltip displays detailed information about a topology node.
 *
 * Features:
 * - Shows title, IP address, and status
 * - Displays additional details in a key-value format
 * - Accessible via keyboard focus
 * - Avoids viewport overflow
 */
export const TopologyTooltip = memo(function TopologyTooltip({
  children,
  content,
  open,
  onOpenChange,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  className,
}: TopologyTooltipProps) {
  if (!content) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip open={open} onOpenChange={onOpenChange}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={8}
          className={cn(
            'z-50 max-w-[280px] rounded-[var(--semantic-radius-input)] border border-border bg-popover px-3 py-2',
            'shadow-[var(--semantic-shadow-tooltip)]',
            'animate-in fade-in-0 zoom-in-95',
            className
          )}
        >
          {/* Header with title and status */}
          <div className="mb-2 flex items-start justify-between gap-3">
            <h4 className="font-semibold text-foreground">{content.title}</h4>
            <StatusIndicator status={content.status} />
          </div>

          {/* IP Address (if available) */}
          {content.ip && (
            <div className="mb-2">
              <span className="font-mono text-sm text-foreground">
                {content.ip}
              </span>
            </div>
          )}

          {/* Additional details */}
          {content.details && Object.keys(content.details).length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              {Object.entries(content.details).map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-muted-foreground">{key}:</dt>
                  <dd className="font-mono text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Tooltip arrow */}
          <div
            className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r bg-popover"
            aria-hidden="true"
            style={{ display: side === 'top' ? 'block' : 'none' }}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

TopologyTooltip.displayName = 'TopologyTooltip';

/**
 * TopologyTooltipContent
 *
 * Standalone content component for use in custom tooltip implementations.
 */
export const TopologyTooltipContent = memo(function TopologyTooltipContent({
  content,
  className,
}: {
  content: TooltipData;
  className?: string;
}) {
  return (
    <div className={cn('min-w-[180px]', className)}>
      {/* Header with title and status */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <h4 className="font-semibold text-foreground">{content.title}</h4>
        <StatusIndicator status={content.status} />
      </div>

      {/* IP Address (if available) */}
      {content.ip && (
        <div className="mb-2">
          <span className="font-mono text-sm text-foreground">{content.ip}</span>
        </div>
      )}

      {/* Additional details */}
      {content.details && Object.keys(content.details).length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          {Object.entries(content.details).map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-muted-foreground">{key}:</dt>
              <dd className="font-mono text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
});

TopologyTooltipContent.displayName = 'TopologyTooltipContent';
