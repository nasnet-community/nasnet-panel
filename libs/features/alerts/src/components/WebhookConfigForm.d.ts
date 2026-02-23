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
import { type UseWebhookConfigFormOptions } from '../hooks/useWebhookConfigForm';
export interface WebhookConfigFormProps extends UseWebhookConfigFormOptions {
    /** Optional className for wrapper */
    className?: string;
}
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
export declare const WebhookConfigForm: import("react").NamedExoticComponent<WebhookConfigFormProps>;
//# sourceMappingURL=WebhookConfigForm.d.ts.map