/**
 * WebhookConfigFormDesktop - Desktop Presenter
 *
 * Dense, pro-grade webhook configuration form for desktop (≥640px).
 * Features two-column layout, inline test results, and code editor for custom templates.
 *
 * @module @nasnet/features/alerts/components
 * @see NAS-18.4: Webhook notification configuration
 * @description Renders a desktop-optimized webhook configuration form with
 * dense 2-column layout, advanced header management, template selector, and signing secret dialog.
 */
import type { UseWebhookConfigFormReturn } from '../hooks/useWebhookConfigForm';
export interface WebhookConfigFormDesktopProps {
    /** Headless hook instance */
    webhookForm: UseWebhookConfigFormReturn;
    /** Optional CSS class name for wrapper */
    className?: string;
}
export declare const WebhookConfigFormDesktop: import("react").NamedExoticComponent<WebhookConfigFormDesktopProps>;
//# sourceMappingURL=WebhookConfigFormDesktop.d.ts.map