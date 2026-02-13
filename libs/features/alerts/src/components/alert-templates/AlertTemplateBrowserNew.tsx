/**
 * AlertTemplateBrowser Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Platform router that delegates to Desktop or Mobile presenters.
 * Automatically detects viewport size and renders appropriate UI.
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

export interface AlertTemplateBrowserNewProps {
  /** Callback when template is applied (opens preview/variable input dialog) */
  onApply?: (template: AlertRuleTemplate) => void;

  /** Callback when template detail is viewed */
  onViewDetail?: (template: AlertRuleTemplate) => void;

  /** Optional initial category filter */
  initialCategory?: string;

  /** Container className */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * AlertTemplateBrowser - Browse and apply alert rule templates
 *
 * Features:
 * - Automatic platform detection (Mobile <640px, Desktop ≥640px)
 * - Filter by 7 categories (Network, Security, Resources, VPN, DHCP, System, Custom)
 * - Filter by severity (Critical, Warning, Info)
 * - Search by template name or description
 * - Sort by name, severity, category, or date
 * - Built-in and custom template filtering
 * - Apply template to create alert rule
 * - View template details
 *
 * Architecture:
 * - Headless hook (useTemplateBrowser) contains all business logic
 * - Desktop presenter for >640px (sidebar filters, grid layout)
 * - Mobile presenter for <640px (bottom sheet filters, list layout)
 * - Platform-agnostic state and actions
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <AlertTemplateBrowser
 *   onApply={(template) => openApplyDialog(template)}
 *   onViewDetail={(template) => openDetailPanel(template)}
 *   initialCategory="NETWORK"
 * />
 * ```
 */
export function AlertTemplateBrowserNew(props: AlertTemplateBrowserNewProps) {
  const { onApply, onViewDetail, initialCategory, className } = props;

  // Detect platform (mobile <640px, desktop ≥640px)
  const isDesktop = useMediaQuery('(min-width: 640px)');

  // Fetch alert rule templates from GraphQL
  const { data, loading, error } = useAlertRuleTemplates({
    category: initialCategory as any,
  });

  const templates = data?.alertRuleTemplates || [];

  // Initialize headless browser hook
  const browser = useTemplateBrowser({
    templates,
    initialFilter: {
      category: initialCategory ? (initialCategory as any) : 'all',
    },
    onSelect: (template) => {
      // Template selected - can be used for analytics or side effects
      console.log('Template selected:', template?.name);
    },
    onApply: (template) => {
      // Trigger apply callback
      if (onApply) {
        onApply(template);
      }
    },
  });

  // Handle errors
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-semantic-error">Failed to load templates</h3>
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
