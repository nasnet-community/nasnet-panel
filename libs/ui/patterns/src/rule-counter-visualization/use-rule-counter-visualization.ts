/**
 * Headless hook for Rule Counter Visualization
 * Manages counter formatting, rate calculations, and relative bar percentages
 *
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * @see CounterCell.tsx for the component implementation
 */

import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Counter data interface
 */
export interface CounterData {
  /** Number of packets */
  packets: number;
  /** Number of bytes */
  bytes: number;
}

/**
 * Calculated rates
 */
export interface CounterRates {
  /** Packets per second */
  packetsPerSec: number;
  /** Bytes per second */
  bytesPerSec: number;
}

/**
 * Options for useRuleCounterVisualization hook
 */
export interface UseRuleCounterVisualizationOptions {
  /** Current counter values */
  counter: CounterData;
  /** Maximum bytes value for relative bar calculation */
  maxBytes: number;
  /** Whether to calculate rates (requires polling) */
  calculateRates?: boolean;
  /** Polling interval in milliseconds (default: 5000ms) */
  pollingInterval?: number;
}

/**
 * Return type for useRuleCounterVisualization hook
 */
export interface RuleCounterVisualizationState {
  /** Formatted packet count (e.g., "1,234,567") */
  formattedPackets: string;
  /** Formatted byte count (e.g., "1.2 MB") */
  formattedBytes: string;
  /** Calculated rates (if enabled) */
  rates: CounterRates | null;
  /** Percentage of max bytes (0-100) */
  percentOfMax: number;
  /** Whether this rule has no traffic */
  isUnused: boolean;
}

/**
 * Format packet count with comma separators
 *
 * @param packets - Number of packets
 * @returns Formatted string (e.g., "1,234,567")
 *
 * @example
 * ```ts
 * formatPackets(1234567); // "1,234,567"
 * formatPackets(0); // "0"
 * ```
 */
export function formatPackets(packets: number): string {
  return packets.toLocaleString('en-US');
}

/**
 * Format bytes with SI units (KB, MB, GB, TB)
 *
 * Uses 1000-based units (not 1024) for consistency with networking standards.
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.2 MB")
 *
 * @example
 * ```ts
 * formatBytes(1234); // "1.23 KB"
 * formatBytes(1234567); // "1.23 MB"
 * formatBytes(1234567890); // "1.23 GB"
 * formatBytes(0); // "0 B"
 * ```
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1000; // Use 1000 for SI units (networking standard)
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  // Show 2 decimal places for values >= 10, 3 for smaller values
  const decimals = value >= 10 ? 2 : 3;

  return `${value.toFixed(decimals)} ${units[i]}`;
}

/**
 * Headless hook for rule counter visualization
 *
 * Provides:
 * - Formatted packet and byte counts
 * - Rate calculations (packets/sec, bytes/sec) using delta tracking
 * - Relative bar percentage (for visual comparison)
 * - Unused rule detection (packets === 0)
 *
 * @example
 * ```tsx
 * const state = useRuleCounterVisualization({
 *   counter: { packets: 1234567, bytes: 9876543210 },
 *   maxBytes: 10000000000,
 *   calculateRates: true,
 *   pollingInterval: 5000,
 * });
 *
 * console.log(state.formattedPackets); // "1,234,567"
 * console.log(state.formattedBytes); // "9.88 GB"
 * console.log(state.percentOfMax); // 98.77
 * console.log(state.rates?.bytesPerSec); // 1234567 (bytes/sec)
 * ```
 */
export function useRuleCounterVisualization({
  counter,
  maxBytes,
  calculateRates = false,
  pollingInterval = 5000,
}: UseRuleCounterVisualizationOptions): RuleCounterVisualizationState {
  // Track previous counter values for rate calculation
  const previousCounterRef = useRef<CounterData | null>(null);
  const [previousCounter, setPreviousCounter] = useState<CounterData | null>(null);

  // Format current values
  const formattedPackets = useMemo(() => formatPackets(counter.packets), [counter.packets]);

  const formattedBytes = useMemo(() => formatBytes(counter.bytes), [counter.bytes]);

  // Calculate percentage of max bytes
  const percentOfMax = useMemo(() => {
    if (maxBytes === 0) return 0;
    const percent = (counter.bytes / maxBytes) * 100;
    // Clamp between 0-100
    return Math.min(100, Math.max(0, percent));
  }, [counter.bytes, maxBytes]);

  // Detect unused rule (no packets)
  const isUnused = useMemo(() => counter.packets === 0, [counter.packets]);

  // Calculate rates (packets/sec, bytes/sec)
  const rates = useMemo(() => {
    if (!calculateRates || !previousCounter) return null;

    try {
      // Calculate deltas
      const packetsDelta = counter.packets - previousCounter.packets;
      const bytesDelta = counter.bytes - previousCounter.bytes;

      // Detect counter reset (negative deltas)
      // This can happen if router reboots or counters reset
      if (packetsDelta < 0 || bytesDelta < 0) {
        console.warn('Rule counter reset detected, skipping rate calculation');
        return null;
      }

      // Calculate rates: delta / (interval in seconds)
      const intervalSec = pollingInterval / 1000;
      return {
        packetsPerSec: packetsDelta / intervalSec,
        bytesPerSec: bytesDelta / intervalSec,
      };
    } catch (err) {
      console.error('Error calculating counter rates:', err);
      return null;
    }
  }, [counter, previousCounter, calculateRates, pollingInterval]);

  // Update previous counter for rate calculation
  // Wait one polling interval before storing, so we have a proper delta
  useEffect(() => {
    if (calculateRates && counter !== previousCounterRef.current) {
      const timer = setTimeout(() => {
        setPreviousCounter(counter);
        previousCounterRef.current = counter;
      }, pollingInterval);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [counter, calculateRates, pollingInterval]);

  return {
    formattedPackets,
    formattedBytes,
    rates,
    percentOfMax,
    isUnused,
  };
}
