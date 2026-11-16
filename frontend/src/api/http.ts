import i18n from '../i18n';
import { isAbortError } from './abort';
import { BACKEND_URL } from './config';

interface Envelope<T> {
  status: number;
  message: string;
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RouterAuth {
  host: string;
  username: string;
  password: string;
}

export interface ApiRequestInit extends RequestInit {
  skipAuthRedirect?: boolean;
  auth?: RouterAuth;
}

interface LoginData {
  token: string;
  expiresAt: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

const TOKEN_EXPIRY_MARGIN_MS = 60_000;
const tokens = new Map<string, CachedToken>();
const pendingLogins = new Map<string, Promise<string>>();

type UnauthorizedHandler = (host: string | null) => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

function tokenKey({ host, username, password }: RouterAuth): string {
  return JSON.stringify([host, username, password]);
}

function obtainToken(auth: RouterAuth): Promise<string> {
  const key = tokenKey(auth);
  const cached = tokens.get(key);
  if (cached && cached.expiresAt - Date.now() > TOKEN_EXPIRY_MARGIN_MS) {
    return Promise.resolve(cached.token);
  }

  const pending = pendingLogins.get(key);
  if (pending) return pending;

  const login = sendRequest<LoginData>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ host: auth.host, username: auth.username, password: auth.password }),
  })
    .then((data) => {
      tokens.set(key, { token: data.token, expiresAt: Date.parse(data.expiresAt) });
      return data.token;
    })
    .finally(() => {
      pendingLogins.delete(key);
    });
  pendingLogins.set(key, login);
  return login;
}

function notifyUnauthorized(err: unknown, init: ApiRequestInit): void {
  if (err instanceof ApiError && err.status === 401 && !init.skipAuthRedirect) {
    unauthorizedHandler?.(init.auth?.host ?? null);
  }
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { auth } = init;
  try {
    if (!auth) return await sendRequest<T>(path, init);

    const token = await obtainToken(auth);
    try {
      return await sendRequest<T>(path, init, token);
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) throw err;
      tokens.delete(tokenKey(auth));
      return await sendRequest<T>(path, init, await obtainToken(auth));
    }
  } catch (err) {
    notifyUnauthorized(err, init);
    throw err;
  }
}

export async function authorizedFetch(
  url: string,
  init: RequestInit,
  auth: RouterAuth,
): Promise<Response> {
  const send = async (): Promise<Response> => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${await obtainToken(auth)}`);
    return fetch(url, { ...init, headers });
  };

  const response = await send();
  if (response.status !== 401) return response;

  tokens.delete(tokenKey(auth));
  return send();
}

async function sendRequest<T>(path: string, init: ApiRequestInit, token?: string): Promise<T> {
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const requestInit: ApiRequestInit = { ...init };
  delete requestInit.skipAuthRedirect;
  delete requestInit.auth;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(url, { ...requestInit, headers });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new ApiError(
      err instanceof Error ? err.message : i18n.t('api.networkFailed', { ns: 'ui' }),
      0,
    );
  }

  let body: Envelope<T> | null = null;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    // non-JSON body — fall through to status check
  }

  if (!response.ok) {
    const message =
      body?.error ||
      body?.message ||
      i18n.t('api.requestFailed', { ns: 'ui', status: response.status });
    throw new ApiError(message, response.status, body?.data);
  }

  if (body && body.data !== undefined) return body.data;
  // Some endpoints return an envelope without `data`; cast.
  return body as unknown as T;
}
