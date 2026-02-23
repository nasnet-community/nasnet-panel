/**
 * i18next Configuration for NasNetConnect
 *
 * Key Decisions:
 * - English bundled (always available as fallback)
 * - Other languages lazy-loaded via HTTP backend
 * - RTL support for Persian (fa), Arabic (ar), Hebrew (he)
 * - Namespace strategy: default (common, validation, errors) + feature (wizard, network)
 * - Feature namespaces load on-demand for efficient bundle splitting
 *
 * @see Docs/architecture/implementation-patterns/17-localization-patterns.md
 * @see NAS-4A.4: Set Up i18n Namespace Structure for Ported Components
 */
import i18n from 'i18next';
export declare const supportedLanguages: readonly ["en", "fa"];
export type SupportedLanguage = (typeof supportedLanguages)[number];
export declare const rtlLanguages: readonly SupportedLanguage[];
export declare const languageNames: Record<SupportedLanguage, string>;
export declare const defaultNamespaces: readonly ["common", "validation", "errors"];
export declare const featureNamespaces: readonly ["wizard", "network", "dashboard", "vpn", "wifi", "firewall", "services", "diagnostics", "router"];
export declare const allNamespaces: readonly ["common", "validation", "errors", "wizard", "network", "dashboard", "vpn", "wifi", "firewall", "services", "diagnostics", "router"];
export type TranslationNamespace = (typeof allNamespaces)[number];
export type DefaultNamespace = (typeof defaultNamespaces)[number];
export type FeatureNamespace = (typeof featureNamespaces)[number];
/**
 * Check if a language is RTL
 *
 * @param lang - Language code to check (e.g., 'en', 'fa')
 * @returns true if the language is right-to-left, false otherwise
 *
 * @example
 * ```ts
 * if (isRTLLanguage('fa')) {
 *   document.documentElement.dir = 'rtl';
 * }
 * ```
 */
export declare function isRTLLanguage(lang: string): boolean;
/**
 * Get the text direction for a language
 *
 * @param lang - Language code (e.g., 'en', 'fa')
 * @returns Text direction: 'ltr' (left-to-right) or 'rtl' (right-to-left)
 *
 * @example
 * ```ts
 * const direction = getLanguageDirection('fa'); // 'rtl'
 * ```
 */
export declare function getLanguageDirection(lang: string): 'ltr' | 'rtl';
export default i18n;
//# sourceMappingURL=i18n.d.ts.map