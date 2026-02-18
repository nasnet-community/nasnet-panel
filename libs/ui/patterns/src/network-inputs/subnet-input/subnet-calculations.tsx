/**
 * SubnetCalculations Component
 * Displays calculated subnet information (network, broadcast, range, hosts, mask)
 *
 * Uses semantic design tokens for styling as per NasNetConnect design system.
 *
 * @example
 * ```tsx
 * <SubnetCalculations
 *   info={{
 *     network: '192.168.1.0',
 *     broadcast: '192.168.1.255',
 *     firstHost: '192.168.1.1',
 *     lastHost: '192.168.1.254',
 *     hostCount: 254,
 *     prefix: 24,
 *     mask: '255.255.255.0',
 *   }}
 * />
 * ```
 */

import * as React from 'react';

import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

import { cn, Button } from '@nasnet/ui/primitives';

import type { SubnetCalculationsProps, SubnetInfo } from './subnet-input.types';

/**
 * Individual calculation row component
 */
interface CalculationRowProps {
  label: string;
  value: string | number | null;
  copyable?: boolean;
  className?: string;
}

function CalculationRow({ label, value, copyable = false, className }: CalculationRowProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    if (value === null) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied - silently fail
    }
  }, [value]);

  const displayValue = value === null ? '-' : String(value);

  return (
    <div className={cn('flex items-center justify-between gap-2 py-1', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <span className="font-mono text-sm text-foreground">{displayValue}</span>
        {copyable && value !== null && (
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label={`Copy ${label}`}
          >
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * SubnetCalculations Component
 *
 * Displays a panel of calculated subnet information with optional
 * collapse functionality for mobile views.
 */
export function SubnetCalculations({
  info,
  collapsed = false,
  onToggleCollapse,
  className,
}: SubnetCalculationsProps) {
  // Format host count with thousands separator (use en-US for consistent formatting)
  const formattedHosts = info.hostCount.toLocaleString('en-US');

  // Format usable range
  const usableRange =
    info.firstHost && info.lastHost
      ? `${info.firstHost} - ${info.lastHost}`
      : 'N/A';

  const content = (
    <div className="space-y-0.5">
      <CalculationRow label="Network" value={info.network} copyable />
      <CalculationRow label="Broadcast" value={info.broadcast} copyable />
      <CalculationRow label="Usable Range" value={usableRange} copyable />
      <CalculationRow label="Host Count" value={formattedHosts} />
      <CalculationRow label="Subnet Mask" value={info.mask} copyable />
    </div>
  );

  // Collapsible version (for mobile)
  if (onToggleCollapse !== undefined) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border bg-muted/30 overflow-hidden',
          className
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          aria-expanded={!collapsed}
          aria-controls="subnet-calculations-content"
        >
          <span>Subnet Calculations</span>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {!collapsed && (
          <div id="subnet-calculations-content" className="px-3 pb-3">
            {content}
          </div>
        )}
      </div>
    );
  }

  // Static version (for desktop)
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-muted/30 p-3',
        className
      )}
    >
      <div className="mb-2 text-sm font-medium text-foreground">
        Subnet Calculations
      </div>
      {content}
    </div>
  );
}

SubnetCalculations.displayName = 'SubnetCalculations';
