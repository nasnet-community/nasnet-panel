import { mockApi, mockStore, getProtocolOptions } from '@nasnet/mocks';
import { scanner } from './scanner';

export const api = {
  ...mockApi,
  scanner,
};
export const store = mockStore;
export { getProtocolOptions };
export {
  verifyIP,
  testCredentials,
  type VerifyResponse,
  type RouterOSVerifyInfo,
  type RouterSystemInfo,
} from './scanner';
export {
  fetchSystemInfo,
  fetchSystemResources,
  fetchDHCPLeases,
  fetchSystemOverview,
  fetchDynamicOverview,
  fetchInterfaceTraffic,
  fetchInterfaces,
  fetchVPNClients,
  rebootSystem,
  shutdownSystem,
  changeUserPassword,
  type SystemCredentials,
  type SystemInfoResponse,
  type ResourceInfoResponse,
  type DHCPLeaseResponse,
  type DynamicOverview,
  type InterfaceTrafficResponse,
  type InterfaceResponse,
} from './system';
export {
  fetchWifiInterfaces,
  fetchWifiInterface,
  fetchWifiClients,
  updateWifiInterface,
  updateWifiSettings,
  removeWifiClient,
  fetchWifiPassphrase,
  updateWifiPassphrase,
  type WifiCredentials,
  type WifiInterfaceResponse,
  type WifiConnectedClientResponse,
  type WifiPassphraseResponse,
  type UpdateWifiSettingsRequest,
} from './wifi';
export {
  fetchLogs,
  type LogsCredentials,
  type LogEntryResponse,
  type GetLogsResponse,
  type FetchLogsOptions,
  type LogSeverity,
} from './logs';
export {
  fetchDnsInfo,
  updateDnsConfig,
  type DnsCredentials,
  type DnsInfoResponse,
  type UpdateDnsRequest,
} from './dns';
export {
  fetchDhcpLeases,
  fetchDhcpClients,
  fetchDhcpServers,
  makeDhcpLeaseStatic,
  removeDhcpLease,
  type DhcpCredentials,
  type DhcpLease,
  type DhcpClient,
  type DhcpServer,
  type DhcpLeaseAction,
} from './dhcp';
export { fetchFirewallRules, type FirewallCredentials, type FirewallRule } from './firewall';
export {
  fetchUpdateInfo,
  checkForUpdates,
  installUpdate,
  type UpdateInfoResponse,
  type UpdateCheckResponse,
  type UpdateInstallResponse,
} from './updates';
export {
  listVPNClients,
  updateVPNClient,
  addL2TPClient,
  fetchVPNServersStatus,
  fetchOvpnServerDetails,
  fetchPptpServerDetails,
  fetchL2tpServerDetails,
  fetchSstpServerDetails,
  fetchWireguardServerDetails,
  type VPNCredentials,
  type VPNClientResponse,
  type UpdateVPNClientRequest,
  type AddL2TPClientRequest,
  type VPNServersStatusResponse,
  type ServerStatusItem,
  type SingleServerStatus,
  type OvpnServerDetailsResponse,
  type PptpServerDetailsResponse,
  type L2tpServerDetailsResponse,
  type SstpServerDetailsResponse,
  type WireguardServerDetailsResponse,
  type L2TPUserSecret,
} from './vpn';
export { ApiError } from './http';
export { isAbortError } from './abort';
export { BACKEND_URL } from './config';

export type * from '@nasnet/mocks';
