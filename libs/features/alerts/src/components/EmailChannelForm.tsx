/**
 * EmailChannelForm - Platform Detector
 *
 * Auto-detects platform (Mobile/Desktop) and renders the appropriate presenter.
 * Follows Headless + Platform Presenter pattern from PLATFORM_PRESENTER_GUIDE.md
 *
 * @module @nasnet/features/alerts/components
 * @see NAS-18.3: Email notification configuration with Platform Presenters
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import { memo } from 'react';
import { useMediaQuery } from '@nasnet/ui/primitives';
import { useEmailChannelForm, type UseEmailChannelFormOptions } from '../hooks/useEmailChannelForm';
import { EmailChannelFormDesktop } from './EmailChannelFormDesktop';
import { EmailChannelFormMobile } from './EmailChannelFormMobile';

// ============================================================================
// Types
// ============================================================================

export interface EmailChannelFormProps extends UseEmailChannelFormOptions {
  /** Optional className for wrapper */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Email channel configuration form with Platform Presenter pattern.
 *
 * Automatically detects platform and renders:
 * - Mobile (<640px): Touch-optimized, single-column, accordion sections
 * - Desktop (≥640px): Dense two-column layout, collapsible advanced settings
 *
 * @example
 * ```tsx
 * <EmailChannelForm
 *   initialConfig={existingConfig}
 *   onSubmit={async (config) => {
 *     await saveEmailConfig(config);
 *   }}
 *   onTest={async (config) => {
 *     await testEmailNotification(config);
 *   }}
 * />
 * ```
 */
export const EmailChannelForm = memo(function EmailChannelForm(props: EmailChannelFormProps) {
  const { className, ...hookOptions } = props;

  // Platform detection (mobile: <640px)
  const isMobile = useMediaQuery('(max-width: 640px)');

  // Initialize headless hook
  const emailForm = useEmailChannelForm(hookOptions);

  // Render appropriate presenter
  return (
    <div className={className}>
      {isMobile ? (
        <EmailChannelFormMobile emailForm={emailForm} />
      ) : (
        <EmailChannelFormDesktop emailForm={emailForm} />
      )}
    </div>
  );
});
