/**
 * IPInputMobile - Mobile Presenter for IP Address Input
 *
 * Renders a single input field optimized for mobile:
 * - Smart parsing on input change
 * - 44px minimum height for touch targets (WCAG 2.5.5)
 * - inputMode="decimal" for numeric keyboard with decimal point
 * - IP type badge below input
 * - Error message display
 *
 * @module @nasnet/ui/patterns/network-inputs/ip-input
 */

import { memo, useCallback, useId, useState } from 'react';

import { CheckCircle2, XCircle } from 'lucide-react';

import { Input, cn, Badge } from '@nasnet/ui/primitives';

import { useIPInput, getIPTypeLabel, isValidIPv4 } from './use-ip-input';

import type { IPInputMobileProps } from './ip-input.types';

/**
 * Mobile presenter for IP address input.
 * Renders a single input with smart parsing and touch-optimized sizing.
 */
export const IPInputMobile = memo(function IPInputMobile({
  value,
  onChange,
  version = 'v4',
  showType = false,
  allowCIDR = false,
  disabled = false,
  error: externalError,
  placeholder = '192.168.1.1',
  className,
  name,
  required = false,
  onBlur,
  onFocus,
  id: providedId,
  'aria-describedby': ariaDescribedBy,
}: IPInputMobileProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;

  const {
    value: computedValue,
    isValid,
    error: validationError,
    ipType,
    setValue,
  } = useIPInput({
    value,
    onChange,
    version,
    allowCIDR,
  });

  // Track local input value for controlled input
  const [localValue, setLocalValue] = useState(computedValue);

  // Sync local value when external value changes
  useState(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  });

  const error = externalError ?? validationError;
  const hasError = Boolean(error);
  const displayValue = value ?? localValue;
  const showValidIndicator = isValid && displayValue.length > 0 && isValidIPv4(displayValue.split('/')[0]);

  // Handle input change with smart parsing
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // Allow numbers, dots, colons (for IPv6), and slash (for CIDR)
      if (version === 'v6') {
        newValue = newValue.replace(/[^0-9a-fA-F:/]/g, '');
      } else {
        // IPv4: allow digits, dots, and slash
        newValue = newValue.replace(/[^0-9./]/g, '');
      }

      // Prevent consecutive separators
      newValue = newValue.replace(/\.{2,}/g, '.').replace(/:{2,}/g, ':');

      // Prevent leading separator
      if (newValue.startsWith('.') || newValue.startsWith(':')) {
        newValue = newValue.slice(1);
      }

      setLocalValue(newValue);
      setValue(newValue);
    },
    [version, setValue]
  );

  // Build aria-describedby
  const inputAriaDescribedBy = [
    ariaDescribedBy,
    hasError ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Input with validation indicator */}
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          name={name}
          placeholder={placeholder + (allowCIDR ? '/24' : '')}
          aria-label={`IP address${allowCIDR ? ' with CIDR notation' : ''}`}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={inputAriaDescribedBy}
          className={cn(
            // 44px minimum height for touch targets (WCAG 2.5.5)
            'h-11 min-h-[44px] text-base font-mono pr-10 w-full',
            'bg-card border border-border text-foreground placeholder:text-muted-foreground',
            'focus:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
            'transition-colors duration-150',
            hasError && 'border-error focus:border-error focus-visible:ring-error'
          )}
        />

        {/* Validation indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {showValidIndicator && (
            <CheckCircle2
              className="w-5 h-5 text-success"
              aria-hidden="true"
            />
          )}
          {hasError && displayValue && (
            <XCircle
              className="w-5 h-5 text-destructive"
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* IP Type badge and error in a row */}
      <div className="flex items-center justify-between gap-2 min-h-[20px]">
        {/* IP Type badge */}
        {showType && ipType && (
          <Badge
            variant="secondary"
            className="text-xs font-normal"
          >
            {getIPTypeLabel(ipType)}
          </Badge>
        )}

        {/* Error message */}
        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-error"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
});

IPInputMobile.displayName = 'IPInputMobile';
