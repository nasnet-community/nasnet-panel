/**
 * TemplateInstallWizardMobile Component
 *
 * @description Mobile/Tablet presenter for template installation wizard.
 * Full-screen modal with bottom navigation and 44px touch targets.
 *
 * Features:
 * - Full-screen modal
 * - Step indicator at top (1/4, 2/4, etc.)
 * - Scrollable content area
 * - Bottom navigation bar with 44px touch targets
 * - Cannot dismiss during installation
 */
import * as React from 'react';
import type { TemplateInstallWizardProps } from './TemplateInstallWizard';
/**
 * Mobile presenter for TemplateInstallWizard
 */
declare function TemplateInstallWizardMobileComponent({ routerId, template, open, onClose, onComplete, }: TemplateInstallWizardProps): import("react/jsx-runtime").JSX.Element;
export declare const TemplateInstallWizardMobile: React.MemoExoticComponent<typeof TemplateInstallWizardMobileComponent>;
export {};
//# sourceMappingURL=TemplateInstallWizardMobile.d.ts.map