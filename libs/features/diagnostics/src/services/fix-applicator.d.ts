import type { FixSuggestion } from '../types/troubleshoot.types';
/**
 * @description Result from applying a fix command to the router via GraphQL mutation.
 * Indicates success/failure and provides rollback support for automatic recovery.
 */
interface FixApplicationResult {
    success: boolean;
    message: string;
    rollbackId?: string;
    appliedCommands?: Array<{
        command: string;
        result: string;
    }>;
}
/**
 * @description Apply a fix command to the router via GraphQL mutation.
 * Implements the Apply-Confirm-Merge pattern with automatic rollback support.
 * Manual fixes require user intervention and are rejected by this function.
 *
 * @param sessionId - The troubleshooting session ID for tracking fix application
 * @param fix - The fix suggestion object containing command, rollback info, and metadata
 * @returns Promise<FixApplicationResult> with success status, message, and optional rollback ID
 */
export declare function applyFixCommand(sessionId: string, fix: FixSuggestion): Promise<FixApplicationResult>;
export {};
/**
 * Rollback functionality is now handled automatically by the backend
 * when a fix is applied through the applyTroubleshootFix mutation.
 * The backend maintains rollback commands and can restore the previous
 * configuration if the fix verification fails.
 */
//# sourceMappingURL=fix-applicator.d.ts.map