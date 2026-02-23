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
import type { BaseResource, ResourceCardProps } from './types';
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
declare function ResourceCardComponent<T extends BaseResource>(props: ResourceCardProps<T>): import("react/jsx-runtime").JSX.Element;
declare const ResourceCard: typeof ResourceCardComponent;
export { ResourceCard };
//# sourceMappingURL=ResourceCard.d.ts.map