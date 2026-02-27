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

import { usePlatform, type Platform } from './usePlatform';

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
 * Platform context
 */
const PlatformContext = React.createContext<PlatformContextValue | null>(null);

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
export function PlatformProvider({
  children,
  initialPlatform,
  debounceMs = 100,
}: PlatformProviderProps) {
  const detectedPlatform = usePlatform(debounceMs);
  const [override, setOverrideState] = React.useState<Platform | null>(
    initialPlatform ?? null
  );

  const platform = override ?? detectedPlatform;
  const isOverridden = override !== null;

  const setOverride = React.useCallback((newPlatform: Platform | null) => {
    setOverrideState(newPlatform);
  }, []);

  const clearOverride = React.useCallback(() => {
    setOverrideState(null);
  }, []);

  const value = React.useMemo<PlatformContextValue>(
    () => ({
      platform,
      isOverridden,
      setOverride,
      clearOverride,
    }),
    [platform, isOverridden, setOverride, clearOverride]
  );

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
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
export function usePlatformContext(): PlatformContextValue {
  const context = React.useContext(PlatformContext);

  if (!context) {
    throw new Error(
      'usePlatformContext must be used within a PlatformProvider. ' +
        'Wrap your component tree with <PlatformProvider>.'
    );
  }

  return context;
}

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
export function usePlatformFromContext(): Platform {
  const context = React.useContext(PlatformContext);
  const fallbackPlatform = usePlatform();

  return context?.platform ?? fallbackPlatform;
}

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

export function PlatformSwitch({
  mobile,
  tablet,
  desktop,
  fallback = null,
}: PlatformSwitchProps) {
  const platform = usePlatformFromContext();

  switch (platform) {
    case 'mobile':
      return <>{mobile ?? fallback}</>;
    case 'tablet':
      return <>{tablet ?? fallback}</>;
    case 'desktop':
      return <>{desktop ?? fallback}</>;
    default:
      return <>{fallback}</>;
  }
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
export function PlatformDebugger() {
  const { platform, isOverridden, setOverride, clearOverride } =
    usePlatformContext();

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 p-2 bg-muted border border-border rounded-[var(--semantic-radius-button)] font-mono md:bottom-4">
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`w-2 h-2 rounded-full ${
            platform === 'mobile'
              ? 'bg-success'
              : platform === 'tablet'
              ? 'bg-warning'
              : 'bg-info'
          }`}
        />
        <span className="text-foreground">{platform}</span>
        {isOverridden && <span className="text-orange-500">(override)</span>}
      </div>
      <div className="flex gap-1 mt-1">
        <button
          type="button"
          onClick={() => setOverride('mobile')}
          className="px-1 py-0.5 bg-muted-foreground/20 hover:bg-muted-foreground/30 rounded text-foreground transition-colors duration-150"
          aria-label="Override platform to mobile"
        >
          M
        </button>
        <button
          type="button"
          onClick={() => setOverride('tablet')}
          className="px-1 py-0.5 bg-muted-foreground/20 hover:bg-muted-foreground/30 rounded text-foreground transition-colors duration-150"
          aria-label="Override platform to tablet"
        >
          T
        </button>
        <button
          type="button"
          onClick={() => setOverride('desktop')}
          className="px-1 py-0.5 bg-muted-foreground/20 hover:bg-muted-foreground/30 rounded text-foreground transition-colors duration-150"
          aria-label="Override platform to desktop"
        >
          D
        </button>
        {isOverridden && (
          <button
            type="button"
            onClick={clearOverride}
            className="px-1 py-0.5 bg-error/20 hover:bg-error/30 rounded text-error transition-colors duration-150"
            aria-label="Clear platform override"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Display names for debugging (React DevTools)
 */
PlatformProvider.displayName = 'PlatformProvider';
PlatformSwitch.displayName = 'PlatformSwitch';
PlatformDebugger.displayName = 'PlatformDebugger';
