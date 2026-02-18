/**
 * PreFlightDialog Mobile Presenter
 *
 * Bottom sheet presenter for mobile devices.
 * Features:
 * - Sheet (bottom drawer) instead of modal
 * - Swipe-to-dismiss gesture
 * - Large touch targets (44px)
 * - Vertical scrollable list
 */

import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronDown,
  X,
  XCircle,
} from 'lucide-react';

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
export function PreFlightDialogMobile(props: PreFlightDialogProps) {
  const { open, onOpenChange, serviceName, allowOverride = false, className } = props;
  const state = usePreFlightDialog(props);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn('max-h-[90vh] flex flex-col', className)}
      >
        <SheetHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-semantic-warning" />
            <SheetTitle>Insufficient Memory</SheetTitle>
          </div>
          <SheetDescription>
            Cannot start <strong>{serviceName}</strong> due to insufficient memory.
            Select services to stop to free up resources.
          </SheetDescription>
        </SheetHeader>

        {/* Resource Summary */}
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Required:</span>
              <span className="font-semibold text-foreground">{state.requiredText}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-semibold text-semantic-error">
                {state.availableText}
              </span>
            </div>
            <div className="flex justify-between border-t border-amber-200 dark:border-amber-800 pt-2">
              <span className="text-muted-foreground">Needed:</span>
              <span className="font-bold text-semantic-warning">{state.deficitText}</span>
            </div>
          </div>
        </div>

        {/* Sufficiency Status */}
        <div
          className={cn(
            'mt-3 p-3 rounded-lg border-2 transition-colors',
            state.isSufficient
              ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700'
              : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700'
          )}
        >
          <div className="flex items-center gap-2">
            {state.isSufficient ? (
              <>
                <CheckCircle className="h-5 w-5 text-semantic-success" />
                <span className="text-sm font-semibold text-semantic-success">
                  Sufficient! {state.totalFreedText} will be freed.
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-semibold text-muted-foreground">
                  Need {state.remainingDeficitText} more
                </span>
              </>
            )}
          </div>
        </div>

        {/* Service Selection List */}
        <div className="mt-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold">
              Suggested Services ({state.selectedCount} selected)
            </Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={state.selectAll}
                className="h-8 text-xs"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={state.clearAll}
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
                  'flex items-center gap-3 p-3 rounded-lg border-2',
                  'min-h-[56px]', // Touch-friendly height
                  'transition-all duration-200',
                  suggestion.selected
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border hover:border-gray-400 dark:hover:border-gray-600'
                )}
              >
                <Checkbox
                  id={`service-${suggestion.id}`}
                  checked={suggestion.selected}
                  onCheckedChange={() => state.toggleSelection(suggestion.id)}
                  className="h-6 w-6"
                />
                <Label
                  htmlFor={`service-${suggestion.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">{suggestion.name}</span>
                    <span className="text-sm text-muted-foreground">
                      Frees {Math.round(suggestion.memoryUsage)} MB
                    </span>
                  </div>
                </Label>
                {suggestion.selected && (
                  <Check className="h-5 w-5 text-primary" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <SheetFooter className="flex-col gap-2 mt-4">
          <Button
            onClick={state.handleConfirm}
            disabled={!state.isSufficient}
            className="w-full min-h-[48px]"
            size="lg"
          >
            {state.isSufficient ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Stop {state.selectedCount} Service{state.selectedCount !== 1 ? 's' : ''} &
                Start
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 mr-2" />
                Select More Services
              </>
            )}
          </Button>

          {allowOverride && state.handleOverride && (
            <Button
              onClick={state.handleOverride}
              variant="destructive"
              className="w-full min-h-[48px]"
              size="lg"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              Override & Start Anyway (Risky)
            </Button>
          )}

          <Button
            onClick={state.handleCancel}
            variant="outline"
            className="w-full min-h-[48px]"
            size="lg"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel
          </Button>
        </SheetFooter>

        {/* Swipe indicator */}
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"
          aria-hidden="true"
        />
      </SheetContent>
    </Sheet>
  );
}
