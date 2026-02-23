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
import { type UseNtfyChannelFormOptions } from '../../hooks/useNtfyChannelForm';
export interface NtfyChannelFormProps extends UseNtfyChannelFormOptions {
    /** Optional className for wrapper */
    className?: string;
}
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
declare function NtfyChannelFormComponent(props: NtfyChannelFormProps): import("react/jsx-runtime").JSX.Element;
export declare const NtfyChannelForm: import("react").MemoExoticComponent<typeof NtfyChannelFormComponent>;
export {};
//# sourceMappingURL=NtfyChannelForm.d.ts.map