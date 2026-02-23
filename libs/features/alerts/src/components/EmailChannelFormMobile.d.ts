/**
 * EmailChannelFormMobile - Mobile Presenter
 *
 * Touch-optimized email configuration form for mobile (<640px).
 * Features single-column layout, 44px touch targets, and simplified UI.
 *
 * @module @nasnet/features/alerts/components
 * @see NAS-18.3: Email notification configuration
 * @description Renders a mobile-optimized email channel configuration form with
 * collapsible sections, 44px minimum touch targets, and full-screen actions.
 */
import type { UseEmailChannelFormReturn } from '../hooks/useEmailChannelForm';
export interface EmailChannelFormMobileProps {
    /** Headless hook instance */
    emailForm: UseEmailChannelFormReturn;
    /** Optional CSS class name for wrapper */
    className?: string;
}
/**
 * Mobile presenter for email channel configuration.
 * Optimized for touch with 44px minimum targets and collapsible sections.
 */
export declare const EmailChannelFormMobile: import("react").NamedExoticComponent<EmailChannelFormMobileProps>;
//# sourceMappingURL=EmailChannelFormMobile.d.ts.map