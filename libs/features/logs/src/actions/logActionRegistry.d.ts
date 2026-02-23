/**
 * Log action registry - defines available actions per topic
 * Epic 0.8: System Logs - Custom Log Actions
 */
import type { LogTopic } from '@nasnet/core/types';
/**
 * Action type definition for log entry context actions
 */
export interface LogAction {
    /** Unique action identifier */
    id: string;
    /** Display label for the action button */
    label: string;
    /** Lucide icon name (e.g., 'Shield', 'Plus', 'Ban') */
    icon: string;
    /** Optional description shown in tooltips */
    description?: string;
    /**
     * Handler type: determines how action is executed.
     * - 'navigate': Opens a route
     * - 'dialog': Opens a dialog/modal
     * - 'api': Makes an API call
     */
    handler: 'navigate' | 'dialog' | 'api';
    /**
     * Target path (for navigate) or dialog ID (for dialog handler)
     */
    target?: string;
    /**
     * Regular expression to extract data from log message.
     * First capture group is returned as extracted value.
     */
    extractPattern?: RegExp;
}
/**
 * Topic-specific actions
 */
export declare const logActionsByTopic: Record<LogTopic, LogAction[]>;
/**
 * Common actions available for all log entries
 */
export declare const commonLogActions: LogAction[];
/**
 * @description Get all available actions for a given log topic,
 * including both topic-specific actions and common actions.
 * @param topic - The log topic (e.g., 'firewall', 'dhcp', 'vpn')
 * @returns Array of LogAction objects available for this topic
 * @example
 * const actions = getActionsForTopic('firewall');
 * // Returns: [view-rule, add-to-whitelist, block-ip, copy, bookmark, view-details]
 */
export declare function getActionsForTopic(topic: LogTopic): LogAction[];
/**
 * @description Extract contextual data from a log message using the action's
 * regex pattern. Returns the first capture group from the pattern match.
 * @param message - The log message text to extract data from
 * @param action - The LogAction containing the extractPattern regex
 * @returns The extracted value (first capture group) or null if no match
 * @example
 * const action = logActionsByTopic.firewall[1]; // 'add-to-whitelist'
 * const ip = extractDataFromMessage('Blocked from 192.168.1.5', action);
 * // Returns: '192.168.1.5'
 */
export declare function extractDataFromMessage(message: string, action: LogAction): string | null;
//# sourceMappingURL=logActionRegistry.d.ts.map