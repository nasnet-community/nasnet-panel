/**
 * IPAddressForm Pattern Component
 * NAS-6.2: IP Address Management
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Implements the Headless + Platform Presenters pattern (section 1.2 of checklist).
 *
 * @example
 * ```tsx
 * <IPAddressForm
 *   mode="create"
 *   routerId={routerId}
 *   interfaces={interfaces}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * ```
 */
import type { IPAddressFormProps } from './types';
/**
 * IPAddressForm - Create or edit IP addresses
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Sheet-based form with 44px touch targets, progressive disclosure
 * - Tablet/Desktop (>=640px): Dialog-based form with compact layout, all details visible
 *
 * Features:
 * - CIDR notation input with automatic subnet calculation
 * - Conflict detection for overlapping IP assignments
 * - Interface selection with type indicators
 * - Validation feedback before submission
 * - 44px touch targets on mobile (section 2.1 of checklist)
 */
declare function IPAddressFormComponent(props: IPAddressFormProps): import("react/jsx-runtime").JSX.Element;
export declare const IPAddressForm: import("react").MemoExoticComponent<typeof IPAddressFormComponent>;
export {};
//# sourceMappingURL=IPAddressForm.d.ts.map