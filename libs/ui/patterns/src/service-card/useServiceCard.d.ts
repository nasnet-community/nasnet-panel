/**
 * useServiceCard Hook
 *
 * Headless hook containing all business logic for ServiceCard.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import type { ServiceCardProps, ServiceAction, ServiceStatus } from './types';
/**
 * Badge variant type matching primitives Badge component
 */
export type BadgeVariant = 'default' | 'secondary' | 'success' | 'connected' | 'warning' | 'error' | 'info' | 'offline' | 'outline';
/**
 * Return type for useServiceCard hook
 */
export interface UseServiceCardReturn {
    status: ServiceStatus;
    isRunning: boolean;
    isInstalled: boolean;
    isAvailable: boolean;
    isFailed: boolean;
    statusColor: BadgeVariant;
    statusLabel: string;
    categoryColor: string;
    primaryAction: ServiceAction | undefined;
    secondaryActions: ServiceAction[];
    hasActions: boolean;
    hasMetrics: boolean;
    cpuUsage: number | undefined;
    memoryUsage: number | undefined;
    networkRx: number | undefined;
    networkTx: number | undefined;
    handleClick: () => void;
    handlePrimaryAction: () => void;
}
/**
 * Format bytes to human-readable string
 */
declare function formatBytes(bytes: number): string;
/**
 * Headless hook for ServiceCard pattern
 *
 * Contains all business logic, state management, and computed values.
 * Event handlers are memoized for stable references.
 *
 * @example
 * ```tsx
 * function ServiceCardMobile(props: ServiceCardProps) {
 *   const {
 *     status,
 *     isRunning,
 *     primaryAction,
 *     handlePrimaryAction,
 *   } = useServiceCard(props);
 *
 *   return (
 *     <Card>
 *       <Badge variant={statusColor}>{statusLabel}</Badge>
 *       {primaryAction && (
 *         <Button onClick={handlePrimaryAction}>{primaryAction.label}</Button>
 *       )}
 *     </Card>
 *   );
 * }
 * ```
 */
export declare function useServiceCard(props: ServiceCardProps): UseServiceCardReturn;
/**
 * Export helper for formatting bytes
 */
export { formatBytes };
//# sourceMappingURL=useServiceCard.d.ts.map