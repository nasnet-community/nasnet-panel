/**
 * EmailChannelForm - Platform Detector
 *
 * Auto-detects platform (Mobile/Desktop) and renders the appropriate presenter.
 * Follows Headless + Platform Presenter pattern from PLATFORM_PRESENTER_GUIDE.md
 *
 * @description Renders email configuration form optimized for each platform
 * @example
 * // Basic usage with callbacks
 * <EmailChannelForm
 *   initialConfig={existingConfig}
 *   onSubmit={handleSave}
 *   onTest={handleTest}
 * />
 *
 * // With custom styling
 * <EmailChannelForm
 *   initialConfig={config}
 *   onSubmit={handleSave}
 *   className="p-4"
 * />
 *
 * @see useEmailChannelForm
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */
import { type UseEmailChannelFormOptions } from '../hooks/useEmailChannelForm';
/**
 * @interface EmailChannelFormProps
 * @description Props for EmailChannelForm platform detector
 */
interface EmailChannelFormProps extends UseEmailChannelFormOptions {
    /** Optional CSS className for custom styling */
    className?: string;
    /** Optional platform override ('mobile' | 'desktop') */
    presenter?: 'mobile' | 'desktop';
}
/**
 * Email channel configuration form with automatic platform detection.
 *
 * Detects viewport width and renders optimized presenter:
 * - Mobile (<640px): Touch-optimized single-column with accordion sections
 * - Desktop (≥640px): Dense two-column layout with collapsible advanced settings
 *
 * All form state managed in headless hook. Presenters handle rendering only.
 *
 * @component
 * @example
 * return (
 *   <EmailChannelForm
 *     initialConfig={config}
 *     onSubmit={handleSave}
 *     onTest={handleTest}
 *   />
 * );
 */
declare const EmailChannelForm: import("react").NamedExoticComponent<EmailChannelFormProps>;
export { EmailChannelForm };
export type { EmailChannelFormProps };
//# sourceMappingURL=EmailChannelForm.d.ts.map