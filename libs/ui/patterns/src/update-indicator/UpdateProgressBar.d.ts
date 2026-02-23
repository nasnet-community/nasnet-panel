/**
 * UpdateProgressBar Component
 * Real-time stage visualization for service updates (NAS-8.7)
 */
import * as React from 'react';
import type { UpdateStage } from '@nasnet/api-client/queries';
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
export declare const UpdateProgressBar: React.NamedExoticComponent<UpdateProgressBarProps>;
//# sourceMappingURL=UpdateProgressBar.d.ts.map