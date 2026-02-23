/**
 * TemplateCard Component
 *
 * Shared card component for displaying firewall templates.
 * Used by both Desktop and Mobile presenters.
 */
import type { FirewallTemplate } from './types';
export interface TemplateCardProps {
    /** Template to display */
    template: FirewallTemplate;
    /** Whether this card is selected */
    isSelected?: boolean;
    /** Click handler for the card */
    onClick?: () => void;
    /** Optional action button */
    onAction?: () => void;
    /** Action button label */
    actionLabel?: string;
    /** Container className */
    className?: string;
    /** Card variant (default or compact) */
    variant?: 'default' | 'compact';
}
/**
 * Template card for gallery display
 *
 * Features:
 * - Template name, description, category, and complexity
 * - Rule count indicator
 * - Built-in badge
 * - Selectable with visual feedback
 * - Optional action button
 * - Compact variant for mobile
 */
export declare function TemplateCard({ template, isSelected, onClick, onAction, actionLabel, className, variant, }: TemplateCardProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=TemplateCard.d.ts.map