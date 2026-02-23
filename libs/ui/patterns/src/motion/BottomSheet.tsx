/**
 * BottomSheet
 * Mobile-optimized bottom sheet with swipe-to-dismiss gesture.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */

import React, {
  type ReactNode,
  useCallback,
  useRef,
  useEffect,
  useState,
} from 'react';

import {
  motion,
  AnimatePresence,
  useDragControls,
  type PanInfo,
} from 'framer-motion';

import { cn } from '@nasnet/ui/primitives';

import { useAnimationOptional } from './AnimationProvider';
import { bottomSheet, backdrop, reducedMotionFade } from './presets';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// BottomSheet Component
// ============================================================================

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
export function BottomSheet({
  isOpen,
  onClose,
  children,
  className,
  showBackdrop = true,
  closeOnBackdropClick = true,
  swipeThreshold = 100,
  velocityThreshold = 500,
  swipeToDismiss = true,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: BottomSheetProps) {
  const animation = useAnimationOptional();
  const reducedMotion = animation?.reducedMotion ?? false;
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle drag end to determine if we should dismiss
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!swipeToDismiss) return;

      const shouldDismiss =
        info.offset.y > swipeThreshold || info.velocity.y > velocityThreshold;

      if (shouldDismiss) {
        onClose();
      }
    },
    [onClose, swipeThreshold, velocityThreshold, swipeToDismiss]
  );

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdropClick) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;

    const sheet = sheetRef.current;
    const focusableElements = sheet.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    // Focus first element on open
    firstElement?.focus();

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Get variants based on reduced motion
  const sheetVariants = reducedMotion ? reducedMotionFade : bottomSheet;
  const backdropVariants = reducedMotion ? reducedMotionFade : backdrop;

  return (
    <AnimatePresence mode="popLayout">
      {isOpen && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              key="bottom-sheet-backdrop"
              variants={backdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={handleBackdropClick}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
            />
          )}

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            key="bottom-sheet-content"
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            variants={sheetVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            drag={swipeToDismiss && !reducedMotion ? 'y' : false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50',
              'max-h-[90vh] overflow-hidden',
              'rounded-t-2xl bg-background shadow-lg',
              'touch-pan-y',
              className
            )}
            style={{
              willChange: 'transform',
            }}
          >
            {/* Drag Handle */}
            {swipeToDismiss && (
              <div className="flex justify-center p-2">
                <div
                  role="separator"
                  aria-label="Drag handle. Swipe down to dismiss."
                  className="h-1.5 w-12 rounded-full bg-muted-foreground/30"
                  onPointerDown={(e) => dragControls.start(e)}
                />
              </div>
            )}

            {/* Content */}
            <div className="overflow-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// BottomSheetHeader Component
// ============================================================================

export interface BottomSheetHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * BottomSheetHeader
 *
 * Header section for BottomSheet with standard styling.
 */
export const BottomSheetHeader = React.memo(function BottomSheetHeader({
  children,
  className,
}: BottomSheetHeaderProps) {
  return (
    <div
      className={cn(
        'border-b px-4 py-3',
        'text-lg font-semibold',
        className
      )}
    >
      {children}
    </div>
  );
});

BottomSheetHeader.displayName = 'BottomSheetHeader';

// ============================================================================
// BottomSheetContent Component
// ============================================================================

export interface BottomSheetContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * BottomSheetContent
 *
 * Content section for BottomSheet with standard padding.
 */
export const BottomSheetContent = React.memo(function BottomSheetContent({
  children,
  className,
}: BottomSheetContentProps) {
  return <div className={cn('p-4', className)}>{children}</div>;
});

BottomSheetContent.displayName = 'BottomSheetContent';

// ============================================================================
// BottomSheetFooter Component
// ============================================================================

export interface BottomSheetFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * BottomSheetFooter
 *
 * Footer section for BottomSheet, typically for actions.
 */
export const BottomSheetFooter = React.memo(function BottomSheetFooter({
  children,
  className,
}: BottomSheetFooterProps) {
  return (
    <div
      className={cn(
        'border-t px-4 py-3',
        'flex items-center justify-end gap-2',
        className
      )}
    >
      {children}
    </div>
  );
});

BottomSheetFooter.displayName = 'BottomSheetFooter';

// ============================================================================
// useBottomSheet Hook
// ============================================================================

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
export function useBottomSheet(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}
