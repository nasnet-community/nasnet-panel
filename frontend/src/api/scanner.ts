import { sleep } from './abort';
import { apiRequest } from './http';
import type { ScanProgressEvent } from '../mocks/types';
import type {
  RouterSystemInfo,
  ScanStartResponse,
  ScanStatusData,
  VerifyResponse,
} from './scanner.types';

export type {
  RouterOSVerifyInfo,
  RouterSystemInfo,
  ScanStatusData,
  VerifyResponse,
} from './scanner.types';

const POLL_INTERVAL_MS = 500;

async function startScanTask(subnet: string, signal?: AbortSignal): Promise<string> {
  const res = await apiRequest<ScanStartResponse>('/api/scan', {
    method: 'POST',
    body: JSON.stringify({ subnet }),
    signal,
  });
  return res.task_id;
}

async function getScanStatus(taskId: string, signal?: AbortSignal): Promise<ScanStatusData> {
  return apiRequest<ScanStatusData>(`/api/scan/status?task_id=${encodeURIComponent(taskId)}`, {
    method: 'GET',
    signal,
  });
}

async function stopScanTask(taskId: string): Promise<void> {
  try {
    await apiRequest(`/api/scan/stop?task_id=${encodeURIComponent(taskId)}`, {
      method: 'POST',
    });
  } catch {
    // best-effort cancellation
  }
}

export async function verifyIP(ip: string, signal?: AbortSignal): Promise<VerifyResponse> {
  return apiRequest<VerifyResponse>('/api/scan/verify', {
    method: 'POST',
    body: JSON.stringify({ ip }),
    signal,
  });
}

export async function testCredentials(
  host: string,
  username: string,
  password: string,
  signal?: AbortSignal,
): Promise<RouterSystemInfo> {
  const token = btoa(`${username}:${password}`);
  return apiRequest<RouterSystemInfo>('/api/system/info', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${token}`,
      'X-RouterOS-Host': host,
    },
    signal,
  });
}

/**
 * Async generator yielding live progress for a subnet scan.
 * POSTs /api/scan, polls /api/scan/status until the task exits "running".
 * On early break or signal abort, /api/scan/stop is called.
 */
export async function* scanSubnet(
  subnet: string,
  signal?: AbortSignal,
): AsyncGenerator<ScanProgressEvent, void, void> {
  const taskId = await startScanTask(subnet, signal);
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const status = await getScanStatus(taskId, signal);
      const done = status.status !== 'running';
      yield {
        taskId,
        percent: status.progress,
        found: status.results ?? [],
        done,
      };
      if (status.status === 'error') {
        throw new Error(`Scan failed for ${subnet}`);
      }
      if (done) return;
      await sleep(POLL_INTERVAL_MS, signal);
    }
  } finally {
    if (signal?.aborted) {
      await stopScanTask(taskId);
    }
  }
}

export const scanner = {
  start: scanSubnet,
  verify: verifyIP,
  stop: stopScanTask,
};
