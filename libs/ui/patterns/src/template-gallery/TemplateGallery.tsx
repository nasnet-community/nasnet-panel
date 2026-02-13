/**
 * TemplateGallery Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * const gallery = useTemplateGallery({
 *   templates: templates,
 *   onSelect: handleSelect,
 * });
 *
 * <TemplateGallery
 *   gallery={gallery}
 *   onApplyTemplate={handleApply}
 *   loading={isLoading}
 * />
 * ```
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { TemplateGalleryDesktop } from './TemplateGalleryDesktop';
import { TemplateGalleryMobile } from './TemplateGalleryMobile';
import type { FirewallTemplate } from './types';
import type { UseTemplateGalleryReturn } from './use-template-gallery';

export interface TemplateGalleryProps {
  /** Template gallery hook return value */
  gallery: UseTemplateGalleryReturn;

  /** Callback when Apply button is clicked */
  onApplyTemplate?: (template: FirewallTemplate) => void;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

/**
 * TemplateGallery - Browse and select firewall templates
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Vertical list with bottom sheet filters, 44px touch targets
 * - Tablet/Desktop (>=640px): Grid layout with sidebar filters
 *
 * Features:
 * - Filter by category, complexity, and type (built-in/custom)
 * - Search by name or description
 * - Sort by name, complexity, rule count, or category
 * - Select templates with visual feedback
 * - Apply templates directly from gallery
 * - Category and complexity counts
 * - Empty state when no templates match
 */
function TemplateGalleryComponent(props: TemplateGalleryProps) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <TemplateGalleryMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <TemplateGalleryDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
export const TemplateGallery = memo(TemplateGalleryComponent);

// Set display name for React DevTools
TemplateGallery.displayName = 'TemplateGallery';
