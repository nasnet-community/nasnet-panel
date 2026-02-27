/**
 * MACInputMobile - Mobile Presenter for MAC Address Input
 *
 * Renders a single input field optimized for mobile with:
 * - 44px minimum height for touch targets (WCAG 2.5.5)
 * - Full-width layout
 * - Vendor lookup displayed below input
 * - Visual validation feedback
 *
 * @module @nasnet/ui/patterns/network-inputs/mac-input
 */

import { memo, useCallback, useId } from 'react';

import { CheckCircle2, XCircle } from 'lucide-react';

import { Input, Badge, cn } from '@nasnet/ui/primitives';

import { useMACInput } from './use-mac-input';

import type { MACInputMobileProps } from './mac-input.types';

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
 * Mobile presenter for MAC address input.
 * Renders a full-width input with touch-optimized sizing.
 */
export const MACInputMobile = memo(function MACInputMobile({
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
}: MACInputMobileProps) {
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
    <div className={cn('flex w-full flex-col gap-2', className)}>
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

      {/* Input with validation indicator */}
      <div className="relative w-full">
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
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={computedValue}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          placeholder={displayPlaceholder}
          maxLength={17}
          aria-label={label || 'MAC Address'}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={inputAriaDescribedBy}
          aria-labelledby={labelId}
          className={cn(
            // 44px minimum height for touch targets (WCAG 2.5.5)
            'h-11 min-h-[44px] w-full pr-10 font-mono text-base uppercase tracking-wider',
            'bg-card border-border text-foreground placeholder:text-muted-foreground border',
            'focus:border-primary focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-0',
            'transition-colors duration-150',
            hasError && 'border-error focus:border-error focus-visible:ring-error'
          )}
        />

        {/* Validation indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
      </div>

      {/* Vendor badge and error in a row (mobile: below input) */}
      <div className="flex min-h-[20px] items-center justify-between gap-2">
        {/* Vendor badge */}
        {showVendor && vendor && (
          <Badge
            variant="secondary"
            className="text-xs font-normal"
          >
            {vendor}
          </Badge>
        )}

        {/* Spacer when no vendor but has error */}
        {(!showVendor || !vendor) && hasError && <div />}

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
    </div>
  );
});

MACInputMobile.displayName = 'MACInputMobile';
