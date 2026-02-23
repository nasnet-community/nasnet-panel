/**
 * SYN Flood Config Panel Types
 *
 * Import official types from @nasnet/core/types and add form-specific types.
 */
import type { SynFloodConfig } from '@nasnet/core/types';
export type { SynFloodConfig };
/**
 * Form values for SYN flood config
 * Uses string format for number inputs
 */
export interface SynFloodFormValues {
    enabled: boolean;
    synLimit: string;
    burst: string;
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
export declare const SYN_FLOOD_PRESETS: SynFloodPreset[];
//# sourceMappingURL=types.d.ts.map