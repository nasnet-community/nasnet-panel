/**
 * IPInputDesktop - Desktop Presenter for IP Address Input
 *
 * Renders a 4-segment input for IPv4 (or 8 for IPv6) with:
 * - Dot/colon separators between segments
 * - Auto-advance on separator or full segment
 * - Visual validation feedback (checkmark/error)
 * - IP type badge display
 * - CIDR suffix segment (optional)
 *
 * @module @nasnet/ui/patterns/network-inputs/ip-input
 */

import { memo, useCallback, useId } from 'react';

import { CheckCircle2, XCircle } from 'lucide-react';

import { Input, cn, Badge } from '@nasnet/ui/primitives';

import { useIPInput, getIPTypeLabel } from './use-ip-input';

import type { IPInputDesktopProps } from './ip-input.types';

/**
 * Desktop presenter for IP address input.
 * Renders 4-segment input with auto-advance and visual feedback.
 */
export const IPInputDesktop = memo(function IPInputDesktop({
  value,
  onChange,
  version = 'v4',
  showType = false,
  allowCIDR = false,
  disabled = false,
  error: externalError,
  placeholder,
  className,
  name,
  required = false,
  onBlur,
  onFocus,
  id: providedId,
  'aria-describedby': ariaDescribedBy,
}: IPInputDesktopProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const errorId = `${id}-error`;

  const {
    segments,
    isValid,
    error: validationError,
    ipType,
    cidrPrefix,
    segmentRefs,
    cidrRef,
    handleSegmentChange,
    handleKeyDown,
    handleCidrKeyDown,
    handlePaste,
    setCidrPrefix,
    segmentCount,
    separator,
    maxSegmentLength,
  } = useIPInput({
    value,
    onChange,
    version,
    allowCIDR,
  });

  const error = externalError ?? validationError;
  const hasError = Boolean(error);
  const showValidIndicator = isValid && segments.every((s) => s !== '');

  // Handle paste on any segment
  const handleSegmentPaste = useCallback(
    (index: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData('text');
      // If it looks like an IP address, use full parse
      if (text.includes('.') || text.includes(':')) {
        e.preventDefault();
        handlePaste(text, index);
      }
      // Otherwise let default paste behavior work
    },
    [handlePaste]
  );

  // Build aria-describedby for inputs
  const inputAriaDescribedBy = [
    ariaDescribedBy,
    hasError ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={cn('inline-flex flex-col gap-1.5', className)}>
      {/* Input row */}
      <div className="inline-flex items-center gap-0.5">
        {/* Hidden input for form submission */}
        {name && (
          <input
            type="hidden"
            name={name}
            value={segments.join(separator) + (allowCIDR && cidrPrefix ? `/${cidrPrefix}` : '')}
          />
        )}

        {/* Segment inputs */}
        {segments.map((segment, index) => (
          <div key={index} className="inline-flex items-center">
            <Input
              ref={segmentRefs[index] as React.Ref<HTMLInputElement>}
              type="text"
              inputMode="numeric"
              value={segment}
              onChange={(e) => handleSegmentChange(index, e.target.value, e.target.selectionStart ?? undefined)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handleSegmentPaste(index)}
              onBlur={onBlur}
              onFocus={onFocus}
              disabled={disabled}
              required={required && index === 0}
              placeholder={placeholder ? (index === 0 ? placeholder.split('.')[0] || '0' : '0') : '0'}
              maxLength={maxSegmentLength}
              aria-label={`IP address ${version === 'v6' ? 'hextet' : 'octet'} ${index + 1} of ${segmentCount}`}
              aria-invalid={hasError ? 'true' : undefined}
              aria-describedby={index === 0 ? inputAriaDescribedBy : undefined}
              className={cn(
                'w-12 text-center px-1 font-mono text-sm',
                'bg-card border border-border text-foreground placeholder:text-muted-foreground',
                'focus:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
                'transition-colors duration-150',
                hasError && 'border-error focus:border-error focus-visible:ring-error'
              )}
              id={index === 0 ? id : undefined}
            />
            {/* Separator (dot or colon) */}
            {index < segmentCount - 1 && (
              <span
                className="mx-0.5 text-muted-foreground font-mono select-none"
                aria-hidden="true"
              >
                {separator}
              </span>
            )}
          </div>
        ))}

        {/* CIDR prefix input */}
        {allowCIDR && (
          <>
            <span
              className="mx-0.5 text-muted-foreground font-mono select-none"
              aria-hidden="true"
            >
              /
            </span>
            <Input
              ref={cidrRef as React.Ref<HTMLInputElement>}
              type="text"
              inputMode="numeric"
              value={cidrPrefix}
              onChange={(e) => setCidrPrefix(e.target.value)}
              onKeyDown={handleCidrKeyDown}
              onBlur={onBlur}
              onFocus={onFocus}
              disabled={disabled}
              placeholder={version === 'v6' ? '128' : '24'}
              maxLength={3}
              aria-label={`CIDR prefix length (0-${version === 'v6' ? '128' : '32'})`}
              aria-invalid={hasError ? 'true' : undefined}
              className={cn(
                'w-10 text-center px-1 font-mono text-sm',
                'bg-card border border-border text-foreground placeholder:text-muted-foreground',
                'focus:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
                'transition-colors duration-150',
                hasError && 'border-error focus:border-error focus-visible:ring-error'
              )}
            />
          </>
        )}

        {/* Validation indicator */}
        <div className="ml-2 w-5 h-5 flex items-center justify-center">
          {showValidIndicator && (
            <CheckCircle2
              className="w-5 h-5 text-success"
              aria-hidden="true"
            />
          )}
          {hasError && (
            <XCircle
              className="w-5 h-5 text-destructive"
              aria-hidden="true"
            />
          )}
        </div>

        {/* IP Type badge */}
        {showType && ipType && (
          <Badge
            variant="secondary"
            className="ml-2 text-xs font-normal"
          >
            {getIPTypeLabel(ipType)}
          </Badge>
        )}
      </div>

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
  );
});

IPInputDesktop.displayName = 'IPInputDesktop';
