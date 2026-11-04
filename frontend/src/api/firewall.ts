import { apiRequest } from './http';

export interface FirewallCredentials {
  host: string;
  username: string;
  password: string;
}

export interface FirewallRule {
  id: string;
  chain: string;
  action: string;
  protocol?: string;
  srcAddress?: string;
  dstAddress?: string;
  srcPort?: string;
  dstPort?: string;
  inInterface?: string;
  outInterface?: string;
  disabled: boolean;
  log: boolean;
  comment?: string;
  bytes?: string;
  packets?: string;
}

function authHeaders({ host, username, password }: FirewallCredentials): Record<string, string> {
  return {
    Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    'X-RouterOS-Host': host,
  };
}

export async function fetchFirewallRules(
  creds: FirewallCredentials,
  chain?: string,
  signal?: AbortSignal,
): Promise<FirewallRule[]> {
  const query = chain ? `?${new URLSearchParams({ chain }).toString()}` : '';
  const rules = await apiRequest<FirewallRule[] | null>(`/api/firewall/filter${query}`, {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return rules ?? [];
}

export interface DomesticBlockRule {
  id: string;
  chain: string;
  disabled: boolean;
}

export interface DomesticBlockResponse {
  block: boolean;
  rules: DomesticBlockRule[];
  addedRules?: number;
}

export interface DomesticAddress {
  id: string;
  address: string;
  timeout?: string;
  creationTime: string;
}

export interface DomesticAddressListInfo {
  totalEntries: number;
  autoEntries: number;
  manualEntries: number;
  lastUpdate?: string;
}

export interface UpdateDomesticAddressRequest {
  address: string;
  timeout?: string;
}

export async function fetchDomesticBlock(
  creds: FirewallCredentials,
  signal?: AbortSignal,
): Promise<DomesticBlockResponse> {
  return apiRequest<DomesticBlockResponse>('/api/firewall/domestic', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function setDomesticBlock(
  creds: FirewallCredentials,
  block: boolean,
): Promise<DomesticBlockResponse> {
  return apiRequest<DomesticBlockResponse>('/api/firewall/domestic', {
    method: 'PUT',
    headers: authHeaders(creds),
    body: JSON.stringify({ block }),
  });
}

export async function fetchDomesticAddresses(
  creds: FirewallCredentials,
  signal?: AbortSignal,
): Promise<DomesticAddress[]> {
  const items = await apiRequest<DomesticAddress[] | null>('/api/firewall/addresslist/domestic', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
  return items ?? [];
}

export async function fetchDomesticAddressListInfo(
  creds: FirewallCredentials,
  signal?: AbortSignal,
): Promise<DomesticAddressListInfo> {
  return apiRequest<DomesticAddressListInfo>('/api/firewall/addresslist/domestic/info', {
    method: 'GET',
    headers: authHeaders(creds),
    cache: 'no-store',
    signal,
  });
}

export async function addDomesticAddress(
  creds: FirewallCredentials,
  address: string,
): Promise<void> {
  await apiRequest<unknown>('/api/firewall/addresslist/domestic', {
    method: 'POST',
    headers: authHeaders(creds),
    body: JSON.stringify({ address }),
  });
}

export async function updateDomesticAddress(
  creds: FirewallCredentials,
  id: string,
  request: UpdateDomesticAddressRequest,
): Promise<DomesticAddress> {
  return apiRequest<DomesticAddress>(
    `/api/firewall/addresslist/domestic/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: authHeaders(creds),
      body: JSON.stringify(request),
    },
  );
}

export async function deleteDomesticAddress(creds: FirewallCredentials, id: string): Promise<void> {
  await apiRequest<void>(`/api/firewall/addresslist/domestic/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(creds),
  });
}
