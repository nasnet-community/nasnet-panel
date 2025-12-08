/**
 * Protocol Selector Component
 * Displays three protocol options (API, SSH, Telnet) as selectable cards
 * Disabled options are grayed out based on IP services status
 */

import { motion } from 'framer-motion';
import { Plug, Terminal, MonitorDot, Check, AlertCircle } from 'lucide-react';
import type { ExecutionProtocol } from '@nasnet/api-client/queries';

export interface ProtocolOption {
  id: ExecutionProtocol;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
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
}

/**
 * Protocol icons mapping
 */
const PROTOCOL_ICONS: Record<ExecutionProtocol, React.ComponentType<{ className?: string }>> = {
  api: Plug,
  ssh: Terminal,
  telnet: MonitorDot,
};

/**
 * Protocol descriptions
 */
const PROTOCOL_INFO: Record<ExecutionProtocol, { name: string; description: string }> = {
  api: {
    name: 'RouterOS API',
    description: 'Native API protocol (fastest)',
  },
  ssh: {
    name: 'SSH',
    description: 'Secure Shell connection',
  },
  telnet: {
    name: 'Telnet',
    description: 'Legacy telnet protocol',
  },
};

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
export function ProtocolSelector({
  value,
  onChange,
  apiEnabled,
  sshEnabled,
  telnetEnabled,
  disabled = false,
  isLoading = false,
}: ProtocolSelectorProps) {
  const protocols: ProtocolOption[] = [
    {
      id: 'api',
      ...PROTOCOL_INFO.api,
      icon: PROTOCOL_ICONS.api,
      enabled: apiEnabled,
      recommended: true,
    },
    {
      id: 'ssh',
      ...PROTOCOL_INFO.ssh,
      icon: PROTOCOL_ICONS.ssh,
      enabled: sshEnabled,
    },
    {
      id: 'telnet',
      ...PROTOCOL_INFO.telnet,
      icon: PROTOCOL_ICONS.telnet,
      enabled: telnetEnabled,
    },
  ];

  // Count enabled protocols
  const enabledCount = protocols.filter((p) => p.enabled).length;
  const hasNoEnabledProtocols = enabledCount === 0 && !isLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Select Connection Method
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Choose how to apply the configuration to your router
        </p>
      </div>

      {/* Protocol Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {protocols.map((protocol) => {
          const Icon = protocol.icon;
          const isSelected = value === protocol.id;
          const isDisabled = disabled || !protocol.enabled || isLoading;

          return (
            <motion.button
              key={protocol.id}
              type="button"
              onClick={() => !isDisabled && onChange(protocol.id)}
              disabled={isDisabled}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all
                ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-primary-glow'
                    : isDisabled
                    ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 hover:shadow-md cursor-pointer'
                }
              `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              {/* Recommended badge */}
              {protocol.recommended && protocol.enabled && (
                <div className="absolute -top-2 left-3">
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-secondary-500 text-white rounded-full">
                    Recommended
                  </span>
                </div>
              )}

              {/* Icon */}
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center mb-3
                  ${
                    isSelected
                      ? 'bg-primary-500 text-white'
                      : isDisabled
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Text */}
              <div>
                <h4
                  className={`font-medium ${
                    isSelected
                      ? 'text-primary-700 dark:text-primary-300'
                      : isDisabled
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {protocol.name}
                </h4>
                <p
                  className={`text-xs mt-0.5 ${
                    isDisabled
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {protocol.description}
                </p>
              </div>

              {/* Status indicator */}
              <div className="mt-3 flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    protocol.enabled ? 'bg-success' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
                <span
                  className={`text-xs ${
                    protocol.enabled
                      ? 'text-success'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {isLoading ? 'Checking...' : protocol.enabled ? 'Available' : 'Disabled'}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-2 text-slate-500 dark:text-slate-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          <span className="text-sm">Checking available services...</span>
        </div>
      )}

      {/* No protocols available warning */}
      {hasNoEnabledProtocols && (
        <div className="flex items-start gap-3 p-3 bg-warning-light/50 dark:bg-warning/10 border border-warning/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning-dark dark:text-warning">
              No connection methods available
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Please enable API, SSH, or Telnet service on your router to apply configuration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

