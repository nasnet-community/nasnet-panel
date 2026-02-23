/**
 * useBreakpoint Hook
 * Detects current viewport breakpoint using ResizeObserver for performance
 *
 * Breakpoints aligned with Tailwind CSS and design tokens:
 * - mobile: <640px (sm)
 * - tablet: 640-1024px (sm to lg)
 * - desktop: >1024px (lg+)
 *
 * @see ADR-018: Headless Platform Presenters
 * @see Docs/design/ux-design/2-core-user-experience.md Section 2.3
 */
/**
 * Breakpoint thresholds (in pixels)
 * Aligned with Tailwind CSS screens and design tokens
 */
export declare const BREAKPOINTS: {
    /** Mobile to tablet transition */
    readonly SM: 640;
    /** Optional intermediate breakpoint */
    readonly MD: 768;
    /** Tablet to desktop transition */
    readonly LG: 1024;
    /** Large desktop */
    readonly XL: 1280;
};
/**
 * Breakpoint identifier
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/**
 * Hook to detect current breakpoint
 *
 * Features:
 * - Uses ResizeObserver for efficient updates (not window.resize)
 * - Debounced (100ms) to prevent excessive re-renders
 * - SSR-compatible with desktop default
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns Current breakpoint identifier
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * // breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 *
 * if (breakpoint === 'xs' || breakpoint === 'sm') {
 *   // Mobile-specific logic
 * }
 * ```
 */
export declare function useBreakpoint(debounceMs?: number): Breakpoint;
/**
 * Hook to get viewport width as a number
 * Useful for more granular responsive logic
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns Current viewport width in pixels
 */
export declare function useViewportWidth(debounceMs?: number): number;
/**
 * Check if current breakpoint is at least as large as target breakpoint
 *
 * Useful for responsive logic that depends on meeting a minimum breakpoint.
 *
 * @param current - Current breakpoint
 * @param target - Target breakpoint to compare against
 * @returns true if current >= target (in size), false otherwise
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * const isAtLeastTablet = isBreakpointAtLeast(breakpoint, 'sm');
 *
 * if (isAtLeastTablet) {
 *   // Show desktop-optimized layout
 * }
 * ```
 */
export declare function isBreakpointAtLeast(current: Breakpoint, target: Breakpoint): boolean;
/**
 * Check if current breakpoint is at most as large as target breakpoint
 *
 * Useful for responsive logic that depends on not exceeding a breakpoint.
 *
 * @param current - Current breakpoint
 * @param target - Target breakpoint to compare against
 * @returns true if current <= target (in size), false otherwise
 *
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * const isSmallScreen = isBreakpointAtMost(breakpoint, 'sm');
 *
 * if (isSmallScreen) {
 *   // Show mobile-optimized layout
 * }
 * ```
 */
export declare function isBreakpointAtMost(current: Breakpoint, target: Breakpoint): boolean;
//# sourceMappingURL=useBreakpoint.d.ts.map