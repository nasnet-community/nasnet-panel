/**
 * Theme Service for managing application theme state (light/dark/dim modes)
 * Provides theme switching, persistence, and system preference detection
 */

export type Theme = 'light' | 'dark' | 'dim';

/**
 * Theme change event listener type
 */
export type ThemeChangeListener = (theme: Theme) => void;

/**
 * Local storage key for theme persistence
 */
const THEME_STORAGE_KEY = 'nasnet-theme-preference';

/**
 * Current active theme
 */
let currentTheme: Theme = 'light';

/**
 * Theme change listeners
 */
const listeners = new Set<ThemeChangeListener>();

/**
 * Initialize theme service
 * - Loads theme from localStorage
 * - Falls back to system preference
 * - Applies theme to document
 */
export const initializeTheme = (): Theme => {
  // Try to load saved theme preference
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;

  if (savedTheme && isValidTheme(savedTheme)) {
    currentTheme = savedTheme;
  } else {
    // Detect system preference
    currentTheme = getSystemPreference();
  }

  // Apply theme to document
  applyTheme(currentTheme);

  // Listen for system preference changes
  listenToSystemPreferenceChanges();

  return currentTheme;
};

/**
 * Get current theme
 */
export const getTheme = (): Theme => {
  return currentTheme;
};

/**
 * Set theme
 * - Updates document classes
 * - Persists to localStorage
 * - Notifies listeners
 */
export const setTheme = (theme: Theme): void => {
  if (!isValidTheme(theme)) {
    console.warn(`Invalid theme: ${theme}. Using 'light' as fallback.`);
    theme = 'light';
  }

  currentTheme = theme;

  // Apply theme to document
  applyTheme(theme);

  // Persist to localStorage
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  // Notify listeners
  notifyListeners(theme);
};

/**
 * Toggle between light and dark themes
 */
export const toggleTheme = (): Theme => {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
};

/**
 * Cycle through all theme options (light → dark → dim → light)
 */
export const cycleTheme = (): Theme => {
  const themes: Theme[] = ['light', 'dark', 'dim'];
  const currentIndex = themes.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themes.length;
  const newTheme = themes[nextIndex];

  setTheme(newTheme);
  return newTheme;
};

/**
 * Subscribe to theme changes
 * @returns Unsubscribe function
 */
export const subscribeToThemeChanges = (listener: ThemeChangeListener): (() => void) => {
  listeners.add(listener);

  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Clear theme preference (revert to system preference)
 */
export const clearThemePreference = (): Theme => {
  localStorage.removeItem(THEME_STORAGE_KEY);
  const systemTheme = getSystemPreference();
  setTheme(systemTheme);
  return systemTheme;
};

/**
 * Get system color scheme preference
 */
export const getSystemPreference = (): Theme => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

/**
 * Check if theme matches system preference
 */
export const isSystemPreference = (): boolean => {
  return currentTheme === getSystemPreference();
};

/**
 * Apply theme to document element
 */
const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;

  // Remove all theme classes
  root.classList.remove('light', 'dark', 'dim');

  // Remove data-theme attribute (legacy support)
  root.removeAttribute('data-theme');

  // Add current theme class for Tailwind dark mode
  root.classList.add(theme);

  // Also set data-theme for custom theme variants
  root.setAttribute('data-theme', theme);

  // Set color-scheme CSS property for native form controls
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
};

/**
 * Validate theme value
 */
const isValidTheme = (theme: string): theme is Theme => {
  return theme === 'light' || theme === 'dark' || theme === 'dim';
};

/**
 * Notify all listeners of theme change
 */
const notifyListeners = (theme: Theme): void => {
  listeners.forEach(listener => {
    try {
      listener(theme);
    } catch (error) {
      console.error('Theme listener error:', error);
    }
  });
};

/**
 * Listen to system preference changes
 */
const listenToSystemPreferenceChanges = (): void => {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent) => {
    // Only auto-switch if user hasn't set a manual preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (!savedTheme) {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
    }
  };

  // Modern browsers
  if (darkModeQuery.addEventListener) {
    darkModeQuery.addEventListener('change', handleChange);
  } else {
    // Legacy browsers
    darkModeQuery.addListener(handleChange);
  }
};

/**
 * Get theme icon name for UI
 */
export const getThemeIcon = (theme?: Theme): string => {
  const t = theme || currentTheme;

  switch (t) {
    case 'dark':
      return '🌙';
    case 'dim':
      return '🌗';
    case 'light':
    default:
      return '☀️';
  }
};

/**
 * Get theme display name
 */
export const getThemeDisplayName = (theme?: Theme): string => {
  const t = theme || currentTheme;

  switch (t) {
    case 'dark':
      return 'Dark Mode';
    case 'dim':
      return 'Dim Mode';
    case 'light':
    default:
      return 'Light Mode';
  }
};

/**
 * Export theme metadata
 */
export const getThemeMetadata = () => ({
  current: currentTheme,
  isSystem: isSystemPreference(),
  systemPreference: getSystemPreference(),
  available: ['light', 'dark', 'dim'] as const,
});
