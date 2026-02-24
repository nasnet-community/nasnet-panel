/**
 * Device Card Base Component
 *
 * Shared visual component used by all platform presenters.
 * Handles the core rendering of device information with design tokens.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */
import type { DeviceCardBaseProps } from './device-card.types';
/**
 * Status dot variants using semantic design tokens
 */
declare const statusDotVariants: (props?: ({
    status?: "success" | "warning" | "muted" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Status badge variants using semantic design tokens
 */
declare const statusBadgeVariants: (props?: ({
    status?: "success" | "warning" | "muted" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Connection badge variants using network design tokens
 */
declare const connectionBadgeVariants: (props?: ({
    type?: "wireless" | "wired" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Card variant styles
 */
declare const cardVariants: (props?: ({
    interactive?: boolean | null | undefined;
    selected?: boolean | null | undefined;
    compact?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface DeviceCardBaseWithStatusProps extends DeviceCardBaseProps {
    /** Whether card is interactive (clickable) */
    interactive?: boolean;
    /** Whether card is selected */
    isSelected?: boolean;
}
/**
 * Device Card Base Component
 *
 * Renders the core device card UI with:
 * - Device icon and name
 * - IP address and vendor
 * - Online status indicator
 * - Connection type badge
 * - Confidence indicator (when applicable)
 *
 * @example
 * ```tsx
 * <DeviceCardBase
 *   icon={Monitor}
 *   name="Gaming PC"
 *   ip="192.168.1.100"
 *   vendor="Dell Inc."
 *   mac="AA:BB:CC:DD:EE:FF"
 *   isOnline={true}
 *   statusColor="success"
 *   connectionIcon={Cable}
 *   connectionText="Wired"
 *   ariaLabel="Device Gaming PC, online, wired"
 * />
 * ```
 */
export declare function DeviceCardBase({ icon: Icon, name, ip, vendor, mac, isOnline, statusColor, connectionIcon: ConnectionIcon, connectionText, showConfidenceIndicator, confidence, compact, ariaLabel, className, onClick, children, interactive, isSelected, }: DeviceCardBaseWithStatusProps): import("react/jsx-runtime").JSX.Element;
/**
 * Export variants for use in tests
 */
export { statusDotVariants, statusBadgeVariants, connectionBadgeVariants, cardVariants, };
//# sourceMappingURL=device-card-base.d.ts.map