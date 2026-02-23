import { type ClassValue } from 'clsx';
/**
 * Merge Tailwind CSS classes with intelligent deduplication.
 *
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 * Use this utility to safely merge Tailwind classes from props with base styles,
 * ensuring that later values override earlier ones (avoiding conflicting classes).
 *
 * CRITICAL: Always use semantic tokens (Tier 2), not primitive colors:
 * - Use `bg-primary`, `text-foreground` — NOT `bg-amber-500`, `text-gray-400`
 * - Use `text-error`, `bg-success` — NOT `text-red-500`, `bg-green-500`
 * - Use `border-border` — NOT `border-gray-200`
 *
 * @param inputs - CSS class strings, objects, or arrays to merge
 * @returns - Merged and deduplicated class string
 *
 * @example
 * ```tsx
 * // Basic usage with conditional classes
 * cn('px-2 py-1', isActive && 'bg-primary')
 * // Result: 'px-2 py-1 bg-primary'
 *
 * // Overriding defaults with props (later value wins)
 * cn('bg-primary text-foreground', className)
 * // If className='bg-secondary', result uses bg-secondary
 *
 * // Multiple conditions with semantic tokens
 * cn(
 *   'base-styles text-foreground',
 *   isDisabled && 'opacity-50 cursor-not-allowed',
 *   isActive && 'ring-2 ring-primary'
 * )
 * ```
 */
export declare function cn(...inputs: ClassValue[]): string;
//# sourceMappingURL=utils.d.ts.map