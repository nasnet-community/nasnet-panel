/**
 * ConfigPreview Module
 *
 * RouterOS configuration preview with syntax highlighting,
 * collapsible sections, and diff view capabilities.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 */

// Main component (auto-detecting wrapper)
export { ConfigPreview } from './config-preview';

// Platform presenters
export { ConfigPreviewDesktop } from './config-preview-desktop';
export { ConfigPreviewMobile } from './config-preview-mobile';

// Headless hooks
export { useConfigPreview } from './use-config-preview';
export { useDiff } from './use-diff';

// Sub-components
export { ConfigSection } from './config-section';
export { DiffView } from './diff-view';
export { SyntaxHighlight } from './syntax-highlight';

// Syntax highlighting utilities
export { registerRouterOS, highlightRouterOS } from './syntax';

// Types
export type {
  ConfigPreviewProps,
  ConfigSection as ConfigSectionType,
  DiffLine,
  UseConfigPreviewConfig,
  UseConfigPreviewReturn,
  UseDiffConfig,
  UseDiffReturn,
  SyntaxHighlightProps,
  DiffViewProps,
  ConfigSectionComponentProps,
} from './config-preview.types';
