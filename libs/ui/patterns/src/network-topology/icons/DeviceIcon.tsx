/**
 * DeviceIcon
 *
 * SVG icon representing a device on the network.
 * Supports multiple device types with distinct icons.
 */

import { memo } from 'react';

import { cn } from '@nasnet/ui/primitives';

export type DeviceType = 'computer' | 'phone' | 'tablet' | 'iot' | 'unknown';

export interface DeviceIconProps {
  /** Size of the icon in pixels */
  size?: number;
  /** Type of device */
  type?: DeviceType;
  /** Device status for styling */
  status?: 'online' | 'offline';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

/**
 * Computer icon variant
 */
function ComputerIcon({ fillOpacity }: { fillOpacity: number }) {
  return (
    <>
      {/* Monitor */}
      <rect
        x="4"
        y="4"
        width="24"
        height="18"
        rx="2"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Screen */}
      <rect
        x="6"
        y="6"
        width="20"
        height="12"
        rx="1"
        fill="currentColor"
        fillOpacity="0.3"
      />
      {/* Stand */}
      <path
        d="M14 22V26H10V28H22V26H18V22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

/**
 * Phone icon variant
 */
function PhoneIcon({ fillOpacity }: { fillOpacity: number }) {
  return (
    <>
      {/* Phone body */}
      <rect
        x="8"
        y="2"
        width="16"
        height="28"
        rx="3"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Screen */}
      <rect
        x="10"
        y="5"
        width="12"
        height="18"
        rx="1"
        fill="currentColor"
        fillOpacity="0.3"
      />
      {/* Home button / indicator */}
      <circle cx="16" cy="27" r="2" fill="currentColor" fillOpacity="0.5" />
      {/* Speaker notch */}
      <rect x="13" y="3" width="6" height="1" rx="0.5" fill="currentColor" fillOpacity="0.5" />
    </>
  );
}

/**
 * Tablet icon variant
 */
function TabletIcon({ fillOpacity }: { fillOpacity: number }) {
  return (
    <>
      {/* Tablet body */}
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="3"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Screen */}
      <rect
        x="6"
        y="6"
        width="20"
        height="18"
        rx="1"
        fill="currentColor"
        fillOpacity="0.3"
      />
      {/* Home button */}
      <circle cx="16" cy="26" r="1.5" fill="currentColor" fillOpacity="0.5" />
    </>
  );
}

/**
 * IoT device icon variant (smart device/sensor)
 */
function IotIcon({ fillOpacity }: { fillOpacity: number }) {
  return (
    <>
      {/* Device body (rounded square) */}
      <rect
        x="6"
        y="6"
        width="20"
        height="20"
        rx="4"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* WiFi/signal indicator */}
      <path
        d="M16 14C18.5 14 20.5 15.3 21.5 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 17C17.5 17 18.7 17.7 19.3 18.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="21" r="2" fill="currentColor" />
      {/* Power indicator */}
      <circle cx="22" cy="10" r="2" fill="currentColor" fillOpacity="0.7" />
    </>
  );
}

/**
 * Unknown device icon variant
 */
function UnknownIcon({ fillOpacity }: { fillOpacity: number }) {
  return (
    <>
      {/* Generic device circle */}
      <circle
        cx="16"
        cy="16"
        r="12"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Question mark */}
      <path
        d="M13 12C13 10.3 14.3 9 16 9C17.7 9 19 10.3 19 12C19 13.4 18.1 14.5 16.8 14.9C16.3 15 16 15.5 16 16V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="21" r="1.5" fill="currentColor" />
    </>
  );
}

/**
 * Device icon for network topology visualization.
 * Displays different icons based on device type.
 */
export const DeviceIcon = memo(function DeviceIcon({
  size = 32,
  type = 'unknown',
  status = 'online',
  className,
  'aria-label': ariaLabel,
}: DeviceIconProps) {
  const statusClass = {
    online: 'text-[var(--color-connected,hsl(var(--success)))]',
    offline: 'text-[var(--color-disconnected,hsl(var(--muted-foreground)))]',
  }[status];

  const fillOpacity = status === 'offline' ? 0.2 : 0.15;

  const deviceLabel = {
    computer: 'Computer',
    phone: 'Phone',
    tablet: 'Tablet',
    iot: 'IoT Device',
    unknown: 'Unknown Device',
  }[type];

  const renderIcon = () => {
    switch (type) {
      case 'computer':
        return <ComputerIcon fillOpacity={fillOpacity} />;
      case 'phone':
        return <PhoneIcon fillOpacity={fillOpacity} />;
      case 'tablet':
        return <TabletIcon fillOpacity={fillOpacity} />;
      case 'iot':
        return <IotIcon fillOpacity={fillOpacity} />;
      case 'unknown':
      default:
        return <UnknownIcon fillOpacity={fillOpacity} />;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(statusClass, className)}
      aria-label={ariaLabel || `${deviceLabel} ${status}`}
      role="img"
    >
      <title>{deviceLabel} - {status}</title>
      <desc>{deviceLabel} icon showing {status} status</desc>
      {renderIcon()}
    </svg>
  );
});

DeviceIcon.displayName = 'DeviceIcon';
