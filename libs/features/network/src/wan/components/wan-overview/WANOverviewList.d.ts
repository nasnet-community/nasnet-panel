/**
 * WAN Overview List Component
 *
 * Responsive grid of WAN interface cards with real-time updates.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 8: Overview Integration)
 *
 * @description Displays all WAN interfaces in a responsive grid (1 column mobile, 2 tablet, 3 desktop).
 * Includes loading/error states, statistics footer, and quick action buttons.
 */
import type { WANInterfaceData } from '../../types/wan.types';
export interface WANOverviewListProps {
    wans: WANInterfaceData[];
    loading?: boolean;
    error?: Error | null;
    onAddWAN?: () => void;
    onConfigureWAN?: (wanId: string) => void;
    onViewDetails?: (wanId: string) => void;
    onRefresh?: () => void;
}
export declare const WANOverviewList: import("react").MemoExoticComponent<{
    ({ wans, loading, error, onAddWAN, onConfigureWAN, onViewDetails, onRefresh, }: WANOverviewListProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
}>;
//# sourceMappingURL=WANOverviewList.d.ts.map