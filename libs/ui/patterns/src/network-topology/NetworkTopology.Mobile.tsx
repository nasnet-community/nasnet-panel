/**
 * NetworkTopology.Mobile
 *
 * Mobile presenter for the Network Topology visualization.
 * Renders a simplified card-based list view instead of SVG.
 *
 * @see ADR-018: Headless + Platform Presenters
 */

import { memo, useState, useCallback } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  cn,
} from '@nasnet/ui/primitives';

import { RouterIcon, WanIcon, LanIcon, DeviceIcon } from './icons';

import type {
  NetworkTopologyProps,
  RouterInfo,
  WanInterface,
  LanNetwork,
  Device,
} from './types';

export interface NetworkTopologyMobileProps extends NetworkTopologyProps {
  /** Whether to initially expand sections */
  defaultExpanded?: boolean;
}

/**
 * Status badge component
 */
function StatusBadge({
  status,
}: {
  status: 'online' | 'offline' | 'connected' | 'disconnected' | 'pending' | 'unknown';
}) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    online: { variant: 'default', label: 'Online' },
    offline: { variant: 'secondary', label: 'Offline' },
    connected: { variant: 'default', label: 'Connected' },
    disconnected: { variant: 'secondary', label: 'Disconnected' },
    pending: { variant: 'outline', label: 'Pending' },
    unknown: { variant: 'secondary', label: 'Unknown' },
  };

  const { variant, label } = config[status] || config.unknown;

  return <Badge variant={variant}>{label}</Badge>;
}

/**
 * Collapsible section component
 */
interface SectionProps {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function Section({ title, count, defaultExpanded = false, children }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex w-full items-center justify-between px-4 py-3',
          'text-left font-medium transition-colors',
          'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
        aria-expanded={expanded}
        aria-controls={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <span className="flex items-center gap-2">
          {title}
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </span>
        <svg
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {expanded && (
        <div
          id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="px-4 pb-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Router info card
 */
function RouterCard({ router }: { router: RouterInfo }) {
  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <RouterIcon size={48} status={router.status} />
        <div className="flex-1">
          <CardTitle className="text-lg">{router.name}</CardTitle>
          {router.model && (
            <p className="text-sm text-muted-foreground">{router.model}</p>
          )}
        </div>
        <StatusBadge status={router.status} />
      </CardHeader>
    </Card>
  );
}

/**
 * WAN interface list item
 */
function WanItem({ wan }: { wan: WanInterface }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 mb-2 last:mb-0">
      <WanIcon size={32} status={wan.status} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{wan.name}</p>
        {wan.ip && (
          <p className="font-mono text-sm text-muted-foreground">{wan.ip}</p>
        )}
        {wan.provider && (
          <p className="text-xs text-muted-foreground">{wan.provider}</p>
        )}
      </div>
      <StatusBadge status={wan.status} />
    </div>
  );
}

/**
 * LAN network list item
 */
function LanItem({ lan }: { lan: LanNetwork }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 mb-2 last:mb-0">
      <LanIcon size={32} status="connected" deviceCount={lan.deviceCount} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{lan.name}</p>
        <p className="font-mono text-sm text-muted-foreground">{lan.cidr}</p>
        <p className="text-xs text-muted-foreground">Gateway: {lan.gateway}</p>
      </div>
      {lan.deviceCount !== undefined && (
        <Badge variant="outline" className="shrink-0">
          {lan.deviceCount} devices
        </Badge>
      )}
    </div>
  );
}

/**
 * Device list item
 */
function DeviceItem({ device }: { device: Device }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 mb-2 last:mb-0">
      <DeviceIcon size={28} type={device.type} status={device.status} />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{device.name}</p>
        {device.ip && (
          <p className="font-mono text-sm text-muted-foreground">{device.ip}</p>
        )}
        {device.mac && (
          <p className="font-mono text-xs text-muted-foreground">{device.mac}</p>
        )}
      </div>
      <StatusBadge status={device.status} />
    </div>
  );
}

/**
 * NetworkTopologyMobile
 *
 * Simplified list-based view of the network topology for mobile screens.
 * Features:
 * - Router info card at top
 * - Collapsible sections for WAN, LAN, and Devices
 * - Touch-optimized list items with 44px+ touch targets
 * - Status badges for quick visual reference
 */
export const NetworkTopologyMobile = memo(function NetworkTopologyMobile({
  router,
  wanInterfaces,
  lanNetworks,
  devices = [],
  className,
  defaultExpanded = true,
}: NetworkTopologyMobileProps) {
  return (
    <div
      className={cn('w-full', className)}
      role="region"
      aria-label="Network topology overview"
    >
      {/* Router header card */}
      <RouterCard router={router} />

      {/* Collapsible sections */}
      <Card>
        <CardContent className="p-0">
          {/* WAN Interfaces Section */}
          <Section
            title="WAN Interfaces"
            count={wanInterfaces.length}
            defaultExpanded={defaultExpanded}
          >
            {wanInterfaces.length > 0 ? (
              wanInterfaces.map((wan) => <WanItem key={wan.id} wan={wan} />)
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No WAN interfaces configured
              </p>
            )}
          </Section>

          {/* LAN Networks Section */}
          <Section
            title="LAN Networks"
            count={lanNetworks.length}
            defaultExpanded={defaultExpanded}
          >
            {lanNetworks.length > 0 ? (
              lanNetworks.map((lan) => <LanItem key={lan.id} lan={lan} />)
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No LAN networks configured
              </p>
            )}
          </Section>

          {/* Devices Section */}
          {devices.length > 0 && (
            <Section
              title="Devices"
              count={devices.length}
              defaultExpanded={false}
            >
              {devices.map((device) => (
                <DeviceItem key={device.id} device={device} />
              ))}
            </Section>
          )}
        </CardContent>
      </Card>

      {/* Connection summary */}
      <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span>
            {wanInterfaces.filter((w) => w.status === 'connected').length} Connected
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gray-400" />
          <span>
            {wanInterfaces.filter((w) => w.status === 'disconnected').length} Disconnected
          </span>
        </div>
      </div>
    </div>
  );
});

NetworkTopologyMobile.displayName = 'NetworkTopologyMobile';
