/**
 * TemplatePreview Pattern Component - Barrel Export
 *
 * Exports the main component, hook, and types.
 * Platform presenters are internal implementation details.
 */

// Main component
export { TemplatePreview } from './TemplatePreview';
export type { TemplatePreviewProps } from './TemplatePreview';

// Headless hook
export { useTemplatePreview } from './use-template-preview';
export type { UseTemplatePreviewOptions, UseTemplatePreviewReturn } from './use-template-preview';

// Sub-components (for advanced use cases)
export { TemplateVariableEditor } from './TemplateVariableEditor';
export type { TemplateVariableEditorProps } from './TemplateVariableEditor';

// Types
export type {
  FirewallTemplate,
  TemplateVariable,
  TemplateRule,
  TemplatePreviewResult,
  TemplateConflict,
  ImpactAnalysis,
  VariableType,
  TemplateVariableValues,
  VariableValidationError,
  PreviewMode,
  PreviewTab,
} from './template-preview.types';

// Validation utilities
export {
  isValidIPv4,
  isValidCIDR,
  isValidPort,
  isValidVLAN,
  StringVariableSchema,
  InterfaceVariableSchema,
  SubnetVariableSchema,
  IPVariableSchema,
  PortVariableSchema,
  VLANVariableSchema,
  getVariableSchema,
  createTemplateVariablesSchema,
} from './template-preview.types';
