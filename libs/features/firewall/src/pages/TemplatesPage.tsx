/**
 * TemplatesPage - Firewall Templates Management Page
 *
 * Main page composing TemplateGallery + TemplateApplyFlow + Custom Template Management.
 * Implements Layer 3 domain component pattern.
 *
 * Features:
 * - Browse built-in and custom templates
 * - Apply templates with variable configuration
 * - Create custom templates from existing rules
 * - Import/export templates
 * - Safety Pipeline with undo functionality
 *
 * @module @nasnet/features/firewall/pages
 */

import { useState, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Upload, Download, Settings } from 'lucide-react';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@nasnet/ui/primitives';
import { TemplateGallery, useTemplateGallery } from '@nasnet/ui/patterns/template-gallery';
import { TemplateApplyFlow } from '../components/TemplateApplyFlow';
import { SaveTemplateDialog } from '../components/SaveTemplateDialog';
import { ImportTemplateDialog } from '../components/ImportTemplateDialog';
import { useTemplates, useApplyTemplate, useRollbackTemplate } from '@nasnet/api-client/queries';
import { useCustomTemplates } from '../hooks/useCustomTemplates';
import type { FirewallTemplate } from '../schemas/templateSchemas';
import { toast } from 'sonner';
import { downloadTemplates } from '../utils/template-export';

// ============================================
// COMPONENT PROPS
// ============================================

/**
 * TemplatesPage Component Props
 * @description Props for firewall templates management page
 */
export interface TemplatesPageProps {
  /** Router ID for template operations */
  routerId: string;

  /** Current firewall rules (for creating custom templates) */
  currentRules?: any[];

  /** Optional CSS class for styling */
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * TemplatesPage Component
 * @description Main page for managing firewall templates with browsing, applying, and custom template creation
 */
export const TemplatesPage = memo(function TemplatesPage({
  routerId,
  currentRules = [],
  className,
}: TemplatesPageProps) {
  const { t } = useTranslation('firewall');
  const [selectedTemplate, setSelectedTemplate] = useState<FirewallTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'apply'>('browse');

  // Fetch built-in templates
  const {
    data: builtInTemplates = [],
    isLoading: isLoadingBuiltIn,
    error: builtInError,
  } = useTemplates();

  // Fetch custom templates from IndexedDB
  const {
    templates: customTemplates,
    loading: isLoadingCustom,
    save: saveCustomTemplate,
    remove: removeCustomTemplate,
    exportTemplates: exportCustomTemplates,
    importTemplates: importCustomTemplates,
  } = useCustomTemplates();

  // Combine built-in and custom templates
  const allTemplates = [...builtInTemplates, ...customTemplates];

  // Initialize template gallery hook
  const gallery = useTemplateGallery({
    templates: allTemplates,
    onSelect: (template) => {
      setSelectedTemplate(template);
    },
  });

  // Mutations
  const applyMutation = useApplyTemplate();
  const rollbackMutation = useRollbackTemplate();

  // Handlers

  const handleApplyTemplate = useCallback((template: FirewallTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('apply');
  }, []);

  const handlePreviewTemplate = useCallback(
    async (params: {
      routerId: string;
      template: FirewallTemplate;
      variables: Record<string, string>;
    }) => {
      // This would call the actual preview API
      // For now, return mock data
      return {
        template: params.template,
        resolvedRules: params.template.rules,
        conflicts: [],
        impactAnalysis: {
          newRulesCount: params.template.ruleCount,
          affectedChains: ['input', 'forward'],
          estimatedApplyTime: 5,
          warnings: [],
        },
      };
    },
    []
  );

  const handleApply = useCallback(
    async (params: {
      routerId: string;
      template: FirewallTemplate;
      variables: Record<string, string>;
    }) => {
      try {
        const result = await applyMutation.mutateAsync({
          routerId: params.routerId,
          templateId: params.template.id,
          variables: params.variables,
        });

        toast.success('Template applied successfully!', {
          description: `${result.appliedRulesCount} firewall rules created`,
        });

        return result;
      } catch (error) {
        toast.error('Failed to apply template', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    [applyMutation]
  );

  const handleRollback = useCallback(
    async (params: { routerId: string; rollbackId: string }) => {
      try {
        await rollbackMutation.mutateAsync(params);

        toast.success('Changes rolled back successfully', {
          description: 'Firewall configuration restored',
        });
      } catch (error) {
        toast.error('Failed to rollback changes', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    [rollbackMutation]
  );

  const handleSaveCustomTemplate = useCallback(
    async (template: FirewallTemplate) => {
      try {
        await saveCustomTemplate(template);
        toast.success('Template saved!', {
          description: `"${template.name}" saved to your custom templates`,
        });
      } catch (error) {
        toast.error('Failed to save template', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    [saveCustomTemplate]
  );

  const handleImportTemplate = useCallback(
    async (template: FirewallTemplate) => {
      try {
        await saveCustomTemplate(template);
        toast.success('Template imported!', {
          description: `"${template.name}" added to your custom templates`,
        });
      } catch (error) {
        toast.error('Failed to import template', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    [saveCustomTemplate]
  );

  const handleExportAllCustom = useCallback(() => {
    if (customTemplates.length === 0) {
      toast.info('No custom templates to export');
      return;
    }

    downloadTemplates(customTemplates, 'json', {
      fileName: 'custom-firewall-templates',
    });

    toast.success('Templates exported!', {
      description: `${customTemplates.length} templates downloaded`,
    });
  }, [customTemplates]);

  const handleApplySuccess = useCallback(() => {
    toast.success('Template applied successfully!');
  }, []);

  const handleApplyCancel = useCallback(() => {
    setActiveTab('browse');
    setSelectedTemplate(null);
  }, []);

  const handleRollbackComplete = useCallback(() => {
    toast.info('Rollback complete');
    setActiveTab('browse');
    setSelectedTemplate(null);
  }, []);

  const isLoading = isLoadingBuiltIn || isLoadingCustom;
  const existingTemplateNames = allTemplates.map((t) => t.name);

  return (
    <div className="px-page-mobile md:px-page-tablet lg:px-page-desktop py-component-lg space-y-component-lg container mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('templates.title')}</h1>
          <p className="text-muted-foreground">{t('templates.subtitle')}</p>
        </div>

        <div className="gap-component-sm flex">
          {/* Export All Custom Templates */}
          {customTemplates.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExportAllCustom}
              aria-label={t('templates.buttons.exportCustom')}
            >
              <Download
                className="mr-component-sm h-4 w-4"
                aria-hidden="true"
              />
              {t('templates.buttons.exportCustom')} ({customTemplates.length})
            </Button>
          )}

          {/* Import Template */}
          <ImportTemplateDialog
            existingNames={existingTemplateNames}
            onImport={handleImportTemplate}
            trigger={
              <Button
                variant="outline"
                aria-label={t('templates.buttons.import')}
              >
                <Upload
                  className="mr-component-sm h-4 w-4"
                  aria-hidden="true"
                />
                {t('templates.buttons.import')}
              </Button>
            }
          />

          {/* Save Current Rules as Template */}
          {currentRules.length > 0 && (
            <SaveTemplateDialog
              rules={currentRules}
              existingNames={existingTemplateNames}
              onSave={handleSaveCustomTemplate}
              trigger={
                <Button aria-label={t('templates.buttons.create')}>
                  <Plus
                    className="mr-component-sm h-4 w-4"
                    aria-hidden="true"
                  />
                  {t('templates.buttons.create')}
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'browse' | 'apply')}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="browse">{t('templates.tabs.browse')}</TabsTrigger>
          <TabsTrigger
            value="apply"
            disabled={!selectedTemplate}
          >
            {t('templates.tabs.apply')}
          </TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent
          value="browse"
          className="mt-6"
        >
          <TemplateGallery
            gallery={gallery}
            onApplyTemplate={handleApplyTemplate}
            loading={isLoading}
          />

          {/* Error State */}
          {builtInError && (
            <div className="border-error bg-error/10 p-component-md rounded-[var(--semantic-radius-card)] border">
              <p className="text-error text-sm">{t('templates.errors.loadFailed')}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && allTemplates.length === 0 && (
            <div className="gap-component-md border-border p-component-xl flex flex-col items-center justify-center rounded-[var(--semantic-radius-card)] border-2 border-dashed text-center">
              <Settings
                className="text-muted-foreground h-12 w-12"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {t('templates.emptyStates.noTemplates.title')}
                </h3>
                <p className="mt-component-sm text-muted-foreground text-sm">
                  {currentRules.length > 0 ?
                    t('templates.emptyStates.noTemplates.descriptionWithRules')
                  : t('templates.emptyStates.noTemplates.description')}
                </p>
              </div>
              {currentRules.length > 0 && (
                <SaveTemplateDialog
                  rules={currentRules}
                  existingNames={existingTemplateNames}
                  onSave={handleSaveCustomTemplate}
                  trigger={
                    <Button aria-label={t('templates.buttons.createFirst')}>
                      <Plus
                        className="mr-component-sm h-4 w-4"
                        aria-hidden="true"
                      />
                      {t('templates.buttons.createFirst')}
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </TabsContent>

        {/* Apply Tab */}
        <TabsContent
          value="apply"
          className="mt-6"
        >
          {selectedTemplate && (
            <TemplateApplyFlow
              routerId={routerId}
              template={selectedTemplate}
              onPreview={handlePreviewTemplate}
              onApply={handleApply}
              onRollback={handleRollback}
              onSuccess={handleApplySuccess}
              onCancel={handleApplyCancel}
              onRollbackComplete={handleRollbackComplete}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
});

TemplatesPage.displayName = 'TemplatesPage';
