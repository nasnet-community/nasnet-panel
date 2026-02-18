/**
 * Accessibility (a11y) Provider
 * Provides accessibility context for detecting user preferences
 *
 * Features:
 * - Detects `prefers-reduced-motion` media query
 * - Detects `prefers-contrast` media query (high contrast mode)
 * - Tracks keyboard-only navigation vs mouse usage
 * - Provides useA11y hook for consuming accessibility state
 *
 * @see NAS-4.17: Implement Accessibility (a11y) Foundation
 * @see WCAG 2.1 AAA Guidelines
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

/**
 * Accessibility context value interface
 */
export interface A11yContextValue {
  /**
   * Whether the user prefers reduced motion
   * Based on `prefers-reduced-motion: reduce` media query
   */
  reducedMotion: boolean;

  /**
   * Whether the user prefers high contrast mode
   * Based on `prefers-contrast: more` media query
   */
  highContrast: boolean;

  /**
   * Whether the user is navigating with keyboard only
   * Set to true when Tab key is pressed, false when mouse is used
   * Useful for showing focus rings only for keyboard users
   */
  keyboardUser: boolean;

  /**
   * Announce a message to screen readers via aria-live region
   * @param message - The message to announce
   * @param priority - 'polite' (default) or 'assertive'
   */
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

/**
 * Props for A11yProvider component
 */
export interface A11yProviderProps {
  /**
   * Child components that will have access to accessibility context
   */
  children: ReactNode;
}

// Create context with null default (will throw if used outside provider)
const A11yContext = createContext<A11yContextValue | null>(null);

// Display name for React DevTools
A11yContext.displayName = 'A11yContext';

/**
 * Check if we're in a browser environment (SSR safety)
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get initial reduced motion preference (SSR-safe)
 */
function getInitialReducedMotion(): boolean {
  if (!isBrowser()) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get initial high contrast preference (SSR-safe)
 */
function getInitialHighContrast(): boolean {
  if (!isBrowser()) return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * A11yProvider Component
 *
 * Provides accessibility context to the application tree.
 * Detects and tracks user accessibility preferences.
 *
 * @example
 * ```tsx
 * // In your app root
 * function App() {
 *   return (
 *     <A11yProvider>
 *       <YourApp />
 *     </A11yProvider>
 *   );
 * }
 *
 * // In a child component
 * function MyComponent() {
 *   const { reducedMotion, keyboardUser } = useA11y();
 *
 *   return (
 *     <div className={keyboardUser ? 'show-focus-ring' : ''}>
 *       <motion.div
 *         animate={reducedMotion ? {} : { scale: 1.1 }}
 *         transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
 *       >
 *         Content
 *       </motion.div>
 *     </div>
 *   );
 * }
 * ```
 */
export function A11yProvider({ children }: A11yProviderProps) {
  // State for reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);

  // State for high contrast preference
  const [highContrast, setHighContrast] = useState(getInitialHighContrast);

  // State for keyboard-only navigation detection
  const [keyboardUser, setKeyboardUser] = useState(false);

  // State for screen reader announcements
  const [announcement, setAnnouncement] = useState<{
    message: string;
    priority: 'polite' | 'assertive';
  } | null>(null);

  // Listen for reduced motion preference changes
  useEffect(() => {
    if (!isBrowser()) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Listen for high contrast preference changes
  useEffect(() => {
    if (!isBrowser()) return;

    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Detect keyboard-only navigation
  useEffect(() => {
    if (!isBrowser()) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Set keyboard user when Tab is pressed
      if (e.key === 'Tab') {
        setKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      // Reset to mouse user when mouse is used
      setKeyboardUser(false);
    };

    const handleTouchStart = () => {
      // Reset to touch user when touch is used
      setKeyboardUser(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  // Add data attribute to document for CSS targeting
  useEffect(() => {
    if (!isBrowser()) return;

    // Set data-keyboard-user attribute for CSS styling
    if (keyboardUser) {
      document.documentElement.setAttribute('data-keyboard-user', 'true');
    } else {
      document.documentElement.removeAttribute('data-keyboard-user');
    }
  }, [keyboardUser]);

  // Add data attribute for reduced motion
  useEffect(() => {
    if (!isBrowser()) return;

    if (reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }, [reducedMotion]);

  // Announce function for screen readers
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      // Clear the announcement first to ensure re-announcement of same message
      setAnnouncement(null);

      // Use requestAnimationFrame to ensure DOM update
      requestAnimationFrame(() => {
        setAnnouncement({ message, priority });
      });
    },
    []
  );

  // Clear announcement after it's been read
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => {
        setAnnouncement(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [announcement]);

  const value: A11yContextValue = {
    reducedMotion,
    highContrast,
    keyboardUser,
    announce,
  };

  return (
    <A11yContext.Provider value={value}>
      {children}
      {/* Screen reader live region for announcements */}
      <div
        role="status"
        aria-live={announcement?.priority ?? 'polite'}
        aria-atomic="true"
        className="sr-only"
      >
        {announcement?.message}
      </div>
    </A11yContext.Provider>
  );
}

/**
 * Hook to access accessibility context
 *
 * @throws Error if used outside of A11yProvider
 * @returns A11yContextValue with accessibility state and functions
 *
 * @example
 * ```tsx
 * function AnimatedButton({ children }) {
 *   const { reducedMotion } = useA11y();
 *
 *   return (
 *     <motion.button
 *       whileHover={reducedMotion ? {} : { scale: 1.05 }}
 *       whileTap={reducedMotion ? {} : { scale: 0.95 }}
 *     >
 *       {children}
 *     </motion.button>
 *   );
 * }
 * ```
 */
export function useA11y(): A11yContextValue {
  const context = useContext(A11yContext);

  if (!context) {
    throw new Error(
      'useA11y must be used within an A11yProvider. ' +
        'Wrap your app in <A11yProvider> to use this hook.'
    );
  }

  return context;
}

/**
 * Optional hook that returns null if outside provider
 * Useful for components that may or may not be wrapped in A11yProvider
 *
 * @returns A11yContextValue or null if outside provider
 */
export function useA11yOptional(): A11yContextValue | null {
  return useContext(A11yContext);
}

/**
 * Selector hook for reduced motion only
 * Optimized for components that only need reduced motion state
 */
export function useReducedMotion(): boolean {
  const context = useA11y();
  return context.reducedMotion;
}

/**
 * Selector hook for keyboard user only
 * Optimized for components that only need keyboard user state
 */
export function useKeyboardUser(): boolean {
  const context = useA11y();
  return context.keyboardUser;
}

/**
 * Selector hook for high contrast only
 * Optimized for components that only need high contrast state
 */
export function useHighContrast(): boolean {
  const context = useA11y();
  return context.highContrast;
}

/**
 * Selector hook for announce function only
 * Optimized for components that only need to make announcements
 */
export function useAnnounce(): A11yContextValue['announce'] {
  const context = useA11y();
  return context.announce;
}
