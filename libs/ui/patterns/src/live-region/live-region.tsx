/**
 * LiveRegion Component
 * Announces dynamic content changes to screen readers
 *
 * Features:
 * - Support for polite and assertive announcement modes
 * - Atomic and non-atomic updates
 * - Standalone hook for programmatic announcements
 * - Integrates with notification/toast system
 *
 * @see NAS-4.17: Implement Accessibility (a11y) Foundation
 * @see WCAG 4.1.3: Status Messages
 */

import { useState, useCallback, useEffect, createContext, useContext, useRef, type ReactNode } from 'react';
import { cn } from '@nasnet/ui/primitives';

/**
 * Props for LiveRegion component
 */
export interface LiveRegionProps {
  /**
   * Content to announce to screen readers
   */
  children: ReactNode;

  /**
   * Announcement mode
   * - 'polite': Wait for user to finish current task (default)
   * - 'assertive': Interrupt immediately for urgent messages
   * @default 'polite'
   */
  mode?: 'polite' | 'assertive';

  /**
   * Whether to announce entire region content or just changes
   * - true: Re-read entire content on any change
   * - false: Only announce changed content
   * @default true
   */
  atomic?: boolean;

  /**
   * ARIA role for the region
   * - 'status': General status messages (default for polite)
   * - 'alert': Important messages (default for assertive)
   * - 'log': Sequential log messages
   * - 'timer': Timer/countdown updates
   * @default 'status'
   */
  role?: 'status' | 'alert' | 'log' | 'timer';

  /**
   * Whether the region is visible
   * Set to false to hide visually while keeping accessible
   * @default false
   */
  visible?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * LiveRegion Component
 *
 * Renders an ARIA live region that announces content changes to screen readers.
 *
 * @example
 * ```tsx
 * // Basic usage - announce status updates
 * function StatusDisplay({ status }) {
 *   return (
 *     <LiveRegion mode="polite">
 *       {status === 'loading' && 'Loading...'}
 *       {status === 'success' && 'Data loaded successfully!'}
 *       {status === 'error' && 'Failed to load data'}
 *     </LiveRegion>
 *   );
 * }
 *
 * // Assertive announcement for urgent errors
 * function ErrorBanner({ error }) {
 *   return (
 *     <LiveRegion mode="assertive" role="alert" visible>
 *       <div className="bg-red-500 p-4 text-white">
 *         {error}
 *       </div>
 *     </LiveRegion>
 *   );
 * }
 * ```
 */
export function LiveRegion({
  children,
  mode = 'polite',
  atomic = true,
  role = 'status',
  visible = false,
  className,
}: LiveRegionProps) {
  return (
    <div
      role={role}
      aria-live={mode}
      aria-atomic={atomic}
      className={cn(
        // Visually hidden by default
        !visible && 'sr-only',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Return type for useAnnounce hook
 */
export interface UseAnnounceReturn {
  /**
   * Current announcement message (for rendering in LiveRegion)
   */
  message: string;

  /**
   * Current announcement priority
   */
  priority: 'polite' | 'assertive';

  /**
   * Announce a message to screen readers
   * @param text - The message to announce
   * @param priority - 'polite' or 'assertive'
   */
  announce: (text: string, priority?: 'polite' | 'assertive') => void;

  /**
   * Clear the current announcement
   */
  clear: () => void;
}

/**
 * useAnnounce Hook
 *
 * Provides programmatic access to screen reader announcements.
 * Pair with LiveRegion component for the actual announcement.
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const { message, announce, priority } = useAnnounce();
 *
 *   const handleSave = async () => {
 *     try {
 *       await save();
 *       announce('Changes saved successfully');
 *     } catch (error) {
 *       announce('Failed to save changes', 'assertive');
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleSave}>Save</button>
 *       <LiveRegion mode={priority}>{message}</LiveRegion>
 *     </>
 *   );
 * }
 * ```
 */
export function useAnnounce(): UseAnnounceReturn {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const announce = useCallback((text: string, newPriority: 'polite' | 'assertive' = 'polite') => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear the message first to ensure re-announcement of same text
    setMessage('');
    setPriority(newPriority);

    // Set the new message after a brief delay (forces screen reader to re-read)
    requestAnimationFrame(() => {
      setMessage(text);
    });

    // Auto-clear after announcement has been read (typically 5-10 seconds)
    timeoutRef.current = setTimeout(() => {
      setMessage('');
    }, 5000);
  }, []);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMessage('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { message, priority, announce, clear };
}

/**
 * Announcer Context for global announcements
 */
interface AnnouncerContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

AnnouncerContext.displayName = 'AnnouncerContext';

/**
 * Props for AnnouncerProvider
 */
export interface AnnouncerProviderProps {
  children: ReactNode;
}

/**
 * AnnouncerProvider Component
 *
 * Provides a global announcement system that can be used anywhere in the app.
 * Renders a hidden LiveRegion at the root level.
 *
 * @example
 * ```tsx
 * // In your app root
 * function App() {
 *   return (
 *     <AnnouncerProvider>
 *       <YourApp />
 *     </AnnouncerProvider>
 *   );
 * }
 *
 * // In any component
 * function SaveButton() {
 *   const { announce } = useAnnouncer();
 *
 *   const handleSave = async () => {
 *     await save();
 *     announce('Changes saved!');
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function AnnouncerProvider({ children }: AnnouncerProviderProps) {
  const { message, priority, announce } = useAnnounce();

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <LiveRegion mode={priority}>{message}</LiveRegion>
    </AnnouncerContext.Provider>
  );
}

/**
 * useAnnouncer Hook
 *
 * Access the global announcer from any component.
 * Must be used within AnnouncerProvider.
 *
 * @throws Error if used outside AnnouncerProvider
 */
export function useAnnouncer(): AnnouncerContextValue {
  const context = useContext(AnnouncerContext);

  if (!context) {
    throw new Error(
      'useAnnouncer must be used within an AnnouncerProvider. ' +
        'Wrap your app in <AnnouncerProvider> to use global announcements.'
    );
  }

  return context;
}

/**
 * useAnnouncerOptional Hook
 *
 * Access the global announcer, returns null if outside provider.
 * Useful for components that may or may not be wrapped.
 */
export function useAnnouncerOptional(): AnnouncerContextValue | null {
  return useContext(AnnouncerContext);
}

/**
 * VisuallyHidden Component
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Useful for adding context that's only needed by assistive technology.
 *
 * @example
 * ```tsx
 * <button>
 *   <Icon name="trash" />
 *   <VisuallyHidden>Delete item</VisuallyHidden>
 * </button>
 * ```
 */
export interface VisuallyHiddenProps {
  children: ReactNode;
  /**
   * HTML element to render
   * @default 'span'
   */
  as?: 'span' | 'div';
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function VisuallyHidden({
  children,
  as: Component = 'span',
  className,
}: VisuallyHiddenProps) {
  return (
    <Component className={cn('sr-only', className)}>
      {children}
    </Component>
  );
}
