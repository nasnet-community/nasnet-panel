/**
 * SYN Flood Config Panel Types
 *
 * Import official types from @nasnet/core/types and add form-specific types.
 */

// Import official type from core
import type { SynFloodConfig } from '@nasnet/core/types';

// Re-export for convenience
export type { SynFloodConfig };

/**
 * Form values for SYN flood config
 * Uses string format for number inputs
 */
export interface SynFloodFormValues {
  enabled: boolean;
  synLimit: string; // String for slider/input
  burst: string; // String for slider/input
  action: 'drop' | 'tarpit';
}

/**
 * Preset configuration for common use cases
 */
export interface SynFloodPreset {
  label: string;
  synLimit: number;
  burst: number;
}

/**
 * Available presets
 */
export const SYN_FLOOD_PRESETS: SynFloodPreset[] = [
  { label: 'Very Strict', synLimit: 50, burst: 5 },
  { label: 'Strict', synLimit: 100, burst: 5 },
  { label: 'Moderate', synLimit: 200, burst: 10 },
  { label: 'Relaxed', synLimit: 500, burst: 20 },
];
