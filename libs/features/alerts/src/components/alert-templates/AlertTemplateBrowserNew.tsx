/**
 * AlertTemplateBrowserNew Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * @description Platform router that delegates to Desktop or Mobile presenters.
 * Automatically detects viewport size and renders appropriate UI.
 *
 * @example
 * ```tsx
 * <AlertTemplateBrowserNew
 *   onApply={(template) => openApplyDialog(template)}
 *   onViewDetail={(template) => openDetailPanel(template)}
 *   initialCategory="NETWORK"
 * />
 * ```
 *
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';
import { useMediaQuery } from '@nasnet/ui/primitives';

import { useAlertRuleTemplates } from '../../hooks/useAlertRuleTemplates';
import { useTemplateBrowser, type UseTemplateBrowserReturn } from './useTemplateBrowser';
import { AlertTemplateBrowserDesktop } from './AlertTemplateBrowserDesktop';
import { AlertTemplateBrowserMobile } from './AlertTemplateBrowserMobile';
import type { AlertRuleTemplate } from '../../schemas/alert-rule-template.schema';

// =============================================================================
// Props Interface
// =============================================================================

/**
 * Props for AlertTemplateBrowserNew component
 */
export interface AlertTemplateBrowserNewProps {
  /** @description Callback when template is applied (opens preview/variable input dialog) */
  onApply?: (template: AlertRuleTemplate) => void;

  /** @description Callback when template detail is viewed */
  onViewDetail?: (template: AlertRuleTemplate) => void;

  /** @description Optional initial category filter */
  initialCategory?: string;

  /** @description Container className for responsive styling */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * AlertTemplateBrowserNew - Browse and apply alert rule templates
 *
 * @description Provides platform-aware template browsing with filtering, search, and sorting.
 * Features automatic platform detection and responsive layout (Mobile/Desktop).
 *
 * @param props - Component props
 * @returns React component
 */
export const AlertTemplateBrowserNew = React.memo(
  function AlertTemplateBrowserNew(props: AlertTemplateBrowserNewProps) {
  const { onApply, onViewDetail, initialCategory, className } = props;

  // Detect platform (mobile <640px, desktop ≥640px)
  const isDesktop = useMediaQuery('(min-width: 640px)');

  // Fetch alert rule templates from GraphQL
  const { data, loading, error } = useAlertRuleTemplates({
    category: initialCategory as any,
  });

  const templates = data?.alertRuleTemplates || [];

  // Initialize headless browser hook with memoized callbacks
  const handleApply = React.useCallback(
    (template: AlertRuleTemplate) => {
      if (onApply) {
        onApply(template);
      }
    },
    [onApply]
  );

  // Call hook at component level (not inside useMemo)
  const browser = useTemplateBrowser({
    templates,
    initialFilter: {
      category: initialCategory ? (initialCategory as any) : 'all',
    },
    onSelect: (template) => {
      // Template selected - can be used for analytics or side effects
    },
    onApply: handleApply,
  });

  // Handle errors
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-component-lg">
        <div className="text-center space-y-component-md">
          <h3 className="text-lg font-semibold text-error">Failed to load templates</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // Render platform-specific presenter
  const sharedProps = {
    browser,
    onPreview: onApply, // onApply opens preview/variable dialog
    onViewDetail,
    loading,
    className,
  };

  return isDesktop ? (
    <AlertTemplateBrowserDesktop {...sharedProps} />
  ) : (
    <AlertTemplateBrowserMobile {...sharedProps} />
  );
  }
);

AlertTemplateBrowserNew.displayName = 'AlertTemplateBrowserNew';
