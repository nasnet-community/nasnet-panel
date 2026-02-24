/**
 * Wireless Interface Detail Component
 * @description Displays comprehensive wireless interface configuration including radio settings,
 * security profile, signal strength, and regional settings with edit capabilities.
 * Implements FR0-15: View wireless interface configuration details
 * Implements FR0-16: View security profile settings
 */

import { forwardRef, useCallback, useState } from 'react';
import { Card, Button, Badge, cn } from '@nasnet/ui/primitives';
import {
  Copy,
  Check,
  Signal,
  Radio,
  Wifi,
  Settings,
  EyeOff,
  Globe,
  Shield,
} from 'lucide-react';
import type { WirelessInterfaceDetail as WirelessInterfaceDetailType } from '@nasnet/core/types';
import { SecurityProfileSection } from './SecurityProfileSection';
import { InterfaceToggle } from './InterfaceToggle';
import { WirelessSettingsModal } from './WirelessSettingsModal';
import { getCountryName } from '../data/wirelessOptions';

export interface WirelessInterfaceDetailProps {
  /** The wireless interface to display */
  interface: WirelessInterfaceDetailType;
  /** Optional CSS className */
  className?: string;
}

/**
 * Wireless Interface Detail Component
 * Shows full configuration details including radio settings, hardware info, and status
 */
export const WirelessInterfaceDetail = forwardRef<
  HTMLDivElement,
  WirelessInterfaceDetailProps
>(({ interface: iface, className }, ref) => {
  const [copied, setCopied] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const isStation = iface.mode === 'station' || iface.mode === 'station-bridge';

  // Get user-friendly mode label
  const modeLabel =
    iface.mode === 'ap-bridge'
      ? 'Access Point'
      : iface.mode === 'station'
        ? 'Station'
        : iface.mode === 'station-bridge'
          ? 'Station Bridge'
          : iface.mode;

  /**
   * Copy MAC address to clipboard
   */
  const handleCopyMac = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(iface.macAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy MAC address:', error);
    }
  }, [iface.macAddress]);

  return (
    <div ref={ref} className={cn('space-y-component-md', className)}>
      {/* Header Section */}
      <Card className="p-component-lg">
        <div className="flex items-start justify-between mb-component-md">
          <div className="flex-1">
            <div className="flex items-center gap-component-sm mb-component-xs">
              <Wifi className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold font-display text-foreground">
                {iface.ssid || 'Not configured'}
              </h2>
              {iface.hideSsid && (
                <Badge variant="secondary" className="ml-component-sm">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hidden
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {iface.name}
            </p>
          </div>
          <div className="flex items-center gap-component-sm">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowSettingsModal(true)}
              aria-label="Edit settings"
              className="gap-component-sm"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Edit Settings</span>
              <span className="sm:hidden">Edit</span>
            </Button>
            <InterfaceToggle interface={iface} />
          </div>
        </div>

        {/* Mode and Band */}
        <div className="flex items-center gap-component-sm text-sm text-muted-foreground">
          <span>{modeLabel}</span>
          {iface.band !== 'Unknown' && (
            <>
              <span>•</span>
              <span>{iface.band}</span>
            </>
          )}
        </div>
      </Card>

      {/* Radio Settings Section */}
      <Card className="p-component-lg">
        <div className="flex items-center gap-component-sm mb-component-md">
          <Radio className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-semibold font-display text-foreground">
            Radio Settings
          </h3>
        </div>

        <div className="space-y-component-sm">
          <DetailRow label="Frequency" value={`${iface.frequency} MHz`} technical />
          <DetailRow label="Channel" value={iface.channel || 'Auto'} technical />
          <DetailRow label="Channel Width" value={iface.channelWidth} technical />
          <DetailRow label="TX Power" value={`${iface.txPower} dBm`} technical />
        </div>
      </Card>

      {/* Security Section */}
      <Card className="p-component-lg">
        <div className="flex items-center gap-component-sm mb-component-md">
          <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-semibold font-display text-foreground">
            Security
          </h3>
        </div>

        <div className="space-y-component-sm">
          <DetailRow label="Security Profile" value={iface.securityProfile} />
          <DetailRow
            label="Network Visibility"
            value={iface.hideSsid ? 'Hidden' : 'Visible'}
          />
        </div>
      </Card>

      {/* Signal Strength (Station Mode Only) */}
      {isStation && iface.signalStrength !== undefined && (
        <Card className="p-component-lg">
          <div className="flex items-center gap-component-sm mb-component-md">
            <Signal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="text-sm font-semibold font-display text-foreground">
              Connection
            </h3>
          </div>

          <div className="space-y-component-sm">
            <DetailRow
              label="Signal Strength"
              value={`${iface.signalStrength} dBm`}
            />
            {iface.connectedTo && (
              <DetailRow label="Connected To" value={iface.connectedTo} />
            )}
          </div>
        </Card>
      )}

      {/* Regional Settings */}
      {iface.countryCode && (
        <Card className="p-component-lg">
          <div className="flex items-center gap-component-sm mb-component-md">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold font-display text-foreground">
              Regional
            </h3>
          </div>

          <div className="space-y-component-sm">
            <DetailRow
              label="Country/Region"
              value={`${getCountryName(iface.countryCode)} (${iface.countryCode})`}
            />
          </div>
        </Card>
      )}

      {/* Security Profile Details (if available) */}
      {iface.securityProfileDetails && (
        <SecurityProfileSection profile={iface.securityProfileDetails} />
      )}

      {/* Hardware Section */}
      <Card className="p-component-lg">
        <h3 className="text-sm font-semibold font-display text-foreground mb-component-md">
          Hardware
        </h3>

        <div className="space-y-component-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              MAC Address
            </span>
            <div className="flex items-center gap-component-sm">
              <code className="text-sm font-mono text-foreground">
                {iface.macAddress}
              </code>
              <button
                onClick={handleCopyMac}
                className="h-11 w-11 p-component-xs rounded-[var(--semantic-radius-button)] hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center"
                aria-label="Copy MAC address to clipboard"
                type="button"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>
          {!isStation && (
            <DetailRow
              label="Connected Clients"
              value={iface.connectedClients.toString()}
            />
          )}
        </div>
      </Card>

      {/* Settings Modal */}
      <WirelessSettingsModal
        interface={iface}
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </div>
  );
});

WirelessInterfaceDetail.displayName = 'WirelessInterfaceDetail';

/**
 * Detail row component for consistent key-value display
 */
const DetailRow = ({ label, value, technical }: { label: string; value: string; technical?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={cn('text-sm font-medium text-foreground', technical && 'font-mono')}>{value}</span>
  </div>
);
