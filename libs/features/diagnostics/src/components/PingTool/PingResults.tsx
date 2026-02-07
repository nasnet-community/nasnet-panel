/**
 * PingResults Component
 *
 * Displays streaming ping results in a virtualized list.
 * Features:
 * - Auto-scroll to latest result (with pause detection)
 * - Color-coded results based on latency/status
 * - Virtualized rendering for 100+ results
 * - Accessible with ARIA live region
 */

import { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAutoScroll } from '@nasnet/core/utils';
import { Button, ScrollArea, cn } from '@nasnet/ui/primitives';
import { ChevronDown } from 'lucide-react';
import type { PingResult } from './PingTool.types';

/**
 * Props for PingResults component
 */
export interface PingResultsProps {
  /** Array of ping results to display */
  results: PingResult[];
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Get result color based on latency and status
 */
function getResultColor(result: PingResult): string {
  if (result.error || result.time === null) return 'text-destructive'; // Red - timeout/error
  if (result.time > 200) return 'text-destructive'; // Red - critical latency
  if (result.time > 100) return 'text-warning'; // Amber - slow
  return 'text-success'; // Green - healthy
}

/**
 * Format a single ping result line
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
 * Displays ping results with auto-scroll and color coding.
 * Uses virtualization for performance with large result sets.
 *
 * @example
 * ```tsx
 * <PingResults
 *   results={[
 *     { seq: 1, time: 12.5, bytes: 56, ttl: 52, ... },
 *     { seq: 2, time: null, error: 'timeout', ... },
 *   ]}
 * />
 * ```
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

  // Virtualizer for efficient rendering
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // Estimated height per row in pixels
    overscan: 10, // Render 10 extra items above/below viewport
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
                  className={cn('whitespace-nowrap', color)}
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
