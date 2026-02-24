/**
 * TimeRangeSelector - Accessible segmented control for time range selection
 * WCAG AAA compliant with 44px touch targets, keyboard navigation, and ARIA support
 * @description
 * Renders a radio group styled as a segmented control for bandwidth time range selection.
 * Supports keyboard navigation (arrow keys, Home/End), roving tabindex pattern, and
 * screen reader announcements. Touch targets are 44px minimum for mobile accessibility.
 * @example
 * <TimeRangeSelector value="5m" onChange={(range) => setRange(range)} />
 */

import { memo, useCallback, useEffect, useRef } from 'react';
import { cn } from '@nasnet/ui/utils';
import type { TimeRange, TimeRangeSelectorProps } from './types';

/**
 * Time range option configuration
 */
interface TimeRangeOption {
  /** Time range value key */
  value: TimeRange;
  /** Human-readable label for button */
  label: string;
  /** Descriptive text for screen readers and tooltips */
  description: string;
}

/**
 * Available time range options
 * Order determines keyboard navigation (left=previous, right=next)
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
 * TimeRangeSelector component - Accessible radio group for time range selection
 *
 * Implements segmented control pattern with:
 * - WCAG AAA compliance: 7:1 contrast, 44px minimum touch targets (8px spacing between)
 * - Full keyboard navigation: Tab, Arrow keys (wrap around), Enter/Space, Home, End
 * - Roving tabindex pattern: only selected option focusable
 * - Screen reader support: role="radiogroup", aria-checked, aria-label with descriptions
 * - Focus indicators: 3px ring with 2px offset
 * - Touch-friendly: minimum 44px height, adequate padding
 *
 * @param props - Component props (value, onChange, className)
 * @returns Accessible segmented control element
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
          'inline-flex items-center gap-component-sm rounded-card-lg bg-muted p-component-sm',
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
                'relative rounded-card-sm px-component-md py-component-sm text-sm font-medium transition-all',
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
