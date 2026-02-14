/**
 * TemplateInstallWizard Component
 *
 * Platform wrapper that routes to Mobile or Desktop presenter.
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import type { ServiceTemplate } from '@nasnet/api-client/generated';

import { TemplateInstallWizardMobile } from './TemplateInstallWizardMobile';
import { TemplateInstallWizardDesktop } from './TemplateInstallWizardDesktop';

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
function TemplateInstallWizardComponent(props: TemplateInstallWizardProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <TemplateInstallWizardMobile {...props} />;
    case 'tablet':
      return <TemplateInstallWizardMobile {...props} />;
    case 'desktop':
      return <TemplateInstallWizardDesktop {...props} />;
    default:
      return <TemplateInstallWizardDesktop {...props} />;
  }
}

// Wrap with memo for performance
export const TemplateInstallWizard = memo(TemplateInstallWizardComponent);

// Set display name for React DevTools
TemplateInstallWizard.displayName = 'TemplateInstallWizard';
