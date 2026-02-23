/**
 * Device Card Desktop Presenter
 *
 * Desktop-optimized presenter for device cards.
 * Features hover states, dropdown menu for actions, and inline editing.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */
import type { DeviceCardPresenterProps } from './device-card.types';
/**
 * Device Card Desktop Presenter
 *
 * Desktop-specific features:
 * - Hover state reveals quick action buttons
 * - Dropdown menu for full actions
 * - Inline edit for device name
 * - Dialog for static IP assignment
 * - Safety confirmation for block action
 *
 * @example
 * ```tsx
 * <DeviceCardDesktop
 *   state={hookState}
 *   device={device}
 *   onRename={(name) => updateName(name)}
 *   showActions
 * />
 * ```
 */
export declare function DeviceCardDesktop({ state, device, compact, showActions, className, id, isSelected, onClick, onRename, onAssignStaticIp, }: DeviceCardPresenterProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=device-card-desktop.d.ts.map