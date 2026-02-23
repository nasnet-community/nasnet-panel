/**
 * PingResults Component
 *
 * Displays streaming ping results in a virtualized list with intelligent auto-scroll.
 *
 * Features:
 * - Virtualized rendering for 100+ results (uses @tanstack/react-virtual)
 * - Auto-scroll to latest result with pause detection (scroll lock preserves position)
 * - Color-coded results: success (green <100ms), warning (amber <200ms), error (red >=200ms)
 * - Monospace font for latency values and IP addresses (typography standard)
 * - Semantic color tokens: success, warning, destructive
 * - ARIA live region for screen reader announcements
 * - Scroll-to-bottom button appears when new results arrive (not at bottom)
 *
 * WCAG AAA Compliance:
 * - 7:1 contrast ratio on all text
 * - Semantic color + text indicator (not color alone)
 * - Font-mono for technical data (IPs, latency)
 * - ARIA live region with aria-relevant="additions"
 * - Accessible scroll-to-bottom button with aria-label
 *
 * Performance:
 * - Virtualizer with 24px per row + 10 item overscan
 * - React.memo to skip re-renders when props unchanged
 * - Auto-scroll calculation optimized (checks bottom 100px threshold)
 *
 * @example
 * ```tsx
 * <PingResults
 *   results={[
 *     { seq: 1, time: 12.5, bytes: 56, ttl: 52, target: '8.8.8.8', error: undefined },
 *     { seq: 2, time: null, error: 'timeout', target: '8.8.8.8' },
 *   ]}
 * />
 * ```
 *
 * @see useAutoScroll for scroll-lock behavior
 * @see @tanstack/react-virtual for virtualization
 */

import { memo, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAutoScroll } from '@nasnet/core/utils';
import { Button, ScrollArea, cn } from '@nasnet/ui/primitives';
import { ChevronDown } from 'lucide-react';
import type { PingResult } from './PingTool.types';

/**
 * Props for PingResults component
 * @interface PingResultsProps
 */
export interface PingResultsProps {
  /** Array of ping results to display, ordered by sequence number */
  results: PingResult[];
  /** Optional additional CSS classes for wrapper container */
  className?: string;
}

/**
 * Determine semantic color token based on ping result latency/status.
 *
 * Color scheme (semantic tokens, not primitives):
 * - success (green): latency <100ms (healthy)
 * - warning (amber): latency 100-200ms (degraded)
 * - destructive (red): latency >=200ms OR timeout/error (critical)
 *
 * @param result - The ping result to evaluate
 * @returns Semantic color class name (text-success, text-warning, or text-destructive)
 * @internal
 */
function getResultColor(result: PingResult): string {
  if (result.error || result.time === null) return 'text-destructive'; // Red - timeout/error
  if (result.time > 200) return 'text-destructive'; // Red - critical latency
  if (result.time > 100) return 'text-warning'; // Amber - slow
  return 'text-success'; // Green - healthy
}

/**
 * Format a single ping result line for display.
 *
 * Produces monospace-friendly output with tabular formatting:
 * - Sequence number (right-aligned, 4 chars)
 * - Target IP/hostname (left-aligned, 25 chars)
 * - Bytes (if available)
 * - TTL (if available)
 * - Latency in milliseconds OR "timeout" label
 *
 * Example outputs:
 * - "   1 8.8.8.8                    56 bytes ttl=52 time=12.5ms"
 * - "   2 8.8.8.8                    timeout"
 *
 * @param result - The ping result to format
 * @returns Formatted string suitable for monospace display
 * @internal
 */
function formatResult(result: PingResult): string {
  const { seq, bytes, ttl, time, error } = result;

  if (error || time === null) {
    return `${seq.toString().padStart(4)} ${result.target.padEnd(25)} timeout`;
  }

  const bytesStr = bytes ? `${bytes} bytes` : '';
  const ttlStr = ttl ? `ttl=${ttl}` : '';
  const timeStr = `time=${time.toFixed(1)}ms`;

  return `${seq.toString().padStart(4)} ${result.target.padEnd(25)} ${bytesStr} ${ttlStr} ${timeStr}`;
}

/**
 * PingResults - Virtualized streaming results list
 *
 * Displays ping results with intelligent auto-scroll and semantic color coding.
 * Optimized for streaming results (100+ items) with virtualization.
 *
 * @param props - Component props (results array, optional className)
 * @returns Virtualized scrollable results container with auto-scroll button
 */
export const PingResults = memo(function PingResults({
  results,
  className,
}: PingResultsProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll hook for scroll-lock detection
  const { isAtBottom, newEntriesCount, scrollToBottom } = useAutoScroll({
    scrollRef: parentRef,
    data: results,
    threshold: 100,
  });

  // Virtualizer for efficient rendering of 100+ items
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // Estimated height per row in pixels
    overscan: 10, // Render 10 extra items above/below viewport for smooth scrolling
  });

  if (results.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-64 text-muted-foreground',
          className
        )}
      >
        No results yet. Start a ping test to see results.
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Results list */}
      <ScrollArea className="h-64 border rounded-md">
        <div
          ref={parentRef}
          role="log"
          aria-live="polite"
          aria-label="Ping results"
          aria-relevant="additions"
          className="h-full p-2 font-mono text-sm"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const result = results[virtualRow.index];
              const color = getResultColor(result);

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={cn('whitespace-nowrap font-mono text-sm', color)}
                  aria-label={`Ping ${result.seq}: ${result.time ? `${result.time}ms` : 'timeout'}`}
                >
                  {formatResult(result)}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Scroll to bottom button (shows when not at bottom and new entries arrived) */}
      {!isAtBottom && newEntriesCount > 0 && (
        <Button
          variant="secondary"
          size="sm"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 shadow-lg"
          aria-label={`Scroll to bottom (${newEntriesCount} new results)`}
        >
          <ChevronDown className="w-4 h-4 mr-1" />
          {newEntriesCount} new
        </Button>
      )}
    </div>
  );
});

PingResults.displayName = 'PingResults';
