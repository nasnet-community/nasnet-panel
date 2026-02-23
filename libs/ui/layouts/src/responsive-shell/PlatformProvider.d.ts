/**
 * PlatformProvider
 * React Context provider for platform detection
 *
 * Features:
 * - Provides platform value via React Context
 * - Allows manual override for testing/debugging
 * - SSR-compatible with hydration handling
 *
 * @see ADR-018: Headless Platform Presenters
 */
import * as React from 'react';
import { type Platform } from './usePlatform';
/**
 * Platform context value
 */
export interface PlatformContextValue {
    /** Current platform */
    platform: Platform;
    /** Whether platform is being overridden manually */
    isOverridden: boolean;
    /** Set manual platform override (for testing/debugging) */
    setOverride: (platform: Platform | null) => void;
    /** Clear manual override */
    clearOverride: () => void;
}
/**
 * Props for PlatformProvider
 */
export interface PlatformProviderProps {
    children: React.ReactNode;
    /**
     * Optional initial platform override
     * Useful for testing specific platform layouts
     */
    initialPlatform?: Platform;
    /**
     * Debounce delay for platform detection (ms)
     * @default 100
     */
    debounceMs?: number;
}
/**
 * PlatformProvider Component
 *
 * Wraps the application to provide platform detection context.
 * Must be placed near the root of the component tree.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PlatformProvider>
 *   <App />
 * </PlatformProvider>
 *
 * // With initial override (for testing)
 * <PlatformProvider initialPlatform="mobile">
 *   <App />
 * </PlatformProvider>
 * ```
 */
export declare function PlatformProvider({ children, initialPlatform, debounceMs, }: PlatformProviderProps): import("react/jsx-runtime").JSX.Element;
export declare namespace PlatformProvider {
    var displayName: string;
}
/**
 * Hook to access platform context directly
 *
 * Requires PlatformProvider wrapping the component tree.
 * For components that may be used both inside and outside a PlatformProvider,
 * use `usePlatformFromContext()` instead.
 *
 * @throws {Error} If used outside PlatformProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { platform, isOverridden } = usePlatformContext();
 *
 *   return (
 *     <div>
 *       Current platform: {platform}
 *       {isOverridden && ' (overridden)'}
 *     </div>
 *   );
 * }
 * ```
 *
 * @see usePlatformFromContext for fallback detection
 */
export declare function usePlatformContext(): PlatformContextValue;
/**
 * Hook to get platform from context, falling back to direct detection
 *
 * This is useful for components that may be used both inside and outside
 * a PlatformProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   // Works with or without PlatformProvider
 *   const platform = usePlatformFromContext();
 *   // ...
 * }
 * ```
 */
export declare function usePlatformFromContext(): Platform;
/**
 * Render different content based on platform
 *
 * @example
 * ```tsx
 * <PlatformSwitch
 *   mobile={<MobileView />}
 *   tablet={<TabletView />}
 *   desktop={<DesktopView />}
 * />
 * ```
 */
export interface PlatformSwitchProps {
    mobile?: React.ReactNode;
    tablet?: React.ReactNode;
    desktop?: React.ReactNode;
    /** Fallback for unhandled platforms */
    fallback?: React.ReactNode;
}
export declare function PlatformSwitch({ mobile, tablet, desktop, fallback, }: PlatformSwitchProps): import("react/jsx-runtime").JSX.Element;
export declare namespace PlatformSwitch {
    var displayName: string;
}
/**
 * Debug component to show current platform state
 * Only renders in development mode
 *
 * Uses semantic tokens for colors:
 * - Green: Success (mobile)
 * - Amber: Warning (tablet)
 * - Blue: Info (desktop)
 * - Orange: Override indicator
 *
 * @example
 * ```tsx
 * <PlatformProvider>
 *   <App />
 *   <PlatformDebugger />
 * </PlatformProvider>
 * ```
 */
export declare function PlatformDebugger(): import("react/jsx-runtime").JSX.Element | null;
export declare namespace PlatformDebugger {
    var displayName: string;
}
//# sourceMappingURL=PlatformProvider.d.ts.map