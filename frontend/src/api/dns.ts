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
  description?: string;
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

export interface DnsChangeResult {
  oldIp: string;
  newIp: string;
  servers: string[];
  updatedForwarders: string[];
  updatedDstAddressRoutes: string[];
  updatedGatewayRoutes: string[];
  updatedNetwatchProbes: string[];
  updatedAddressListItems: string[];
  updatedNatRules: string[];
}

export interface DnsFamilyResponse {
  foreign: DnsChangeResult;
  vpn: DnsChangeResult;
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

export async function setFamilyDns(
  creds: DnsCredentials,
  signal?: AbortSignal,
): Promise<DnsFamilyResponse> {
  return apiRequest<DnsFamilyResponse>('/api/dns/family', {
    method: 'POST',
    headers: authHeaders(creds),
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
