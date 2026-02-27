/**
 * SecurityLevelBadge Component
 * @description Displays a color-coded security level indicator with status icon and label.
 * Shows security strength (Strong/Moderate/Weak/None) with appropriate visual styling.
 * Implements FR0-16: View security profile settings with security level indicator
 */

import * as React from 'react';
import { Shield, ShieldAlert, ShieldX, ShieldOff } from 'lucide-react';
import { type SecurityLevel } from '@nasnet/core/types';
import { cn } from '@nasnet/ui/primitives';

export interface SecurityLevelBadgeProps {
  /** Security level to display */
  level: SecurityLevel;
  /** Optional CSS className */
  className?: string;
}

/**
 * Security Level Badge Component
 * - Shows security level with appropriate icon and color
 * - Color coding: Green (Strong), Yellow (Moderate), Red (Weak), Gray (None)
 * - Uses semantic status colors (success/warning/error/muted)
 */
export const SecurityLevelBadge = React.memo(function SecurityLevelBadge({
  level,
  className,
}: SecurityLevelBadgeProps) {
  // Determine badge styling based on security level
  const config = getSecurityLevelConfig(level);

  return (
    <div
      className={cn(
        'gap-component-sm px-component-sm py-component-xs inline-flex items-center rounded-[var(--semantic-radius-badge)] text-xs font-medium',
        config.className,
        className
      )}
      aria-label={`Security level: ${config.label}`}
    >
      <config.icon
        className="h-3.5 w-3.5"
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </div>
  );
});

SecurityLevelBadge.displayName = 'SecurityLevelBadge';

/**
 * Get configuration for security level badge
 * Uses semantic status colors: success (green), warning (amber), error (red), muted (gray)
 */
function getSecurityLevelConfig(level: SecurityLevel) {
  switch (level) {
    case 'strong':
      return {
        label: 'Strong',
        icon: Shield,
        className: 'bg-success/10 text-success',
      };
    case 'moderate':
      return {
        label: 'Moderate',
        icon: ShieldAlert,
        className: 'bg-warning/10 text-warning',
      };
    case 'weak':
      return {
        label: 'Weak',
        icon: ShieldX,
        className: 'bg-error/10 text-error',
      };
    case 'none':
      return {
        label: 'None',
        icon: ShieldOff,
        className: 'bg-muted text-muted-foreground',
      };
  }
}
