/**
 * HelpIcon Component
 * Accessible trigger icon for contextual help
 *
 * Features:
 * - WCAG AAA compliant with 3px focus ring
 * - 44px minimum touch target on mobile
 * - Hover/focus states with semantic colors
 * - Size variants (sm, md, lg)
 *
 * @see NAS-4A.12: Build Help System Components
 */
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import type { HelpIconProps } from './help.types';
/**
 * Icon size variants with proper touch targets
 */
declare const helpIconVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export type HelpIconVariantProps = VariantProps<typeof helpIconVariants>;
/**
 * HelpIcon - Trigger icon for contextual help
 *
 * Renders a question mark icon that opens help content when clicked.
 * Follows WCAG AAA guidelines with proper focus indicators and touch targets.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <HelpIcon field="gateway" onClick={() => setOpen(true)} />
 *
 * // With custom size
 * <HelpIcon field="ip" size="lg" onClick={handleClick} />
 *
 * // With form label
 * <div className="flex items-center gap-1">
 *   <Label>Gateway</Label>
 *   <HelpIcon field="gateway" onClick={() => setHelpOpen(true)} />
 * </div>
 * ```
 */
export declare const HelpIcon: React.ForwardRefExoticComponent<HelpIconProps & React.RefAttributes<HTMLButtonElement>>;
export { helpIconVariants };
//# sourceMappingURL=help-icon.d.ts.map