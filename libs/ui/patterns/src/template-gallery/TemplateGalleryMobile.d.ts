/**
 * TemplateGalleryMobile Component
 *
 * Mobile presenter for firewall template gallery.
 * Uses vertical list with bottom sheet filters for touch-friendly interface.
 */
import * as React from 'react';
import type { FirewallTemplate } from './types';
import type { UseTemplateGalleryReturn } from './use-template-gallery';
export interface TemplateGalleryMobileProps {
    /** Template gallery hook return value */
    gallery: UseTemplateGalleryReturn;
    /** Callback when Apply button is clicked */
    onApplyTemplate?: (template: FirewallTemplate) => void;
    /** Loading state */
    loading?: boolean;
    /** Container className */
    className?: string;
}
/**
 * Mobile presenter for TemplateGallery
 *
 * Features:
 * - Vertical list layout with 44px minimum touch targets
 * - Bottom sheet for filters
 * - Compact template cards
 * - Sort tabs in header
 * - Apply button on each card
 * - Empty state when no templates match
 */
declare function TemplateGalleryMobileComponent({ gallery, onApplyTemplate, loading, className, }: TemplateGalleryMobileProps): import("react/jsx-runtime").JSX.Element;
export declare const TemplateGalleryMobile: React.MemoExoticComponent<typeof TemplateGalleryMobileComponent>;
export {};
//# sourceMappingURL=TemplateGalleryMobile.d.ts.map