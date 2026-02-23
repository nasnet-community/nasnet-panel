/**
 * WebhookConfigFormMobile - Mobile Presenter
 *
 * Touch-optimized webhook configuration form for mobile (<640px).
 * Features stacked layout, 44px minimum touch targets, and bottom sheet for test results.
 *
 * @module @nasnet/features/alerts/components
 * @see NAS-18.4: Webhook notification configuration
 */
import type { UseWebhookConfigFormReturn } from '../hooks/useWebhookConfigForm';
export interface WebhookConfigFormMobileProps {
    /** Headless hook instance */
    webhookForm: UseWebhookConfigFormReturn;
}
/**
 * Mobile presenter for webhook configuration form.
 * Stacked full-width inputs with 44px minimum touch targets.
 */
export declare function WebhookConfigFormMobile({ webhookForm }: WebhookConfigFormMobileProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=WebhookConfigFormMobile.d.ts.map