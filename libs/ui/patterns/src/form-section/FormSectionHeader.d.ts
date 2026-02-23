/**
 * FormSectionHeader Component
 *
 * Header component for FormSection with title, description, help icon, and collapse toggle.
 * Supports both collapsible and non-collapsible modes with proper accessibility.
 *
 * @module @nasnet/ui/patterns/form-section
 * @see NAS-4A.13: Build Form Section Component
 */
import type { FormSectionHeaderProps } from './form-section.types';
/**
 * FormSectionHeader renders the header area of a form section.
 *
 * Features:
 * - Title and optional description
 * - Collapsible toggle with animated chevron
 * - Error count badge
 * - Help icon with tooltip
 * - Full keyboard accessibility
 * - Mobile-friendly tap targets (44px minimum)
 *
 * @example
 * ```tsx
 * <FormSectionHeader
 *   title="Network Settings"
 *   description="Configure your network connection"
 *   isCollapsible={true}
 *   isExpanded={true}
 *   onToggle={() => setExpanded(!expanded)}
 *   errorCount={2}
 *   headingId="section-heading-network"
 *   contentId="section-content-network"
 *   reducedMotion={false}
 * />
 * ```
 */
export declare function FormSectionHeader({ title, description, isCollapsible, isExpanded, onToggle, helpId, errorCount, headingId, contentId, reducedMotion, }: FormSectionHeaderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FormSectionHeader.d.ts.map