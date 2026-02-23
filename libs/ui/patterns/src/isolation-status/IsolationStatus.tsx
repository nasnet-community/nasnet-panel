/**
 * IsolationStatus Component
 *
 * Platform-aware wrapper for isolation status display.
 * Automatically selects Mobile or Desktop presenter based on viewport.
 *
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/isolation-status
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';

import { IsolationStatusDesktop } from './IsolationStatus.Desktop';
import { IsolationStatusMobile } from './IsolationStatus.Mobile';
import { useIsolationStatus } from './useIsolationStatus';

import type { IsolationStatusProps } from './types';

/**
 * IsolationStatus component with automatic platform detection.
 *
 * Displays isolation verification results for a service instance:
 * - Overall health status (healthy, warning, critical, unknown)
 * - List of isolation violations across 4 layers
 * - Resource limits (CPU, Memory, Disk, Network)
 * - Inline editing for resource limits (if allowed)
 *
 * **Platform Adaptation:**
 * - **Mobile (<640px):** Collapsible sections, 44px touch targets, vertical stack
 * - **Tablet (640-1024px):** Uses mobile presenter for consistency
 * - **Desktop (>1024px):** Data table, inline editing, dense layout
 *
 * @example
 * ```tsx
 * // Basic usage with isolation data
 * <IsolationStatus
 *   isolation={isolationData}
 *   instanceId="inst_123"
 *   routerId="router_456"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With editing enabled and health change callback
 * <IsolationStatus
 *   isolation={isolationData}
 *   instanceId="inst_123"
 *   routerId="router_456"
 *   allowEdit={true}
 *   onHealthChange={(health) => {
 *     console.log('Health changed:', health);
 *     if (health === 'critical') {
 *       showAlert('Critical isolation violations detected!');
 *     }
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // In ServiceDetailPage with Apollo Client hook
 * function ServiceDetailPage({ routerId, instanceId }) {
 *   const { data, loading, error } = useInstanceIsolation(routerId, instanceId);
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <div>
 *       <ServiceHeader />
 *       <VirtualInterfaceBridge {...bridgeProps} />
 *       <IsolationStatus
 *         isolation={data?.instanceIsolation}
 *         instanceId={instanceId}
 *         routerId={routerId}
 *         allowEdit={true}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
const IsolationStatus = memo(function IsolationStatusComponent(props: IsolationStatusProps) {
  const {
    variant = 'auto',
    size = 'md',
    className,
    id,
    ...config
  } = props;

  // Get computed state from headless hook
  const state = useIsolationStatus(config);

  // Detect platform or use forced variant
  const platform = usePlatform();
  const effectiveVariant = variant === 'auto' ? platform : variant;

  // Select presenter based on platform
  // Tablet uses mobile presenter for touch-optimized experience
  const presenterProps = { state, size, className, id };

  switch (effectiveVariant) {
    case 'mobile':
    case 'tablet':
      return <IsolationStatusMobile {...presenterProps} />;
    case 'desktop':
      return <IsolationStatusDesktop {...presenterProps} />;
    default:
      // Fallback to mobile for safety
      return <IsolationStatusMobile {...presenterProps} />;
  }
});

IsolationStatus.displayName = 'IsolationStatus';

// Named exports for direct access to presenters (testing, Storybook)
export { IsolationStatus };
export { IsolationStatusMobile } from './IsolationStatus.Mobile';
export { IsolationStatusDesktop } from './IsolationStatus.Desktop';
export { useIsolationStatus } from './useIsolationStatus';
export type * from './types';
