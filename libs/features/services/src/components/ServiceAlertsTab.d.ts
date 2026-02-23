/**
 * ServiceAlertsTab Component
 *
 * Platform-agnostic service alerts display with automatic presenter selection.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @description
 * Auto-detects platform and renders appropriate presenter:
 * - Mobile (<640px): Card-based list with swipe-to-acknowledge and 44px touch targets
 * - Tablet/Desktop (≥640px): DataTable with sortable columns and bulk operations
 *
 * @example
 * ```tsx
 * <ServiceAlertsTab routerId="router-123" instanceId="instance-456" />
 * ```
 *
 * @see Task #12: Create ServiceAlertsTab with platform presenters
 * @see ADR-018: Headless + Platform Presenters Pattern
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */
/**
 * ServiceAlertsTab props interface
 *
 * @interface ServiceAlertsTabProps
 */
export interface ServiceAlertsTabProps {
    /** Router ID to fetch alerts for */
    routerId: string;
    /** Service instance ID to fetch alerts for */
    instanceId: string;
    /** Optional className for custom styling */
    className?: string;
}
/**
 * ServiceAlertsTab component
 *
 * @description
 * Automatically selects the appropriate presenter based on viewport:
 * - Mobile: Card-based layout with filter chips and swipe gestures
 * - Desktop: Dense DataTable with sorting, filtering, and bulk actions
 *
 * Uses platform detection from PlatformProvider context.
 *
 * @param props - Component props
 * @returns Rendered alert tab with platform-specific presenter
 */
declare function ServiceAlertsTabComponent({ routerId, instanceId, className, }: ServiceAlertsTabProps): import("react/jsx-runtime").JSX.Element;
export declare const ServiceAlertsTab: import("react").MemoExoticComponent<typeof ServiceAlertsTabComponent>;
export {};
//# sourceMappingURL=ServiceAlertsTab.d.ts.map