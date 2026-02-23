/**
 * useMediaQuery Hook
 *
 * React hook for detecting media query matches.
 * Useful for responsive design, platform detection, and conditional rendering.
 *
 * Returns a boolean that updates whenever the media query state changes,
 * allowing components to respond to viewport size and device capability changes.
 *
 * SSR-safe: returns false during server-side rendering to avoid hydration mismatches.
 *
 * @module @nasnet/ui/primitives/hooks
 *
 * @param {string} query - CSS media query string (e.g., '(max-width: 640px)', '(prefers-color-scheme: dark)')
 * @returns {boolean} true if the media query matches, false otherwise
 *
 * @example
 * ```tsx
 * // Platform detection
 * const isMobile = useMediaQuery('(max-width: 640px)');
 * const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
 * const isDesktop = useMediaQuery('(min-width: 1025px)');
 *
 * // Theme detection
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * // Touch capability
 * const isTouchDevice = useMediaQuery('(hover: none)');
 *
 * // Responsive rendering
 * function MyComponent() {
 *   const isLargeScreen = useMediaQuery('(min-width: 1024px)');
 *   return isLargeScreen ? <DesktopView /> : <MobileView />;
 * }
 * ```
 */

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value based on current viewport
    setMatches(mediaQuery.matches);

    // Create event listener for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener for media query changes
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup listener on unmount or query change
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
