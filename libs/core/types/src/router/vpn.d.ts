/**
 * VPN (Virtual Private Network) configuration types
 * Supports WireGuard, OpenVPN, L2TP, PPTP, SSTP, IKEv2
 *
 * Types are organized into:
 * - Base/shared types
 * - Server interfaces (per protocol)
 * - Client interfaces (per protocol)
 * - Dashboard/stats types
 *
 * @module @nasnet/core/types/router/vpn
 */
/**
 * Supported VPN protocol types
 *
 * @example
 * const protocol: VPNProtocol = 'wireguard';
 */
export type VPNProtocol = 'wireguard' | 'openvpn' | 'l2tp' | 'pptp' | 'sstp' | 'ikev2';
/**
 * VPN connection state indicators
 *
 * @remarks
 * Describes the lifecycle state of a VPN connection attempt
 *
 * @example
 * const status: VPNConnectionStatus = 'connected';
 */
export type VPNConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
/**
 * VPN operational mode (server or client role)
 *
 * @example
 * const mode: VPNMode = 'server';
 */
export type VPNMode = 'server' | 'client';
/**
 * Generic VPN connection instance
 *
 * @remarks
 * Base representation of a VPN connection with common attributes
 */
export interface VPNConnection {
  /** Unique identifier for this VPN connection */
  id: string;
  /** User-defined name for this connection */
  name: string;
  /** Protocol type (wireguard, openvpn, etc.) */
  protocol: VPNProtocol;
  /** Current connection state */
  status: VPNConnectionStatus;
  /** Whether this connection is operationally active */
  isEnabled: boolean;
  /** Timestamp of last successful connection establishment */
  lastConnectedAt?: Date;
}
/**
 * Base interface for all VPN server types
 *
 * @remarks
 * Provides common properties inherited by protocol-specific server implementations
 */
export interface BaseVPNServer {
  /** Unique identifier for this VPN server */
  id: string;
  /** User-defined name for this server */
  name: string;
  /** Whether this server configuration is disabled */
  isDisabled: boolean;
  /** Whether this server is currently running/operational */
  isRunning: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * Base interface for all VPN client types
 *
 * @remarks
 * Provides common properties inherited by protocol-specific client implementations
 */
export interface BaseVPNClient {
  /** Unique identifier for this VPN client */
  id: string;
  /** User-defined name for this client connection */
  name: string;
  /** Whether this client configuration is disabled */
  isDisabled: boolean;
  /** Whether this client is currently connected/operational */
  isRunning: boolean;
  /** Remote VPN server address or hostname to connect to */
  connectTo: string;
  /** Optional username for authentication */
  user?: string;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * WireGuard Interface Configuration
 * Can act as both server and client depending on peer configuration
 *
 * @remarks
 * Represents a WireGuard network interface with cryptographic keys and traffic stats
 */
export interface WireGuardInterface {
  /** Unique identifier for this WireGuard interface */
  id: string;
  /** Interface name (e.g., "wg0", "wg1") */
  name: string;
  /** Whether this interface is currently operational */
  isRunning: boolean;
  /** Whether this interface configuration is disabled */
  isDisabled: boolean;
  /** Maximum Transmission Unit size in bytes */
  mtu: number;
  /** UDP port number for listening to incoming connections */
  listenPort: number;
  /** Public cryptographic key for this interface */
  publicKey: string;
  /** Private cryptographic key (read-only in most contexts) */
  privateKey?: string;
  /** Bytes received on this interface */
  rx?: number;
  /** Bytes transmitted on this interface */
  tx?: number;
  /** Timestamp of last successful peer handshake */
  lastHandshake?: Date;
}
/**
 * WireGuard Peer Configuration
 *
 * @remarks
 * Represents a remote peer configuration for WireGuard tunneling
 */
export interface WireGuardPeer {
  /** Unique identifier for this peer */
  id: string;
  /** WireGuard interface this peer belongs to */
  interface: string;
  /** Peer's public cryptographic key */
  publicKey: string;
  /** Optional pre-shared key for additional security */
  presharedKey?: string;
  /** Peer's endpoint address (hostname or IP) */
  endpoint?: string;
  /** Resolved IP address of the peer endpoint */
  endpointAddress?: string;
  /** UDP port of the peer endpoint */
  endpointPort?: number;
  /** CIDR ranges allowed to be routed through this peer */
  readonly allowedAddress: readonly string[];
  /** Timestamp of last successful handshake with this peer */
  lastHandshake?: Date;
  /** Seconds between keep-alive packets (0 = disabled) */
  persistentKeepalive?: number;
  /** Bytes received from this peer */
  rx?: number;
  /** Bytes transmitted to this peer */
  tx?: number;
  /** Whether this peer is disabled */
  isDisabled?: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * WireGuard Server (interface with incoming peers)
 *
 * @remarks
 * Extends WireGuardInterface with server-specific aggregated peer information
 */
export interface WireGuardServer extends WireGuardInterface {
  /** Number of connected peers */
  peerCount: number;
  /** List of connected peers (optional) */
  peers?: WireGuardPeer[];
}
/**
 * WireGuard Client (peer configuration for outgoing connection)
 *
 * @remarks
 * Simplified client representation with focus on outbound connection parameters
 */
export interface WireGuardClient {
  /** Unique identifier for this WireGuard client */
  id: string;
  /** Client connection name */
  name: string;
  /** WireGuard interface to use for this connection */
  interface: string;
  /** Whether this client configuration is disabled */
  isDisabled: boolean;
  /** Whether this client connection is actively running */
  isRunning: boolean;
  /** Remote server endpoint (IP:port format or hostname) */
  endpoint: string;
  /** Server's public cryptographic key */
  publicKey: string;
  /** CIDR ranges to route through this tunnel */
  readonly allowedAddress: readonly string[];
  /** Seconds between keep-alive packets (0 = disabled) */
  persistentKeepalive?: number;
  /** Bytes received through this tunnel */
  rx?: number;
  /** Bytes transmitted through this tunnel */
  tx?: number;
  /** Timestamp of last successful server handshake */
  lastHandshake?: Date;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * OpenVPN Server Interface
 *
 * @remarks
 * Full OpenVPN server configuration with certificate and encryption settings
 */
export interface OpenVPNServer extends BaseVPNServer {
  /** Protocol identifier */
  type: 'ovpn-server';
  /** TCP/UDP listening port */
  port: number;
  /** Tunneling mode (IP layer 3 or Ethernet layer 2) */
  mode: 'ip' | 'ethernet';
  /** Transport protocol (TCP or UDP) */
  protocol: 'tcp' | 'udp';
  /** Maximum transmission unit size in bytes */
  maxMtu: number;
  /** Network mask for tunnel subnet (optional) */
  netmask?: string;
  /** Default client profile to apply */
  defaultProfile?: string;
  /** Server certificate in PEM format (optional) */
  certificate?: string;
  /** Whether to require client certificates for authentication */
  shouldRequireClientCertificate: boolean;
  /** HMAC authentication algorithm */
  auth: 'md5' | 'sha1' | 'sha256' | 'sha512' | 'null';
  /** Data encryption cipher */
  cipher:
    | 'aes128-cbc'
    | 'aes192-cbc'
    | 'aes256-cbc'
    | 'aes128-gcm'
    | 'aes256-gcm'
    | 'blowfish128'
    | 'null';
  /** Whether IPv6 support is enabled on the tunnel */
  shouldEnableTunIpv6?: boolean;
  /** IPv6 address prefix for tunnel subnet */
  ipv6Prefix?: string;
  /** IPv6 prefix length (number of bits) */
  ipv6PrefixLen?: number;
  /** MAC address for the tunnel interface */
  macAddress?: string;
  /** Keep-alive timeout in seconds */
  keepaliveTimeout?: number;
  /** Routes to push to connecting clients */
  readonly pushedRoutes?: readonly string[];
  /** Gateway redirection mode for client traffic */
  redirectGateway?: 'def1' | 'ipv6' | 'disabled';
}
/**
 * OpenVPN Client Interface
 *
 * @remarks
 * OpenVPN client configuration for connecting to remote servers
 */
export interface OpenVPNClient extends BaseVPNClient {
  /** Protocol identifier */
  type: 'ovpn-client';
  /** Remote server's OpenVPN listening port */
  port: number;
  /** Tunneling mode (IP or Ethernet) */
  mode: 'ip' | 'ethernet';
  /** Transport protocol (TCP or UDP) */
  protocol: 'tcp' | 'udp';
  /** Maximum transmission unit size in bytes */
  maxMtu: number;
  /** Server certificate in PEM format for verification */
  certificate?: string;
  /** Whether to verify server certificate validity */
  shouldVerifyCertificate: boolean;
  /** HMAC authentication algorithm (must match server) */
  auth: 'md5' | 'sha1' | 'sha256' | 'sha512' | 'null';
  /** Data encryption cipher (must match server) */
  cipher:
    | 'aes128-cbc'
    | 'aes192-cbc'
    | 'aes256-cbc'
    | 'aes128-gcm'
    | 'aes256-gcm'
    | 'blowfish128'
    | 'null';
  /** Authentication password (when using username/password auth) */
  password?: string;
  /** Whether to add default route through VPN tunnel */
  shouldAddDefaultRoute: boolean;
  /** Whether to ignore routes pushed by server */
  shouldIgnorePushedRoutes?: boolean;
  /** Bytes received through this tunnel */
  rx?: number;
  /** Bytes transmitted through this tunnel */
  tx?: number;
  /** Human-readable uptime since connection established */
  uptime?: string;
}
/**
 * L2TP Server Interface
 *
 * @remarks
 * Layer 2 Tunneling Protocol server for VPN access
 */
export interface L2TPServer extends BaseVPNServer {
  /** Protocol identifier */
  type: 'l2tp-server';
  /** Whether the L2TP service is operational */
  isEnabled: boolean;
  /** Maximum transmission unit in bytes */
  maxMtu: number;
  /** Maximum receive unit in bytes */
  maxMru: number;
  /** Multilink PPP reassembly unit (optional) */
  mrru?: number;
  /** Supported authentication methods */
  readonly authentication: readonly ('mschap1' | 'mschap2' | 'chap' | 'pap')[];
  /** Default client profile to apply */
  defaultProfile?: string;
  /** Whether IPsec encapsulation is enabled */
  shouldUseIpsec: boolean;
  /** IPsec pre-shared secret for tunnel protection */
  ipsecSecret?: string;
  /** Whether to enable fast path (hardware offload) */
  shouldAllowFastPath: boolean;
  /** How to identify callers (by IP or number) */
  callerIdType?: 'ip-address' | 'number';
  /** Whether to limit one session per client host */
  shouldLimitOneSessionPerHost?: boolean;
  /** Maximum concurrent client sessions allowed */
  maxSessions?: number;
  /** Number of currently accepted connections */
  acceptedConnections?: number;
}
/**
 * L2TP Client Interface
 *
 * @remarks
 * L2TP client for connecting to remote L2TP servers
 */
export interface L2TPClient extends BaseVPNClient {
  /** Protocol identifier */
  type: 'l2tp-client';
  /** Maximum transmission unit in bytes */
  maxMtu: number;
  /** Maximum receive unit in bytes */
  maxMru: number;
  /** Multilink PPP reassembly unit (optional) */
  mrru?: number;
  /** Authentication password */
  password?: string;
  /** Client profile to use */
  profile?: string;
  /** Whether IPsec encapsulation is enabled */
  shouldUseIpsec: boolean;
  /** IPsec pre-shared secret for tunnel protection */
  ipsecSecret?: string;
  /** Whether to enable fast path (hardware offload) */
  shouldAllowFastPath: boolean;
  /** Whether to add default route through VPN tunnel */
  shouldAddDefaultRoute: boolean;
  /** Whether to dial on demand instead of persistent connection */
  shouldDialOnDemand?: boolean;
  /** Bytes received through this tunnel */
  rx?: number;
  /** Bytes transmitted through this tunnel */
  tx?: number;
  /** Human-readable uptime since connection established */
  uptime?: string;
  /** Local IP address assigned by server */
  localAddress?: string;
  /** Remote server's IP address in tunnel */
  remoteAddress?: string;
}
/**
 * Legacy L2TP Interface (for backward compatibility)
 *
 * @deprecated Use L2TPServer or L2TPClient instead
 *
 * @remarks
 * Retained for backward compatibility with legacy code
 */
export interface L2TPInterface {
  /** Unique identifier */
  id: string;
  /** Interface name */
  name: string;
  /** Protocol identifier */
  type: 'l2tp';
  /** Whether this interface is disabled */
  isDisabled: boolean;
  /** Whether this interface is running */
  isRunning: boolean;
  /** Remote server address to connect to */
  connectTo: string;
  /** Authentication username */
  user?: string;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * PPTP Server Interface
 *
 * @remarks
 * Point-to-Point Tunneling Protocol server configuration
 */
export interface PPTPServer extends BaseVPNServer {
  /** Protocol identifier */
  type: 'pptp-server';
  /** Whether the PPTP service is operational */
  isEnabled: boolean;
  /** Maximum transmission unit in bytes */
  maxMtu: number;
  /** Maximum receive unit in bytes */
  maxMru: number;
  /** Multilink PPP reassembly unit (optional) */
  mrru?: number;
  /** Supported authentication methods */
  readonly authentication: readonly ('mschap1' | 'mschap2' | 'chap' | 'pap')[];
  /** Default client profile to apply */
  defaultProfile?: string;
  /** Keep-alive timeout in seconds */
  keepaliveTimeout?: number;
  /** Number of currently accepted connections */
  acceptedConnections?: number;
}
/**
 * PPTP Client Interface
 *
 * @remarks
 * PPTP client configuration for connecting to remote servers
 */
export interface PPTPClient extends BaseVPNClient {
  /** Protocol identifier */
  type: 'pptp-client';
  /** Maximum transmission unit in bytes */
  maxMtu: number;
  /** Maximum receive unit in bytes */
  maxMru: number;
  /** Multilink PPP reassembly unit (optional) */
  mrru?: number;
  /** Authentication password */
  password?: string;
  /** Client profile to use */
  profile?: string;
  /** Whether to add default route through VPN tunnel */
  shouldAddDefaultRoute: boolean;
  /** Whether to dial on demand instead of persistent connection */
  shouldDialOnDemand?: boolean;
  /** Bytes received through this tunnel */
  rx?: number;
  /** Bytes transmitted through this tunnel */
  tx?: number;
  /** Human-readable uptime since connection established */
  uptime?: string;
  /** Local IP address assigned by server */
  localAddress?: string;
  /** Remote server's IP address in tunnel */
  remoteAddress?: string;
}
/**
 * Legacy PPTP Interface (for backward compatibility)
 *
 * @deprecated Use PPTPServer or PPTPClient instead
 *
 * @remarks
 * Retained for backward compatibility with legacy code
 */
export interface PPTPInterface {
  /** Unique identifier */
  id: string;
  /** Interface name */
  name: string;
  /** Protocol identifier */
  type: 'pptp';
  /** Whether this interface is disabled */
  isDisabled: boolean;
  /** Whether this interface is running */
  isRunning: boolean;
  /** Remote server address to connect to */
  connectTo: string;
  /** Authentication username */
  user?: string;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * SSTP Server Interface
 *
 * @remarks
 * Secure Socket Tunneling Protocol server with TLS encryption
 */
export interface SSTPServer extends BaseVPNServer {
  /** Protocol identifier */
  type: 'sstp-server';
  /** Whether the SSTP service is operational */
  isEnabled: boolean;
  /** HTTPS listening port */
  port: number;
  /** Maximum transmission unit in bytes */
  maxMtu: number;
  /** Maximum receive unit in bytes */
  maxMru: number;
  /** Multilink PPP reassembly unit (optional) */
  mrru?: number;
  /** Supported authentication methods */
  readonly authentication: readonly ('mschap1' | 'mschap2' | 'chap' | 'pap')[];
  /** Default client profile to apply */
  defaultProfile?: string;
  /** Server certificate in PEM format */
  certificate?: string;
  /** Whether certificate is PEM-encoded (vs DER) */
  hasPemEncoding: boolean;
  /** Whether to require and verify client certificates */
  shouldVerifyClientCertificate: boolean;
  /** Minimum TLS version to accept */
  tlsVersion: 'any' | 'only-1.2';
  /** Number of currently accepted connections */
  acceptedConnections?: number;
  /** Whether to force AES encryption */
  shouldForceAes?: boolean;
}
/**
 * SSTP Client Interface
 *
 * @remarks
 * SSTP client for connecting to remote SSTP servers over HTTPS
 */
export interface SSTPClient extends BaseVPNClient {
  /** Protocol identifier */
  type: 'sstp-client';
  /** Remote server's HTTPS port */
  port: number;
  /** Maximum transmission unit in bytes */
  maxMtu: number;
  /** Maximum receive unit in bytes */
  maxMru: number;
  /** Multilink PPP reassembly unit (optional) */
  mrru?: number;
  /** Authentication password */
  password?: string;
  /** Client profile to use */
  profile?: string;
  /** Server certificate in PEM format for verification */
  certificate?: string;
  /** Whether to verify server certificate validity */
  shouldVerifyServerCertificate: boolean;
  /** Whether to verify server address matches certificate CN */
  shouldVerifyServerAddressFromCertificate: boolean;
  /** Minimum TLS version to accept */
  tlsVersion: 'any' | 'only-1.2';
  /** Whether certificate is PEM-encoded (vs DER) */
  hasPemEncoding: boolean;
  /** Whether to add default route through VPN tunnel */
  shouldAddDefaultRoute: boolean;
  /** Whether to dial on demand instead of persistent connection */
  shouldDialOnDemand?: boolean;
  /** HTTP proxy address (for corporate firewall bypass) */
  httpProxy?: string;
  /** HTTP proxy port */
  httpProxyPort?: number;
  /** Bytes received through this tunnel */
  rx?: number;
  /** Bytes transmitted through this tunnel */
  tx?: number;
  /** Human-readable uptime since connection established */
  uptime?: string;
  /** Local IP address assigned by server */
  localAddress?: string;
  /** Remote server's IP address in tunnel */
  remoteAddress?: string;
}
/**
 * Legacy SSTP Interface (for backward compatibility)
 *
 * @deprecated Use SSTPServer or SSTPClient instead
 *
 * @remarks
 * Retained for backward compatibility with legacy code
 */
export interface SSSTPInterface {
  /** Unique identifier */
  id: string;
  /** Interface name */
  name: string;
  /** Protocol identifier */
  type: 'sstp';
  /** Whether this interface is disabled */
  isDisabled: boolean;
  /** Whether this interface is running */
  isRunning: boolean;
  /** Remote server address to connect to */
  connectTo: string;
  /** Authentication username */
  user?: string;
  /** Whether to verify server certificate */
  shouldVerifyServerCertificate?: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * IPsec Profile (used by IKEv2)
 *
 * @remarks
 * Configuration profile defining cryptographic algorithms and key exchange parameters
 */
export interface IPsecProfile {
  /** Unique identifier for this profile */
  id: string;
  /** Profile name */
  name: string;
  /** Supported hash algorithms for integrity */
  readonly hashAlgorithm: readonly ('md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512')[];
  /** Supported encryption algorithms */
  readonly encAlgorithm: readonly (
    | 'des'
    | '3des'
    | 'aes-128-cbc'
    | 'aes-192-cbc'
    | 'aes-256-cbc'
    | 'aes-128-gcm'
    | 'aes-256-gcm'
  )[];
  /** Supported Diffie-Hellman groups */
  readonly dhGroup: readonly (
    | 'modp768'
    | 'modp1024'
    | 'modp1536'
    | 'modp2048'
    | 'modp3072'
    | 'modp4096'
    | 'ecp256'
    | 'ecp384'
    | 'ecp521'
  )[];
  /** Key lifetime (e.g., "1d" for 1 day) */
  lifetime: string;
  /** Dead Peer Detection interval */
  dpdInterval?: string;
  /** Maximum DPD failures before closing tunnel */
  dpdMaxFailures?: number;
  /** Whether to enable NAT traversal */
  shouldEnableNatTraversal: boolean;
  /** How to check protocol proposals */
  proposalCheck: 'obey' | 'strict' | 'claim' | 'exact';
}
/**
 * IPsec Peer (IKEv2 remote endpoint)
 *
 * @remarks
 * Remote peer configuration for IPsec tunnel establishment
 */
export interface IPsecPeer {
  /** Unique identifier for this peer */
  id: string;
  /** Peer name */
  name: string;
  /** Peer IP address or hostname */
  address: string;
  /** IPsec profile to use */
  profile: string;
  /** IKE exchange mode */
  exchangeMode: 'ike2' | 'main' | 'main-l2tp' | 'aggressive';
  /** Whether this peer uses passive mode (responder only) */
  isPassive: boolean;
  /** Whether to send initial contact payload */
  shouldSendInitialContact: boolean;
  /** Local IP address to use for connection */
  localAddress?: string;
  /** Remote peer's IKE port */
  port: number;
  /** Whether this peer configuration is disabled */
  isDisabled: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * IPsec Policy
 *
 * @remarks
 * Security policy specifying which traffic gets encrypted
 */
export interface IPsecPolicy {
  /** Unique identifier for this policy */
  id: string;
  /** Associated peer name */
  peer: string;
  /** Source IP address or network in CIDR notation */
  srcAddress: string;
  /** Destination IP address or network in CIDR notation */
  dstAddress: string;
  /** Protocol to protect (all/tcp/udp/icmp or number) */
  protocol?: 'all' | 'tcp' | 'udp' | 'icmp' | number;
  /** Source port or port range */
  srcPort?: string;
  /** Destination port or port range */
  dstPort?: string;
  /** Action for matching traffic */
  action: 'encrypt' | 'none' | 'discard';
  /** Policy enforcement level */
  level: 'require' | 'unique' | 'use';
  /** IPsec protocols to use (ESP for encryption, AH for authentication) */
  readonly ipsecProtocols: readonly ('esp' | 'ah')[];
  /** Whether this is a tunnel (vs transport) mode policy */
  isTunnel: boolean;
  /** Proposal name (optional) */
  proposal?: string;
  /** Whether this policy is disabled */
  isDisabled: boolean;
  /** Whether this policy currently has active connections */
  isActive?: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * IPsec Identity
 *
 * @remarks
 * Defines identity and authentication credentials for a peer
 */
export interface IPsecIdentity {
  /** Unique identifier for this identity */
  id: string;
  /** Associated peer name */
  peer: string;
  /** Authentication method */
  authMethod:
    | 'pre-shared-key'
    | 'digital-signature'
    | 'pre-shared-key-xauth'
    | 'eap'
    | 'eap-radius';
  /** Shared secret (for PSK authentication) */
  secret?: string;
  /** Local certificate in PEM format */
  certificate?: string;
  /** Remote peer's certificate in PEM format */
  remoteCertificate?: string;
  /** Local identity string */
  myId?: string;
  /** Remote peer's identity string */
  remoteId?: string;
  /** How to match identities */
  matchBy: 'remote-id' | 'certificate';
  /** Username (for XAUTH/EAP methods) */
  username?: string;
  /** Password (for XAUTH/EAP methods) */
  password?: string;
  /** Whether this identity is disabled */
  isDisabled: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * IPsec Active Connection
 *
 * @remarks
 * Current state of an active IPsec tunnel
 */
export interface IPsecActiveConnection {
  /** Unique identifier for this connection */
  id: string;
  /** Associated peer name */
  peer: string;
  /** Current tunnel state */
  state: 'established' | 'connecting' | 'dying';
  /** Whether we initiated or are responding to the connection */
  side: 'initiator' | 'responder';
  /** Number of active IPsec SAs (Phase 2) */
  phase2Count: number;
  /** Our local IP address in this tunnel */
  localAddress: string;
  /** Peer's remote IP address in this tunnel */
  remoteAddress: string;
  /** Bytes received through this tunnel */
  rx?: number;
  /** Bytes transmitted through this tunnel */
  tx?: number;
  /** Human-readable uptime since tunnel established */
  uptime?: string;
}
/**
 * IKEv2 Server Configuration (composite)
 *
 * @remarks
 * Complete IKEv2 server configuration aggregating profile, peers, policies, and connections
 */
export interface IKEv2Server {
  /** Unique identifier for this server */
  id: string;
  /** Server name */
  name: string;
  /** Protocol identifier */
  type: 'ikev2-server';
  /** Whether this server configuration is disabled */
  isDisabled: boolean;
  /** Whether the server is currently running */
  isRunning: boolean;
  /** Cryptographic profile for this server */
  profile: IPsecProfile;
  /** List of remote peers this server accepts connections from */
  readonly peers: readonly IPsecPeer[];
  /** Security policies governing traffic encryption */
  readonly policies: readonly IPsecPolicy[];
  /** Identity and authentication configurations for peers */
  readonly identities: readonly IPsecIdentity[];
  /** Currently active tunnels to remote peers */
  readonly activeConnections: readonly IPsecActiveConnection[];
  /** Optional administrative comment */
  comment?: string;
}
/**
 * IKEv2 Client Configuration (composite)
 *
 * @remarks
 * Complete IKEv2 client configuration for connecting to a server
 */
export interface IKEv2Client {
  /** Unique identifier for this client */
  id: string;
  /** Client connection name */
  name: string;
  /** Protocol identifier */
  type: 'ikev2-client';
  /** Whether this client configuration is disabled */
  isDisabled: boolean;
  /** Whether the client is currently connected */
  isRunning: boolean;
  /** Remote server address to connect to */
  connectTo: string;
  /** IPsec profile to use */
  profile: string;
  /** Identity and credentials for authentication */
  identity: IPsecIdentity;
  /** Security policy for this tunnel */
  policy: IPsecPolicy;
  /** Currently active tunnel to remote server (if connected) */
  activeConnection?: IPsecActiveConnection;
  /** Bytes received through this tunnel */
  rx?: number;
  /** Bytes transmitted through this tunnel */
  tx?: number;
  /** Human-readable uptime since tunnel established */
  uptime?: string;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * Legacy OpenVPN configuration (for backward compatibility)
 *
 * @deprecated Use OpenVPNServer or OpenVPNClient instead
 *
 * @remarks
 * Retained for backward compatibility with legacy configurations
 */
export interface OpenVPNConfig {
  /** Unique identifier */
  id: string;
  /** Configuration name */
  name: string;
  /** Whether this configuration is active */
  isEnabled: boolean;
  /** Transport protocol */
  protocol: 'tcp' | 'udp';
  /** Remote server port */
  port: number;
  /** Server address or hostname */
  server?: string;
  /** Path to configuration file */
  configFile?: string;
}
/**
 * Legacy L2TP configuration (for backward compatibility)
 *
 * @deprecated Use L2TPServer or L2TPClient instead
 *
 * @remarks
 * Retained for backward compatibility with legacy configurations
 */
export interface L2TPConfig {
  /** Unique identifier */
  id: string;
  /** Configuration name */
  name: string;
  /** Whether this configuration is active */
  isEnabled: boolean;
  /** Remote server address */
  server: string;
  /** Authentication username */
  username: string;
  /** Authentication password */
  password: string;
  /** Optional IPsec secret */
  secret?: string;
}
/**
 * Legacy PPTP configuration (for backward compatibility)
 *
 * @deprecated Use PPTPServer or PPTPClient instead
 *
 * @remarks
 * Retained for backward compatibility with legacy configurations
 */
export interface PPTPConfig {
  /** Unique identifier */
  id: string;
  /** Configuration name */
  name: string;
  /** Whether this configuration is active */
  isEnabled: boolean;
  /** Remote server address */
  server: string;
  /** Authentication username */
  username: string;
  /** Authentication password */
  password: string;
  /** MPPE encryption level */
  encryption: 'none' | '40bit' | '128bit' | '256bit';
}
/**
 * Legacy SSTP configuration (for backward compatibility)
 *
 * @deprecated Use SSTPServer or SSTPClient instead
 *
 * @remarks
 * Retained for backward compatibility with legacy configurations
 */
export interface SSSTPConfig {
  /** Unique identifier */
  id: string;
  /** Configuration name */
  name: string;
  /** Whether this configuration is active */
  isEnabled: boolean;
  /** Remote server address */
  server: string;
  /** Authentication username */
  username: string;
  /** Authentication password */
  password: string;
  /** Whether to verify server certificate */
  shouldVerifyServerCertificate: boolean;
}
/**
 * Legacy IKEv2 configuration (for backward compatibility)
 *
 * @deprecated Use IKEv2Server or IKEv2Client instead
 *
 * @remarks
 * Retained for backward compatibility with legacy configurations
 */
export interface IKEv2Config {
  /** Unique identifier */
  id: string;
  /** Configuration name */
  name: string;
  /** Whether this configuration is active */
  isEnabled: boolean;
  /** Remote server address */
  server: string;
  /** Authentication username */
  username: string;
  /** Authentication password */
  password: string;
  /** Encryption algorithm strength */
  encryptionAlgorithm: 'aes128' | 'aes192' | 'aes256';
}
/**
 * Union type for all VPN server implementations
 *
 * @remarks
 * Type discriminant is the `type` field on each server interface
 *
 * @example
 * ```typescript
 * const server: VPNServerType = { type: 'wireguard-server', ... };
 * ```
 */
export type VPNServerType =
  | WireGuardServer
  | OpenVPNServer
  | L2TPServer
  | PPTPServer
  | SSTPServer
  | IKEv2Server;
/**
 * Union type for all VPN client implementations
 *
 * @remarks
 * Type discriminant is the `type` field on each client interface
 *
 * @example
 * ```typescript
 * const client: VPNClientType = { type: 'wireguard-client', ... };
 * ```
 */
export type VPNClientType =
  | WireGuardClient
  | OpenVPNClient
  | L2TPClient
  | PPTPClient
  | SSTPClient
  | IKEv2Client;
/**
 * Union type for all legacy VPN interface types
 *
 * @deprecated Use VPNServerType or VPNClientType instead
 *
 * @remarks
 * Retained for backward compatibility with legacy code
 */
export type VPNInterface = L2TPInterface | PPTPInterface | SSSTPInterface;
/**
 * Union type for all VPN configurations
 *
 * @remarks
 * Includes both modern protocol implementations and legacy config formats
 */
export type VPNConfig =
  | WireGuardInterface
  | OpenVPNConfig
  | L2TPConfig
  | PPTPConfig
  | SSSTPConfig
  | IKEv2Config;
/**
 * Statistics for a single VPN protocol
 *
 * @remarks
 * Aggregated metrics across all servers and clients of a specific protocol
 */
export interface VPNProtocolStats {
  /** Protocol type being measured */
  protocol: VPNProtocol;
  /** Total number of server instances */
  serverCount: number;
  /** Total number of client instances */
  clientCount: number;
  /** Number of currently active server connections */
  activeServerConnections: number;
  /** Number of currently active client connections */
  activeClientConnections: number;
  /** Total bytes received across all connections */
  totalRx: number;
  /** Total bytes transmitted across all connections */
  totalTx: number;
}
/**
 * Overall VPN subsystem dashboard statistics
 *
 * @remarks
 * Comprehensive overview of all VPN servers, clients, and health status
 */
export interface VPNDashboardStats {
  /** Total number of configured servers across all protocols */
  totalServers: number;
  /** Total number of configured clients across all protocols */
  totalClients: number;
  /** Number of currently operational servers */
  activeServers: number;
  /** Number of currently operational clients */
  activeClients: number;
  /** Number of active server-side connections */
  totalServerConnections: number;
  /** Number of active client-side connections */
  totalClientConnections: number;
  /** Total bytes received across all VPN tunnels */
  totalRx: number;
  /** Total bytes transmitted across all VPN tunnels */
  totalTx: number;
  /** Statistics broken down by protocol type */
  readonly protocolStats: readonly VPNProtocolStats[];
  /** Overall health status of VPN subsystem */
  overallHealth: 'healthy' | 'warning' | 'critical';
  /** List of current issues or warnings */
  readonly issues: readonly VPNIssue[];
  /** Recent connection and configuration events */
  readonly recentEvents: readonly VPNEvent[];
  /** When these statistics were last calculated */
  lastUpdated: Date;
}
/**
 * VPN issue or warning notification
 *
 * @remarks
 * Represents a detected problem or warning condition in the VPN subsystem
 */
export interface VPNIssue {
  /** Unique identifier for this issue */
  id: string;
  /** Severity level (warning or error) */
  severity: 'warning' | 'error';
  /** VPN protocol affected */
  protocol: VPNProtocol;
  /** Type of entity with the issue (server or client) */
  entityType: 'server' | 'client';
  /** Name of the specific server or client */
  entityName: string;
  /** Human-readable description of the issue */
  message: string;
  /** When this issue was detected */
  timestamp: Date;
}
/**
 * VPN event for audit trail and history
 *
 * @remarks
 * Records connection state changes and configuration modifications
 */
export interface VPNEvent {
  /** Unique identifier for this event */
  id: string;
  /** Type of event that occurred */
  type: 'connected' | 'disconnected' | 'error' | 'created' | 'modified' | 'deleted';
  /** Protocol affected by this event */
  protocol: VPNProtocol;
  /** Type of entity (server or client) */
  entityType: 'server' | 'client';
  /** Name of the specific server or client */
  entityName: string;
  /** Optional additional details about the event */
  details?: string;
  /** When this event occurred */
  timestamp: Date;
}
/**
 * Single data point for VPN traffic visualization
 *
 * @remarks
 * Represents bandwidth measurements at a specific point in time
 */
export interface VPNTrafficDataPoint {
  /** Measurement timestamp */
  timestamp: Date;
  /** Bytes received in this period */
  rx: number;
  /** Bytes transmitted in this period */
  tx: number;
}
/**
 * Historical VPN traffic data for charting
 *
 * @remarks
 * Time-series data for visualizing VPN bandwidth usage over time
 */
export interface VPNTrafficHistory {
  /** Protocol being measured (optional, if showing all protocols) */
  protocol?: VPNProtocol;
  /** Sequence of traffic measurements */
  readonly dataPoints: readonly VPNTrafficDataPoint[];
  /** Time granularity of the data points */
  interval: 'minute' | 'hour' | 'day';
}
/**
 * PPP Profile (used by L2TP, PPTP, SSTP servers)
 *
 * @remarks
 * Reusable profile for configuring PPP connection behavior on VPN servers
 */
export interface PPPProfile {
  /** Unique identifier for this profile */
  id: string;
  /** Profile name */
  name: string;
  /** Local IP address to assign to clients (optional, use pool if not set) */
  localAddress?: string;
  /** Remote IP address for clients (optional) */
  remoteAddress?: string;
  /** DNS server address to push to clients */
  dnsServer?: string;
  /** Bridge learning behavior for this profile */
  bridgeLearning?: 'default' | 'no' | 'yes';
  /** Whether to enable PPP compression */
  shouldUseCompression?: 'default' | 'no' | 'yes';
  /** Encryption requirement for connections using this profile */
  shouldUseEncryption?: 'default' | 'no' | 'yes' | 'required';
  /** Whether to support IPv6 on connections using this profile */
  shouldUseIpv6?: 'default' | 'no' | 'yes' | 'required';
  /** Bandwidth rate limit (e.g., "1M" for 1 Mbps) */
  rateLimit?: string;
  /** Maximum session duration before disconnection */
  sessionTimeout?: string;
  /** Idle timeout before disconnection */
  idleTimeout?: string;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * PPP Secret (VPN user credentials)
 *
 * @remarks
 * User account for authentication on PPP-based VPN servers
 */
export interface PPPSecret {
  /** Unique identifier for this user account */
  id: string;
  /** Username for authentication */
  name: string;
  /** Password for authentication */
  password?: string;
  /** Which services this user can access */
  service: 'any' | 'pppoe' | 'pptp' | 'l2tp' | 'sstp' | 'ovpn';
  /** Caller ID (phone number or identifier) */
  callerId?: string;
  /** Associated PPP profile */
  profile?: string;
  /** Local IP address to assign to this user */
  localAddress?: string;
  /** Remote IP address for this user */
  remoteAddress?: string;
  /** Static routes to assign to this user */
  routes?: string;
  /** Download traffic limit in bytes */
  limitBytesIn?: number;
  /** Upload traffic limit in bytes */
  limitBytesOut?: number;
  /** Whether this account is disabled */
  isDisabled: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * PPP Active Connection
 *
 * @remarks
 * Currently active connection from a PPP user
 */
export interface PPPActiveConnection {
  /** Unique identifier for this connection */
  id: string;
  /** Username of the connected user */
  name: string;
  /** Which service type this connection uses */
  service: 'pptp' | 'l2tp' | 'sstp' | 'ovpn' | 'pppoe';
  /** Caller ID (phone number or identifier) */
  callerId?: string;
  /** Assigned IP address for this connection */
  address: string;
  /** How long this connection has been active */
  uptime: string;
  /** Encoding scheme used (e.g., "raw", "compressed") */
  encoding?: string;
  /** PPP session identifier */
  sessionId?: string;
  /** Download traffic limit in bytes */
  limitBytesIn?: number;
  /** Upload traffic limit in bytes */
  limitBytesOut?: number;
  /** Bytes received from this connection */
  rx: number;
  /** Bytes transmitted to this connection */
  tx: number;
}
/**
 * Form input for creating/updating WireGuard server
 *
 * @remarks
 * Minimal required fields for server creation; key material can be auto-generated
 */
export interface WireGuardServerInput {
  /** Server interface name */
  name: string;
  /** UDP port for listening */
  listenPort: number;
  /** Maximum transmission unit (optional, defaults to 1500) */
  mtu?: number;
  /** Private key (optional, will be generated if not provided) */
  privateKey?: string;
  /** Whether to initially disable this server */
  isDisabled?: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * Form input for creating/updating WireGuard peer
 *
 * @remarks
 * Minimal required fields for peer configuration
 */
export interface WireGuardPeerInput {
  /** WireGuard interface to add peer to */
  interface: string;
  /** Peer's public cryptographic key */
  publicKey: string;
  /** Optional pre-shared key for additional security */
  presharedKey?: string;
  /** Peer's endpoint (address or hostname) */
  endpoint?: string;
  /** CIDR ranges allowed through this peer */
  allowedAddress: string[];
  /** Keep-alive interval in seconds */
  persistentKeepalive?: number;
  /** Whether to initially disable this peer */
  isDisabled?: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * Form input for creating/updating OpenVPN server
 *
 * @remarks
 * Minimal required fields for OpenVPN server creation
 */
export interface OpenVPNServerInput {
  /** Server name */
  name: string;
  /** Listening port */
  port: number;
  /** Tunneling mode (IP or Ethernet) */
  mode: 'ip' | 'ethernet';
  /** Transport protocol (TCP or UDP) */
  protocol: 'tcp' | 'udp';
  /** Maximum transmission unit in bytes */
  maxMtu?: number;
  /** Server certificate in PEM format */
  certificate?: string;
  /** Whether client certificates are required */
  shouldRequireClientCertificate?: boolean;
  /** HMAC authentication algorithm */
  auth?: 'md5' | 'sha1' | 'sha256' | 'sha512' | 'null';
  /** Encryption cipher */
  cipher?:
    | 'aes128-cbc'
    | 'aes192-cbc'
    | 'aes256-cbc'
    | 'aes128-gcm'
    | 'aes256-gcm'
    | 'blowfish128'
    | 'null';
  /** Default profile for clients */
  defaultProfile?: string;
  /** Whether to initially disable this server */
  isDisabled?: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * Form input for creating/updating OpenVPN client
 *
 * @remarks
 * Minimal required fields for OpenVPN client creation
 */
export interface OpenVPNClientInput {
  /** Client connection name */
  name: string;
  /** Remote server address */
  connectTo: string;
  /** Remote server port */
  port: number;
  /** Tunneling mode (IP or Ethernet) */
  mode: 'ip' | 'ethernet';
  /** Transport protocol (TCP or UDP) */
  protocol: 'tcp' | 'udp';
  /** Optional username for authentication */
  user?: string;
  /** Optional password for authentication */
  password?: string;
  /** Server certificate for verification */
  certificate?: string;
  /** Whether to verify server certificate */
  shouldVerifyCertificate?: boolean;
  /** HMAC authentication algorithm */
  auth?: 'md5' | 'sha1' | 'sha256' | 'sha512' | 'null';
  /** Encryption cipher */
  cipher?:
    | 'aes128-cbc'
    | 'aes192-cbc'
    | 'aes256-cbc'
    | 'aes128-gcm'
    | 'aes256-gcm'
    | 'blowfish128'
    | 'null';
  /** Whether to add default route */
  shouldAddDefaultRoute?: boolean;
  /** Whether to initially disable this client */
  isDisabled?: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * Form input for creating/updating L2TP/PPTP/SSTP client
 *
 * @remarks
 * Unified input for PPP-based VPN client protocols
 */
export interface PPPClientInput {
  /** Client connection name */
  name: string;
  /** Remote server address */
  connectTo: string;
  /** Optional username for authentication */
  user?: string;
  /** Optional password for authentication */
  password?: string;
  /** PPP profile to apply */
  profile?: string;
  /** Whether to add default route */
  shouldAddDefaultRoute?: boolean;
  /** Whether to enable IPsec encapsulation */
  shouldUseIpsec?: boolean;
  /** IPsec pre-shared secret */
  ipsecSecret?: string;
  /** Whether to initially disable this client */
  isDisabled?: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * Form input for enabling/configuring L2TP/PPTP/SSTP server
 *
 * @remarks
 * Unified input for PPP-based VPN server configuration
 */
export interface PPPServerInput {
  /** Whether to enable the PPP service */
  isEnabled: boolean;
  /** Default PPP profile for new connections */
  defaultProfile?: string;
  /** Supported authentication methods */
  authentication?: ('mschap1' | 'mschap2' | 'chap' | 'pap')[];
  /** Whether to enable IPsec encapsulation */
  shouldUseIpsec?: boolean;
  /** IPsec pre-shared secret */
  ipsecSecret?: string;
  /** Maximum transmission unit in bytes */
  maxMtu?: number;
  /** Maximum receive unit in bytes */
  maxMru?: number;
}
/**
 * Form input for creating/updating IPsec peer (IKEv2)
 *
 * @remarks
 * Minimal required fields for IPsec peer configuration
 */
export interface IPsecPeerInput {
  /** Peer name */
  name: string;
  /** Peer IP address or hostname */
  address: string;
  /** IPsec profile to use */
  profile?: string;
  /** IKE exchange mode */
  exchangeMode?: 'ike2' | 'main' | 'aggressive';
  /** Whether to use passive mode */
  isPassive?: boolean;
  /** Local IP address to use */
  localAddress?: string;
  /** Peer's IKE port */
  port?: number;
  /** Whether to initially disable this peer */
  isDisabled?: boolean;
  /** Optional administrative comment */
  comment?: string;
}
/**
 * Form input for creating/updating IPsec identity
 *
 * @remarks
 * Minimal required fields for IPsec identity configuration
 */
export interface IPsecIdentityInput {
  /** Associated peer name */
  peer: string;
  /** Authentication method */
  authMethod: 'pre-shared-key' | 'digital-signature' | 'eap';
  /** Shared secret (for PSK auth) */
  secret?: string;
  /** Local certificate (for digital signature) */
  certificate?: string;
  /** Local identity string */
  myId?: string;
  /** Expected remote identity string */
  remoteId?: string;
  /** Username (for EAP) */
  username?: string;
  /** Password (for EAP) */
  password?: string;
  /** Whether to initially disable this identity */
  isDisabled?: boolean;
  /** Optional administrative comment */
  comment?: string;
}
//# sourceMappingURL=vpn.d.ts.map
