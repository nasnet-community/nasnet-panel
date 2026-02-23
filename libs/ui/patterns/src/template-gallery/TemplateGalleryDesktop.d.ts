/**
 * TemplateGalleryDesktop Component
 *
 * Desktop presenter for firewall template gallery.
 * Uses grid layout with sidebar filters for efficient browsing.
 */
import type { FirewallTemplate } from './types';
import type { UseTemplateGalleryReturn } from './use-template-gallery';
export interface TemplateGalleryDesktopProps {
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
 * Desktop presenter for TemplateGallery
 *
 * Features:
 * - Sidebar with filters (category, complexity, type, search)
 * - Grid layout for templates (3 columns)
 * - Sort controls in header
 * - Apply button on each card
 * - Empty state when no templates match
 */
declare function TemplateGalleryDesktopComponent({ gallery, onApplyTemplate, loading, className, }: TemplateGalleryDesktopProps): import("react/jsx-runtime").JSX.Element;
export declare const TemplateGalleryDesktop: import("react").MemoExoticComponent<typeof TemplateGalleryDesktopComponent>;
export {};
//# sourceMappingURL=TemplateGalleryDesktop.d.ts.map