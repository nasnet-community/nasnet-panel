import type { ISPInfo } from '../../types/troubleshoot.types';
export interface TroubleshootWizardProps {
    /** Router UUID to run diagnostics against */
    routerId: string;
    /** Auto-start wizard on mount (default: false) */
    autoStart?: boolean;
    /** Callback when wizard is closed/cancelled */
    onClose?: () => void;
    /** ISP information for contact suggestions */
    ispInfo?: ISPInfo;
    /** Additional CSS classes */
    className?: string;
}
/**
 * No Internet Troubleshooting Wizard
 *
 * Runs automated diagnostic steps and provides fix suggestions for common
 * internet connectivity issues. Auto-selects between Desktop and Mobile
 * presenters based on viewport size (desktop >1024px, mobile <1024px).
 *
 * Follows responsive design pattern with platform-aware presenters.
 * All business logic delegated to `useTroubleshootWizard` hook.
 *
 * @example
 * ```tsx
 * // Auto-detect platform
 * <TroubleshootWizard
 *   routerId="router-123"
 *   autoStart={true}
 *   onClose={() => navigate('/dashboard')}
 * />
 *
 * // With ISP contact info
 * <TroubleshootWizard
 *   routerId="router-123"
 *   ispInfo={{ name: 'Comcast', supportPhone: '1-800-123-4567' }}
 * />
 * ```
 *
 * @see DiagnosticStep for individual step rendering
 * @see useTroubleshootWizard for hook logic
 */
export declare const TroubleshootWizard: import("react").NamedExoticComponent<TroubleshootWizardProps>;
//# sourceMappingURL=TroubleshootWizard.d.ts.map