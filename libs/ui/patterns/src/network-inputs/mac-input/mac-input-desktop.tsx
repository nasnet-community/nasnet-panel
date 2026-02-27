/**
 * MACInputDesktop - Desktop Presenter for MAC Address Input
 *
 * Renders a single input field optimized for desktop with:
 * - Auto-formatting as user types
 * - Paste handling with multi-format support
 * - Vendor lookup display inline
 * - Visual validation feedback
 *
 * @module @nasnet/ui/patterns/network-inputs/mac-input
 */

import { memo, useCallback, useId } from 'react';

import { CheckCircle2, XCircle } from 'lucide-react';

import { Input, cn } from '@nasnet/ui/primitives';

import { useMACInput } from './use-mac-input';

import type { MACInputDesktopProps } from './mac-input.types';

/**
 * Get placeholder based on format.
 */
function getPlaceholder(format: 'colon' | 'dash' | 'dot'): string {
  switch (format) {
    case 'dash':
      return 'AA-BB-CC-DD-EE-FF';
    case 'dot':
      return 'AABB.CCDD.EEFF';
    case 'colon':
    default:
      return 'AA:BB:CC:DD:EE:FF';
  }
}

/**
 * Desktop presenter for MAC address input.
 * Renders a single input with auto-formatting and vendor lookup.
 */
export const MACInputDesktop = memo(function MACInputDesktop({
  value,
  onChange,
  format = 'colon',
  showVendor = false,
  disabled = false,
  error: externalError,
  label,
  placeholder,
  className,
  name,
  required = false,
  onBlur,
  onFocus,
  id: providedId,
  'aria-describedby': ariaDescribedBy,
}: MACInputDesktopProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;
  const labelId = label ? `${id}-label` : undefined;

  const {
    value: computedValue,
    isValid,
    error: validationError,
    vendor,
    handleChange,
  } = useMACInput({
    value,
    onChange,
    format,
    showVendor,
  });

  const error = externalError ?? validationError;
  const hasError = Boolean(error);
  const showValidIndicator = isValid && computedValue.length > 0;
  const displayPlaceholder = placeholder ?? getPlaceholder(format);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(e.target.value);
    },
    [handleChange]
  );

  // Handle paste - process full MAC from clipboard
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text');
      handleChange(text);
    },
    [handleChange]
  );

  // Build aria-describedby for input
  const inputAriaDescribedBy =
    [ariaDescribedBy, hasError ? errorId : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Label */}
      {label && (
        <label
          id={labelId}
          htmlFor={id}
          className="text-foreground text-sm font-medium"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2">
        {/* Hidden input for form submission */}
        {name && (
          <input
            type="hidden"
            name={name}
            value={computedValue}
          />
        )}

        {/* Main input */}
        <Input
          id={id}
          type="text"
          value={computedValue}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          placeholder={displayPlaceholder}
          maxLength={17} // XX:XX:XX:XX:XX:XX = 17 chars
          aria-label={label || 'MAC Address'}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={inputAriaDescribedBy}
          aria-labelledby={labelId}
          className={cn(
            'font-mono text-sm uppercase tracking-wider',
            'bg-card border-border text-foreground placeholder:text-muted-foreground border',
            'focus:border-primary focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-0',
            'transition-colors duration-150',
            hasError && 'border-error focus:border-error focus-visible:ring-error'
          )}
        />

        {/* Validation indicator */}
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
          {showValidIndicator && (
            <CheckCircle2
              className="text-success h-5 w-5"
              aria-hidden="true"
            />
          )}
          {hasError && computedValue && (
            <XCircle
              className="text-destructive h-5 w-5"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Vendor name (desktop: inline to the right) */}
        {showVendor && vendor && (
          <span className="text-muted-foreground whitespace-nowrap text-sm">{vendor}</span>
        )}
      </div>

      {/* Error message */}
      {hasError && computedValue && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-error text-xs"
        >
          {error}
        </p>
      )}
    </div>
  );
});

MACInputDesktop.displayName = 'MACInputDesktop';
