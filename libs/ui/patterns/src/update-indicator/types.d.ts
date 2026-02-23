/**
 * UpdateIndicator Types
 * Service update indicator component types (NAS-8.7)
 */
import type { UpdateSeverity, UpdateStage } from '@nasnet/api-client/queries';
/**
 * Props for UpdateIndicator component
 */
export interface UpdateIndicatorProps {
    /** Service instance ID */
    instanceId: string;
    /** Service instance name for display */
    instanceName: string;
    /** Current version */
    currentVersion: string;
    /** Latest available version (null if no update) */
    latestVersion: string | null;
    /** Whether an update is available */
    updateAvailable: boolean;
    /** Update severity (SECURITY, MAJOR, MINOR, PATCH) */
    severity?: UpdateSeverity;
    /** Whether update requires service restart */
    requiresRestart?: boolean;
    /** Whether update has breaking changes */
    breakingChanges?: boolean;
    /** Whether update includes security fixes */
    securityFixes?: boolean;
    /** Changelog URL */
    changelogUrl?: string;
    /** Release date (ISO string) */
    releaseDate?: string;
    /** Binary size in bytes */
    binarySize?: number;
    /** Callback when user clicks "Update" */
    onUpdate?: (instanceId: string) => void;
    /** Callback when user clicks "Rollback" */
    onRollback?: (instanceId: string) => void;
    /** Callback when user clicks "View Changelog" */
    onViewChangelog?: (url: string) => void;
    /** Whether update is currently in progress */
    isUpdating?: boolean;
    /** Current update stage (if updating) */
    updateStage?: UpdateStage;
    /** Current update progress (0-100) */
    updateProgress?: number;
    /** Current update message */
    updateMessage?: string;
    /** Whether update failed */
    updateFailed?: boolean;
    /** Whether update was rolled back */
    wasRolledBack?: boolean;
    /** Update error message */
    updateError?: string;
    /** Optional CSS class name */
    className?: string;
}
/**
 * Severity display configuration
 */
export interface SeverityConfig {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    icon: string;
    priority: number;
}
/**
 * Stage display configuration
 */
export interface StageConfig {
    label: string;
    icon: string;
    color: string;
}
//# sourceMappingURL=types.d.ts.map