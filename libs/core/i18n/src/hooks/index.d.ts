/**
 * i18n Hooks barrel export
 *
 * Provides hooks for translation, text direction, and locale-aware formatting.
 *
 * @module hooks
 *
 * @example
 * ```tsx
 * import { useTranslation, useFormatters, useDirection } from '@nasnet/core/i18n';
 *
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   const { formatDate, formatBytes } = useFormatters();
 *   const { isRTL } = useDirection();
 *
 *   return (
 *     <div>
 *       <h1>{t('header.title')}</h1>
 *       <p>{formatDate(new Date())}</p>
 *     </div>
 *   );
 * }
 * ```
 */
/**
 * Hook for accessing translations and i18n instance
 * @see useTranslation
 */
export { useTranslation, Trans, type TFunction } from './useTranslation';
/**
 * Hook for detecting and responding to text direction changes
 * @see useDirection
 */
export { useDirection, type Direction } from './useDirection';
/**
 * Hook for locale-aware formatting of dates, numbers, bytes, durations, and bandwidth
 * @see useFormatters
 */
export { useFormatters, type DateFormatOptions, type NumberFormatOptions, type RelativeTimeOptions, } from './useFormatters';
//# sourceMappingURL=index.d.ts.map