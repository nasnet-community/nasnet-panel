/**
 * VLANPoolConfig - Domain Component (Layer 3)
 *
 * VLAN pool configuration form with React Hook Form + Zod validation.
 * Allows configuring the allocatable VLAN range (1-4094).
 *
 * @example
 * ```tsx
 * <VLANPoolConfig
 *   poolStart={10}
 *   poolEnd={4000}
 *   allocatedCount={25}
 *   onSuccess={() => refetchPool()}
 * />
 * ```
 */
export interface VLANPoolConfigProps {
    /** Current pool start value */
    poolStart: number;
    /** Current pool end value */
    poolEnd: number;
    /** Number of currently allocated VLANs */
    allocatedCount: number;
    /** Callback when config is successfully updated */
    onSuccess?: () => void;
}
/**
 * VLANPoolConfig - VLAN pool configuration form
 *
 * Features:
 * - Validates VLAN range (1-4094)
 * - Warns if pool is shrinking
 * - Shows subnet template preview
 * - Prevents shrinking below allocated count
 */
export declare function VLANPoolConfig({ poolStart, poolEnd, allocatedCount, onSuccess, }: VLANPoolConfigProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VLANPoolConfig.d.ts.map