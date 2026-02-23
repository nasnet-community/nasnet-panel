/**
 * Log Search Component
 * Provides text search with debouncing for filtering logs
 * Epic 0.8: System Logs - Text Search
 */
import * as React from 'react';
export interface LogSearchProps {
    /**
     * Current search value
     */
    value: string;
    /**
     * Callback when search value changes (debounced)
     */
    onChange: (value: string) => void;
    /**
     * Placeholder text
     */
    placeholder?: string;
    /**
     * Number of matching results
     */
    matchCount?: number;
    /**
     * Total number of logs
     */
    totalCount?: number;
    /**
     * Debounce delay in milliseconds
     * @default 300
     */
    debounceMs?: number;
    /**
     * Additional class names
     */
    className?: string;
}
/**
 * LogSearch Component
 *
 * Features:
 * - Debounced search input (300ms default)
 * - Clear button when search has value
 * - Shows match count when searching
 * - Keyboard shortcut support (/ to focus)
 */
declare function LogSearchComponent({ value, onChange, placeholder, matchCount, totalCount, debounceMs, className, }: LogSearchProps): import("react/jsx-runtime").JSX.Element;
export declare const LogSearch: React.MemoExoticComponent<typeof LogSearchComponent>;
/**
 * Highlight matching text in a string
 */
export interface HighlightedTextProps {
    /**
     * The text to display
     */
    text: string;
    /**
     * The search term to highlight
     */
    highlight: string;
    /**
     * Additional class names for the container
     */
    className?: string;
    /**
     * Class names for the highlighted portions
     */
    highlightClassName?: string;
}
/**
 * Component to highlight matching text
 */
declare function HighlightedTextComponent({ text, highlight, className, highlightClassName, }: HighlightedTextProps): import("react/jsx-runtime").JSX.Element;
export declare const HighlightedText: React.MemoExoticComponent<typeof HighlightedTextComponent>;
export {};
//# sourceMappingURL=LogSearch.d.ts.map