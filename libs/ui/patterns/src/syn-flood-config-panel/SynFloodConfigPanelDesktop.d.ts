/**
 * SynFloodConfigPanelDesktop Component
 *
 * Desktop presenter for SYN flood protection configuration.
 * Compact form layout with sliders and preset dropdown.
 */
import type { UseSynFloodConfigPanelReturn } from './use-syn-flood-config-panel';
export interface SynFloodConfigPanelDesktopProps {
    /** Config hook return value */
    configHook: UseSynFloodConfigPanelReturn;
    /** Loading state */
    loading?: boolean;
    /** Container className */
    className?: string;
}
/**
 * Desktop presenter for SynFloodConfigPanel
 *
 * Features:
 * - Master toggle with dangerous confirmation
 * - SYN limit slider (1-10,000 packets/second)
 * - Burst slider (1-1,000)
 * - Action selector (drop/tarpit)
 * - Presets dropdown
 * - Warning for low limits
 */
export declare function SynFloodConfigPanelDesktop({ configHook, loading, className, }: SynFloodConfigPanelDesktopProps): import("react/jsx-runtime").JSX.Element;
export declare namespace SynFloodConfigPanelDesktop {
    var displayName: string;
}
//# sourceMappingURL=SynFloodConfigPanelDesktop.d.ts.map