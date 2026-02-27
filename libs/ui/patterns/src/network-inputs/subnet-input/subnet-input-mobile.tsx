/**
 * SubnetInputMobile Component
 * Mobile presenter for the subnet/CIDR input
 *
 * Features:
 * - Stacked layout (IP on top, prefix below)
 * - Calculations in expandable section
 * - 44px minimum touch targets
 * - Bottom sheet for calculations on tap
 *
 * @see ADR-018: Headless + Platform Presenters
 */

import { memo } from 'react';
import * as React from 'react';

import { Calculator, ChevronDown } from 'lucide-react';

import {
  cn,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
} from '@nasnet/ui/primitives';

import { OverlapWarning, OverlapBadge } from './overlap-warning';
import { PrefixSelector } from './prefix-selector';
import { SubnetCalculations } from './subnet-calculations';

import type { SubnetInputPresenterProps } from './subnet-input.types';

/**
 * Mobile presenter for SubnetInput
 * Stacked layout with bottom sheet for calculations
 */
export const SubnetInputMobile = memo(function SubnetInputMobile({
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
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Handle IP input change - moved outside render function
  const handleIPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    state.setIP(e.target.value);
  };

  // Handle prefix change - moved outside render function
  const handlePrefixChange = (prefix: number) => {
    state.setPrefix(prefix);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Label */}
      {label && (
        <Label
          htmlFor={inputId}
          className="text-base font-medium"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      {/* IP Address Input (larger touch target) */}
      <div className="space-y-1">
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
            'h-12 font-mono text-base', // 48px height for touch
            state.error && 'border-destructive focus-visible:ring-destructive'
          )}
        />
      </div>

      {/* Prefix Selector Row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-sm">Subnet Prefix</span>
        <PrefixSelector
          value={state.prefixPart}
          onChange={handlePrefixChange}
          options={state.prefixOptions}
          disabled={disabled}
          ariaLabel="CIDR prefix length"
          className="[&_button]:h-11 [&_input]:h-11" // Larger touch targets
        />
      </div>

      {/* Overlap Warning (if detected) */}
      {state.overlap && (
        <div className="border-warning/20 bg-warning/5 flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <OverlapBadge />
            <span className="text-muted-foreground text-sm">
              Conflicts with {state.overlap.resourceName}
            </span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
              >
                Details
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-auto"
            >
              <SheetHeader>
                <SheetTitle>Overlap Details</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <OverlapWarning
                  overlap={state.overlap}
                  className="w-full justify-start"
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Error message */}
      {state.error && (
        <p
          id={errorId}
          role="alert"
          className="text-destructive text-sm"
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

      {/* Calculations Button + Bottom Sheet (Mobile: tap to expand) */}
      {showCalculations && state.networkInfo && (
        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        >
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="h-12 w-full justify-between"
              disabled={!state.isValid}
            >
              <span className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                View Subnet Calculations
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-auto max-h-[70vh]"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Subnet Calculations
              </SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <SubnetCalculations
                info={state.networkInfo}
                className="border-0 bg-transparent p-0"
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Quick info line when calculations hidden */}
      {showCalculations && state.networkInfo && !sheetOpen && (
        <div className="text-muted-foreground flex items-center justify-between border-t pt-2 text-sm">
          <span>
            Network: <span className="font-mono">{state.networkInfo.network}</span>
          </span>
          <span>
            Hosts:{' '}
            <span className="font-mono">{state.networkInfo.hostCount.toLocaleString('en-US')}</span>
          </span>
        </div>
      )}
    </div>
  );
});

SubnetInputMobile.displayName = 'SubnetInputMobile';
