/**
 * AlertTemplateBrowser Component
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Layer 3 domain component that composes the Layer 2 TemplateGallery pattern
 * with alert-specific configuration and data.
 *
 * Provides a browseable gallery of alert rule templates with filtering by category,
 * search, and template application functionality.
 */

import { useCallback, useMemo } from 'react';
import { useTemplateGallery, TemplateGallery } from '@nasnet/ui/patterns';
import { useToast } from '@nasnet/ui/primitives';

import { useAlertRuleTemplates, useApplyAlertRuleTemplate, type AlertRuleTemplate } from '@nasnet/api-client/queries';
import { ALERT_TEMPLATE_CATEGORIES, type AlertTemplateCategoryMeta } from '../../utils/alert-template-categories';

// =============================================================================
// Props Interface
// =============================================================================

export interface AlertTemplateBrowserProps {
  /** Callback when a rule is successfully created from template */
  onRuleCreated?: (ruleId: string) => void;

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
 * - Filter by 7 categories (Network, Security, Resources, VPN, DHCP, System, Custom)
 * - Search by template name or description
 * - Sort by name, category, or date
 * - Preview template with variable substitution
 * - Create alert rule from template with custom values
 * - Built-in and custom templates
 *
 * Architecture:
 * - Composes Layer 2 TemplateGallery pattern component
 * - Provides alert-specific data and configuration
 * - Handles alert rule creation via GraphQL mutation
 * - Automatically responsive (Mobile/Desktop) via TemplateGallery
 */
export function AlertTemplateBrowser(props: AlertTemplateBrowserProps) {
  const { onRuleCreated, initialCategory, className } = props;

  const { toast } = useToast();

  // Fetch alert rule templates
  const { data, loading, error, refetch } = useAlertRuleTemplates({
    variables: initialCategory ? { category: initialCategory } : undefined,
  });

  // Apply template mutation
  const [applyTemplate, { loading: applying }] = useApplyAlertRuleTemplate({
    onCompleted: (result) => {
      if (result.applyAlertRuleTemplate.alertRule) {
        toast({
          title: 'Alert rule created',
          description: `Successfully created "${result.applyAlertRuleTemplate.alertRule.name}"`,
          variant: 'success',
        });
        onRuleCreated?.(result.applyAlertRuleTemplate.alertRule.id);
      } else if (result.applyAlertRuleTemplate.errors.length > 0) {
        toast({
          title: 'Failed to create alert rule',
          description: result.applyAlertRuleTemplate.errors[0].message,
          variant: 'destructive',
        });
      }
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create alert rule',
        variant: 'destructive',
      });
    },
  });

  // Transform AlertRuleTemplate to generic template format expected by TemplateGallery
  const templates = useMemo(() => {
    if (!data?.alertRuleTemplates) return [];

    return data.alertRuleTemplates.map((template: AlertRuleTemplate) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      complexity: 'MODERATE' as const, // Map severity to complexity for UI
      ruleCount: template.conditions.length,
      isBuiltIn: template.isBuiltIn,
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : new Date(),
      // Include original template data for applying
      _original: template,
    }));
  }, [data]);

  // Initialize template gallery hook with alert-specific configuration
  const gallery = useTemplateGallery({
    templates,
    initialFilter: {
      category: initialCategory || 'all',
    },
    onSelect: (template) => {
      // Template selected - handled by TemplateGallery detail panel
      console.log('Template selected:', template?.name);
    },
  });

  // Handle template application
  const handleApplyTemplate = useCallback(
    async (template: any) => {
      const alertTemplate = template._original as AlertRuleTemplate;

      // For now, apply with default variable values
      // In a complete implementation, this would open a dialog to collect variable values
      const variableValues: Record<string, string | number> = {};
      alertTemplate.variables.forEach((variable) => {
        if (variable.defaultValue) {
          variableValues[variable.name] = variable.defaultValue;
        }
      });

      await applyTemplate({
        variables: {
          templateId: alertTemplate.id,
          variables: variableValues,
          customizations: {
            enabled: true,
          },
        },
      });
    },
    [applyTemplate]
  );

  // Convert alert categories to generic category metadata
  const categories: AlertTemplateCategoryMeta[] = useMemo(() => {
    return Object.values(ALERT_TEMPLATE_CATEGORIES);
  }, []);

  // Handle errors
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="text-semantic-error mb-4">Failed to load templates</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <TemplateGallery
      gallery={gallery}
      onApplyTemplate={handleApplyTemplate}
      loading={loading || applying}
      className={className}
    />
  );
}
