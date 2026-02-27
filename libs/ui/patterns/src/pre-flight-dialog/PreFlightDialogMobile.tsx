/**
 * PreFlightDialog Mobile Presenter
 *
 * Bottom sheet presenter for mobile devices.
 *
 * Features:
 * - Sheet (bottom drawer) instead of modal
 * - Swipe-to-dismiss gesture
 * - Large touch targets (44px)
 * - Vertical scrollable list
 * - Semantic color tokens
 * - WCAG AAA accessible
 *
 * @module @nasnet/ui/patterns/pre-flight-dialog
 */

import * as React from 'react';
import { AlertCircle, Check, CheckCircle, X, XCircle } from 'lucide-react';

import {
  Button,
  Checkbox,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  cn,
} from '@nasnet/ui/primitives';

import { usePreFlightDialog } from './usePreFlightDialog';

import type { PreFlightDialogProps } from './types';

/**
 * Mobile presenter for PreFlightDialog
 *
 * Displays resource deficit dialog as a bottom sheet.
 * Optimized for touch interaction and small screens.
 */
const PreFlightDialogMobileComponent = React.forwardRef<HTMLDivElement, PreFlightDialogProps>(
  (props, ref) => {
    const { open, onOpenChange, serviceName, allowOverride = false, className } = props;
    const state = usePreFlightDialog(props);

    const handleSelectAll = React.useCallback(() => {
      state.selectAll();
    }, [state]);

    const handleClearAll = React.useCallback(() => {
      state.clearAll();
    }, [state]);

    const handleToggleSelection = React.useCallback(
      (serviceId: string) => {
        state.toggleSelection(serviceId);
      },
      [state]
    );

    return (
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
      >
        <SheetContent
          ref={ref}
          side="bottom"
          className={cn('flex max-h-[90vh] flex-col', className)}
        >
          <SheetHeader>
            <div className="flex items-center gap-2">
              <AlertCircle
                className="text-warning h-6 w-6"
                aria-hidden="true"
              />
              <SheetTitle>Insufficient Memory</SheetTitle>
            </div>
            <SheetDescription>
              Cannot start <strong>{serviceName}</strong> due to insufficient memory. Select
              services to stop to free up resources.
            </SheetDescription>
          </SheetHeader>

          {/* Resource Summary */}
          <div className="bg-warning/10 border-warning/30 mt-4 rounded-lg border p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Required:</span>
                <span className="text-foreground font-semibold">{state.requiredText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available:</span>
                <span className="text-destructive font-semibold">{state.availableText}</span>
              </div>
              <div className="border-warning/30 flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Needed:</span>
                <span className="text-warning font-bold">{state.deficitText}</span>
              </div>
            </div>
          </div>

          {/* Sufficiency Status */}
          <div
            className={cn(
              'mt-3 rounded-lg border-2 p-3 transition-colors',
              state.isSufficient ? 'bg-success/10 border-success/30' : 'bg-muted/50 border-border'
            )}
          >
            <div className="flex items-center gap-2">
              {state.isSufficient ?
                <>
                  <CheckCircle
                    className="text-success h-5 w-5"
                    aria-hidden="true"
                  />
                  <span className="text-success text-sm font-semibold">
                    Sufficient! {state.totalFreedText} will be freed.
                  </span>
                </>
              : <>
                  <XCircle
                    className="text-muted-foreground h-5 w-5"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground text-sm font-semibold">
                    Need {state.remainingDeficitText} more
                  </span>
                </>
              }
            </div>
          </div>

          {/* Service Selection List */}
          <div className="mt-4 flex-1 overflow-y-auto">
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Suggested Services ({state.selectedCount} selected)
              </Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8 text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {state.suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 p-3',
                    'min-h-[56px]', // Touch-friendly height
                    'transition-all duration-200',
                    suggestion.selected ?
                      'bg-primary/10 border-primary'
                    : 'bg-card border-border hover:border-gray-400 dark:hover:border-gray-600'
                  )}
                >
                  <Checkbox
                    id={`service-${suggestion.id}`}
                    checked={suggestion.selected}
                    onCheckedChange={() => handleToggleSelection(suggestion.id)}
                    className="h-6 w-6"
                    aria-label={`Select ${suggestion.name}`}
                  />
                  <Label
                    htmlFor={`service-${suggestion.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-foreground font-medium">{suggestion.name}</span>
                      <span className="text-muted-foreground text-sm">
                        Frees {Math.round(suggestion.memoryUsage)} MB
                      </span>
                    </div>
                  </Label>
                  {suggestion.selected && (
                    <Check
                      className="text-primary h-5 w-5"
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <SheetFooter className="mt-4 flex-col gap-2">
            <Button
              onClick={state.handleConfirm}
              disabled={!state.isSufficient}
              className="min-h-[48px] w-full"
              size="lg"
            >
              {state.isSufficient ?
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Stop {state.selectedCount} Service{state.selectedCount !== 1 ? 's' : ''} & Start
                </>
              : <>
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Select More Services
                </>
              }
            </Button>

            {allowOverride && state.handleOverride && (
              <Button
                onClick={state.handleOverride}
                variant="destructive"
                className="min-h-[48px] w-full"
                size="lg"
              >
                <AlertCircle className="mr-2 h-5 w-5" />
                Override & Start Anyway (Risky)
              </Button>
            )}

            <Button
              onClick={state.handleCancel}
              variant="outline"
              className="min-h-[48px] w-full"
              size="lg"
            >
              <X className="mr-2 h-5 w-5" />
              Cancel
            </Button>
          </SheetFooter>

          {/* Swipe indicator */}
          <div
            className="bg-muted absolute left-1/2 top-2 h-1 w-12 -translate-x-1/2 rounded-full"
            aria-hidden="true"
          />
        </SheetContent>
      </Sheet>
    );
  }
);

PreFlightDialogMobileComponent.displayName = 'PreFlightDialogMobile';

export const PreFlightDialogMobile = React.memo(PreFlightDialogMobileComponent);
