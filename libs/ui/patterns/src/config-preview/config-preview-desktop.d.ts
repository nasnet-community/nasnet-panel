/**
 * ConfigPreview Desktop Presenter
 *
 * Desktop-optimized presenter for ConfigPreview component.
 * Features:
 * - Card-based layout with header toolbar
 * - Collapsible sections with expand/collapse all
 * - Full diff view support
 * - Copy and download buttons in header
 *
 * @see NAS-4A.21 - Build Config Preview Component
 * @see ADR-018 - Headless + Platform Presenters
 */
import type { ConfigPreviewProps } from './config-preview.types';
/**
 * ConfigPreviewDesktop Component
 *
 * Desktop presenter with full feature set including collapsible sections,
 * diff view, and header toolbar with copy/download actions.
 *
 * @example
 * ```tsx
 * <ConfigPreviewDesktop
 *   script={routerOsConfig}
 *   title="Configuration Preview"
 *   showLineNumbers
 *   collapsible
 * />
 * ```
 */
export declare function ConfigPreviewDesktop({ script, previousScript, showDiff, title, onCopy, onDownload, routerName, collapsible, showLineNumbers, maxHeight, className, }: ConfigPreviewProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ConfigPreviewDesktop {
    var displayName: string;
}
//# sourceMappingURL=config-preview-desktop.d.ts.map