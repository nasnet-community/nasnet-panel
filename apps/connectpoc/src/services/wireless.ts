import { makeRouterOSRequest } from './api';

import type { 
  ApiResponse,
  WirelessInterface,
  WirelessSecurityProfile
} from '@shared/routeros';

/**
 * Wireless management service for MikroTik RouterOS
 * Handles wireless interface configuration, security profiles, and channel management
 * 
 * RouterOS Wireless REST API endpoints:
 * - /rest/interface/wireless - Wireless interfaces
 * - /rest/interface/wireless/security-profiles - Security profiles
 * - /rest/interface/wireless/registration-table - Connected clients
 * - /rest/interface/wireless/access-list - Access control list
 */

/**
 * Wireless channel frequencies (MHz)
 */
const CHANNEL_FREQUENCIES = {
  '2.4GHz': {
    1: 2412,
    2: 2417,
    3: 2422,
    4: 2427,
    5: 2432,
    6: 2437,
    7: 2442,
    8: 2447,
    9: 2452,
    10: 2457,
    11: 2462,
    12: 2467,
    13: 2472,
    14: 2484,
  },
  '5GHz': {
    36: 5180,
    40: 5200,
    44: 5220,
    48: 5240,
    52: 5260,
    56: 5280,
    60: 5300,
    64: 5320,
    100: 5500,
    104: 5520,
    108: 5540,
    112: 5560,
    116: 5580,
    120: 5600,
    124: 5620,
    128: 5640,
    132: 5660,
    136: 5680,
    140: 5700,
    144: 5720,
    149: 5745,
    153: 5765,
    157: 5785,
    161: 5805,
    165: 5825,
  },
} as const;

/**
 * Get all wireless interfaces
 * REST API endpoint: /rest/interface/wireless
 */
export const getWirelessInterfaces = async (
  routerIp: string
): Promise<ApiResponse<WirelessInterface[]>> => {
  return makeRouterOSRequest<WirelessInterface[]>(routerIp, 'interface/wireless');
};

/**
 * Get a specific wireless interface by ID
 * REST API endpoint: /rest/interface/wireless/{id}
 */
export const getWirelessInterface = async (
  routerIp: string,
  interfaceId: string
): Promise<ApiResponse<WirelessInterface>> => {
  return makeRouterOSRequest<WirelessInterface>(routerIp, `interface/wireless/${interfaceId}`);
};

/**
 * Update wireless interface configuration
 * REST API endpoint: /rest/interface/wireless/{id}
 */
export const updateWirelessInterface = async (
  routerIp: string,
  interfaceId: string,
  config: Partial<WirelessInterface>
): Promise<ApiResponse<void>> => {
  // Convert configuration to RouterOS format
  const routerOSConfig = convertToRouterOSFormat(config);
  
  return makeRouterOSRequest<void>(routerIp, `interface/wireless/${interfaceId}`, {
    method: 'PATCH',
    body: routerOSConfig,
  });
};

/**
 * Configure SSID for a wireless interface
 */
export const configureSSID = async (
  routerIp: string,
  interfaceId: string,
  ssid: string,
  hideSSID = false
): Promise<ApiResponse<void>> => {
  return updateWirelessInterface(routerIp, interfaceId, {
    ssid,
    hideSSID,
  });
};

/**
 * Set wireless channel
 */
export const setWirelessChannel = async (
  routerIp: string,
  interfaceId: string,
  channel: number | 'auto',
  channelWidth?: '20mhz' | '40mhz' | '80mhz' | '160mhz'
): Promise<ApiResponse<void>> => {
  const config: any = {};
  
  if (channel === 'auto') {
    // Enable automatic channel selection
    config.frequency = 'auto';
  } else {
    // Set specific frequency based on channel
    const frequency = getFrequencyFromChannel(channel);
    if (!frequency) {
      return {
        success: false,
        error: `Invalid channel: ${channel}`,
        timestamp: Date.now(),
      };
    }
    config.frequency = frequency;
  }
  
  if (channelWidth) {
    config.channelWidth = channelWidth;
  }
  
  return updateWirelessInterface(routerIp, interfaceId, config);
};

/**
 * Set wireless mode (AP, Station, Bridge, etc.)
 */
export const setWirelessMode = async (
  routerIp: string,
  interfaceId: string,
  mode: WirelessInterface['mode']
): Promise<ApiResponse<void>> => {
  return updateWirelessInterface(routerIp, interfaceId, { mode });
};

/**
 * Set transmission power
 */
export const setTxPower = async (
  routerIp: string,
  interfaceId: string,
  txPower: number | 'default'
): Promise<ApiResponse<void>> => {
  const config: any = {};
  if (txPower !== 'default') {
    config.txPower = txPower;
  }
  return updateWirelessInterface(routerIp, interfaceId, config);
};

/**
 * Get all wireless security profiles
 * REST API endpoint: /rest/interface/wireless/security-profiles
 */
export const getSecurityProfiles = async (
  routerIp: string
): Promise<ApiResponse<WirelessSecurityProfile[]>> => {
  return makeRouterOSRequest<WirelessSecurityProfile[]>(
    routerIp,
    'interface/wireless/security-profiles'
  );
};

/**
 * Get a specific security profile
 * REST API endpoint: /rest/interface/wireless/security-profiles/{id}
 */
export const getSecurityProfile = async (
  routerIp: string,
  profileId: string
): Promise<ApiResponse<WirelessSecurityProfile>> => {
  return makeRouterOSRequest<WirelessSecurityProfile>(
    routerIp,
    `interface/wireless/security-profiles/${profileId}`
  );
};

/**
 * Create a new wireless security profile
 * REST API endpoint: /rest/interface/wireless/security-profiles
 */
export const createSecurityProfile = async (
  routerIp: string,
  profile: Partial<WirelessSecurityProfile>
): Promise<ApiResponse<{ id: string }>> => {
  const routerOSProfile = convertToRouterOSFormat(profile);
  
  return makeRouterOSRequest<{ id: string }>(
    routerIp,
    'interface/wireless/security-profiles',
    {
      method: 'PUT',
      body: routerOSProfile,
    }
  );
};

/**
 * Update an existing security profile
 * REST API endpoint: /rest/interface/wireless/security-profiles/{id}
 */
export const updateSecurityProfile = async (
  routerIp: string,
  profileId: string,
  profile: Partial<WirelessSecurityProfile>
): Promise<ApiResponse<void>> => {
  const routerOSProfile = convertToRouterOSFormat(profile);
  
  return makeRouterOSRequest<void>(
    routerIp,
    `interface/wireless/security-profiles/${profileId}`,
    {
      method: 'PATCH',
      body: routerOSProfile,
    }
  );
};

/**
 * Delete a security profile
 * REST API endpoint: /rest/interface/wireless/security-profiles/{id}
 */
export const deleteSecurityProfile = async (
  routerIp: string,
  profileId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(
    routerIp,
    `interface/wireless/security-profiles/${profileId}`,
    {
      method: 'DELETE',
    }
  );
};

/**
 * Configure WPA2 security for a wireless interface
 */
export const configureWPA2Security = async (
  routerIp: string,
  interfaceId: string,
  password: string,
  profileName = 'wpa2-profile'
): Promise<ApiResponse<void>> => {
  try {
    // Create or update security profile
    const profile: Partial<WirelessSecurityProfile> = {
      name: profileName,
      mode: 'dynamic-keys',
      authenticationType: 'wpa2-psk',
      unicastCiphers: ['aes-ccm'],
      groupCiphers: ['aes-ccm'],
      wpa2PreSharedKey: password,
    };
    
    // Check if profile exists
    const existingProfiles = await getSecurityProfiles(routerIp);
    
    let profileId: string;
    
    if (existingProfiles.success && existingProfiles.data) {
      const existing = existingProfiles.data.find(p => p.name === profileName);
      
      if (existing) {
        // Update existing profile
        await updateSecurityProfile(routerIp, existing.name, profile);
        profileId = existing.name;
      } else {
        // Create new profile
        const createResult = await createSecurityProfile(routerIp, profile);
        if (!createResult.success || !createResult.data) {
          return {
            success: false,
            error: 'Failed to create security profile',
            timestamp: Date.now(),
          };
        }
        profileId = createResult.data.id;
      }
    } else {
      // Create new profile
      const createResult = await createSecurityProfile(routerIp, profile);
      if (!createResult.success || !createResult.data) {
        return {
          success: false,
          error: 'Failed to create security profile',
          timestamp: Date.now(),
        };
      }
      profileId = createResult.data.id;
    }
    
    // Apply profile to interface
    return updateWirelessInterface(routerIp, interfaceId, {
      security: profileId,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to configure WPA2 security',
      timestamp: Date.now(),
    };
  }
};

/**
 * Get wireless registration table (connected clients)
 * REST API endpoint: /rest/interface/wireless/registration-table
 */
export const getConnectedClients = async (
  routerIp: string
): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'interface/wireless/registration-table');
};

/**
 * Get wireless access list
 * REST API endpoint: /rest/interface/wireless/access-list
 */
export const getAccessList = async (
  routerIp: string
): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(routerIp, 'interface/wireless/access-list');
};

/**
 * Add MAC address to access list
 * REST API endpoint: /rest/interface/wireless/access-list
 */
export const addToAccessList = async (
  routerIp: string,
  macAddress: string,
  comment?: string,
  allow = true
): Promise<ApiResponse<{ id: string }>> => {
  return makeRouterOSRequest<{ id: string }>(
    routerIp,
    'interface/wireless/access-list',
    {
      method: 'PUT',
      body: {
        'mac-address': macAddress,
        authentication: allow,
        forwarding: allow,
        comment,
      },
    }
  );
};

/**
 * Remove MAC address from access list
 * REST API endpoint: /rest/interface/wireless/access-list/{id}
 */
export const removeFromAccessList = async (
  routerIp: string,
  entryId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(
    routerIp,
    `interface/wireless/access-list/${entryId}`,
    {
      method: 'DELETE',
    }
  );
};

/**
 * Scan for available wireless networks
 * REST API endpoint: /rest/interface/wireless/scan
 */
export const scanWirelessNetworks = async (
  routerIp: string,
  interfaceId: string,
  duration = 5
): Promise<ApiResponse<any[]>> => {
  return makeRouterOSRequest<any[]>(
    routerIp,
    `interface/wireless/scan`,
    {
      method: 'POST',
      body: {
        interface: interfaceId,
        duration,
      },
    }
  );
};

/**
 * Get wireless statistics
 * REST API endpoint: /rest/interface/wireless/monitor
 */
export const getWirelessStats = async (
  routerIp: string,
  interfaceId: string
): Promise<ApiResponse<any>> => {
  return makeRouterOSRequest<any>(
    routerIp,
    `interface/wireless/monitor`,
    {
      method: 'POST',
      body: {
        numbers: interfaceId,
        once: true,
      },
    }
  );
};

/**
 * Enable/disable wireless interface
 */
export const toggleWirelessInterface = async (
  routerIp: string,
  interfaceId: string,
  enabled: boolean
): Promise<ApiResponse<void>> => {
  return updateWirelessInterface(routerIp, interfaceId, {
    disabled: !enabled,
  });
};

/**
 * Reset wireless interface to defaults
 */
export const resetWirelessInterface = async (
  routerIp: string,
  interfaceId: string
): Promise<ApiResponse<void>> => {
  return makeRouterOSRequest<void>(
    routerIp,
    `interface/wireless/reset-configuration`,
    {
      method: 'POST',
      body: {
        numbers: interfaceId,
      },
    }
  );
};

/**
 * Helper function to convert channel to frequency
 */
const getFrequencyFromChannel = (channel: number): number | null => {
  // Check 2.4GHz channels
  const freq2ghz = CHANNEL_FREQUENCIES['2.4GHz'][channel as keyof typeof CHANNEL_FREQUENCIES['2.4GHz']];
  if (freq2ghz) return freq2ghz;
  
  // Check 5GHz channels
  const freq5ghz = CHANNEL_FREQUENCIES['5GHz'][channel as keyof typeof CHANNEL_FREQUENCIES['5GHz']];
  if (freq5ghz) return freq5ghz;
  
  return null;
};

/**
 * Helper function to get channel from frequency
 */
export const getChannelFromFrequency = (frequency: number): number | null => {
  // Check 2.4GHz channels
  for (const [channel, freq] of Object.entries(CHANNEL_FREQUENCIES['2.4GHz'])) {
    if (freq === frequency) return parseInt(channel);
  }
  
  // Check 5GHz channels
  for (const [channel, freq] of Object.entries(CHANNEL_FREQUENCIES['5GHz'])) {
    if (freq === frequency) return parseInt(channel);
  }
  
  return null;
};

/**
 * Convert camelCase to kebab-case for RouterOS API
 */
const convertToRouterOSFormat = (config: any): any => {
  const converted: any = {};
  
  for (const [key, value] of Object.entries(config)) {
    // Convert camelCase to kebab-case
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    
    // Special field mappings
    const fieldMap: Record<string, string> = {
      'hideSSID': 'hide-ssid',
      'txPower': 'tx-power',
      'channelWidth': 'channel-width',
      'noiseFloor': 'noise-floor',
      'txRate': 'tx-rate',
      'rxRate': 'rx-rate',
      'wdsDefaultBridge': 'wds-default-bridge',
      'authenticationType': 'authentication-types',
      'unicastCiphers': 'unicast-ciphers',
      'groupCiphers': 'group-ciphers',
      'wpaPreSharedKey': 'wpa-pre-shared-key',
      'wpa2PreSharedKey': 'wpa2-pre-shared-key',
      'supplicantIdentity': 'supplicant-identity',
      'eapMethods': 'eap-methods',
      'radiusMacAuthentication': 'radius-mac-authentication',
      'radiusMacAccounting': 'radius-mac-accounting',
      'interimUpdate': 'interim-update',
      'radiusMacFormat': 'radius-mac-format',
      'radiusMacMode': 'radius-mac-mode',
      'tlsMode': 'tls-mode',
      'tlsCertificate': 'tls-certificate',
    };
    
    const routerOSKey = fieldMap[key] || kebabKey;
    converted[routerOSKey] = value;
  }
  
  return converted;
};

/**
 * Get recommended wireless configuration based on environment
 */
export const getRecommendedWirelessConfig = (
  environment: 'home' | 'office' | 'outdoor' | 'high-density'
): Partial<WirelessInterface> => {
  switch (environment) {
    case 'home':
      return {
        mode: 'ap-bridge',
        band: '2ghz-n',
        channelWidth: '20mhz',
        txPower: 17,
      };
      
    case 'office':
      return {
        mode: 'ap-bridge',
        band: '5ghz-ac',
        channelWidth: '80mhz',
        txPower: 20,
      };
      
    case 'outdoor':
      return {
        mode: 'ap-bridge',
        band: '5ghz-ac',
        channelWidth: '40mhz',
        txPower: 30,
        distance: 3000,
      };
      
    case 'high-density':
      return {
        mode: 'ap-bridge',
        band: '5ghz-ac',
        channelWidth: '20mhz',
        txPower: 10,
      };
      
    default:
      return {};
  }
};

