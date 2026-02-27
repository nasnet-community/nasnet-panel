/**
 * TemplateGallery Pattern Component - Barrel Export
 *
 * Exports the main component, hook, and types.
 * Platform presenters are internal implementation details.
 */

// Main component
export { TemplateGallery } from './TemplateGallery';
export type { TemplateGalleryProps } from './TemplateGallery';

// Headless hook
export { useTemplateGallery } from './use-template-gallery';
export type { UseTemplateGalleryOptions, UseTemplateGalleryReturn } from './use-template-gallery';

// Sub-components (for advanced use cases)
export { TemplateCard } from './TemplateCard';
export type { TemplateCardProps } from './TemplateCard';

// Types
export type {
  FirewallTemplate,
  TemplateCategory,
  TemplateComplexity,
  TemplateVariable,
  TemplateRule,
  TemplateFilter,
  TemplateSortField,
  SortDirection,
  TemplateSort,
  TemplateSelection,
  ComplexityMeta,
  CategoryMeta,
} from './types';
