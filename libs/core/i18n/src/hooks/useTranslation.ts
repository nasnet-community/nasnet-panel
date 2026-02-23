/**
 * Typed useTranslation hook wrapper
 *
 * Re-exports react-i18next's useTranslation with proper typing
 * and additional utilities for NasNetConnect.
 *
 * @module hooks/useTranslation
 */
import { useTranslation as useTranslationOriginal, Trans } from 'react-i18next';

import type { TranslationNamespace } from '../i18n';

/**
 * Provides type-safe translation function with namespace support
 *
 * @param ns - Translation namespace(s) to load
 * @returns Translation object with `t` function and i18n instance
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { t } = useTranslation('common');
 *   return <h1>{t('app.name')}</h1>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With multiple namespaces
 * const { t } = useTranslation(['common', 'validation']);
 * ```
 */
export function useTranslation(ns?: TranslationNamespace | TranslationNamespace[]) {
  return useTranslationOriginal(ns);
}

/**
 * React component for complex translation interpolations
 *
 * Provides context-aware translation with child function support,
 * allowing dynamic content within translations.
 *
 * @example
 * ```tsx
 * <Trans i18nKey="welcome.message">
 *   Welcome, <strong>{{ name }}</strong>
 * </Trans>
 * ```
 */
export { Trans };

/**
 * Type definition for the translation function
 *
 * Extracts the `t` function type from useTranslation result
 * for use in type-safe translation utilities.
 *
 * @example
 * ```tsx
 * function translateError(t: TFunction, errorCode: string): string {
 *   return t(`errors.${errorCode}`);
 * }
 * ```
 */
export type TFunction = ReturnType<typeof useTranslation>['t'];
