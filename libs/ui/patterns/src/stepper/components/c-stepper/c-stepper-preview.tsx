/**
 * CStepperPreview - Preview Panel Component
 *
 * Collapsible right panel for displaying live preview content:
 * - RouterOS script with syntax highlighting
 * - Network topology diagrams
 * - Configuration diffs
 *
 * @see NAS-4A.17: Build Content Stepper (Desktop with Preview)
 * @see AC2: Live Preview Updates
 * @see AC3: Preview Panel Collapsibility
 * @see AC7: Preview Content Types
 */

import * as React from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import { cn, Button, useReducedMotion } from '@nasnet/ui/primitives';

import type { CStepperPreviewProps } from './c-stepper.types';

// ===== Animation Variants =====

const previewVariants = {
  hidden: {
    width: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
  visible: {
    width: 'auto',
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
};

const previewVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// ===== Component =====

/**
 * Preview panel component for the Content Stepper
 *
 * @param props - CStepperPreview props
 * @returns Preview panel element
 *
 * @example
 * ```tsx
 * <CStepperPreview
 *   title="Configuration Preview"
 *   onClose={() => setShowPreview(false)}
 * >
 *   <ConfigPreview script={routerOSScript} />
 *   <NetworkTopologySVG config={networkConfig} />
 * </CStepperPreview>
 * ```
 */
export const CStepperPreview = React.forwardRef<
  HTMLDivElement,
  CStepperPreviewProps
>(function CStepperPreview(
  { children, title = 'Preview', onClose, className, width = 320 },
  ref
) {
  const prefersReducedMotion = useReducedMotion();

  // Calculate width style
  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  return (
    <motion.aside
      ref={ref}
      className={cn(
        'shrink-0 border-l border-border bg-background overflow-hidden',
        // RTL support - border flips automatically with dir attribute
        'rtl:border-l-0 rtl:border-r',
        className
      )}
      style={{ width: widthStyle }}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={prefersReducedMotion ? previewVariantsReduced : previewVariants}
      role="complementary"
      aria-label={`${title} panel`}
    >
      <div
        className="flex flex-col h-full"
        style={{ width: widthStyle, minWidth: widthStyle }}
      >
        {/* Header - sticky at top */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label={`Close ${title.toLowerCase()} panel`}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="preview-content"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
});

CStepperPreview.displayName = 'CStepperPreview';
