/**
 * FormSection Component
 *
 * A consistent form section wrapper that provides uniform structure,
 * validation display, and collapsibility across all forms.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */

import * as React from 'react';
import { useId } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { cn, useReducedMotion } from '@nasnet/ui/primitives';

import { FormSectionErrors } from './FormSectionErrors';
import { FormSectionHeader } from './FormSectionHeader';
import { useFormSection, slugify } from './useFormSection';
import { getCollapseVariants } from '../common/motion-presets';

import type { FormSectionProps } from './form-section.types';

/**
 * FormSection provides consistent structure for form sections.
 *
 * Features:
 * - Section title with optional help integration
 * - Error summary display at section level
 * - Collapsible behavior with smooth animations
 * - State persistence via localStorage
 * - Platform-responsive design (mobile/desktop)
 * - Full WCAG AAA accessibility compliance
 *
 * Semantic HTML:
 * - Non-collapsible sections use `<fieldset>` with `<legend>` for form context
 * - Collapsible sections use `<section>` with `aria-labelledby` for proper accessibility
 *
 * @example
 * ```tsx
 * // Basic non-collapsible section
 * <FormSection title="Network Settings" description="Configure your network">
 *   <FormField name="ipAddress" />
 *   <FormField name="subnet" />
 * </FormSection>
 *
 * // Collapsible section with errors
 * <FormSection
 *   title="Advanced Options"
 *   collapsible
 *   defaultOpen={false}
 *   errors={['MTU must be between 68 and 65535']}
 * >
 *   <FormField name="mtu" />
 * </FormSection>
 * ```
 */
export function FormSection({
  title,
  description,
  collapsible = false,
  defaultOpen = true,
  children,
  errors = [],
  storageKey,
  helpId,
  className,
  asFieldset,
}: FormSectionProps) {
  // Generate unique IDs for accessibility
  const baseId = useId();
  const headingId = `section-heading-${baseId}`;
  const contentId = `section-content-${baseId}`;

  // Determine storage key (use provided or generate from title)
  const key = storageKey || slugify(title);

  // Get collapse state from hook
  const { isExpanded, toggle } = useFormSection({
    storageKey: key,
    defaultOpen,
    collapsible,
  });

  // Respect user's reduced motion preference
  const reducedMotion = useReducedMotion();

  // Get animation variants based on reduced motion preference
  const collapseVariants = getCollapseVariants(reducedMotion);

  // Determine semantic wrapper based on collapsible state and asFieldset prop
  // Default: non-collapsible uses fieldset, collapsible uses section
  const useFieldset = asFieldset ?? !collapsible;

  // Wrapper component
  const Wrapper = useFieldset ? 'fieldset' : 'section';

  // Content to render
  const content = (
    <>
      {/* Error summary */}
      <FormSectionErrors errors={errors} className="mb-4" />

      {/* Form fields (children) */}
      <div className="space-y-4">{children}</div>
    </>
  );

  return (
    <Wrapper
      className={cn(
        'border border-border',
        'rounded-card-sm md:rounded-card-lg',
        'overflow-hidden',
        className
      )}
      aria-labelledby={collapsible ? headingId : undefined}
    >
      {/* Hidden legend for fieldset accessibility */}
      {useFieldset && (
        <legend className="sr-only">{title}</legend>
      )}

      {/* Visual header */}
      <FormSectionHeader
        title={title}
        description={description}
        isCollapsible={collapsible}
        isExpanded={isExpanded}
        onToggle={toggle}
        helpId={helpId}
        errorCount={errors.length}
        headingId={headingId}
        contentId={contentId}
        reducedMotion={reducedMotion}
      />

      {/* Content area - animated for collapsible, static otherwise */}
      {collapsible ? (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              id={contentId}
              variants={collapseVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="overflow-hidden"
            >
              <div className="p-4 border-t border-border">
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div
          id={contentId}
          className="p-4 border-t border-border"
        >
          {content}
        </div>
      )}
    </Wrapper>
  );
}
