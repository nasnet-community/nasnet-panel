/**
 * TemplatesBrowser Component
 *
 * Main wrapper that routes to platform-specific presenters.
 * Implements Headless + Platform Presenters pattern.
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';

import { TemplatesBrowserMobile } from './TemplatesBrowserMobile';
import { TemplatesBrowserDesktop } from './TemplatesBrowserDesktop';

import type { TemplatesBrowserProps } from './types';

/**
 * TemplatesBrowser - Browse and filter service templates
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile/Tablet (<1024px): Vertical list with bottom sheet filters
 * - Desktop (≥1024px): 2-column grid with sidebar filters
 */
function TemplatesBrowserComponent(props: TemplatesBrowserProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <TemplatesBrowserMobile {...props} />;
    case 'tablet':
      return <TemplatesBrowserMobile {...props} />;
    case 'desktop':
      return <TemplatesBrowserDesktop {...props} />;
    default:
      return <TemplatesBrowserDesktop {...props} />;
  }
}

// Wrap with memo for performance
export const TemplatesBrowser = memo(TemplatesBrowserComponent);

// Set display name for React DevTools
TemplatesBrowser.displayName = 'TemplatesBrowser';
