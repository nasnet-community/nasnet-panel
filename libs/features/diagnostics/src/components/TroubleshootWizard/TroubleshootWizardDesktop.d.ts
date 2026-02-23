import type { ISPInfo } from '../../types/troubleshoot.types';
/**
 * Props for TroubleshootWizardDesktop presenter
 */
interface TroubleshootWizardDesktopProps {
    /** Router UUID to run diagnostics against */
    routerId: string;
    /** Auto-start wizard on mount (default: false) */
    autoStart?: boolean;
    /** Callback when wizard is closed/cancelled */
    onClose?: () => void;
    /** ISP information for contact suggestions */
    ispInfo?: ISPInfo;
}
export declare const TroubleshootWizardDesktop: import("react").NamedExoticComponent<TroubleshootWizardDesktopProps>;
export {};
//# sourceMappingURL=TroubleshootWizardDesktop.d.ts.map