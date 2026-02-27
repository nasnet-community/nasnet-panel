/**
 * InterfaceItem - Individual interface row component
 *
 * Displays a single interface with:
 * - Type icon with color
 * - Name and IP address
 * - Status indicator
 * - Usage warning badge with tooltip
 * - Checkbox for multi-select mode
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */

import { memo } from 'react';

import { Check } from 'lucide-react';

import {
  cn,
  Checkbox,
  Badge,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@nasnet/ui/primitives';

import { InterfaceTypeIcon } from './interface-type-icon';

import type { InterfaceItemProps, InterfaceStatus } from './interface-selector.types';

/**
 * Status indicator component.
 * Shows a colored dot based on interface status.
 */
function StatusIndicator({ status }: { status: InterfaceStatus }) {
  const statusColors: Record<InterfaceStatus, string> = {
    up: 'bg-success',
    down: 'bg-muted-foreground/50',
    disabled: 'bg-warning',
  };

  const statusLabels: Record<InterfaceStatus, string> = {
    up: 'Up',
    down: 'Down',
    disabled: 'Disabled',
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn('inline-block h-2 w-2 shrink-0 rounded-full', statusColors[status])}
            aria-label={statusLabels[status]}
          />
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-xs"
        >
          {statusLabels[status]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * InterfaceItem component.
 *
 * Displays a single interface row with all relevant information
 * and interaction handlers.
 *
 * @param props - InterfaceItemProps
 */
export const InterfaceItem = memo(function InterfaceItem({
  interface: iface,
  selected,
  onSelect,
  showCheckbox = false,
  showStatus = true,
  showIP = true,
  className,
}: InterfaceItemProps) {
  const hasUsageWarning = iface.usedBy && iface.usedBy.length > 0;

  return (
    <div
      role="option"
      aria-selected={selected}
      aria-describedby={hasUsageWarning ? `usage-${iface.id}` : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2',
        'hover:bg-accent focus:bg-accent focus:outline-none',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
        selected && 'bg-primary/10',
        className
      )}
    >
      {/* Checkbox for multi-select */}
      {showCheckbox && (
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelect()}
          aria-label={`Select ${iface.name}`}
          className="pointer-events-none"
        />
      )}

      {/* Type icon */}
      <InterfaceTypeIcon
        type={iface.type}
        className="h-5 w-5 shrink-0"
      />

      {/* Name and IP (monospace for network data) */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-medium">{iface.name}</p>
        {showIP && iface.ip && (
          <p className="text-muted-foreground truncate font-mono text-xs">{iface.ip}</p>
        )}
      </div>

      {/* Status indicator */}
      {showStatus && <StatusIndicator status={iface.status} />}

      {/* Usage warning */}
      {hasUsageWarning && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="bg-warning/10 text-warning shrink-0 text-xs"
              >
                In Use
              </Badge>
            </TooltipTrigger>
            <TooltipContent
              id={`usage-${iface.id}`}
              side="top"
              className="max-w-[200px]"
            >
              <p className="text-xs">Used by: {iface.usedBy?.join(', ')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Check mark for single-select */}
      {!showCheckbox && selected && (
        <Check
          className="text-primary h-4 w-4 shrink-0"
          aria-hidden="true"
        />
      )}
    </div>
  );
});

/**
 * Mobile variant of InterfaceItem with larger touch targets.
 * Uses 44px minimum height for WCAG compliance.
 */
export const InterfaceItemMobile = memo(function InterfaceItemMobile(props: InterfaceItemProps) {
  return (
    <InterfaceItem
      {...props}
      className={cn('min-h-[44px] py-3', props.className)}
    />
  );
});

InterfaceItem.displayName = 'InterfaceItem';
InterfaceItemMobile.displayName = 'InterfaceItemMobile';

export default InterfaceItem;
