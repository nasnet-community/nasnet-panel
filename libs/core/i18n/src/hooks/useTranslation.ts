/**
 * Typed useTranslation hook wrapper
 *
 * Re-exports react-i18next's useTranslation with proper typing
 * and additional utilities for NasNetConnect.
 */
import { useTranslation as useTranslationOriginal, Trans } from 'react-i18next';

import type { TranslationNamespace } from '../i18n';

// Re-export with namespace typing
export function useTranslation(ns?: TranslationNamespace | TranslationNamespace[]) {
  return useTranslationOriginal(ns);
}

// Re-export Trans component for complex interpolations
export { Trans };

// Type-safe translation function helper
export type TFunction = ReturnType<typeof useTranslation>['t'];

export default useTranslation;
