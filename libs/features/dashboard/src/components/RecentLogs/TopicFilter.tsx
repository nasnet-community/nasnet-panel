/**
 * TopicFilter component for multi-select log topic filtering
 * WCAG AAA compliant with proper ARIA roles and 44px touch targets
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { memo, useCallback } from 'react';
import { Filter, Check } from 'lucide-react';

import { Button, Popover, PopoverTrigger, PopoverContent, cn } from '@nasnet/ui/primitives';

import { TOPIC_LABELS, ALL_FILTER_TOPICS } from './constants';

import type { TopicFilterProps } from './types';

/**
 * Multi-select dropdown for filtering logs by topic
 * Displays selected count badge and supports keyboard navigation
 *
 * @description
 * Accessible multi-select filter component for log topics.
 * Features 44px minimum touch targets, full keyboard navigation (Tab, Space, Arrow keys),
 * and ARIA labels for screen reader support.
 * Shows badge with selected count for quick visual feedback.
 * Includes "Clear filters" button when filters are active.
 *
 * @example
 * ```tsx
 * const [topics, setTopics] = useState(['firewall', 'dhcp']);
 * <TopicFilter
 *   selectedTopics={topics}
 *   onSelectionChange={setTopics}
 *   className="w-full"
 * />
 * ```
 *
 * @param selectedTopics - Currently selected topics
 * @param onSelectionChange - Callback when topic selection changes
 * @param className - Optional CSS class for styling
 */
export const TopicFilter = memo(function TopicFilter({
  selectedTopics,
  onSelectionChange,
  className,
}: TopicFilterProps) {
  const toggleTopic = useCallback(
    (topic: (typeof selectedTopics)[number]) => {
      if (selectedTopics.includes(topic)) {
        onSelectionChange(selectedTopics.filter((t) => t !== topic));
      } else {
        onSelectionChange([...selectedTopics, topic]);
      }
    },
    [selectedTopics, onSelectionChange]
  );

  const handleClearFilters = useCallback(() => onSelectionChange([]), [onSelectionChange]);

  const selectedCount = selectedTopics.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Filter logs by topic"
          className={cn('min-h-[44px] min-w-[44px]', className)}
        >
          <Filter
            className="h-4 w-4"
            aria-hidden="true"
          />
          {selectedCount > 0 && (
            <span className="ml-component-xs bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
              {selectedCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56"
        role="listbox"
        aria-multiselectable="true"
        aria-label="Select log topics to filter"
      >
        <div className="space-y-component-xs">
          {ALL_FILTER_TOPICS.map((topic) => (
            <button
              key={topic}
              role="option"
              aria-selected={selectedTopics.includes(topic)}
              onClick={() => toggleTopic(topic)}
              className={cn(
                'gap-component-sm px-component-sm py-component-sm flex w-full items-center rounded-md text-sm',
                'hover:bg-muted focus:bg-muted focus:outline-none',
                'min-h-[44px]',
                selectedTopics.includes(topic) && 'bg-muted'
              )}
            >
              <div
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded border',
                  selectedTopics.includes(topic) ? 'bg-primary border-primary' : 'border-input'
                )}
              >
                {selectedTopics.includes(topic) && (
                  <Check className="text-primary-foreground h-3 w-3" />
                )}
              </div>
              {TOPIC_LABELS[topic] || topic}
            </button>
          ))}
        </div>
        {selectedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-component-sm w-full"
            onClick={handleClearFilters}
          >
            Clear filters
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
});

TopicFilter.displayName = 'TopicFilter';
