/**
 * History Panel Types
 *
 * Shared types for history panel components.
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */
export interface HistoryPanelProps {
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Callback when panel should close
     */
    onClose?: () => void;
    /**
     * Maximum height for the scrollable area
     * @default 400 for desktop, 300 for mobile
     */
    maxHeight?: number;
}
//# sourceMappingURL=types.d.ts.map