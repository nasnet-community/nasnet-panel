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
      <div className={cn('flex flex-col items-center justify-center space-y-4 py-12', className)}>
        <div className="bg-success/10 p-component-sm rounded-full">
          <CheckCircle2
            className="text-success h-12 w-12"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-xl font-semibold">PPPoE Configured Successfully!</h3>
        <p className="text-muted-foreground max-w-md text-center">
          Your PPPoE connection has been configured and is attempting to connect to your ISP. It may
          take a few moments to establish the connection.
        </p>
        {result.wanInterface && (
          <div className="bg-muted/50 p-component-md category-networking w-full max-w-md rounded-lg border">
            <dl className="space-y-component-sm text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Interface:</dt>
                <dd className="font-mono text-xs">{result.wanInterface.interfaceName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status:</dt>
                <dd>
                  <span
                    className={cn(
                      result.wanInterface.status === 'CONNECTED' ? 'text-success' : 'text-warning'
                    )}
                  >
                    {result.wanInterface.status}
                  </span>
                </dd>
              </div>
              {result.wanInterface.publicIP && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Public IP:</dt>
                  <dd className="font-mono text-xs">{result.wanInterface.publicIP}</dd>
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
      <div className={cn('flex flex-col items-center justify-center space-y-4 py-12', className)}>
        <div className="bg-error/10 p-component-sm rounded-full">
          <AlertCircle
            className="text-error h-12 w-12"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-xl font-semibold">Configuration Failed</h3>
        <p className="text-muted-foreground max-w-md text-center">
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
    <div className={cn('space-y-component-lg', className)}>
      <div className="py-component-xl text-center">
        <div className="bg-primary/10 p-component-sm mb-component-md inline-flex rounded-full">
          <Zap
            className="text-primary h-12 w-12"
            aria-hidden="true"
          />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Ready to Apply</h3>
        <p className="text-muted-foreground mx-auto max-w-md">
          Click the button below to apply your PPPoE configuration to the router.
        </p>
      </div>

      {/* Warning for default route */}
      {optionsData?.addDefaultRoute && (
        <div className="border-border bg-card/50 p-component-sm rounded-lg border">
          <div className="gap-component-xs flex">
            <AlertCircle
              className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Default Route Warning</p>
              <p className="text-muted-foreground text-xs">
                This configuration will add a default route via the PPPoE connection. If you have
                existing internet connectivity, it may be interrupted temporarily during the
                configuration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Apply Button */}
      <div className="pt-component-md flex justify-center">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={isLoading}
          className="min-w-[200px]"
          aria-busy={isLoading}
        >
          {isLoading ?
            <>
              <Loader2 className="mr-component-sm h-4 w-4 animate-spin" />
              Configuring...
            </>
          : <>
              <Zap className="mr-component-sm h-4 w-4" />
              Apply Configuration
            </>
          }
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        The configuration will be applied immediately. You can monitor the connection status from
        the WAN overview page.
      </p>
    </div>
  );
}

PppoeConfirmStep.displayName = 'PppoeConfirmStep';
