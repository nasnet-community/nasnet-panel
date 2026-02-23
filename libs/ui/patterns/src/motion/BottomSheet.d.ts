/**
 * BottomSheet
 * Mobile-optimized bottom sheet with swipe-to-dismiss gesture.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */
import React, { type ReactNode } from 'react';
export interface BottomSheetProps {
    /** Whether the sheet is open */
    isOpen: boolean;
    /** Callback when the sheet should close */
    onClose: () => void;
    /** Sheet content */
    children: ReactNode;
    /** Additional CSS classes for the sheet */
    className?: string;
    /** Whether to show the backdrop */
    showBackdrop?: boolean;
    /** Whether to close on backdrop click */
    closeOnBackdropClick?: boolean;
    /** Swipe threshold to dismiss (in pixels) */
    swipeThreshold?: number;
    /** Velocity threshold to dismiss (in pixels/second) */
    velocityThreshold?: number;
    /** Snap points as percentages (e.g., [0.5, 1] for half and full) */
    snapPoints?: number[];
    /** Initial snap point index */
    initialSnapPoint?: number;
    /** Whether swipe to dismiss is enabled */
    swipeToDismiss?: boolean;
    /** Title for accessibility */
    'aria-label'?: string;
    /** Description ID for accessibility */
    'aria-describedby'?: string;
}
/**
 * BottomSheet
 *
 * A mobile-friendly bottom sheet that can be swiped to dismiss.
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Button onClick={() => setIsOpen(true)}>Open Sheet</Button>
 *
 * <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <div className="p-4">
 *     <h2>Sheet Content</h2>
 *     <p>Swipe down to dismiss</p>
 *   </div>
 * </BottomSheet>
 * ```
 */
export declare function BottomSheet({ isOpen, onClose, children, className, showBackdrop, closeOnBackdropClick, swipeThreshold, velocityThreshold, swipeToDismiss, 'aria-label': ariaLabel, 'aria-describedby': ariaDescribedBy, }: BottomSheetProps): import("react/jsx-runtime").JSX.Element;
export interface BottomSheetHeaderProps {
    children: ReactNode;
    className?: string;
}
/**
 * BottomSheetHeader
 *
 * Header section for BottomSheet with standard styling.
 */
export declare const BottomSheetHeader: React.NamedExoticComponent<BottomSheetHeaderProps>;
export interface BottomSheetContentProps {
    children: ReactNode;
    className?: string;
}
/**
 * BottomSheetContent
 *
 * Content section for BottomSheet with standard padding.
 */
export declare const BottomSheetContent: React.NamedExoticComponent<BottomSheetContentProps>;
export interface BottomSheetFooterProps {
    children: ReactNode;
    className?: string;
}
/**
 * BottomSheetFooter
 *
 * Footer section for BottomSheet, typically for actions.
 */
export declare const BottomSheetFooter: React.NamedExoticComponent<BottomSheetFooterProps>;
/**
 * useBottomSheet
 *
 * Hook for managing bottom sheet state.
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useBottomSheet();
 *
 * return (
 *   <>
 *     <Button onClick={open}>Open Sheet</Button>
 *     <BottomSheet isOpen={isOpen} onClose={close}>
 *       Content
 *     </BottomSheet>
 *   </>
 * );
 * ```
 */
export declare function useBottomSheet(initialOpen?: boolean): {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
//# sourceMappingURL=BottomSheet.d.ts.map