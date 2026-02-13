/**
 * Alert Templates Components
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Barrel export for alert rule template components.
 */

// Legacy browser (will be replaced with AlertTemplateBrowserNew)
export { AlertTemplateBrowser } from './AlertTemplateBrowser';
export type { AlertTemplateBrowserProps } from './AlertTemplateBrowser';

// New Headless + Platform Presenters implementation
export { AlertTemplateBrowserNew } from './AlertTemplateBrowserNew';
export type { AlertTemplateBrowserNewProps } from './AlertTemplateBrowserNew';

export { AlertTemplateBrowserDesktop } from './AlertTemplateBrowserDesktop';
export type { AlertTemplateBrowserDesktopProps } from './AlertTemplateBrowserDesktop';

export { AlertTemplateBrowserMobile } from './AlertTemplateBrowserMobile';
export type { AlertTemplateBrowserMobileProps } from './AlertTemplateBrowserMobile';

export { useTemplateBrowser } from './useTemplateBrowser';
export type {
  UseTemplateBrowserOptions,
  UseTemplateBrowserReturn,
  TemplateFilter,
  TemplateSort,
  TemplateSortField,
  SortDirection,
  TemplateSelection,
} from './useTemplateBrowser';

// Detail panel (interactive with variable input form)
export { AlertTemplateDetailPanel } from './AlertTemplateDetailPanel';
export type { AlertTemplateDetailPanelProps } from './AlertTemplateDetailPanel';

// Variable input form (standalone)
export { AlertTemplateVariableInputForm } from './AlertTemplateVariableInputForm';
export type {
  AlertTemplateVariableInputFormProps,
  VariableValues,
} from './AlertTemplateVariableInputForm';

// Apply dialog (form + preview + mutation)
export { AlertTemplateApplyDialog } from './AlertTemplateApplyDialog';
export type { AlertTemplateApplyDialogProps } from './AlertTemplateApplyDialog';

// Dialogs
export { SaveTemplateDialog } from './SaveTemplateDialog';
export type { SaveTemplateDialogProps } from './SaveTemplateDialog';

export { ImportTemplateDialog } from './ImportTemplateDialog';
export type { ImportTemplateDialogProps } from './ImportTemplateDialog';

export { ExportTemplateDialog } from './ExportTemplateDialog';
export type { ExportTemplateDialogProps } from './ExportTemplateDialog';
