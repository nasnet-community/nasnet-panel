/**
 * Confidence Tooltip Component
 *
 * Displays detection details, confidence percentage, and override action.
 * Used in both Tooltip (desktop) and Sheet (mobile) contexts.
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */

import * as React from 'react';

import { Pencil, Info } from 'lucide-react';

import { Button, cn } from '@nasnet/ui/primitives';

import {
  ConfidenceIndicatorBase,
  ConfidenceLevelLabel,
} from './confidence-indicator-base';

import type { UseConfidenceIndicatorReturn } from './confidence-indicator.types';

export interface ConfidenceTooltipContentProps {
  /**
   * Computed state from the headless hook
   */
  state: UseConfidenceIndicatorReturn;

  /**
   * Callback when user clicks override/edit
   */
  onOverride?: () => void;

  /**
   * Callback to close the tooltip/sheet
   */
  onClose?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether this is in a compact context (tooltip vs sheet)
   */
  compact?: boolean;
}

/**
 * Confidence level explanations for user education
 */
const LEVEL_EXPLANATIONS = {
  high: 'The system is highly confident this value is correct. You can proceed with this setting.',
  medium: 'The system has moderate confidence. Consider reviewing before proceeding.',
  low: 'The system has low confidence in this value. Manual verification is recommended.',
} as const;

/**
 * Confidence Tooltip Content Component
 *
 * Renders the content shown inside tooltips and sheets.
 * Displays detection method, percentage, and override option.
 *
 * @example
 * ```tsx
 * <TooltipContent>
 *   <ConfidenceTooltipContent
 *     state={state}
 *     onOverride={() => {
 *       state.handleOverride();
 *       closeTooltip();
 *     }}
 *   />
 * </TooltipContent>
 * ```
 */
export function ConfidenceTooltipContent({
  state,
  onOverride,
  onClose,
  className,
  compact = false,
}: ConfidenceTooltipContentProps) {
  const handleOverride = () => {
    if (onOverride) {
      onOverride();
    } else {
      state.handleOverride();
    }
    onClose?.();
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header with indicator and level */}
      <div className="flex items-center gap-2">
        <ConfidenceIndicatorBase state={state} size="sm" />
        <ConfidenceLevelLabel state={state} size="sm" showPercentage />
      </div>

      {/* Detection method */}
      {state.method && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{state.method}</span>
        </div>
      )}

      {/* Explanation (only in non-compact mode) */}
      {!compact && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {LEVEL_EXPLANATIONS[state.level]}
        </p>
      )}

      {/* Override action */}
      {state.canOverride && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleOverride}
          className="w-full justify-start gap-2"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit manually
        </Button>
      )}
    </div>
  );
}

/**
 * Compact version for tooltips (desktop hover)
 */
export function ConfidenceTooltipCompact({
  state,
  onOverride,
  onClose,
}: Omit<ConfidenceTooltipContentProps, 'compact' | 'className'>) {
  return (
    <ConfidenceTooltipContent
      state={state}
      onOverride={onOverride}
      onClose={onClose}
      compact
      className="min-w-[200px] max-w-[280px]"
    />
  );
}

/**
 * Full version for sheets/popovers (mobile tap)
 */
export function ConfidenceTooltipFull({
  state,
  onOverride,
  onClose,
}: Omit<ConfidenceTooltipContentProps, 'compact' | 'className'>) {
  return (
    <ConfidenceTooltipContent
      state={state}
      onOverride={onOverride}
      onClose={onClose}
      compact={false}
      className="p-1"
    />
  );
}
