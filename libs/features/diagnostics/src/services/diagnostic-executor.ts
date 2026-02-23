// libs/features/diagnostics/src/services/diagnostic-executor.ts
import { apolloClient } from '@nasnet/api-client/core';
import { RUN_TROUBLESHOOT_STEP, TroubleshootStepType } from '@nasnet/api-client/queries';
import type { DiagnosticResult } from '../types/troubleshoot.types';

/**
 * @description Execute a diagnostic step based on step ID by coordinating with the backend GraphQL API.
 * This service triggers different diagnostic checks (WAN, gateway, internet, DNS, NAT) on the router
 * through the RUN_TROUBLESHOOT_STEP mutation and returns structured results.
 *
 * @param stepId - The diagnostic step to execute ('wan', 'gateway', 'internet', 'dns', 'nat')
 * @param routerId - The router UUID to diagnose
 * @param sessionId - The troubleshooting session ID created by the backend
 * @returns Promise<DiagnosticResult> with success/failure status, message, and details
 * @throws Returns error result (never throws) with actionable error message
 */
export async function executeDiagnosticStep(
  stepId: string,
  routerId: string,
  sessionId: string
): Promise<DiagnosticResult> {
  const startTime = Date.now();

  try {
    // Map step ID to GraphQL enum
    const STEP_TYPE_MAP: Record<string, TroubleshootStepType> = {
      wan: TroubleshootStepType.WAN,
      gateway: TroubleshootStepType.GATEWAY,
      internet: TroubleshootStepType.INTERNET,
      dns: TroubleshootStepType.DNS,
      nat: TroubleshootStepType.NAT,
    };

    const stepType = STEP_TYPE_MAP[stepId];
    if (!stepType) {
      throw new Error(`Unsupported diagnostic step "${stepId}". Supported steps: wan, gateway, internet, dns, nat`);
    }

    // Execute the diagnostic step via GraphQL
    const { data } = await apolloClient.mutate({
      mutation: RUN_TROUBLESHOOT_STEP,
      variables: {
        sessionId,
        stepType,
      },
    });

    if (!data?.runTroubleshootStep?.step?.result) {
      throw new Error('Diagnostic step failed to return a result. The backend may be overloaded or the router connection may have been lost.');
    }

    const result = data.runTroubleshootStep.step.result;

    // Return the result in our expected format
    return {
      success: result.success,
      message: result.message,
      details: result.details,
      executionTimeMs: result.executionTimeMs,
      issueCode: result.issueCode,
    } as DiagnosticResult;
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Diagnostic step execution failed. Please check your router connection and try again.';
    return {
      success: false,
      message: errorMessage,
      executionTimeMs,
    };
  }
}

/**
 * Legacy individual check functions removed.
 * All diagnostic checks are now handled by the backend GraphQL API.
 * The backend executes RouterOS commands (ping, interface status checks, etc.)
 * and returns structured results through the runTroubleshootStep mutation.
 *
 * Backend implementation locations:
 * - WAN check: /ip/interface/print where name=<wanInterface>
 * - Gateway check: /ping address=<gateway> count=3
 * - Internet check: /ping address=8.8.8.8 count=3
 * - DNS check: /tool/dns-lookup name=google.com
 * - NAT check: /ip/firewall/nat/print where action=masquerade
 */
