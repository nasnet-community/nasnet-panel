/**
 * High-performance Web Worker for parallel network scanning
 * Handles batch processing of IP addresses with minimal overhead
 */

export interface WorkerScanRequest {
  readonly type: 'SCAN_BATCH';
  readonly batchId: number;
  readonly ips: readonly string[];
  readonly timeout: number;
  readonly testUrl: string; // e.g., '/rest' (no trailing slash)
  readonly username: string; // Basic auth username
  readonly password: string; // Basic auth password
  readonly authHeader?: string; // Pre-computed auth header (preferred)
}

export interface WorkerScanResponse {
  readonly type: 'SCAN_RESULT' | 'SCAN_ERROR' | 'SCAN_PROGRESS';
  readonly batchId: number;
  readonly results?: readonly ScanResult[];
  readonly error?: string;
  readonly progress?: {
    readonly scanned: number;
    readonly total: number;
    readonly currentIp: string;
  };
}

export interface ScanResult {
  readonly ip: string;
  readonly responseTime: number;
  readonly status: 'success' | 'timeout' | 'error';
  readonly protocol: 'http' | 'https';
  readonly isRestApi?: boolean; // Indicates if valid REST API was detected
  version?: string; // RouterOS version if detected
}

/** Maximum concurrent requests per worker - increased for ultra-fast scanning */
const MAX_CONCURRENT_PER_WORKER = 100;

/** Default timeout for individual requests - reduced for ultra-fast scanning */
const DEFAULT_TIMEOUT = 150;

/**
 * Tests a single IP address for MikroTik REST API availability
 * Ultra-fast version: HTTP only, with Basic Auth for proper detection
 */
const testSingleIp = async (
  ip: string, 
  testUrl: string, 
  timeout: number = DEFAULT_TIMEOUT,
  username: string = 'admin',
  password: string = '',
  authHeader?: string
): Promise<ScanResult> => {
  const startTime = performance.now();
  
  // Ultra-fast: HTTP only on initial scan (skip HTTPS for speed)
  const protocols: Array<'http' | 'https'> = ['http'];
  
  for (const protocol of protocols) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Build URL - ensure testUrl is '/rest' without trailing slash
      const cleanTestUrl = testUrl.endsWith('/') ? testUrl.slice(0, -1) : testUrl;
      const url = `${protocol}://${ip}${cleanTestUrl}/system/resource`;
      
      // Use pre-computed auth header or create Basic Auth header
      const basicAuth = authHeader || `Basic ${btoa(`${username}:${password}`)}`;
      
      // Use backend proxy for RouterOS REST API calls
      const proxyUrl = 'http://localhost:8080/api/router/proxy';
      const proxyRequest = {
        router_ip: ip,
        endpoint: '/rest/system/resource',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': basicAuth,
          'Content-Type': 'application/json',
        }
      };
      
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proxyRequest),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = performance.now() - startTime;
      
      // Handle proxy response
      if (response.ok) {
        let isRestApi = false;
        let version: string | undefined;
        
        try {
          const proxyResponse = await response.json();
          
          // Check RouterOS response status from proxy
          if (proxyResponse.status === 401) {
            // 401 indicates REST API is present but auth failed
            isRestApi = true;
          } else if (proxyResponse.status >= 200 && proxyResponse.status < 300) {
            // Try to validate JSON response and extract version
            const data = proxyResponse.body;
            if (typeof data === 'object' && data !== null) {
              isRestApi = true;
              // Try to extract version
              version = data?.version || data?.['version-string'] || undefined;
            }
          }
        } catch {
          // JSON parsing failed, but we still got a proxy response
        }
        
        const result: ScanResult = {
          ip,
          responseTime,
          status: 'success',
          protocol,
          isRestApi,
        };
        
        if (version) {
          result.version = version;
        }
        
        return result;
      }
    } catch (error) {
      // Continue to next protocol on failure
      if (error instanceof Error && error.name === 'AbortError') {
        // Timeout occurred, try next protocol
        continue;
      }
    }
  }
  
  // All protocols failed
  const responseTime = performance.now() - startTime;
  return {
    ip,
    responseTime,
    status: responseTime >= timeout ? 'timeout' : 'error',
    protocol: 'http',
    isRestApi: false,
  };
};

/**
 * Processes a batch of IPs with controlled concurrency
 * @deprecated - Use processOptimizedBatch instead
 */
/*
const processBatch = async (
  ips: readonly string[],
  testUrl: string,
  timeout: number,
  _batchId: number,
  onProgress: (progress: WorkerScanResponse['progress']) => void
): Promise<readonly ScanResult[]> => {
  const results: ScanResult[] = [];
  const chunks: string[][] = [];
  
  // Split IPs into chunks for controlled concurrency
  for (let i = 0; i < ips.length; i += MAX_CONCURRENT_PER_WORKER) {
    chunks.push(ips.slice(i, i + MAX_CONCURRENT_PER_WORKER));
  }
  
  let scanned = 0;
  
  // Process chunks sequentially, IPs within chunk in parallel
  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (ip) => {
      const result = await testSingleIp(ip, testUrl, timeout, username, password);
      
      scanned++;
      onProgress({
        scanned,
        total: ips.length,
        currentIp: ip,
      });
      
      return result;
    });
    
    const chunkResults = await Promise.allSettled(chunkPromises);
    
    // Extract successful results
    chunkResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        // Only include successful scans (actual responses)
        if (result.value.status === 'success') {
          results.push(result.value);
        }
      }
    });
  }
  
  return results;
};
*/


/**
 * Ultra-optimized batch processing with intelligent chunking and early termination
 */
const processOptimizedBatch = async (
  ips: readonly string[],
  testUrl: string,
  timeout: number,
  _batchId: number,
  onProgress: (progress: WorkerScanResponse['progress']) => void,
  username: string = 'admin',
  password: string = '',
  authHeader?: string
): Promise<readonly ScanResult[]> => {
  const results: ScanResult[] = [];
  const totalIps = ips.length;
  
  // Ultra-fast: Aggressive concurrency for maximum speed
  const optimalConcurrency = Math.min(MAX_CONCURRENT_PER_WORKER, totalIps);
  
  let processed = 0;
  let consecutiveTimeouts = 0;
  const MAX_CONSECUTIVE_TIMEOUTS = 10; // Stop scanning subnet after 10 consecutive timeouts
  
  // Process in optimal chunks
  for (let i = 0; i < totalIps; i += optimalConcurrency) {
    // Early termination: if we hit too many consecutive timeouts, skip rest of subnet
    if (consecutiveTimeouts >= MAX_CONSECUTIVE_TIMEOUTS) {
      console.log(`Skipping remaining IPs in batch - too many consecutive timeouts (${consecutiveTimeouts})`);
      break;
    }
    
    const chunk = ips.slice(i, i + optimalConcurrency);
    
    const chunkPromises = chunk.map(async (ip) => {
      try {
        // Ultra-fast: No retry logic for maximum speed
        const result = await testSingleIp(ip, testUrl, timeout, username, password, authHeader);
        
        processed++;
        
        // Report progress more frequently for better UX
        if (processed % 5 === 0 || processed === totalIps) {
          onProgress({
            scanned: processed,
            total: totalIps,
            currentIp: ip,
          });
        }
        
        return result;
      } catch (error) {
        processed++;
        return {
          ip,
          responseTime: timeout,
          status: 'error' as const,
          protocol: 'http' as const,
        };
      }
    });
    
    const chunkResults = await Promise.allSettled(chunkPromises);
    
    // Track consecutive timeouts for early termination
    let chunkTimeouts = 0;
    let chunkSuccesses = 0;
    
    // Collect results and track patterns
    chunkResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.status === 'timeout') {
          chunkTimeouts++;
        } else if (result.value.status === 'success') {
          chunkSuccesses++;
          // Reset consecutive timeout counter on success
          consecutiveTimeouts = 0;
          
          // Only include devices with REST API
          if (result.value.isRestApi) {
            results.push(result.value);
          }
        }
      }
    });
    
    // Update consecutive timeout tracking
    if (chunkSuccesses === 0 && chunkTimeouts > 0) {
      consecutiveTimeouts += chunkTimeouts;
    } else {
      consecutiveTimeouts = 0; // Reset on any success
    }
  }
  
  return results;
};

// Web Worker message handler
self.addEventListener('message', async (event: MessageEvent<WorkerScanRequest>) => {
  const { data } = event;
  
  if (data.type !== 'SCAN_BATCH') {
    return;
  }
  
  const { batchId, ips, timeout, testUrl, username, password, authHeader } = data;
  
  try {
    // Send initial progress
    const progressResponse: WorkerScanResponse = {
      type: 'SCAN_PROGRESS',
      batchId,
      progress: {
        scanned: 0,
        total: ips.length,
        currentIp: ips[0] || '',
      },
    };
    
    self.postMessage(progressResponse);
    
    // Process the batch with progress updates
    const results = await processOptimizedBatch(
      ips,
      testUrl,
      timeout,
      batchId,
      (progress) => {
        if (progress) {
          const progressUpdate: WorkerScanResponse = {
            type: 'SCAN_PROGRESS',
            batchId,
            progress,
          };
          self.postMessage(progressUpdate);
        }
      },
      username,
      password,
      authHeader
    );
    
    // Send final results
    const resultResponse: WorkerScanResponse = {
      type: 'SCAN_RESULT',
      batchId,
      results,
    };
    
    self.postMessage(resultResponse);
    
  } catch (error) {
    const errorResponse: WorkerScanResponse = {
      type: 'SCAN_ERROR',
      batchId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    self.postMessage(errorResponse);
  }
});

// Handle worker initialization
self.addEventListener('message', (event) => {
  if (event.data.type === 'INIT') {
    self.postMessage({ type: 'READY' });
  }
});

