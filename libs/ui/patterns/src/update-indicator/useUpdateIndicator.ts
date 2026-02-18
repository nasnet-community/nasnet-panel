/**
 * UpdateIndicator Headless Hook
 *
 * Provides all logic and state for update indicator visualization.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Responsibilities:
 * - Determine update status (no update, minor, major, security)
 * - Map severity to semantic colors
 * - Format version strings
 * - Calculate time since release
 * - Provide accessibility attributes
 * - Handle user interactions (update, rollback, view changelog)
 */

import { useMemo, useCallback } from 'react';

import type { UpdateSeverity, UpdateStage } from '@nasnet/api-client/queries';

import type { UpdateIndicatorProps, SeverityConfig, StageConfig } from './types';

// ===== Constants =====

/**
 * Severity configuration mapping
 * Uses semantic color tokens (Tier 2)
 */
const SEVERITY_CONFIG: Record<UpdateSeverity, SeverityConfig> = {
  SECURITY: {
    label: 'Security Update',
    color: 'error',
    bgColor: 'bg-error/10',
    textColor: 'text-error',
    icon: 'shield-alert',
    priority: 4,
  },
  MAJOR: {
    label: 'Major Update',
    color: 'warning',
    bgColor: 'bg-warning/10',
    textColor: 'text-warning',
    icon: 'arrow-up-circle',
    priority: 3,
  },
  MINOR: {
    label: 'Minor Update',
    color: 'info',
    bgColor: 'bg-info/10',
    textColor: 'text-info',
    icon: 'arrow-up',
    priority: 2,
  },
  PATCH: {
    label: 'Patch Update',
    color: 'success',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
    icon: 'check-circle',
    priority: 1,
  },
};

/**
 * Update stage configuration
 */
const STAGE_CONFIG: Record<UpdateStage, StageConfig> = {
  PENDING: { label: 'Initializing...', icon: 'clock', color: 'neutral' },
  DOWNLOADING: { label: 'Downloading...', icon: 'download', color: 'info' },
  VERIFYING: { label: 'Verifying...', icon: 'shield-check', color: 'info' },
  STOPPING: { label: 'Stopping service...', icon: 'pause-circle', color: 'warning' },
  INSTALLING: { label: 'Installing...', icon: 'package', color: 'info' },
  STARTING: { label: 'Starting service...', icon: 'play-circle', color: 'info' },
  HEALTH_CHECK: { label: 'Health check...', icon: 'activity', color: 'info' },
  COMPLETE: { label: 'Complete', icon: 'check-circle', color: 'success' },
  FAILED: { label: 'Failed', icon: 'x-circle', color: 'error' },
  ROLLED_BACK: { label: 'Rolled back', icon: 'rotate-ccw', color: 'warning' },
};

// ===== Hook State Interface =====

/**
 * State returned by useUpdateIndicator hook
 */
export interface UseUpdateIndicatorReturn {
  /**
   * Whether an update is available
   */
  hasUpdate: boolean;

  /**
   * Update severity configuration
   */
  severityConfig: SeverityConfig | null;

  /**
   * Current update stage configuration
   */
  stageConfig: StageConfig | null;

  /**
   * Formatted current version string
   */
  currentVersionText: string;

  /**
   * Formatted latest version string
   */
  latestVersionText: string;

  /**
   * Version change description (e.g., "1.0.0 → 1.1.0")
   */
  versionChangeText: string;

  /**
   * Human-readable time since release
   */
  releaseDateText: string | null;

  /**
   * Formatted binary size (e.g., "12.5 MB")
   */
  binarySizeText: string | null;

  /**
   * Whether "Update" button should be disabled
   */
  updateDisabled: boolean;

  /**
   * Whether "Rollback" button should be visible
   */
  showRollback: boolean;

  /**
   * Whether progress bar should be visible
   */
  showProgress: boolean;

  /**
   * Current progress percentage (0-100)
   */
  progressPercent: number;

  /**
   * Progress message
   */
  progressMessage: string;

  /**
   * Whether update is in terminal state (complete/failed/rolled back)
   */
  isTerminalState: boolean;

  /**
   * ARIA label for screen readers
   */
  ariaLabel: string;

  /**
   * Handle update button click
   */
  handleUpdate: () => void;

  /**
   * Handle rollback button click
   */
  handleRollback: () => void;

  /**
   * Handle view changelog button click
   */
  handleViewChangelog: () => void;
}

// ===== Helper Functions =====

/**
 * Format version string with "v" prefix
 */
function formatVersion(version: string): string {
  return version.startsWith('v') ? version : `v${version}`;
}

/**
 * Format byte size to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format release date to relative time
 */
function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// ===== Hook Implementation =====

/**
 * Headless hook for update indicator state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * @example
 * ```tsx
 * function UpdateIndicatorMobile(props: UpdateIndicatorProps) {
 *   const state = useUpdateIndicator(props);
 *
 *   if (!state.hasUpdate) return null;
 *
 *   return (
 *     <div aria-label={state.ariaLabel}>
 *       <Badge className={state.severityConfig?.bgColor}>
 *         {state.severityConfig?.label}
 *       </Badge>
 *       <p>{state.versionChangeText}</p>
 *       <Button onClick={state.handleUpdate} disabled={state.updateDisabled}>
 *         Update
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUpdateIndicator(
  props: UpdateIndicatorProps
): UseUpdateIndicatorReturn {
  const {
    instanceId,
    instanceName,
    currentVersion,
    latestVersion,
    updateAvailable,
    severity,
    requiresRestart,
    breakingChanges,
    securityFixes,
    changelogUrl,
    releaseDate,
    binarySize,
    onUpdate,
    onRollback,
    onViewChangelog,
    isUpdating = false,
    updateStage,
    updateProgress = 0,
    updateMessage = '',
    updateFailed = false,
    wasRolledBack = false,
    updateError,
  } = props;

  // Severity configuration (memoized)
  const severityConfig = useMemo(() => {
    return severity ? SEVERITY_CONFIG[severity] : null;
  }, [severity]);

  // Stage configuration (memoized)
  const stageConfig = useMemo(() => {
    return updateStage ? STAGE_CONFIG[updateStage] : null;
  }, [updateStage]);

  // Format version strings
  const currentVersionText = formatVersion(currentVersion);
  const latestVersionText = latestVersion ? formatVersion(latestVersion) : '';
  const versionChangeText = latestVersion
    ? `${currentVersionText} → ${latestVersionText}`
    : currentVersionText;

  // Format release date
  const releaseDateText = useMemo(
    () => (releaseDate ? formatRelativeTime(releaseDate) : null),
    [releaseDate]
  );

  // Format binary size
  const binarySizeText = useMemo(
    () => (binarySize ? formatBytes(binarySize) : null),
    [binarySize]
  );

  // Determine button states
  const updateDisabled = isUpdating || !updateAvailable;
  const showRollback = wasRolledBack || updateFailed;
  const showProgress = isUpdating;
  const progressPercent = updateProgress;
  const progressMessage = updateMessage;

  // Determine if in terminal state
  const isTerminalState = useMemo(
    () =>
      updateStage === 'COMPLETE' ||
      updateStage === 'FAILED' ||
      updateStage === 'ROLLED_BACK',
    [updateStage]
  );

  // Build ARIA label
  const ariaLabel = useMemo(() => {
    if (isUpdating) {
      return `Updating ${instanceName}: ${stageConfig?.label || 'In progress'} (${progressPercent}%)`;
    }
    if (wasRolledBack) {
      return `${instanceName} update was rolled back: ${updateError || 'Health check failed'}`;
    }
    if (updateFailed) {
      return `${instanceName} update failed: ${updateError}`;
    }
    if (updateAvailable && severityConfig) {
      return `${severityConfig.label} available for ${instanceName}: ${versionChangeText}`;
    }
    return `${instanceName} is up to date at ${currentVersionText}`;
  }, [
    isUpdating,
    wasRolledBack,
    updateFailed,
    updateAvailable,
    instanceName,
    severityConfig,
    versionChangeText,
    currentVersionText,
    stageConfig,
    progressPercent,
    updateError,
  ]);

  // Callbacks
  const handleUpdate = useCallback(() => {
    if (onUpdate && !updateDisabled) {
      onUpdate(instanceId);
    }
  }, [onUpdate, instanceId, updateDisabled]);

  const handleRollback = useCallback(() => {
    if (onRollback) {
      onRollback(instanceId);
    }
  }, [onRollback, instanceId]);

  const handleViewChangelog = useCallback(() => {
    if (onViewChangelog && changelogUrl) {
      onViewChangelog(changelogUrl);
    }
  }, [onViewChangelog, changelogUrl]);

  return {
    hasUpdate: updateAvailable,
    severityConfig,
    stageConfig,
    currentVersionText,
    latestVersionText,
    versionChangeText,
    releaseDateText,
    binarySizeText,
    updateDisabled,
    showRollback,
    showProgress,
    progressPercent,
    progressMessage,
    isTerminalState,
    ariaLabel,
    handleUpdate,
    handleRollback,
    handleViewChangelog,
  };
}
