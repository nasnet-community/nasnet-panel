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

import * as React from 'react';
import { cn, Input, Label } from '@nasnet/ui/primitives';
import { SubnetCalculations } from './subnet-calculations';
import { PrefixSelector } from './prefix-selector';
import { OverlapWarning } from './overlap-warning';
import type { SubnetInputPresenterProps } from './subnet-input.types';

/**
 * Desktop presenter for SubnetInput
 * Shows IP input, prefix selector, and calculations panel inline
 */
export function SubnetInputDesktop({
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
  const inputId = id || React.useId();
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  // Handle IP input change
  const handleIPChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      state.setIP(e.target.value);
    },
    [state]
  );

  // Handle prefix change
  const handlePrefixChange = React.useCallback(
    (prefix: number) => {
      state.setPrefix(prefix);
    },
    [state]
  );

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <Label htmlFor={inputId} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      {/* Input row: IP + prefix selector */}
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
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
              aria-describedby={cn(
                state.error && errorId,
                helpText && helpId
              )}
              className={cn(
                'font-mono flex-1',
                state.error && 'border-destructive focus-visible:ring-destructive'
              )}
            />

            {/* Prefix Selector */}
            <PrefixSelector
              value={state.prefixPart}
              onChange={handlePrefixChange}
              options={state.prefixOptions}
              disabled={disabled}
              ariaLabel="CIDR prefix length"
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
              className="text-sm text-destructive"
            >
              {state.error}
            </p>
          )}

          {/* Help text */}
          {helpText && !state.error && (
            <p id={helpId} className="text-sm text-muted-foreground">
              {helpText}
            </p>
          )}
        </div>
      </div>

      {/* Calculations Panel (Desktop: always visible when valid) */}
      {showCalculations && state.networkInfo && (
        <SubnetCalculations
          info={state.networkInfo}
          className="mt-3"
        />
      )}
    </div>
  );
}

SubnetInputDesktop.displayName = 'SubnetInputDesktop';
