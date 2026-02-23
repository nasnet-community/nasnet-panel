/**
 * Configuration Input Component
 * File upload zone with paste support for importing router configurations
 * Implements FileUploadZone pattern from design spec section 6.3
 */
export interface ConfigurationInputProps {
    /**
     * Current configuration content
     */
    value: string;
    /**
     * Callback when configuration changes
     */
    onChange: (value: string) => void;
    /**
     * Whether input is disabled
     */
    disabled?: boolean;
    /**
     * Error message to display
     */
    error?: string;
    /**
     * Optional className for styling
     */
    className?: string;
}
/**
 * ConfigurationInput Component
 *
 * Allows users to input configuration via:
 * - Drag and drop .rsc files
 * - File browser selection
 * - Text paste/manual entry
 *
 * @example
 * ```tsx
 * <ConfigurationInput
 *   value={config}
 *   onChange={setConfig}
 * />
 * ```
 */
export declare const ConfigurationInput: import("react").NamedExoticComponent<ConfigurationInputProps>;
//# sourceMappingURL=ConfigurationInput.d.ts.map