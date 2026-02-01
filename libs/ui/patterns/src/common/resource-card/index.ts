/**
 * ResourceCard Pattern
 *
 * Generic resource display with status indicator and actions.
 * Implements the Headless + Platform Presenters pattern (ADR-018).
 *
 * @example
 * ```tsx
 * import { ResourceCard } from '@nasnet/ui/patterns';
 *
 * <ResourceCard
 *   resource={{ id: '1', name: 'VPN', runtime: { status: 'online' } }}
 *   actions={[{ id: 'connect', label: 'Connect', onClick: () => {} }]}
 * />
 * ```
 */

// Main component (auto-detect)
export { ResourceCard } from './ResourceCard';

// Platform presenters
export { ResourceCardMobile } from './ResourceCard.Mobile';
export { ResourceCardDesktop } from './ResourceCard.Desktop';

// Headless hook
export { useResourceCard } from './useResourceCard';
export type { UseResourceCardReturn } from './useResourceCard';

// Types
export type {
  ResourceCardProps,
  BaseResource,
  ResourceAction,
  ResourceStatus,
} from './types';
