// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __BACKEND_URL__: string | undefined;

const fallback = 'http://localhost:8080';

export const BACKEND_URL = (
  typeof __BACKEND_URL__ === 'string' ? __BACKEND_URL__ : fallback
).replace(/\/$/, '');
