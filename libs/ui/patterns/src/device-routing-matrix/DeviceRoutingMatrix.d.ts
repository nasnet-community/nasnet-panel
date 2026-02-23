/**
 * DeviceRoutingMatrix Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <DeviceRoutingMatrix
 *   routerId="router-1"
 *   matrix={{
 *     devices: [...],
 *     interfaces: [...],
 *     routings: [...],
 *     summary: {...}
 *   }}
 *   actions={{
 *     onAssign: async (deviceID, interfaceID) => {},
 *     onRemove: async (routingID) => {},
 *     onBulkAssign: async (deviceIDs, interfaceID) => {},
 *   }}
 * />
 * ```
 */
import type { DeviceRoutingMatrixProps } from './types';
/**
 * DeviceRoutingMatrix - Device-to-Service routing assignment UI
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Touch-optimized cards with 44px targets and bottom sheet
 * - Tablet/Desktop (≥640px): Virtualized table with keyboard navigation
 *
 * Features:
 * - Multi-select with checkboxes
 * - Bulk assignment to services
 * - Real-time status updates
 * - Search and filtering
 * - Optimistic UI updates
 */
declare function DeviceRoutingMatrixComponent(props: DeviceRoutingMatrixProps): import("react/jsx-runtime").JSX.Element;
export declare const DeviceRoutingMatrix: import("react").MemoExoticComponent<typeof DeviceRoutingMatrixComponent>;
export {};
//# sourceMappingURL=DeviceRoutingMatrix.d.ts.map