/**
 * useNotificationBell Hook
 *
 * Headless hook containing all business logic for NotificationBell.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import type { NotificationBellProps, NotificationBellState } from './types';
/**
 * Headless hook for NotificationBell pattern
 *
 * Contains all business logic, state management, and computed values.
 * Event handlers are memoized for stable references.
 *
 * @example
 * ```tsx
 * function NotificationBellMobile(props: NotificationBellProps) {
 *   const {
 *     isOpen,
 *     unreadCount,
 *     formattedCount,
 *     showBadge,
 *     handleToggle,
 *   } = useNotificationBell(props);
 *
 *   return (
 *     <Sheet open={isOpen} onOpenChange={handleToggle}>
 *       <Button>
 *         <Bell size={20} />
 *         {showBadge && <Badge>{formattedCount}</Badge>}
 *       </Button>
 *     </Sheet>
 *   );
 * }
 * ```
 */
export declare function useNotificationBell(props: NotificationBellProps): NotificationBellState;
//# sourceMappingURL=useNotificationBell.d.ts.map