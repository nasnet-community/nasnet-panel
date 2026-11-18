import { apiRequest } from './http';

export interface LogsCredentials {
  host: string;
  username: string;
  password: string;
}

export type LogSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface LogEntryResponse {
  id: string;
  time: string;
  topic: string;
  level: LogSeverity;
  message: string;
  prefix?: string;
  account?: string;
  count?: number;
}

export interface GetLogsResponse {
  count: number;
  entries: LogEntryResponse[];
  availableTopics?: string[];
  availableLevels?: string[];
}

export interface FetchLogsOptions {
  limit?: number;
  text?: string;
  topic?: string;
  severity?: LogSeverity;
}

export async function fetchLogs(
  creds: LogsCredentials,
  opts: FetchLogsOptions = {},
  signal?: AbortSignal,
): Promise<GetLogsResponse> {
  const params = new URLSearchParams();
  if (opts.limit !== undefined) params.set('limit', String(opts.limit));
  if (opts.text) params.set('text', opts.text);
  if (opts.topic) params.set('topic', opts.topic);
  if (opts.severity) params.set('severity', opts.severity);
  const query = params.toString();
  const path = query ? `/api/logs?${query}` : '/api/logs';
  return apiRequest<GetLogsResponse>(path, {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
}
