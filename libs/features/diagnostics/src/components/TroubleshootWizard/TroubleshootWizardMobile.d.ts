import type { ISPInfo } from '../../types/troubleshoot.types';
/**
 * Props for TroubleshootWizardMobile presenter
 */
interface TroubleshootWizardMobileProps {
    /** Router UUID to run diagnostics against */
    routerId: string;
    /** Auto-start wizard on mount (default: false) */
    autoStart?: boolean;
    /** Callback when wizard is closed/cancelled */
    onClose?: () => void;
    /** ISP information for contact suggestions */
    ispInfo?: ISPInfo;
}
/**
 * Mobile presenter for No Internet Troubleshooting Wizard (<640px)
 *
 * Displays touch-optimized wizard with 44px+ touch targets,
 * vertical step list, bottom sheet for fix details, and
 * progress bar for mobile context.
 *
 * @see TroubleshootWizard for responsive wrapper
 */
export declare const TroubleshootWizardMobile: import("react").NamedExoticComponent<TroubleshootWizardMobileProps>;
export {};
//# sourceMappingURL=TroubleshootWizardMobile.d.ts.map