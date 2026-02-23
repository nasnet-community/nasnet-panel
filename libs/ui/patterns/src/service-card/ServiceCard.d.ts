/**
 * ServiceCard Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <ServiceCard
 *   service={{
 *     id: '1',
 *     name: 'Tor Proxy',
 *     category: 'privacy',
 *     status: 'running',
 *     metrics: { cpu: 5.2, memory: 128 }
 *   }}
 *   actions={[
 *     { id: 'stop', label: 'Stop', onClick: () => {} },
 *     { id: 'configure', label: 'Configure', onClick: () => {} },
 *   ]}
 * />
 * ```
 */
import type { ServiceCardProps } from './types';
/**
 * ServiceCard - Displays downloadable network service with status and actions
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Touch-optimized with large targets and full-width actions
 * - Tablet/Desktop (≥640px): Dense layout with hover states and dropdown menus
 */
declare function ServiceCardComponent(props: ServiceCardProps): import("react/jsx-runtime").JSX.Element;
export declare const ServiceCard: import("react").MemoExoticComponent<typeof ServiceCardComponent>;
export {};
//# sourceMappingURL=ServiceCard.d.ts.map