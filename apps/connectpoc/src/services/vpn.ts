import { makeRouterOSRequest } from './api';

import type { 
  ApiResponse,
  WireGuardInterface,
  WireGuardPeer,
  IPSecProfile,
  IPSecPeer,
  IPSecPolicy,
  L2TPServer,
  L2TPClient,
  PPTPServer,
  SSTPServer,
  OpenVPNServer,
  PPPProfile
} from '@shared/routeros';

/**
 * VPN management service for MikroTik RouterOS
 * Handles WireGuard, IPSec, L2TP, PPTP, SSTP, and OpenVPN configurations
 * 
 * RouterOS VPN REST API endpoints:
 * - /rest/interface/wireguard - WireGuard interfaces
 * - /rest/interface/wireguard/peers - WireGuard peers
 * - /rest/ip/ipsec/profile - IPSec profiles
 * - /rest/ip/ipsec/peer - IPSec peers
 * - /rest/ip/ipsec/policy - IPSec policies
 * - /rest/interface/l2tp-server - L2TP server
 * - /rest/interface/l2tp-client - L2TP clients
 * - /rest/interface/pptp-server - PPTP server
 * - /rest/interface/sstp-server - SSTP server
 * - /rest/interface/ovpn-server - OpenVPN server
 * - /rest/ppp/profile - PPP profiles
 */

/**
 * ============================================
 * WireGuard VPN Management
 * ============================================
 */

/**
 * Get all WireGuard interfaces
 * REST API endpoint: /rest/interface/wireguard
 */
export const getWireGuardInterfaces = async (
  routerIp: string
): Promise<ApiResponse<WireGuardInterface[]>> => {
  return makeRouterOSRequest<WireGuardInterface[]>(routerIp, 'interface/wireguard');
};

/**
 * Create a new WireGuard interface
 * REST API endpoint: /rest/interface/wireguard
 */
export const createWireGuardInterface = async (
  routerIp: string,
  config: Partial<WireGuardInterface>
): Promise<ApiResponse<{ id: string }>> => {
  // Generate keys if not provided
  const mutableConfig = { ...config };
  if (!mutableConfig.privateKey) {
    const keys = await generateWireGuardKeys(routerIp);
    if (keys.success && keys.data) {
      mutableConfig.privateKey = keys.data.privateKey;
      mutableConfig.publicKey = keys.data.publicKey;
    }
  }
  config = mutableConfig;
  
  const routerOSConfig = convertToRouterOSFormat(config);
  
  return makeRouterOSRequest<{ id: string }>(
    routerIp,
    'interface/wireguard',
    {
      method: 'PUT',
      body: routerOSConfig,
    }
  );
};

/**
 * Update WireGuard interface
 * REST API endpoint: /rest/interface/wireguard/{id}
 */
export const updateWireGuardInterface = async (
  routerIp: string,
  interfaceId: string,
  config: Partial<WireGuardInterface>
): Promise<ApiResponse<void>> => {
  const routerOSConfig = convertToRouterOSFormat(config);
  
  return makeRouterOSRequest<void>(
    routerIp,
    `interface/wireguard/${interfaceId}`,
    {
      method: 'PATCH',
      body: routerOSConfig,
    }
  );
};

/**
 * Delete WireGuard interface
 * REST API endpoint: /rest/interface/wireguard/{id}
 */
export const deleteWireGuardInterface = async (
  routerIp: string,
  interfaceId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(
    routerIp,
    `interface/wireguard/${interfaceId}`,
    {
      method: 'DELETE',
    }
  );
};

/**
 * Get WireGuard peers
 * REST API endpoint: /rest/interface/wireguard/peers
 */
export const getWireGuardPeers = async (
  routerIp: string
): Promise<ApiResponse<WireGuardPeer[]>> => {
  return makeRouterOSRequest<WireGuardPeer[]>(routerIp, 'interface/wireguard/peers');
};

/**
 * Add WireGuard peer
 * REST API endpoint: /rest/interface/wireguard/peers
 */
export const addWireGuardPeer = async (
  routerIp: string,
  peer: Partial<WireGuardPeer>
): Promise<ApiResponse<{ id: string }>> => {
  const routerOSPeer = convertToRouterOSFormat(peer);
  
  return makeRouterOSRequest<{ id: string }>(
    routerIp,
    'interface/wireguard/peers',
    {
      method: 'PUT',
      body: routerOSPeer,
    }
  );
};

/**
 * Update WireGuard peer
 * REST API endpoint: /rest/interface/wireguard/peers/{id}
 */
export const updateWireGuardPeer = async (
  routerIp: string,
  peerId: string,
  peer: Partial<WireGuardPeer>
): Promise<ApiResponse<void>> => {
  const routerOSPeer = convertToRouterOSFormat(peer);
  
  return makeRouterOSRequest<void>(
    routerIp,
    `interface/wireguard/peers/${peerId}`,
    {
      method: 'PATCH',
      body: routerOSPeer,
    }
  );
};

/**
 * Remove WireGuard peer
 * REST API endpoint: /rest/interface/wireguard/peers/{id}
 */
export const removeWireGuardPeer = async (
  routerIp: string,
  peerId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(
    routerIp,
    `interface/wireguard/peers/${peerId}`,
    {
      method: 'DELETE',
    }
  );
};

/**
 * Generate WireGuard key pair
 */
export const generateWireGuardKeys = async (
  routerIp: string
): Promise<ApiResponse<{ privateKey: string; publicKey: string }>> => {
  // RouterOS can generate keys via command
  return makeRouterOSRequest<{ privateKey: string; publicKey: string }>(
    routerIp,
    'console/command',
    {
      method: 'POST',
      body: {
        command: '/interface/wireguard/print',
      },
    }
  );
};

/**
 * ============================================
 * IPSec VPN Management
 * ============================================
 */

/**
 * Get IPSec profiles
 * REST API endpoint: /rest/ip/ipsec/profile
 */
export const getIPSecProfiles = async (
  routerIp: string
): Promise<ApiResponse<IPSecProfile[]>> => {
  return makeRouterOSRequest<IPSecProfile[]>(routerIp, 'ip/ipsec/profile');
};

/**
 * Create IPSec profile
 * REST API endpoint: /rest/ip/ipsec/profile
 */
export const createIPSecProfile = async (
  routerIp: string,
  profile: Partial<IPSecProfile>
): Promise<ApiResponse<{ id: string }>> => {
  const routerOSProfile = convertToRouterOSFormat(profile);
  
  return makeRouterOSRequest<{ id: string }>(
    routerIp,
    'ip/ipsec/profile',
    {
      method: 'PUT',
      body: routerOSProfile,
    }
  );
};

/**
 * Update IPSec profile
 * REST API endpoint: /rest/ip/ipsec/profile/{id}
 */
export const updateIPSecProfile = async (
  routerIp: string,
  profileId: string,
  profile: Partial<IPSecProfile>
): Promise<ApiResponse<void>> => {
  const routerOSProfile = convertToRouterOSFormat(profile);
  
  return makeRouterOSRequest<void>(
    routerIp,
    `ip/ipsec/profile/${profileId}`,
    {
      method: 'PATCH',
      body: routerOSProfile,
    }
  );
};

/**
 * Get IPSec peers
 * REST API endpoint: /rest/ip/ipsec/peer
 */
export const getIPSecPeers = async (
  routerIp: string
): Promise<ApiResponse<IPSecPeer[]>> => {
  return makeRouterOSRequest<IPSecPeer[]>(routerIp, 'ip/ipsec/peer');
};

/**
 * Create IPSec peer
 * REST API endpoint: /rest/ip/ipsec/peer
 */
export const createIPSecPeer = async (
  routerIp: string,
  peer: Partial<IPSecPeer>
): Promise<ApiResponse<{ id: string }>> => {
  const routerOSPeer = convertToRouterOSFormat(peer);
  
  return makeRouterOSRequest<{ id: string }>(
    routerIp,
    'ip/ipsec/peer',
    {
      method: 'PUT',
      body: routerOSPeer,
    }
  );
};

/**
 * Get IPSec policies
 * REST API endpoint: /rest/ip/ipsec/policy
 */
export const getIPSecPolicies = async (
  routerIp: string
): Promise<ApiResponse<IPSecPolicy[]>> => {
  return makeRouterOSRequest<IPSecPolicy[]>(routerIp, 'ip/ipsec/policy');
};

/**
 * Create IPSec policy
 * REST API endpoint: /rest/ip/ipsec/policy
 */
export const createIPSecPolicy = async (
  routerIp: string,
  policy: Partial<IPSecPolicy>
): Promise<ApiResponse<{ id: string }>> => {
  const routerOSPolicy = convertToRouterOSFormat(policy);
  
  return makeRouterOSRequest<{ id: string }>(
    routerIp,
    'ip/ipsec/policy',
    {
      method: 'PUT',
      body: routerOSPolicy,
    }
  );
};

/**
 * Configure IPSec site-to-site VPN
 */
export const configureIPSecSiteToSite = async (
  routerIp: string,
  config: {
    remotePeer: string;
    localNetwork: string;
    remoteNetwork: string;
    presharedKey: string;
    profileName?: string;
  }
): Promise<ApiResponse<void>> => {
  try {
    // Create IPSec profile
    const profileResult = await createIPSecProfile(routerIp, {
      name: config.profileName || 'site-to-site',
      hashAlgorithm: 'sha256',
      encryptionAlgorithm: 'aes-256-cbc',
      dhGroup: 'modp2048',
      lifetime: '1d',
      natTraversal: true,
    });
    
    if (!profileResult.success) {
      return {
        success: false,
        error: profileResult.error || 'Failed to create IPSec profile',
        timestamp: Date.now(),
      };
    }
    
    // Create IPSec peer
    const peerResult = await createIPSecPeer(routerIp, {
      address: config.remotePeer,
      profile: config.profileName || 'site-to-site',
      exchangeMode: 'ike2',
      secret: config.presharedKey,
    });
    
    if (!peerResult.success) {
      return {
        success: false,
        error: peerResult.error || 'Failed to create IPSec peer',
        timestamp: Date.now(),
      };
    }
    
    // Create IPSec policy
    const policyResult = await createIPSecPolicy(routerIp, {
      srcAddress: config.localNetwork,
      dstAddress: config.remoteNetwork,
      action: 'encrypt',
      tunnel: true,
      saSource: routerIp,
      saDestination: config.remotePeer,
      proposal: 'default',
    });
    
    if (policyResult.success) {
      return {
        success: true,
        timestamp: Date.now(),
      };
    } else {
      return {
        success: false,
        error: policyResult.error || 'Failed to create IPSec policy',
        timestamp: Date.now(),
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to configure IPSec',
      timestamp: Date.now(),
    };
  }
};

/**
 * ============================================
 * L2TP VPN Management
 * ============================================
 */

/**
 * Get L2TP server configuration
 * REST API endpoint: /rest/interface/l2tp-server/server
 */
export const getL2TPServer = async (
  routerIp: string
): Promise<ApiResponse<L2TPServer>> => {
  return makeRouterOSRequest<L2TPServer>(routerIp, 'interface/l2tp-server/server');
};

/**
 * Configure L2TP server
 * REST API endpoint: /rest/interface/l2tp-server/server
 */
export const configureL2TPServer = async (
  routerIp: string,
  config: Partial<L2TPServer>
): Promise<ApiResponse<void>> => {
  const routerOSConfig = convertToRouterOSFormat(config);
  
  return makeRouterOSRequest<void>(
    routerIp,
    'interface/l2tp-server/server',
    {
      method: 'POST',
      body: routerOSConfig,
    }
  );
};

/**
 * Get L2TP clients
 * REST API endpoint: /rest/interface/l2tp-client
 */
export const getL2TPClients = async (
  routerIp: string
): Promise<ApiResponse<L2TPClient[]>> => {
  return makeRouterOSRequest<L2TPClient[]>(routerIp, 'interface/l2tp-client');
};

/**
 * Create L2TP client connection
 * REST API endpoint: /rest/interface/l2tp-client
 */
export const createL2TPClient = async (
  routerIp: string,
  client: Partial<L2TPClient>
): Promise<ApiResponse<{ id: string }>> => {
  const routerOSClient = convertToRouterOSFormat(client);
  
  return makeRouterOSRequest<{ id: string }>(
    routerIp,
    'interface/l2tp-client',
    {
      method: 'PUT',
      body: routerOSClient,
    }
  );
};

/**
 * Enable/disable L2TP server
 */
export const toggleL2TPServer = async (
  routerIp: string,
  enabled: boolean
): Promise<ApiResponse<void>> => {
  return configureL2TPServer(routerIp, { enabled });
};

/**
 * ============================================
 * PPTP VPN Management
 * ============================================
 */

/**
 * Get PPTP server configuration
 * REST API endpoint: /rest/interface/pptp-server/server
 */
export const getPPTPServer = async (
  routerIp: string
): Promise<ApiResponse<PPTPServer>> => {
  return makeRouterOSRequest<PPTPServer>(routerIp, 'interface/pptp-server/server');
};

/**
 * Configure PPTP server
 * REST API endpoint: /rest/interface/pptp-server/server
 */
export const configurePPTPServer = async (
  routerIp: string,
  config: Partial<PPTPServer>
): Promise<ApiResponse<void>> => {
  const routerOSConfig = convertToRouterOSFormat(config);
  
  return makeRouterOSRequest<void>(
    routerIp,
    'interface/pptp-server/server',
    {
      method: 'POST',
      body: routerOSConfig,
    }
  );
};

/**
 * ============================================
 * SSTP VPN Management
 * ============================================
 */

/**
 * Get SSTP server configuration
 * REST API endpoint: /rest/interface/sstp-server/server
 */
export const getSSTPServer = async (
  routerIp: string
): Promise<ApiResponse<SSTPServer>> => {
  return makeRouterOSRequest<SSTPServer>(routerIp, 'interface/sstp-server/server');
};

/**
 * Configure SSTP server
 * REST API endpoint: /rest/interface/sstp-server/server
 */
export const configureSSTPServer = async (
  routerIp: string,
  config: Partial<SSTPServer>
): Promise<ApiResponse<void>> => {
  const routerOSConfig = convertToRouterOSFormat(config);
  
  return makeRouterOSRequest<void>(
    routerIp,
    'interface/sstp-server/server',
    {
      method: 'POST',
      body: routerOSConfig,
    }
  );
};

/**
 * ============================================
 * OpenVPN Server Management
 * ============================================
 */

/**
 * Get OpenVPN server configuration
 * REST API endpoint: /rest/interface/ovpn-server/server
 */
export const getOpenVPNServer = async (
  routerIp: string
): Promise<ApiResponse<OpenVPNServer>> => {
  return makeRouterOSRequest<OpenVPNServer>(routerIp, 'interface/ovpn-server/server');
};

/**
 * Configure OpenVPN server
 * REST API endpoint: /rest/interface/ovpn-server/server
 */
export const configureOpenVPNServer = async (
  routerIp: string,
  config: Partial<OpenVPNServer>
): Promise<ApiResponse<void>> => {
  const routerOSConfig = convertToRouterOSFormat(config);
  
  return makeRouterOSRequest<void>(
    routerIp,
    'interface/ovpn-server/server',
    {
      method: 'POST',
      body: routerOSConfig,
    }
  );
};

/**
 * ============================================
 * PPP Profiles Management
 * ============================================
 */

/**
 * Get PPP profiles
 * REST API endpoint: /rest/ppp/profile
 */
export const getPPPProfiles = async (
  routerIp: string
): Promise<ApiResponse<PPPProfile[]>> => {
  return makeRouterOSRequest<PPPProfile[]>(routerIp, 'ppp/profile');
};

/**
 * Create PPP profile
 * REST API endpoint: /rest/ppp/profile
 */
export const createPPPProfile = async (
  routerIp: string,
  profile: Partial<PPPProfile>
): Promise<ApiResponse<{ id: string }>> => {
  const routerOSProfile = convertToRouterOSFormat(profile);
  
  return makeRouterOSRequest<{ id: string }>(
    routerIp,
    'ppp/profile',
    {
      method: 'PUT',
      body: routerOSProfile,
    }
  );
};

/**
 * Update PPP profile
 * REST API endpoint: /rest/ppp/profile/{id}
 */
export const updatePPPProfile = async (
  routerIp: string,
  profileId: string,
  profile: Partial<PPPProfile>
): Promise<ApiResponse<void>> => {
  const routerOSProfile = convertToRouterOSFormat(profile);
  
  return makeRouterOSRequest<void>(
    routerIp,
    `ppp/profile/${profileId}`,
    {
      method: 'PATCH',
      body: routerOSProfile,
    }
  );
};

/**
 * ============================================
 * VPN User Management
 * ============================================
 */

/**
 * Get VPN users (PPP secrets)
 * REST API endpoint: /rest/ppp/secret
 */
export const getVPNUsers = async (
  routerIp: string
): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'ppp/secret');
};

/**
 * Create VPN user
 * REST API endpoint: /rest/ppp/secret
 */
export const createVPNUser = async (
  routerIp: string,
  user: {
    name: string;
    password: string;
    service?: string;
    profile?: string;
    localAddress?: string;
    remoteAddress?: string;
    comment?: string;
  }
): Promise<ApiResponse<{ id: string }>> => {
  const routerOSUser = convertToRouterOSFormat(user);
  
  return makeRouterOSRequest<{ id: string }>(
    routerIp,
    'ppp/secret',
    {
      method: 'PUT',
      body: routerOSUser,
    }
  );
};

/**
 * Update VPN user
 * REST API endpoint: /rest/ppp/secret/{id}
 */
export const updateVPNUser = async (
  routerIp: string,
  userId: string,
  user: Partial<{
    name: string;
    password: string;
    service?: string;
    profile?: string;
    disabled?: boolean;
  }>
): Promise<ApiResponse<void>> => {
  const routerOSUser = convertToRouterOSFormat(user);
  
  return makeRouterOSRequest<void>(
    routerIp,
    `ppp/secret/${userId}`,
    {
      method: 'PATCH',
      body: routerOSUser,
    }
  );
};

/**
 * Delete VPN user
 * REST API endpoint: /rest/ppp/secret/{id}
 */
export const deleteVPNUser = async (
  routerIp: string,
  userId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(
    routerIp,
    `ppp/secret/${userId}`,
    {
      method: 'DELETE',
    }
  );
};

/**
 * Get active VPN connections
 * REST API endpoint: /rest/ppp/active
 */
export const getActiveVPNConnections = async (
  routerIp: string
): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'ppp/active');
};

/**
 * Disconnect VPN user
 * REST API endpoint: /rest/ppp/active/{id}/remove
 */
export const disconnectVPNUser = async (
  routerIp: string,
  connectionId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(
    routerIp,
    `ppp/active/${connectionId}/remove`,
    {
      method: 'POST',
    }
  );
};

/**
 * ============================================
 * Helper Functions
 * ============================================
 */

/**
 * Quick setup for road warrior VPN (L2TP/IPSec)
 */
export const setupRoadWarriorVPN = async (
  routerIp: string,
  config: {
    vpnPoolStart: string;
    vpnPoolEnd: string;
    dnsServers: string[];
    ipsecSecret: string;
    users: Array<{ username: string; password: string }>;
  }
): Promise<ApiResponse<void>> => {
  try {
    // Create IP pool for VPN clients
    await makeRouterOSRequest(routerIp, 'ip/pool', {
      method: 'PUT',
      body: {
        name: 'vpn-pool',
        ranges: `${config.vpnPoolStart}-${config.vpnPoolEnd}`,
      },
    });
    
    // Create PPP profile
    await createPPPProfile(routerIp, {
      name: 'vpn-profile',
      localAddress: routerIp,
      remoteAddress: 'vpn-pool',
      dnsServer: config.dnsServers,
      changeTcpMss: 'yes',
      useEncryption: 'yes',
    });
    
    // Configure L2TP server
    await configureL2TPServer(routerIp, {
      enabled: true,
      defaultProfile: 'vpn-profile',
      authentication: ['mschap2'],
      useIPSec: 'required',
      ipsecSecret: config.ipsecSecret,
    });
    
    // Create users
    for (const user of config.users) {
      await createVPNUser(routerIp, {
        name: user.username,
        password: user.password,
        service: 'l2tp',
        profile: 'vpn-profile',
      });
    }
    
    return {
      success: true,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to setup VPN',
      timestamp: Date.now(),
    };
  }
};

/**
 * Convert camelCase to kebab-case for RouterOS API
 */
const convertToRouterOSFormat = (config: any): any => {
  const converted: any = {};
  
  for (const [key, value] of Object.entries(config)) {
    // Special field mappings for VPN configurations
    const fieldMap: Record<string, string> = {
      'privateKey': 'private-key',
      'publicKey': 'public-key',
      'listenPort': 'listen-port',
      'allowedAddress': 'allowed-address',
      'presharedKey': 'preshared-key',
      'persistentKeepalive': 'persistent-keepalive',
      'endpointPort': 'endpoint-port',
      'lastHandshake': 'last-handshake',
      'currentEndpointAddress': 'current-endpoint-address',
      'currentEndpointPort': 'current-endpoint-port',
      'hashAlgorithm': 'hash-algorithm',
      'encryptionAlgorithm': 'enc-algorithm',
      'dhGroup': 'dh-group',
      'lifetimeBytes': 'lifetime-bytes',
      'pfsGroup': 'pfs-group',
      'proposalCheck': 'proposal-check',
      'natTraversal': 'nat-traversal',
      'dpdInterval': 'dpd-interval',
      'dpdMaximumFailures': 'dpd-maximum-failures',
      'localAddress': 'local-address',
      'exchangeMode': 'exchange-mode',
      'sendInitialContact': 'send-initial-contact',
      'myIdType': 'my-id-type',
      'myId': 'my-id',
      'peerCertificate': 'peer-certificate',
      'verifyPeerCertificate': 'verify-peer-certificate',
      'srcAddress': 'src-address',
      'srcPort': 'src-port',
      'dstAddress': 'dst-address',
      'dstPort': 'dst-port',
      'ipsecProtocols': 'ipsec-protocols',
      'saSource': 'sa-src-address',
      'saDestination': 'sa-dst-address',
      'maxMtu': 'max-mtu',
      'maxMru': 'max-mru',
      'defaultProfile': 'default-profile',
      'useCertificate': 'use-certificate',
      'useIPSec': 'use-ipsec',
      'ipsecSecret': 'ipsec-secret',
      'callerIdType': 'caller-id-type',
      'oneSessionPerHost': 'one-session-per-host',
      'maxSessions': 'max-sessions',
      'connectTo': 'connect-to',
      'addDefaultRoute': 'add-default-route',
      'defaultRouteDistance': 'default-route-distance',
      'dialOnDemand': 'dial-on-demand',
      'usePeerDns': 'use-peer-dns',
      'allowFastPath': 'allow-fast-path',
      'keepaliveTimeout': 'keepalive-timeout',
      'tlsVersion': 'tls-version',
      'verifyClientCertificate': 'verify-client-certificate',
      'requireClientCertificate': 'require-client-certificate',
      'macAddress': 'mac-address',
      'remoteAddress': 'remote-address',
      'dnsServer': 'dns-server',
      'winsServer': 'wins-server',
      'upScript': 'on-up',
      'downScript': 'on-down',
      'changeTcpMss': 'change-tcp-mss',
      'useMpls': 'use-mpls',
      'useCompression': 'use-compression',
      'useEncryption': 'use-encryption',
      'onlyOne': 'only-one',
      'sessionTimeout': 'session-timeout',
      'idleTimeout': 'idle-timeout',
      'rateLimit': 'rate-limit',
    };
    
    // Convert camelCase to kebab-case
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    const routerOSKey = fieldMap[key] || kebabKey;
    
    converted[routerOSKey] = value;
  }
  
  return converted;
};

/**
 * Get VPN status summary
 */
export const getVPNStatus = async (
  routerIp: string
): Promise<ApiResponse<{
  wireguard: { interfaces: number; peers: number };
  ipsec: { profiles: number; peers: number; policies: number };
  l2tp: { enabled: boolean; clients: number };
  pptp: { enabled: boolean };
  sstp: { enabled: boolean };
  ovpn: { enabled: boolean };
  activeConnections: number;
}>> => {
  try {
    const [
      wireguardInterfaces,
      wireguardPeers,
      ipsecProfiles,
      ipsecPeers,
      ipsecPolicies,
      l2tpServer,
      l2tpClients,
      pptpServer,
      sstpServer,
      ovpnServer,
      activeConnections,
    ] = await Promise.all([
      getWireGuardInterfaces(routerIp),
      getWireGuardPeers(routerIp),
      getIPSecProfiles(routerIp),
      getIPSecPeers(routerIp),
      getIPSecPolicies(routerIp),
      getL2TPServer(routerIp),
      getL2TPClients(routerIp),
      getPPTPServer(routerIp),
      getSSTPServer(routerIp),
      getOpenVPNServer(routerIp),
      getActiveVPNConnections(routerIp),
    ]);
    
    return {
      success: true,
      data: {
        wireguard: {
          interfaces: wireguardInterfaces.data?.length || 0,
          peers: wireguardPeers.data?.length || 0,
        },
        ipsec: {
          profiles: ipsecProfiles.data?.length || 0,
          peers: ipsecPeers.data?.length || 0,
          policies: ipsecPolicies.data?.length || 0,
        },
        l2tp: {
          enabled: l2tpServer.data?.enabled || false,
          clients: l2tpClients.data?.length || 0,
        },
        pptp: {
          enabled: pptpServer.data?.enabled || false,
        },
        sstp: {
          enabled: sstpServer.data?.enabled || false,
        },
        ovpn: {
          enabled: ovpnServer.data?.enabled || false,
        },
        activeConnections: activeConnections.data?.length || 0,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get VPN status',
      timestamp: Date.now(),
    };
  }
};

