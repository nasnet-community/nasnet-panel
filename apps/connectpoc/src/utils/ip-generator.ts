/**
 * Ultra-efficient IP address generation utilities with smart subnet detection
 * Supports multiple ranges: 192.168.0.0/16 and 172.16.0.0/12 with priority-based scanning
 * Prioritizes gateway IPs (.1) and secondary gateways (.254) for faster router discovery
 * Integrates with subnet detection for ~750 IP scans instead of 1.1M IPs
 */

export interface IpBatch {
  readonly startIp: string;
  readonly endIp: string;
  readonly ips: readonly string[];
  readonly batchId: number;
  readonly totalBatches: number;
  readonly subnetHint?: string; // Which detected subnet this batch belongs to
}

export interface IpGeneratorConfig {
  readonly batchSize: number;
  readonly skipNetworkAndBroadcast: boolean;
  readonly skipCommonNonRoutable: boolean;
  readonly customRange?: {
    startIp: string;
    endIp: string;
  };
  readonly prioritizeCommonIps?: boolean;
  readonly enableMultipleRanges?: boolean;
  readonly prioritizeGatewayIps?: boolean;
  readonly useSmartSubnetDetection?: boolean; // Enable subnet detection integration
  readonly targetedSubnets?: readonly string[]; // Specific subnets to scan (e.g., ['192.168.1.0', '192.168.0.0'])
}

export interface SmartSubnetConfig {
  readonly detectedSubnets: readonly {
    readonly network: string;
    readonly broadcastRange: readonly string[];
    readonly confidence: number;
  }[];
  readonly maxIpsPerSubnet?: number; // Limit IPs per subnet for ultra-fast scanning
  readonly prioritizeByConfidence?: boolean; // Sort subnets by confidence
}

/** Default configuration for IP generation */
const DEFAULT_CONFIG: IpGeneratorConfig = {
  batchSize: 50, // Reduced for ultra-fast progressive results
  skipNetworkAndBroadcast: true,
  skipCommonNonRoutable: true,
  prioritizeCommonIps: true,
  enableMultipleRanges: false, // Disabled by default for focused scanning
  prioritizeGatewayIps: true,
  useSmartSubnetDetection: true, // Enable smart subnet detection by default
} as const;

/** Common MikroTik and gateway IPs to prioritize */
const COMMON_MIKROTIK_IPS: readonly string[] = [
  '192.168.88.1',    // Default MikroTik IP
  '192.168.1.1',     // Common router IP
  '192.168.0.1',     // Common router IP  
  '192.168.1.254',   // Common gateway
  '192.168.0.254',   // Common gateway
  '172.16.0.1',      // Common 172.16.x.x gateway
  '172.16.1.1',      // Common 172.16.x.x gateway
  '172.31.255.254',  // Common 172.31.x.x gateway
];

/** Supported IP ranges for multi-range scanning */
const SUPPORTED_RANGES = [
  {
    name: '192.168.0.0/16',
    startIp: '192.168.0.0',
    endIp: '192.168.255.255',
    description: 'Private Class C range (65,536 IPs)',
  },
  {
    name: '172.16.0.0/12', 
    startIp: '172.16.0.0',
    endIp: '172.31.255.255',
    description: 'Private Class B range (1,048,576 IPs)',
  },
] as const;

/**
 * Converts IP address to 32-bit integer for efficient manipulation
 */
const ipToInt = (ip: string): number => {
  const parts = ip.split('.');
  return (
    (parseInt(parts[0]!) << 24) +
    (parseInt(parts[1]!) << 16) +
    (parseInt(parts[2]!) << 8) +
    parseInt(parts[3]!)
  ) >>> 0;
};

/**
 * Converts 32-bit integer back to IP address string
 */
const intToIp = (int: number): string => {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
};

/**
 * Checks if an IP should be skipped based on common non-routable patterns
 */
const shouldSkipIp = (ip: string, config: IpGeneratorConfig): boolean => {
  if (!config.skipCommonNonRoutable) return false;
  
  const parts = ip.split('.');
  const lastOctet = parseInt(parts[3]!);
  
  // Skip .0 and .255 addresses (network and broadcast)
  if (config.skipNetworkAndBroadcast && (lastOctet === 0 || lastOctet === 255)) {
    return true;
  }
  
  return false;
};

/**
 * Generates prioritized IP addresses for gateway IPs (.1) and secondary gateways (.254)
 */
const generatePriorityIps = (
  startInt: number,
  endInt: number,
  finalConfig: IpGeneratorConfig
): string[] => {
  const priorityIps: string[] = [];
  
  if (!finalConfig.prioritizeGatewayIps) {
    return priorityIps;
  }
  
  // Generate all IPs in range and filter for priority ones
  for (let currentInt = startInt; currentInt <= endInt; currentInt++) {
    const ip = intToIp(currentInt);
    const parts = ip.split('.');
    const lastOctet = parseInt(parts[3]!);
    
    // Prioritize .1 (primary gateways) and .254 (secondary gateways)
    if (lastOctet === 1 || lastOctet === 254) {
      if (!shouldSkipIp(ip, finalConfig)) {
        priorityIps.push(ip);
      }
    }
  }
  
  // Sort to ensure .1 comes before .254
  priorityIps.sort((a, b) => {
    const aLastOctet = parseInt(a.split('.')[3]!);
    const bLastOctet = parseInt(b.split('.')[3]!);
    
    if (aLastOctet !== bLastOctet) {
      return aLastOctet === 1 ? -1 : bLastOctet === 1 ? 1 : 0;
    }
    
    return a.localeCompare(b, undefined, { numeric: true });
  });
  
  return priorityIps;
};

/**
 * Generates IP addresses for the specified range(s) with priority-based scanning
 * Supports both 192.168.0.0/16 and 172.16.0.0/12 ranges
 * Returns a generator that yields batches of IPs for memory efficiency
 */
export function* generateIpBatches(
  config: Partial<IpGeneratorConfig> = {}
): Generator<IpBatch, void, unknown> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  let batchId = 0;
  let totalBatches = 0;
  
  // Determine which ranges to scan
  const rangesToScan = finalConfig.customRange
    ? [{ startIp: finalConfig.customRange.startIp, endIp: finalConfig.customRange.endIp }]
    : finalConfig.enableMultipleRanges
    ? SUPPORTED_RANGES.map(r => ({ startIp: r.startIp, endIp: r.endIp }))
    : [{ startIp: '192.168.0.0', endIp: '192.168.255.255' }];
  
  // Calculate total batches across all ranges
  for (const range of rangesToScan) {
    const startInt = ipToInt(range.startIp);
    const endInt = ipToInt(range.endIp);
    const rangeSize = endInt - startInt + 1;
    totalBatches += Math.ceil(rangeSize / finalConfig.batchSize);
  }
  
  // Add extra batches for priority IPs
  if (finalConfig.prioritizeCommonIps || finalConfig.prioritizeGatewayIps) {
    totalBatches += 2; // One for common IPs, one for gateway IPs
  }
  
  // Yield common MikroTik IPs first if enabled
  if (finalConfig.prioritizeCommonIps && !finalConfig.customRange) {
    const commonBatch: string[] = [];
    
    for (const range of rangesToScan) {
      const startInt = ipToInt(range.startIp);
      const endInt = ipToInt(range.endIp);
      
      for (const commonIp of COMMON_MIKROTIK_IPS) {
        const commonInt = ipToInt(commonIp);
        if (commonInt >= startInt && commonInt <= endInt) {
          commonBatch.push(commonIp);
        }
      }
    }
    
    if (commonBatch.length > 0) {
      // Remove duplicates and sort
      const uniqueCommonIps = Array.from(new Set(commonBatch)).sort(
        (a, b) => a.localeCompare(b, undefined, { numeric: true })
      );
      
      yield {
        startIp: uniqueCommonIps[0]!,
        endIp: uniqueCommonIps[uniqueCommonIps.length - 1]!,
        ips: uniqueCommonIps,
        batchId: batchId++,
        totalBatches,
      };
    }
  }
  
  // Yield priority gateway IPs (.1 and .254) if enabled
  if (finalConfig.prioritizeGatewayIps && !finalConfig.customRange) {
    const priorityBatch: string[] = [];
    
    for (const range of rangesToScan) {
      const startInt = ipToInt(range.startIp);
      const endInt = ipToInt(range.endIp);
      const rangePriorityIps = generatePriorityIps(startInt, endInt, finalConfig);
      priorityBatch.push(...rangePriorityIps);
    }
    
    if (priorityBatch.length > 0) {
      // Remove duplicates and maintain priority order
      const uniquePriorityIps = Array.from(new Set(priorityBatch));
      
      yield {
        startIp: uniquePriorityIps[0]!,
        endIp: uniquePriorityIps[uniquePriorityIps.length - 1]!,
        ips: uniquePriorityIps,
        batchId: batchId++,
        totalBatches,
      };
    }
  }
  
  // Generate regular batches for each range
  for (const range of rangesToScan) {
    const startInt = ipToInt(range.startIp);
    const endInt = ipToInt(range.endIp);
    let currentInt = startInt;
    
    // Track which IPs were already yielded in priority batches
    const priorityIpsSet = new Set<string>();
    
    if (finalConfig.prioritizeCommonIps) {
      COMMON_MIKROTIK_IPS.forEach(ip => {
        const ipInt = ipToInt(ip);
        if (ipInt >= startInt && ipInt <= endInt) {
          priorityIpsSet.add(ip);
        }
      });
    }
    
    if (finalConfig.prioritizeGatewayIps) {
      const priorityIps = generatePriorityIps(startInt, endInt, finalConfig);
      priorityIps.forEach(ip => priorityIpsSet.add(ip));
    }
    
    while (currentInt <= endInt) {
      const batchIps: string[] = [];
      const batchStartInt = currentInt;
      
      // Generate batch of IPs, skipping those already in priority batches
      for (let i = 0; i < finalConfig.batchSize && currentInt <= endInt; i++) {
        const ip = intToIp(currentInt);
        
        if (!shouldSkipIp(ip, finalConfig) && !priorityIpsSet.has(ip)) {
          batchIps.push(ip);
        }
        
        currentInt++;
      }
      
      if (batchIps.length > 0) {
        const batchEndInt = Math.min(currentInt - 1, endInt);
        
        yield {
          startIp: intToIp(batchStartInt),
          endIp: intToIp(batchEndInt),
          ips: batchIps,
          batchId: batchId++,
          totalBatches,
        };
      }
    }
  }
}

/**
 * Generates all IPs for specified range(s) in a single array
 * WARNING: This loads all IPs into memory - use only for small operations
 */
export const generateAllIps = (
  config: Partial<IpGeneratorConfig> = {}
): readonly string[] => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const allIps: string[] = [];
  
  // Determine which ranges to scan
  const rangesToScan = finalConfig.customRange
    ? [{ startIp: finalConfig.customRange.startIp, endIp: finalConfig.customRange.endIp }]
    : finalConfig.enableMultipleRanges
    ? SUPPORTED_RANGES.map(r => ({ startIp: r.startIp, endIp: r.endIp }))
    : [{ startIp: '192.168.0.0', endIp: '192.168.255.255' }];
  
  for (const range of rangesToScan) {
    const startInt = ipToInt(range.startIp);
    const endInt = ipToInt(range.endIp);
    
    for (let currentInt = startInt; currentInt <= endInt; currentInt++) {
      const ip = intToIp(currentInt);
      
      if (!shouldSkipIp(ip, finalConfig)) {
        allIps.push(ip);
      }
    }
  }
  
  return allIps;
};

/**
 * Calculates the total number of IPs that will be generated
 */
export const calculateTotalIps = (
  config: Partial<IpGeneratorConfig> = {}
): number => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Determine which ranges to scan
  const rangesToScan = finalConfig.customRange
    ? [{ startIp: finalConfig.customRange.startIp, endIp: finalConfig.customRange.endIp }]
    : finalConfig.enableMultipleRanges
    ? SUPPORTED_RANGES.map(r => ({ startIp: r.startIp, endIp: r.endIp }))
    : [{ startIp: '192.168.0.0', endIp: '192.168.255.255' }];
  
  let totalCount = 0;
  
  for (const range of rangesToScan) {
    const startInt = ipToInt(range.startIp);
    const endInt = ipToInt(range.endIp);
    
    if (!finalConfig.skipNetworkAndBroadcast && !finalConfig.skipCommonNonRoutable) {
      totalCount += endInt - startInt + 1;
    } else {
      // Calculate actual count considering skipped IPs
      for (let currentInt = startInt; currentInt <= endInt; currentInt++) {
        const ip = intToIp(currentInt);
        
        if (!shouldSkipIp(ip, finalConfig)) {
          totalCount++;
        }
      }
    }
  }
  
  return totalCount;
};

/**
 * Generates a specific subnet within the supported ranges
 */
export const generateSubnetIps = (
  baseNetwork: string, // e.g., '192.168.1' or '172.16.0'
  config: Partial<IpGeneratorConfig> = {}
): readonly string[] => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const ips: string[] = [];
  
  for (let host = 0; host <= 255; host++) {
    const ip = `${baseNetwork}.${host}`;
    
    if (!shouldSkipIp(ip, finalConfig)) {
      ips.push(ip);
    }
  }
  
  return ips;
};

/**
 * Gets information about supported IP ranges
 */
export const getSupportedRanges = (): readonly typeof SUPPORTED_RANGES[number][] => {
  return SUPPORTED_RANGES;
};

/**
 * Calculates range statistics for a given configuration
 */
export const calculateRangeStats = (
  config: Partial<IpGeneratorConfig> = {}
): {
  readonly ranges: readonly string[];
  readonly totalIps: number;
  readonly priorityIps: number;
  readonly estimatedScanTime: number;
} => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const rangesToScan = finalConfig.customRange
    ? [`${finalConfig.customRange.startIp} - ${finalConfig.customRange.endIp}`]
    : finalConfig.enableMultipleRanges
    ? SUPPORTED_RANGES.map(r => r.name)
    : ['192.168.0.0/16'];
  
  const totalIps = calculateTotalIps(finalConfig);
  
  // Estimate priority IPs
  let priorityIps = 0;
  if (finalConfig.prioritizeCommonIps) {
    priorityIps += COMMON_MIKROTIK_IPS.length;
  }
  if (finalConfig.prioritizeGatewayIps) {
    // Rough estimate: 2 priority IPs per /24 subnet
    priorityIps += Math.floor(totalIps / 254) * 2;
  }
  
  // Estimate scan time (very rough)
  const estimatedScanTime = Math.ceil(totalIps / 1000); // Assume 1000 IPs/second
  
  return {
    ranges: rangesToScan,
    totalIps,
    priorityIps: Math.min(priorityIps, totalIps),
    estimatedScanTime,
  };
};

/**
 * Creates optimized batch configuration based on available system resources
 */
export const getOptimizedBatchConfig = (
  maxConcurrency: number = 1000,
  availableMemoryMB: number = 100
): IpGeneratorConfig => {
  // Estimate memory usage per IP (roughly 20 bytes per IP string + overhead)
  const bytesPerIp = 30;
  const availableBytes = availableMemoryMB * 1024 * 1024;
  const maxIpsInMemory = Math.floor(availableBytes / bytesPerIp);
  
  // Balance between memory usage and concurrency
  const optimalBatchSize = Math.min(
    maxConcurrency * 2, // Allow 2x concurrency for buffering
    maxIpsInMemory,
    2000 // Cap at reasonable maximum
  );
  
  return {
    batchSize: Math.max(100, optimalBatchSize), // Minimum 100 IPs per batch
    skipNetworkAndBroadcast: true,
    skipCommonNonRoutable: true,
    prioritizeCommonIps: true,
  };
};

/**
 * Utility to convert IP range to CIDR notation for validation
 */
export const ipRangeToCidr = (startIp: string, endIp: string): string | null => {
  const startInt = ipToInt(startIp);
  const endInt = ipToInt(endIp);
  
  if (startInt > endInt) return null;
  
  const hostCount = endInt - startInt + 1;
  const prefixLength = 32 - Math.log2(hostCount);
  
  if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > 32) {
    return null;
  }
  
  return `${startIp}/${prefixLength}`;
};

/**
 * Performance metrics for batch generation
 */
export interface GenerationMetrics {
  readonly totalIps: number;
  readonly totalBatches: number;
  readonly avgBatchSize: number;
  readonly estimatedMemoryUsage: number;
  readonly estimatedGenerationTime: number;
}

/**
 * Calculates performance metrics for IP generation
 */
export const calculateGenerationMetrics = (
  config: Partial<IpGeneratorConfig> = {}
): GenerationMetrics => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const totalIps = calculateTotalIps(finalConfig);
  let totalBatches = Math.ceil(totalIps / finalConfig.batchSize);
  
  // Account for the extra common IPs batch if applicable
  if (finalConfig.prioritizeCommonIps && !finalConfig.customRange) {
    totalBatches += 1;
  }
  
  const avgBatchSize = totalIps / totalBatches;
  
  // Rough estimates
  const bytesPerIp = 30;
  const estimatedMemoryUsage = finalConfig.batchSize * bytesPerIp;
  const estimatedGenerationTime = totalIps * 0.001; // ~1ms per 1000 IPs
  
  return {
    totalIps,
    totalBatches,
    avgBatchSize,
    estimatedMemoryUsage,
    estimatedGenerationTime,
  };
};

/**
 * Generates IP batches for specific detected subnets only
 * Ultra-fast version that scans only ~750 IPs instead of 1.1M IPs
 */
export function* generateSmartSubnetBatches(
  smartConfig: SmartSubnetConfig,
  config: Partial<IpGeneratorConfig> = {}
): Generator<IpBatch, void, unknown> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  let batchId = 0;
  let totalBatches = 0;
  
  // Sort subnets by confidence if requested
  const subnetsToProcess = smartConfig.prioritizeByConfidence
    ? [...smartConfig.detectedSubnets].sort((a, b) => b.confidence - a.confidence)
    : smartConfig.detectedSubnets;
  
  // Calculate total batches across all detected subnets
  for (const subnet of subnetsToProcess) {
    const ipsToScan = smartConfig.maxIpsPerSubnet
      ? subnet.broadcastRange.slice(0, smartConfig.maxIpsPerSubnet)
      : subnet.broadcastRange;
    totalBatches += Math.ceil(ipsToScan.length / finalConfig.batchSize);
  }
  
  // Yield common MikroTik IPs first if enabled
  if (finalConfig.prioritizeCommonIps) {
    const commonBatch: string[] = [];
    
    for (const subnet of subnetsToProcess) {
      for (const commonIp of COMMON_MIKROTIK_IPS) {
        if (subnet.broadcastRange.includes(commonIp)) {
          commonBatch.push(commonIp);
        }
      }
    }
    
    if (commonBatch.length > 0) {
      const uniqueCommonIps = Array.from(new Set(commonBatch));
      yield {
        startIp: uniqueCommonIps[0]!,
        endIp: uniqueCommonIps[uniqueCommonIps.length - 1]!,
        ips: uniqueCommonIps,
        batchId: batchId++,
        totalBatches: totalBatches + 1, // +1 for this common batch
        subnetHint: 'priority-common',
      };
    }
  }
  
  // Process each detected subnet
  for (const subnet of subnetsToProcess) {
    const ipsToScan = smartConfig.maxIpsPerSubnet
      ? subnet.broadcastRange.slice(0, smartConfig.maxIpsPerSubnet)
      : subnet.broadcastRange;
    
    // Skip IPs already yielded in common batch
    const priorityIpsSet = new Set(
      finalConfig.prioritizeCommonIps ? COMMON_MIKROTIK_IPS : []
    );
    
    const filteredIps = ipsToScan.filter(ip => !priorityIpsSet.has(ip));
    
    // Generate batches for this subnet
    for (let i = 0; i < filteredIps.length; i += finalConfig.batchSize) {
      const batchIps = filteredIps.slice(i, i + finalConfig.batchSize);
      
      if (batchIps.length > 0) {
        yield {
          startIp: batchIps[0]!,
          endIp: batchIps[batchIps.length - 1]!,
          ips: batchIps,
          batchId: batchId++,
          totalBatches,
          subnetHint: subnet.network,
        };
      }
    }
  }
}

/**
 * Generates IPs for only the specified target subnets
 * Used for ultra-fast scanning of specific network ranges
 */
export function* generateTargetedSubnetBatches(
  targetSubnets: readonly string[],
  config: Partial<IpGeneratorConfig> = {}
): Generator<IpBatch, void, unknown> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  let batchId = 0;
  let totalBatches = 0;
  
  // Calculate total batches
  for (const subnetNetwork of targetSubnets) {
    const subnetIps = generateSubnetIps(subnetNetwork, finalConfig);
    totalBatches += Math.ceil(subnetIps.length / finalConfig.batchSize);
  }
  
  // Process each target subnet
  for (const subnetNetwork of targetSubnets) {
    const subnetIps = generateSubnetIps(subnetNetwork, finalConfig);
    
    // Generate batches for this subnet
    for (let i = 0; i < subnetIps.length; i += finalConfig.batchSize) {
      const batchIps = subnetIps.slice(i, i + finalConfig.batchSize);
      
      if (batchIps.length > 0) {
        yield {
          startIp: batchIps[0]!,
          endIp: batchIps[batchIps.length - 1]!,
          ips: batchIps,
          batchId: batchId++,
          totalBatches,
          subnetHint: subnetNetwork,
        };
      }
    }
  }
}

/**
 * Ultra-fast IP generation that prioritizes the most likely networks
 * Reduces scan scope from 1.1M IPs to ~750 IPs in detected active subnets
 */
export const generateUltraFastIpList = (
  detectedSubnets: readonly {
    readonly network: string;
    readonly broadcastRange: readonly string[];
    readonly confidence: number;
  }[],
  maxIpsTotal: number = 750
): readonly string[] => {
  const ips: string[] = [];
  
  // Sort by confidence (highest first)
  const sortedSubnets = [...detectedSubnets].sort((a, b) => b.confidence - a.confidence);
  
  // Add common MikroTik IPs first
  for (const commonIp of COMMON_MIKROTIK_IPS) {
    if (ips.length >= maxIpsTotal) break;
    
    // Check if this IP is in any detected subnet
    for (const subnet of sortedSubnets) {
      if (subnet.broadcastRange.includes(commonIp)) {
        ips.push(commonIp);
        break;
      }
    }
  }
  
  // Add subnet IPs by confidence, prioritizing gateways
  for (const subnet of sortedSubnets) {
    if (ips.length >= maxIpsTotal) break;
    
    // Prioritize gateway IPs (.1, .254) and common device IPs
    const priorityOrder = [1, 254, 2, 253, 10, 100, 101, 102, 200, 201, 202];
    const subnetBase = subnet.network.substring(0, subnet.network.lastIndexOf('.'));
    
    for (const hostPart of priorityOrder) {
      if (ips.length >= maxIpsTotal) break;
      const ip = `${subnetBase}.${hostPart}`;
      if (subnet.broadcastRange.includes(ip) && !ips.includes(ip)) {
        ips.push(ip);
      }
    }
    
    // Add remaining IPs from this subnet up to the limit
    for (const ip of subnet.broadcastRange) {
      if (ips.length >= maxIpsTotal) break;
      if (!ips.includes(ip)) {
        ips.push(ip);
      }
    }
  }
  
  return ips.slice(0, maxIpsTotal);
};

/**
 * Estimates the scan time reduction achieved by smart subnet detection
 */
export const calculateSmartScanReduction = (
  totalIpsInDetectedSubnets: number
): {
  readonly originalIpCount: number;
  readonly optimizedIpCount: number;
  readonly reductionFactor: number;
  readonly estimatedTimeReduction: number; // Percentage reduction in scan time
} => {
  const originalIpCount = 1048576; // Full 192.168.0.0/16 range
  const optimizedIpCount = Math.min(totalIpsInDetectedSubnets, 750); // Cap at 750 for ultra-fast
  
  const reductionFactor = originalIpCount / optimizedIpCount;
  const estimatedTimeReduction = ((originalIpCount - optimizedIpCount) / originalIpCount) * 100;
  
  return {
    originalIpCount,
    optimizedIpCount,
    reductionFactor,
    estimatedTimeReduction,
  };
};