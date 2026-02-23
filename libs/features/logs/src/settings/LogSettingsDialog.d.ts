/**
 * Log Settings Dialog Component
 * Configure RouterOS logging rules and destinations
 * Epic 0.8: System Logs - RouterOS Log Settings
 */
import * as React from 'react';
export interface LogSettingsDialogProps {
    /**
     * Trigger element (defaults to Settings icon button)
     */
    trigger?: React.ReactNode;
    /**
     * Additional class names
     */
    className?: string;
}
/**
 * @description Dialog for configuring RouterOS logging settings, rules, and log destinations
 * Allows users to manage logging rules and configure where logs are stored (memory, disk, remote syslog).
 */
export declare const LogSettingsDialog: React.NamedExoticComponent<LogSettingsDialogProps>;
//# sourceMappingURL=LogSettingsDialog.d.ts.map