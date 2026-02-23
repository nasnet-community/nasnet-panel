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
import { type ReactNode } from 'react';
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
export declare function A11yProvider({ children }: A11yProviderProps): import("react/jsx-runtime").JSX.Element;
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
export declare function useA11y(): A11yContextValue;
/**
 * Optional hook that returns null if outside provider
 * Useful for components that may or may not be wrapped in A11yProvider
 *
 * @returns A11yContextValue or null if outside provider
 */
export declare function useA11yOptional(): A11yContextValue | null;
/**
 * Selector hook for reduced motion only
 * Optimized for components that only need reduced motion state
 */
export declare function useReducedMotion(): boolean;
/**
 * Selector hook for keyboard user only
 * Optimized for components that only need keyboard user state
 */
export declare function useKeyboardUser(): boolean;
/**
 * Selector hook for high contrast only
 * Optimized for components that only need high contrast state
 */
export declare function useHighContrast(): boolean;
/**
 * Selector hook for announce function only
 * Optimized for components that only need to make announcements
 */
export declare function useAnnounce(): A11yContextValue['announce'];
//# sourceMappingURL=a11y-provider.d.ts.map