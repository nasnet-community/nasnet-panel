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
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new ApiError(err instanceof Error ? err.message : 'Network request failed', 0);
  }

  let body: Envelope<T> | null = null;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    // non-JSON body — fall through to status check
  }

  if (!response.ok) {
    const message = body?.error || body?.message || `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (body && body.data !== undefined) return body.data;
  // Some endpoints return an envelope without `data`; cast.
  return body as unknown as T;
}
