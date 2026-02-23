/**
 * OverlapWarning Component
 * Displays a warning when the entered subnet overlaps with existing resources
 *
 * Uses semantic warning tokens from the design system.
 *
 * @example
 * ```tsx
 * <OverlapWarning
 *   overlap={{
 *     overlappingCidr: '192.168.1.0/24',
 *     resourceName: 'LAN Pool',
 *     resourceType: 'DHCP Pool',
 *   }}
 *   onShowDetails={() => openDetailsDialog()}
 * />
 * ```
 */
import type { OverlapWarningProps } from './subnet-input.types';
/**
 * OverlapWarning Component
 *
 * Displays a warning badge/alert when subnet overlap is detected.
 * Clickable to show detailed overlap information.
 */
export declare function OverlapWarning({ overlap, onShowDetails, className, }: OverlapWarningProps): import("react/jsx-runtime").JSX.Element;
export declare namespace OverlapWarning {
    var displayName: string;
}
/**
 * Compact badge version for inline use
 */
export declare function OverlapBadge({ onClick, className, }: {
    onClick?: () => void;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
export declare namespace OverlapBadge {
    var displayName: string;
}
//# sourceMappingURL=overlap-warning.d.ts.map