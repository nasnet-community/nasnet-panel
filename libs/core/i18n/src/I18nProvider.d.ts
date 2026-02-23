/**
 * I18nProvider - React context provider for internationalization
 *
 * Wraps the application with i18next provider and handles:
 * - Language initialization
 * - Suspense boundary for lazy-loaded translations
 * - Language change events
 */
import { type ReactNode } from 'react';
/**
 * Props for the I18nProvider component
 *
 * @property children - React components to wrap with i18n support
 * @property loadingFallback - Optional UI to display while loading language packs
 */
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
 * Combines I18nextProvider with a Suspense boundary to manage async language loading.
 *
 * @param props - Configuration props
 * @returns React component that provides i18n context
 *
 * @example
 * ```tsx
 * // In main.tsx
 * <I18nProvider loadingFallback={<LoadingSpinner />}>
 *   <DirectionProvider>
 *     <App />
 *   </DirectionProvider>
 * </I18nProvider>
 * ```
 */
export declare function I18nProvider({ children, loadingFallback }: I18nProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=I18nProvider.d.ts.map