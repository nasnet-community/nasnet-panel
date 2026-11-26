import { apiRequest } from './http';

export interface DnsCredentials {
  host: string;
  username: string;
  password: string;
}

export type DnsForwarderType =
  'Domestic' | 'Foreign' | 'VPN-Primary' | 'VPN-Backup1' | 'VPN-Backup2';

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
  updatedScripts: string[];
}

export interface DnsFamilyResponse {
  foreign: DnsChangeResult;
  vpn: DnsChangeResult;
  backup1: DnsChangeResult;
  backup2: DnsChangeResult;
  cacheFlushed: boolean;
}

export interface DnsFamilyForwarderStatus {
  name: string;
  ip: string;
  familyIp: string;
  family: boolean;
}

export interface DnsFamilyStatus {
  enabled: boolean;
  partial: boolean;
  forwarders: DnsFamilyForwarderStatus[];
}

export interface StaticDnsEntry {
  id: string;
  name: string;
  address: string;
  type: string;
  ttl: string;
  disabled: boolean;
}

export interface CreateStaticDnsRequest {
  name: string;
  address: string;
}

export interface UpdateStaticDnsRequest {
  name?: string;
  address?: string;
  disabled?: boolean;
}

export async function fetchDnsForwarders(
  creds: DnsCredentials,
  signal?: AbortSignal,
): Promise<DnsForwarderListItem[]> {
  const data = await apiRequest<DnsForwarderListItem[] | null>('/api/dns/list', {
    method: 'GET',
    auth: creds,
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
    auth: creds,
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
    auth: creds,
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
    auth: creds,
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
    auth: creds,
    body: JSON.stringify({ enabled }),
    signal,
  });
}

export async function flushDnsCache(creds: DnsCredentials, signal?: AbortSignal): Promise<void> {
  await apiRequest('/api/dns/cache', {
    method: 'DELETE',
    auth: creds,
    signal,
  });
}

export async function fetchFamilyDns(
  creds: DnsCredentials,
  signal?: AbortSignal,
): Promise<DnsFamilyStatus> {
  return apiRequest<DnsFamilyStatus>('/api/dns/family', {
    method: 'GET',
    auth: creds,
    cache: 'no-store',
    signal,
  });
}

export async function setFamilyDns(
  creds: DnsCredentials,
  enabled: boolean,
  signal?: AbortSignal,
): Promise<DnsFamilyResponse> {
  return apiRequest<DnsFamilyResponse>('/api/dns/family', {
    method: 'PUT',
    auth: creds,
    body: JSON.stringify({ enabled }),
    signal,
  });
}

export async function resetDns(creds: DnsCredentials, signal?: AbortSignal): Promise<void> {
  await apiRequest('/api/dns/reset', {
    method: 'POST',
    auth: creds,
    signal,
  });
}

export async function fetchStaticDnsEntries(
  creds: DnsCredentials,
  signal?: AbortSignal,
): Promise<StaticDnsEntry[]> {
  const data = await apiRequest<StaticDnsEntry[] | null>('/api/dns/static', {
    method: 'GET',
    auth: creds,
    signal,
    cache: 'no-store',
  });
  return data ?? [];
}

export async function createStaticDnsEntry(
  creds: DnsCredentials,
  request: CreateStaticDnsRequest,
): Promise<StaticDnsEntry> {
  return apiRequest<StaticDnsEntry>('/api/dns/static', {
    method: 'POST',
    auth: creds,
    body: JSON.stringify(request),
  });
}

export async function updateStaticDnsEntry(
  creds: DnsCredentials,
  nameOrId: string,
  request: UpdateStaticDnsRequest,
): Promise<StaticDnsEntry> {
  return apiRequest<StaticDnsEntry>(`/api/dns/static/${encodeURIComponent(nameOrId)}`, {
    method: 'PUT',
    auth: creds,
    body: JSON.stringify(request),
  });
}

export async function deleteStaticDnsEntry(creds: DnsCredentials, nameOrId: string): Promise<void> {
  await apiRequest<void>(`/api/dns/static/${encodeURIComponent(nameOrId)}`, {
    method: 'DELETE',
    auth: creds,
  });
}
