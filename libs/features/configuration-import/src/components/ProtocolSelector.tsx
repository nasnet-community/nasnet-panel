/**
 * Protocol Selector Component
 * Displays three protocol options (API, SSH, Telnet) as selectable cards
 * Disabled options are grayed out based on IP services status
 */

import { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@nasnet/ui/primitives';
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

  /**
   * Optional className for styling
   */
  className?: string;
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
export const ProtocolSelector = memo(function ProtocolSelector({
  value,
  onChange,
  apiEnabled,
  sshEnabled,
  telnetEnabled,
  disabled = false,
  isLoading = false,
  className,
}: ProtocolSelectorProps) {
  // Memoize protocols array
  const protocols: ProtocolOption[] = useMemo(
    () => [
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
    ],
    [apiEnabled, sshEnabled, telnetEnabled]
  );

  // Memoize enabled count
  const enabledCount = useMemo(() => protocols.filter((p) => p.enabled).length, [protocols]);
  const hasNoEnabledProtocols = useMemo(
    () => enabledCount === 0 && !isLoading,
    [enabledCount, isLoading]
  );

  // Memoize onChange handler
  const handleProtocolChange = useCallback(
    (protocol: ExecutionProtocol) => onChange(protocol),
    [onChange]
  );

  return (
    <div className={cn('space-y-component-md', className)}>
      {/* Header */}
      <div>
        <h3 className="text-foreground text-sm font-medium">Select Connection Method</h3>
        <p className="text-muted-foreground mt-component-sm text-xs">
          Choose how to apply the configuration to your router
        </p>
      </div>

      {/* Protocol Cards */}
      <div className="gap-component-md grid grid-cols-1 sm:grid-cols-3">
        {protocols.map((protocol) => {
          const Icon = protocol.icon;
          const isSelected = value === protocol.id;
          const isDisabled = disabled || !protocol.enabled || isLoading;

          return (
            <motion.button
              key={protocol.id}
              type="button"
              onClick={() => !isDisabled && handleProtocolChange(protocol.id)}
              disabled={isDisabled}
              aria-label={`${protocol.name}: ${protocol.description}${isSelected ? ' (selected)' : ''}${!protocol.enabled ? ' (unavailable)' : ''}`}
              aria-pressed={isSelected}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              className={`p-component-md focus-visible:ring-ring relative min-h-[44px] rounded-xl border-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isSelected ? 'border-primary bg-primary/5 shadow-primary-glow'
                : isDisabled ? 'border-border bg-muted cursor-not-allowed opacity-50'
                : 'border-border bg-card hover:border-primary/60 cursor-pointer hover:shadow-md'
              } `}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute right-2 top-2">
                  <div className="bg-primary flex h-5 w-5 items-center justify-center rounded-full">
                    <Check
                      className="text-primary-foreground h-3 w-3"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )}

              {/* Recommended badge */}
              {protocol.recommended && protocol.enabled && (
                <div className="absolute -top-2 left-3">
                  <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
                    Recommended
                  </span>
                </div>
              )}

              {/* Icon */}
              <div
                className={`mb-component-md flex h-10 w-10 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-primary text-primary-foreground'
                  : isDisabled ? 'bg-muted text-muted-foreground'
                  : 'bg-muted text-muted-foreground'
                } `}
              >
                <Icon
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </div>

              {/* Text */}
              <div>
                <h4
                  className={`font-medium ${
                    isSelected ? 'text-primary'
                    : isDisabled ? 'text-muted-foreground'
                    : 'text-foreground'
                  }`}
                >
                  {protocol.name}
                </h4>
                <p
                  className={`mt-component-sm text-xs ${
                    isDisabled ? 'text-muted-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {protocol.description}
                </p>
              </div>

              {/* Status indicator */}
              <div
                className="mt-component-md gap-component-sm flex items-center"
                role="status"
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${
                    protocol.enabled ? 'bg-success' : 'bg-muted-foreground/30'
                  }`}
                />
                <span
                  className={`text-xs ${
                    protocol.enabled ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  {isLoading ?
                    'Checking...'
                  : protocol.enabled ?
                    'Available'
                  : 'Disabled'}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div
          className="gap-component-sm py-component-sm text-muted-foreground flex items-center justify-center"
          role="status"
          aria-label="Checking available services"
        >
          <div
            className="h-4 w-4 animate-spin rounded-full border-b-2 border-current"
            aria-hidden="true"
          />
          <span className="text-sm">Checking available services...</span>
        </div>
      )}

      {/* No protocols available warning */}
      {hasNoEnabledProtocols && (
        <div
          className="gap-component-md p-component-md bg-warning/10 border-warning/30 flex items-start rounded-lg border"
          role="alert"
        >
          <AlertCircle
            className="text-warning mt-0.5 h-5 w-5 flex-shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-warning text-sm font-medium">No connection methods available</p>
            <p className="text-muted-foreground mt-component-sm text-xs">
              Please enable API, SSH, or Telnet service on your router to apply configuration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

ProtocolSelector.displayName = 'ProtocolSelector';
