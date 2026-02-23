/**
 * UpdateIndicatorDesktop Component
 * Desktop presenter for update indicator (NAS-8.7)
 * Platform: Desktop (>1024px)
 */
import * as React from 'react';
import type { UpdateIndicatorProps } from './types';
/**
 * UpdateIndicatorDesktop
 *
 * Desktop presenter for UpdateIndicator pattern.
 * Features:
 * - Inline badge display
 * - Side panel popover for details
 * - Keyboard shortcuts (Ctrl+U to update)
 * - Tooltips for additional context
 *
 * @example
 * ```tsx
 * <UpdateIndicatorDesktop
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
export declare const UpdateIndicatorDesktop: React.NamedExoticComponent<UpdateIndicatorProps>;
//# sourceMappingURL=UpdateIndicatorDesktop.d.ts.map