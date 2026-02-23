/**
 * Device Card Mobile Presenter
 *
 * Mobile-optimized presenter for device cards.
 * Features touch-friendly interactions and bottom sheet for details.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */
import type { DeviceCardPresenterProps } from './device-card.types';
/**
 * Device Card Mobile Presenter
 *
 * Mobile-specific features:
 * - Tap opens bottom sheet with full details
 * - 44px minimum touch targets
 * - Bottom sheet for device actions
 * - Full-width action buttons
 *
 * @example
 * ```tsx
 * <DeviceCardMobile
 *   state={hookState}
 *   device={device}
 *   onRename={(name) => updateName(name)}
 *   showActions
 * />
 * ```
 */
export declare function DeviceCardMobile({ state, device, compact, showActions, className, id, isSelected, onClick, onRename, onAssignStaticIp, }: DeviceCardPresenterProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=device-card-mobile.d.ts.map