import { apiRequest } from './http';

export interface HealthResponse {
  status: string;
  server: string;
  version: string;
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/health', { signal });
}
