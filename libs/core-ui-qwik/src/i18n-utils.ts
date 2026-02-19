import "@angular/localize/init";
import { loadTranslations } from "@angular/localize";
import { $, getLocale, useOnDocument, withLocale } from "@builder.io/qwik";


// You must declare all your locales here
import AR from "./locales/message.ar.json";
import EN from "./locales/message.en.json";
import FA from "./locales/message.fa.json";
import IT from "./locales/message.it.json";
import RU from "./locales/message.ru.json";
import TR from "./locales/message.tr.json";
import ZH from "./locales/message.zh.json";

import type { RenderOptions } from "@builder.io/qwik/server";

// Make sure it's obvious when the default locale was selected
const DEFAULT_LOCALE = "en";

/**
 * This file is left for the developer to customize to get the behavior they want for localization.
 */

/// Declare location where extra types will be stored.
const $localizeFn = $localize as any as {
  TRANSLATIONS: Record<string, any>;
  TRANSLATION_BY_LOCALE: Map<string, Record<string, any>>;
};

/**
 * This solution uses the `@angular/localize` package for translations, however out of the box
 * `$localize` works with a single translation only. This code adds support for multiple locales
 * concurrently. It does this by intercepting the `TRANSLATIONS` property read and returning
 * appropriate translation based on the current locale which is store in the `usEnvDate('local')`.
 */

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!$localizeFn.TRANSLATION_BY_LOCALE) {
  $localizeFn.TRANSLATION_BY_LOCALE = new Map([["", {}]]);
  Object.defineProperty($localize, "TRANSLATIONS", {
    get: function () {
      const locale = getLocale(DEFAULT_LOCALE);
      let translations = $localizeFn.TRANSLATION_BY_LOCALE.get(locale);
      if (!translations) {
        $localizeFn.TRANSLATION_BY_LOCALE.set(locale, (translations = {}));
      }
      return translations;
    },
  });
}

/**
 * Function used to load all translations variants.
 */
export function initTranslations() {
  [EN, IT, RU, FA, ZH, AR, TR].forEach(({ translations, locale }) => {
    withLocale(locale, () => loadTranslations(translations));
  });
}

/**
 * Function used to examine the request and determine the locale to use.
 *
 * This function is meant to be used with `RenderOptions.locale` property
 *
 * @returns The locale to use which will be stored in the `useEnvData('locale')`.
 */
export function extractLang(locale: string): string {
  return locale && $localizeFn.TRANSLATION_BY_LOCALE.has(locale)
    ? locale
    : DEFAULT_LOCALE;
}

/**
 * Function used to determine the base URL to use for loading the chunks in the browser.
 *
 * The function returns `/build` in dev mode or `/build/<locale>` in prod mode.
 *
 * This function is meant to be used with `RenderOptions.base` property
 *
 * @returns The base URL to use for loading the chunks in the browser.
 */
export function extractBase({ serverData }: RenderOptions): string {
  if (import.meta.env.DEV) {
    return `${import.meta.env.BASE_URL}build`;
  } else {
    return `${import.meta.env.BASE_URL}build/` + serverData!.locale;
  }
}

export function useI18n() {
  if (import.meta.env.DEV) {
    // During development only, load all translations in memory when the app starts on the client.
    // eslint-disable-next-line
    useOnDocument("qinit", $(initTranslations));
  }
}

// We always need the translations on the server
if (import.meta.env.SSR) {
  initTranslations();
}



// export const getLocaleFromPath = (pathname: string): string => {
//     const locales = ['en', 'it', 'ru', 'fa', 'zh', 'ar', 'tr'];
//     const urlSegments = pathname.split('/').filter(Boolean);
//     const firstSegment = urlSegments[0];
//     return locales.includes(firstSegment) ? firstSegment : 'en';
//   };

//   export const DEFAULT_LOCALE = 'en';
// export const SUPPORTED_LOCALES = ['en', 'it', 'ru', 'fa', 'zh', 'ar', 'tr'];

// export const getLocaleFromPath = (path: string): string => {
//   const firstSegment = path.split('/')[1];
//   return SUPPORTED_LOCALES.includes(firstSegment) ? firstSegment : DEFAULT_LOCALE;
// };

export const removeLocaleFromPath = (path: string): string => {
  return SUPPORTED_LOCALES.some((l) => path.startsWith(`/${l}/`))
    ? path.substring(3)
    : path;
};

// export const buildLocalePath = (locale: string, path: string): string => {
//   const cleanPath = removeLocaleFromPath(path);
//   return `/${locale}${cleanPath === '/' ? '' : cleanPath}`;
// };

// export const DEFAULT_LOCALE = "en";
export const SUPPORTED_LOCALES = ["en", "it", "ru", "fa", "zh", "ar", "tr"];

export const getLocaleFromPath = (path: string): string => {
  const pathSegments = path.split("/").filter(Boolean);
  const firstSegment = pathSegments[0];
  return SUPPORTED_LOCALES.includes(firstSegment)
    ? firstSegment
    : DEFAULT_LOCALE;
};

// export const buildLocalePath = (locale: string, path: string): string => {
//   // Remove existing locale if present
//   const pathWithoutLocale = SUPPORTED_LOCALES.some(l => path.startsWith(`/${l}/`))
//     ? path.substring(3)
//     : path;

//   // Ensure path starts with slash
//   const cleanPath = pathWithoutLocale === '' ? '/' : pathWithoutLocale;
//   return `/${locale}${cleanPath === '/' ? '' : cleanPath}`;
// };

export const getPathWithoutLocale = (path: string): string => {
  return SUPPORTED_LOCALES.some((l) => path.startsWith(`/${l}/`))
    ? path.substring(3)
    : path;
};

// export const buildLocalePath = (locale: string, path: string): string => {
//   // Remove existing locale if present
//   const pathWithoutLocale = SUPPORTED_LOCALES.some(l => path.startsWith(`/${l}/`))
//     ? path.substring(3)
//     : path;

//   // Build new path with locale
//   return `/${locale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
// };

export const buildLocalePath = (locale: string, pathWithoutLocale: string = ''): string => {
  // Ensure path doesn't start with slash since we'll add it
  const cleanPath = pathWithoutLocale.startsWith('/') ? pathWithoutLocale.slice(1) : pathWithoutLocale;
  // If path is empty or just '/', return just the locale
  return cleanPath === '' || cleanPath === '/' ? `/${locale}` : `/${locale}/${cleanPath}`;
};
