/**
 * ResourceCard Pattern
 *
 * Generic resource display with status indicator and actions.
 * Implements the Headless + Platform Presenters pattern (ADR-018).
 *
 * Three platform presenters with automatic detection:
 * - Mobile (<640px): Touch-optimized with 44px targets
 * - Tablet (640-1024px): Hybrid layout with balanced density
 * - Desktop (>1024px): Dense with hover states and dropdowns
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
export { ResourceCard } from './ResourceCard';
export { ResourceCardMobile } from './ResourceCard.Mobile';
export { ResourceCardTablet } from './ResourceCard.Tablet';
export { ResourceCardDesktop } from './ResourceCard.Desktop';
export { ResourceCardSkeleton } from './ResourceCard.Skeleton';
export { useResourceCard } from './useResourceCard';
export type { UseResourceCardReturn } from './useResourceCard';
export type { ResourceCardProps, BaseResource, ResourceAction, ResourceStatus, } from './types';
//# sourceMappingURL=index.d.ts.map