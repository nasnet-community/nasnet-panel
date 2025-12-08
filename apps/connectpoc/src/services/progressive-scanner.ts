/**
 * Progressive Scanner Service
 * Implements progressive discovery pattern for immediate result display
 * Shows results as soon as they're found, prioritizes most likely subnets
 */

import { 
  detectActiveSubnets, 
  getFastestScanSubnets,
  type DetectedSubnet,
  type SubnetDetectionResult 
} from '@/utils/subnet-detector';
import { 
  type FastScanConfig,
  type FastScanProgress
} from '@/services/fast-scanner';
import type { ScanResult } from '@shared/routeros';
import { getDefaultCredentials } from './auth-config';

export interface ProgressiveResult {
  readonly ip: string;
  readonly responseTime: number;
  readonly subnet: string;
  readonly confidence: number;
  readonly foundAt: number; // Timestamp when found
  readonly scanOrder: number; // Order in which this IP was scanned
}

export interface ProgressiveScanConfig extends Partial<FastScanConfig> {
  readonly maxResults?: number; // Stop after finding N results
  readonly maxScanTime?: number; // Stop after N milliseconds
  readonly prioritySubnetsOnly?: boolean; // Only scan top 3 subnets
  readonly showProgress?: boolean; // Whether to emit progress events
}

export interface ProgressiveScanState {
  readonly isScanning: boolean;
  readonly foundDevices: readonly ProgressiveResult[];
  readonly scannedSubnets: readonly string[];
  readonly totalSubnetsToScan: number;
  readonly elapsedTime: number;
  readonly estimatedTimeRemaining: number;
  readonly scanSpeed: number; // IPs per second
  readonly phase: 'detecting' | 'scanning' | 'complete' | 'stopped';
}

export interface ProgressiveScanCallbacks {
  readonly onDeviceFound?: (device: ProgressiveResult) => void;
  readonly onSubnetComplete?: (subnet: string, foundCount: number) => void;
  readonly onProgressUpdate?: (state: ProgressiveScanState) => void;
  readonly onPhaseChange?: (phase: ProgressiveScanState['phase']) => void;
  readonly onComplete?: (results: readonly ProgressiveResult[]) => void;
}

/** Active progressive scan state */
let activeProgressiveScan: {
  startTime: number;
  abortController: AbortController;
  state: ProgressiveScanState;
  config: ProgressiveScanConfig;
  callbacks: ProgressiveScanCallbacks;
  foundDevices: ProgressiveResult[];
  scanOrder: number;
} | null = null;

/**
 * Starts a progressive scan that shows results immediately
 */
export const startProgressiveScan = async (
  config: ProgressiveScanConfig = {},
  callbacks: ProgressiveScanCallbacks = {}
): Promise<readonly ProgressiveResult[]> => {
  // Stop any existing scan
  if (activeProgressiveScan) {
    stopProgressiveScan();
  }
  
  const startTime = performance.now();
  const abortController = new AbortController();
  
  // Initialize state
  const initialState: ProgressiveScanState = {
    isScanning: true,
    foundDevices: [],
    scannedSubnets: [],
    totalSubnetsToScan: 0,
    elapsedTime: 0,
    estimatedTimeRemaining: 0,
    scanSpeed: 0,
    phase: 'detecting',
  };
  
  const foundDevices: ProgressiveResult[] = [];
  let scanOrder = 0;
  
  activeProgressiveScan = {
    startTime,
    abortController,
    state: initialState,
    config,
    callbacks,
    foundDevices,
    scanOrder,
  };
  
  try {
    // Phase 1: Detect subnets
    callbacks.onPhaseChange?.('detecting');
    updateProgressiveState({ phase: 'detecting' });
    
    console.log('🔍 Progressive scan: Detecting active subnets...');
    
    const subnetDetection = config.prioritySubnetsOnly 
      ? { 
          detectedSubnets: await getFastestScanSubnets(),
          totalIpsToScan: 0,
          reductionFactor: 0,
          detectionTimeMs: 0
        } as SubnetDetectionResult
      : await detectActiveSubnets();
    
    if (abortController.signal.aborted) {
      return [];
    }
    
    const subnetsToScan = subnetDetection.detectedSubnets;
    
    updateProgressiveState({ 
      totalSubnetsToScan: subnetsToScan.length,
      phase: 'scanning'
    });
    
    callbacks.onPhaseChange?.('scanning');
    
    console.log(`📊 Progressive scan: Scanning ${subnetsToScan.length} subnets progressively`);
    
    // Phase 2: Progressive scanning of subnets by priority
    const sortedSubnets = subnetsToScan
      .slice() // Make a copy
      .sort((a, b) => b.confidence - a.confidence); // Highest confidence first
    
    let totalScanned = 0;
    
    for (const [index, subnet] of sortedSubnets.entries()) {
      if (abortController.signal.aborted) break;
      
      // Check limits
      if (config.maxResults && foundDevices.length >= config.maxResults) {
        console.log(`🎯 Progressive scan: Reached max results limit (${config.maxResults})`);
        break;
      }
      
      if (config.maxScanTime) {
        const elapsed = performance.now() - startTime;
        if (elapsed >= config.maxScanTime) {
          console.log(`⏱️ Progressive scan: Reached time limit (${config.maxScanTime}ms)`);
          break;
        }
      }
      
      console.log(`🔍 Progressive scan: Scanning subnet ${subnet.cidr} (${index + 1}/${subnetsToScan.length})`);
      
      // Scan this subnet with immediate result callback
      let subnetFoundCount = 0;
      
      try {
        const subnetScanConfig: ProgressiveScanConfig = {
          ...config,
          maxConcurrentWorkers: Math.min(config.maxConcurrentWorkers || 50, 25), // Moderate concurrency for progressive
          timeoutPerIp: config.timeoutPerIp || 150,
          batchConfig: {
            batchSize: 20, // Small batches for immediate results
            skipNetworkAndBroadcast: true,
            skipCommonNonRoutable: true,
          },
        };
        
        // Create a custom scan just for this subnet
        await scanSingleSubnetProgressively(
          subnet,
          subnetScanConfig,
          (result) => {
            if (abortController.signal.aborted) return;
            
            // Convert to progressive result
            const progressiveResult: ProgressiveResult = {
              ip: result.ip,
              responseTime: result.responseTime,
              subnet: subnet.cidr,
              confidence: subnet.confidence,
              foundAt: Date.now(),
              scanOrder: scanOrder++,
            };
            
            foundDevices.push(progressiveResult);
            subnetFoundCount++;
            
            // Immediate callback
            callbacks.onDeviceFound?.(progressiveResult);
            
            updateProgressiveState({
              foundDevices: [...foundDevices],
              elapsedTime: performance.now() - startTime,
            });
            
            console.log(`🎯 Progressive scan: Found device ${result.ip} in ${subnet.cidr}`);
          },
          (progress) => {
            if (config.showProgress && callbacks.onProgressUpdate) {
              const elapsed = performance.now() - startTime;
              const scannedCount = totalScanned + progress.scannedHosts;
              const scanSpeed = scannedCount / (elapsed / 1000);
              
              updateProgressiveState({
                elapsedTime: elapsed,
                scanSpeed,
                estimatedTimeRemaining: progress.estimatedTimeRemaining,
              });
            }
          }
        );
        
        totalScanned += subnet.broadcastRange.length;
        
      } catch (error) {
        console.warn(`⚠️ Progressive scan: Error scanning subnet ${subnet.cidr}:`, error);
      }
      
      // Update completed subnets
      const scannedSubnets = [...activeProgressiveScan.state.scannedSubnets, subnet.cidr];
      updateProgressiveState({ scannedSubnets });
      
      callbacks.onSubnetComplete?.(subnet.cidr, subnetFoundCount);
      
      console.log(`✅ Progressive scan: Completed subnet ${subnet.cidr} - found ${subnetFoundCount} devices`);
    }
    
    // Phase 3: Complete
    updateProgressiveState({ 
      phase: 'complete',
      isScanning: false,
      elapsedTime: performance.now() - startTime,
    });
    
    callbacks.onPhaseChange?.('complete');
    callbacks.onComplete?.(foundDevices);
    
    const totalTime = (performance.now() - startTime) / 1000;
    console.log(`🏁 Progressive scan completed: ${foundDevices.length} devices found in ${totalTime.toFixed(2)}s`);
    
    return foundDevices;
    
  } catch (error) {
    console.error('❌ Progressive scan error:', error);
    updateProgressiveState({ 
      phase: 'stopped',
      isScanning: false,
    });
    callbacks.onPhaseChange?.('stopped');
    return foundDevices;
    
  } finally {
    activeProgressiveScan = null;
  }
};

/**
 * Scans a single subnet progressively with immediate callbacks
 */
const scanSingleSubnetProgressively = async (
  subnet: DetectedSubnet,
  config: ProgressiveScanConfig,
  onDeviceFound: (result: ScanResult) => void,
  onProgress: (progress: FastScanProgress) => void
): Promise<void> => {
  // Create a temporary fast scanner instance focused on this subnet
  const tempConfig: FastScanConfig = {
    maxConcurrentWorkers: config.maxConcurrentWorkers || 25,
    timeoutPerIp: config.timeoutPerIp || 150,
    testUrl: config.testUrl || '/rest',
    workerPoolSize: config.workerPoolSize || 25,
    batchConfig: config.batchConfig || {
      batchSize: 20,
      skipNetworkAndBroadcast: true,
      skipCommonNonRoutable: true,
    },
    username: config.username || getDefaultCredentials().username,
    password: config.password || getDefaultCredentials().password || '',
  };
  
  // Use the custom subnet-targeted scan from fast-scanner
  // We'll simulate this by creating a custom generator for just this subnet
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/scanner.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    let completed = false;
    
    const cleanup = () => {
      if (!completed) {
        completed = true;
        worker.terminate();
      }
    };
    
    const timeout = setTimeout(() => {
      cleanup();
      resolve(); // Don't reject on timeout, just finish
    }, (config.maxScanTime || 30000)); // 30 second max per subnet
    
    worker.onmessage = (event) => {
      const { data } = event;
      
      if (data.type === 'SCAN_RESULT' && data.results) {
        // Process results immediately
        for (const result of data.results) {
          if (result.status === 'success' && result.isRestApi) {
            onDeviceFound({
              ip: result.ip,
              responseTime: result.responseTime,
              services: [{
                port: 80,
                protocol: 'tcp' as const,
                service: 'mikrotik-rest',
              }],
              version: result.version,
            });
          }
        }
        clearTimeout(timeout);
        cleanup();
        resolve();
      } else if (data.type === 'SCAN_PROGRESS' && data.progress) {
        onProgress({
          totalHosts: subnet.broadcastRange.length,
          scannedHosts: data.progress.scanned,
          foundHosts: 0,
          currentHost: data.progress.currentIp,
          estimatedTimeRemaining: 0,
          startTime: Date.now(),
          errors: [],
          workersActive: 1,
          batchesCompleted: 0,
          totalBatches: 1,
          averageResponseTime: 0,
          ipScansPerSecond: 0,
          currentRange: subnet.cidr,
          rangesCompleted: 0,
          totalRanges: 1,
          priorityIpsScanned: 0,
          totalPriorityIps: 0,
        });
      } else if (data.type === 'SCAN_ERROR') {
        clearTimeout(timeout);
        cleanup();
        reject(new Error(data.error || 'Scan error'));
      }
    };
    
    worker.onerror = (error) => {
      clearTimeout(timeout);
      cleanup();
      reject(error);
    };
    
    // Send subnet IPs to worker
    worker.postMessage({
      type: 'SCAN_BATCH',
      batchId: 1,
      ips: subnet.broadcastRange,
      timeout: tempConfig.timeoutPerIp,
      testUrl: tempConfig.testUrl,
      username: tempConfig.username,
      password: tempConfig.password,
    });
  });
};

/**
 * Updates the progressive scan state and notifies callbacks
 */
const updateProgressiveState = (updates: Partial<ProgressiveScanState>): void => {
  if (!activeProgressiveScan) return;
  
  activeProgressiveScan.state = {
    ...activeProgressiveScan.state,
    ...updates,
  };
  
  if (activeProgressiveScan.callbacks.onProgressUpdate) {
    activeProgressiveScan.callbacks.onProgressUpdate(activeProgressiveScan.state);
  }
};

/**
 * Stops the current progressive scan
 */
export const stopProgressiveScan = (): boolean => {
  if (activeProgressiveScan) {
    activeProgressiveScan.abortController.abort();
    updateProgressiveState({ 
      phase: 'stopped',
      isScanning: false,
    });
    activeProgressiveScan.callbacks.onPhaseChange?.('stopped');
    activeProgressiveScan = null;
    console.log('🛑 Progressive scan stopped');
    return true;
  }
  return false;
};

/**
 * Gets the current progressive scan state
 */
export const getProgressiveScanState = (): ProgressiveScanState | null => {
  return activeProgressiveScan?.state || null;
};

/**
 * Checks if a progressive scan is currently running
 */
export const isProgressiveScanRunning = (): boolean => {
  return activeProgressiveScan?.state.isScanning || false;
};

/**
 * Gets the results found so far in the current scan
 */
export const getCurrentProgressiveResults = (): readonly ProgressiveResult[] => {
  return activeProgressiveScan?.foundDevices || [];
};