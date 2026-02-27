/**
 * Verification Badge Desktop Presenter
 *
 * Desktop-optimized presenter with hover tooltips.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/verification-badge
 */

import * as React from 'react';

import { ShieldCheck, ShieldX, ShieldQuestion, Clock, RefreshCw } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
  cn,
} from '@nasnet/ui/primitives';

import type { VerificationBadgePresenterProps } from './verification-badge.types';

/**
 * Icon mapping for verification statuses
 */
const STATUS_ICONS = {
  ShieldCheck,
  ShieldX,
  ShieldQuestion,
  Clock,
} as const;

/**
 * Size configuration
 */
const SIZE_CONFIG = {
  sm: { container: 'h-5 w-5', icon: 'h-3 w-3' },
  md: { container: 'h-6 w-6', icon: 'h-4 w-4' },
  lg: { container: 'h-8 w-8', icon: 'h-5 w-5' },
} as const;

/**
 * Desktop Presenter for Verification Badge
 *
 * Features:
 * - Hover to show tooltip with details
 * - Hash display and re-verify button
 * - Keyboard accessible
 * - WCAG AAA compliant
 */
const VerificationBadgeDesktopComponent = React.forwardRef<
  HTMLDivElement,
  VerificationBadgePresenterProps
>(({ state, size, showLabel, className, id }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Handle re-verification - close tooltip after action
  const handleReverify = React.useCallback(async () => {
    await state.handleReverify();
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

  const Icon = STATUS_ICONS[state.iconName];
  const sizeClasses = SIZE_CONFIG[size];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <TooltipTrigger asChild>
          <div
            ref={ref}
            className={cn(
              'inline-flex items-center gap-2',
              'focus-visible:outline-none',
              className
            )}
            onKeyDown={handleKeyDown}
          >
            {/* Badge Icon */}
            <div
              id={id}
              className={cn(
                sizeClasses.container,
                'inline-flex items-center justify-center rounded-full',
                'cursor-pointer transition-colors',
                'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2',
                // Semantic colors
                state.color === 'success' && 'bg-success/10 text-success hover:bg-success/20',
                state.color === 'destructive' &&
                  'bg-destructive/10 text-destructive hover:bg-destructive/20',
                state.color === 'warning' && 'bg-warning/10 text-warning hover:bg-warning/20',
                state.color === 'muted' && 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
              onClick={() => setIsOpen(!isOpen)}
              role="button"
              tabIndex={0}
              aria-label={state.ariaLabel}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
            >
              <Icon className={sizeClasses.icon} />
            </div>

            {/* Optional inline label */}
            {showLabel && <span className="text-sm font-medium">{state.statusLabel}</span>}
          </div>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          align="center"
          className="max-w-sm p-4"
          onPointerDownOutside={(e) => {
            // Allow clicks on the re-verify button
            const target = e.target as HTMLElement;
            if (target.closest('button')) {
              e.preventDefault();
            }
          }}
        >
          <div className="space-y-3">
            {/* Status Header */}
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="font-semibold">{state.statusLabel}</span>
            </div>

            {/* Timestamp */}
            {state.timestamp && state.showTimestamp && (
              <div className="text-muted-foreground text-xs">{state.timestamp}</div>
            )}

            {/* Hash Display */}
            {state.fullHash && (
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs font-medium">
                  Binary Hash (SHA256)
                </div>
                <div className="bg-muted/50 break-all rounded p-2 font-mono text-xs">
                  {state.fullHash}
                </div>
              </div>
            )}

            {/* Error Message */}
            {state.errorMessage && (
              <div className="text-destructive bg-destructive/10 rounded p-2 text-xs">
                {state.errorMessage}
              </div>
            )}

            {/* Re-verify Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReverify}
              disabled={state.isReverifying}
              className="w-full"
            >
              <RefreshCw className={cn('mr-2 h-3 w-3', state.isReverifying && 'animate-spin')} />
              {state.isReverifying ? 'Verifying...' : 'Re-verify'}
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

VerificationBadgeDesktopComponent.displayName = 'VerificationBadgeDesktop';

export const VerificationBadgeDesktop = React.memo(VerificationBadgeDesktopComponent);
