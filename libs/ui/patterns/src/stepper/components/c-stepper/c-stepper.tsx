/**
 * CStepper - Content Stepper (Desktop with Preview)
 *
 * Three-column desktop wizard layout with:
 * - Left (280px): Vertical stepper sidebar showing all steps
 * - Center (flexible): Step content area with forms
 * - Right (320px): Collapsible live preview panel
 *
 * This component follows the Headless + Platform Presenter pattern (ADR-018):
 * - All logic comes from the useStepper hook
 * - This presenter provides desktop-optimized three-column rendering
 *
 * @see NAS-4A.17: Build Content Stepper (Desktop with Preview)
 * @see ADR-017: Three-Layer Component Architecture
 * @see ADR-018: Headless + Platform Presenters
 *
 * @example
 * ```tsx
 * const stepper = useStepper({
 *   steps: [
 *     { id: 'wan', title: 'WAN Configuration', validate: validateWan },
 *     { id: 'lan', title: 'LAN Setup', validate: validateLan },
 *     { id: 'review', title: 'Review' },
 *   ],
 *   onComplete: handleComplete,
 * });
 *
 * return (
 *   <CStepper
 *     stepper={stepper}
 *     stepContent={<StepContent step={stepper.currentStep.id} />}
 *     previewContent={
 *       <div className="space-y-4">
 *         <ConfigPreview script={previewScript} />
 *         <NetworkTopologySVG config={networkConfig} />
 *       </div>
 *     }
 *   />
 * );
 * ```
 */

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';

import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Loader2, Eye } from 'lucide-react';

import { cn, Button } from '@nasnet/ui/primitives';

import { VStepper } from '../v-stepper';
import { CStepperPreview } from './c-stepper-preview';

import type {
  CStepperProps,
  StepperNavigationProps,
  PreviewToggleButtonProps,
} from './c-stepper.types';

// ===== Constants =====

const BREAKPOINT_AUTO_COLLAPSE = 1280;
const DEFAULT_SIDEBAR_WIDTH = 280;
const DEFAULT_PREVIEW_WIDTH = 320;

// ===== Internal Components =====

/**
 * Navigation buttons for the content area
 */
function StepperNavigation({
  stepper,
  labels = {},
  className,
}: StepperNavigationProps) {
  const { prev, next, isFirst, isLast, isValidating } = stepper;

  const previousLabel = labels.previous ?? 'Previous';
  const nextLabel = labels.next ?? 'Next';
  const completeLabel = labels.complete ?? 'Complete';

  return (
    <div
      className={cn(
        'flex justify-between pt-4 border-t border-border mt-6',
        // RTL support - flex-row-reverse handled by dir attribute
        className
      )}
    >
      <Button
        variant="outline"
        onClick={prev}
        disabled={isFirst}
        aria-label={previousLabel}
      >
        <ChevronLeft
          className="mr-2 h-4 w-4 rtl:mr-0 rtl:ml-2 rtl:rotate-180"
          aria-hidden="true"
        />
        <span>{previousLabel}</span>
      </Button>

      <Button
        onClick={() => next()}
        disabled={isValidating}
        aria-label={isLast ? completeLabel : nextLabel}
        aria-busy={isValidating}
      >
        {isValidating ? (
          <>
            <Loader2
              className="mr-2 h-4 w-4 animate-spin"
              aria-hidden="true"
            />
            <span>Validating...</span>
          </>
        ) : isLast ? (
          <>
            <Check className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>{completeLabel}</span>
          </>
        ) : (
          <>
            <span>{nextLabel}</span>
            <ChevronRight
              className="ml-2 h-4 w-4 rtl:ml-0 rtl:mr-2 rtl:rotate-180"
              aria-hidden="true"
            />
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * Floating button to show preview panel when collapsed
 */
function PreviewToggleButton({
  onClick,
  className,
  label = 'Preview',
}: PreviewToggleButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        'fixed top-1/2 -translate-y-1/2 z-10 shadow-md',
        // Position on right edge (flips to left in RTL)
        'right-4 rtl:right-auto rtl:left-4',
        className
      )}
      onClick={onClick}
      aria-label={`Show ${label.toLowerCase()} panel`}
    >
      <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  );
}

// ===== Main Component =====

/**
 * Content Stepper component - Desktop three-column wizard layout
 *
 * @param props - CStepper props
 * @returns CStepper element
 */
export const CStepper = React.forwardRef<HTMLDivElement, CStepperProps>(
  function CStepper(
    {
      stepper,
      stepContent,
      previewContent,
      className,
      previewTitle = 'Preview',
      defaultShowPreview = true,
      'aria-label': ariaLabel = 'Configuration wizard',
      onPreviewToggle,
      sidebarWidth = DEFAULT_SIDEBAR_WIDTH,
      previewWidth = DEFAULT_PREVIEW_WIDTH,
      showStepDescriptions = true,
      customNavigation,
      navigationLabels,
    },
    ref
  ) {
    // Preview panel visibility state
    const [showPreview, setShowPreview] = useState(defaultShowPreview);
    const [autoCollapsed, setAutoCollapsed] = useState(false);

    // Calculate width styles
    const sidebarWidthStyle =
      typeof sidebarWidth === 'number' ? `${sidebarWidth}px` : sidebarWidth;
    const previewWidthValue =
      typeof previewWidth === 'number' ? previewWidth : DEFAULT_PREVIEW_WIDTH;

    // Handle preview visibility toggle
    const handleTogglePreview = useCallback(
      (visible: boolean) => {
        setShowPreview(visible);
        setAutoCollapsed(false);
        onPreviewToggle?.(visible);
      },
      [onPreviewToggle]
    );

    // Auto-collapse preview panel on narrow desktops (< 1280px)
    useEffect(() => {
      const handleResize = () => {
        const width = window.innerWidth;
        if (width < BREAKPOINT_AUTO_COLLAPSE && showPreview && !autoCollapsed) {
          setShowPreview(false);
          setAutoCollapsed(true);
          onPreviewToggle?.(false);
        }
      };

      // Check on mount
      handleResize();

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [showPreview, autoCollapsed, onPreviewToggle]);

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Alt+P: Toggle preview
        if (event.altKey && event.key.toLowerCase() === 'p') {
          event.preventDefault();
          handleTogglePreview(!showPreview);
        }

        // Alt+N: Next step
        if (event.altKey && event.key.toLowerCase() === 'n') {
          event.preventDefault();
          stepper.next();
        }

        // Alt+B: Previous step (Back)
        if (event.altKey && event.key.toLowerCase() === 'b') {
          event.preventDefault();
          stepper.prev();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPreview, handleTogglePreview, stepper]);

    // Focus management for error handling (AC10)
    const handleNavigationError = useCallback(() => {
      // If there are errors, focus the first error field
      const errorKeys = Object.keys(stepper.errors);
      if (errorKeys.length > 0) {
        const firstErrorField = document.querySelector(
          `[name="${errorKeys[0]}"], [id="${errorKeys[0]}"]`
        ) as HTMLElement;
        if (firstErrorField) {
          firstErrorField.focus();
        }
      }
    }, [stepper.errors]);

    // Watch for validation errors and manage focus
    useEffect(() => {
      if (Object.keys(stepper.errors).length > 0) {
        handleNavigationError();
      }
    }, [stepper.errors, handleNavigationError]);

    return (
      <div
        ref={ref}
        className={cn(
          'flex h-full w-full',
          // RTL support - flex-row-reverse handled by dir attribute
          className
        )}
        // Note: Not using role="region" to avoid nesting landmarks (main, aside)
        // which violates WCAG landmark-main-is-top-level and landmark-complementary-is-top-level
        aria-label={ariaLabel}
      >
        {/* Left: Vertical Stepper Sidebar */}
        <VStepper
          stepper={stepper}
          width={sidebarWidthStyle}
          showDescriptions={showStepDescriptions}
          className="shrink-0 border-r border-border bg-muted/30 rtl:border-r-0 rtl:border-l"
          aria-label="Wizard steps navigation"
        />

        {/* Center: Step Content Area */}
        <main className="flex-1 overflow-y-auto" role="main">
          <div className="h-full p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Step content */}
              <div aria-live="polite" aria-atomic="true">
                {stepContent}
              </div>

              {/* Navigation buttons */}
              {customNavigation ?? (
                <StepperNavigation stepper={stepper} labels={navigationLabels} />
              )}
            </div>
          </div>
        </main>

        {/* Right: Preview Panel (collapsible) */}
        <AnimatePresence mode="wait">
          {showPreview && previewContent && (
            <CStepperPreview
              title={previewTitle}
              onClose={() => handleTogglePreview(false)}
              width={previewWidthValue}
            >
              {previewContent}
            </CStepperPreview>
          )}
        </AnimatePresence>

        {/* Floating toggle button when preview is collapsed */}
        {!showPreview && previewContent && (
          <PreviewToggleButton
            onClick={() => handleTogglePreview(true)}
            label={previewTitle}
          />
        )}
      </div>
    );
  }
);

CStepper.displayName = 'CStepper';
