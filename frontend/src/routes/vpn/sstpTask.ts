import {
  fetchSstpServerTaskStatus,
  type SstpServerTaskStatus,
  type VPNCredentials,
} from '../../api';

const POLL_INTERVAL_MS = 1000;

export interface SstpTaskPoll {
  done: Promise<SstpServerTaskStatus>;
  cancel: () => void;
}

export function pollSstpServerTask(
  creds: VPNCredentials,
  taskId: string,
  onProgress?: (status: SstpServerTaskStatus) => void,
): SstpTaskPoll {
  let timeoutId: number | null = null;
  let cancelled = false;

  const done = new Promise<SstpServerTaskStatus>((resolve, reject) => {
    const tick = async () => {
      timeoutId = null;
      if (cancelled) return;
      try {
        const status = await fetchSstpServerTaskStatus(creds, taskId);
        if (cancelled) return;
        onProgress?.(status);
        if (status.status === 'running') {
          timeoutId = window.setTimeout(() => {
            tick().catch(reject);
          }, POLL_INTERVAL_MS);
          return;
        }
        resolve(status);
      } catch (err) {
        reject(err);
      }
    };
    tick().catch(reject);
  });

  return {
    done,
    cancel: () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    },
  };
}
