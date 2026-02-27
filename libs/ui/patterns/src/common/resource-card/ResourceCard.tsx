/**
 * ResourceCard Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * Automatically selects the appropriate presenter based on viewport:
 * - Mobile (<640px): Touch-optimized with large targets and full-width actions
 * - Tablet (640-1024px): Hybrid layout with collapsible features
 * - Desktop (>1024px): Dense layout with hover states and dropdowns
 *
 * Supports generic resources extending BaseResource with type-safe properties.
 * Platform presenters are lazy-loaded for optimal code splitting.
 *
 * @typeParam T - Resource type extending BaseResource
 * @example
 * ```tsx
 * // Basic usage with auto platform detection
 * <ResourceCard
 *   resource={{ id: '1', name: 'WireGuard VPN', runtime: { status: 'online' } }}
 *   actions={[
 *     { id: 'connect', label: 'Connect', onClick: handleConnect },
 *     { id: 'configure', label: 'Configure', onClick: handleConfigure },
 *   ]}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With expanded state management
 * const [expanded, setExpanded] = useState(false);
 * <ResourceCard
 *   resource={vpnConfig}
 *   expanded={expanded}
 *   onToggle={() => setExpanded(!expanded)}
 *   showLivePulse
 * />
 * ```
 *
 * @see ADR-018: Headless + Platform Presenters
 * @see ResourceCardMobile, ResourceCardTablet, ResourceCardDesktop for platform-specific implementations
 */

import { memo, useMemo, lazy, Suspense, forwardRef } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { ResourceCardDesktop } from './ResourceCard.Desktop';
import { ResourceCardMobile } from './ResourceCard.Mobile';
import { ResourceCardSkeleton } from './ResourceCard.Skeleton';

import type { BaseResource, ResourceCardProps } from './types';

// Lazy load Tablet presenter for code splitting
const ResourceCardTablet = lazy(() =>
  import('./ResourceCard.Tablet').then((m) => ({
    default: m.ResourceCardTablet,
  }))
);

/**
 * ResourceCard - Generic resource display with status and actions
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Touch-optimized with large targets and full-width actions
 * - Tablet (640-1024px): Hybrid layout with collapsible features and balanced density
 * - Desktop (>1024px): Dense layout with hover states and dropdown menus
 *
 * Platform presenters are lazy-loaded for optimal bundle splitting.
 *
 * @typeParam T - Resource type extending BaseResource
 */
function ResourceCardComponent<T extends BaseResource>(props: ResourceCardProps<T>) {
  const platform = usePlatform();

  // Memoize presenter selection to prevent unnecessary re-renders
  const Presenter = useMemo(() => {
    switch (platform) {
      case 'mobile':
        return ResourceCardMobile;
      case 'tablet':
        return ResourceCardTablet;
      case 'desktop':
      default:
        return ResourceCardDesktop;
    }
  }, [platform]);

  // Lazy load Tablet presenter with Suspense fallback
  if (platform === 'tablet') {
    return (
      <Suspense fallback={<ResourceCardSkeleton />}>
        <Presenter {...props} />
      </Suspense>
    );
  }

  return <Presenter {...props} />;
}

// Wrap with memo for performance optimization
// Use type assertion to preserve generic type parameter
const ResourceCard = memo(ResourceCardComponent) as typeof ResourceCardComponent;

// Set display name for React DevTools
(ResourceCard as React.FC<any>).displayName = 'ResourceCard';

export { ResourceCard };
