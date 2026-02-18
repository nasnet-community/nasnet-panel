/**
 * Confidence Indicator Mobile Presenter
 *
 * Mobile-optimized presenter with tap-to-reveal bottom sheet.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/confidence-indicator
 * @see NAS-4A.10: Build Confidence Indicator Component
 */

import * as React from 'react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  cn,
} from '@nasnet/ui/primitives';

import {
  ConfidenceIndicatorBase,
  ConfidenceIndicatorDot,
} from './confidence-indicator-base';
import { ConfidenceTooltipFull } from './confidence-tooltip';

import type { ConfidenceIndicatorPresenterProps } from './confidence-indicator.types';

/**
 * Mobile Presenter for Confidence Indicator
 *
 * Features:
 * - Simple colored dot/icon indicator
 * - Tap to show bottom sheet with full details
 * - 44px minimum touch target
 * - Full override functionality in sheet
 *
 * @example
 * ```tsx
 * const state = useConfidenceIndicator({ confidence: 75, method: 'Inferred from DHCP' });
 *
 * <ConfidenceIndicatorMobile
 *   state={state}
 *   size="md"
 * />
 * ```
 */
export function ConfidenceIndicatorMobile({
  state,
  size,
  showLabel: _showLabel, // Ignored on mobile - we show in sheet instead
  className,
  id,
}: ConfidenceIndicatorPresenterProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Handle override - close sheet after action
  const handleOverride = () => {
    state.handleOverride();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            // Touch target: minimum 44px
            'min-h-[44px] min-w-[44px]',
            'inline-flex items-center justify-center',
            'rounded-full p-2',
            'transition-colors active:opacity-80',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
          aria-label={state.ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <ConfidenceIndicatorBase
            state={state}
            size={size}
            animateOnMount
          />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <ConfidenceIndicatorBase state={state} size="sm" />
            <span>Detection Confidence</span>
          </SheetTitle>
          <SheetDescription>
            {state.showPercentage
              ? `${state.levelLabel} (${state.percentage}%)`
              : state.levelLabel}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <ConfidenceTooltipFull
            state={state}
            onOverride={state.canOverride ? handleOverride : undefined}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Compact mobile variant - just shows dot
 *
 * For very space-constrained mobile contexts where even
 * the icon is too large. Shows only a colored dot.
 */
export function ConfidenceIndicatorMobileCompact({
  state,
  className,
  id,
}: Omit<ConfidenceIndicatorPresenterProps, 'size' | 'showLabel'>) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleOverride = () => {
    state.handleOverride();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            // Touch target: minimum 44px, but visually smaller
            'min-h-[44px] min-w-[44px]',
            'inline-flex items-center justify-center',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
          )}
          aria-label={state.ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <ConfidenceIndicatorDot level={state.level} size="md" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <ConfidenceIndicatorBase state={state} size="sm" />
            <span>Detection Confidence</span>
          </SheetTitle>
          <SheetDescription>
            {state.showPercentage
              ? `${state.levelLabel} (${state.percentage}%)`
              : state.levelLabel}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <ConfidenceTooltipFull
            state={state}
            onOverride={state.canOverride ? handleOverride : undefined}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
