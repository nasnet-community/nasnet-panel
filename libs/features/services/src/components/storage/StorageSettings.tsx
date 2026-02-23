/**
 * StorageSettings Component
 * @description Platform-agnostic root component for external storage configuration.
 * Auto-detects viewport size and renders Mobile or Desktop presenter with optimized UX.
 *
 * @features
 * - Mobile (<640px): Stacked vertical layout, full-width buttons, 44px touch targets
 * - Desktop (>1024px): Two-column layout, dense tables, inline controls with hover states
 * - Progressive disclosure: Essential → Common (service breakdown) → Advanced (mount details)
 * - Real-time storage status and usage metrics
 * - Service-aware configuration (lists affected services on disconnect)
 *
 * @see NAS-8.20: External Storage Management
 * @see ADR-018: Headless + Platform Presenters Pattern
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import * as React from 'react';
import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';

import { StorageSettingsMobile } from './StorageSettingsMobile';
import { StorageSettingsDesktop } from './StorageSettingsDesktop';

/**
 * StorageSettings component props
 */
export interface StorageSettingsProps {
  /** Optional CSS class name for custom styling */
  className?: string;
}

/**
 * StorageSettings component
 * @description Auto-selects appropriate platform presenter (Mobile or Desktop) based on viewport
 * @param {StorageSettingsProps} props - Component props
 * @returns {React.ReactNode} Rendered storage settings presenter for active platform
 */
function StorageSettingsComponent({ className }: StorageSettingsProps) {
  const platform = usePlatform();

  return platform === 'mobile' ? (
    <StorageSettingsMobile className={className} />
  ) : (
    <StorageSettingsDesktop className={className} />
  );
}

export const StorageSettings = memo(StorageSettingsComponent);
StorageSettings.displayName = 'StorageSettings';
