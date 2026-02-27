/**
 * StopDependentsDialog Component
 *
 * Warning dialog when stopping a service with dependents.
 * Displays affected services and offers options for handling dependents.
 *
 * Part of NAS-8.19 Feature Dependencies implementation.
 */

import * as React from 'react';
import { useCallback } from 'react';
import {
  Icon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  cn,
  RadioGroup,
  RadioGroupItem,
  Label,
  ScrollArea,
} from '@nasnet/ui/primitives';
import { AlertTriangle as AlertTriangleIcon } from 'lucide-react';

import { StatusBadge } from '@nasnet/ui/patterns';
import type { ServiceDependency } from '@nasnet/api-client/queries';

/**
 * Stop action mode
 */
export type StopMode = 'stop-dependents-first' | 'force-stop';

export interface StopDependentsDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Service instance name being stopped */
  instanceName: string;
  /** Feature ID of the instance being stopped */
  featureId: string;
  /** List of dependents (services that depend on this instance) */
  dependents: ServiceDependency[];
  /** Callback when user confirms stop action */
  onConfirm: (mode: StopMode) => void;
  /** Whether the action is loading */
  isLoading?: boolean;
}

/**
 * Stop Dependents Dialog Component
 *
 * Displays a warning when attempting to stop a service that other services depend on.
 * Offers two options:
 * 1. Stop dependents first (graceful, recommended)
 * 2. Force stop (may cause dependent services to fail)
 *
 * @example
 * ```tsx
 * <StopDependentsDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   instanceName="Tor Gateway"
 *   featureId="tor"
 *   dependents={dependentsList}
 *   onConfirm={(mode) => handleStop(mode)}
 * />
 * ```
 */
export const StopDependentsDialog = React.memo(function StopDependentsDialog({
  open,
  onOpenChange,
  instanceName,
  featureId,
  dependents,
  onConfirm,
  isLoading = false,
}: StopDependentsDialogProps) {
  const [stopMode, setStopMode] = React.useState<StopMode>('stop-dependents-first');

  const handleConfirm = useCallback(() => {
    onConfirm(stopMode);
  }, [onConfirm, stopMode]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleStopModeChange = useCallback((value: string) => {
    setStopMode(value as StopMode);
  }, []);

  // Reset to default mode when dialog opens
  React.useEffect(() => {
    if (open) {
      setStopMode('stop-dependents-first');
    }
  }, [open]);

  const dependentCount = dependents.length;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="gap-component-md flex items-center">
            <div className="bg-warning/10 focus-visible:ring-ring flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
              <Icon
                icon={AlertTriangleIcon}
                className="text-warning h-5 w-5"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">Stop {instanceName}?</DialogTitle>
              <DialogDescription className="text-muted-foreground mt-component-sm text-sm">
                {dependentCount} {dependentCount === 1 ? 'service depends' : 'services depend'} on
                this instance
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-component-lg py-component-lg">
          {/* Warning message */}
          <div className="border-warning/30 bg-warning/5 p-component-md rounded-lg border">
            <p className="text-foreground text-sm">
              Stopping <span className="font-semibold">{instanceName}</span> ({featureId}) will
              affect the following services:
            </p>
          </div>

          {/* List of affected services */}
          <ScrollArea className="border-border max-h-48 rounded-lg border">
            <div className="p-component-md space-y-component-sm">
              {dependents.map((dep) => (
                <div
                  key={dep.id}
                  className="gap-component-md bg-muted/50 p-component-sm flex items-center justify-between rounded-md"
                >
                  <div className="gap-component-sm flex min-w-0 flex-1 items-center">
                    <StatusBadge
                      status={dep.fromInstance.status as any}
                      className="text-xs"
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {dep.fromInstance.instanceName}
                      </span>
                      <span className="text-muted-foreground truncate font-mono text-xs">
                        {dep.fromInstance.featureID}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'px-component-sm rounded-full py-1 text-xs',
                      dep.dependencyType === 'REQUIRES' ?
                        'bg-error/10 text-error'
                      : 'bg-warning/10 text-warning'
                    )}
                  >
                    {dep.dependencyType === 'REQUIRES' ? 'Required' : 'Optional'}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Stop mode selection */}
          <div className="space-y-component-md">
            <Label className="text-sm font-medium">How would you like to proceed?</Label>
            <RadioGroup
              value={stopMode}
              onValueChange={handleStopModeChange}
            >
              <div className="space-y-component-sm">
                {/* Option 1: Stop dependents first (recommended) */}
                <label
                  htmlFor="stop-dependents-first"
                  className={cn(
                    'gap-component-md p-component-md flex cursor-pointer items-start rounded-lg border transition-colors',
                    'hover:bg-muted',
                    'focus-within:ring-ring focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2',
                    stopMode === 'stop-dependents-first' ?
                      'border-primary bg-primary/10'
                    : 'border-border'
                  )}
                >
                  <RadioGroupItem
                    value="stop-dependents-first"
                    id="stop-dependents-first"
                    className="mt-1"
                  />
                  <div className="space-y-component-sm flex-1">
                    <div className="gap-component-sm flex items-center">
                      <span className="text-sm font-medium">Stop dependents first</span>
                      <span className="px-component-sm bg-success/10 text-success rounded-full py-1 text-xs font-medium">
                        Recommended
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Gracefully stop all dependent services before stopping this instance. This is
                      the safest option.
                    </p>
                  </div>
                </label>

                {/* Option 2: Force stop */}
                <label
                  htmlFor="force-stop"
                  className={cn(
                    'gap-component-md p-component-md flex cursor-pointer items-start rounded-lg border transition-colors',
                    'hover:bg-muted',
                    'focus-within:ring-ring focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2',
                    stopMode === 'force-stop' ? 'border-error bg-error/10' : 'border-border'
                  )}
                >
                  <RadioGroupItem
                    value="force-stop"
                    id="force-stop"
                    className="mt-1"
                  />
                  <div className="space-y-component-sm flex-1">
                    <div className="gap-component-sm flex items-center">
                      <span className="text-sm font-medium">Force stop</span>
                      <span className="px-component-sm bg-error/10 text-error rounded-full py-1 text-xs font-medium">
                        Danger
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Stop this instance immediately. Dependent services may fail or behave
                      unexpectedly.
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="min-h-[44px] min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            variant={stopMode === 'force-stop' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
            aria-label={
              isLoading ? 'Stopping service' : (
                `Stop service with ${stopMode === 'force-stop' ? 'force' : 'graceful'} mode`
              )
            }
            className={cn(
              'min-h-[44px] min-w-[100px]',
              stopMode === 'force-stop' && 'focus-visible:ring-error'
            )}
          >
            {isLoading ? 'Stopping...' : 'Stop Service'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

StopDependentsDialog.displayName = 'StopDependentsDialog';
