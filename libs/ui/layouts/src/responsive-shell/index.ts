/**
 * Responsive Shell Module
 *
 * Platform-aware layout system implementing ADR-018: Headless + Platform Presenters
 *
 * Components:
 * - ResponsiveShell: Auto-switches between mobile/tablet/desktop layouts
 * - PlatformProvider: React Context for platform detection with override support
 * - PlatformSwitch: Render different content based on platform
 * - PlatformDebugger: Development tool for testing different platforms
 *
 * Hooks:
 * - usePlatform: Returns current platform ('mobile' | 'tablet' | 'desktop')
 * - useBreakpoint: Returns current breakpoint ('xs' | 'sm' | 'md' | 'lg' | 'xl')
 * - useReducedMotion: Detects prefers-reduced-motion preference
 * - usePlatformConfig: Returns platform-specific configuration
 *
 * @see Docs/design/ux-design/2-core-user-experience.md Section 2.3
 * @see Docs/architecture/adrs/018-headless-platform-presenters.md
 */

// Main component
export { ResponsiveShell, getPlatformDisplayName } from './ResponsiveShell';
export type { ResponsiveShellProps } from './ResponsiveShell';

// Platform detection
export {
  usePlatform,
  usePlatformWithBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchPlatform,
  usePlatformConfig,
  detectPlatform,
  PLATFORM_THRESHOLDS,
} from './usePlatform';
export type { Platform } from './usePlatform';

// Breakpoint detection
export {
  useBreakpoint,
  useViewportWidth,
  isBreakpointAtLeast,
  isBreakpointAtMost,
  BREAKPOINTS,
} from './useBreakpoint';
export type { Breakpoint } from './useBreakpoint';

// Platform context
export {
  PlatformProvider,
  usePlatformContext,
  usePlatformFromContext,
  PlatformSwitch,
  PlatformDebugger,
} from './PlatformProvider';
export type {
  PlatformProviderProps,
  PlatformContextValue,
  PlatformSwitchProps,
} from './PlatformProvider';

// Reduced motion
export {
  useReducedMotion,
  useAnimationDuration,
  useMotionConfig,
  useMotionClasses,
  ANIMATION_DURATIONS,
} from './useReducedMotion';
