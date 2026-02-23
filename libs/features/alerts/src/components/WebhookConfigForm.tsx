/**
 * WebhookConfigForm - Platform Detector
 *
 * Auto-detects platform (Mobile/Desktop) and renders the appropriate presenter.
 * Follows Headless + Platform Presenter pattern from PLATFORM_PRESENTER_GUIDE.md
 *
 * @module @nasnet/features/alerts/components
 * @see NAS-18.4: Webhook notification configuration with Platform Presenters
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 * @description Renders a webhook configuration form with automatic platform detection
 * (mobile <640px vs desktop), platform-specific UI optimization, and signing secret management.
 */

import { memo } from 'react';
import { useMediaQuery } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import {
  useWebhookConfigForm,
  type UseWebhookConfigFormOptions,
} from '../hooks/useWebhookConfigForm';
import { WebhookConfigFormDesktop } from './WebhookConfigFormDesktop';
import { WebhookConfigFormMobile } from './WebhookConfigFormMobile';

// ============================================================================
// Types
// ============================================================================

export interface WebhookConfigFormProps extends UseWebhookConfigFormOptions {
  /** Optional className for wrapper */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Webhook configuration form with Platform Presenter pattern.
 *
 * Automatically detects platform and renders:
 * - Mobile (<640px): Touch-optimized, single-column, 44px targets, bottom sheet
 * - Desktop (≥640px): Dense two-column layout, inline test results, code editor
 *
 * Shows signing secret in success dialog (ONE TIME ONLY after creation).
 *
 * @example
 * ```tsx
 * // Create mode
 * <WebhookConfigForm
 *   onSuccess={(webhook, signingSecret) => {
 *     if (signingSecret) {
 *       alert(`Save this secret: ${signingSecret}`);
 *     }
 *   }}
 * />
 *
 * // Edit mode
 * <WebhookConfigForm
 *   webhook={existingWebhook}
 *   onSuccess={(webhook) => {
 *     console.log('Updated:', webhook);
 *   }}
 * />
 * ```
 */
export const WebhookConfigForm = memo(function WebhookConfigForm(props: WebhookConfigFormProps) {
  const { className, ...hookOptions } = props;

  // Platform detection (mobile: <640px)
  const isMobile = useMediaQuery('(max-width: 640px)');

  // Initialize headless hook
  const webhookForm = useWebhookConfigForm(hookOptions);

  // Render appropriate presenter
  return (
    <div className={cn(className)}>
      {isMobile ? (
        <WebhookConfigFormMobile webhookForm={webhookForm} />
      ) : (
        <WebhookConfigFormDesktop webhookForm={webhookForm} />
      )}
    </div>
  );
});

WebhookConfigForm.displayName = 'WebhookConfigForm';
