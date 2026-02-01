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

import { useMemo } from 'react';

import {
  useBreakpoint,
  type Breakpoint,
  BREAKPOINTS,
} from './useBreakpoint';

/**
 * Platform type for responsive layouts
 * Each platform has distinct UX paradigms and component presenters
 */
export type Platform = 'mobile' | 'tablet' | 'desktop';

/**
 * Platform breakpoint thresholds (in pixels)
 * Aligned with design tokens and Tailwind screens
 */
export const PLATFORM_THRESHOLDS = {
  /** Mobile to tablet transition */
  MOBILE_MAX: BREAKPOINTS.SM,
  /** Tablet to desktop transition */
  TABLET_MAX: BREAKPOINTS.LG,
} as const;

/**
 * Convert breakpoint to platform
 */
function breakpointToPlatform(breakpoint: Breakpoint): Platform {
  switch (breakpoint) {
    case 'xs':
      return 'mobile';
    case 'sm':
    case 'md':
      return 'tablet';
    case 'lg':
    case 'xl':
      return 'desktop';
    default:
      return 'desktop';
  }
}

/**
 * Detect platform from viewport width directly
 */
export function detectPlatform(width: number): Platform {
  if (width < PLATFORM_THRESHOLDS.MOBILE_MAX) return 'mobile';
  if (width < PLATFORM_THRESHOLDS.TABLET_MAX) return 'tablet';
  return 'desktop';
}

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
export function usePlatform(debounceMs = 100): Platform {
  const breakpoint = useBreakpoint(debounceMs);

  return useMemo(() => breakpointToPlatform(breakpoint), [breakpoint]);
}

/**
 * Hook that returns both platform and breakpoint for more granular control
 *
 * @example
 * ```tsx
 * const { platform, breakpoint } = usePlatformWithBreakpoint();
 *
 * // Use platform for layout shell selection
 * // Use breakpoint for finer-grained responsive adjustments
 * ```
 */
export function usePlatformWithBreakpoint(debounceMs = 100) {
  const breakpoint = useBreakpoint(debounceMs);
  const platform = useMemo(() => breakpointToPlatform(breakpoint), [breakpoint]);

  return { platform, breakpoint };
}

/**
 * Check if current platform is mobile
 */
export function useIsMobile(debounceMs = 100): boolean {
  const platform = usePlatform(debounceMs);
  return platform === 'mobile';
}

/**
 * Check if current platform is tablet
 */
export function useIsTablet(debounceMs = 100): boolean {
  const platform = usePlatform(debounceMs);
  return platform === 'tablet';
}

/**
 * Check if current platform is desktop
 */
export function useIsDesktop(debounceMs = 100): boolean {
  const platform = usePlatform(debounceMs);
  return platform === 'desktop';
}

/**
 * Check if current platform supports touch-first interaction
 * (mobile or tablet)
 */
export function useIsTouchPlatform(debounceMs = 100): boolean {
  const platform = usePlatform(debounceMs);
  return platform === 'mobile' || platform === 'tablet';
}

/**
 * Platform-specific configuration helper
 *
 * @example
 * ```tsx
 * const config = usePlatformConfig({
 *   mobile: { columns: 1, gap: 'sm' },
 *   tablet: { columns: 2, gap: 'md' },
 *   desktop: { columns: 3, gap: 'lg' },
 * });
 * // Returns the config for current platform
 * ```
 */
export function usePlatformConfig<T>(config: Record<Platform, T>): T {
  const platform = usePlatform();
  return config[platform];
}
