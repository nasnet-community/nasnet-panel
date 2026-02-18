/**
 * Verification Badge Mobile Presenter
 *
 * Mobile-optimized presenter with tap-to-reveal bottom sheet.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/verification-badge
 */

import * as React from 'react';

import { ShieldCheck, ShieldX, ShieldQuestion, Clock, RefreshCw, Copy, Check } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
 * Mobile Presenter for Verification Badge
 *
 * Features:
 * - Tap to show bottom sheet with full details
 * - 44px minimum touch target
 * - Full-width re-verify button
 * - Copy hash functionality
 */
export function VerificationBadgeMobile({
  state,
  size,
  showLabel: _showLabel, // Ignored on mobile - we show in sheet instead
  className,
  id,
}: VerificationBadgePresenterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Handle re-verification - close sheet after action
  const handleReverify = async () => {
    await state.handleReverify();
    setIsOpen(false);
  };

  // Copy hash to clipboard
  const handleCopyHash = async () => {
    if (state.fullHash) {
      await navigator.clipboard.writeText(state.fullHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const Icon = STATUS_ICONS[state.iconName];
  const sizeClasses = SIZE_CONFIG[size];

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
            // Semantic colors
            state.color === 'success' && 'bg-success/10 text-success',
            state.color === 'destructive' && 'bg-destructive/10 text-destructive',
            state.color === 'warning' && 'bg-warning/10 text-warning',
            state.color === 'muted' && 'bg-muted text-muted-foreground',
            className
          )}
          aria-label={state.ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <Icon className={sizeClasses.icon} />
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <span>Binary Verification</span>
          </SheetTitle>
          <SheetDescription>{state.statusLabel}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Timestamp */}
          {state.timestamp && state.showTimestamp && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Last Verified
              </div>
              <div className="text-sm">{state.timestamp}</div>
            </div>
          )}

          {/* Hash Display */}
          {state.fullHash && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                Binary Hash (SHA256)
              </div>
              <div className="relative">
                <div className="text-xs font-mono bg-muted/50 p-3 rounded break-all pr-12">
                  {state.fullHash}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-8 w-8 p-0"
                  onClick={handleCopyHash}
                  aria-label="Copy hash"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {state.errorMessage && (
            <div className="space-y-1">
              <div className="text-sm font-medium text-destructive">Error</div>
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {state.errorMessage}
              </div>
            </div>
          )}

          {/* Status Info */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Binary verification ensures that the service instance binary has not been
              tampered with and matches the expected checksum.
            </p>
            {state.status === 'verified' && (
              <p className="text-success">
                ✓ This binary has passed verification and is safe to run.
              </p>
            )}
            {state.status === 'failed' && (
              <p className="text-destructive">
                ✗ This binary failed verification. Do not run it.
              </p>
            )}
          </div>

          {/* Re-verify Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleReverify}
            disabled={state.isReverifying}
            className="w-full min-h-[44px]"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', state.isReverifying && 'animate-spin')} />
            {state.isReverifying ? 'Verifying...' : 'Re-verify Binary'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
