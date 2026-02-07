/**
 * TopicFilter component for multi-select log topic filtering
 * WCAG AAA compliant with proper ARIA roles and 44px touch targets
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { Filter, Check } from 'lucide-react';

import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  cn,
} from '@nasnet/ui/primitives';

import { TOPIC_LABELS, ALL_FILTER_TOPICS } from './constants';

import type { TopicFilterProps } from './types';

/**
 * Multi-select dropdown for filtering logs by topic
 * Displays selected count badge and supports keyboard navigation
 *
 * @param selectedTopics - Currently selected topics
 * @param onSelectionChange - Callback when topic selection changes
 */
export function TopicFilter({ selectedTopics, onSelectionChange }: TopicFilterProps) {
  const toggleTopic = (topic: typeof selectedTopics[number]) => {
    if (selectedTopics.includes(topic)) {
      onSelectionChange(selectedTopics.filter((t) => t !== topic));
    } else {
      onSelectionChange([...selectedTopics, topic]);
    }
  };

  const selectedCount = selectedTopics.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Filter logs by topic"
          className="min-h-[44px] min-w-[44px]"
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          {selectedCount > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
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
        <div className="space-y-1">
          {ALL_FILTER_TOPICS.map((topic) => (
            <button
              key={topic}
              role="option"
              aria-selected={selectedTopics.includes(topic)}
              onClick={() => toggleTopic(topic)}
              className={cn(
                'flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm',
                'hover:bg-muted focus:bg-muted focus:outline-none',
                'min-h-[44px]',
                selectedTopics.includes(topic) && 'bg-muted'
              )}
            >
              <div
                className={cn(
                  'h-4 w-4 border rounded flex items-center justify-center',
                  selectedTopics.includes(topic)
                    ? 'bg-primary border-primary'
                    : 'border-input'
                )}
              >
                {selectedTopics.includes(topic) && (
                  <Check className="h-3 w-3 text-primary-foreground" />
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
            className="w-full mt-2"
            onClick={() => onSelectionChange([])}
          >
            Clear filters
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
