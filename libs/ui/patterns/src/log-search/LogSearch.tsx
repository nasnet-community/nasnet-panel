/**
 * Log Search Component
 * Provides text search with debouncing for filtering logs
 * Epic 0.8: System Logs - Text Search
 */

import * as React from 'react';
import { Input, cn } from '@nasnet/ui/primitives';
import { Search, X } from 'lucide-react';

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
 * Debounce hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
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
export function LogSearch({
  value,
  onChange,
  placeholder = 'Search logs...',
  matchCount,
  totalCount,
  debounceMs = 300,
  className,
}: LogSearchProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = React.useState(value);
  const debouncedValue = useDebounce(localValue, debounceMs);

  // Sync debounced value to parent
  React.useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  // Sync external value changes
  React.useEffect(() => {
    if (value !== localValue && value !== debouncedValue) {
      setLocalValue(value);
    }
  }, [value]);

  // Keyboard shortcut: / to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in another input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    setLocalValue('');
    inputRef.current?.focus();
  };

  const showResults = localValue.length > 0 && matchCount !== undefined;

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9"
          aria-label="Search logs"
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Result count */}
      {showResults && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {matchCount} of {totalCount ?? '?'} entries
        </span>
      )}

      {/* Keyboard hint */}
      {!localValue && (
        <kbd className="hidden md:inline-flex items-center px-2 py-1 text-xs font-mono text-muted-foreground bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
          /
        </kbd>
      )}
    </div>
  );
}

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
export function HighlightedText({
  text,
  highlight,
  className,
  highlightClassName = 'bg-primary-200 dark:bg-primary-700 rounded px-0.5',
}: HighlightedTextProps) {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}



























