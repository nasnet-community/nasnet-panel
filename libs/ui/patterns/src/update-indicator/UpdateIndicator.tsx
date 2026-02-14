/**
 * UpdateIndicator Component
 * Main component with automatic platform detection (NAS-8.7)
 */

import * as React from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { UpdateIndicatorMobile } from './UpdateIndicatorMobile';
import { UpdateIndicatorDesktop } from './UpdateIndicatorDesktop';
import type { UpdateIndicatorProps } from './types';

/**
 * UpdateIndicator
 *
 * Main UpdateIndicator component with automatic platform detection.
 * Renders the appropriate presenter based on screen size.
 *
 * Platforms:
 * - Mobile (<640px): Bottom sheet with touch-optimized layout
 * - Desktop (>1024px): Inline badge with side popover
 *
 * @example
 * ```tsx
 * // Basic usage - no update available
 * <UpdateIndicator
 *   instanceId="tor-1"
 *   instanceName="Tor Proxy"
 *   currentVersion="1.0.0"
 *   latestVersion={null}
 *   updateAvailable={false}
 * />
 *
 * // Update available
 * <UpdateIndicator
 *   instanceId="tor-1"
 *   instanceName="Tor Proxy"
 *   currentVersion="1.0.0"
 *   latestVersion="1.1.0"
 *   updateAvailable={true}
 *   severity="SECURITY"
 *   securityFixes={true}
 *   requiresRestart={true}
 *   changelogUrl="https://github.com/torproject/tor/releases/tag/v1.1.0"
 *   releaseDate="2026-02-10T00:00:00Z"
 *   binarySize={28672000}
 *   onUpdate={(id) => triggerUpdate(id)}
 * />
 *
 * // Update in progress
 * <UpdateIndicator
 *   instanceId="tor-1"
 *   instanceName="Tor Proxy"
 *   currentVersion="1.0.0"
 *   latestVersion="1.1.0"
 *   updateAvailable={true}
 *   severity="SECURITY"
 *   isUpdating={true}
 *   updateStage="DOWNLOADING"
 *   updateProgress={45}
 *   updateMessage="Downloading binary... 12.5 MB / 28 MB"
 * />
 *
 * // Update failed
 * <UpdateIndicator
 *   instanceId="tor-1"
 *   instanceName="Tor Proxy"
 *   currentVersion="1.0.0"
 *   latestVersion="1.1.0"
 *   updateAvailable={true}
 *   severity="SECURITY"
 *   updateFailed={true}
 *   updateError="Checksum verification failed"
 *   onRollback={(id) => rollbackUpdate(id)}
 * />
 * ```
 */
export const UpdateIndicator = React.memo<UpdateIndicatorProps>((props) => {
  const platform = usePlatform();

  return platform === 'mobile' ? (
    <UpdateIndicatorMobile {...props} />
  ) : (
    <UpdateIndicatorDesktop {...props} />
  );
});

UpdateIndicator.displayName = 'UpdateIndicator';
