/**
 * CHR Docker Test Utilities
 *
 * This module provides utilities for managing the CHR Docker container
 * during integration tests.
 *
 * Testing Tiers (per ADR-015):
 * - Tier 2: CHR Docker - Real RouterOS behavior in CI
 *
 * Environment Variables:
 * - CHR_ROUTER_URL: CHR container URL (default: http://localhost:8080)
 * - CHR_API_PORT: RouterOS API port (default: 8728)
 * - CHR_SSH_PORT: SSH port (default: 2222)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * CHR Container configuration
 */
export interface CHRConfig {
  host: string;
  apiPort: number;
  sshPort: number;
  httpPort: number;
  username: string;
  password: string;
}

/**
 * Default CHR configuration for testing
 */
export const defaultCHRConfig: CHRConfig = {
  host: process.env['CHR_HOST'] || 'localhost',
  apiPort: parseInt(process.env['CHR_API_PORT'] || '8728', 10),
  sshPort: parseInt(process.env['CHR_SSH_PORT'] || '2222', 10),
  httpPort: parseInt(process.env['CHR_HTTP_PORT'] || '8080', 10),
  username: 'admin',
  password: 'testpassword',
};

/**
 * Start the CHR Docker container
 */
export async function startCHR(): Promise<void> {
  try {
    await execAsync(
      'docker-compose -f docker-compose.test.yml up -d',
      { cwd: process.cwd() }
    );
    // Wait for container to be healthy
    await waitForCHR();
  } catch (error) {
    console.error('Failed to start CHR container:', error);
    throw error;
  }
}

/**
 * Stop the CHR Docker container
 */
export async function stopCHR(): Promise<void> {
  try {
    await execAsync(
      'docker-compose -f docker-compose.test.yml down',
      { cwd: process.cwd() }
    );
  } catch (error) {
    console.error('Failed to stop CHR container:', error);
    throw error;
  }
}

/**
 * Reset CHR to initial state (recreate container)
 */
export async function resetCHR(): Promise<void> {
  await stopCHR();
  await startCHR();
}

/**
 * Wait for CHR container to be ready
 */
export async function waitForCHR(
  timeoutMs: number = 60000,
  checkIntervalMs: number = 2000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const isReady = await isCHRReady();
    if (isReady) {
      return true;
    }
    await sleep(checkIntervalMs);
  }

  throw new Error(`CHR container not ready after ${timeoutMs}ms`);
}

/**
 * Check if CHR container is ready
 */
export async function isCHRReady(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      'docker-compose -f docker-compose.test.yml ps -q chr-test'
    );
    if (!stdout.trim()) {
      return false;
    }

    // Check health status
    const { stdout: health } = await execAsync(
      `docker inspect --format='{{.State.Health.Status}}' nasnet-chr-test`
    );
    return health.trim() === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Get CHR container logs
 */
export async function getCHRLogs(): Promise<string> {
  try {
    const { stdout } = await execAsync(
      'docker-compose -f docker-compose.test.yml logs chr-test'
    );
    return stdout;
  } catch (error) {
    console.error('Failed to get CHR logs:', error);
    return '';
  }
}

/**
 * Get CHR container IP address
 */
export async function getCHRIP(): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' nasnet-chr-test`
    );
    return stdout.trim();
  } catch {
    return defaultCHRConfig.host;
  }
}

/**
 * Helper function to sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create CHR API URL
 */
export function getCHRApiUrl(config: CHRConfig = defaultCHRConfig): string {
  return `http://${config.host}:${config.httpPort}`;
}

/**
 * Vitest setup hook for CHR tests
 * Use this in your test file's beforeAll/afterAll hooks
 */
export const chrTestHooks = {
  async beforeAll(): Promise<void> {
    if (process.env['SKIP_CHR_TESTS']) {
      console.log('Skipping CHR tests (SKIP_CHR_TESTS=true)');
      return;
    }
    await startCHR();
  },

  async afterAll(): Promise<void> {
    if (process.env['SKIP_CHR_TESTS']) {
      return;
    }
    // Optionally stop CHR after tests
    // await stopCHR();
  },

  async beforeEach(): Promise<void> {
    // Reset any test-specific state if needed
  },
};
