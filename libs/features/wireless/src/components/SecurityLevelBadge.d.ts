/**
 * SecurityLevelBadge Component
 * @description Displays a color-coded security level indicator with status icon and label.
 * Shows security strength (Strong/Moderate/Weak/None) with appropriate visual styling.
 * Implements FR0-16: View security profile settings with security level indicator
 */
import * as React from 'react';
import { type SecurityLevel } from '@nasnet/core/types';
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
export declare const SecurityLevelBadge: React.NamedExoticComponent<SecurityLevelBadgeProps>;
//# sourceMappingURL=SecurityLevelBadge.d.ts.map