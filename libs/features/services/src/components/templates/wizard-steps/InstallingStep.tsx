/**
 * InstallingStep Component
 *
 * Third step of template installation wizard.
 * Shows real-time installation progress with subscription updates.
 */

import * as React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

import { Progress, Card, CardContent } from '@nasnet/ui/primitives';
import type { TemplateInstallContext } from '../templateInstallMachine';

/**
 * Props for InstallingStep
 */
export interface InstallingStepProps {
  /** Installation progress from context */
  progress: TemplateInstallContext['progress'];
  /** Installation result (if complete) */
  installResult: TemplateInstallContext['installResult'];
}

/**
 * Get status icon based on installation status
 */
function getStatusIcon(status: 'pending' | 'installing' | 'completed' | 'failed') {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-destructive" />;
    case 'installing':
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground" />;
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
 */
export function InstallingStep({ progress, installResult }: InstallingStepProps) {
  const isComplete = installResult !== null;
  const isSuccess = installResult?.success || false;
  const progressPercent = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {isComplete
            ? isSuccess
              ? 'Installation Complete'
              : 'Installation Failed'
            : 'Installing Template'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isComplete
            ? isSuccess
              ? 'Your services have been installed successfully'
              : 'An error occurred during installation'
            : 'Please wait while we install your services...'}
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {progress?.currentService || 'Preparing...'}
              </span>
              <span className="text-muted-foreground">
                {progress ? `${progress.current} / ${progress.total}` : '0 / 0'}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Indicator */}
      {progress && !isComplete && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Installation Phase</h3>
              <div className="space-y-3">
                {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map((phase) => {
                  const isCurrent = progress.phase === phase;
                  const isPast =
                    progress.phase === 'COMPLETED' && phase !== 'COMPLETED';
                  const status = isCurrent
                    ? 'installing'
                    : isPast
                    ? 'completed'
                    : 'pending';

                  return (
                    <div key={phase} className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <span
                        className={`text-sm ${
                          isCurrent
                            ? 'font-medium text-foreground'
                            : 'text-muted-foreground'
                        }`}
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
        <Card className={isSuccess ? 'border-green-500' : 'border-destructive'}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {isSuccess ? (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">
                      Successfully installed {installResult.instanceIDs.length}{' '}
                      service{installResult.instanceIDs.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your services are now running and ready to use
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Installation Failed</span>
                  </div>
                  {installResult.errors && installResult.errors.length > 0 && (
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {installResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
