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
      return event;
    },
  });
}
