/**
 * InstallingStep Component
 *
 * Third step of template installation wizard.
 * Shows real-time installation progress with subscription updates.
 */
import React from 'react';
import type { TemplateInstallContext } from '../templateInstallMachine';
/**
 * Props for InstallingStep
 */
export interface InstallingStepProps {
    /** Installation progress from context */
    progress: TemplateInstallContext['progress'];
    /** Installation result (if complete) */
    installResult: TemplateInstallContext['installResult'];
    /** Optional CSS class name for the container */
    className?: string;
}
/**
 * InstallingStep - Real-time installation progress
 *
 * Features:
 * - Overall progress bar
 * - Phase indicator (VALIDATING → INSTALLING → VERIFYING)
 * - Per-service progress
 * - Real-time updates from subscription
 *
 * @example
 * ```tsx
 * <InstallingStep
 *   progress={context.progress}
 *   installResult={context.installResult}
 * />
 * ```
 */
export declare const InstallingStep: React.NamedExoticComponent<InstallingStepProps>;
//# sourceMappingURL=InstallingStep.d.ts.map