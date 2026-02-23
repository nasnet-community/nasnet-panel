/**
 * InterfaceToggle Component
 * @description Toggle switch for enabling/disabling wireless interfaces with
 * confirmation dialog and optimistic updates. Provides feedback for pending state.
 * Implements FR0-17: Enable/disable wireless interfaces
 */
import * as React from 'react';
import type { WirelessInterface } from '@nasnet/core/types';
export interface InterfaceToggleProps {
    /** Wireless interface to control */
    interface: WirelessInterface;
    /** Optional CSS className */
    className?: string;
    /** Callback when toggle is clicked (before confirmation) */
    onClick?: (e: React.MouseEvent) => void;
}
/**
 * Interface Toggle Component
 * - Displays a switch for enabling/disabling wireless interface
 * - Shows confirmation dialog before state change
 * - Handles optimistic updates with error recovery
 * - Provides visual feedback during loading state
 *
 * @example
 * ```tsx
 * <InterfaceToggle
 *   interface={wirelessInterface}
 *   onClick={(e) => e.stopPropagation()}
 * />
 * ```
 */
export declare const InterfaceToggle: React.NamedExoticComponent<InterfaceToggleProps>;
//# sourceMappingURL=InterfaceToggle.d.ts.map