/**
 * Configuration Import Wizard Component
 * Multi-step dialog for importing router configuration
 * Follows Direction 6 (Guided Flow) from design spec
 */
export interface ConfigurationImportWizardProps {
    /**
     * Whether the dialog is open
     */
    isOpen: boolean;
    /**
     * Callback when dialog closes
     */
    onClose: () => void;
    /**
     * Router IP address
     */
    routerIp: string;
    /**
     * Router credentials for batch job
     */
    credentials: {
        username: string;
        password: string;
    };
    /**
     * Callback when configuration is successfully applied
     */
    onSuccess?: () => void;
    /**
     * Callback when user skips the wizard
     */
    onSkip?: () => void;
    /**
     * Optional className for styling
     */
    className?: string;
}
/**
 * ConfigurationImportWizard Component
 *
 * Multi-step wizard for importing router configuration.
 * Steps:
 * 1. Input configuration (paste/upload)
 * 2. Select protocol (API/SSH/Telnet)
 * 3. Execute and track progress
 *
 * @example
 * ```tsx
 * <ConfigurationImportWizard
 *   isOpen={showWizard}
 *   onClose={() => setShowWizard(false)}
 *   routerIp="192.168.88.1"
 *   credentials={{ username: 'admin', password: '' }}
 *   onSuccess={() => refetchRouterData()}
 * />
 * ```
 */
export declare const ConfigurationImportWizard: import("react").NamedExoticComponent<ConfigurationImportWizardProps>;
//# sourceMappingURL=ConfigurationImportWizard.d.ts.map