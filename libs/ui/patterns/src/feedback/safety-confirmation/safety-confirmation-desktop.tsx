/**
 * SafetyConfirmationDesktop Component
 *
 * Desktop presenter for safety confirmation using centered modal dialog.
 * Implements full keyboard navigation with focus trap.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 * @see ADR-018: Headless + Platform Presenters
 */

import { Loader2 } from 'lucide-react';

import {
  cn,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nasnet/ui/primitives';

import { SafetyConfirmationConsequences } from './safety-confirmation-consequences';
import { SafetyConfirmationCountdown } from './safety-confirmation-countdown';
import { SafetyConfirmationHeader } from './safety-confirmation-header';
import { SafetyConfirmationInput } from './safety-confirmation-input';

import type { SafetyConfirmationPresenterProps } from './safety-confirmation.types';

/**
 * Desktop presenter for SafetyConfirmation
 *
 * Uses the Dialog primitive for a centered modal experience.
 * Implements full keyboard navigation:
 * - Tab cycles through interactive elements
 * - Escape cancels and closes (via Dialog primitive)
 * - Enter activates focused button
 * - Focus is trapped within the dialog (via Radix)
 *
 * Accessibility features:
 * - aria-labelledby on dialog pointing to title
 * - aria-describedby pointing to description/consequences
 * - Focus management via Radix Dialog
 * - Proper ARIA roles for all interactive elements
 *
 * @example
 * ```tsx
 * <SafetyConfirmationDesktop
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
export function SafetyConfirmationDesktop({
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

  // Handle dialog close - always cancel the operation
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
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        className={cn(
          'sm:max-w-md',
          'bg-card border-border rounded-[var(--semantic-radius-card)] border',
          'p-6'
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
        aria-labelledby="safety-dialog-title"
        aria-describedby="safety-dialog-description"
      >
        <DialogHeader>
          {/* Custom header with warning styling */}
          <SafetyConfirmationHeader title={title} />

          <DialogTitle
            id="safety-dialog-title"
            className="sr-only"
          >
            {title}
          </DialogTitle>

          <DialogDescription
            id="safety-dialog-description"
            className="text-muted-foreground pt-2 text-sm"
          >
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Consequences list */}
          <SafetyConfirmationConsequences consequences={consequences} />

          {/* Type-to-confirm input */}
          <SafetyConfirmationInput
            typedText={typedText}
            onTypedTextChange={setTypedText}
            confirmText={confirmText}
            isValid={isConfirmTextValid}
            isCountingDown={isCountingDown}
          />

          {/* Countdown timer */}
          {isConfirmTextValid && (
            <SafetyConfirmationCountdown
              isCountingDown={isCountingDown}
              progress={countdownProgress}
              formattedTime={formattedTime}
              urgencyLevel={urgencyLevel}
            />
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              cancel();
              onOpenChange(false);
            }}
            disabled={isProcessing}
            className="w-full sm:w-auto"
            aria-label="Cancel operation"
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm || isProcessing}
            className="bg-error hover:bg-error/90 w-full sm:w-auto"
            aria-label={isProcessing ? 'Processing confirmation' : `Confirm ${title}`}
          >
            {isProcessing ?
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  role="status"
                  aria-label="Processing"
                />
                Processing...
              </>
            : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
