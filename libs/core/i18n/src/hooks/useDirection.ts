/**
 * Text direction detection hook
 *
 * Provides locale-aware text direction (LTR or RTL) for proper
 * layout adjustments and text alignment based on current language.
 *
 * @module hooks/useDirection
 */

/**
 * Hook that returns the current text direction
 *
 * Detects the text direction (Left-to-Right or Right-to-Left) based
 * on the current locale and language settings. Essential for proper
 * layout mirroring in RTL languages (Arabic, Hebrew, Persian, etc.).
 *
 * @returns The current text direction ('ltr' or 'rtl')
 *
 * @example
 * ```tsx
 * function ContentLayout() {
 *   const direction = useDirection();
 *   return (
 *     <div style={{ direction, textAlign: direction === 'rtl' ? 'right' : 'left' }}>
 *       Content here
 *     </div>
 *   );
 * }
 * ```
 */
export { useDirection } from '../DirectionProvider';

/**
 * Type definition for text direction
 *
 * Represents valid text direction values for the application.
 * Used for layout and text alignment adjustments.
 */
export type { Direction } from '../DirectionProvider';
