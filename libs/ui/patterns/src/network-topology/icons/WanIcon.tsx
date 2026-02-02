/**
 * WanIcon
 *
 * SVG icon representing a WAN (Wide Area Network) interface.
 * Uses --color-wan design token for styling.
 */

import { memo } from 'react';

import { cn } from '@nasnet/ui/primitives';

export interface WanIconProps {
  /** Size of the icon in pixels */
  size?: number;
  /** Connection status for styling */
  status?: 'connected' | 'disconnected' | 'pending';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

/**
 * WAN interface icon representing internet/external network connection.
 * Displays as a globe/cloud icon with status-based coloring.
 */
export const WanIcon = memo(function WanIcon({
  size = 48,
  status = 'connected',
  className,
  'aria-label': ariaLabel,
}: WanIconProps) {
  // Map status to color - WAN uses orange accent
  const statusClass = {
    connected: 'text-[var(--color-wan,hsl(var(--orange-500)))]',
    disconnected: 'text-[var(--color-disconnected,hsl(var(--muted-foreground)))]',
    pending: 'text-[var(--color-pending,hsl(var(--warning)))]',
  }[status];

  // Opacity for disconnected state
  const fillOpacity = status === 'disconnected' ? 0.3 : 0.15;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(statusClass, className)}
      aria-label={ariaLabel || `WAN interface ${status}`}
      role="img"
    >
      <title>WAN Interface - {status}</title>
      <desc>Wide Area Network interface icon showing {status} status</desc>

      {/* Globe circle */}
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="currentColor"
        fillOpacity={fillOpacity}
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Horizontal line (equator) */}
      <ellipse
        cx="24"
        cy="24"
        rx="18"
        ry="7"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Vertical arc left */}
      <path
        d="M24 6C18 6 14 14 14 24C14 34 18 42 24 42"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Vertical arc right */}
      <path
        d="M24 6C30 6 34 14 34 24C34 34 30 42 24 42"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Vertical center line */}
      <line
        x1="24"
        y1="6"
        x2="24"
        y2="42"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Connection indicator arrow (pointing right toward router) */}
      <path
        d="M38 24L44 24M44 24L40 20M44 24L40 28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={status === 'connected' ? 1 : 0.5}
      />

      {/* Pending animation indicator */}
      {status === 'pending' && (
        <circle
          cx="42"
          cy="24"
          r="3"
          fill="currentColor"
          opacity="0.7"
        >
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </svg>
  );
});

WanIcon.displayName = 'WanIcon';
