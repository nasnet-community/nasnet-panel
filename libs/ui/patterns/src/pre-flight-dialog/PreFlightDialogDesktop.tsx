/**
 * PreFlightDialog Desktop Presenter
 *
 * Modal dialog presenter for desktop devices.
 * Features:
 * - Center modal dialog with backdrop
 * - Information-dense layout
 * - Keyboard navigation support
 * - Compact vertical spacing
 */

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
export function PreFlightDialogDesktop(props: PreFlightDialogProps) {
  const { open, onOpenChange, serviceName, allowOverride = false, className } = props;
  const state = usePreFlightDialog(props);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-2xl max-h-[80vh] flex flex-col', className)}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-semantic-warning" />
            <DialogTitle>Insufficient Memory</DialogTitle>
          </div>
          <DialogDescription>
            Cannot start <strong>{serviceName}</strong> due to insufficient memory.
            Select services to stop to free up resources.
          </DialogDescription>
        </DialogHeader>

        {/* Resource Summary */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Required</span>
              <span className="font-semibold text-foreground">{state.requiredText}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Available</span>
              <span className="font-semibold text-semantic-error">
                {state.availableText}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Needed</span>
              <span className="font-bold text-semantic-warning">{state.deficitText}</span>
            </div>
          </div>
        </div>

        {/* Sufficiency Status */}
        <div
          className={cn(
            'p-3 rounded-lg border-2 transition-colors',
            state.isSufficient
              ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700'
              : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {state.isSufficient ? (
                <>
                  <CheckCircle className="h-4 w-4 text-semantic-success" />
                  <span className="text-sm font-semibold text-semantic-success">
                    Sufficient resources selected
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-semibold text-muted-foreground">
                    Insufficient resources selected
                  </span>
                </>
              )}
            </div>
            <div className="text-sm">
              {state.isSufficient ? (
                <span className="font-semibold text-semantic-success">
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
                    onCheckedChange={() => state.toggleSelection(suggestion.id)}
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
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
            Esc
          </kbd>{' '}
          to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
