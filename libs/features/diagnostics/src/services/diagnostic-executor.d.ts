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
export declare function executeDiagnosticStep(stepId: string, routerId: string, sessionId: string): Promise<DiagnosticResult>;
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
//# sourceMappingURL=diagnostic-executor.d.ts.map