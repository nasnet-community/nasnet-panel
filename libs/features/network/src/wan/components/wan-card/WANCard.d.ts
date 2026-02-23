/**
 * WAN Card Component
 *
 * Composite card displaying WAN interface status, health, and connection details.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 8: Overview Integration)
 *
 * @description Displays comprehensive WAN interface information including connection type,
 * status, public IP, health monitoring status, and quick action buttons.
 */
import type { WANInterfaceData } from '../../types/wan.types';
export interface WANCardProps {
    wan: WANInterfaceData;
    onConfigure?: (wanId: string) => void;
    onViewDetails?: (wanId: string) => void;
}
export declare const WANCard: import("react").MemoExoticComponent<{
    ({ wan, onConfigure, onViewDetails }: WANCardProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
}>;
export declare const WANCardCompact: import("react").MemoExoticComponent<{
    ({ wan, onConfigure, onViewDetails }: WANCardProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
}>;
//# sourceMappingURL=WANCard.d.ts.map