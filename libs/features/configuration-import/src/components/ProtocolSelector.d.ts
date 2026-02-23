/**
 * Protocol Selector Component
 * Displays three protocol options (API, SSH, Telnet) as selectable cards
 * Disabled options are grayed out based on IP services status
 */
import type { ExecutionProtocol } from '@nasnet/api-client/queries';
export interface ProtocolOption {
    id: ExecutionProtocol;
    name: string;
    description: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
    enabled: boolean;
    recommended?: boolean;
}
export interface ProtocolSelectorProps {
    /**
     * Currently selected protocol
     */
    value: ExecutionProtocol | null;
    /**
     * Callback when protocol is selected
     */
    onChange: (protocol: ExecutionProtocol) => void;
    /**
     * Whether API service is enabled
     */
    apiEnabled: boolean;
    /**
     * Whether SSH service is enabled
     */
    sshEnabled: boolean;
    /**
     * Whether Telnet service is enabled
     */
    telnetEnabled: boolean;
    /**
     * Whether selector is disabled
     */
    disabled?: boolean;
    /**
     * Whether services are still loading
     */
    isLoading?: boolean;
    /**
     * Optional className for styling
     */
    className?: string;
}
/**
 * ProtocolSelector Component
 *
 * Displays protocol options as interactive cards.
 * Automatically disables unavailable protocols based on router services.
 *
 * @example
 * ```tsx
 * <ProtocolSelector
 *   value={selectedProtocol}
 *   onChange={setSelectedProtocol}
 *   apiEnabled={true}
 *   sshEnabled={true}
 *   telnetEnabled={false}
 * />
 * ```
 */
export declare const ProtocolSelector: import("react").NamedExoticComponent<ProtocolSelectorProps>;
//# sourceMappingURL=ProtocolSelector.d.ts.map