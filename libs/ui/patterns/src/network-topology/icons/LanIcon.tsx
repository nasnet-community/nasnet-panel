/**
 * LanIcon
 *
 * SVG icon representing a LAN (Local Area Network).
 * Uses --color-lan design token for styling.
 */

import { memo } from 'react';

import { cn } from '@nasnet/ui/primitives';

export interface LanIconProps {
  /** Size of the icon in pixels */
  size?: number;
  /** Connection status for styling */
  status?: 'connected' | 'disconnected';
  /** Number of devices on this network (optional) */
  deviceCount?: number;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

/**
 * LAN network icon representing a local network segment.
 * Displays as a network/nodes icon with status-based coloring.
 */
export const LanIcon = memo(function LanIcon({
  size = 48,
  status = 'connected',
  deviceCount,
  className,
  'aria-label': ariaLabel,
}: LanIconProps) {
  // LAN uses blue accent
  const statusClass = {
    connected: 'text-[var(--color-lan,hsl(var(--blue-500)))]',
    disconnected: 'text-[var(--color-disconnected,hsl(var(--muted-foreground)))]',
  }[status];

  const fillOpacity = status === 'disconnected' ? 0.3 : 0.15;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(statusClass, className)}
      aria-label={ariaLabel || `LAN network ${status}${deviceCount !== undefined ? `, ${deviceCount} devices` : ''}`}
      role="img"
    >
      <title>LAN Network - {status}</title>
      <desc>
        Local Area Network icon showing {status} status
        {deviceCount !== undefined && ` with ${deviceCount} devices`}
      </desc>

      {/* Central hub */}
      <circle
        cx="24"
        cy="24"
        r="8"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Network switch lines in center */}
      <rect x="20" y="22" width="8" height="4" rx="1" fill="currentColor" fillOpacity="0.6" />

      {/* Top node */}
      <circle
        cx="24"
        cy="8"
        r="4"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="24"
        y1="12"
        x2="24"
        y2="16"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Bottom node */}
      <circle
        cx="24"
        cy="40"
        r="4"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="24"
        y1="32"
        x2="24"
        y2="36"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Left node */}
      <circle
        cx="8"
        cy="24"
        r="4"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="12"
        y1="24"
        x2="16"
        y2="24"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Right node */}
      <circle
        cx="40"
        cy="24"
        r="4"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="32"
        y1="24"
        x2="36"
        y2="24"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Device count badge (if provided) */}
      {deviceCount !== undefined && deviceCount > 0 && (
        <g>
          <circle
            cx="40"
            cy="8"
            r="8"
            fill="currentColor"
          />
          <text
            x="40"
            y="12"
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="white"
            className="font-mono"
          >
            {deviceCount > 99 ? '99+' : deviceCount}
          </text>
        </g>
      )}
    </svg>
  );
});

LanIcon.displayName = 'LanIcon';
