/**
 * TanStack Query hook for fetching system note
 * Used to check if router has configuration (for configuration import wizard)
 * Uses rosproxy backend for RouterOS API communication
 */
import { UseQueryResult } from '@tanstack/react-query';
/**
 * System note data returned from RouterOS
 */
export interface SystemNote {
    /**
     * The note content (can be empty string)
     */
    note: string;
    /**
     * Whether to show note at CLI login
     */
    showAtCliLogin: boolean;
    /**
     * Whether to show note at web login
     */
    showAtLogin: boolean;
}
/**
 * React Query hook for system note
 *
 * @param routerIp - Target router IP address
 * @returns Query result with system note data
 *
 * @example
 * ```tsx
 * function ConfigurationCheck() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data: noteData, isLoading } = useSystemNote(routerIp || '');
 *
 *   // Check if note is empty (router needs configuration)
 *   const needsConfiguration = noteData && !noteData.note.trim();
 *
 *   if (needsConfiguration) {
 *     return <ConfigurationWizard />;
 *   }
 * }
 * ```
 */
export declare function useSystemNote(routerIp: string): UseQueryResult<SystemNote, Error>;
//# sourceMappingURL=useSystemNote.d.ts.map