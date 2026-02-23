/**
 * NtfyChannelFormDesktop - Desktop Presenter
 *
 * @description
 * Dense, pro-grade ntfy.sh configuration form for desktop (>1024px).
 * Features two-column layout, inline validation, and keyboard shortcuts.
 *
 * @module @nasnet/features/alerts/components/ChannelForms
 * @see NAS-18.X: Ntfy.sh notification configuration
 */
import type { UseNtfyChannelFormReturn } from '../../hooks/useNtfyChannelForm';
/**
 * Props for NtfyChannelFormDesktop presenter
 */
export interface NtfyChannelFormDesktopProps {
    /**
     * Headless hook instance containing form state, handlers, and validation logic
     */
    ntfyForm: UseNtfyChannelFormReturn;
}
declare function NtfyChannelFormDesktopComponent({ ntfyForm }: NtfyChannelFormDesktopProps): import("react/jsx-runtime").JSX.Element;
export declare const NtfyChannelFormDesktop: import("react").MemoExoticComponent<typeof NtfyChannelFormDesktopComponent>;
export {};
//# sourceMappingURL=NtfyChannelFormDesktop.d.ts.map