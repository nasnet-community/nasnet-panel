/**
 * PPPoE Wizard - Step 5: Confirm & Apply
 *
 * Final confirmation and configuration application.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 3: PPPoE)
 */

import { useEffect } from 'react';
import { Button } from '@nasnet/ui/primitives';
import type { UseStepperReturn } from '@nasnet/ui/patterns';
import { CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react';
import type { ApolloError } from '@apollo/client';

interface PppoeConfirmStepProps {
  stepper: UseStepperReturn;
  loading: boolean;
  error?: ApolloError;
  result?: any;
  onSubmit: () => void;
}

export function PppoeConfirmStep({
  stepper,
  loading,
  error,
  result,
  onSubmit,
}: PppoeConfirmStepProps) {
  const optionsData = stepper.getStepData<any>('options');

  // Success state
  if (result?.success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="rounded-full bg-success/10 p-4">
          <CheckCircle2 className="h-12 w-12 text-success" />
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
                    className={
                      result.wanInterface.status === 'CONNECTED'
                        ? 'text-success'
                        : 'text-warning'
                    }
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
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="rounded-full bg-error/10 p-4">
          <AlertCircle className="h-12 w-12 text-error" />
        </div>
        <h3 className="text-xl font-semibold">Configuration Failed</h3>
        <p className="text-center text-muted-foreground max-w-md">
          {error.message}
        </p>
        <Button variant="outline" onClick={() => stepper.goTo(0)}>
          Start Over
        </Button>
      </div>
    );
  }

  // Confirmation state
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="rounded-full bg-primary/10 p-4 inline-flex mb-4">
          <Zap className="h-12 w-12 text-primary" />
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
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
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
          onClick={onSubmit}
          disabled={loading}
          className="min-w-[200px]"
        >
          {loading ? (
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
