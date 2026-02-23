import { useEffect, useLayoutEffect } from 'react';

import { useThemeStore, type ThemeStore } from '@nasnet/state/stores';

/**
 * ThemeProvider Component
 *
 * Manages the application theme by:
 * 1. Listening to theme state from the Zustand store
 * 2. Applying/removing 'dark' class on <html> element
 * 3. Using useLayoutEffect to prevent Flash of Unstyled Content (FOUC)
 * 4. Listening for system theme changes when in 'system' mode
 *
 * The 'dark' class triggers Tailwind CSS dark mode variants.
 * All components using dark: prefixed utilities will respond to this class.
 *
 * System Theme Detection:
 * - When theme is 'system', monitors OS preference changes
 * - Updates resolvedTheme automatically when OS theme changes
 * - Removes listener when theme is manually set or component unmounts
 *
 * Usage:
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state: ThemeStore) => state.theme);
  const resolvedTheme = useThemeStore((state: ThemeStore) => state.resolvedTheme);
  const setResolvedTheme = useThemeStore((state: ThemeStore) => state._setResolvedTheme);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    // Only listen when user has selected 'system' mode
    if (theme !== 'system') {
      return;
    }

    // Create media query for system dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Update resolved theme when system preference changes
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(systemTheme);
    };

    // Set initial resolved theme based on current system preference
    handleChange(mediaQuery);

    // Listen for changes (modern browsers)
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup listener on unmount or when theme changes
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, setResolvedTheme]);

  // Resolve explicit theme selections immediately
  useEffect(() => {
    if (theme === 'light') {
      setResolvedTheme('light');
    } else if (theme === 'dark') {
      setResolvedTheme('dark');
    }
    // 'system' is handled by the matchMedia listener above
  }, [theme, setResolvedTheme]);

  // Use useLayoutEffect to apply theme before browser paint
  // This prevents Flash of Unstyled Content (FOUC)
  useLayoutEffect(() => {
    const root = document.documentElement;

    // Apply .dark class (for Tailwind dark: variants), data-theme attribute (for CSS variables),
    // and color-scheme property (for native element theming: scrollbars, form controls, etc.)
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, [resolvedTheme]);

  return <>{children}</>;
}
ThemeProvider.displayName = 'ThemeProvider';
