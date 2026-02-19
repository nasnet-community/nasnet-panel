/**
 * StorageSettings Component
 * Platform-agnostic storage configuration UI
 *
 * Auto-detects platform and renders appropriate presenter:
 * - Mobile (<640px): Stacked vertical layout, 44px touch targets
 * - Desktop (>1024px): Two-column layout, dense data tables
 *
 * @see NAS-8.20: External Storage Management
 * @see ADR-018: Headless + Platform Presenters Pattern
 */

import * as React from 'react';
import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';

import { StorageSettingsMobile } from './StorageSettingsMobile';
import { StorageSettingsDesktop } from './StorageSettingsDesktop';

/**
 * StorageSettings props
 */
export interface StorageSettingsProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * StorageSettings component
 * Auto-selects platform-specific presenter based on viewport
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
