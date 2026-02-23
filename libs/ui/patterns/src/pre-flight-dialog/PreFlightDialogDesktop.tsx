/**
 * PreFlightDialog Desktop Presenter
 *
 * Modal dialog presenter for desktop devices.
 *
 * Features:
 * - Center modal dialog with backdrop
 * - Information-dense layout
 * - Keyboard navigation support
 * - Compact vertical spacing
 * - Semantic color tokens
 * - WCAG AAA accessible
 *
 * @module @nasnet/ui/patterns/pre-flight-dialog
 */

import * as React from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle,
  X,
  XCircle,
} from 'lucide-react';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  ScrollArea,
  cn,
} from '@nasnet/ui/primitives';

import { usePreFlightDialog } from './usePreFlightDialog';

import type { PreFlightDialogProps } from './types';

/**
 * Desktop presenter for PreFlightDialog
 *
 * Displays resource deficit dialog as a centered modal.
 * Optimized for keyboard navigation and larger screens.
 */
const PreFlightDialogDesktopComponent = React.forwardRef<
  HTMLDivElement,
  PreFlightDialogProps
>((props, ref) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={ref}
        className={cn('max-w-2xl max-h-[80vh] flex flex-col', className)}
        role="alertdialog"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" aria-hidden="true" />
            <DialogTitle>Insufficient Memory</DialogTitle>
          </div>
          <DialogDescription>
            Cannot start <strong>{serviceName}</strong> due to insufficient memory.
            Select services to stop to free up resources.
          </DialogDescription>
        </DialogHeader>

        {/* Resource Summary */}
        <div className="p-4 bg-warning/10 rounded-lg border border-warning/30">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Required</span>
              <span className="font-semibold text-foreground">{state.requiredText}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Available</span>
              <span className="font-semibold text-destructive">
                {state.availableText}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Needed</span>
              <span className="font-bold text-warning">{state.deficitText}</span>
            </div>
          </div>
        </div>

        {/* Sufficiency Status */}
        <div
          className={cn(
            'p-3 rounded-lg border-2 transition-colors',
            state.isSufficient
              ? 'bg-success/10 border-success/30'
              : 'bg-muted/50 border-border'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {state.isSufficient ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
                  <span className="text-sm font-semibold text-success">
                    Sufficient resources selected
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-semibold text-muted-foreground">
                    Insufficient resources selected
                  </span>
                </>
              )}
            </div>
            <div className="text-sm">
              {state.isSufficient ? (
                <span className="font-semibold text-success">
                  {state.totalFreedText} will be freed
                </span>
              ) : (
                <span className="font-semibold text-muted-foreground">
                  Need {state.remainingDeficitText} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Service Selection List */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
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
                Clear All
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[240px] pr-4">
            <div className="space-y-2">
              {state.suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-md border',
                    'transition-all duration-200',
                    suggestion.selected
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border hover:border-gray-400 dark:hover:border-gray-600'
                  )}
                >
                  <Checkbox
                    id={`service-${suggestion.id}`}
                    checked={suggestion.selected}
                    onCheckedChange={() => handleToggleSelection(suggestion.id)}
                    aria-label={`Select ${suggestion.name}`}
                  />
                  <Label
                    htmlFor={`service-${suggestion.id}`}
                    className="flex-1 cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-medium text-foreground">{suggestion.name}</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {Math.round(suggestion.memoryUsage)} MB
                    </span>
                  </Label>
                  {suggestion.selected && (
                    <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button onClick={state.handleCancel} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>

          {allowOverride && state.handleOverride && (
            <Button onClick={state.handleOverride} variant="destructive">
              <AlertCircle className="h-4 w-4 mr-2" />
              Override & Start Anyway
            </Button>
          )}

          <Button onClick={state.handleConfirm} disabled={!state.isSufficient}>
            {state.isSufficient ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Stop {state.selectedCount} & Start
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Select More Services
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Keyboard hint */}
        <div className="text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded">
            Esc
          </kbd>{' '}
          to close
        </div>
      </DialogContent>
    </Dialog>
  );
});

PreFlightDialogDesktopComponent.displayName = 'PreFlightDialogDesktop';

export const PreFlightDialogDesktop = React.memo(PreFlightDialogDesktopComponent);
