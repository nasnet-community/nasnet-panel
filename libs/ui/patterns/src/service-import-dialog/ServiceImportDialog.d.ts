/**
 * ServiceImportDialog - Entry point component
 * Routes to appropriate presenter based on platform detection
 */
import type { ServiceImportDialogProps } from './types';
/**
 * ServiceImportDialog - Platform-adaptive service import dialog
 *
 * Automatically renders the appropriate presenter based on screen size:
 * - Mobile (<640px): Full-screen sheet with 44px touch targets
 * - Tablet (640-1024px): Hybrid dialog with touch-friendly spacing
 * - Desktop (>1024px): Standard dialog with dense layout
 *
 * Multi-step wizard: select → validate → resolve → importing → complete
 *
 * @example
 * ```tsx
 * <ServiceImportDialog
 *   routerID="router-1"
 *   onImportComplete={(instanceID) => {
 *     toast.success(`Imported ${instanceID}`);
 *   }}
 * />
 * ```
 */
declare function ServiceImportDialogComponent(props: ServiceImportDialogProps): import("react/jsx-runtime").JSX.Element;
/**
 * ServiceImportDialog - Memoized component for performance
 */
export declare const ServiceImportDialog: import("react").MemoExoticComponent<typeof ServiceImportDialogComponent>;
export {};
//# sourceMappingURL=ServiceImportDialog.d.ts.map