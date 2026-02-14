/**
 * Templates Components
 *
 * Barrel export for template management components.
 */

// Browser Components
export { TemplatesBrowser } from './TemplatesBrowser';
export { TemplatesBrowserMobile } from './TemplatesBrowserMobile';
export { TemplatesBrowserDesktop } from './TemplatesBrowserDesktop';
export { TemplateFilters } from './TemplateFilters';
export { useTemplatesBrowser } from './useTemplatesBrowser';

// Installation Wizard Components
export { TemplateInstallWizard } from './TemplateInstallWizard';
export { TemplateInstallWizardMobile } from './TemplateInstallWizardMobile';
export { TemplateInstallWizardDesktop } from './TemplateInstallWizardDesktop';
export { useTemplateInstallWizard } from './useTemplateInstallWizard';

// Wizard Steps
export {
  VariablesStep,
  ReviewStep,
  InstallingStep,
  RoutingStep,
} from './wizard-steps';
export type {
  VariablesStepProps,
  ReviewStepProps,
  InstallingStepProps,
  RoutingStepProps,
} from './wizard-steps';

// Types
export type {
  TemplatesBrowserProps,
  TemplateFiltersProps,
  TemplateBrowserFilters,
  TemplateSortBy,
  TemplateInstallWizardProps,
  TemplateInstallContext,
  TemplateInstallEvent,
  UseTemplateInstallWizardOptions,
  UseTemplateInstallWizardReturn,
} from './types';
export { DEFAULT_FILTERS } from './types';
