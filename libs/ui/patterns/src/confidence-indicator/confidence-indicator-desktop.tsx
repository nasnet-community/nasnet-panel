/**
 * Confidence Indicator Desktop Presenter
 *
 * Desktop-optimized presenter with hover tooltips and inline labels.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */

import * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from '@nasnet/ui/primitives';

import { ConfidenceIndicatorBase, ConfidenceLevelLabel } from './confidence-indicator-base';
import { ConfidenceTooltipCompact } from './confidence-tooltip';

import type { ConfidenceIndicatorPresenterProps } from './confidence-indicator.types';

/**
 * Desktop Presenter for Confidence Indicator
 *
 * Features:
 * - Hover to show tooltip with details
 * - Optional inline label display
 * - Keyboard accessible (Tab to focus, Enter/Space for details)
 * - WCAG AAA compliant
 *
 * @example
 * ```tsx
 * const state = useConfidenceIndicator({ confidence: 95, method: 'Auto-detected' });
 *
 * <ConfidenceIndicatorDesktop
 *   state={state}
 *   size="md"
 *   showLabel
 * />
 * ```
 *
 * @see confidence-indicator.tsx
 * @see ConfidenceIndicatorDesktopExtended for extended variant
 */
const ConfidenceIndicatorDesktop = React.memo(function ConfidenceIndicatorDesktop({
  state,
  size,
  showLabel,
  className,
  id,
}: ConfidenceIndicatorPresenterProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Handle override - close tooltip after action
  const handleOverride = React.useCallback(() => {
    state.handleOverride();
    setIsOpen(false);
  }, [state]);

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen((prev) => !prev);
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-2',
              'focus-visible:outline-none',
              className
            )}
            onKeyDown={handleKeyDown}
          >
            <ConfidenceIndicatorBase
              id={id}
              state={state}
              size={size}
              interactive
              onClick={() => setIsOpen((prev) => !prev)}
            />
            {showLabel && (
              <ConfidenceLevelLabel
                state={state}
                size={size}
                showPercentage={state.showPercentage}
              />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="p-3"
          // Prevent tooltip from stealing focus when using keyboard
          onPointerDownOutside={(e) => {
            // Allow clicks on the override button
            const target = e.target as HTMLElement;
            if (target.closest('button')) {
              e.preventDefault();
            }
          }}
        >
          <ConfidenceTooltipCompact
            state={state}
            onOverride={state.canOverride ? handleOverride : undefined}
            onClose={() => setIsOpen(false)}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

ConfidenceIndicatorDesktop.displayName = 'ConfidenceIndicatorDesktop';

export { ConfidenceIndicatorDesktop };

/**
 * Desktop presenter with extended information display
 *
 * Shows more details inline without requiring hover interaction.
 * Useful in contexts where users need to see confidence info at a glance.
 */
export function ConfidenceIndicatorDesktopExtended({
  state,
  size,
  className,
  id,
}: Omit<ConfidenceIndicatorPresenterProps, 'showLabel'>) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            id={id}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-2 py-1',
              'hover:bg-muted/50 transition-colors',
              'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
              className
            )}
            tabIndex={0}
            role="button"
            aria-label={state.ariaLabel}
          >
            <ConfidenceIndicatorBase
              state={state}
              size={size}
            />
            <div className="flex flex-col">
              <ConfidenceLevelLabel
                state={state}
                size="sm"
                showPercentage={state.showPercentage}
              />
              {state.method && (
                <span className="text-muted-foreground max-w-[200px] truncate text-xs">
                  {state.method}
                </span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="p-3"
        >
          <ConfidenceTooltipCompact
            state={state}
            onOverride={state.canOverride ? state.handleOverride : undefined}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
