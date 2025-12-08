/**
 * SecurityLevelBadge Component
 * Displays a color-coded security level indicator
 * Implements FR0-16: View security profile settings with security level indicator
 */

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
 */
export function SecurityLevelBadge({
  level,
  className,
}: SecurityLevelBadgeProps) {
  // Determine badge styling based on security level
  const config = getSecurityLevelConfig(level);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
      aria-label={`Security level: ${config.label}`}
    >
      <config.icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </div>
  );
}

/**
 * Get configuration for security level badge
 */
function getSecurityLevelConfig(level: SecurityLevel) {
  switch (level) {
    case 'strong':
      return {
        label: 'Strong',
        icon: Shield,
        className:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      };
    case 'moderate':
      return {
        label: 'Moderate',
        icon: ShieldAlert,
        className:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      };
    case 'weak':
      return {
        label: 'Weak',
        icon: ShieldX,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      };
    case 'none':
      return {
        label: 'None',
        icon: ShieldOff,
        className:
          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
      };
  }
}
