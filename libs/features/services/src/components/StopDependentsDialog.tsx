/**
 * StopDependentsDialog Component
 *
 * Warning dialog when stopping a service with dependents.
 * Displays affected services and offers options for handling dependents.
 *
 * Part of NAS-8.19 Feature Dependencies implementation.
 */

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

import {
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
export function StopDependentsDialog({
  open,
  onOpenChange,
  instanceName,
  featureId,
  dependents,
  onConfirm,
  isLoading = false,
}: StopDependentsDialogProps) {
  const [stopMode, setStopMode] = React.useState<StopMode>('stop-dependents-first');

  const handleConfirm = () => {
    onConfirm(stopMode);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Reset to default mode when dialog opens
  React.useEffect(() => {
    if (open) {
      setStopMode('stop-dependents-first');
    }
  }, [open]);

  const dependentCount = dependents.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                Stop {instanceName}?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {dependentCount} {dependentCount === 1 ? 'service depends' : 'services depend'} on this
                instance
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning message */}
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <p className="text-sm text-foreground">
              Stopping <span className="font-semibold">{instanceName}</span> ({featureId}) will affect the
              following services:
            </p>
          </div>

          {/* List of affected services */}
          <ScrollArea className="max-h-48 rounded-lg border border-border">
            <div className="p-3 space-y-2">
              {dependents.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-muted/50 p-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <StatusBadge
                      status={dep.fromInstance.status as any}
                      className="text-xs"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {dep.fromInstance.instanceName}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {dep.fromInstance.featureID}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      dep.dependencyType === 'REQUIRES'
                        ? 'bg-destructive/10 text-destructive'
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
          <div className="space-y-3">
            <Label className="text-sm font-medium">How would you like to proceed?</Label>
            <RadioGroup value={stopMode} onValueChange={(value) => setStopMode(value as StopMode)}>
              <div className="space-y-2">
                {/* Option 1: Stop dependents first (recommended) */}
                <label
                  htmlFor="stop-dependents-first"
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                    'hover:bg-accent',
                    'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                    stopMode === 'stop-dependents-first'
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  )}
                >
                  <RadioGroupItem value="stop-dependents-first" id="stop-dependents-first" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Stop dependents first</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gracefully stop all dependent services before stopping this instance. This is the
                      safest option.
                    </p>
                  </div>
                </label>

                {/* Option 2: Force stop */}
                <label
                  htmlFor="force-stop"
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                    'hover:bg-accent',
                    'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                    stopMode === 'force-stop' ? 'border-destructive bg-destructive/5' : 'border-border'
                  )}
                >
                  <RadioGroupItem value="force-stop" id="force-stop" className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Force stop</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                        Danger
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Stop this instance immediately. Dependent services may fail or behave unexpectedly.
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={stopMode === 'force-stop' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'min-w-[100px]',
              stopMode === 'force-stop' && 'focus-visible:ring-destructive'
            )}
          >
            {isLoading ? 'Stopping...' : 'Stop Service'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
