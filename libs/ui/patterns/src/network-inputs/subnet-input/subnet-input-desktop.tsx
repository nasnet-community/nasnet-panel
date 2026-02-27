/**
 * SubnetInputDesktop Component
 * Desktop presenter for the subnet/CIDR input
 *
 * Features:
 * - IP input + prefix selector inline
 * - Calculations panel visible by default
 * - Overlap warning as badge
 * - Full keyboard navigation
 *
 * @see ADR-018: Headless + Platform Presenters
 */

import { memo } from 'react';
import * as React from 'react';

import { cn, Input, Label } from '@nasnet/ui/primitives';

import { OverlapWarning } from './overlap-warning';
import { PrefixSelector } from './prefix-selector';
import { SubnetCalculations } from './subnet-calculations';

import type { SubnetInputPresenterProps } from './subnet-input.types';

/**
 * Desktop presenter for SubnetInput
 * Shows IP input, prefix selector, and calculations panel inline
 */
export const SubnetInputDesktop = memo(function SubnetInputDesktop({
  state,
  label,
  helpText,
  disabled = false,
  required = false,
  placeholder = '192.168.1.0',
  id,
  name,
  className,
  onBlur,
  showCalculations = true,
}: SubnetInputPresenterProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  // Handle IP input change - moved outside render function
  const handleIPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    state.setIP(e.target.value);
  };

  // Handle prefix change - moved outside render function
  const handlePrefixChange = (prefix: number) => {
    state.setPrefix(prefix);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <Label
          htmlFor={inputId}
          className="text-sm font-medium"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      {/* Input row: IP + slash + prefix (inline, desktop style) */}
      <div className="flex items-center gap-1">
        {/* IP Address Input */}
        <Input
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          value={state.ipPart}
          onChange={handleIPChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!state.error}
          aria-describedby={cn(state.error && errorId, helpText && helpId)}
          className={cn(
            'h-10 flex-1 font-mono',
            state.error && 'border-error focus-visible:ring-error'
          )}
        />

        {/* Slash Separator */}
        <span className="text-muted-foreground font-mono text-sm">/</span>

        {/* Prefix Input (compact, right-aligned) */}
        <Input
          type="text"
          inputMode="numeric"
          value={state.prefixPart}
          onChange={(e) => handlePrefixChange(parseInt(e.target.value) || 0)}
          disabled={disabled}
          aria-label="CIDR prefix length"
          placeholder="24"
          className={cn(
            'h-10 w-16 text-center font-mono',
            state.error && 'border-error focus-visible:ring-error'
          )}
        />

        {/* Overlap Warning Badge */}
        {state.overlap && (
          <OverlapWarning
            overlap={state.overlap}
            className="shrink-0"
          />
        )}
      </div>

      {/* Error message */}
      {state.error && (
        <p
          id={errorId}
          role="alert"
          className="text-error text-sm"
        >
          {state.error}
        </p>
      )}

      {/* Help text */}
      {helpText && !state.error && (
        <p
          id={helpId}
          className="text-muted-foreground text-sm"
        >
          {helpText}
        </p>
      )}

      {/* Calculations Panel (Desktop: always visible when valid) */}
      {showCalculations && state.networkInfo && (
        <SubnetCalculations
          info={state.networkInfo}
          className="mt-3"
        />
      )}
    </div>
  );
});

SubnetInputDesktop.displayName = 'SubnetInputDesktop';
