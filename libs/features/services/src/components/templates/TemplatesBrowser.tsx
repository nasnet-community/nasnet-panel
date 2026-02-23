/**
 * TemplatesBrowser Component
 *
 * @description Wrapper component that automatically selects platform-specific presenters for browsing service templates.
 *
 * Implements Headless + Platform Presenters pattern:
 * - Mobile (<640px): Vertical list with bottom sheet filters and 44px touch targets
 * - Tablet (640-1024px): Vertical list with bottom sheet filters
 * - Desktop (>1024px): 2-column grid with left sidebar filters and hover states
 *
 * @example
 * ```tsx
 * <TemplatesBrowser
 *   routerId="router-1"
 *   onInstall={(template) => {
 *     console.log('Installing:', template.name);
 *     navigateToInstallWizard(template.id);
 *   }}
 *   onViewDetails={(template) => {
 *     navigateToTemplateDetail(template.id);
 *   }}
 * />
 * ```
 */

import React from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { TemplatesBrowserDesktop } from './TemplatesBrowserDesktop';
import { TemplatesBrowserMobile } from './TemplatesBrowserMobile';

import type { TemplatesBrowserProps } from './types';

/**
 * Auto-detecting wrapper component that routes to platform-specific presenters
 */
function TemplatesBrowserComponent(props: TemplatesBrowserProps) {
  const platform = usePlatform();

  // Mobile and Tablet share the same presenter (vertical list with bottom sheet filters)
  if (platform === 'mobile' || platform === 'tablet') {
    return <TemplatesBrowserMobile {...props} />;
  }

  // Desktop has dedicated 2-column grid layout with sidebar
  return <TemplatesBrowserDesktop {...props} />;
}

/**
 * TemplatesBrowser - Browse and filter service templates with platform-specific UI
 */
export const TemplatesBrowser = React.memo(TemplatesBrowserComponent);
TemplatesBrowser.displayName = 'TemplatesBrowser';
