/**
 * usePlatform Hook
 * Detects current platform based on viewport breakpoints
 *
 * Platform definitions per UX Design (Section 2.3 Adaptive Layouts):
 * - mobile: <640px - Consumer-grade simplicity, bottom tab bar, 44px touch targets
 * - tablet: 640-1024px - Hybrid, collapsible sidebar
 * - desktop: >1024px - Pro-grade density, fixed sidebar, data tables
 *
 * @see ADR-018: Headless Platform Presenters
 * @see Docs/design/ux-design/2-core-user-experience.md
 */
import { type Breakpoint } from './useBreakpoint';
/**
 * Platform type for responsive layouts
 * Each platform has distinct UX paradigms and component presenters
 */
export type Platform = 'mobile' | 'tablet' | 'desktop';
/**
 * Platform breakpoint thresholds (in pixels)
 * Aligned with design tokens and Tailwind screens
 */
export declare const PLATFORM_THRESHOLDS: {
    /** Mobile to tablet transition */
    readonly MOBILE_MAX: 640;
    /** Tablet to desktop transition */
    readonly TABLET_MAX: 1024;
};
/**
 * Detect platform directly from viewport width
 *
 * Useful for server-side rendering or pre-calculating platform values.
 * For React components, use `usePlatform()` hook instead.
 *
 * @param width - Viewport width in pixels
 * @returns Platform designation ('mobile' | 'tablet' | 'desktop')
 *
 * @example
 * ```tsx
 * const platform = detectPlatform(768); // Returns 'tablet'
 * ```
 */
export declare function detectPlatform(width: number): Platform;
/**
 * Hook to detect current platform for responsive layouts
 *
 * This is the primary hook for implementing platform-specific presenters
 * as defined in ADR-018 (Headless + Platform Presenters pattern).
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns Current platform: 'mobile' | 'tablet' | 'desktop'
 *
 * @example
 * ```tsx
 * // In a pattern component (Layer 2)
 * export function ResourceCard<T>(props: ResourceCardProps<T>) {
 *   const platform = usePlatform();
 *
 *   switch (platform) {
 *     case 'mobile':
 *       return <ResourceCardMobile {...props} />;
 *     case 'tablet':
 *       return <ResourceCardTablet {...props} />;
 *     case 'desktop':
 *       return <ResourceCardDesktop {...props} />;
 *   }
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In ResponsiveShell (auto-selects layout shell)
 * const ResponsiveShell = ({ children }) => {
 *   const platform = usePlatform();
 *
 *   switch (platform) {
 *     case 'mobile':
 *       return <MobileAppShell>{children}</MobileAppShell>;
 *     case 'tablet':
 *     case 'desktop':
 *       return <AppShell sidebar={<CollapsibleSidebar />}>{children}</AppShell>;
 *   }
 * };
 * ```
 */
export declare function usePlatform(debounceMs?: number): Platform;
/**
 * Hook that returns both platform and breakpoint for more granular control
 *
 * Use when you need both coarse-grained platform detection and fine-grained
 * breakpoint information for responsive logic.
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns Object with platform ('mobile'|'tablet'|'desktop') and breakpoint ('xs'|'sm'|'md'|'lg'|'xl')
 *
 * @example
 * ```tsx
 * const { platform, breakpoint } = usePlatformWithBreakpoint();
 *
 * // Use platform for layout shell selection (MobileAppShell vs AppShell)
 * // Use breakpoint for finer-grained adjustments (column count, spacing, etc.)
 * if (platform === 'tablet' && breakpoint === 'md') {
 *   // Show 2-column layout on medium tablets
 * }
 * ```
 */
export declare function usePlatformWithBreakpoint(debounceMs?: number): {
    platform: Platform;
    breakpoint: Breakpoint;
};
/**
 * Check if current platform is mobile (<640px)
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns true if current viewport is mobile
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   // Mobile-specific logic
 * }
 * ```
 */
export declare function useIsMobile(debounceMs?: number): boolean;
/**
 * Check if current platform is tablet (640-1024px)
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns true if current viewport is tablet
 */
export declare function useIsTablet(debounceMs?: number): boolean;
/**
 * Check if current platform is desktop (>1024px)
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns true if current viewport is desktop
 */
export declare function useIsDesktop(debounceMs?: number): boolean;
/**
 * Check if current platform supports touch-first interaction
 *
 * Returns true for mobile and tablet platforms, false for desktop.
 * Useful for touch-specific UI adaptations.
 *
 * @param debounceMs - Debounce delay in milliseconds (default: 100)
 * @returns true if platform is mobile or tablet (touch-capable)
 *
 * @example
 * ```tsx
 * const isTouchPlatform = useIsTouchPlatform();
 * if (isTouchPlatform) {
 *   // Increase button size for touch
 *   // Use swipe gestures instead of drag-drop
 * }
 * ```
 */
export declare function useIsTouchPlatform(debounceMs?: number): boolean;
/**
 * Platform-specific configuration helper
 *
 * Returns the configuration object matching the current platform.
 * Useful for adapting layout configurations, animation timings, or other
 * platform-dependent behavior without conditional rendering.
 *
 * @template T - Type of configuration object
 * @param config - Configuration object with keys for each platform
 * @returns Configuration object for current platform
 *
 * @example
 * ```tsx
 * const layout = usePlatformConfig({
 *   mobile: { columns: 1, gap: 'sm' },
 *   tablet: { columns: 2, gap: 'md' },
 *   desktop: { columns: 3, gap: 'lg' },
 * });
 *
 * return (
 *   <Grid columns={layout.columns} gap={layout.gap}>
 *     {items}
 *   </Grid>
 * );
 * ```
 */
export declare function usePlatformConfig<T>(config: Record<Platform, T>): T;
//# sourceMappingURL=usePlatform.d.ts.map