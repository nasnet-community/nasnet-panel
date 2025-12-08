/**
 * Ultra-fast subnet detection using WebRTC local IP discovery
 * Detects only active local subnets to dramatically reduce scan scope
 * Target: Reduce scan from 1.1M IPs to ~750 IPs in active subnets
 */

export interface DetectedSubnet {
  readonly network: string; // e.g., "192.168.1.0"
  readonly cidr: string; // e.g., "192.168.1.0/24"
  readonly gateway: string; // e.g., "192.168.1.1"
  readonly broadcastRange: readonly string[]; // IPs to scan in this subnet
  readonly confidence: number; // 0-1, higher means more likely to have devices
  readonly localIp?: string; // The local IP that indicated this subnet
}

export interface SubnetDetectionResult {
  readonly detectedSubnets: readonly DetectedSubnet[];
  readonly totalIpsToScan: number;
  readonly reductionFactor: number; // How much we reduced the scan scope
  readonly detectionTimeMs: number;
}

/** Cache for subnet detection results */
let subnetCache: SubnetDetectionResult | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 30000; // 30 seconds

/**
 * Extracts network address from IP and subnet mask
 */
const getNetworkAddress = (ip: string, subnetBits: number = 24): string => {
  const parts = ip.split('.').map(Number);
  const mask = (0xFFFFFFFF << (32 - subnetBits)) >>> 0;
  
  const ipInt = (parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!;
  const networkInt = (ipInt & mask) >>> 0;
  
  return [
    (networkInt >>> 24) & 0xFF,
    (networkInt >>> 16) & 0xFF,
    (networkInt >>> 8) & 0xFF,
    networkInt & 0xFF
  ].join('.');
};

/**
 * Generates optimized IP range for a subnet (skips network, broadcast, and likely unused IPs)
 */
const generateSubnetIps = (network: string): string[] => {
  const networkParts = network.split('.');
  const baseNetwork = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}`;
  
  const ips: string[] = [];
  
  // Priority IPs first (most likely to be routers/devices)
  const priorityHosts = [1, 254, 2, 253, 10, 100]; // Gateways and common device IPs
  
  for (const host of priorityHosts) {
    ips.push(`${baseNetwork}.${host}`);
  }
  
  // Add a reasonable range of common device IPs (skip obvious gaps)
  for (let host = 3; host <= 50; host++) {
    if (!priorityHosts.includes(host)) {
      ips.push(`${baseNetwork}.${host}`);
    }
  }
  
  // Add some higher range IPs that are commonly used
  for (let host = 101; host <= 150; host++) {
    if (!priorityHosts.includes(host)) {
      ips.push(`${baseNetwork}.${host}`);
    }
  }
  
  // Add DHCP pool range end
  for (let host = 200; host <= 252; host++) {
    if (!priorityHosts.includes(host)) {
      ips.push(`${baseNetwork}.${host}`);
    }
  }
  
  return ips;
};

/**
 * Detects local IP addresses using WebRTC
 */
const detectLocalIPs = (): Promise<string[]> => {
  return new Promise((resolve) => {
    const localIPs = new Set<string>();
    const timeout = setTimeout(() => resolve(Array.from(localIPs)), 2000);
    
    try {
      // Create a dummy peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      // Create a dummy data channel
      pc.createDataChannel('');
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && event.candidate.candidate) {
          const candidate = event.candidate.candidate;
          
          // Extract IP from candidate string
          const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (ipMatch) {
            const ip = ipMatch[1]!;
            
            // Filter for private IP ranges
            if (isPrivateIP(ip)) {
              localIPs.add(ip);
            }
          }
        }
      };
      
      // Create offer to start ICE gathering
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          // Ignore errors, we'll use whatever IPs we found
        });
      
      // Also try the legacy approach
      pc.createOffer().then(offer => {
        const lines = offer.sdp!.split('\n');
        for (const line of lines) {
          if (line.startsWith('a=candidate:')) {
            const ipMatch = line.match(/(\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) {
              const ip = ipMatch[1]!;
              if (isPrivateIP(ip)) {
                localIPs.add(ip);
              }
            }
          }
        }
      }).catch(() => {
        // Ignore errors
      });
      
      // Cleanup after timeout
      setTimeout(() => {
        pc.close();
        clearTimeout(timeout);
        resolve(Array.from(localIPs));
      }, 2000);
      
    } catch (error) {
      clearTimeout(timeout);
      // Fallback: return common subnets if WebRTC fails
      resolve(['192.168.1.100', '192.168.0.100', '10.0.0.100']);
    }
  });
};

/**
 * Checks if an IP address is in a private range
 */
const isPrivateIP = (ip: string): boolean => {
  const parts = ip.split('.').map(Number);
  
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) return true;
  
  return false;
};

/**
 * Calculates confidence score for a subnet based on local IP presence
 */
const calculateSubnetConfidence = (subnet: string, localIPs: readonly string[]): number => {
  let confidence = 0.1; // Base confidence
  
  // Higher confidence if we have a local IP in this subnet
  for (const localIP of localIPs) {
    const localNetwork = getNetworkAddress(localIP);
    if (localNetwork === subnet) {
      confidence = 0.9;
      break;
    }
  }
  
  // Boost confidence for common subnets
  if (subnet.startsWith('192.168.1.') || subnet.startsWith('192.168.0.')) {
    confidence += 0.2;
  }
  
  return Math.min(confidence, 1.0);
};

/**
 * Detects active local subnets using WebRTC and common patterns
 */
export const detectActiveSubnets = async (): Promise<SubnetDetectionResult> => {
  const startTime = performance.now();
  
  // Check cache first
  const now = Date.now();
  if (subnetCache && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return subnetCache;
  }
  
  try {
    // Get local IPs via WebRTC
    const localIPs = await detectLocalIPs();
    
    // Extract unique subnets from local IPs
    const subnetMap = new Map<string, DetectedSubnet>();
    
    // Process detected local IPs
    for (const localIP of localIPs) {
      const network = getNetworkAddress(localIP);
      const networkParts = network.split('.');
      const gateway = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.1`;
      const broadcastRange = generateSubnetIps(network);
      const confidence = calculateSubnetConfidence(network, localIPs);
      
      const subnet: DetectedSubnet = {
        network,
        cidr: `${network}/24`,
        gateway,
        broadcastRange,
        confidence,
        localIp: localIP,
      };
      
      subnetMap.set(network, subnet);
    }
    
    // Add common fallback subnets if none detected
    if (subnetMap.size === 0) {
      const fallbackSubnets = [
        '192.168.1.0',
        '192.168.0.0',
        '192.168.88.0', // Default MikroTik
        '10.0.0.0',
      ];
      
      for (const network of fallbackSubnets) {
        const networkParts = network.split('.');
        const gateway = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.1`;
        const broadcastRange = generateSubnetIps(network);
        
        const subnet: DetectedSubnet = {
          network,
          cidr: `${network}/24`,
          gateway,
          broadcastRange,
          confidence: 0.3, // Lower confidence for fallbacks
        };
        
        subnetMap.set(network, subnet);
      }
    }
    
    // Sort by confidence (highest first)
    const detectedSubnets = Array.from(subnetMap.values())
      .sort((a, b) => b.confidence - a.confidence);
    
    const totalIpsToScan = detectedSubnets.reduce(
      (total, subnet) => total + subnet.broadcastRange.length,
      0
    );
    
    // Calculate reduction factor (assuming we would have scanned 1.1M IPs)
    const reductionFactor = 1048576 / Math.max(totalIpsToScan, 1); // 1,048,576 = 192.168.0.0/16 range
    
    const result: SubnetDetectionResult = {
      detectedSubnets,
      totalIpsToScan,
      reductionFactor,
      detectionTimeMs: performance.now() - startTime,
    };
    
    // Cache the result
    subnetCache = result;
    cacheTimestamp = now;
    
    return result;
    
  } catch (error) {
    console.warn('Subnet detection failed, using fallback:', error);
    
    // Fallback to common subnets
    const fallbackSubnets: DetectedSubnet[] = [
      {
        network: '192.168.1.0',
        cidr: '192.168.1.0/24',
        gateway: '192.168.1.1',
        broadcastRange: generateSubnetIps('192.168.1.0'),
        confidence: 0.5,
      },
      {
        network: '192.168.0.0',
        cidr: '192.168.0.0/24',
        gateway: '192.168.0.1',
        broadcastRange: generateSubnetIps('192.168.0.0'),
        confidence: 0.4,
      },
    ];
    
    const totalIpsToScan = fallbackSubnets.reduce(
      (total, subnet) => total + subnet.broadcastRange.length,
      0
    );
    
    const result: SubnetDetectionResult = {
      detectedSubnets: fallbackSubnets,
      totalIpsToScan,
      reductionFactor: 1048576 / totalIpsToScan,
      detectionTimeMs: performance.now() - startTime,
    };
    
    return result;
  }
};

/**
 * Gets only the most likely active subnets (top 3 by confidence)
 */
export const getFastestScanSubnets = async (): Promise<DetectedSubnet[]> => {
  const result = await detectActiveSubnets();
  return result.detectedSubnets.slice(0, 3); // Only top 3 most confident subnets
};

/**
 * Clears the subnet detection cache (useful for forcing re-detection)
 */
export const clearSubnetCache = (): void => {
  subnetCache = null;
  cacheTimestamp = 0;
};

/**
 * Manual subnet addition for testing or specific scenarios
 */
export const addManualSubnet = (network: string): DetectedSubnet => {
  const networkParts = network.split('.');
  const gateway = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.1`;
  const broadcastRange = generateSubnetIps(network);
  
  return {
    network,
    cidr: `${network}/24`,
    gateway,
    broadcastRange,
    confidence: 1.0, // Manual entries get max confidence
  };
};