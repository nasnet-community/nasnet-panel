/**
 * useIsolationStatus Hook
 *
 * Headless hook for isolation status logic.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * All business logic is contained here - presenters only handle rendering.
 *
 * @module @nasnet/ui/patterns/isolation-status
 */

import { useMemo, useCallback, useState } from 'react';

import { IsolationSeverity } from '@nasnet/api-client/generated';
import { useSetResourceLimits } from '@nasnet/api-client/queries';

import type {
  UseIsolationStatusConfig,
  UseIsolationStatusReturn,
  IsolationHealth,
  ViolationDisplay,
} from './types';

/**
 * Health-to-color mapping using semantic design tokens
 */
export const HEALTH_COLORS = {
  healthy: 'success',
  warning: 'warning',
  critical: 'destructive',
  unknown: 'muted',
} as const;

/**
 * Health-to-icon mapping for lucide-react icons
 */
export const HEALTH_ICONS = {
  healthy: 'ShieldCheck',
  warning: 'ShieldAlert',
  critical: 'ShieldX',
  unknown: 'ShieldQuestion',
} as const;

/**
 * Human-readable labels for isolation health
 */
export const HEALTH_LABELS = {
  healthy: 'Isolated',
  warning: 'Warnings detected',
  critical: 'Critical violations',
  unknown: 'Unknown status',
} as const;

/**
 * Severity-to-color mapping
 */
export const SEVERITY_COLORS = {
  [IsolationSeverity.Error]: 'destructive',
  [IsolationSeverity.Warning]: 'warning',
  [IsolationSeverity.Info]: 'muted',
} as const;

/**
 * Layer-to-icon mapping
 */
export const LAYER_ICONS: Record<string, string> = {
  'IP Binding': 'Network',
  'Directory': 'FolderLock',
  'Port Registry': 'Webhook',
  'Process Binding': 'Activity',
};

/**
 * Layer-to-label mapping
 */
export const LAYER_LABELS: Record<string, string> = {
  'IP Binding': 'IP Binding',
  'Directory': 'Directory',
  'Port Registry': 'Port Registry',
  'Process Binding': 'Process',
};

/**
 * Calculate overall isolation health from violations
 */
function calculateHealth(violationCount: number, criticalCount: number): IsolationHealth {
  if (violationCount === 0) return 'healthy';
  if (criticalCount > 0) return 'critical';
  return 'warning';
}

/**
 * Format timestamp relative to now (e.g., "Checked 2 minutes ago")
 */
function formatTimestamp(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Checked just now';
  if (diffMinutes === 1) return 'Checked 1 minute ago';
  if (diffMinutes < 60) return `Checked ${diffMinutes} minutes ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return 'Checked 1 hour ago';
  if (diffHours < 24) return `Checked ${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Checked 1 day ago';
  return `Checked ${diffDays} days ago`;
}

/**
 * Enrich violation with display metadata
 */
function enrichViolation(violation: ViolationDisplay['violation']): ViolationDisplay {
  const color = SEVERITY_COLORS[violation.severity] ?? 'muted';
  const icon = LAYER_ICONS[violation.layer] ?? 'AlertCircle';
  const layerLabel = LAYER_LABELS[violation.layer] ?? violation.layer;

  return {
    violation,
    color,
    icon,
    layerLabel,
  };
}

/**
 * Headless hook for isolation status component.
 *
 * Encapsulates all logic for:
 * - Health calculation from violations
 * - Color and icon selection
 * - Timestamp formatting
 * - Violation enrichment with display metadata
 * - Resource limit editing
 * - ARIA label generation
 *
 * @param config - Configuration options
 * @returns Computed state for presenters
 *
 * @example
 * ```tsx
 * const state = useIsolationStatus({
 *   isolation: { checkedAt: '2026-02-13T10:00:00Z', violations: [], resourceLimits: {...} },
 *   instanceId: 'inst_123',
 *   routerId: 'router_456',
 *   onHealthChange: (health) => console.log('Health changed:', health),
 * });
 *
 * // state.health === 'healthy'
 * // state.color === 'success'
 * // state.ariaLabel === 'Isolated, no violations detected'
 * ```
 */
export function useIsolationStatus(
  config: UseIsolationStatusConfig
): UseIsolationStatusReturn {
  const {
    isolation,
    instanceId,
    routerId,
    onHealthChange,
    showResourceLimits = true,
    allowEdit = false,
  } = config;

  // Local state for refetch trigger
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Connect to resource limits mutation
  const [setLimitsMutation, { loading: isSaving }] = useSetResourceLimits();

  // Extract violations and count by severity
  const violations = useMemo(
    () => (isolation?.violations ?? []).map(enrichViolation),
    [isolation?.violations]
  );

  const violationCount = violations.length;
  const criticalCount = violations.filter((v: ViolationDisplay) => v.violation.severity === IsolationSeverity.Error).length;
  const warningCount = violations.filter((v: ViolationDisplay) => v.violation.severity === IsolationSeverity.Warning).length;

  // Calculate overall health
  const health: IsolationHealth = useMemo(
    () => (isolation ? calculateHealth(violationCount, criticalCount) : 'unknown'),
    [isolation, violationCount, criticalCount]
  );

  // Get semantic color for the health
  const color = HEALTH_COLORS[health];

  // Get icon name for the health
  const iconName = HEALTH_ICONS[health];

  // Get human-readable label
  const healthLabel = HEALTH_LABELS[health];

  // Format timestamp
  const timestamp = useMemo(
    () => formatTimestamp(isolation?.lastVerified),
    [isolation?.lastVerified, refetchTrigger] // Include refetchTrigger to update timestamp
  );

  // Extract resource limits
  const resourceLimits = isolation?.resourceLimits ?? null;

  // Handler for saving resource limits
  const handleSaveLimits = useCallback(async (limits: { memoryMB: number; cpuWeight?: number }) => {
    try {
      const result = await setLimitsMutation({
        variables: {
          input: {
            routerID: routerId,
            instanceID: instanceId,
            memoryMB: limits.memoryMB,
            cpuWeight: limits.cpuWeight,
          },
        },
      });

      if (result.data?.setResourceLimits.success) {
        // Success - mutation will refetch automatically
        onHealthChange?.(health);
      } else {
        console.error('Failed to save resource limits:', result.data?.setResourceLimits.errors);
      }
    } catch (error) {
      console.error('Failed to save resource limits:', error);
    }
  }, [routerId, instanceId, setLimitsMutation, health, onHealthChange]);

  // Handler for refreshing isolation status
  const handleRefresh = useCallback(async () => {
    // Trigger timestamp recalculation
    setRefetchTrigger(prev => prev + 1);
  }, []);

  // Build accessible ARIA label
  const ariaLabel = useMemo(() => {
    const parts: string[] = [healthLabel];

    if (violationCount > 0) {
      parts.push(`${violationCount} violation${violationCount !== 1 ? 's' : ''} detected`);
    } else {
      parts.push('no violations detected');
    }

    if (timestamp) {
      parts.push(timestamp);
    }

    return parts.join(', ');
  }, [healthLabel, violationCount, timestamp]);

  return {
    health,
    color,
    iconName,
    timestamp,
    violations,
    resourceLimits,
    isSaving,
    handleSaveLimits: handleSaveLimits as any,
    handleRefresh,
    ariaLabel,
    healthLabel,
    showResourceLimits,
    allowEdit,
    violationCount,
    criticalCount,
    warningCount,
  };
}
