import React from 'react';

import { type LucideIcon, type LucideProps } from 'lucide-react';

import { cn } from '../lib/utils';

export interface IconProps extends Omit<LucideProps, 'ref'> {
  /** The lucide-react icon component to render */
  icon: LucideIcon;
  /** Size preset or custom size in pixels (mobile: 20-24px, desktop: 16-20px) */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Additional CSS classes (use semantic tokens: text-primary, text-success, text-error, text-warning, text-info, text-muted) */
  className?: string;
  /** Accessible label - if provided, sets aria-label; if omitted, sets aria-hidden="true" for decorative icons */
  label?: string;
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/**
 * Unified icon wrapper that ensures consistent sizing, accessibility,
 * and semantic token usage across the application.
 *
 * Platform-responsive sizing: mobile icons (20-24px) are slightly larger for touch targets,
 * desktop icons (16-20px) are smaller for dense layouts.
 *
 * Always use semantic color tokens (not hardcoded colors):
 * - `text-primary` for brand/emphasis
 * - `text-success` for online/connected/valid
 * - `text-error` for offline/failed/invalid
 * - `text-warning` for pending/degraded
 * - `text-info` for help/tips
 * - `text-muted` for inactive/secondary
 *
 * @example
 * ```tsx
 * // Decorative icon (hidden from screen readers)
 * <Icon icon={Wifi} size="md" />
 *
 * // Accessible icon with label
 * <Icon icon={Shield} size="lg" label="Security shield" />
 *
 * // Custom pixel size (for special cases)
 * <Icon icon={Router} size={32} />
 *
 * // With semantic color (CORRECT)
 * <Icon icon={CheckCircle} size="md" className="text-success" label="Connected" />
 *
 * // Mobile responsive (24px) vs desktop (20px)
 * // Use size="lg" for mobile touch targets, "md" for desktop
 * ```
 *
 * @see {@link https://design.nasnet.local/DESIGN_TOKENS.md} for complete token reference
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  function Icon(
    { icon: IconComponent, size = 'md', className, label, ...props },
    ref,
  ) {
    const pixelSize = typeof size === 'number' ? size : sizeMap[size];

    return (
      <IconComponent
        ref={ref}
        size={pixelSize}
        className={cn('shrink-0', className)}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        role={label ? 'img' : undefined}
        {...props}
      />
    );
  },
);

Icon.displayName = 'Icon';
