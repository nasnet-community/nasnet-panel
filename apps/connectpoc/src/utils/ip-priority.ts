/**
 * IP prioritization utility for optimized network scanning
 * Prioritizes gateway IPs (.1) and common secondary gateways (.254) for faster router discovery
 */

export interface IpPriorityConfig {
  readonly prioritizeGateways: boolean;
  readonly prioritizeSecondaryGateways: boolean;
  readonly customPriorityIps: readonly string[];
}

export interface PrioritizedIp {
  readonly ip: string;
  readonly priority: number; // Lower numbers = higher priority
  readonly reason: string;
}

/** Default priority configuration */
const DEFAULT_PRIORITY_CONFIG: IpPriorityConfig = {
  prioritizeGateways: true,
  prioritizeSecondaryGateways: true,
  customPriorityIps: [
    '192.168.88.1',    // Default MikroTik IP
    '172.16.0.1',      // Common 172.16.x.x gateway
    '172.31.255.254',  // Common 172.31.x.x gateway
  ],
} as const;

/**
 * Priority levels for IP addresses
 */
export const IP_PRIORITY_LEVELS = {
  CUSTOM_HIGH: 1,        // Custom high-priority IPs
  GATEWAY_PRIMARY: 2,    // .1 addresses (primary gateways)
  GATEWAY_SECONDARY: 3,  // .254 addresses (secondary gateways)
  NORMAL: 4,            // All other addresses
} as const;

/**
 * Determines the priority of an IP address based on common patterns
 */
export const getIpPriority = (
  ip: string, 
  config: Partial<IpPriorityConfig> = {}
): PrioritizedIp => {
  const finalConfig = { ...DEFAULT_PRIORITY_CONFIG, ...config };
  
  // Check custom high-priority IPs first
  if (finalConfig.customPriorityIps.includes(ip)) {
    return {
      ip,
      priority: IP_PRIORITY_LEVELS.CUSTOM_HIGH,
      reason: 'Custom high-priority IP (common router address)',
    };
  }
  
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return {
      ip,
      priority: IP_PRIORITY_LEVELS.NORMAL,
      reason: 'Invalid IP format',
    };
  }
  
  const lastOctet = parseInt(parts[3]!);
  
  // Primary gateways (.1)
  if (finalConfig.prioritizeGateways && lastOctet === 1) {
    return {
      ip,
      priority: IP_PRIORITY_LEVELS.GATEWAY_PRIMARY,
      reason: 'Primary gateway IP (ends in .1)',
    };
  }
  
  // Secondary gateways (.254)
  if (finalConfig.prioritizeSecondaryGateways && lastOctet === 254) {
    return {
      ip,
      priority: IP_PRIORITY_LEVELS.GATEWAY_SECONDARY,
      reason: 'Secondary gateway IP (ends in .254)',
    };
  }
  
  return {
    ip,
    priority: IP_PRIORITY_LEVELS.NORMAL,
    reason: 'Standard host IP',
  };
};

/**
 * Sorts an array of IP addresses by priority (highest priority first)
 * Memory-efficient implementation for large IP ranges
 */
export const sortIpsByPriority = (
  ips: readonly string[],
  config: Partial<IpPriorityConfig> = {}
): readonly PrioritizedIp[] => {
  // Convert to prioritized IPs and sort
  const prioritizedIps = ips.map(ip => getIpPriority(ip, config));
  
  // Sort by priority (lower number = higher priority), then by IP for consistency
  return prioritizedIps.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    // Secondary sort by IP address for consistent ordering
    return a.ip.localeCompare(b.ip, undefined, { numeric: true });
  });
};

/**
 * Generator function that yields IPs in priority order
 * Memory-efficient for very large IP ranges
 */
export function* generatePrioritizedIps(
  ips: readonly string[],
  config: Partial<IpPriorityConfig> = {}
): Generator<PrioritizedIp, void, unknown> {
  const finalConfig = { ...DEFAULT_PRIORITY_CONFIG, ...config };
  
  // Separate IPs by priority level for efficient processing
  const priorityBuckets = new Map<number, string[]>();
  
  for (const ip of ips) {
    const priority = getIpPriority(ip, finalConfig);
    
    if (!priorityBuckets.has(priority.priority)) {
      priorityBuckets.set(priority.priority, []);
    }
    
    priorityBuckets.get(priority.priority)!.push(ip);
  }
  
  // Yield IPs in priority order
  const sortedPriorities = Array.from(priorityBuckets.keys()).sort((a, b) => a - b);
  
  for (const priority of sortedPriorities) {
    const ipsInBucket = priorityBuckets.get(priority)!;
    
    // Sort IPs within the same priority level
    ipsInBucket.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    
    for (const ip of ipsInBucket) {
      yield getIpPriority(ip, finalConfig);
    }
  }
}

/**
 * Extracts high-priority IPs from a range for immediate scanning
 */
export const extractHighPriorityIps = (
  ips: readonly string[],
  config: Partial<IpPriorityConfig> = {}
): {
  readonly highPriority: readonly PrioritizedIp[];
  readonly normal: readonly string[];
} => {
  const finalConfig = { ...DEFAULT_PRIORITY_CONFIG, ...config };
  const highPriority: PrioritizedIp[] = [];
  const normal: string[] = [];
  
  for (const ip of ips) {
    const prioritized = getIpPriority(ip, finalConfig);
    
    if (prioritized.priority <= IP_PRIORITY_LEVELS.GATEWAY_SECONDARY) {
      highPriority.push(prioritized);
    } else {
      normal.push(ip);
    }
  }
  
  // Sort high-priority IPs
  highPriority.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.ip.localeCompare(b.ip, undefined, { numeric: true });
  });
  
  return { highPriority, normal };
};

/**
 * Calculates priority statistics for a given IP range
 */
export const calculatePriorityStats = (
  ips: readonly string[],
  config: Partial<IpPriorityConfig> = {}
): {
  readonly total: number;
  readonly customHigh: number;
  readonly primaryGateways: number;
  readonly secondaryGateways: number;
  readonly normal: number;
  readonly priorityPercentage: number;
} => {
  const finalConfig = { ...DEFAULT_PRIORITY_CONFIG, ...config };
  let customHigh = 0;
  let primaryGateways = 0;
  let secondaryGateways = 0;
  let normal = 0;
  
  for (const ip of ips) {
    const priority = getIpPriority(ip, finalConfig);
    
    switch (priority.priority) {
      case IP_PRIORITY_LEVELS.CUSTOM_HIGH:
        customHigh++;
        break;
      case IP_PRIORITY_LEVELS.GATEWAY_PRIMARY:
        primaryGateways++;
        break;
      case IP_PRIORITY_LEVELS.GATEWAY_SECONDARY:
        secondaryGateways++;
        break;
      default:
        normal++;
        break;
    }
  }
  
  const total = ips.length;
  const prioritized = customHigh + primaryGateways + secondaryGateways;
  const priorityPercentage = total > 0 ? (prioritized / total) * 100 : 0;
  
  return {
    total,
    customHigh,
    primaryGateways,
    secondaryGateways,
    normal,
    priorityPercentage,
  };
};

/**
 * Validates IP priority configuration
 */
export const validatePriorityConfig = (config: Partial<IpPriorityConfig>): string[] => {
  const errors: string[] = [];
  
  if (config.customPriorityIps) {
    for (const ip of config.customPriorityIps) {
      const parts = ip.split('.');
      if (parts.length !== 4 || parts.some(part => {
        const num = parseInt(part);
        return isNaN(num) || num < 0 || num > 255;
      })) {
        errors.push(`Invalid IP address in customPriorityIps: ${ip}`);
      }
    }
  }
  
  return errors;
};

/**
 * Creates optimized priority configuration based on target network ranges
 */
export const createOptimizedPriorityConfig = (
  targetRanges: readonly string[]
): IpPriorityConfig => {
  const customPriorityIps: string[] = [];
  
  // Add common gateway IPs for each target range
  for (const range of targetRanges) {
    if (range.startsWith('192.168.')) {
      customPriorityIps.push('192.168.1.1', '192.168.0.1', '192.168.88.1');
    } else if (range.startsWith('172.16.') || range.includes('172.16.0.0/12')) {
      customPriorityIps.push('172.16.0.1', '172.16.1.1', '172.31.255.254');
    } else if (range.startsWith('10.')) {
      customPriorityIps.push('10.0.0.1', '10.1.1.1', '10.10.10.1');
    }
  }
  
  // Remove duplicates
  const uniqueIps = Array.from(new Set(customPriorityIps));
  
  return {
    prioritizeGateways: true,
    prioritizeSecondaryGateways: true,
    customPriorityIps: uniqueIps,
  };
};