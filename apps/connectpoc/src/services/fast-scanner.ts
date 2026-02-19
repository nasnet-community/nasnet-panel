/**
 * Ultra-high-performance network scanner with smart subnet detection
 * Uses WebRTC-based subnet discovery to scan only ~750 IPs instead of 1.1M IPs
 * Target: Complete scans in <2 seconds with progressive result display
 */

import { 
  generateIpBatches, 
  getOptimizedBatchConfig, 
  calculateGenerationMetrics,
  calculateRangeStats,
  getSupportedRanges,
  type IpBatch,
  type IpGeneratorConfig 
} from '@/utils/ip-generator';
import {
  type IpPriorityConfig
} from '@/utils/ip-priority';
import {
  detectActiveSubnets,
  type SubnetDetectionResult
} from '@/utils/subnet-detector';
import type { 
  WorkerScanRequest, 
  WorkerScanResponse, 
  ScanResult as WorkerScanResult 
} from '@/workers/scanner.worker';

import { getDefaultCredentials } from './auth-config';

import type { ScanResult, ScanProgress } from '@shared/routeros';

export interface FastScanConfig {
  readonly maxConcurrentWorkers: number;
  readonly timeoutPerIp: number;
  readonly testUrl: string;
  readonly workerPoolSize: number;
  readonly batchConfig: IpGeneratorConfig;
  readonly priorityConfig?: IpPriorityConfig;
  readonly username?: string; // Basic auth username
  readonly password?: string; // Basic auth password
}

export interface FastScanProgress extends ScanProgress {
  workersActive: number;
  batchesCompleted: number;
  totalBatches: number;
  averageResponseTime: number;
  ipScansPerSecond: number;
  currentRange: string;
  rangesCompleted: number;
  totalRanges: number;
  priorityIpsScanned: number;
  totalPriorityIps: number;
}

export interface FastScanResult {
  readonly results: readonly ScanResult[];
  readonly totalScanned: number;
  readonly totalFound: number;
  readonly scanDuration: number;
  readonly averageResponseTime: number;
  readonly scansPerSecond: number;
}

/** Ultra-fast configuration optimized for <2 second scans */
const DEFAULT_FAST_CONFIG: FastScanConfig = {
  maxConcurrentWorkers: 100, // Increased from 20 to 100 for maximum concurrency
  timeoutPerIp: 150, // Reduced from 500ms to 150ms for ultra-fast scanning
  testUrl: '/rest', // Test RouterOS REST API endpoint (no trailing slash)
  workerPoolSize: 100, // Increased from 20 to 100 workers
  batchConfig: {
    batchSize: 50, // Reduced from 1000 to 50 for faster progressive results
    skipNetworkAndBroadcast: true,
    skipCommonNonRoutable: true,
    enableMultipleRanges: false, // Disable to focus on detected subnets only
    prioritizeGatewayIps: true,
    prioritizeCommonIps: true,
  },
  priorityConfig: {
    prioritizeGateways: true,
    prioritizeSecondaryGateways: true,
    customPriorityIps: [],
  },
  username: 'admin', // Default MikroTik username
  password: '', // Default empty password
} as const;

/** Active scan state management */
interface ActiveFastScan {
  readonly abortController: AbortController;
  readonly startTime: number;
  readonly workers: Worker[];
  readonly progress: FastScanProgress;
  readonly results: ScanResult[];
  readonly workerPromises: Map<number, Promise<void>>;
}

let activeFastScan: ActiveFastScan | null = null;

/**
 * Creates and initializes a pool of Web Workers
 */
const createWorkerPool = (poolSize: number): Worker[] => {
  const workers: Worker[] = [];
  
  for (let i = 0; i < poolSize; i++) {
    try {
      // Create worker from the scanner worker file
      const worker = new Worker(
        new URL('../workers/scanner.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      // Initialize worker
      worker.postMessage({ type: 'INIT' });
      workers.push(worker);
    } catch (error) {
      console.error(`Failed to create worker ${i}:`, error);
    }
  }
  
  return workers;
};

/**
 * Terminates all workers in the pool
 */
const terminateWorkerPool = (workers: Worker[]): void => {
  workers.forEach(worker => {
    try {
      worker.terminate();
    } catch (error) {
      console.error('Error terminating worker:', error);
    }
  });
};

/**
 * Converts worker scan result to application scan result format
 */
const convertWorkerResult = (workerResult: WorkerScanResult): ScanResult => {
  const result: ScanResult = {
    ip: workerResult.ip,
    responseTime: workerResult.responseTime,
    services: [{
      port: workerResult.protocol === 'https' ? 443 : 80,
      protocol: 'tcp' as const,
      service: workerResult.isRestApi ? 'mikrotik-rest' : 'http',
    }],
  };
  
  if (workerResult.version) {
    result.version = workerResult.version;
  }
  
  return result;
};

/**
 * Processes a single batch using an available worker
 */
const processBatchWithWorker = async (
  worker: Worker,
  batch: IpBatch,
  config: FastScanConfig,
  onProgress: (batchId: number, progress: WorkerScanResponse['progress']) => void,
  onResults: (batchId: number, results: readonly ScanResult[]) => void,
  signal: AbortSignal
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Scan aborted'));
      return;
    }
    
    const timeoutId = setTimeout(() => {
      reject(new Error(`Batch ${batch.batchId} timeout`));
    }, config.timeoutPerIp * batch.ips.length + 5000); // Extra 5s buffer
    
    const handleMessage = (event: MessageEvent<WorkerScanResponse>) => {
      const { data } = event;
      
      if (data.batchId !== batch.batchId) return;
      
      switch (data.type) {
        case 'SCAN_PROGRESS':
          if (data.progress) {
            onProgress(batch.batchId, data.progress);
          }
          break;
          
        case 'SCAN_RESULT':
          clearTimeout(timeoutId);
          worker.removeEventListener('message', handleMessage);
          
          if (data.results) {
            const convertedResults = data.results.map(convertWorkerResult);
            onResults(batch.batchId, convertedResults);
          }
          
          resolve();
          break;
          
        case 'SCAN_ERROR':
          clearTimeout(timeoutId);
          worker.removeEventListener('message', handleMessage);
          reject(new Error(data.error || 'Worker scan error'));
          break;
      }
    };
    
    worker.addEventListener('message', handleMessage);
    
    // Send batch to worker
    const request: WorkerScanRequest = {
      type: 'SCAN_BATCH',
      batchId: batch.batchId,
      ips: batch.ips,
      timeout: config.timeoutPerIp,
      testUrl: config.testUrl,
      username: config.username || 'admin',
      password: config.password || '',
    };
    
    worker.postMessage(request);
  });
};

/**
 * Ultra-fast scanning of multiple IP ranges with priority-based discovery
 * Supports 192.168.0.0/16 and 172.16.0.0/12 ranges
 */
export const scanEntireRange = async (
  config: Partial<FastScanConfig> = {},
  onProgress?: (progress: FastScanProgress) => void,
  onHostFound?: (result: ScanResult) => void
): Promise<FastScanResult> => {
  const finalConfig = { ...DEFAULT_FAST_CONFIG, ...config };
  
  // Auto-optimize batch configuration based on worker count
  const optimizedBatchConfig = getOptimizedBatchConfig(
    finalConfig.maxConcurrentWorkers * 50, // 50 IPs per worker minimum
    200 // 200MB memory budget
  );
  
  const effectiveConfig = {
    ...finalConfig,
    batchConfig: { ...finalConfig.batchConfig, ...optimizedBatchConfig },
  };
  
  const startTime = performance.now();
  const abortController = new AbortController();
  
  // Create worker pool
  const workers = createWorkerPool(effectiveConfig.workerPoolSize);
  
  if (workers.length === 0) {
    throw new Error('Failed to create any workers');
  }
  
  // Initialize progress tracking
  const metrics = calculateGenerationMetrics(effectiveConfig.batchConfig);
  const rangeStats = calculateRangeStats(effectiveConfig.batchConfig);
  const supportedRanges = getSupportedRanges();
  
  const progress: FastScanProgress = {
    totalHosts: metrics.totalIps,
    scannedHosts: 0,
    foundHosts: 0,
    currentHost: '',
    estimatedTimeRemaining: 0,
    startTime: Date.now(),
    errors: [],
    workersActive: 0,
    batchesCompleted: 0,
    totalBatches: metrics.totalBatches,
    averageResponseTime: 0,
    ipScansPerSecond: 0,
    currentRange: effectiveConfig.batchConfig.enableMultipleRanges 
      ? supportedRanges[0]?.name || '192.168.0.0/16'
      : '192.168.0.0/16',
    rangesCompleted: 0,
    totalRanges: effectiveConfig.batchConfig.enableMultipleRanges 
      ? supportedRanges.length 
      : 1,
    priorityIpsScanned: 0,
    totalPriorityIps: rangeStats.priorityIps,
  };
  
  const results: ScanResult[] = [];
  const workerPromises = new Map<number, Promise<void>>();
  let responseTimes: number[] = [];
  
  // Set up active scan state
  activeFastScan = {
    abortController,
    startTime,
    workers,
    progress,
    results,
    workerPromises,
  };
  
  try {
    // Generate and process batches
    const batchGenerator = generateIpBatches(effectiveConfig.batchConfig);
    const activeBatches = new Set<number>();
    let workerIndex = 0;
    let isPriorityPhase = true;
    
    // Process batches with worker pool
    for (const batch of batchGenerator) {
      if (abortController.signal.aborted) break;
      
      // Update current range info based on batch content
      if (batch.ips.length > 0) {
        const firstIp = batch.ips[0]!;
        if (firstIp.startsWith('192.168.')) {
          progress.currentRange = '192.168.0.0/16';
        } else if (firstIp.startsWith('172.')) {
          progress.currentRange = '172.16.0.0/12';
        }
        
        // Detect if this is a priority batch
        const isPriorityBatch = batch.ips.some(ip => {
          const lastOctet = parseInt(ip.split('.')[3]!);
          return lastOctet === 1 || lastOctet === 254;
        }) || batch.batchId <= 1; // First two batches are typically priority
        
        if (isPriorityBatch && isPriorityPhase) {
          // Still in priority phase
        } else {
          isPriorityPhase = false;
        }
      }
      
      // Wait for available worker if all are busy
      while (activeBatches.size >= effectiveConfig.maxConcurrentWorkers) {
        await Promise.race(Array.from(workerPromises.values()));
      }
      
      const worker = workers[workerIndex % workers.length]!;
      workerIndex++;
      
      activeBatches.add(batch.batchId);
      progress.workersActive = activeBatches.size;
      
      const batchPromise = processBatchWithWorker(
        worker,
        batch,
        effectiveConfig,
        (_, batchProgress) => {
          // Update progress from batch
          if (batchProgress) {
            progress.currentHost = batchProgress.currentIp;
            progress.scannedHosts += 1; // Incremental update
            
            // Track priority IPs
            if (isPriorityPhase) {
              progress.priorityIpsScanned += 1;
            }
            
            // Calculate performance metrics
            const elapsed = (performance.now() - startTime) / 1000;
            progress.ipScansPerSecond = progress.scannedHosts / elapsed;
            
            if (responseTimes.length > 0) {
              progress.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            }
            
            // Estimate time remaining
            const remainingHosts = progress.totalHosts - progress.scannedHosts;
            progress.estimatedTimeRemaining = Math.round(remainingHosts / Math.max(progress.ipScansPerSecond, 1));
            
            onProgress?.(progress);
          }
        },
        (_, batchResults) => {
          // Handle batch results
          batchResults.forEach(result => {
            results.push(result);
            responseTimes.push(result.responseTime);
            
            // Keep response times array manageable
            if (responseTimes.length > 1000) {
              responseTimes = responseTimes.slice(-500);
            }
            
            progress.foundHosts++;
            onHostFound?.(result);
          });
          
          progress.batchesCompleted++;
          activeBatches.delete(batch.batchId);
          progress.workersActive = activeBatches.size;
          
          // Update range completion status
          const completionPercentage = (progress.batchesCompleted / progress.totalBatches) * 100;
          if (completionPercentage >= 50 && progress.rangesCompleted === 0) {
            progress.rangesCompleted = 1; // Rough estimate for range completion
          }
          
          onProgress?.(progress);
        },
        abortController.signal
      ).finally(() => {
        activeBatches.delete(batch.batchId);
        workerPromises.delete(batch.batchId);
        progress.workersActive = activeBatches.size;
      });
      
      workerPromises.set(batch.batchId, batchPromise);
    }
    
    // Wait for all remaining batches to complete
    await Promise.allSettled(Array.from(workerPromises.values()));
    
    const endTime = performance.now();
    const scanDuration = (endTime - startTime) / 1000;
    
    const finalResult: FastScanResult = {
      results,
      totalScanned: progress.scannedHosts,
      totalFound: results.length,
      scanDuration,
      averageResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0,
      scansPerSecond: progress.scannedHosts / scanDuration,
    };
    
    return finalResult;
    
  } finally {
    // Cleanup
    terminateWorkerPool(workers);
    activeFastScan = null;
  }
};

/**
 * Quick scan of specific subnets within 192.168.0.0/16 range
 */
export const scanSubnets = async (
  subnets: readonly number[], // e.g., [1, 2, 10] for 192.168.1.0/24, 192.168.2.0/24, etc.
  config: Partial<FastScanConfig> = {},
  onProgress?: (progress: FastScanProgress) => void,
  onHostFound?: (result: ScanResult) => void
): Promise<FastScanResult> => {
  // Generate IPs for specific subnets only
  const customConfig = {
    ...DEFAULT_FAST_CONFIG,
    ...config,
    batchConfig: {
      ...DEFAULT_FAST_CONFIG.batchConfig,
      ...config.batchConfig,
    },
  };
  
  // For now, fall back to full range scan and filter
  // In a production system, you'd optimize this to generate only target subnets
  const result = await scanEntireRange(customConfig, onProgress, onHostFound);
  
  // Filter results to only include target subnets
  const filteredResults = result.results.filter(scanResult => {
    const ipParts = scanResult.ip.split('.');
    const subnet = parseInt(ipParts[2]!);
    return subnets.includes(subnet);
  });
  
  return {
    ...result,
    results: filteredResults,
    totalFound: filteredResults.length,
  };
};

/**
 * Cancel active fast scan
 */
export const cancelFastScan = (): boolean => {
  if (activeFastScan) {
    activeFastScan.abortController.abort();
    terminateWorkerPool(activeFastScan.workers);
    activeFastScan = null;
    return true;
  }
  return false;
};

/**
 * Get current fast scan progress
 */
export const getFastScanProgress = (): FastScanProgress | null => {
  return activeFastScan?.progress || null;
};

/**
 * Estimate scan duration for fast scanning
 */
export const estimateFastScanDuration = (config: Partial<FastScanConfig> = {}): number => {
  const finalConfig = { ...DEFAULT_FAST_CONFIG, ...config };
  const metrics = calculateGenerationMetrics(finalConfig.batchConfig);
  
  // Conservative estimate: assume 70% of theoretical maximum throughput
  const theoreticalScansPerSecond = 
    finalConfig.maxConcurrentWorkers * (1000 / finalConfig.timeoutPerIp) * 0.7;
  
  return Math.ceil(metrics.totalIps / theoreticalScansPerSecond);
};

/**
 * Validate fast scan configuration
 */
export const validateFastScanConfig = (config: Partial<FastScanConfig>): string[] => {
  const errors: string[] = [];
  
  if (config.maxConcurrentWorkers !== undefined) {
    if (config.maxConcurrentWorkers < 1) {
      errors.push('maxConcurrentWorkers must be at least 1');
    }
    if (config.maxConcurrentWorkers > 50) {
      errors.push('maxConcurrentWorkers should not exceed 50 for browser stability');
    }
  }
  
  if (config.timeoutPerIp !== undefined) {
    if (config.timeoutPerIp < 100) {
      errors.push('timeoutPerIp must be at least 100ms');
    }
    if (config.timeoutPerIp > 5000) {
      errors.push('timeoutPerIp should not exceed 5000ms for fast scanning');
    }
  }
  
  if (config.workerPoolSize !== undefined) {
    if (config.workerPoolSize < 1) {
      errors.push('workerPoolSize must be at least 1');
    }
    if (config.workerPoolSize > 100) {
      errors.push('workerPoolSize should not exceed 100 for browser stability');
    }
  }
  
  return errors;
};

/**
 * Get optimized configuration based on system capabilities
 */
export const getOptimizedFastScanConfig = (): FastScanConfig => {
  // Get credentials from centralized auth configuration
  const credentials = getDefaultCredentials();
  // Detect system capabilities
  const navigatorConcurrency = navigator.hardwareConcurrency || 4;
  const estimatedMemoryMB = (navigator as any).deviceMemory ? 
    (navigator as any).deviceMemory * 1024 : 4096; // Default to 4GB
  
  // Scale configuration based on system capabilities - ultra-fast settings
  const optimalWorkers = Math.min(
    Math.max(8, navigatorConcurrency * 4), // 4x CPU cores, min 8
    100 // Cap at 100 for ultra-fast scanning
  );
  
  const optimalBatchSize = Math.min(
    50, // Small batches for progressive results
    Math.floor(estimatedMemoryMB / 100) // Conservative memory usage
  );
  
  return {
    maxConcurrentWorkers: optimalWorkers,
    timeoutPerIp: 150, // Ultra-fast timeout
    testUrl: '/rest', // No trailing slash per official docs
    workerPoolSize: optimalWorkers,
    batchConfig: {
      batchSize: optimalBatchSize,
      skipNetworkAndBroadcast: true,
      skipCommonNonRoutable: true,
    },
    username: credentials.username,
    password: credentials.password || '',
  };
};

/**
 * Ultra-fast subnet-based scanning - scans only detected active subnets
 * Target: <2 second scan time for ~750 IPs instead of 1.1M IPs
 */
export const scanDetectedSubnets = async (
  config: Partial<FastScanConfig> = {},
  onProgress?: (progress: FastScanProgress) => void,
  onHostFound?: (result: ScanResult) => void,
  onSubnetDetected?: (subnets: SubnetDetectionResult) => void
): Promise<FastScanResult> => {
  const startTime = performance.now();
  
  // First, detect active subnets
  console.log('🔍 Detecting active subnets...');
  const subnetDetection = await detectActiveSubnets();
  onSubnetDetected?.(subnetDetection);
  
  console.log(`📊 Detected ${subnetDetection.detectedSubnets.length} subnets, scanning ${subnetDetection.totalIpsToScan} IPs (reduction: ${subnetDetection.reductionFactor.toFixed(1)}x)`);
  
  if (subnetDetection.detectedSubnets.length === 0) {
    // Fallback to minimal scan if no subnets detected
    return {
      results: [],
      totalScanned: 0,
      totalFound: 0,
      scanDuration: (performance.now() - startTime) / 1000,
      averageResponseTime: 0,
      scansPerSecond: 0,
    };
  }
  
  // Use ultra-fast configuration
  const finalConfig = { 
    ...DEFAULT_FAST_CONFIG, 
    ...config,
    batchConfig: {
      ...DEFAULT_FAST_CONFIG.batchConfig,
      ...config.batchConfig,
      enableMultipleRanges: false, // Disable multi-range for subnet focus
    }
  };
  
  // Create worker pool
  const workers = createWorkerPool(finalConfig.workerPoolSize);
  
  if (workers.length === 0) {
    throw new Error('Failed to create any workers');
  }
  
  const abortController = new AbortController();
  const results: ScanResult[] = [];
  const workerPromises = new Map<number, Promise<void>>();
  let responseTimes: number[] = [];
  
  // Initialize progress
  const progress: FastScanProgress = {
    totalHosts: subnetDetection.totalIpsToScan,
    scannedHosts: 0,
    foundHosts: 0,
    currentHost: '',
    estimatedTimeRemaining: 0,
    startTime: Date.now(),
    errors: [],
    workersActive: 0,
    batchesCompleted: 0,
    totalBatches: 0,
    averageResponseTime: 0,
    ipScansPerSecond: 0,
    currentRange: 'Detected Subnets',
    rangesCompleted: 0,
    totalRanges: subnetDetection.detectedSubnets.length,
    priorityIpsScanned: 0,
    totalPriorityIps: 0,
  };
  
  // Set up active scan state
  activeFastScan = {
    abortController,
    startTime,
    workers,
    progress,
    results,
    workerPromises,
  };
  
  try {
    let batchId = 0;
    let workerIndex = 0;
    const activeBatches = new Set<number>();
    
    // Process each detected subnet
    for (const subnet of subnetDetection.detectedSubnets) {
      if (abortController.signal.aborted) break;
      
      progress.currentRange = subnet.cidr;
      
      // Split subnet IPs into small batches for progressive results
      const ips = subnet.broadcastRange;
      const batchSize = finalConfig.batchConfig.batchSize;
      
      progress.totalBatches += Math.ceil(ips.length / batchSize);
      
      for (let i = 0; i < ips.length; i += batchSize) {
        if (abortController.signal.aborted) break;
        
        const batchIps = ips.slice(i, i + batchSize);
        
        // Wait for available worker if all are busy
        while (activeBatches.size >= finalConfig.maxConcurrentWorkers) {
          await Promise.race(Array.from(workerPromises.values()));
        }
        
        const worker = workers[workerIndex % workers.length]!;
        workerIndex++;
        
        const currentBatchId = batchId++;
        activeBatches.add(currentBatchId);
        progress.workersActive = activeBatches.size;
        
        const batch: IpBatch = {
          startIp: batchIps[0]!,
          endIp: batchIps[batchIps.length - 1]!,
          ips: batchIps,
          batchId: currentBatchId,
          totalBatches: progress.totalBatches,
        };
        
        const batchPromise = processBatchWithWorker(
          worker,
          batch,
          finalConfig,
          (_, batchProgress) => {
            if (batchProgress) {
              progress.currentHost = batchProgress.currentIp;
              progress.scannedHosts += 1;
              
              // Calculate performance metrics
              const elapsed = (performance.now() - startTime) / 1000;
              progress.ipScansPerSecond = progress.scannedHosts / elapsed;
              
              if (responseTimes.length > 0) {
                progress.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
              }
              
              // Estimate time remaining
              const remainingHosts = progress.totalHosts - progress.scannedHosts;
              progress.estimatedTimeRemaining = Math.round(remainingHosts / Math.max(progress.ipScansPerSecond, 1));
              
              onProgress?.(progress);
            }
          },
          (_, batchResults) => {
            // Handle batch results - show immediately
            batchResults.forEach(result => {
              results.push(result);
              responseTimes.push(result.responseTime);
              
              // Keep response times manageable
              if (responseTimes.length > 500) {
                responseTimes = responseTimes.slice(-250);
              }
              
              progress.foundHosts++;
              onHostFound?.(result); // Immediate result display
            });
            
            progress.batchesCompleted++;
            activeBatches.delete(currentBatchId);
            progress.workersActive = activeBatches.size;
            
            onProgress?.(progress);
          },
          abortController.signal
        ).finally(() => {
          activeBatches.delete(currentBatchId);
          workerPromises.delete(currentBatchId);
          progress.workersActive = activeBatches.size;
        });
        
        workerPromises.set(currentBatchId, batchPromise);
      }
      
      progress.rangesCompleted++;
    }
    
    // Wait for all remaining batches to complete
    await Promise.allSettled(Array.from(workerPromises.values()));
    
    const endTime = performance.now();
    const scanDuration = (endTime - startTime) / 1000;
    
    console.log(`⚡ Ultra-fast scan completed: ${results.length} devices found in ${scanDuration.toFixed(2)}s`);
    
    const finalResult: FastScanResult = {
      results,
      totalScanned: progress.scannedHosts,
      totalFound: results.length,
      scanDuration,
      averageResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0,
      scansPerSecond: progress.scannedHosts / scanDuration,
    };
    
    return finalResult;
    
  } finally {
    // Cleanup
    terminateWorkerPool(workers);
    activeFastScan = null;
  }
};