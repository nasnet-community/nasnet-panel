/**
 * @nasnet/ui/utils - UI Utility Functions
 *
 * Centralized exports for commonly-used UI utilities across NasNetConnect.
 *
 * **cn() - Class Name Merger**
 * Combines conditional Tailwind CSS classes with intelligent deduplication.
 * - Uses `clsx` for conditional class composition
 * - Uses `tailwind-merge` to resolve conflicting Tailwind utilities
 * - Later values override earlier ones (predictable precedence)
 * - Handles arrays, objects, and string inputs
 *
 * This utility is re-exported from `@nasnet/ui/primitives` for convenience
 * and is the primary way to merge Tailwind classes in NasNetConnect components.
 *
 * @see Docs/design/ux-design/1-design-system-foundation.md
 *
 * @example
 * ```tsx
 * import { cn } from '@nasnet/ui/utils';
 *
 * // Basic conditional classes
 * cn('px-2 py-1', isActive && 'bg-blue-500');
 *
 * // Override defaults with props
 * cn('bg-primary text-white', className);
 * // If className='bg-secondary', result uses bg-secondary (no conflict)
 *
 * // Multiple conditions and arrays
 * cn(
 *   'base-styles',
 *   isDisabled && 'opacity-50 cursor-not-allowed',
 *   isActive && 'ring-2 ring-primary',
 *   dynamicClasses
 * );
 * ```
 */

export { cn } from '@nasnet/ui/primitives';
