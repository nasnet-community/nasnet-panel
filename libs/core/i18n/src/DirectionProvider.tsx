/**
 * DirectionProvider - Context provider for text direction (LTR/RTL)
 *
 * Automatically detects the current language and sets:
 * - dir attribute on document.documentElement
 * - lang attribute on document.documentElement
 * - Direction context for components that need to know direction
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { isRTLLanguage } from './i18n';

export type Direction = 'ltr' | 'rtl';

interface DirectionContextValue {
  direction: Direction;
  isRTL: boolean;
}

const DirectionContext = createContext<DirectionContextValue>({
  direction: 'ltr',
  isRTL: false,
});

interface DirectionProviderProps {
  children: ReactNode;
}

/**
 * DirectionProvider automatically manages document direction based on current language.
 *
 * Updates the HTML dir and lang attributes when language changes.
 * Provides direction context for components that need direction-aware rendering.
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
export function DirectionProvider({ children }: DirectionProviderProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = isRTLLanguage(currentLanguage);
  const direction: Direction = isRTL ? 'rtl' : 'ltr';

  // Update document attributes when language/direction changes
  useEffect(() => {
    const html = document.documentElement;
    html.dir = direction;
    html.lang = currentLanguage;

    // Also add a data attribute for CSS selectors if needed
    html.setAttribute('data-direction', direction);
  }, [direction, currentLanguage]);

  const value: DirectionContextValue = {
    direction,
    isRTL,
  };

  return <DirectionContext.Provider value={value}>{children}</DirectionContext.Provider>;
}

/**
 * Hook to access the current text direction.
 *
 * @returns Direction context with direction ('ltr' | 'rtl') and isRTL boolean
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
export function useDirection(): DirectionContextValue {
  const context = useContext(DirectionContext);
  if (!context) {
    throw new Error('useDirection must be used within a DirectionProvider');
  }
  return context;
}

export default DirectionProvider;
