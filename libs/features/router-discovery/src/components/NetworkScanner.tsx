/**
 * Network Scanner Component
 * Auto-discovers MikroTik routers on the network (Story 0-1-1)
 */

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@nasnet/ui/primitives';
import type { ScanResult, ScanProgress } from '@nasnet/core/types';
import {
  startNetworkScan,
  validateSubnet,
  getDefaultSubnet,
  ScanError,
} from '../services/scanService';

export interface NetworkScannerProps {
  /**
   * Callback when scan completes successfully
   */
  onScanComplete?: (results: ScanResult[]) => void;

  /**
   * Callback when user selects a discovered router
   */
  onRouterSelect?: (result: ScanResult) => void;

  /**
   * Default subnet to scan
   */
  defaultSubnet?: string;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * NetworkScanner Component
 *
 * @description Provides interface for discovering MikroTik routers on the network
 * through automated subnet scanning.
 *
 * Features:
 * - Subnet input with validation
 * - Real-time scan progress
 * - Results display with router information
 * - Error handling and retry capability
 *
 * @example
 * ```tsx
 * <NetworkScanner
 *   onScanComplete={(results) => console.log("Found:", results.length)}
 *   onRouterSelect={(router) => console.log("Selected:", router.ipAddress)}
 * />
 * ```
 */
export const NetworkScanner = memo(function NetworkScanner({
  onScanComplete,
  onRouterSelect,
  defaultSubnet,
  className,
}: NetworkScannerProps) {
  const [subnet, setSubnet] = useState(defaultSubnet || getDefaultSubnet());
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles scan initiation
   */
  const handleStartScan = useCallback(async () => {
    // Validate subnet format
    if (!validateSubnet(subnet)) {
      setError('Invalid subnet format. Use CIDR notation (e.g., 192.168.88.0/24)');
      return;
    }

    setError(null);
    setIsScanning(true);
    setScanResults([]);
    setScanProgress(null);

    try {
      const results = await startNetworkScan(subnet, (progress) => {
        setScanProgress(progress);
      });

      setScanResults(results);
      setIsScanning(false);
      onScanComplete?.(results);
    } catch (err) {
      setIsScanning(false);
      setScanProgress(null);

      if (err instanceof ScanError) {
        setError(getScanErrorMessage(err));
      } else {
        setError(err instanceof Error ? err.message : 'Unknown scan error');
      }
    }
  }, [subnet, onScanComplete]);

  /**
   * Handles router selection from results
   */
  const handleSelectRouter = useCallback(
    (result: ScanResult) => {
      onRouterSelect?.(result);
    },
    [onRouterSelect]
  );

  return (
    <div className={cn('space-y-component-lg', className)}>
      {/* Scan Input */}
      <div className="space-y-component-md">
        <div>
          <label
            htmlFor="subnet"
            className="text-foreground mb-component-sm block text-sm font-medium"
          >
            Network Subnet
          </label>
          <div className="gap-component-sm flex">
            <input
              id="subnet"
              type="text"
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
              disabled={isScanning}
              placeholder="192.168.88.0/24"
              className={cn(
                'px-component-sm py-component-sm focus-visible:ring-ring bg-card text-foreground flex-1 rounded-[var(--semantic-radius-button)] border font-mono shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50',
                'border-border'
              )}
              aria-describedby="subnet-help"
            />
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              aria-label={isScanning ? 'Scanning network' : 'Scan network'}
              className={cn(
                'px-component-md py-component-sm focus-visible:ring-ring min-h-[44px] rounded-[var(--semantic-radius-button)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {isScanning ? 'Scanning...' : 'Scan Network'}
            </button>
          </div>
          <p
            id="subnet-help"
            className="mt-component-sm text-muted-foreground text-sm"
          >
            Enter subnet in CIDR notation (e.g., 192.168.88.0/24)
          </p>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-component-md bg-error/10 border-error/20 rounded-md border"
            role="alert"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="text-error h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-error text-sm font-medium">Scan Failed</h3>
                <p className="text-error/80 mt-1 text-sm">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Progress */}
      <AnimatePresence>
        {isScanning && scanProgress && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-component-lg bg-muted border-border rounded-[var(--semantic-radius-card)] border"
            role="status"
            aria-label="Network scan in progress"
          >
            <div className="space-y-component-md">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-foreground text-lg font-semibold">
                  Scanning Network...
                </h3>
                <div className="gap-component-sm flex items-center">
                  <div
                    className="border-primary h-5 w-5 animate-spin rounded-full border-b-2"
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground text-sm font-medium">
                    {scanProgress.scannedHosts} / {scanProgress.totalHosts}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div
                className="bg-muted h-2 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-valuenow={Math.round(
                  (scanProgress.scannedHosts / scanProgress.totalHosts) * 100
                )}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <motion.div
                  className="bg-primary h-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(scanProgress.scannedHosts / scanProgress.totalHosts) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="gap-component-md grid grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Current IP:</span>
                  <p className="text-foreground font-mono">{scanProgress.currentIp}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Routers Found:</span>
                  <p className="text-foreground font-semibold">{scanProgress.foundRouters}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Results */}
      <AnimatePresence>
        {scanResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-component-md"
          >
            <h3 className="font-display text-foreground text-lg font-semibold">
              Found {scanResults.length} Router{scanResults.length !== 1 ? 's' : ''}
            </h3>
            <div
              className="gap-component-md grid"
              role="list"
              aria-label="Discovered routers"
            >
              {scanResults.map((result) => (
                <motion.button
                  key={result.ipAddress}
                  role="listitem"
                  onClick={() => handleSelectRouter(result)}
                  aria-label={`Select router ${result.ipAddress}${result.model ? `, model ${result.model}` : ''}`}
                  className="p-component-md bg-card border-border hover:border-primary focus-visible:ring-ring min-h-[44px] rounded-[var(--semantic-radius-card)] border text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-component-sm">
                      <p className="text-foreground font-mono font-semibold">{result.ipAddress}</p>
                      {result.model && (
                        <p className="text-muted-foreground text-sm">Model: {result.model}</p>
                      )}
                      {result.routerOsVersion && (
                        <p className="text-muted-foreground text-sm">
                          RouterOS: {result.routerOsVersion}
                        </p>
                      )}
                      {result.macAddress && (
                        <p className="text-muted-foreground font-mono text-xs">
                          MAC: {result.macAddress}
                        </p>
                      )}
                    </div>
                    <div className="gap-component-sm flex flex-col items-end">
                      {result.isReachable && (
                        <span className="px-component-sm py-component-sm bg-success/10 text-success inline-flex items-center rounded-full text-xs font-medium">
                          Online
                        </span>
                      )}
                      {result.responseTime !== undefined && (
                        <span className="text-muted-foreground text-xs">
                          {result.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results Message */}
      {!isScanning && scanResults.length === 0 && !error && scanProgress && (
        <div
          className="py-component-xl text-muted-foreground text-center"
          role="status"
        >
          <svg
            className="text-muted-foreground mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2">No routers found on the network</p>
          <p className="mt-1 text-sm">Try scanning a different subnet</p>
        </div>
      )}
    </div>
  );
});

NetworkScanner.displayName = 'NetworkScanner';

/**
 * Helper to get user-friendly error messages
 */
function getScanErrorMessage(error: ScanError): string {
  switch (error.code) {
    case 'SCAN_START_FAILED':
      return 'Failed to start network scan. Please check if the backend service is running.';
    case 'NETWORK_ERROR':
      return 'Network error occurred. Please check your connection and try again.';
    case 'TIMEOUT':
      return 'Scan timed out. The network may be too large or slow to scan.';
    case 'SCAN_FAILED':
      return 'Scan failed on the backend. Please try again or check backend logs.';
    default:
      return error.message || 'An unknown error occurred during scanning.';
  }
}
