/**
 * PPPoE Wizard - Step 5: Confirm & Apply
 * @description Final confirmation and configuration application with status feedback
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { useCallback } from 'react';
import { Button } from '@nasnet/ui/primitives';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';
import { CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react';
import type { ApolloError } from '@apollo/client';

interface PppoeConfirmStepProps {
  /** Stepper hook for wizard navigation and state management */
  stepper: UseStepperReturn;
  /** Whether submission is in progress */
  isLoading: boolean;
  /** Error from API submission */
  error?: ApolloError;
  /** Result from successful submission */
  result?: any;
  /** Callback when user confirms and applies configuration */
  onSubmit: () => void;
  /** Optional CSS class override */
  className?: string;
}

/**
 * @description Confirm step for PPPoE configuration with success/error/pending states
 */
export function PppoeConfirmStep({
  stepper,
  isLoading,
  error,
  result,
  onSubmit,
  className,
}: PppoeConfirmStepProps) {
  const optionsData = stepper.getStepData<any>('options');

  const handleStartOver = useCallback(() => {
    stepper.goTo(0);
  }, [stepper]);

  const handleSubmit = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  // Success state
  if (result?.success) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 space-y-4',
          className
        )}
      >
        <div className="rounded-full bg-success/10 p-4">
          <CheckCircle2
            className="h-12 w-12 text-success"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-xl font-semibold">PPPoE Configured Successfully!</h3>
        <p className="text-center text-muted-foreground max-w-md">
          Your PPPoE connection has been configured and is attempting to
          connect to your ISP. It may take a few moments to establish the
          connection.
        </p>
        {result.wanInterface && (
          <div className="rounded-lg border bg-muted/50 p-4 w-full max-w-md">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Interface:</dt>
                <dd className="font-mono">{result.wanInterface.interfaceName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status:</dt>
                <dd>
                  <span
                    className={cn(
                      result.wanInterface.status === 'CONNECTED'
                        ? 'text-success'
                        : 'text-warning'
                    )}
                  >
                    {result.wanInterface.status}
                  </span>
                </dd>
              </div>
              {result.wanInterface.publicIP && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Public IP:</dt>
                  <dd className="font-mono">{result.wanInterface.publicIP}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12 space-y-4',
          className
        )}
      >
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle
            className="h-12 w-12 text-destructive"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-xl font-semibold">Configuration Failed</h3>
        <p className="text-center text-muted-foreground max-w-md">
          {error.message || 'An error occurred while applying the configuration'}
        </p>
        <Button
          variant="outline"
          onClick={handleStartOver}
          aria-label="Return to first step"
        >
          Start Over
        </Button>
      </div>
    );
  }

  // Confirmation state
  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center py-8">
        <div className="rounded-full bg-primary/10 p-4 inline-flex mb-4">
          <Zap
            className="h-12 w-12 text-primary"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-xl font-semibold mb-2">Ready to Apply</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Click the button below to apply your PPPoE configuration to the
          router.
        </p>
      </div>

      {/* Warning for default route */}
      {optionsData?.addDefaultRoute && (
        <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
          <div className="flex gap-3">
            <AlertCircle
              className="h-5 w-5 text-warning flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Default Route Warning</p>
              <p className="text-xs text-muted-foreground">
                This configuration will add a default route via the PPPoE
                connection. If you have existing internet connectivity, it may
                be interrupted temporarily during the configuration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Apply Button */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={isLoading}
          className="min-w-[200px]"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Configuring...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Apply Configuration
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        The configuration will be applied immediately. You can monitor the
        connection status from the WAN overview page.
      </p>
    </div>
  );
}

PppoeConfirmStep.displayName = 'PppoeConfirmStep';
