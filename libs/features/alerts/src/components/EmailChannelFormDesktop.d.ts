/**
 * EmailChannelFormDesktop - Desktop Presenter
 *
 * Dense, pro-grade email configuration form for desktop (>1024px).
 * Features two-column layout, inline validation, and keyboard shortcuts.
 *
 * @module @nasnet/features/alerts/components
 * @see NAS-18.3: Email notification configuration
 * @description Renders a desktop-optimized email channel configuration form with
 * two-column grid layout, port presets, recipient chip management, and TLS settings.
 */
import type { UseEmailChannelFormReturn } from '../hooks/useEmailChannelForm';
export interface EmailChannelFormDesktopProps {
    /** Headless hook instance */
    emailForm: UseEmailChannelFormReturn;
    /** Optional CSS class name for wrapper */
    className?: string;
}
/**
 * Desktop presenter for email channel configuration.
 * Optimized for pro users with dense two-column layout.
 */
export declare const EmailChannelFormDesktop: import("react").NamedExoticComponent<EmailChannelFormDesktopProps>;
//# sourceMappingURL=EmailChannelFormDesktop.d.ts.map