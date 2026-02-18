/**
 * UpdateProgressBar Component
 * Real-time stage visualization for service updates (NAS-8.7)
 */

import * as React from 'react';

import type { UpdateStage } from '@nasnet/api-client/queries';
import { cn } from '@nasnet/ui/primitives';

export interface UpdateProgressBarProps {
  /** Current update stage */
  stage: UpdateStage;

  /** Progress percentage (0-100) */
  progress: number;

  /** Progress message */
  message: string;

  /** Optional CSS class name */
  className?: string;
}

/**
 * Stage color mapping using semantic tokens
 */
const STAGE_COLORS: Record<UpdateStage, string> = {
  PENDING: 'bg-neutral',
  DOWNLOADING: 'bg-info',
  VERIFYING: 'bg-info',
  STOPPING: 'bg-warning',
  INSTALLING: 'bg-info',
  STARTING: 'bg-info',
  HEALTH_CHECK: 'bg-info',
  COMPLETE: 'bg-success',
  FAILED: 'bg-error',
  ROLLED_BACK: 'bg-warning',
};

/**
 * UpdateProgressBar
 *
 * Displays real-time update progress with stage-based color coding.
 * Uses ResourceUsageBar-like styling for consistency.
 *
 * @example
 * ```tsx
 * <UpdateProgressBar
 *   stage="DOWNLOADING"
 *   progress={45}
 *   message="Downloading binary... 12.5 MB / 28 MB"
 * />
 * ```
 */
export const UpdateProgressBar = React.memo<UpdateProgressBarProps>(
  ({ stage, progress, message, className }) => {
    const colorClass = STAGE_COLORS[stage];
    const progressPercent = Math.min(100, Math.max(0, progress));

    return (
      <div className={cn('w-full space-y-2', className)} role="status">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">{message}</span>
          <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${message} - ${Math.round(progressPercent)}%`}
        >
          <div
            className={cn(
              'h-full transition-all duration-300 ease-out',
              colorClass
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  }
);

UpdateProgressBar.displayName = 'UpdateProgressBar';
