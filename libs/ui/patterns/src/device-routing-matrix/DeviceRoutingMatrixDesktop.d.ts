/**
 * DeviceRoutingMatrixDesktop Component
 *
 * Desktop presenter (>1024px) for the DeviceRoutingMatrix pattern.
 * Features virtualized table, keyboard navigation, and bulk operations.
 */
import type { DeviceRoutingMatrixProps } from './types';
/**
 * Desktop presenter for DeviceRoutingMatrix
 *
 * Displays devices in a virtualized table with:
 * - Checkbox column for selection
 * - Device info (name, IP, MAC, source)
 * - Service dropdown for assignment
 * - Actions (remove routing)
 * - Bulk action bar when devices selected
 */
declare function DeviceRoutingMatrixDesktopComponent(props: DeviceRoutingMatrixProps): import("react/jsx-runtime").JSX.Element;
export declare const DeviceRoutingMatrixDesktop: import("react").MemoExoticComponent<typeof DeviceRoutingMatrixDesktopComponent>;
export {};
//# sourceMappingURL=DeviceRoutingMatrixDesktop.d.ts.map