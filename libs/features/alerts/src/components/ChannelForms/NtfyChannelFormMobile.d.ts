/**
 * NtfyChannelFormMobile - Mobile Presenter
 *
 * @description
 * Touch-optimized ntfy.sh configuration form for mobile (<640px).
 * Features single-column layout, 44px touch targets, accordion sections, and simplified UI.
 *
 * @module @nasnet/features/alerts/components/ChannelForms
 * @see NAS-18.X: Ntfy.sh notification configuration
 */
import type { UseNtfyChannelFormReturn } from '../../hooks/useNtfyChannelForm';
/**
 * Props for NtfyChannelFormMobile presenter
 */
export interface NtfyChannelFormMobileProps {
    /**
     * Headless hook instance containing form state, handlers, and validation logic
     */
    ntfyForm: UseNtfyChannelFormReturn;
}
declare function NtfyChannelFormMobileComponent({ ntfyForm }: NtfyChannelFormMobileProps): import("react/jsx-runtime").JSX.Element;
export declare const NtfyChannelFormMobile: import("react").MemoExoticComponent<typeof NtfyChannelFormMobileComponent>;
export {};
//# sourceMappingURL=NtfyChannelFormMobile.d.ts.map