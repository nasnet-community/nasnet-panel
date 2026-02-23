/**
 * ServiceExportDialog - Entry point component
 * Routes to appropriate presenter based on platform detection
 */
import type { ServiceExportDialogProps } from './types';
/**
 * ServiceExportDialog - Platform-adaptive service export dialog
 *
 * Automatically renders the appropriate presenter based on screen size:
 * - Mobile (<640px): Full-screen sheet with 44px touch targets
 * - Tablet (640-1024px): Hybrid dialog with touch-friendly spacing
 * - Desktop (>1024px): Standard dialog with dense layout
 *
 * @example
 * ```tsx
 * <ServiceExportDialog
 *   routerID="router-1"
 *   instance={serviceInstance}
 *   onExportComplete={(format, url) => {
 *     toast.success(`Exported as ${format}`);
 *   }}
 * />
 * ```
 */
declare function ServiceExportDialogComponent(props: ServiceExportDialogProps): import("react/jsx-runtime").JSX.Element;
/**
 * ServiceExportDialog - Memoized component for performance
 */
export declare const ServiceExportDialog: import("react").MemoExoticComponent<typeof ServiceExportDialogComponent>;
export {};
//# sourceMappingURL=ServiceExportDialog.d.ts.map