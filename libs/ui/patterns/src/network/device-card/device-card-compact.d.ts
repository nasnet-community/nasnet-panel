/**
 * Device Card Compact Presenter
 *
 * Minimal variant for sidebar/widget usage.
 * Shows icon, name, and status dot only.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */
import type { DeviceCardPresenterProps } from './device-card.types';
/**
 * Device Card Compact Presenter
 *
 * Compact-specific features:
 * - Single row: Icon + Name + Status dot
 * - No actions visible
 * - Click expands to full card or triggers onClick
 * - Suitable for sidebar and widget contexts
 *
 * @example
 * ```tsx
 * <DeviceCardCompact
 *   state={hookState}
 *   device={device}
 *   onClick={() => setSelectedDevice(device)}
 * />
 * ```
 */
export declare function DeviceCardCompact({ state, device, className, id, isSelected, onClick, }: DeviceCardPresenterProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=device-card-compact.d.ts.map