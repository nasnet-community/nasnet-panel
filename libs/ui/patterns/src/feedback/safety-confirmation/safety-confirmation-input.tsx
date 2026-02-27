/**
 * SafetyConfirmationInput Component
 *
 * Type-to-confirm input field with real-time validation feedback.
 * Shows visual indicator for match status (check when valid, X when invalid).
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 */

import { Check, X } from 'lucide-react';

import { cn, Input, Label } from '@nasnet/ui/primitives';

import type { SafetyConfirmationInputProps } from './safety-confirmation.types';

/**
 * Type-to-confirm input component for safety confirmation dialogs
 *
 * Features:
 * - Real-time validation indicator (check/X icon)
 * - Helper text showing required text
 * - Visual feedback for valid/invalid state
 * - Disabled when countdown is running
 * - Accessible with proper labels
 *
 * @example
 * ```tsx
 * <SafetyConfirmationInput
 *   typedText={hook.typedText}
 *   onTypedTextChange={hook.setTypedText}
 *   confirmText="RESET"
 *   isValid={hook.isConfirmTextValid}
 *   isCountingDown={hook.isCountingDown}
 * />
 * ```
 */
export function SafetyConfirmationInput({
  typedText,
  onTypedTextChange,
  confirmText,
  isValid,
  isCountingDown,
  className,
}: SafetyConfirmationInputProps) {
  const hasInput = typedText.length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor="safety-confirm-input"
        className="text-foreground text-sm font-medium"
      >
        Type <span className="text-destructive font-mono font-bold">{confirmText}</span> to confirm
      </Label>

      <div className="relative">
        <Input
          id="safety-confirm-input"
          type="text"
          value={typedText}
          onChange={(e) => onTypedTextChange(e.target.value)}
          disabled={isCountingDown}
          placeholder={confirmText}
          className={cn(
            'h-10 rounded-[var(--semantic-radius-input)] pr-10 font-mono',
            hasInput && isValid && 'border-success focus-visible:ring-success',
            hasInput && !isValid && 'border-error focus-visible:ring-error'
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          aria-describedby="safety-confirm-helper"
          aria-invalid={hasInput && !isValid}
        />

        {/* Validation indicator */}
        {hasInput && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            {isValid ?
              <Check
                className="text-success h-5 w-5"
                aria-label="Input matches"
              />
            : <X
                className="text-error h-5 w-5"
                aria-label="Input does not match"
              />
            }
          </div>
        )}
      </div>

      <p
        id="safety-confirm-helper"
        className="text-muted-foreground text-xs"
        aria-live="polite"
      >
        {isValid ?
          'Text matches. Countdown starting...'
        : `Enter the exact text "${confirmText}" to proceed`}
      </p>
    </div>
  );
}
