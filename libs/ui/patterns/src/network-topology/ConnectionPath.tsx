/**
 * ConnectionPath
 *
 * SVG path component for rendering connections between topology nodes.
 * Implements curved bezier paths with status-based styling.
 */

import { memo } from 'react';

import { cn } from '@nasnet/ui/primitives';

export interface ConnectionPathProps {
  /** SVG path data (d attribute) */
  path: string;
  /** Connection status for styling */
  status: 'connected' | 'disconnected' | 'pending';
  /** Unique ID for the connection */
  id?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate the path (for pending status) */
  animate?: boolean;
}

/**
 * ConnectionPath renders a curved line between two topology nodes.
 *
 * Styling rules:
 * - Connected: Solid line with connection color
 * - Disconnected: Dashed line with muted color
 * - Pending: Animated dashed line with warning color
 */
export const ConnectionPath = memo(function ConnectionPath({
  path,
  status,
  id,
  className,
  animate = true,
}: ConnectionPathProps) {
  // Map status to stroke styles
  const strokeClass = {
    connected: 'stroke-[var(--color-connected,hsl(var(--success)))]',
    disconnected: 'stroke-[var(--color-disconnected,hsl(var(--muted-foreground)))]',
    pending: 'stroke-[var(--color-pending,hsl(var(--warning)))]',
  }[status];

  // Stroke dash pattern for disconnected/pending
  const strokeDasharray = status === 'connected' ? 'none' : '8 4';

  // Opacity based on status
  const opacity = status === 'disconnected' ? 0.5 : 1;

  return (
    <g className={cn('transition-opacity duration-200', className)}>
      {/* Background path for better visibility on complex backgrounds */}
      <path
        d={path}
        stroke="var(--background, white)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        opacity={0.3}
      />

      {/* Main connection path */}
      <path
        id={id}
        d={path}
        className={cn(strokeClass, 'transition-all duration-200')}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
        fill="none"
        opacity={opacity}
      >
        {/* Animate dash offset for pending status */}
        {animate && status === 'pending' && (
          <animate
            attributeName="stroke-dashoffset"
            values="0;24"
            dur="1s"
            repeatCount="indefinite"
          />
        )}
      </path>

      {/* Flow direction indicator (small arrow or dot) for connected paths */}
      {status === 'connected' && (
        <circle
          r="3"
          className="fill-[var(--color-connected,hsl(var(--success)))]"
        >
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={path}
          >
            <mpath href={`#${id}`} />
          </animateMotion>
        </circle>
      )}
    </g>
  );
});

ConnectionPath.displayName = 'ConnectionPath';

/**
 * ConnectionPathStatic
 *
 * Static version without animations for reduced motion preference.
 */
export const ConnectionPathStatic = memo(function ConnectionPathStatic({
  path,
  status,
  id,
  className,
}: Omit<ConnectionPathProps, 'animate'>) {
  const strokeClass = {
    connected: 'stroke-[var(--color-connected,hsl(var(--success)))]',
    disconnected: 'stroke-[var(--color-disconnected,hsl(var(--muted-foreground)))]',
    pending: 'stroke-[var(--color-pending,hsl(var(--warning)))]',
  }[status];

  const strokeDasharray = status === 'connected' ? 'none' : '8 4';
  const opacity = status === 'disconnected' ? 0.5 : 1;

  return (
    <path
      id={id}
      d={path}
      className={cn(strokeClass, className)}
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray={strokeDasharray}
      fill="none"
      opacity={opacity}
    />
  );
});

ConnectionPathStatic.displayName = 'ConnectionPathStatic';
