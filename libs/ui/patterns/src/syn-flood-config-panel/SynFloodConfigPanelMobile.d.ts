/**
 * SynFloodConfigPanelMobile Component
 *
 * Mobile presenter for SYN flood protection configuration.
 * Touch-friendly layout with larger controls.
 */
import type { UseSynFloodConfigPanelReturn } from './use-syn-flood-config-panel';
export interface SynFloodConfigPanelMobileProps {
    /** Config hook return value */
    configHook: UseSynFloodConfigPanelReturn;
    /** Loading state */
    loading?: boolean;
    /** Container className */
    className?: string;
}
/**
 * Mobile presenter for SynFloodConfigPanel
 *
 * Features:
 * - 44px minimum touch targets
 * - Full-width controls
 * - Larger sliders for touch interaction
 * - Stacked layout
 */
export declare function SynFloodConfigPanelMobile({ configHook, loading, className, }: SynFloodConfigPanelMobileProps): import("react/jsx-runtime").JSX.Element;
export declare namespace SynFloodConfigPanelMobile {
    var displayName: string;
}
//# sourceMappingURL=SynFloodConfigPanelMobile.d.ts.map