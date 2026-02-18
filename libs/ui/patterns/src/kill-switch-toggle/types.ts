/**
 * Kill Switch Toggle Types
 *
 * Type definitions for the Kill Switch Toggle pattern component.
 */

import type { KillSwitchStatus } from '@nasnet/api-client/queries';

/**
 * Kill switch mode (from GraphQL enum)
 */
export type KillSwitchMode = 'BLOCK_ALL' | 'ALLOW_DIRECT' | 'FALLBACK_SERVICE';

/**
 * Virtual interface option for fallback service
 */
export interface VirtualInterfaceOption {
  id: string;
  label: string;
  instanceName: string;
}

/**
 * Props for KillSwitchToggle component
 */
export interface KillSwitchToggleProps {
  /**
   * Router ID
   */
  routerId: string;

  /**
   * Device ID whose routing has kill switch
   */
  deviceId: string;

  /**
   * Device name (for display)
   */
  deviceName?: string;

  /**
   * Available virtual interfaces for fallback option
   */
  availableInterfaces?: VirtualInterfaceOption[];

  /**
   * Callback when kill switch is toggled
   */
  onToggle?: (enabled: boolean) => void;

  /**
   * Callback when configuration changes
   */
  onChange?: (mode: KillSwitchMode, fallbackInterfaceId?: string) => void;

  /**
   * Whether the component is disabled
   */
  disabled?: boolean;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * State returned by useKillSwitchToggle hook
 */
export interface UseKillSwitchToggleReturn {
  /**
   * Current kill switch status
   */
  status: KillSwitchStatus | undefined;

  /**
   * Whether data is loading
   */
  isLoading: boolean;

  /**
   * Error if any
   */
  error: Error | undefined;

  /**
   * Current enabled state
   */
  enabled: boolean;

  /**
   * Current mode
   */
  mode: KillSwitchMode;

  /**
   * Whether kill switch is currently active (blocking traffic)
   */
  isActive: boolean;

  /**
   * Selected fallback interface ID
   */
  fallbackInterfaceId: string | undefined;

  /**
   * Toggle kill switch on/off
   */
  handleToggle: () => Promise<void>;

  /**
   * Change kill switch mode
   */
  handleModeChange: (mode: KillSwitchMode) => Promise<void>;

  /**
   * Change fallback interface
   */
  handleFallbackChange: (interfaceId: string) => Promise<void>;

  /**
   * Whether mutation is in progress
   */
  isSaving: boolean;

  /**
   * Available virtual interfaces
   */
  availableInterfaces: VirtualInterfaceOption[];

  /**
   * Whether fallback interface selection should be shown
   */
  showFallbackSelector: boolean;

  /**
   * Status badge text
   */
  statusText: string;

  /**
   * Status badge color
   */
  statusColor: 'success' | 'warning' | 'error' | 'default';

  /**
   * Formatted activation time
   */
  activationTimeText: string | undefined;
}
