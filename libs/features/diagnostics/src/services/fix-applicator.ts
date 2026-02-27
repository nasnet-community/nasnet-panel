// libs/features/diagnostics/src/services/fix-applicator.ts
import { apolloClient } from '@nasnet/api-client/core';
import { APPLY_TROUBLESHOOT_FIX } from '@nasnet/api-client/queries';
import type { FixSuggestion } from '../types/troubleshoot.types';

/**
 * @description Result from applying a fix command to the router via GraphQL mutation.
 * Indicates success/failure and provides rollback support for automatic recovery.
 */
interface FixApplicationResult {
  success: boolean;
  message: string;
  rollbackId?: string;
  appliedCommands?: Array<{ command: string; result: string }>;
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
export async function applyFixCommand(
  sessionId: string,
  fix: FixSuggestion
): Promise<FixApplicationResult> {
  try {
    // Manual fixes cannot be applied automatically
    if (fix.isManualFix || !fix.command) {
      return {
        success: false,
        message: `This fix requires manual intervention. Please follow the suggested steps: ${fix.manualSteps?.join('; ')}`,
      };
    }

    // Apply the fix via GraphQL mutation
    const { data } = await apolloClient.mutate({
      mutation: APPLY_TROUBLESHOOT_FIX,
      variables: {
        sessionId,
        issueCode: fix.issueCode,
      },
    });

    if (!data?.applyTroubleshootFix) {
      throw new Error(
        'Fix application failed: no response received from the backend. Please verify the router connection and try again.'
      );
    }

    const result = data.applyTroubleshootFix;

    return {
      success: result.success,
      message: result.message,
      // Backend handles rollback automatically
      rollbackId: result.success ? `rollback_${fix.issueCode}` : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ?
        error.message
      : 'Failed to apply the fix. Verify your router is connected and accessible, then retry.';
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Rollback functionality is now handled automatically by the backend
 * when a fix is applied through the applyTroubleshootFix mutation.
 * The backend maintains rollback commands and can restore the previous
 * configuration if the fix verification fails.
 */
