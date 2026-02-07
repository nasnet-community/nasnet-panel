// libs/features/diagnostics/src/services/fix-applicator.ts
import { apolloClient } from '@nasnet/api-client/core';
import { APPLY_TROUBLESHOOT_FIX } from '@nasnet/api-client/queries';
import type { FixSuggestion } from '../types/troubleshoot.types';

interface FixApplicationResult {
  success: boolean;
  message: string;
  rollbackId?: string;
  appliedCommands?: Array<{ command: string; result: string }>;
}

/**
 * Apply a fix command to the router via GraphQL
 * Implements Apply-Confirm-Merge pattern with rollback support
 *
 * @param sessionId - The troubleshooting session ID
 * @param fix - The fix suggestion to apply
 * @returns FixApplicationResult with success status and details
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
        message: 'This fix requires manual intervention',
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
      throw new Error('No response from fix application');
    }

    const result = data.applyTroubleshootFix;

    return {
      success: result.success,
      message: result.message,
      // Backend handles rollback automatically
      rollbackId: result.success ? `rollback_${fix.issueCode}` : undefined,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to apply fix',
    };
  }
}

/**
 * Rollback functionality is now handled automatically by the backend
 * when a fix is applied through the applyTroubleshootFix mutation.
 * The backend maintains rollback commands and can restore the previous
 * configuration if the fix verification fails.
 */
