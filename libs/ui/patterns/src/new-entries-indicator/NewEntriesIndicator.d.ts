/**
 * NewEntriesIndicator Component
 * Floating indicator for new log entries while user is scrolled up
 * Epic 0.8: System Logs - Story 0.8.4
 */
import * as React from 'react';
export interface NewEntriesIndicatorProps extends React.HTMLAttributes<HTMLButtonElement> {
    /**
     * Number of new entries to display
     */
    count: number;
    /**
     * Callback when indicator is clicked (scroll to bottom)
     */
    onClick: () => void;
    /**
     * Additional CSS class names
     */
    className?: string;
}
/**
 * NewEntriesIndicator Component
 *
 * Displays a floating button indicating new log entries have arrived
 * while the user is scrolled up reading older logs.
 *
 * Features:
 * - Shows count of new entries
 * - Positioned at bottom center of viewport
 * - Click to scroll to bottom and see new entries
 * - Animated appearance
 *
 * @example
 * ```tsx
 * <NewEntriesIndicator
 *   count={5}
 *   onClick={() => scrollToBottom()}
 * />
 * ```
 */
declare function NewEntriesIndicatorComponent({ count, onClick, className, ...props }: NewEntriesIndicatorProps): import("react/jsx-runtime").JSX.Element | null;
declare const NewEntriesIndicator: typeof NewEntriesIndicatorComponent;
export { NewEntriesIndicator };
//# sourceMappingURL=NewEntriesIndicator.d.ts.map