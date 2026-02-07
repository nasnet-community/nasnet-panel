/**
 * TimeRangeSelector - Accessible segmented control for time range selection
 * WCAG AAA compliant with 44px touch targets, keyboard navigation, and ARIA support
 */

import { memo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@nasnet/ui/utils';
import type { TimeRange, TimeRangeSelectorProps } from './types';

/**
 * Time range option configuration
 */
interface TimeRangeOption {
  value: TimeRange;
  label: string;
  description: string;
}

/**
 * Available time range options
 */
const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  {
    value: '5m',
    label: '5 min',
    description: 'Real-time, 2-second intervals',
  },
  {
    value: '1h',
    label: '1 hour',
    description: '1-minute averages',
  },
  {
    value: '24h',
    label: '24 hours',
    description: '5-minute averages',
  },
];

/**
 * TimeRangeSelector component
 *
 * Implements segmented control pattern with:
 * - WCAG AAA compliance (7:1 contrast, 44px touch targets)
 * - Full keyboard navigation (Tab, Arrow keys, Enter/Space)
 * - Screen reader support with proper ARIA attributes
 * - Focus indicators (3px ring)
 *
 * @param props - Component props
 */
export const TimeRangeSelector = memo<TimeRangeSelectorProps>(
  ({ value, onChange, className }) => {
    const groupRef = useRef<HTMLDivElement>(null);

    /**
     * Handle keyboard navigation within segmented control
     */
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>, currentValue: TimeRange) => {
        const currentIndex = TIME_RANGE_OPTIONS.findIndex(
          (opt) => opt.value === currentValue
        );

        let nextIndex: number | null = null;

        switch (event.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            // Move to next option (wrap around)
            event.preventDefault();
            nextIndex = (currentIndex + 1) % TIME_RANGE_OPTIONS.length;
            break;

          case 'ArrowLeft':
          case 'ArrowUp':
            // Move to previous option (wrap around)
            event.preventDefault();
            nextIndex =
              (currentIndex - 1 + TIME_RANGE_OPTIONS.length) %
              TIME_RANGE_OPTIONS.length;
            break;

          case 'Home':
            // Jump to first option
            event.preventDefault();
            nextIndex = 0;
            break;

          case 'End':
            // Jump to last option
            event.preventDefault();
            nextIndex = TIME_RANGE_OPTIONS.length - 1;
            break;

          default:
            return;
        }

        if (nextIndex !== null) {
          onChange(TIME_RANGE_OPTIONS[nextIndex].value);
        }
      },
      [onChange]
    );

    /**
     * Focus management - ensure selected option is focusable
     */
    useEffect(() => {
      if (!groupRef.current) return;

      const selectedButton = groupRef.current.querySelector(
        `[data-value="${value}"]`
      ) as HTMLButtonElement;

      if (selectedButton && document.activeElement !== selectedButton) {
        // Update tabIndex for roving tabindex pattern
        const allButtons = groupRef.current.querySelectorAll('button');
        allButtons.forEach((btn) => {
          btn.setAttribute('tabindex', btn === selectedButton ? '0' : '-1');
        });
      }
    }, [value]);

    return (
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Select time range for bandwidth graph"
        className={cn(
          'inline-flex items-center gap-1 rounded-lg bg-muted p-1',
          className
        )}
      >
        {TIME_RANGE_OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option.label} - ${option.description}`}
              data-value={option.value}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, option.value)}
              className={cn(
                // Base styles
                'relative rounded-md px-4 py-2 text-sm font-medium transition-all',
                // Minimum 44px height for touch targets (WCAG AAA)
                'min-h-[44px]',
                // Focus styles (3px ring)
                'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2',
                // Selected state
                isSelected
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
                // Interactive states
                'active:scale-95',
                // Accessibility - ensure 7:1 contrast ratio
                'contrast-more:border contrast-more:border-foreground'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }
);

TimeRangeSelector.displayName = 'TimeRangeSelector';
