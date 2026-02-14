/**
 * Kill Switch Toggle Headless Hook
 *
 * Provides all logic and state for kill switch toggle component.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Responsibilities:
 * - Fetch kill switch status
 * - Handle enable/disable toggle
 * - Handle mode changes
 * - Handle fallback interface selection
 * - Calculate derived state (status text, colors, etc.)
 */

import { useState, useMemo, useCallback } from 'react';
import {
  useKillSwitchStatus,
  useSetKillSwitch,
} from '@nasnet/api-client/queries/services';
import type {
  KillSwitchToggleProps,
  UseKillSwitchToggleReturn,
  KillSwitchMode,
} from './types';

/**
 * Format timestamp for display
 */
function formatActivationTime(timestamp: string | null | undefined): string | undefined {
  if (!timestamp) return undefined;

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return undefined;
  }
}

/**
 * Get status text and color based on kill switch state
 */
function getStatusDisplay(
  enabled: boolean,
  active: boolean
): { text: string; color: 'success' | 'warning' | 'error' | 'default' } {
  if (!enabled) {
    return { text: 'Disabled', color: 'default' };
  }

  if (active) {
    return { text: 'Active (Blocking)', color: 'error' };
  }

  return { text: 'Enabled (Standby)', color: 'success' };
}

/**
 * Headless hook for kill switch toggle state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * @example
 * ```tsx
 * function KillSwitchToggleDesktop(props: KillSwitchToggleProps) {
 *   const state = useKillSwitchToggle(props);
 *
 *   return (
 *     <div>
 *       <Switch checked={state.enabled} onChange={state.handleToggle} />
 *       <Select value={state.mode} onChange={state.handleModeChange}>
 *         <option value="BLOCK_ALL">Block All</option>
 *         <option value="ALLOW_DIRECT">Allow Direct</option>
 *         <option value="FALLBACK_SERVICE">Fallback Service</option>
 *       </Select>
 *     </div>
 *   );
 * }
 * ```
 */
export function useKillSwitchToggle(
  props: KillSwitchToggleProps
): UseKillSwitchToggleReturn {
  const {
    routerId,
    deviceId,
    availableInterfaces = [],
    onToggle,
    onChange,
  } = props;

  // Fetch kill switch status
  const { status, loading: isLoading, error } = useKillSwitchStatus(routerId, deviceId);

  // Set kill switch mutation
  const [setKillSwitch, { loading: isSaving }] = useSetKillSwitch();

  // Local state for optimistic updates
  const [localMode, setLocalMode] = useState<KillSwitchMode | null>(null);
  const [localFallbackId, setLocalFallbackId] = useState<string | null>(null);

  // Current values (prefer local optimistic state, fallback to server state)
  const enabled = status?.enabled ?? false;
  const mode = (localMode ?? status?.mode ?? 'BLOCK_ALL') as KillSwitchMode;
  const isActive = status?.active ?? false;
  const fallbackInterfaceId = localFallbackId ?? status?.fallbackInterfaceID ?? undefined;

  // Derived state
  const showFallbackSelector = mode === 'FALLBACK_SERVICE';
  const { text: statusText, color: statusColor } = getStatusDisplay(enabled, isActive);
  const activationTimeText = formatActivationTime(status?.lastActivatedAt);

  // Handle toggle
  const handleToggle = useCallback(async () => {
    try {
      await setKillSwitch({
        routerID: routerId,
        deviceID: deviceId,
        enabled: !enabled,
        mode,
        fallbackInterfaceID: fallbackInterfaceId,
      });

      onToggle?.(!enabled);
    } catch (err) {
      // Error handled by mutation hook
      console.error('Failed to toggle kill switch:', err);
    }
  }, [routerId, deviceId, enabled, mode, fallbackInterfaceId, setKillSwitch, onToggle]);

  // Handle mode change
  const handleModeChange = useCallback(
    async (newMode: KillSwitchMode) => {
      setLocalMode(newMode);

      try {
        await setKillSwitch({
          routerID: routerId,
          deviceID: deviceId,
          enabled,
          mode: newMode,
          fallbackInterfaceID:
            newMode === 'FALLBACK_SERVICE' ? fallbackInterfaceId : undefined,
        });

        onChange?.(newMode, fallbackInterfaceId);
        setLocalMode(null); // Clear optimistic state
      } catch (err) {
        console.error('Failed to change kill switch mode:', err);
        setLocalMode(null); // Revert optimistic state
      }
    },
    [routerId, deviceId, enabled, fallbackInterfaceId, setKillSwitch, onChange]
  );

  // Handle fallback interface change
  const handleFallbackChange = useCallback(
    async (interfaceId: string) => {
      setLocalFallbackId(interfaceId);

      try {
        await setKillSwitch({
          routerID: routerId,
          deviceID: deviceId,
          enabled,
          mode,
          fallbackInterfaceID: interfaceId,
        });

        onChange?.(mode, interfaceId);
        setLocalFallbackId(null); // Clear optimistic state
      } catch (err) {
        console.error('Failed to change fallback interface:', err);
        setLocalFallbackId(null); // Revert optimistic state
      }
    },
    [routerId, deviceId, enabled, mode, setKillSwitch, onChange]
  );

  return {
    status,
    isLoading,
    error,
    enabled,
    mode,
    isActive,
    fallbackInterfaceId,
    handleToggle,
    handleModeChange,
    handleFallbackChange,
    isSaving,
    availableInterfaces,
    showFallbackSelector,
    statusText,
    statusColor,
    activationTimeText,
  };
}
