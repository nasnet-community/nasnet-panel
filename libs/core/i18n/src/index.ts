/**
 * @nasnet/core/i18n - Internationalization library for NasNetConnect
 *
 * Provides:
 * - i18next configuration with lazy loading
 * - React providers for i18n and RTL support
 * - Typed hooks for translations and formatting
 * - English and Persian (RTL) language packs
 *
 * @example
 * ```tsx
 * // In main.tsx
 * import { I18nProvider, DirectionProvider } from '@nasnet/core/i18n';
 *
 * <I18nProvider loadingFallback={<LoadingSpinner />}>
 *   <DirectionProvider>
 *     <App />
 *   </DirectionProvider>
 * </I18nProvider>
 * ```
 *
 * @example
 * ```tsx
 * // In components
 * import { useTranslation, useFormatters, useDirection } from '@nasnet/core/i18n';
 *
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   const { formatDate, formatBytes } = useFormatters();
 *   const { isRTL } = useDirection();
 *
 *   return <h1>{t('header.navigation.dashboard')}</h1>;
 * }
 * ```
 */

// Core i18n configuration
export {
  default as i18n,
  supportedLanguages,
  rtlLanguages,
  languageNames,
  defaultNamespaces,
  isRTLLanguage,
  getLanguageDirection,
  type SupportedLanguage,
  type TranslationNamespace,
} from './i18n';

// Providers
export { I18nProvider } from './I18nProvider';
export { DirectionProvider, useDirection, type Direction } from './DirectionProvider';

// Hooks
export {
  useTranslation,
  Trans,
  type TFunction,
  useFormatters,
  type DateFormatOptions,
  type NumberFormatOptions,
  type RelativeTimeOptions,
} from './hooks';
