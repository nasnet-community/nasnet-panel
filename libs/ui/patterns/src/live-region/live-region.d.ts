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
import { type ReactNode } from 'react';
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
declare function LiveRegionComponent({ children, mode, atomic, role, visible, className, }: LiveRegionProps): import("react/jsx-runtime").JSX.Element;
export declare const LiveRegion: import("react").MemoExoticComponent<typeof LiveRegionComponent>;
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
export declare function useAnnounce(): UseAnnounceReturn;
/**
 * Announcer Context for global announcements
 */
interface AnnouncerContextValue {
    announce: (message: string, priority?: 'polite' | 'assertive') => void;
}
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
declare function AnnouncerProviderComponent({ children }: AnnouncerProviderProps): import("react/jsx-runtime").JSX.Element;
export declare const AnnouncerProvider: import("react").MemoExoticComponent<typeof AnnouncerProviderComponent>;
/**
 * useAnnouncer Hook
 *
 * Access the global announcer from any component.
 * Must be used within AnnouncerProvider.
 *
 * @throws Error if used outside AnnouncerProvider
 */
export declare function useAnnouncer(): AnnouncerContextValue;
/**
 * useAnnouncerOptional Hook
 *
 * Access the global announcer, returns null if outside provider.
 * Useful for components that may or may not be wrapped.
 */
export declare function useAnnouncerOptional(): AnnouncerContextValue | null;
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
declare function VisuallyHiddenComponent({ children, as: Component, className, }: VisuallyHiddenProps): import("react/jsx-runtime").JSX.Element;
export declare const VisuallyHidden: import("react").MemoExoticComponent<typeof VisuallyHiddenComponent>;
export {};
//# sourceMappingURL=live-region.d.ts.map