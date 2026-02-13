/**
 * StatsCounter Component
 * Displays animated counter for interface statistics with BigInt support
 *
 * NAS-6.9: Implement Interface Traffic Statistics
 */

import { useEffect, useState } from 'react';
import { cn } from '@nasnet/ui/utils';
import type { StatsCounterProps } from './interface-stats-panel.types';

/**
 * Formats bytes as BigInt to human-readable size string
 * Extended version of formatBytes that handles BigInt values
 *
 * @param bytes - Size in bytes as BigInt
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string (e.g., "1.23 GB")
 */
function formatBytesBigInt(bytes: bigint, decimals = 2): string {
  if (bytes === 0n) return '0 B';

  const k = 1024n;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  // Find appropriate unit
  let value = bytes;
  let unitIndex = 0;

  while (value >= k && unitIndex < sizes.length - 1) {
    value = value / k;
    unitIndex++;
  }

  // Convert to number for decimal formatting
  // Use the remainder for precision
  const divisor = k ** BigInt(unitIndex);
  const integerPart = bytes / divisor;
  const remainder = bytes % divisor;

  // Calculate decimal value
  const decimalValue = Number(integerPart) + Number(remainder) / Number(divisor);

  return `${decimalValue.toFixed(decimals)} ${sizes[unitIndex]}`;
}

/**
 * Formats a large number with thousand separators
 * Extended version that handles BigInt values
 *
 * @param value - Number as BigInt
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted number string with commas
 */
function formatNumberBigInt(value: bigint, locale = 'en-US'): string {
  return value.toLocaleString(locale);
}

/**
 * StatsCounter Component
 *
 * Displays a single statistic with label and formatted value.
 * Supports BigInt values for large counters (TX/RX bytes/packets).
 * Provides subtle CSS animation on value updates.
 *
 * @example
 * ```tsx
 * <StatsCounter
 *   value="1234567890"
 *   label="TX Bytes"
 *   unit="bytes"
 * />
 * // Displays: "1.15 GB" with label "TX Bytes"
 *
 * <StatsCounter
 *   value="42000"
 *   label="Total Packets"
 *   unit="packets"
 * />
 * // Displays: "42,000" with label "Total Packets"
 * ```
 */
export function StatsCounter({
  value,
  label,
  unit = 'bytes',
  className,
}: StatsCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);

  // Detect value changes and trigger animation
  useEffect(() => {
    if (value !== displayValue) {
      setIsUpdating(true);
      // Small delay to trigger CSS transition
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsUpdating(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  // Format the value based on unit type
  const formattedValue = (() => {
    try {
      const bigIntValue = BigInt(displayValue);

      switch (unit) {
        case 'bytes':
          return formatBytesBigInt(bigIntValue);
        case 'packets':
        case 'count':
          return formatNumberBigInt(bigIntValue);
        default:
          return displayValue;
      }
    } catch (err) {
      // Fallback if BigInt parsing fails
      console.error('Error formatting stats counter:', err);
      return displayValue;
    }
  })();

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-2xl font-mono font-semibold tabular-nums transition-opacity duration-150',
          isUpdating && 'opacity-70'
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {formattedValue}
      </span>
    </div>
  );
}
