/**
 * StatsCounter Component
 * Displays animated counter for interface statistics with BigInt support
 *
 * @description
 * Renders a labeled statistic counter with support for BigInt values (TX/RX bytes/packets).
 * Includes subtle opacity animation when values update. Technical data (bandwidth,
 * byte counts) displayed in monospace font for clarity.
 *
 * NAS-6.9: Implement Interface Traffic Statistics
 */

import { memo, useEffect, useState, useCallback } from 'react';
import { cn } from '@nasnet/ui/utils';

import type { StatsCounterProps } from './interface-stats-panel.types';

/** Kilobytes constant for binary calculations */
const K_BYTES_BINARY = 1024n;

/** Size units for binary formatting (B, KB, MB, GB, TB, PB) */
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

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

  // Find appropriate unit
  let value = bytes;
  let unitIndex = 0;

  while (value >= K_BYTES_BINARY && unitIndex < BYTE_UNITS.length - 1) {
    value = value / K_BYTES_BINARY;
    unitIndex++;
  }

  // Convert to number for decimal formatting using remainder for precision
  const divisor = K_BYTES_BINARY ** BigInt(unitIndex);
  const integerPart = bytes / divisor;
  const remainder = bytes % divisor;

  // Calculate decimal value
  const decimalValue = Number(integerPart) + Number(remainder) / Number(divisor);

  return `${decimalValue.toFixed(decimals)} ${BYTE_UNITS[unitIndex]}`;
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
export const StatsCounter = memo(function StatsCounter({
  value,
  label,
  unit = 'bytes',
  className,
}: StatsCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);

  // Detect value changes and trigger animation
  useEffect(() => {
    if (value === displayValue) {
      return;
    }

    setIsUpdating(true);
    // Small delay to trigger CSS transition
    const timer = setTimeout(() => {
      setDisplayValue(value);
      setIsUpdating(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [value, displayValue]);

  // Format the value based on unit type with memoized callback
  const getFormattedValue = useCallback((): string => {
    try {
      const bigIntValue = BigInt(displayValue);

      if (unit === 'bytes') {
        return formatBytesBigInt(bigIntValue);
      }
      if (unit === 'packets' || unit === 'count') {
        return formatNumberBigInt(bigIntValue);
      }
      return String(displayValue);
    } catch (err) {
      // Fallback if BigInt parsing fails
      console.error('Error formatting stats counter:', err);
      return String(displayValue);
    }
  }, [displayValue, unit]);

  const formattedValue = getFormattedValue();

  return (
    <div className={cn('gap-component-sm category-networking flex flex-col', className)}>
      <span className="text-muted-foreground text-sm font-medium">{label}</span>
      <span
        className={cn(
          'text-foreground font-mono text-2xl font-semibold tabular-nums transition-opacity duration-150',
          isUpdating && 'opacity-70'
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {formattedValue}
      </span>
    </div>
  );
});

StatsCounter.displayName = 'StatsCounter';
