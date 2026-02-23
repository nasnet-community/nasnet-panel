/**
 * UpdateAllPanel Component (NAS-8.7)
 * Aggregate view of pending updates with bulk update functionality
 */
import * as React from 'react';
import type { AvailableUpdate } from '@nasnet/api-client/queries';
export interface UpdateAllPanelProps {
    /** Available updates for all instances */
    updates: AvailableUpdate[];
    /** Callback when "Update All" is clicked */
    onUpdateAll?: () => void;
    /** Callback when individual update is clicked */
    onUpdate?: (instanceId: string) => void;
    /** Map of instances currently updating */
    updatingInstances?: Record<string, boolean>;
    /** Map of update progress per instance */
    updateProgress?: Record<string, number>;
    /** Whether the panel is in loading state */
    loading?: boolean;
    /** Additional CSS class */
    className?: string;
}
/**
 * UpdateAllPanel
 *
 * Displays aggregate view of pending updates:
 * - Grouped by severity
 * - Total update count
 * - "Update All" action with confirmation
 * - Per-instance progress tracking
 * - Sequential update execution (one at a time)
 *
 * @example
 * ```tsx
 * <UpdateAllPanel
 *   updates={availableUpdates}
 *   onUpdateAll={() => updateAllInstances()}
 *   onUpdate={(id) => updateInstance(id)}
 *   updatingInstances={updatingMap}
 *   updateProgress={progressMap}
 * />
 * ```
 */
export declare const UpdateAllPanel: React.NamedExoticComponent<UpdateAllPanelProps>;
//# sourceMappingURL=UpdateAllPanel.d.ts.map