/**
 * RouterOS API type definitions for MikroTik router management
 * Ported from ConnectPOC2/packages/shared/src/routeros.ts
 */

export interface RouterInfo {
  readonly id: string;
  readonly name: string;
  readonly ip: string;
  readonly mac?: string;
  readonly model?: string;
  version?: string;
  readonly uptime?: number;
  status: RouterStatus;
}

export type RouterStatus = 'online' | 'offline' | 'connecting' | 'error' | 'unknown';

export interface RouterCredentials {
  readonly username: string;
  readonly password: string;
}

export interface AuthResult {
  readonly success: boolean;
  readonly token?: string;
  readonly error?: string;
}

export interface ScanConfig {
  readonly subnet: string;
  readonly timeout: number;
  readonly ports: readonly number[];
}

export interface ScanResult {
  readonly ip: string;
  readonly mac?: string;
  readonly hostname?: string;
  readonly services: readonly DetectedService[];
  readonly responseTime: number;
  version?: string;
  readonly identity?: string;
  readonly port?: number;
  readonly board?: string;
}

export interface DetectedService {
  readonly port: number;
  readonly protocol: 'tcp' | 'udp';
  readonly service: string;
  version?: string;
}

export interface RouterInterface {
  readonly name: string;
  readonly type: string;
  readonly mac: string;
  readonly mtu: number;
  readonly running: boolean;
  readonly disabled: boolean;
  readonly comment?: string;
}

export interface WirelessInterface extends RouterInterface {
  readonly ssid?: string;
  readonly frequency?: number;
  readonly mode: 'station' | 'ap-bridge' | 'bridge' | 'station-wds' | 'station-bridge' | 'alignment-only' | 'nstreme-dual-slave' | 'wds-slave';
  readonly band?: '2ghz-b' | '2ghz-g' | '2ghz-n' | '2ghz-ax' | '5ghz-a' | '5ghz-n' | '5ghz-ac' | '5ghz-ax';
  readonly channelWidth?: '20mhz' | '40mhz' | '80mhz' | '160mhz';
  readonly security?: string;
  readonly signal?: number;
  readonly txPower?: number;
  readonly noiseFloor?: number;
  readonly txRate?: number;
  readonly rxRate?: number;
  readonly distance?: number;
  readonly wdsDefaultBridge?: string;
  readonly hideSSID?: boolean;
}

export interface IpAddress {
  readonly address: string;
  readonly network: string;
  readonly interface: string;
  readonly disabled: boolean;
  readonly dynamic: boolean;
  readonly comment?: string;
}

export interface DhcpClient {
  readonly interface: string;
  readonly disabled: boolean;
  readonly status: 'bound' | 'searching' | 'stopped';
  readonly address?: string;
  readonly gateway?: string;
  readonly dns?: readonly string[];
}

export interface SystemResource {
  readonly uptime: string;
  readonly version: string;
  readonly buildTime: string;
  readonly freeMemory: number;
  readonly totalMemory: number;
  readonly cpuLoad: number;
  readonly freeHddSpace: number;
  readonly totalHddSpace: number;
  readonly architecture: string;
  readonly boardName: string;
  readonly platform: string;
}

export interface ConfigBackup {
  readonly timestamp: number;
  readonly name: string;
  readonly size: number;
  readonly data: string;
}

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly timestamp: number;
}

export type ApiError =
  | 'AUTH_FAILED'
  | 'CONNECTION_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVALID_COMMAND'
  | 'PERMISSION_DENIED'
  | 'ROUTER_UNREACHABLE';

export type StorageKey =
  | 'routers'
  | 'credentials'
  | 'scan-config'
  | 'last-scan'
  | 'app-settings'
  | 'manual-routers';

export interface AppSettings {
  readonly theme: 'light' | 'dark' | 'auto';
  readonly autoScan: boolean;
  readonly scanInterval: number;
  readonly defaultTimeout: number;
  readonly maxRetries: number;
}

export interface WirelessSecurityProfile {
  readonly name: string;
  readonly mode: 'none' | 'static-keys-required' | 'static-keys-optional' | 'dynamic-keys';
  readonly authenticationType?: 'wpa-psk' | 'wpa2-psk' | 'wpa-eap' | 'wpa2-eap';
  readonly unicastCiphers?: ('tkip' | 'aes-ccm')[];
  readonly groupCiphers?: ('tkip' | 'aes-ccm')[];
  readonly wpaPreSharedKey?: string;
  readonly wpa2PreSharedKey?: string;
  readonly supplicantIdentity?: string;
  readonly eapMethods?: ('eap-tls' | 'eap-ttls-mschapv2' | 'eap-peap-mschapv2')[];
  readonly radiusMacAuthentication?: boolean;
  readonly radiusMacAccounting?: boolean;
  readonly interimUpdate?: number;
  readonly radiusMacFormat?: string;
  readonly radiusMacMode?: string;
  readonly tlsMode?: 'no-certificates' | 'verify-certificate' | 'dont-verify-certificate';
  readonly tlsCertificate?: string;
  readonly disabled?: boolean;
}

export interface WireGuardInterface {
  readonly name: string;
  readonly privateKey?: string;
  readonly publicKey?: string;
  readonly listenPort?: number;
  readonly mtu?: number;
  readonly disabled?: boolean;
  readonly comment?: string;
}

export interface WireGuardPeer {
  readonly interface: string;
  readonly publicKey: string;
  readonly endpoint?: string;
  readonly endpointPort?: number;
  readonly allowedAddress: string[];
  readonly presharedKey?: string;
  readonly persistentKeepalive?: number;
  readonly disabled?: boolean;
  readonly comment?: string;
  readonly lastHandshake?: string;
  readonly rx?: number;
  readonly tx?: number;
  readonly currentEndpointAddress?: string;
  readonly currentEndpointPort?: number;
}

export interface IPSecProfile {
  readonly name: string;
  readonly hashAlgorithm: 'md5' | 'sha1' | 'sha256' | 'sha512';
  readonly encryptionAlgorithm: 'null' | 'des' | '3des' | 'aes-128-cbc' | 'aes-192-cbc' | 'aes-256-cbc' | 'aes-128-ctr' | 'aes-192-ctr' | 'aes-256-ctr' | 'aes-128-gcm' | 'aes-192-gcm' | 'aes-256-gcm';
  readonly dhGroup: 'modp768' | 'modp1024' | 'modp1536' | 'modp2048' | 'modp3072' | 'modp4096' | 'modp6144' | 'modp8192' | 'ecp256' | 'ecp384' | 'ecp521';
  readonly lifetime?: string;
  readonly lifetimeBytes?: number;
  readonly pfsGroup?: string;
  readonly proposalCheck?: 'claim' | 'exact' | 'obey' | 'strict';
  readonly natTraversal?: boolean;
  readonly dpdInterval?: string;
  readonly dpdMaximumFailures?: number;
  readonly comment?: string;
}

export interface IPSecPeer {
  readonly name?: string;
  readonly address: string;
  readonly localAddress?: string;
  readonly profile: string;
  readonly exchangeMode?: 'main' | 'aggressive' | 'base' | 'ike2';
  readonly sendInitialContact?: boolean;
  readonly natTraversal?: boolean;
  readonly myIdType?: 'auto' | 'address' | 'fqdn' | 'user-fqdn' | 'key-id';
  readonly myId?: string;
  readonly secret?: string;
  readonly peerCertificate?: string;
  readonly verifyPeerCertificate?: boolean;
  readonly passive?: boolean;
  readonly disabled?: boolean;
  readonly comment?: string;
}

export interface IPSecPolicy {
  readonly srcAddress: string;
  readonly srcPort?: number;
  readonly dstAddress: string;
  readonly dstPort?: number;
  readonly protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | 'encap' | 'gre';
  readonly action: 'none' | 'discard' | 'encrypt';
  readonly level?: 'require' | 'unique' | 'use';
  readonly ipsecProtocols?: ('ah' | 'esp')[];
  readonly tunnel?: boolean;
  readonly saSource?: string;
  readonly saDestination?: string;
  readonly proposal?: string;
  readonly priority?: number;
  readonly disabled?: boolean;
  readonly comment?: string;
}

export interface L2TPServer {
  readonly enabled: boolean;
  readonly maxMtu?: number;
  readonly maxMru?: number;
  readonly mrru?: number;
  readonly authentication?: ('pap' | 'chap' | 'mschap1' | 'mschap2')[];
  readonly defaultProfile?: string;
  readonly certificate?: string;
  readonly useCertificate?: boolean;
  readonly useIPSec?: 'no' | 'yes' | 'required';
  readonly ipsecSecret?: string;
  readonly callerIdType?: 'ip-address' | 'number';
  readonly oneSessionPerHost?: boolean;
  readonly maxSessions?: number;
}

export interface L2TPClient {
  readonly name: string;
  readonly connectTo: string;
  readonly user: string;
  readonly password?: string;
  readonly profile?: string;
  readonly certificate?: string;
  readonly addDefaultRoute?: boolean;
  readonly defaultRouteDistance?: number;
  readonly dialOnDemand?: boolean;
  readonly usePeerDns?: boolean;
  readonly useIPSec?: boolean;
  readonly ipsecSecret?: string;
  readonly allowFastPath?: boolean;
  readonly disabled?: boolean;
  readonly comment?: string;
}

export interface PPTPServer {
  readonly enabled: boolean;
  readonly maxMtu?: number;
  readonly maxMru?: number;
  readonly mrru?: number;
  readonly authentication?: ('pap' | 'chap' | 'mschap1' | 'mschap2')[];
  readonly defaultProfile?: string;
  readonly keepaliveTimeout?: number;
}

export interface SSTPServer {
  readonly enabled: boolean;
  readonly port?: number;
  readonly maxMtu?: number;
  readonly maxMru?: number;
  readonly mrru?: number;
  readonly authentication?: ('pap' | 'chap' | 'mschap1' | 'mschap2')[];
  readonly certificate: string;
  readonly tlsVersion?: 'any' | 'only-1.2';
  readonly defaultProfile?: string;
  readonly verifyClientCertificate?: boolean;
  readonly pfs?: boolean;
}

export interface OpenVPNServer {
  readonly enabled: boolean;
  readonly port?: number;
  readonly mode?: 'ip' | 'ethernet';
  readonly netmask?: number;
  readonly macAddress?: string;
  readonly maxMtu?: number;
  readonly keepaliveTimeout?: number;
  readonly defaultProfile?: string;
  readonly certificate: string;
  readonly requireClientCertificate?: boolean;
  readonly auth?: 'md5' | 'sha1' | 'sha256' | 'sha512';
  readonly cipher?: 'null' | 'aes128' | 'aes192' | 'aes256' | 'blowfish128';
}

export interface PPPProfile {
  readonly name: string;
  readonly localAddress?: string;
  readonly remoteAddress?: string;
  readonly addressList?: string;
  readonly dnsServer?: string[];
  readonly winsServer?: string[];
  readonly upScript?: string;
  readonly downScript?: string;
  readonly changeTcpMss?: 'yes' | 'no' | 'default';
  readonly useMpls?: 'yes' | 'no' | 'default' | 'required';
  readonly useCompression?: 'yes' | 'no' | 'default';
  readonly useEncryption?: 'yes' | 'no' | 'default' | 'required';
  readonly onlyOne?: 'yes' | 'no' | 'default';
  readonly sessionTimeout?: string;
  readonly idleTimeout?: string;
  readonly rateLimit?: string;
  readonly comment?: string;
}

export interface RouterOSAPIError {
  readonly error: number;
  readonly message: string;
  readonly detail?: string;
}

export interface RouterOSAuth {
  readonly username: string;
  readonly password: string;
  readonly token?: string;
  readonly expires?: number;
}

export interface RouterOSRequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  readonly timeout?: number;
  readonly retries?: number;
  readonly retryDelay?: number;
}

export interface ScanProgress {
  totalHosts: number;
  scannedHosts: number;
  foundHosts: number;
  currentHost: string;
  estimatedTimeRemaining: number;
  startTime: number;
  errors: string[];
}


