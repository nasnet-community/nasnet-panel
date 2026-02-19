import React from 'react';

import { type LucideIcon, type LucideProps } from 'lucide-react';

import { cn } from '../lib/utils';

export interface IconProps extends Omit<LucideProps, 'ref'> {
  /** The lucide-react icon component to render */
  icon: LucideIcon;
  /** Size preset or custom size in pixels */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label - if provided, sets aria-label; if omitted, sets aria-hidden="true" */
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
 */
export const Icon = React.memo(function Icon({
  icon: IconComponent,
  size = 'md',
  className,
  label,
  ...props
}: IconProps) {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <IconComponent
      size={pixelSize}
      className={cn('shrink-0', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      {...props}
    />
  );
});
