/**
 * ResourceCard Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <ResourceCard
 *   resource={{ id: '1', name: 'WireGuard VPN', runtime: { status: 'online' } }}
 *   actions={[
 *     { id: 'connect', label: 'Connect', onClick: () => {} },
 *     { id: 'configure', label: 'Configure', onClick: () => {} },
 *   ]}
 * />
 * ```
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { ResourceCardDesktop } from './ResourceCard.Desktop';
import { ResourceCardMobile } from './ResourceCard.Mobile';

import type { BaseResource, ResourceCardProps } from './types';

/**
 * ResourceCard - Generic resource display with status and actions
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Touch-optimized with large targets and full-width actions
 * - Tablet/Desktop (>=640px): Dense layout with hover states and dropdown menus
 *
 * @typeParam T - Resource type extending BaseResource
 */
function ResourceCardComponent<T extends BaseResource>(
  props: ResourceCardProps<T>
) {
  const platform = usePlatform();

  switch (platform) {
    case 'mobile':
      return <ResourceCardMobile {...props} />;
    case 'tablet':
    case 'desktop':
    default:
      return <ResourceCardDesktop {...props} />;
  }
}

// Wrap with memo for performance optimization
// Use type assertion to preserve generic type parameter
export const ResourceCard = memo(
  ResourceCardComponent
) as typeof ResourceCardComponent;

// Set display name for React DevTools
(ResourceCard as React.FC).displayName = 'ResourceCard';
