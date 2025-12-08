/**
 * VPN (Virtual Private Network) configuration types
 * Supports WireGuard, OpenVPN, L2TP, PPTP, SSTP, IKEv2
 * 
 * Types are organized into:
 * - Base/shared types
 * - Server interfaces (per protocol)
 * - Client interfaces (per protocol)
 * - Dashboard/stats types
 */

// =============================================================================
// BASE TYPES
// =============================================================================

export type VPNProtocol = 'wireguard' | 'openvpn' | 'l2tp' | 'pptp' | 'sstp' | 'ikev2';
export type VPNConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
export type VPNMode = 'server' | 'client';

export interface VPNConnection {
  id: string;
  name: string;
  protocol: VPNProtocol;
  status: VPNConnectionStatus;
  enabled: boolean;
  lastConnectedAt?: Date;
}

/**
 * Base interface for all VPN server types
 */
export interface BaseVPNServer {
  id: string;
  name: string;
  disabled: boolean;
  running: boolean;
  comment?: string;
}

/**
 * Base interface for all VPN client types
 */
export interface BaseVPNClient {
  id: string;
  name: string;
  disabled: boolean;
  running: boolean;
  connectTo: string;
  user?: string;
  comment?: string;
}

// =============================================================================
// WIREGUARD TYPES
// =============================================================================

/**
 * WireGuard Interface Configuration
 * Can act as both server and client depending on peer configuration
 */
export interface WireGuardInterface {
  id: string;
  name: string;
  running: boolean;
  disabled: boolean;
  mtu: number;
  listenPort: number;
  publicKey: string;
  privateKey?: string;
  rx?: number;
  tx?: number;
  lastHandshake?: Date;
}

/**
 * WireGuard Peer Configuration
 */
export interface WireGuardPeer {
  id: string;
  interface: string;
  publicKey: string;
  presharedKey?: string;
  endpoint?: string;
  endpointAddress?: string;
  endpointPort?: number;
  allowedAddress: string[];
  lastHandshake?: Date;
  persistentKeepalive?: number;
  rx?: number;
  tx?: number;
  disabled?: boolean;
  comment?: string;
}

/**
 * WireGuard Server (interface with incoming peers)
 */
export interface WireGuardServer extends WireGuardInterface {
  peerCount: number;
  peers?: WireGuardPeer[];
}

/**
 * WireGuard Client (peer configuration for outgoing connection)
 */
export interface WireGuardClient {
  id: string;
  name: string;
  interface: string;
  disabled: boolean;
  running: boolean;
  endpoint: string;
  publicKey: string;
  allowedAddress: string[];
  persistentKeepalive?: number;
  rx?: number;
  tx?: number;
  lastHandshake?: Date;
  comment?: string;
}

// =============================================================================
// OPENVPN TYPES
// =============================================================================

/**
 * OpenVPN Server Interface
 */
export interface OpenVPNServer extends BaseVPNServer {
  type: 'ovpn-server';
  port: number;
  mode: 'ip' | 'ethernet';
  protocol: 'tcp' | 'udp';
  maxMtu: number;
  netmask?: string;
  defaultProfile?: string;
  certificate?: string;
  requireClientCertificate: boolean;
  auth: 'md5' | 'sha1' | 'sha256' | 'sha512' | 'null';
  cipher: 'aes128-cbc' | 'aes192-cbc' | 'aes256-cbc' | 'aes128-gcm' | 'aes256-gcm' | 'blowfish128' | 'null';
  enableTunIpv6?: boolean;
  ipv6Prefix?: string;
  ipv6PrefixLen?: number;
  macAddress?: string;
  keepaliveTimeout?: number;
  pushedRoutes?: string[];
  redirectGateway?: 'def1' | 'ipv6' | 'disabled';
}

/**
 * OpenVPN Client Interface
 */
export interface OpenVPNClient extends BaseVPNClient {
  type: 'ovpn-client';
  port: number;
  mode: 'ip' | 'ethernet';
  protocol: 'tcp' | 'udp';
  maxMtu: number;
  certificate?: string;
  verifyCertificate: boolean;
  auth: 'md5' | 'sha1' | 'sha256' | 'sha512' | 'null';
  cipher: 'aes128-cbc' | 'aes192-cbc' | 'aes256-cbc' | 'aes128-gcm' | 'aes256-gcm' | 'blowfish128' | 'null';
  password?: string;
  addDefaultRoute: boolean;
  routeNopull?: boolean;
  rx?: number;
  tx?: number;
  uptime?: string;
}

// =============================================================================
// L2TP TYPES
// =============================================================================

/**
 * L2TP Server Interface
 */
export interface L2TPServer extends BaseVPNServer {
  type: 'l2tp-server';
  enabled: boolean;
  maxMtu: number;
  maxMru: number;
  mrru?: number;
  authentication: ('mschap1' | 'mschap2' | 'chap' | 'pap')[];
  defaultProfile?: string;
  useIpsec: boolean;
  ipsecSecret?: string;
  allowFastPath: boolean;
  callerIdType?: 'ip-address' | 'number';
  oneSessionPerHost?: boolean;
  maxSessions?: number;
  acceptedConnections?: number;
}

/**
 * L2TP Client Interface
 */
export interface L2TPClient extends BaseVPNClient {
  type: 'l2tp-client';
  maxMtu: number;
  maxMru: number;
  mrru?: number;
  password?: string;
  profile?: string;
  useIpsec: boolean;
  ipsecSecret?: string;
  allowFastPath: boolean;
  addDefaultRoute: boolean;
  dialOnDemand?: boolean;
  rx?: number;
  tx?: number;
  uptime?: string;
  localAddress?: string;
  remoteAddress?: string;
}

// Legacy L2TP Interface (for backward compatibility)
export interface L2TPInterface {
  id: string;
  name: string;
  type: 'l2tp';
  disabled: boolean;
  running: boolean;
  connectTo: string;
  user?: string;
  comment?: string;
}

// =============================================================================
// PPTP TYPES
// =============================================================================

/**
 * PPTP Server Interface
 */
export interface PPTPServer extends BaseVPNServer {
  type: 'pptp-server';
  enabled: boolean;
  maxMtu: number;
  maxMru: number;
  mrru?: number;
  authentication: ('mschap1' | 'mschap2' | 'chap' | 'pap')[];
  defaultProfile?: string;
  keepaliveTimeout?: number;
  acceptedConnections?: number;
}

/**
 * PPTP Client Interface
 */
export interface PPTPClient extends BaseVPNClient {
  type: 'pptp-client';
  maxMtu: number;
  maxMru: number;
  mrru?: number;
  password?: string;
  profile?: string;
  addDefaultRoute: boolean;
  dialOnDemand?: boolean;
  rx?: number;
  tx?: number;
  uptime?: string;
  localAddress?: string;
  remoteAddress?: string;
}

// Legacy PPTP Interface (for backward compatibility)
export interface PPTPInterface {
  id: string;
  name: string;
  type: 'pptp';
  disabled: boolean;
  running: boolean;
  connectTo: string;
  user?: string;
  comment?: string;
}

// =============================================================================
// SSTP TYPES
// =============================================================================

/**
 * SSTP Server Interface
 */
export interface SSTPServer extends BaseVPNServer {
  type: 'sstp-server';
  enabled: boolean;
  port: number;
  maxMtu: number;
  maxMru: number;
  mrru?: number;
  authentication: ('mschap1' | 'mschap2' | 'chap' | 'pap')[];
  defaultProfile?: string;
  certificate?: string;
  pemEncoding: boolean;
  verifyClientCertificate: boolean;
  tlsVersion: 'any' | 'only-1.2';
  acceptedConnections?: number;
  forceAes?: boolean;
}

/**
 * SSTP Client Interface
 */
export interface SSTPClient extends BaseVPNClient {
  type: 'sstp-client';
  port: number;
  maxMtu: number;
  maxMru: number;
  mrru?: number;
  password?: string;
  profile?: string;
  certificate?: string;
  verifyServerCertificate: boolean;
  verifyServerAddressFromCertificate: boolean;
  tlsVersion: 'any' | 'only-1.2';
  pemEncoding: boolean;
  addDefaultRoute: boolean;
  dialOnDemand?: boolean;
  httpProxy?: string;
  httpProxyPort?: number;
  rx?: number;
  tx?: number;
  uptime?: string;
  localAddress?: string;
  remoteAddress?: string;
}

// Legacy SSTP Interface (for backward compatibility)
export interface SSSTPInterface {
  id: string;
  name: string;
  type: 'sstp';
  disabled: boolean;
  running: boolean;
  connectTo: string;
  user?: string;
  verifyServerCertificate?: boolean;
  comment?: string;
}

// =============================================================================
// IKEv2/IPSEC TYPES
// =============================================================================

/**
 * IPsec Profile (used by IKEv2)
 */
export interface IPsecProfile {
  id: string;
  name: string;
  hashAlgorithm: ('md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512')[];
  encAlgorithm: ('des' | '3des' | 'aes-128-cbc' | 'aes-192-cbc' | 'aes-256-cbc' | 'aes-128-gcm' | 'aes-256-gcm')[];
  dhGroup: ('modp768' | 'modp1024' | 'modp1536' | 'modp2048' | 'modp3072' | 'modp4096' | 'ecp256' | 'ecp384' | 'ecp521')[];
  lifetime: string;
  dpdInterval?: string;
  dpdMaxFailures?: number;
  natTraversal: boolean;
  proposalCheck: 'obey' | 'strict' | 'claim' | 'exact';
}

/**
 * IPsec Peer (IKEv2 remote endpoint)
 */
export interface IPsecPeer {
  id: string;
  name: string;
  address: string;
  profile: string;
  exchangeMode: 'ike2' | 'main' | 'main-l2tp' | 'aggressive';
  passive: boolean;
  sendInitialContact: boolean;
  localAddress?: string;
  port: number;
  disabled: boolean;
  comment?: string;
}

/**
 * IPsec Policy
 */
export interface IPsecPolicy {
  id: string;
  peer: string;
  srcAddress: string;
  dstAddress: string;
  protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | number;
  srcPort?: string;
  dstPort?: string;
  action: 'encrypt' | 'none' | 'discard';
  level: 'require' | 'unique' | 'use';
  ipsecProtocols: ('esp' | 'ah')[];
  tunnel: boolean;
  proposal?: string;
  disabled: boolean;
  active?: boolean;
  comment?: string;
}

/**
 * IPsec Identity
 */
export interface IPsecIdentity {
  id: string;
  peer: string;
  authMethod: 'pre-shared-key' | 'digital-signature' | 'pre-shared-key-xauth' | 'eap' | 'eap-radius';
  secret?: string;
  certificate?: string;
  remoteCertificate?: string;
  myId?: string;
  remoteId?: string;
  matchBy: 'remote-id' | 'certificate';
  username?: string;
  password?: string;
  disabled: boolean;
  comment?: string;
}

/**
 * IPsec Active Connection
 */
export interface IPsecActiveConnection {
  id: string;
  peer: string;
  state: 'established' | 'connecting' | 'dying';
  side: 'initiator' | 'responder';
  phase2Count: number;
  localAddress: string;
  remoteAddress: string;
  rx?: number;
  tx?: number;
  uptime?: string;
}

/**
 * IKEv2 Server Configuration (composite)
 */
export interface IKEv2Server {
  id: string;
  name: string;
  type: 'ikev2-server';
  disabled: boolean;
  running: boolean;
  profile: IPsecProfile;
  peers: IPsecPeer[];
  policies: IPsecPolicy[];
  identities: IPsecIdentity[];
  activeConnections: IPsecActiveConnection[];
  comment?: string;
}

/**
 * IKEv2 Client Configuration (composite)
 */
export interface IKEv2Client {
  id: string;
  name: string;
  type: 'ikev2-client';
  disabled: boolean;
  running: boolean;
  connectTo: string;
  profile: string;
  identity: IPsecIdentity;
  policy: IPsecPolicy;
  activeConnection?: IPsecActiveConnection;
  rx?: number;
  tx?: number;
  uptime?: string;
  comment?: string;
}

// =============================================================================
// LEGACY CONFIG TYPES (for backward compatibility)
// =============================================================================

export interface OpenVPNConfig {
  id: string;
  name: string;
  enabled: boolean;
  protocol: 'tcp' | 'udp';
  port: number;
  server?: string;
  configFile?: string;
}

export interface L2TPConfig {
  id: string;
  name: string;
  enabled: boolean;
  server: string;
  username: string;
  password: string;
  secret?: string;
}

export interface PPTPConfig {
  id: string;
  name: string;
  enabled: boolean;
  server: string;
  username: string;
  password: string;
  encryption: 'none' | '40bit' | '128bit' | '256bit';
}

export interface SSSTPConfig {
  id: string;
  name: string;
  enabled: boolean;
  server: string;
  username: string;
  password: string;
  verifyServerCertificate: boolean;
}

export interface IKEv2Config {
  id: string;
  name: string;
  enabled: boolean;
  server: string;
  username: string;
  password: string;
  encryptionAlgorithm: 'aes128' | 'aes192' | 'aes256';
}

// =============================================================================
// UNION TYPES
// =============================================================================

/**
 * Union type for all VPN server types
 */
export type VPNServerType = 
  | WireGuardServer 
  | OpenVPNServer 
  | L2TPServer 
  | PPTPServer 
  | SSTPServer 
  | IKEv2Server;

/**
 * Union type for all VPN client types
 */
export type VPNClientType = 
  | WireGuardClient 
  | OpenVPNClient 
  | L2TPClient 
  | PPTPClient 
  | SSTPClient 
  | IKEv2Client;

/**
 * Union type for all VPN interface types (legacy)
 */
export type VPNInterface = L2TPInterface | PPTPInterface | SSSTPInterface;

export type VPNConfig =
  | WireGuardInterface
  | OpenVPNConfig
  | L2TPConfig
  | PPTPConfig
  | SSSTPConfig
  | IKEv2Config;

// =============================================================================
// DASHBOARD/STATS TYPES
// =============================================================================

/**
 * Stats for a single VPN protocol
 */
export interface VPNProtocolStats {
  protocol: VPNProtocol;
  serverCount: number;
  clientCount: number;
  activeServerConnections: number;
  activeClientConnections: number;
  totalRx: number;
  totalTx: number;
}

/**
 * Overall VPN dashboard statistics
 */
export interface VPNDashboardStats {
  // Overall counts
  totalServers: number;
  totalClients: number;
  activeServers: number;
  activeClients: number;
  
  // Connection counts
  totalServerConnections: number;
  totalClientConnections: number;
  
  // Traffic totals
  totalRx: number;
  totalTx: number;
  
  // Per-protocol breakdown
  protocolStats: VPNProtocolStats[];
  
  // Status indicators
  overallHealth: 'healthy' | 'warning' | 'critical';
  issues: VPNIssue[];
  
  // Recent events
  recentEvents: VPNEvent[];
  
  // Timestamp
  lastUpdated: Date;
}

/**
 * VPN Issue/Warning
 */
export interface VPNIssue {
  id: string;
  severity: 'warning' | 'error';
  protocol: VPNProtocol;
  entityType: 'server' | 'client';
  entityName: string;
  message: string;
  timestamp: Date;
}

/**
 * VPN Event (connection history)
 */
export interface VPNEvent {
  id: string;
  type: 'connected' | 'disconnected' | 'error' | 'created' | 'modified' | 'deleted';
  protocol: VPNProtocol;
  entityType: 'server' | 'client';
  entityName: string;
  details?: string;
  timestamp: Date;
}

/**
 * Traffic data point for charts
 */
export interface VPNTrafficDataPoint {
  timestamp: Date;
  rx: number;
  tx: number;
}

/**
 * Traffic history for charts
 */
export interface VPNTrafficHistory {
  protocol?: VPNProtocol;
  dataPoints: VPNTrafficDataPoint[];
  interval: 'minute' | 'hour' | 'day';
}

// =============================================================================
// PPP TYPES (used by VPN servers for user management)
// =============================================================================

/**
 * PPP Profile (used by L2TP, PPTP, SSTP servers)
 */
export interface PPPProfile {
  id: string;
  name: string;
  localAddress?: string;
  remoteAddress?: string;
  dnsServer?: string;
  bridgeLearning?: 'default' | 'no' | 'yes';
  useCompression?: 'default' | 'no' | 'yes';
  useEncryption?: 'default' | 'no' | 'yes' | 'required';
  useIpv6?: 'default' | 'no' | 'yes' | 'required';
  rateLimit?: string;
  sessionTimeout?: string;
  idleTimeout?: string;
  comment?: string;
}

/**
 * PPP Secret (VPN user credentials)
 */
export interface PPPSecret {
  id: string;
  name: string;
  password?: string;
  service: 'any' | 'pppoe' | 'pptp' | 'l2tp' | 'sstp' | 'ovpn';
  callerId?: string;
  profile?: string;
  localAddress?: string;
  remoteAddress?: string;
  routes?: string;
  limitBytesIn?: number;
  limitBytesOut?: number;
  disabled: boolean;
  comment?: string;
}

/**
 * PPP Active Connection
 */
export interface PPPActiveConnection {
  id: string;
  name: string;
  service: 'pptp' | 'l2tp' | 'sstp' | 'ovpn' | 'pppoe';
  callerId?: string;
  address: string;
  uptime: string;
  encoding?: string;
  sessionId?: string;
  limitBytesIn?: number;
  limitBytesOut?: number;
  rx: number;
  tx: number;
}

// =============================================================================
// FORM INPUT TYPES (for Add/Edit dialogs)
// =============================================================================

/**
 * Input for creating/updating WireGuard server
 */
export interface WireGuardServerInput {
  name: string;
  listenPort: number;
  mtu?: number;
  privateKey?: string;
  disabled?: boolean;
  comment?: string;
}

/**
 * Input for creating/updating WireGuard peer
 */
export interface WireGuardPeerInput {
  interface: string;
  publicKey: string;
  presharedKey?: string;
  endpoint?: string;
  allowedAddress: string[];
  persistentKeepalive?: number;
  disabled?: boolean;
  comment?: string;
}

/**
 * Input for creating/updating OpenVPN server
 */
export interface OpenVPNServerInput {
  name: string;
  port: number;
  mode: 'ip' | 'ethernet';
  protocol: 'tcp' | 'udp';
  maxMtu?: number;
  certificate?: string;
  requireClientCertificate?: boolean;
  auth?: 'md5' | 'sha1' | 'sha256' | 'sha512' | 'null';
  cipher?: 'aes128-cbc' | 'aes192-cbc' | 'aes256-cbc' | 'aes128-gcm' | 'aes256-gcm' | 'blowfish128' | 'null';
  defaultProfile?: string;
  disabled?: boolean;
  comment?: string;
}

/**
 * Input for creating/updating OpenVPN client
 */
export interface OpenVPNClientInput {
  name: string;
  connectTo: string;
  port: number;
  mode: 'ip' | 'ethernet';
  protocol: 'tcp' | 'udp';
  user?: string;
  password?: string;
  certificate?: string;
  verifyCertificate?: boolean;
  auth?: 'md5' | 'sha1' | 'sha256' | 'sha512' | 'null';
  cipher?: 'aes128-cbc' | 'aes192-cbc' | 'aes256-cbc' | 'aes128-gcm' | 'aes256-gcm' | 'blowfish128' | 'null';
  addDefaultRoute?: boolean;
  disabled?: boolean;
  comment?: string;
}

/**
 * Input for creating/updating L2TP/PPTP/SSTP client
 */
export interface PPPClientInput {
  name: string;
  connectTo: string;
  user?: string;
  password?: string;
  profile?: string;
  addDefaultRoute?: boolean;
  useIpsec?: boolean;
  ipsecSecret?: string;
  disabled?: boolean;
  comment?: string;
}

/**
 * Input for enabling/configuring L2TP/PPTP/SSTP server
 */
export interface PPPServerInput {
  enabled: boolean;
  defaultProfile?: string;
  authentication?: ('mschap1' | 'mschap2' | 'chap' | 'pap')[];
  useIpsec?: boolean;
  ipsecSecret?: string;
  maxMtu?: number;
  maxMru?: number;
}

/**
 * Input for creating/updating IPsec peer (IKEv2)
 */
export interface IPsecPeerInput {
  name: string;
  address: string;
  profile?: string;
  exchangeMode?: 'ike2' | 'main' | 'aggressive';
  passive?: boolean;
  localAddress?: string;
  port?: number;
  disabled?: boolean;
  comment?: string;
}

/**
 * Input for creating/updating IPsec identity
 */
export interface IPsecIdentityInput {
  peer: string;
  authMethod: 'pre-shared-key' | 'digital-signature' | 'eap';
  secret?: string;
  certificate?: string;
  myId?: string;
  remoteId?: string;
  username?: string;
  password?: string;
  disabled?: boolean;
  comment?: string;
}
