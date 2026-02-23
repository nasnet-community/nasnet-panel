/**
 * RouteForm Pattern Component
 * NAS-6.5: Static Route Management
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern from ADR-018.
 *
 * @example
 * ```tsx
 * <RouteForm
 *   mode="create"
 *   routerId={routerId}
 *   interfaces={interfaces}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */
import type { RouteFormProps } from './types';
/**
 * RouteForm - Create or edit static routes
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Vertical layout with 44px touch targets
 * - Tablet/Desktop (>=640px): Card-based layout with side-by-side fields
 *
 * Features:
 * - Gateway reachability checking (debounced, non-blocking)
 * - Validation with Zod + React Hook Form
 * - Real-time form validation
 * - Warning display for unreachable gateways
 *
 * @description Headless + Platform Presenters pattern with mobile/desktop adaptive layouts
 */
declare function RouteFormComponent(props: RouteFormProps): import("react/jsx-runtime").JSX.Element;
declare namespace RouteFormComponent {
    var displayName: string;
}
export declare const RouteForm: import("react").MemoExoticComponent<typeof RouteFormComponent>;
export {};
//# sourceMappingURL=RouteForm.d.ts.map