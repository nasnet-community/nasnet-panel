import type { DiscoveredDevice } from '../mocks/types';

export interface ScanStartResponse {
  task_id: string;
  status: string;
}

export interface ScanStatusData {
  taskId: string;
  subnet: string;
  status: 'running' | 'completed' | 'canceled' | 'error';
  progress: number;
  startTime: number;
  results: DiscoveredDevice[];
}

export interface RouterOSVerifyInfo {
  version?: string;
  architecture?: string;
  boardName?: string;
  confidence: number;
}

export interface VerifyResponse {
  ip: string;
  hostname?: string;
  isOnline: boolean;
  isMikroTik: boolean;
  ports?: number[];
  services?: string[];
  routerOs?: RouterOSVerifyInfo;
}

export interface RouterSystemInfo {
  model?: string;
  version?: string;
  cpuLoad?: number;
  uptime?: string;
  [key: string]: unknown;
}
