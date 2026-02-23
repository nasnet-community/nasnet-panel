/**
 * ServiceTemplateCard Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <ServiceTemplateCard
 *   template={{
 *     id: '1',
 *     name: 'Privacy Stack',
 *     category: 'privacy',
 *     scope: 'built-in',
 *     metadata: {
 *       serviceCount: 3,
 *       variableCount: 5,
 *       version: '1.0.0',
 *     },
 *   }}
 *   actions={[
 *     { id: 'install', label: 'Install', onClick: () => {} },
 *     { id: 'export', label: 'Export', onClick: () => {} },
 *   ]}
 * />
 * ```
 */
import type { ServiceTemplateCardProps } from './types';
/**
 * ServiceTemplateCard - Displays service template with scope, metadata, and actions
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Touch-optimized vertical layout with large targets
 * - Tablet (640-1024px): Touch-optimized vertical layout with large targets
 * - Desktop (≥1024px): Dense horizontal layout with hover states
 */
declare function ServiceTemplateCardComponent(props: ServiceTemplateCardProps): import("react/jsx-runtime").JSX.Element;
export declare const ServiceTemplateCard: import("react").MemoExoticComponent<typeof ServiceTemplateCardComponent>;
export {};
//# sourceMappingURL=ServiceTemplateCard.d.ts.map