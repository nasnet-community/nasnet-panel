/**
 * TemplateInstallWizard Component
 *
 * Platform wrapper that routes to Mobile or Desktop presenter.
 */
import type { ServiceTemplate } from '@nasnet/api-client/generated';
/**
 * Props for TemplateInstallWizard
 */
export interface TemplateInstallWizardProps {
    /** Router ID */
    routerId: string;
    /** Template to install */
    template: ServiceTemplate;
    /** Whether wizard is open */
    open: boolean;
    /** Callback when wizard should close */
    onClose: () => void;
    /** Callback when installation completes */
    onComplete?: (instanceIDs: string[]) => void;
}
/**
 * TemplateInstallWizard - Multi-step template installation wizard
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile/Tablet (<1024px): Full-screen modal with bottom navigation
 * - Desktop (≥1024px): Centered modal with side navigation
 */
declare function TemplateInstallWizardComponent(props: TemplateInstallWizardProps): import("react/jsx-runtime").JSX.Element;
export declare const TemplateInstallWizard: import("react").MemoExoticComponent<typeof TemplateInstallWizardComponent>;
export {};
//# sourceMappingURL=TemplateInstallWizard.d.ts.map