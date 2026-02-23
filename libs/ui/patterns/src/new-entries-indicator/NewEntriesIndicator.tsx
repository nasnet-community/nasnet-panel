/**
 * NewEntriesIndicator Component
 * Floating indicator for new log entries while user is scrolled up
 * Epic 0.8: System Logs - Story 0.8.4
 */

import * as React from 'react';

import { ChevronDown } from 'lucide-react';

import { Button , cn } from '@nasnet/ui/primitives';

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
function NewEntriesIndicatorComponent({
  count,
  onClick,
  className,
  ...props
}: NewEntriesIndicatorProps) {
  if (count <= 0) return null;

  return (
    <Button
      variant="default"
      size="sm"
      onClick={onClick}
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
        'shadow-lg hover:shadow-xl animate-in slide-in-from-bottom-2 fade-in-0',
        'gap-2 rounded-full bg-primary hover:bg-primary text-primary-foreground',
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      <ChevronDown className="h-4 w-4 animate-bounce" />
      <span className="font-semibold">
        {count} {count === 1 ? 'new entry' : 'new entries'}
      </span>
    </Button>
  );
}

const NewEntriesIndicator = NewEntriesIndicatorComponent;
(NewEntriesIndicator as React.FC<any>).displayName = 'NewEntriesIndicator';

export { NewEntriesIndicator };
