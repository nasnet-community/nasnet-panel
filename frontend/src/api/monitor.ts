import { apiRequest, type RouterAuth } from './http';

export type MonitorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface MonitorLogEntry {
  id: string;
  /** RFC 3339 timestamp. */
  time: string;
  source: string;
  severity: MonitorSeverity;
  message: string;
}

export interface MonitorLogsResponse {
  /** Newest first. */
  items: MonitorLogEntry[];
  /** Number of entries that match the filters, across all pages. */
  total: number;
  /** Every source that has events, so the filter can list them. */
  sources?: string[];
}

export interface FetchMonitorLogsOptions {
  sources?: string[];
  severities?: MonitorSeverity[];
  /** RFC 3339 lower bound, inclusive. */
  from?: string;
  /** RFC 3339 upper bound, inclusive. */
  to?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export async function fetchMonitorLogs(
  auth: RouterAuth,
  opts: FetchMonitorLogsOptions = {},
  signal?: AbortSignal,
): Promise<MonitorLogsResponse> {
  const params = new URLSearchParams();
  if (opts.sources?.length) params.set('source', opts.sources.join(','));
  if (opts.severities?.length) params.set('severity', opts.severities.join(','));
  if (opts.from) params.set('from', opts.from);
  if (opts.to) params.set('to', opts.to);
  if (opts.q) params.set('q', opts.q);
  if (opts.limit !== undefined) params.set('limit', String(opts.limit));
  if (opts.offset !== undefined) params.set('offset', String(opts.offset));
  const query = params.toString();
  return apiRequest<MonitorLogsResponse>(
    query ? `/api/monitor/logs?${query}` : '/api/monitor/logs',
    { method: 'GET', auth, cache: 'no-store', signal },
  );
}
