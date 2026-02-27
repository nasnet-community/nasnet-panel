/**
 * CPUBreakdownModal Component
 * Displays per-core CPU usage in a modal dialog
 *
 * AC 5.2.4: Click CPU gauge to see breakdown of usage per core
 * - Shows horizontal bar chart for each core
 * - Displays core frequency if available
 * - Accessible modal with focus trap and ESC to close
 *
 * @example
 * ```tsx
 * <CPUBreakdownModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   perCoreUsage={[45, 52, 48, 51]}
 *   overallUsage={49}
 *   frequency={2400}
 * />
 * ```
 */

import React, { useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

/**
 * CPUBreakdownModal props
 */
export interface CPUBreakdownModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback to close modal */
  onOpenChange: (open: boolean) => void;
  /** Array of per-core usage percentages */
  perCoreUsage: number[];
  /** Overall CPU usage percentage */
  overallUsage: number;
  /** CPU frequency in MHz (optional) */
  frequency?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CPUBreakdownModal Component
 *
 * Renders a dialog showing:
 * - Per-core CPU usage as horizontal bars
 * - Overall CPU usage summary
 * - CPU frequency if available
 *
 * WCAG AAA compliant:
 * - 7:1 contrast ratio maintained
 * - Role="meter" ARIA attributes on progress bars
 * - Keyboard accessible (ESC to close)
 * - Screen reader support for core metrics
 */
const CPUBreakdownModal = React.memo(function CPUBreakdownModal({
  open,
  onOpenChange,
  perCoreUsage,
  overallUsage,
  frequency,
  className,
}: CPUBreakdownModalProps) {
  const coreCount = perCoreUsage.length;

  // Memoize close handler
  const handleClose = useCallback(
    (newOpen: boolean) => {
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
    >
      <DialogContent className={cn('max-w-md', className)}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">CPU Core Breakdown</DialogTitle>
        </DialogHeader>

        {/* Overall CPU usage summary */}
        <div className="mb-component-lg p-component-md rounded-card-sm bg-card border-border border">
          <div className="mb-component-xs flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">Overall Usage</span>
            <span className="text-foreground font-mono text-2xl font-bold">{overallUsage}%</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {coreCount} core{coreCount > 1 ? 's' : ''}
            {frequency && ` @ ${(frequency / 1000).toFixed(2)} GHz`}
          </div>
        </div>

        {/* Per-core usage bars */}
        <div className="space-y-component-md">
          {perCoreUsage.map((usage, index) => (
            <div
              key={`core-${index}`}
              className="space-y-component-xs"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">Core {index + 1}</span>
                <span className="text-muted-foreground font-mono">{usage}%</span>
              </div>

              {/* Horizontal bar */}
              <div className="bg-muted rounded-pill h-2 overflow-hidden">
                <div
                  className={cn(
                    'rounded-pill h-full transition-all duration-500',
                    usage >= 90 ? 'bg-error'
                    : usage >= 70 ? 'bg-warning'
                    : 'bg-success'
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, usage))}%` }}
                  role="meter"
                  aria-valuenow={usage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Core ${index + 1} usage: ${usage}%`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Accessibility note */}
        <p className="text-muted-foreground mt-component-lg text-xs">
          Press ESC or click outside to close
        </p>
      </DialogContent>
    </Dialog>
  );
});

CPUBreakdownModal.displayName = 'CPUBreakdownModal';

export { CPUBreakdownModal };
