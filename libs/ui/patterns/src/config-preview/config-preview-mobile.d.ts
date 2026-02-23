/**
 * ConfigPreview Mobile Presenter
 *
 * Mobile-optimized presenter for ConfigPreview component.
 * Features:
 * - Simplified UI without collapsible sections
 * - Sticky header with vertically stacked buttons
 * - Full-width horizontal scroll for code
 * - 44px minimum touch targets
 *
 * @see NAS-4A.21 - Build Config Preview Component
 * @see ADR-018 - Headless + Platform Presenters
 */
import type { ConfigPreviewProps } from './config-preview.types';
/**
 * ConfigPreviewMobile Component
 *
 * Mobile presenter with simplified controls and optimized touch targets.
 * Does not show collapsible sections to keep UI simple on small screens.
 *
 * @example
 * ```tsx
 * <ConfigPreviewMobile
 *   script={routerOsConfig}
 *   title="Config Preview"
 * />
 * ```
 */
export declare function ConfigPreviewMobile({ script, previousScript, showDiff, title, onCopy, onDownload, routerName, showLineNumbers, // Disabled by default on mobile for space
maxHeight, className, }: ConfigPreviewProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ConfigPreviewMobile {
    var displayName: string;
}
//# sourceMappingURL=config-preview-mobile.d.ts.map