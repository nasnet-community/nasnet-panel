/**
 * useInterfaceStatusCard Headless Hook
 *
 * Provides logic for InterfaceStatusCard component including:
 * - Click/keyboard event handling
 * - Status change detection for animations
 * - Accessibility attributes
 *
 * @description
 * Centralized business logic for interface status card interactions.
 * Handles keyboard navigation (Enter/Space), detects status changes for pulse animations,
 * respects reduced motion preferences, and generates ARIA attributes for screen readers.
 * Separated from presentation via Headless + Platform Presenters pattern.
 */
import type { InterfaceGridData } from './types';
interface UseInterfaceStatusCardProps {
    /** Interface data */
    interface: InterfaceGridData;
    /** Callback when card is selected */
    onSelect: (iface: InterfaceGridData) => void;
}
interface UseInterfaceStatusCardReturn {
    /** Click handler for the card */
    handleClick: () => void;
    /** Keyboard handler for Enter/Space */
    handleKeyDown: (e: React.KeyboardEvent) => void;
    /** Whether status recently changed (for animation) */
    isStatusChanged: boolean;
    /** Whether to skip animations */
    prefersReducedMotion: boolean;
    /** ARIA label for the card */
    ariaLabel: string;
    /** ID for the details element (for aria-describedby) */
    detailsId: string;
}
/**
 * Headless hook for InterfaceStatusCard component.
 * Handles click/keyboard events, status change detection, and accessibility.
 *
 * @example
 * function InterfaceStatusCard({ interface, onSelect }: InterfaceStatusCardProps) {
 *   const {
 *     handleClick,
 *     handleKeyDown,
 *     isStatusChanged,
 *     prefersReducedMotion,
 *     ariaLabel,
 *     detailsId,
 *   } = useInterfaceStatusCard({ interface, onSelect });
 *
 *   return (
 *     <Card
 *       role="article"
 *       aria-label={ariaLabel}
 *       aria-describedby={detailsId}
 *       tabIndex={0}
 *       onClick={handleClick}
 *       onKeyDown={handleKeyDown}
 *       className={cn(!prefersReducedMotion && isStatusChanged && 'animate-pulse')}
 *     >
 *       <CardContent>{/* ... *\/}</CardContent>
 *     </Card>
 *   );
 * }
 */
export declare function useInterfaceStatusCard({ interface: iface, onSelect, }: UseInterfaceStatusCardProps): UseInterfaceStatusCardReturn;
export {};
//# sourceMappingURL=useInterfaceStatusCard.d.ts.map