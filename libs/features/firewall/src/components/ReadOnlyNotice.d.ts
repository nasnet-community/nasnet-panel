/**
 * Read-Only Notice Component
 * @description Displays informational banner explaining firewall editing is disabled in Phase 0
 * Epic 0.6, Story 0.6.4
 */
export interface ReadOnlyNoticeProps {
    /** Optional CSS class names to apply to container */
    className?: string;
}
/**
 * ReadOnlyNotice Component
 * @description Displays at the top of the Firewall tab with:
 * - Info style (blue semantic token)
 * - Clear explanation of WHY editing is disabled
 * - Reference to Phase 1 safety pipeline
 * - Dismissible with localStorage persistence
 *
 * @example
 * ```tsx
 * <ReadOnlyNotice className="mb-4" />
 * ```
 *
 * @param props - Component props
 * @returns Read-only notice banner or null if dismissed
 */
export declare const ReadOnlyNotice: import("react").NamedExoticComponent<ReadOnlyNoticeProps>;
//# sourceMappingURL=ReadOnlyNotice.d.ts.map