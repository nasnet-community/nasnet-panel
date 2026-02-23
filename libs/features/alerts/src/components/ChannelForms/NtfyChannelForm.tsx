/**
 * NtfyChannelForm - Platform Detector
 *
 * @description
 * Auto-detects platform (Mobile/Desktop) and renders the appropriate presenter.
 * Follows Headless + Platform Presenter pattern from PLATFORM_PRESENTER_GUIDE.md
 *
 * @module @nasnet/features/alerts/components/ChannelForms
 * @see NAS-18.X: Ntfy.sh notification configuration with Platform Presenters
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { useNtfyChannelForm, type UseNtfyChannelFormOptions } from '../../hooks/useNtfyChannelForm';
import { NtfyChannelFormDesktop } from './NtfyChannelFormDesktop';
import { NtfyChannelFormMobile } from './NtfyChannelFormMobile';

// ============================================================================
// Types
// ============================================================================

export interface NtfyChannelFormProps extends UseNtfyChannelFormOptions {
  /** Optional className for wrapper */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Ntfy.sh channel configuration form with Platform Presenter pattern.
 *
 * Automatically detects platform and renders:
 * - Mobile (<640px): Touch-optimized, single-column, accordion sections
 * - Desktop (≥640px): Dense two-column layout, collapsible advanced settings
 *
 * @example
 * ```tsx
 * <NtfyChannelForm
 *   initialConfig={existingConfig}
 *   onSubmit={async (config) => {
 *     await saveNtfyConfig(config);
 *   }}
 *   onTest={async (config) => {
 *     await testNtfyNotification(config);
 *   }}
 * />
 * ```
 */
function NtfyChannelFormComponent(props: NtfyChannelFormProps) {
  const { className, ...hookOptions } = props;

  // Platform detection
  const platform = usePlatform();

  // Initialize headless hook
  const ntfyForm = useNtfyChannelForm(hookOptions);

  // Render appropriate presenter
  return (
    <div className={className}>
      {platform === 'mobile' ? (
        <NtfyChannelFormMobile ntfyForm={ntfyForm} />
      ) : (
        <NtfyChannelFormDesktop ntfyForm={ntfyForm} />
      )}
    </div>
  );
}

export const NtfyChannelForm = memo(NtfyChannelFormComponent);
NtfyChannelForm.displayName = 'NtfyChannelForm';
