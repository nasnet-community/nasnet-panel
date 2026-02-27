/**
 * RouterIcon
 *
 * SVG icon representing the central router in the network topology.
 * Uses design tokens for theming and supports accessibility.
 */

import { memo } from 'react';

import { cn } from '@nasnet/ui/primitives';

export interface RouterIconProps {
  /** Size of the icon in pixels */
  size?: number;
  /** Router status for styling */
  status?: 'online' | 'offline' | 'unknown';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

/**
 * Central router icon for the network topology visualization.
 * Displays as a stylized router with status-based coloring.
 */
export const RouterIcon = memo(function RouterIcon({
  size = 64,
  status = 'online',
  className,
  'aria-label': ariaLabel,
}: RouterIconProps) {
  // Map status to CSS class for theming
  const statusClass = {
    online: 'text-[var(--color-connected,hsl(var(--success)))]',
    offline: 'text-[var(--color-disconnected,hsl(var(--muted-foreground)))]',
    unknown: 'text-[var(--color-pending,hsl(var(--warning)))]',
  }[status];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(statusClass, className)}
      aria-label={ariaLabel || `Router ${status}`}
      role="img"
    >
      <title>Router - {status}</title>
      <desc>Central router icon showing {status} status</desc>

      {/* Router body - rounded rectangle */}
      <rect
        x="8"
        y="18"
        width="48"
        height="28"
        rx="4"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Antenna left */}
      <path
        d="M16 18V10C16 8.89543 16.8954 8 18 8H18C19.1046 8 20 8.89543 20 10V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Antenna right */}
      <path
        d="M44 18V10C44 8.89543 44.8954 8 46 8H46C47.1046 8 48 8.89543 48 10V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Status LED indicators */}
      <circle
        cx="20"
        cy="32"
        r="3"
        fill={status === 'online' ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="32"
        cy="32"
        r="3"
        fill={status === 'online' ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="44"
        cy="32"
        r="3"
        fill={status === 'online' ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Port indicators at bottom */}
      <rect
        x="14"
        y="40"
        width="8"
        height="4"
        rx="1"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <rect
        x="28"
        y="40"
        width="8"
        height="4"
        rx="1"
        fill="currentColor"
        fillOpacity="0.5"
      />
      <rect
        x="42"
        y="40"
        width="8"
        height="4"
        rx="1"
        fill="currentColor"
        fillOpacity="0.5"
      />

      {/* Base/stand */}
      <path
        d="M24 46H40V52C40 53.1046 39.1046 54 38 54H26C24.8954 54 24 53.1046 24 52V46Z"
        fill="currentColor"
        fillOpacity="0.3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
});

RouterIcon.displayName = 'RouterIcon';
