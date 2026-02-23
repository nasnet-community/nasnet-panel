/**
 * DirectionProvider - Context provider for text direction (LTR/RTL)
 *
 * Automatically detects the current language and sets:
 * - dir attribute on document.documentElement
 * - lang attribute on document.documentElement
 * - Direction context for components that need to know direction
 */
import { type ReactNode } from 'react';
/**
 * Text direction type
 * - 'ltr': Left-to-right (default, most languages)
 * - 'rtl': Right-to-left (Arabic, Persian, Hebrew, etc.)
 */
export type Direction = 'ltr' | 'rtl';
/**
 * Context value for direction provider
 *
 * @property direction - Current text direction ('ltr' or 'rtl')
 * @property isRTL - Convenience boolean flag for RTL detection
 */
interface DirectionContextValue {
    direction: Direction;
    isRTL: boolean;
}
/**
 * Props for the DirectionProvider component
 *
 * @property children - React components to wrap with direction support
 */
interface DirectionProviderProps {
    children: ReactNode;
}
/**
 * DirectionProvider automatically manages document direction based on current language.
 *
 * Updates the HTML dir and lang attributes when language changes.
 * Provides direction context for components that need direction-aware rendering.
 * Must be placed after I18nProvider in the component tree.
 *
 * @param props - Configuration props
 * @returns React component that provides direction context
 *
 * @example
 * ```tsx
 * <I18nProvider>
 *   <DirectionProvider>
 *     <App />
 *   </DirectionProvider>
 * </I18nProvider>
 * ```
 */
export declare function DirectionProvider({ children }: DirectionProviderProps): import("react/jsx-runtime").JSX.Element;
/**
 * Hook to access the current text direction.
 *
 * Provides the current text direction and RTL flag based on the active language.
 * Must be used within a DirectionProvider.
 *
 * @returns Direction context with direction ('ltr' | 'rtl') and isRTL boolean
 * @throws Error if used outside of DirectionProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { direction, isRTL } = useDirection();
 *
 *   return (
 *     <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useDirection(): DirectionContextValue;
export {};
//# sourceMappingURL=DirectionProvider.d.ts.map