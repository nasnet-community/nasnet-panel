/**
 * InstallingStep Component
 *
 * Third step of template installation wizard.
 * Shows real-time installation progress with subscription updates.
 */

import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, Loader2, Circle } from 'lucide-react';
import { Progress, Card, CardContent, Icon } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { TemplateInstallContext } from '../templateInstallMachine';

/**
 * Props for InstallingStep
 */
export interface InstallingStepProps {
  /** Installation progress from context */
  progress: TemplateInstallContext['progress'];
  /** Installation result (if complete) */
  installResult: TemplateInstallContext['installResult'];
  /** Optional CSS class name for the container */
  className?: string;
}

/**
 * Get status icon based on installation status
 */
function getStatusIcon(status: 'pending' | 'installing' | 'completed' | 'failed') {
  switch (status) {
    case 'completed':
      return (
        <Icon
          icon={CheckCircle2}
          className="text-success h-5 w-5"
          aria-hidden="true"
        />
      );
    case 'failed':
      return (
        <Icon
          icon={XCircle}
          className="text-error h-5 w-5"
          aria-hidden="true"
        />
      );
    case 'installing':
      return (
        <Icon
          icon={Loader2}
          className="text-primary h-5 w-5 animate-spin"
          aria-hidden="true"
        />
      );
    default:
      return (
        <Icon
          icon={Circle}
          className="text-muted-foreground h-5 w-5"
          aria-hidden="true"
        />
      );
  }
}

/**
 * InstallingStep - Real-time installation progress
 *
 * Features:
 * - Overall progress bar
 * - Phase indicator (VALIDATING → INSTALLING → VERIFYING)
 * - Per-service progress
 * - Real-time updates from subscription
 *
 * @example
 * ```tsx
 * <InstallingStep
 *   progress={context.progress}
 *   installResult={context.installResult}
 * />
 * ```
 */
export const InstallingStep = React.memo(function InstallingStep({
  progress,
  installResult,
  className,
}: InstallingStepProps) {
  const isComplete = installResult !== null;
  const isSuccess = installResult?.success || false;

  const progressPercent = useMemo(() => {
    return progress ? Math.round((progress.current / progress.total) * 100) : 0;
  }, [progress]);

  const statusMessage = useMemo(() => {
    if (!isComplete) {
      return {
        title: 'Installing Template',
        description: 'Please wait while we install your services...',
      };
    }
    return isSuccess ?
        {
          title: 'Installation Complete',
          description: 'Your services have been installed successfully',
        }
      : {
          title: 'Installation Failed',
          description: 'An error occurred during installation',
        };
  }, [isComplete, isSuccess]);

  return (
    <div className={cn('space-y-component-lg', className)}>
      <div>
        <h2 className="text-lg font-semibold">{statusMessage.title}</h2>
        <p className="text-muted-foreground mt-component-sm text-sm">{statusMessage.description}</p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-component-lg">
          <div className="space-y-component-md">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{progress?.currentService || 'Preparing...'}</span>
              <span className="text-muted-foreground">
                {progress ? `${progress.current} / ${progress.total}` : '0 / 0'}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-2"
            />
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Indicator */}
      {progress && !isComplete && (
        <Card>
          <CardContent className="pt-component-lg">
            <div className="space-y-component-lg">
              <h3 className="text-sm font-medium">Installation Phase</h3>
              <div className="space-y-component-md">
                {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map((phase) => {
                  const isCurrent = progress.phase === phase;
                  const isPast = progress.phase === 'COMPLETED' && phase !== 'COMPLETED';
                  const status =
                    isCurrent ? 'installing'
                    : isPast ? 'completed'
                    : 'pending';

                  return (
                    <div
                      key={phase}
                      className="gap-component-md flex items-center"
                    >
                      {getStatusIcon(status)}
                      <span
                        className={cn(
                          'text-sm',
                          isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                        )}
                      >
                        {phase.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installation Result */}
      {isComplete && (
        <Card className={cn('border', isSuccess ? 'border-success' : 'border-error')}>
          <CardContent className="pt-component-lg">
            <div className="space-y-component-md">
              {isSuccess ?
                <>
                  <div className="gap-component-sm text-success flex items-center">
                    <Icon
                      icon={CheckCircle2}
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                    <span className="font-medium">
                      Successfully installed {installResult.instanceIDs.length} service
                      {installResult.instanceIDs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Your services are now running and ready to use
                  </p>
                </>
              : <>
                  <div className="gap-component-sm text-error flex items-center">
                    <Icon
                      icon={XCircle}
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                    <span className="font-medium">Installation Failed</span>
                  </div>
                  {installResult.errors && installResult.errors.length > 0 && (
                    <ul className="text-muted-foreground space-y-component-sm list-inside list-disc text-sm">
                      {installResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </>
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

InstallingStep.displayName = 'InstallingStep';
