import type { ServiceInstanceHealth } from '@nasnet/api-client/generated/types';
export interface ServiceHealthBadgeProps {
    /**
     * Health status from GraphQL
     */
    health?: ServiceInstanceHealth | null;
    /**
     * Whether to show loading state
     */
    loading?: boolean;
    /**
     * Whether to animate state transitions
     */
    animate?: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
}
/**
 * Service Health Badge - Platform-aware health status indicator
 *
 * Displays health status with appropriate detail level for each platform:
 * - Mobile: Compact dot indicator
 * - Desktop: Full badge with metrics
 *
 * @example
 * ```tsx
 * const { data, loading } = useInstanceHealth(routerId, instanceId);
 *
 * <ServiceHealthBadge
 *   health={data?.instanceHealth}
 *   loading={loading}
 *   animate
 * />
 * ```
 */
declare function ServiceHealthBadgeComponent(props: ServiceHealthBadgeProps): import("react/jsx-runtime").JSX.Element;
export declare const ServiceHealthBadge: import("react").MemoExoticComponent<typeof ServiceHealthBadgeComponent>;
export {};
//# sourceMappingURL=ServiceHealthBadge.d.ts.map