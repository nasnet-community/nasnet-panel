/**
 * ConfigPreview Component
 *
 * Auto-detecting wrapper that selects the appropriate presenter
 * (mobile or desktop) based on current platform.
 *
 * @see NAS-4A.21 - Build Config Preview Component
 * @see ADR-018 - Headless + Platform Presenters
 */
import type { ConfigPreviewProps } from './config-preview.types';
/**
 * ConfigPreview Component
 *
 * Displays RouterOS configuration scripts with syntax highlighting,
 * collapsible sections, diff view, and copy/download capabilities.
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Simplified UI, stacked buttons, horizontal scroll
 * - Desktop (≥640px): Full feature set, collapsible sections, card layout
 *
 * Can be forced to a specific presenter using the `presenter` prop.
 *
 * @example
 * ```tsx
 * // Basic usage - auto-detects platform
 * <ConfigPreview
 *   script={routerOsConfig}
 *   title="Configuration Preview"
 *   showLineNumbers
 * />
 *
 * // Diff view
 * <ConfigPreview
 *   script={newConfig}
 *   previousScript={oldConfig}
 *   showDiff
 * />
 *
 * // Force desktop presenter
 * <ConfigPreview
 *   script={config}
 *   presenter="desktop"
 * />
 * ```
 *
 * @see ConfigPreviewDesktop - Desktop presenter component
 * @see ConfigPreviewMobile - Mobile presenter component
 * @see useConfigPreview - Headless hook with all business logic
 */
export declare function ConfigPreview(props: ConfigPreviewProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ConfigPreview {
    var displayName: string;
}
//# sourceMappingURL=config-preview.d.ts.map