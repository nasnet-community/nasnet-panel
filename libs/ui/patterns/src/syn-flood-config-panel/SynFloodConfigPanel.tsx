/**
 * SynFloodConfigPanel Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * const configHook = useSynFloodConfigPanel({
 *   initialConfig: currentConfig,
 *   onSubmit: async (config) => {
 *     await updateConfigMutation(config);
 *   },
 * });
 *
 * <SynFloodConfigPanel
 *   configHook={configHook}
 *   loading={isLoading}
 * />
 * ```
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { SynFloodConfigPanelDesktop } from './SynFloodConfigPanelDesktop';
import { SynFloodConfigPanelMobile } from './SynFloodConfigPanelMobile';

import type { UseSynFloodConfigPanelReturn } from './use-syn-flood-config-panel';

export interface SynFloodConfigPanelProps {
  /** Config hook return value */
  configHook: UseSynFloodConfigPanelReturn;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

/**
 * SynFloodConfigPanel - Configure SYN flood protection
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Touch-friendly with 44px targets, stacked layout
 * - Tablet/Desktop (>=640px): Compact form with sliders and dropdowns
 *
 * Features:
 * - React Hook Form + Zod validation
 * - Master toggle with dangerous confirmation
 * - SYN limit slider (1-10,000 packets/second)
 * - Burst slider (1-1,000)
 * - Action selector (drop/tarpit)
 * - Quick presets (Very Strict, Strict, Moderate, Relaxed)
 * - Warning for low limits (< 100/s)
 * - Preview text showing effective configuration
 */
function SynFloodConfigPanelComponent(props: SynFloodConfigPanelProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <SynFloodConfigPanelMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <SynFloodConfigPanelDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const SynFloodConfigPanel = memo(SynFloodConfigPanelComponent);

// Set display name for React DevTools
SynFloodConfigPanel.displayName = 'SynFloodConfigPanel';
