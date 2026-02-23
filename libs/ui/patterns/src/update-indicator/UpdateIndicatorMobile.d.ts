/**
 * UpdateIndicatorMobile Component
 * Mobile presenter for update indicator (NAS-8.7)
 * Platform: Mobile (<640px)
 */
import * as React from 'react';
import type { UpdateIndicatorProps } from './types';
/**
 * UpdateIndicatorMobile
 *
 * Mobile presenter for UpdateIndicator pattern.
 * Features:
 * - 44px touch targets
 * - Bottom sheet for details
 * - Amber/red badges for severity
 * - Stack layout for readability
 *
 * @example
 * ```tsx
 * <UpdateIndicatorMobile
 *   instanceId="tor-1"
 *   instanceName="Tor Proxy"
 *   currentVersion="1.0.0"
 *   latestVersion="1.1.0"
 *   updateAvailable={true}
 *   severity="SECURITY"
 *   onUpdate={(id) => triggerUpdate(id)}
 * />
 * ```
 */
export declare const UpdateIndicatorMobile: React.NamedExoticComponent<UpdateIndicatorProps>;
//# sourceMappingURL=UpdateIndicatorMobile.d.ts.map