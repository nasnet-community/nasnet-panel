/**
 * SafetyConfirmationMobile Component
 *
 * Mobile presenter for safety confirmation using bottom sheet pattern.
 * Optimized for touch interactions with 44px minimum touch targets.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 * @see ADR-018: Headless + Platform Presenters
 */

import { Loader2 } from 'lucide-react';

import {
  cn,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@nasnet/ui/primitives';

import { SafetyConfirmationConsequences } from './safety-confirmation-consequences';
import { SafetyConfirmationCountdown } from './safety-confirmation-countdown';
import { SafetyConfirmationHeader } from './safety-confirmation-header';
import { SafetyConfirmationInput } from './safety-confirmation-input';

import type { SafetyConfirmationPresenterProps } from './safety-confirmation.types';

/**
 * Mobile presenter for SafetyConfirmation
 *
 * Uses the Sheet primitive with side="bottom" for a bottom sheet experience.
 * Optimized for touch devices:
 * - 44px minimum touch targets for buttons
 * - Larger typography for readability
 * - Full-width buttons
 * - Swipe down to dismiss (cancels operation)
 *
 * Accessibility features:
 * - aria-labelledby on sheet pointing to title
 * - aria-describedby pointing to description/consequences
 * - Touch-optimized input with larger touch area
 * - Proper ARIA roles for all interactive elements
 *
 * @example
 * ```tsx
 * <SafetyConfirmationMobile
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Factory Reset"
 *   description="This will restore all settings to factory defaults."
 *   consequences={["All config lost", "Router reboots"]}
 *   confirmText="RESET"
 *   hook={hook}
 *   onConfirm={handleConfirm}
 * />
 * ```
 */
export function SafetyConfirmationMobile({
  open,
  onOpenChange,
  title,
  description,
  consequences,
  confirmText,
  hook,
}: SafetyConfirmationPresenterProps) {
  const {
    typedText,
    setTypedText,
    isConfirmTextValid,
    isCountingDown,
    countdownProgress,
    formattedTime,
    urgencyLevel,
    canConfirm,
    isProcessing,
    confirm,
    cancel,
  } = hook;

  // Handle sheet close - always cancel the operation
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isProcessing) {
      cancel();
    }
    onOpenChange(newOpen);
  };

  // Handle confirm button click
  const handleConfirm = async () => {
    try {
      await confirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling would be done by the caller's onConfirm
      console.error('Confirmation failed:', error);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
    >
      <SheetContent
        side="bottom"
        className={cn(
          'border-border rounded-t-[var(--semantic-radius-card)] border-t',
          'bg-card',
          'max-h-[85vh] overflow-y-auto',
          'pb-safe' // Safe area for notched devices
        )}
        onPointerDownOutside={(e) => {
          // Prevent closing on outside click during processing
          if (isProcessing) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape during processing
          if (isProcessing) {
            e.preventDefault();
          }
        }}
        aria-labelledby="safety-sheet-title"
        aria-describedby="safety-sheet-description"
      >
        {/* Pull indicator for swipe gesture hint */}
        <div className="bg-muted mx-auto mb-4 h-1.5 w-12 rounded-full" />

        <SheetHeader className="space-y-3">
          {/* Custom header with warning styling */}
          <SafetyConfirmationHeader title={title} />

          <SheetTitle
            id="safety-sheet-title"
            className="sr-only"
          >
            {title}
          </SheetTitle>

          <SheetDescription
            id="safety-sheet-description"
            className="text-muted-foreground text-base"
          >
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Consequences list */}
          <SafetyConfirmationConsequences consequences={consequences} />

          {/* Type-to-confirm input - larger for touch */}
          <div className="space-y-2">
            <SafetyConfirmationInput
              typedText={typedText}
              onTypedTextChange={setTypedText}
              confirmText={confirmText}
              isValid={isConfirmTextValid}
              isCountingDown={isCountingDown}
              className="[&_input]:min-h-[48px] [&_input]:text-lg"
            />
          </div>

          {/* Countdown timer */}
          {isConfirmTextValid && (
            <SafetyConfirmationCountdown
              isCountingDown={isCountingDown}
              progress={countdownProgress}
              formattedTime={formattedTime}
              urgencyLevel={urgencyLevel}
              className="[&_.text-3xl]:text-4xl"
            />
          )}
        </div>

        <SheetFooter className="flex flex-col-reverse gap-3 pt-2 sm:flex-row-reverse">
          {/* Confirm button first (primary action at bottom on mobile) */}
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm || isProcessing}
            className="bg-error hover:bg-error/90 h-12 w-full text-base"
            aria-label={isProcessing ? 'Processing confirmation' : `Confirm ${title}`}
          >
            {isProcessing ?
              <>
                <Loader2
                  className="mr-2 h-5 w-5 animate-spin"
                  role="status"
                  aria-label="Processing"
                />
                Processing...
              </>
            : 'Confirm'}
          </Button>

          {/* Cancel button */}
          <Button
            variant="secondary"
            onClick={() => {
              cancel();
              onOpenChange(false);
            }}
            disabled={isProcessing}
            className="h-12 w-full text-base"
            aria-label="Cancel operation"
          >
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
