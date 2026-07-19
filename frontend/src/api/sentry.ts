import * as Sentry from '@sentry/react';

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __SENTRY_DSN__: string | undefined;
// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __APP_VERSION__: string;

const DSN = typeof __SENTRY_DSN__ === 'string' ? __SENTRY_DSN__ : '';

const STORAGE_KEY = 'nasnet-panel.error-reporting';

const DROPPED_BREADCRUMBS = new Set(['console', 'ui.input', 'xhr', 'fetch']);

export function isErrorReportingEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setErrorReportingEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

const IP_PATTERNS = [
  /\b\d{1,3}(?:\.\d{1,3}){3}\b/g,
  /\b(?=[0-9a-f:]*[a-f])(?:[0-9a-f]{1,4}:|:){2,7}(?:[0-9a-f]{1,4}|:)(?:%\w+)?\b/gi,
];

const scrubIps = (text: string): string =>
  IP_PATTERNS.reduce((out, pattern) => out.replace(pattern, '[ip]'), text);

const scrubDeep = (value: unknown): unknown => {
  if (typeof value === 'string') return scrubIps(value);
  if (Array.isArray(value)) return value.map(scrubDeep);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      record[key] = scrubDeep(record[key]);
    }
    return record;
  }
  return value;
};

const stripUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  try {
    return new URL(value, window.location.origin).pathname;
  } catch {
    return undefined;
  }
};

export function initSentry(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (!DSN) return;

  Sentry.init({
    dsn: DSN,
    release: __APP_VERSION__,
    environment: 'production',
    tracesSampleRate: 0,
    dataCollection: {
      userInfo: false,
      cookies: false,
      queryParams: false,
      httpHeaders: { request: false, response: false },
      httpBodies: [],
      stackFrameVariables: false,
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category && DROPPED_BREADCRUMBS.has(breadcrumb.category)) return null;
      if (breadcrumb.category === 'navigation' && breadcrumb.data) {
        breadcrumb.data = {
          from: stripUrl(breadcrumb.data.from),
          to: stripUrl(breadcrumb.data.to),
        };
      }
      return breadcrumb;
    },
    beforeSend(event) {
      if (!isErrorReportingEnabled()) return null;
      delete event.user;
      delete event.request;
      delete event.extra;
      return scrubDeep(event) as typeof event;
    },
  });
}
