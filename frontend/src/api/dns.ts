import { apiRequest } from './http';

export interface DnsCredentials {
  host: string;
  username: string;
  password: string;
}

export type DnsForwarderType = 'Domestic' | 'Foreign' | 'VPN';

export interface DnsForwarderListItem {
  name: string;
  ip: string;
  comment: string;
}

export interface DnsSuggestion {
  ip: string;
  description: string;
}

export interface DnsSuggestResponse {
  domestic?: DnsSuggestion[];
  foreign?: DnsSuggestion[];
}

export interface DnsValidateResponse {
  oldIp: string;
  newIp: string;
  oldIpType: string;
  suitable: boolean;
  message?: string;
}

export interface ChangeDnsRequest {
  oldIp: string;
  newIp: string;
}

function authHeaders({ host, username, password }: DnsCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export async function fetchDnsForwarders(
  creds: DnsCredentials,
  signal?: AbortSignal,
): Promise<DnsForwarderListItem[]> {
  const data = await apiRequest<DnsForwarderListItem[] | null>('/api/dns/list', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return data ?? [];
}

export async function fetchDnsSuggestions(
  creds: DnsCredentials,
  signal?: AbortSignal,
): Promise<DnsSuggestResponse> {
  const data = await apiRequest<DnsSuggestResponse | null>('/api/dns/suggest', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return data ?? {};
}

export async function validateDnsChange(
  creds: DnsCredentials,
  oldIp: string,
  newIp: string,
  signal?: AbortSignal,
): Promise<DnsValidateResponse> {
  const query = new URLSearchParams({ oldIP: oldIp, newIP: newIp });
  return apiRequest<DnsValidateResponse>(`/api/dns/validate?${query.toString()}`, {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function changeDns(
  creds: DnsCredentials,
  body: ChangeDnsRequest,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest('/api/dns/change', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify(body),
    signal,
  });
}

export async function setDnsAdBlock(
  creds: DnsCredentials,
  enabled: boolean,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest('/api/dns/adblock', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify({ enabled }),
    signal,
  });
}

export async function resetDns(creds: DnsCredentials, signal?: AbortSignal): Promise<void> {
  await apiRequest('/api/dns/reset', {
    method: 'POST',
    headers: authHeaders(creds),
    signal,
  });
}
