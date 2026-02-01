/**
 * I18nProvider - React context provider for internationalization
 *
 * Wraps the application with i18next provider and handles:
 * - Language initialization
 * - Suspense boundary for lazy-loaded translations
 * - Language change events
 */
import { Suspense, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

interface I18nProviderProps {
  children: ReactNode;
  /**
   * Fallback UI shown while loading language pack
   * @default null (renders nothing while loading)
   */
  loadingFallback?: ReactNode;
}

/**
 * I18nProvider wraps the application with internationalization support.
 *
 * Must be placed near the top of the component tree, typically in main.tsx.
 * Uses Suspense to handle lazy-loaded language packs.
 *
 * @example
 * ```tsx
 * <I18nProvider loadingFallback={<LoadingSpinner />}>
 *   <App />
 * </I18nProvider>
 * ```
 */
export function I18nProvider({ children, loadingFallback = null }: I18nProviderProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={loadingFallback}>{children}</Suspense>
    </I18nextProvider>
  );
}

export default I18nProvider;
