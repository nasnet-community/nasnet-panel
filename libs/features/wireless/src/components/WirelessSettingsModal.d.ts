/**
 * WirelessSettingsModal Component
 * Modal dialog for editing comprehensive wireless settings
 * Implements FR0-18: Modal for editing wireless configuration
 */
import * as React from 'react';
import type { WirelessInterfaceDetail } from '@nasnet/core/types';
export interface WirelessSettingsModalProps {
    /** The wireless interface to edit */
    interface: WirelessInterfaceDetail;
    /** Whether the modal is open */
    open: boolean;
    /** Callback when open state changes */
    onOpenChange: (open: boolean) => void;
}
/**
 * Wireless Settings Modal Component
 * - Dialog with responsive layout (wider for comprehensive form)
 * - Wraps WirelessSettingsForm with all interface values
 * - Handles unsaved changes warning
 * - Integrates with mutation hook for all settings
 * - Scrollable content for mobile devices
 *
 * @description Modal dialog for editing comprehensive wireless settings with unsaved changes detection
 *
 * @example
 * ```tsx
 * const [showModal, setShowModal] = useState(false);
 *
 * <WirelessSettingsModal
 *   interface={wirelessInterface}
 *   open={showModal}
 *   onOpenChange={setShowModal}
 * />
 * ```
 */
declare function WirelessSettingsModalComponent({ interface: iface, open, onOpenChange, }: WirelessSettingsModalProps): import("react/jsx-runtime").JSX.Element;
export declare const WirelessSettingsModal: React.MemoExoticComponent<typeof WirelessSettingsModalComponent>;
export {};
//# sourceMappingURL=WirelessSettingsModal.d.ts.map